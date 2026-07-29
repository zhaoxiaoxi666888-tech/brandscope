import { sanitizeUserText,validateProjectInput } from "@/lib/project-input";
import { authErrorResponse } from "@/lib/auth";
import { demoProjectDetail,isBenchmarkProject,readOnlyResponse } from "@/lib/demo-mode";

const include={sources:{include:{_count:{select:{research:true}}},orderBy:[{qualityGrade:"asc" as const},{publishedAt:"desc" as const}]},research:{orderBy:{position:"asc" as const},include:{sources:true}},insights:{orderBy:{position:"asc" as const}},brief:true};

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;if(isBenchmarkProject(id)){const project=demoProjectDetail(id);return project?Response.json(project):Response.json({error:"项目不存在。"},{status:404});}
  try{const [{requireOwnedProject},{prisma}]=await Promise.all([import("@/lib/project-access"),import("@/lib/prisma")]);const {userId}=await requireOwnedProject(request,id);const project=await prisma.project.findFirst({where:{id,ownerId:userId},include});if(!project)return Response.json({error:"项目不存在或无权访问。"},{status:404});return Response.json({...project,readOnly:false});}
  catch(error){return authErrorResponse(error)||Response.json({error:"项目加载失败。"},{status:500});}
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;if(isBenchmarkProject(id))return readOnlyResponse();
  try {const [{requireOwnedProject},{prisma}]=await Promise.all([import("@/lib/project-access"),import("@/lib/prisma")]);const {userId,project}=await requireOwnedProject(request,id);if(!project)return Response.json({error:"项目不存在或无权访问。"},{status:404});
    const body=await request.json();const fields=["name","brandName","category","targetMarket","competitors","researchObjective"] as const;const validationError=validateProjectInput(body);if(validationError)return Response.json({error:validationError},{status:400});
    const data=Object.fromEntries(fields.map(field=>[field,sanitizeUserText(String(body[field]||""))]));
    const updated=await prisma.$transaction(async tx=>{const value=await tx.project.update({where:{id,ownerId:userId},data:{...data,status:"DRAFT"}});await tx.research.deleteMany({where:{projectId:id}});await tx.insight.deleteMany({where:{projectId:id}});await tx.brief.deleteMany({where:{projectId:id}});return value;});return Response.json(updated);
  }catch(error){return authErrorResponse(error)||Response.json({error:"更新项目失败。"},{status:400});}
}

export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;if(isBenchmarkProject(id))return readOnlyResponse();
  try {const [{requireOwnedProject},{prisma}]=await Promise.all([import("@/lib/project-access"),import("@/lib/prisma")]);const {userId,project}=await requireOwnedProject(request,id);if(!project)return Response.json({error:"项目不存在或无权访问。"},{status:404});await prisma.project.delete({where:{id,ownerId:userId}});return new Response(null,{status:204});}
  catch(error){return authErrorResponse(error)||Response.json({error:"删除项目失败。"},{status:400});}
}
