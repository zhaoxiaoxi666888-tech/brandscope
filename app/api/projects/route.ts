import { prisma } from "@/lib/prisma";
import { validateProjectInput } from "@/lib/project-input";
import { demoProjectList, isPublicDemo, readOnlyResponse } from "@/lib/demo-mode";

export async function GET() {
  if(isPublicDemo())return Response.json(demoProjectList());
  const projects=await prisma.project.findMany({orderBy:{updatedAt:"desc"},include:{_count:{select:{research:true,insights:true}},brief:{select:{id:true}}}});
  return Response.json(projects);
}

export async function POST(request:Request) {
  if(isPublicDemo())return readOnlyResponse();
  try {
    const body=await request.json();
    const validationError=validateProjectInput(body);if(validationError)return Response.json({error:validationError},{status:400});
    const project=await prisma.project.create({data:{name:body.name.trim(),brandName:body.brandName.trim(),category:body.category.trim(),targetMarket:body.targetMarket.trim(),competitors:String(body.competitors||"").trim(),researchObjective:body.researchObjective.trim()}});
    return Response.json(project,{status:201});
  } catch { return Response.json({error:"创建项目失败，请稍后重试。"},{status:500}); }
}
