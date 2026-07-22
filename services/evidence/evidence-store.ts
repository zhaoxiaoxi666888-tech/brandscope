import { prisma } from "@/lib/prisma";
import type { SourceOutput } from "@/services/ai/types";

const validDate=(value:string|null)=>value&&!Number.isNaN(Date.parse(value))?new Date(value):null;

export async function saveEvidence(projectId:string,evidence:SourceOutput[],maxCount?:number){
 await prisma.$transaction(async tx=>{
  if(maxCount){
   await tx.$queryRawUnsafe('SELECT "id" FROM "Project" WHERE "id" = $1 FOR UPDATE',projectId);
   const existingCount=await tx.source.count({where:{projectId}});
   const newFingerprints=evidence.filter(source=>source.sourceId).map(source=>source.sourceId!);
   const alreadyStored=await tx.source.count({where:{projectId,id:{in:newFingerprints}}});
   if(existingCount+newFingerprints.length-alreadyStored>maxCount)throw new Error(`单个项目最多添加 ${maxCount} 个 Evidence URL。`);
  }
  for(const source of evidence){
   const sourceId=source.sourceId!;const existing=await tx.source.findFirst({where:{projectId,url:source.url},include:{research:{select:{id:true}}}});const researchIds=existing?.research.map(item=>item.id)||[];
   if(existing&&existing.id!==sourceId)await tx.source.delete({where:{id:existing.id}});
   await tx.source.upsert({where:{id:sourceId},create:{id:sourceId,projectId,title:source.title,url:source.url,publisher:source.publisher,publishedAt:validDate(source.publishedAt),summary:source.summary,content:source.content||"",retrievedAt:validDate(source.retrievedAt)||new Date(),sourceType:source.sourceType,qualityGrade:source.qualityGrade||"D",enabled:source.extractionStatus==="SUCCESS",extractionStatus:source.extractionStatus||"FAILED",fingerprint:sourceId},update:{title:source.title,publisher:source.publisher,publishedAt:validDate(source.publishedAt),summary:source.summary,content:source.content||"",retrievedAt:new Date(),sourceType:source.sourceType,qualityGrade:source.qualityGrade||"D",enabled:source.extractionStatus==="SUCCESS",extractionStatus:source.extractionStatus||"FAILED"}});
   for(const research of researchIds)await tx.research.update({where:{id:research},data:{sources:{connect:{id:sourceId}}}});
  }
 });
}
