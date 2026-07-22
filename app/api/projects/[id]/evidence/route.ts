import { prisma } from "@/lib/prisma";
import { evidenceService } from "@/services/evidence/evidence-service";
import { saveEvidence } from "@/services/evidence/evidence-store";
import { authErrorResponse } from "@/lib/auth";
import { isBenchmarkProject,readOnlyResponse } from "@/lib/demo-mode";
import { requireOwnedProject } from "@/lib/project-access";
import { acquireGenerationLock } from "@/lib/generation-lock";

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(isBenchmarkProject(id))return Response.json([]);
 try{const {userId,project}=await requireOwnedProject(request,id);if(!project)return Response.json({error:"项目不存在或无权访问。"},{status:404});const items=await prisma.source.findMany({where:{projectId:id,project:{ownerId:userId}},include:{_count:{select:{research:true}}},orderBy:[{qualityGrade:"asc"},{publishedAt:"desc"}]});return Response.json(items);}
 catch(error){return authErrorResponse(error)||Response.json({error:"资料加载失败。"},{status:500});}
}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(isBenchmarkProject(id))return readOnlyResponse();
 const release=acquireGenerationLock(`evidence:${id}`);if(!release)return Response.json({error:"该项目正在读取网页，请勿重复提交。"},{status:409});
 try{const {project}=await requireOwnedProject(request,id);if(!project)return Response.json({error:"项目不存在或无权访问。"},{status:404});
  const count=await prisma.source.count({where:{projectId:id}});if(count>=8)return Response.json({error:"单个项目最多添加 8 个 Evidence URL。"},{status:429});
  let body:{url?:unknown};try{body=await request.json();}catch{return Response.json({error:"请求内容不是有效 JSON。"},{status:400});}
  const url=typeof body.url==="string"?body.url.trim():"";if(!url)return Response.json({error:"请输入公开网页 URL。"},{status:400});
  let parsed:URL;try{parsed=new URL(url);}catch{return Response.json({error:"URL 格式无效。"},{status:400});}
  if(!["http:","https:"].includes(parsed.protocol))return Response.json({error:"仅支持 HTTP 或 HTTPS URL。"},{status:400});
  const evidence=await evidenceService.ingest(project,url);await saveEvidence(id,[evidence],8);return Response.json({count:1,evidence:{id:evidence.sourceId,title:evidence.title,url:evidence.url}},{status:201});
 }catch(error){return authErrorResponse(error)||Response.json({error:error instanceof Error?error.message:"网页资料读取失败。"},{status:500});}finally{release();}
}
