import { prisma } from "@/lib/prisma";
import { briefToMarkdown } from "@/app/lib/brief-markdown";
import { briefService } from "@/services/ai/services/brief-service";
import { captureAiMetrics } from "@/services/ai/metrics";
import { authErrorResponse } from "@/lib/auth";
import { demoProjectDetail,isBenchmarkProject,readOnlyResponse } from "@/lib/demo-mode";
import { requireOwnedProject } from "@/lib/project-access";
import { completeGeneration,reserveGeneration } from "@/lib/usage-limits";
import { safeErrorMessage } from "@/lib/safe-error";
import { sanitizeUserText } from "@/lib/project-input";

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if(isBenchmarkProject(id)){const project=demoProjectDetail(id);if(!project?.brief)return Response.json({error:"品牌营销简报不存在。"},{status:404});return markdownResponse(project.brandName||"BrandScope",project.brief.markdown);}
  try{const {userId,project}=await requireOwnedProject(request,id);if(!project)return Response.json({error:"项目不存在或无权访问。"},{status:404});const brief=await prisma.brief.findFirst({where:{projectId:id,project:{ownerId:userId}}});if(!brief)return Response.json({error:"品牌营销简报不存在。"},{status:404});return markdownResponse(project.brandName,brief.markdown);}
  catch(error){return authErrorResponse(error)||Response.json({error:"简报下载失败。"},{status:500});}
}
function markdownResponse(brandName:string,markdown:string){const filename=`${brandName.replace(/[^a-z0-9\u4e00-\u9fff]+/gi,"-")}-品牌营销简报.md`;return new Response(markdown,{headers:{"content-type":"text/markdown; charset=utf-8","content-disposition":`attachment; filename*=UTF-8''${encodeURIComponent(filename)}`}});}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;if(isBenchmarkProject(id))return readOnlyResponse();let run:{id:string}|undefined;
  try {const {userId,project}=await requireOwnedProject(request,id);if(!project)return Response.json({error:"项目不存在或无权访问。"},{status:404});const insights=await prisma.insight.findMany({where:{projectId:id,status:"CONFIRMED"},orderBy:{position:"asc"}});if(!insights.length)return Response.json({error:"请先确认至少一条核心洞察。"},{status:400});
    run=await reserveGeneration(id,userId,"BRIEF");const captured=await captureAiMetrics(()=>briefService.generate(project,insights));const safe={background:sanitizeUserText(captured.value.background),marketingObjective:sanitizeUserText(captured.value.marketingObjective),positioning:sanitizeUserText(captured.value.positioning),persona:sanitizeUserText(captured.value.persona),coreInsights:sanitizeUserText(captured.value.coreInsights),communication:sanitizeUserText(captured.value.communication),contentSuggestions:sanitizeUserText(captured.value.contentSuggestions),channels:sanitizeUserText(captured.value.channels),kpis:sanitizeUserText(captured.value.kpis)};const brief=await prisma.brief.create({data:{projectId:id,...safe,markdown:briefToMarkdown(project.brandName,safe)}});await prisma.project.update({where:{id},data:{status:"BRIEF_READY"}});await completeGeneration(run.id,captured.metrics);return Response.json(brief);
  }catch(error){const auth=authErrorResponse(error);if(auth)return auth;const message=safeErrorMessage(error,"品牌营销简报生成失败，请重试。");if(run)await completeGeneration(run.id,{},message).catch(()=>{});return Response.json({error:message},{status:message.includes("只能生成")||message.includes("额度")?429:500});}
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;if(isBenchmarkProject(id))return readOnlyResponse();
  try {const {project}=await requireOwnedProject(request,id);if(!project)return Response.json({error:"项目不存在或无权访问。"},{status:404});const body=await request.json();const fields=["background","marketingObjective","positioning","persona","coreInsights","communication","contentSuggestions","channels","kpis"] as const;if(fields.some(field=>typeof body[field]!=="string"||body[field].length>10000))return Response.json({error:"简报内容不完整或过长。"},{status:400});const data={background:sanitizeUserText(body.background),marketingObjective:sanitizeUserText(body.marketingObjective),positioning:sanitizeUserText(body.positioning),persona:sanitizeUserText(body.persona),coreInsights:sanitizeUserText(body.coreInsights),communication:sanitizeUserText(body.communication),contentSuggestions:sanitizeUserText(body.contentSuggestions),channels:sanitizeUserText(body.channels),kpis:sanitizeUserText(body.kpis)};const markdown=briefToMarkdown(project.brandName,data);const brief=await prisma.brief.update({where:{projectId:id},data:{...data,markdown}});return Response.json(brief);
  }catch(error){return authErrorResponse(error)||Response.json({error:"保存简报失败，请重试。"},{status:400});}
}
