import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { aiConfig,deepSeekConfig } from "@/services/ai/config";

export type GenerationOperation="RESEARCH"|"INSIGHTS"|"BRIEF";
const globalLimit=()=>Math.max(1,Number(process.env.PUBLIC_DAILY_AI_CALL_LIMIT||30));
const dateKey=()=>new Date().toISOString().slice(0,10);
const startOfDay=()=>new Date(`${dateKey()}T00:00:00.000Z`);

export async function createProjectWithinLimit(data:Prisma.ProjectUncheckedCreateInput){
  return prisma.$transaction(async tx=>{
    await tx.$queryRawUnsafe("SELECT pg_advisory_xact_lock(hashtext($1))",data.ownerId);
    const count=await tx.project.count({where:{ownerId:data.ownerId,createdAt:{gte:startOfDay()}}});
    if(count>=2)throw new Error("你今天已创建 2 个真实研究项目，请明天再试。");
    return tx.project.create({data});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}

export async function reserveGeneration(projectId:string,ownerId:string,operation:GenerationOperation){
  const limit=globalLimit();const date=dateKey();
  try{return await prisma.$transaction(async tx=>{
    await tx.dailyBudget.upsert({where:{date},create:{date,callLimit:limit},update:{callLimit:limit}});
    const reserved=await tx.dailyBudget.updateMany({where:{date,usedCalls:{lt:limit}},data:{usedCalls:{increment:1}}});
    if(!reserved.count)throw new Error("今日公开体验额度已用完，请明天再试。");
    return tx.generationRun.create({data:{projectId,ownerId,operation,provider:aiConfig.provider,model:aiConfig.provider==="deepseek"?deepSeekConfig.model:aiConfig.model}});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});}
  catch(error){
    if(error instanceof Error&&(error.message.includes("Unique constraint")||error.message.includes("P2002")))throw new Error(`每个项目只能生成 1 次${operation==="RESEARCH"?"品牌研究":operation==="INSIGHTS"?"核心洞察":"品牌营销简报"}。`);
    throw error;
  }
}

export async function completeGeneration(id:string,metrics:{inputTokens?:number;outputTokens?:number;elapsedMs?:number},failureReason=""){
  await prisma.generationRun.update({where:{id},data:{status:failureReason?"FAILED":"SUCCEEDED",inputTokens:metrics.inputTokens||0,outputTokens:metrics.outputTokens||0,elapsedMs:metrics.elapsedMs||0,failureReason:failureReason.slice(0,500),completedAt:new Date()}});
}

export async function publicQuota(){
  const date=dateKey();const budget=await prisma.dailyBudget.findUnique({where:{date}});const limit=globalLimit();
  return{dailyProjectLimit:2,maxEvidenceUrls:8,remainingAiCalls:Math.max(0,limit-(budget?.usedCalls||0)),dailyAiCallLimit:limit};
}
