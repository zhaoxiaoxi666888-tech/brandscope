import test from "node:test";
import assert from "node:assert/strict";
import type { Project } from "@prisma/client";
import { EvidenceService } from "../services/evidence/evidence-service";
import type { SearchProvider } from "../services/search/types";

const project:Project={id:"apple",name:"Apple 中国研究",brandName:"Apple",category:"消费电子",targetMarket:"中国",competitors:"华为、小米",researchObjective:"验证品牌生态价值",status:"DRAFT",createdAt:new Date(),updatedAt:new Date()};
const make=(index:number,type:"OFFICIAL"|"MEDIA"="MEDIA")=>({title:`资料 ${index}`,url:`https://${type==="OFFICIAL"?"apple.com":"news.test"}/page-${index}?utm_source=test`,publisher:type==="OFFICIAL"?"Apple":"新闻媒体",publishedAt:`2026-07-${String(index+1).padStart(2,"0")}`,retrievedAt:new Date().toISOString(),sourceType:type,summary:`搜索摘要 ${index}`});

test("EvidenceService 去重、优先官方来源并执行类型配额",async()=>{
 const rows=[make(0,"OFFICIAL"),make(0,"OFFICIAL"),...Array.from({length:20},(_,index)=>make(index+1))];
 const provider:SearchProvider={search:async()=>rows};
 const service=new EvidenceService(provider,async url=>{const slug=url.split("/").at(-1)||"unknown";const markdown=`${slug} ${slug} 独立专题内容与不同事实材料 ${slug.repeat(20)}`;return{title:`正文 ${slug}`,publisher:"已提取发布方",publishedAt:null,markdown,description:`${slug} 摘要`,tokenEstimate:100};});
 const result=await service.collect(project);
 assert.equal(result.length,5);assert.equal(result[0].qualityGrade,"A");assert.match(result[0].sourceId||"",/^EV-[A-F0-9]{10}$/);assert.ok(result.every(item=>item.content));
});

test("EvidenceService 过滤高度重复正文",async()=>{
 const provider:SearchProvider={search:async()=>[make(1),make(2),make(3)]};
 const service=new EvidenceService(provider,async()=>({title:"相同标题",publisher:"媒体",publishedAt:null,markdown:"完全相同的正文材料 ".repeat(30),description:"相同摘要",tokenEstimate:100}));
 const result=await service.collect(project);assert.equal(result.length,1);
});

test("EvidenceService 保留提取状态且不把搜索摘要当正文",async()=>{
 const provider:SearchProvider={search:async()=>[make(1),make(2)]};let calls=0;
 const service=new EvidenceService(provider,async url=>{calls++;if(url.includes("page-2"))throw new Error("读取失败");return{title:"正文",publisher:"媒体",publishedAt:null,markdown:"真实网页正文 ".repeat(20),description:"正文摘要",tokenEstimate:100};});
 const result=await service.collect(project);assert.equal(calls,2);assert.equal(result.length,1);assert.equal(result[0].extractionStatus,"SUCCESS");assert.notEqual(result[0].content,result[0].summary);
});
