import { prisma } from "@/lib/prisma";
import { isPublicDemo, readOnlyResponse } from "@/lib/demo-mode";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) {
  if(isPublicDemo())return readOnlyResponse();
  try {
    const {id}=await params; const body=await request.json();
    if(typeof body.content!=="string"||!body.content.trim()||!["SUGGESTED","CONFIRMED"].includes(body.status)||!Number.isInteger(body.position)||body.position<0)return Response.json({error:"洞察内容或状态无效。"},{status:400});
    const insight=await prisma.insight.update({where:{id},data:{content:body.content.trim(),status:body.status,position:body.position}});
    return Response.json(insight);
  }
  catch { return Response.json({error:"洞察更新失败。"},{status:400}); }
}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}) {
  if(isPublicDemo())return readOnlyResponse();
  try { const {id}=await params; await prisma.insight.delete({where:{id}}); return new Response(null,{status:204}); }
  catch { return Response.json({error:"洞察删除失败。"},{status:400}); }
}
