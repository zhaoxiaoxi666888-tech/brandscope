import { prisma } from "@/lib/prisma";
import { insightService } from "@/services/ai/services/insight-service";
import { captureAiMetrics } from "@/services/ai/metrics";
import type { ResearchOutput,SourceOutput } from "@/services/ai/types";
import { authErrorResponse } from "@/lib/auth";
import { isBenchmarkProject,readOnlyResponse } from "@/lib/demo-mode";
import { requireOwnedProject } from "@/lib/project-access";
import { completeGeneration,reserveGeneration } from "@/lib/usage-limits";
import { safeErrorMessage } from "@/lib/safe-error";
import { sanitizeUserText } from "@/lib/project-input";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(isBenchmarkProject(id))return readOnlyResponse();let run:{id:string}|undefined;
 try{const {userId,project}=await requireOwnedProject(request,id);if(!project)return Response.json({error:"项目不存在或无权访问。"},{status:404});
  const research=await prisma.research.findMany({where:{projectId:id},include:{sources:true},orderBy:{position:"asc"}});if(research.length!==6)return Response.json({error:"请先完成六个品牌研究模块。"},{status:422});
  run=await reserveGeneration(id,userId,"INSIGHTS");
  const input:ResearchOutput[]=research.map(item=>({module:item.module,title:item.title,summary:item.summary,keyFacts:item.keyFacts,marketSignals:item.marketSignals,inference:item.inference,marketingMeaning:item.marketingMeaning,limitations:item.limitations,sources:item.sources.map(source=>({sourceId:source.id,title:source.title,url:source.url,publisher:source.publisher,publishedAt:source.publishedAt?.toISOString()||null,summary:source.summary,retrievedAt:source.retrievedAt.toISOString(),sourceType:source.sourceType as SourceOutput["sourceType"]}))}));
  const captured=await captureAiMetrics(()=>insightService.generate(project,input));await prisma.$transaction(async tx=>{await tx.insight.deleteMany({where:{projectId:id}});await tx.brief.deleteMany({where:{projectId:id}});for(const [position,item] of captured.value.entries())await tx.insight.create({data:{projectId:id,position,type:item.type,content:sanitizeUserText(item.content),status:item.status,evidence:sanitizeUserText(item.evidence||""),researchModules:JSON.stringify(item.researchModules||[]),isInference:true}});await tx.project.update({where:{id},data:{status:"INSIGHTS"}});});
  await completeGeneration(run.id,captured.metrics);return Response.json({ok:true,count:captured.value.length});
 }catch(error){const auth=authErrorResponse(error);if(auth)return auth;const message=safeErrorMessage(error,"核心洞察生成失败，请重试。");if(run)await completeGeneration(run.id,{},message).catch(()=>{});return Response.json({error:message},{status:message.includes("只能生成")||message.includes("额度")?429:500});}
}
