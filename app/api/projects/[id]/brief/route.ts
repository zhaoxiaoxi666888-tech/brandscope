import { prisma } from "@/lib/prisma";
import { briefToMarkdown } from "@/app/lib/brief-markdown";
import { briefService } from "@/services/ai/services/brief-service";
import { acquireGenerationLock } from "@/lib/generation-lock";
import { demoProjectDetail, isPublicDemo, readOnlyResponse } from "@/lib/demo-mode";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if(isPublicDemo()){const project=demoProjectDetail(id);if(!project?.brief)return Response.json({error:"品牌营销简报不存在。"},{status:404});return new Response(project.brief.markdown,{headers:{"content-type":"text/markdown; charset=utf-8","content-disposition":`attachment; filename*=UTF-8''${encodeURIComponent(project.brandName+"-品牌营销简报.md")}`}});}
  const project=await prisma.project.findUnique({where:{id},include:{brief:true}});
  if(!project?.brief)return Response.json({error:"品牌营销简报不存在。"},{status:404});
  const filename=`${project.brandName.replace(/[^a-z0-9\u4e00-\u9fff]+/gi,"-")}-品牌营销简报.md`;
  return new Response(project.brief.markdown,{headers:{"content-type":"text/markdown; charset=utf-8","content-disposition":`attachment; filename*=UTF-8''${encodeURIComponent(filename)}`}});
}

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}) {
  if(isPublicDemo())return readOnlyResponse();
  try {
    const {id}=await params;const release=acquireGenerationLock(`brief:${id}`);if(!release)return Response.json({error:"该项目正在生成品牌营销简报，请勿重复提交。"},{status:409});
    try{const project=await prisma.project.findUnique({where:{id},include:{insights:true}});
    if(!project)return Response.json({error:"项目不存在。"},{status:404});
    if(!project.insights.some(item=>item.status==="CONFIRMED"))return Response.json({error:"请先确认至少一条核心洞察。"},{status:400});
    const output=await briefService.generate(project,project.insights);
    const brief=await prisma.brief.upsert({where:{projectId:id},create:{projectId:id,...output},update:output});
    return Response.json(brief);}finally{release();}
  } catch(error) { return Response.json({error:error instanceof Error?error.message:"品牌营销简报生成失败，请重试。"},{status:500}); }
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) {
  if(isPublicDemo())return readOnlyResponse();
  try {
    const {id}=await params; const body=await request.json();
    const fields=["background","marketingObjective","positioning","persona","coreInsights","communication","contentSuggestions","channels","kpis"] as const;
    if(fields.some(field=>typeof body[field]!=="string"))return Response.json({error:"简报内容不完整。"},{status:400});
    const project=await prisma.project.findUnique({where:{id}}); if(!project)return Response.json({error:"项目不存在。"},{status:404});
    const markdown=briefToMarkdown(project.brandName,body);
    const brief=await prisma.brief.update({where:{projectId:id},data:{...Object.fromEntries(fields.map(field=>[field,body[field]])),markdown}});
    return Response.json(brief);
  } catch { return Response.json({error:"保存简报失败，请重试。"},{status:400}); }
}
