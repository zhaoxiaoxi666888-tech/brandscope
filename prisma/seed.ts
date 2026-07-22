import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { demoProjects } from "./demo-data";

const prisma=new PrismaClient();
const fingerprint=(value:string)=>`EV-${createHash("sha256").update(value).digest("hex").slice(0,10).toUpperCase()}`;

async function main(){
 if(process.env.ALLOW_DESTRUCTIVE_SEED!=="true")throw new Error("Seed 会清空业务表；仅允许在明确设置 ALLOW_DESTRUCTIVE_SEED=true 的全新本地数据库执行。");
 await prisma.source.deleteMany();await prisma.research.deleteMany();await prisma.insight.deleteMany();await prisma.brief.deleteMany();await prisma.project.deleteMany();
 for(const fixture of demoProjects){
  const {research,insights,brief,...project}=fixture;
  await prisma.project.create({data:{...project,ownerId:"benchmark-seed",brief:{create:brief},insights:{create:insights.map((item,position)=>({...item,position}))}}});
  for(const [position,item] of research.entries()){
   const ids:string[]=[];
   for(const value of item.sources){
    const id=fingerprint(value.url);ids.push(id);
    await prisma.source.upsert({where:{id},create:{id,projectId:project.id,title:value.title,url:value.url,publisher:value.publisher,publishedAt:value.publishedAt?new Date(value.publishedAt):null,summary:value.summary,content:value.summary,retrievedAt:new Date(value.retrievedAt),sourceType:value.sourceType,qualityGrade:"D",enabled:true,extractionStatus:"SUCCESS",fingerprint:id},update:{}});
   }
   await prisma.research.create({data:{projectId:project.id,module:item.module,title:item.title,summary:item.summary,inference:item.inference,position,sources:{connect:ids.map(id=>({id}))}}});
  }
 }
 console.log(`已写入 ${demoProjects.length} 个完整中文演示项目`);
}
main().finally(()=>prisma.$disconnect());
