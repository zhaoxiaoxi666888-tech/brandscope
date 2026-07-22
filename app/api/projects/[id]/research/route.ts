import { prisma } from "@/lib/prisma";
import { researchService } from "@/services/ai/services/research-service";
import { captureAiMetrics } from "@/services/ai/metrics";
import type { SourceOutput } from "@/services/ai/types";
import { authErrorResponse } from "@/lib/auth";
import { isBenchmarkProject,readOnlyResponse } from "@/lib/demo-mode";
import { requireOwnedProject } from "@/lib/project-access";
import { completeGeneration,reserveGeneration } from "@/lib/usage-limits";
import { safeErrorMessage } from "@/lib/safe-error";
import { sanitizeUserText } from "@/lib/project-input";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
 const {id}=await params;if(isBenchmarkProject(id))return readOnlyResponse();let run:{id:string}|undefined;
 try {const {userId,project}=await requireOwnedProject(request,id);if(!project)return Response.json({error:"项目不存在或无权访问。"},{status:404});
  const stored=await prisma.source.findMany({where:{projectId:id,enabled:true,extractionStatus:"SUCCESS"},orderBy:{createdAt:"asc"},take:8});
  if(!stored.length)return Response.json({error:"请先添加至少 1 个可读取的 Evidence URL。"},{status:422});
  run=await reserveGeneration(id,userId,"RESEARCH");
  const evidence:SourceOutput[]=stored.map(item=>({sourceId:item.id,title:item.title,url:item.url,publisher:item.publisher,publishedAt:item.publishedAt?.toISOString()||null,summary:item.summary,content:item.content.slice(0,12000),retrievedAt:item.retrievedAt.toISOString(),sourceType:item.sourceType as SourceOutput["sourceType"],qualityGrade:item.qualityGrade as SourceOutput["qualityGrade"],extractionStatus:"SUCCESS"}));
  const captured=await captureAiMetrics(()=>researchService.generate(project,evidence));const output=captured.value;
  await prisma.$transaction(async tx=>{await tx.research.deleteMany({where:{projectId:id}});await tx.insight.deleteMany({where:{projectId:id}});await tx.brief.deleteMany({where:{projectId:id}});for(const [position,item] of output.entries())await tx.research.create({data:{projectId:id,module:item.module,title:sanitizeUserText(item.title),summary:sanitizeUserText(item.summary),keyFacts:sanitizeUserText(item.keyFacts||""),marketSignals:sanitizeUserText(item.marketSignals||""),inference:sanitizeUserText(item.inference),marketingMeaning:sanitizeUserText(item.marketingMeaning||""),limitations:sanitizeUserText(item.limitations||""),position,sources:{connect:item.sources.map(source=>({id:source.sourceId!}))}}});await tx.project.update({where:{id},data:{status:"READY"}});});
  await completeGeneration(run.id,captured.metrics);return Response.json({ok:true,evidenceCount:evidence.length});
 }catch(error){const auth=authErrorResponse(error);if(auth)return auth;const message=safeErrorMessage(error,"研究生成失败，请重试。");if(run)await completeGeneration(run.id,{},message).catch(()=>{});return Response.json({error:message},{status:message.includes("只能生成")||message.includes("额度")?429:500});}
}
