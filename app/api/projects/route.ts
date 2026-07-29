import { sanitizeUserText,validateProjectInput } from "@/lib/project-input";
import { demoProjectList } from "@/lib/demo-mode";
import { authErrorResponse,requireUser } from "@/lib/auth";

export async function GET(request:Request) {
  const benchmarks=demoProjectList();
  if(!request.headers.get("authorization"))return Response.json(benchmarks);
  try{
    const {prisma}=await import("@/lib/prisma");
    const {userId}=await requireUser(request);
    const projects=await prisma.project.findMany({where:{ownerId:userId},orderBy:{updatedAt:"desc"},include:{_count:{select:{research:true,insights:true}},brief:{select:{id:true}}}});
    return Response.json([...projects.map(item=>({...item,readOnly:false})),...benchmarks]);
  }catch(error){return authErrorResponse(error)||Response.json({error:"项目列表加载失败。"},{status:500});}
}

export async function POST(request:Request) {
  try {
    const {createProjectWithinLimit}=await import("@/lib/usage-limits");
    const {userId}=await requireUser(request);
    const body=await request.json();const validationError=validateProjectInput(body);if(validationError)return Response.json({error:validationError},{status:400});
    const project=await createProjectWithinLimit({ownerId:userId,name:sanitizeUserText(body.name),brandName:sanitizeUserText(body.brandName),category:sanitizeUserText(body.category),targetMarket:sanitizeUserText(body.targetMarket),competitors:sanitizeUserText(String(body.competitors||"")),researchObjective:sanitizeUserText(body.researchObjective)});
    return Response.json(project,{status:201});
  } catch(error) {return authErrorResponse(error)||Response.json({error:error instanceof Error?error.message:"创建项目失败，请稍后重试。"},{status:500});}
}
