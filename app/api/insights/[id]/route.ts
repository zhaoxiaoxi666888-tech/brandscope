import { prisma } from "@/lib/prisma";
import { authErrorResponse,requireUser } from "@/lib/auth";
import { sanitizeUserText } from "@/lib/project-input";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {const {userId}=await requireUser(request);const {id}=await params;const body=await request.json();if(typeof body.content!=="string"||!body.content.trim()||body.content.length>4000||!["SUGGESTED","CONFIRMED"].includes(body.status)||!Number.isInteger(body.position)||body.position<0)return Response.json({error:"洞察内容或状态无效。"},{status:400});const existing=await prisma.insight.findFirst({where:{id,project:{ownerId:userId}}});if(!existing)return Response.json({error:"洞察不存在或无权访问。"},{status:404});const insight=await prisma.insight.update({where:{id},data:{content:sanitizeUserText(body.content),status:body.status,position:body.position}});return Response.json(insight);}
  catch(error){return authErrorResponse(error)||Response.json({error:"洞察更新失败。"},{status:400});}
}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {const {userId}=await requireUser(request);const {id}=await params;const existing=await prisma.insight.findFirst({where:{id,project:{ownerId:userId}}});if(!existing)return Response.json({error:"洞察不存在或无权访问。"},{status:404});await prisma.insight.delete({where:{id}});return new Response(null,{status:204});}
  catch(error){return authErrorResponse(error)||Response.json({error:"洞察删除失败。"},{status:400});}
}
