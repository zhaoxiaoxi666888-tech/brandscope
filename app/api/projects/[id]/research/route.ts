import { prisma } from "@/lib/prisma";
import { researchService } from "@/services/ai/services/research-service";
import { insightService } from "@/services/ai/services/insight-service";
import { acquireGenerationLock } from "@/lib/generation-lock";
import type { SourceOutput } from "@/services/ai/types";
import { evidenceService } from "@/services/evidence/evidence-service";
import { saveEvidence } from "@/services/evidence/evidence-store";
import { isPublicDemo, readOnlyResponse } from "@/lib/demo-mode";

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}) {
 if(isPublicDemo())return readOnlyResponse();
 try {
  const {id}=await params;const release=acquireGenerationLock(`research:${id}`);if(!release)return Response.json({error:"该项目正在收集资料或生成研究，请勿重复提交。"},{status:409});
  try{
   const project=await prisma.project.findUnique({where:{id}});if(!project)return Response.json({error:"项目不存在。"},{status:404});
   const discovered=await evidenceService.collect(project);await saveEvidence(id,discovered);
   const usable:SourceOutput[]=discovered.filter(item=>item.extractionStatus==="SUCCESS"&&Boolean(item.content)).slice(0,15);
   if(usable.length<3)return Response.json({error:"自动资料发现没有获得至少 3 条可用网页正文，请稍后重试或检查搜索 Provider。"},{status:422});
   const analysisEvidence=usable.slice(0,8).map(item=>({...item,content:(item.content||"").slice(0,4000)}));
   const output=await researchService.generate(project,analysisEvidence);
   const insights=await insightService.generate(project,output);
   await prisma.$transaction(async tx=>{
    await tx.research.deleteMany({where:{projectId:id}});await tx.insight.deleteMany({where:{projectId:id}});await tx.brief.deleteMany({where:{projectId:id}});
    for(const [position,item] of output.entries())await tx.research.create({data:{projectId:id,module:item.module,title:item.title,summary:item.summary,keyFacts:item.keyFacts||"",marketSignals:item.marketSignals||"",inference:item.inference,marketingMeaning:item.marketingMeaning||"",limitations:item.limitations||"",position,sources:{connect:item.sources.map(source=>({id:source.sourceId!}))}}});
    for(const [position,item] of insights.entries())await tx.insight.create({data:{projectId:id,position,type:item.type,content:item.content,status:item.status,evidence:item.evidence||"",researchModules:JSON.stringify(item.researchModules||[]),isInference:true}});
    await tx.project.update({where:{id},data:{status:"READY"}});
   });
   return Response.json({ok:true,evidenceCount:usable.length,analyzedEvidenceCount:analysisEvidence.length,urls:usable.map(item=>item.url)});
  }finally{release();}
 }catch(error){return Response.json({error:error instanceof Error?error.message:"研究生成失败，请重试。"},{status:500});}
}
