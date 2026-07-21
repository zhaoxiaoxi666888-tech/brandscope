import { prisma } from "@/lib/prisma";
import { evidenceService } from "@/services/evidence/evidence-service";
import { saveEvidence } from "@/services/evidence/evidence-store";
import { isPublicDemo, readOnlyResponse } from "@/lib/demo-mode";
import { acquireGenerationLock } from "@/lib/generation-lock";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const items=await prisma.source.findMany({where:{projectId:id},include:{_count:{select:{research:true}}},orderBy:[{qualityGrade:"asc"},{publishedAt:"desc"}]});return Response.json(items);
}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(isPublicDemo())return readOnlyResponse();
 const {id}=await params;const release=acquireGenerationLock(`evidence:${id}`);if(!release)return Response.json({error:"该项目正在收集公开资料，请勿重复提交。"},{status:409});
 try{
  const project=await prisma.project.findUnique({where:{id}});if(!project)return Response.json({error:"项目不存在。"},{status:404});
  const raw=await request.text();let url="";
  if(raw){try{const body=JSON.parse(raw) as {url?:unknown};url=typeof body.url==="string"?body.url.trim():"";}catch{return Response.json({error:"请求内容不是有效 JSON。"},{status:400});}}
  const evidence=url?[await evidenceService.ingest(project,url)]:await evidenceService.collect(project);
  await saveEvidence(id,evidence);
  return Response.json({count:evidence.length,evidence:evidence.map(item=>({id:item.sourceId,title:item.title,url:item.url}))});
 }catch(error){return Response.json({error:error instanceof Error?error.message:"公开资料收集失败。"},{status:500});}finally{release();}
}
