import { prisma } from "@/lib/prisma";
import { validateProjectInput } from "@/lib/project-input";
import { demoProjectDetail, isPublicDemo, readOnlyResponse } from "@/lib/demo-mode";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if(isPublicDemo()){const project=demoProjectDetail(id);return project?Response.json(project):Response.json({error:"项目不存在。"},{status:404});}
  const project=await prisma.project.findUnique({where:{id},include:{sources:{include:{_count:{select:{research:true}}},orderBy:[{qualityGrade:"asc"},{publishedAt:"desc"}]},research:{orderBy:{position:"asc"},include:{sources:true}},insights:{orderBy:{position:"asc"}},brief:true}});
  if(!project)return Response.json({error:"项目不存在。"},{status:404});
  return Response.json(project);
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) {
  if(isPublicDemo())return readOnlyResponse();
  try {
    const {id}=await params; const body=await request.json();
    const fields=["name","brandName","category","targetMarket","competitors","researchObjective"] as const;
    const validationError=validateProjectInput(body);if(validationError)return Response.json({error:validationError},{status:400});
    const data=Object.fromEntries(fields.map(field=>[field,String(body[field]||"").trim()]));
    const project=await prisma.$transaction(async tx=>{
      const updated=await tx.project.update({where:{id},data:{...data,status:"DRAFT"}});
      await tx.research.deleteMany({where:{projectId:id}});
      await tx.insight.deleteMany({where:{projectId:id}});
      await tx.brief.deleteMany({where:{projectId:id}});
      return updated;
    });
    return Response.json(project);
  }
  catch { return Response.json({error:"更新项目失败。"},{status:400}); }
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}) {
  if(isPublicDemo())return readOnlyResponse();
  try { const {id}=await params; await prisma.project.delete({where:{id}}); return new Response(null,{status:204}); }
  catch { return Response.json({error:"删除项目失败。"},{status:400}); }
}
