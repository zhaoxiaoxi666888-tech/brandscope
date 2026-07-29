import { createHash } from "node:crypto";
import { demoProjects } from "@/prisma/demo-data";
import { benchmarkDatasetV2 } from "@/services/evidence/benchmark-dataset-v2";

export const readOnlyResponse=()=>Response.json({error:"Benchmark 案例为公开只读内容，不能修改或重新生成。"},{status:403});

const benchmarkIds=new Set(["oura-us","whoop-us","ultrahuman-in"]);
export const isBenchmarkProject=(id:string)=>benchmarkIds.has(id);
const now="2026-07-21T00:00:00.000Z";
const sourceId=(url:string)=>`EV-${createHash("sha256").update(url).digest("hex").slice(0,10).toUpperCase()}`;
const withoutModuleIndex=<T extends {moduleIndex:number}>(source:T)=>{const copy:Partial<T>={...source};delete copy.moduleIndex;return copy;};

export function demoProjectList(){return demoProjects.filter(item=>benchmarkIds.has(item.id)).map(item=>({id:item.id,name:item.name,brandName:item.brandName,category:item.category,targetMarket:item.targetMarket,competitors:item.competitors,researchObjective:item.researchObjective,status:"BRIEF_READY",createdAt:now,updatedAt:now,readOnly:true,_count:{research:item.research.length,insights:item.insights.length},brief:{id:`brief-${item.id}`}}));}

export function demoProjectDetail(id:string){
 const item=demoProjects.find(project=>project.id===id&&benchmarkIds.has(project.id));if(!item)return null;
 const benchmark=benchmarkDatasetV2.find(entry=>entry.brand.toLowerCase()===item.brandName.toLowerCase()||(entry.aliases||[]).some(alias=>item.brandName.includes(alias)));
 const benchmarkUrls=benchmark?.urls||[];
 const sources=benchmarkUrls.map((source,index)=>({id:sourceId(source.url),projectId:item.id,title:source.title,url:source.url,publisher:new URL(source.url).hostname.replace(/^www\./,""),publishedAt:null,retrievedAt:now,sourceType:source.sourceType,summary:`Benchmark Dataset v3 研究资料：${source.title}`,content:`Benchmark Dataset v3 研究资料：${source.title}。公开演示仅展示已整理的研究快照，正式决策前仍需人工核验原文。`,qualityGrade:source.sourceType==="OFFICIAL"||source.sourceType==="INSTITUTION"?"A":"B",extractionStatus:"SUCCESS",enabled:true,createdAt:now,updatedAt:now,_count:{research:1},fingerprint:sourceId(source.url),moduleIndex:index%item.research.length}));
 return {...demoProjectList().find(project=>project.id===id),sources,research:item.research.map((research,index)=>({id:`research-${id}-${index}`,projectId:id,module:research.module,title:research.title,summary:research.summary,keyFacts:research.keyFacts||"",marketSignals:research.marketSignals||"",inference:research.inference,marketingMeaning:research.marketingMeaning||"",limitations:research.limitations||"",status:"READY",position:index,createdAt:now,updatedAt:now,sources:sources.filter(source=>source.moduleIndex===index).map(withoutModuleIndex)})),insights:item.insights.map((insight,index)=>({id:`insight-${id}-${index}`,projectId:id,...insight,evidence:"基于当前 Benchmark 研究内容。",sourceIds:"[]",researchModules:"[]",isInference:true,position:index,createdAt:now,updatedAt:now})),brief:{id:`brief-${id}`,projectId:id,...item.brief,createdAt:now,updatedAt:now},createdAt:now,updatedAt:now,readOnly:true};
}
