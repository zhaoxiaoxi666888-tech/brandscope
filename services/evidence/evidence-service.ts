import { createHash } from "node:crypto";
import type { Project } from "@prisma/client";
import type { SourceOutput } from "@/services/ai/types";
import type { SearchProvider } from "@/services/search/types";
import { createSearchProvider } from "@/services/search/provider-factory";
import { buildSearchQueries } from "@/services/search/queries";
import { extractPublicPage } from "./url-extractor";
import { getBenchmarkSources } from "./benchmark-dataset-v2";

const rank={OFFICIAL:0,INSTITUTION:1,MEDIA:2,COMMERCE:3,COMMUNITY:4,OTHER:5} as const;
const grade={OFFICIAL:"A",INSTITUTION:"A",MEDIA:"B",COMMERCE:"C",COMMUNITY:"C",OTHER:"D"} as const;
const canonical=(value:string)=>{const url=new URL(value);url.hash="";for(const key of [...url.searchParams.keys()])if(/^utm_|^(ref|source)$/i.test(key))url.searchParams.delete(key);return url.toString().replace(/\/$/,"");};
const words=(value:string)=>new Set(value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").split(" ").filter(token=>token.length>2));
const similarity=(left:string,right:string)=>{const a=words(left),b=words(right);if(!a.size||!b.size)return 0;let common=0;for(const token of a)if(b.has(token))common++;return common/Math.min(a.size,b.size);};
const marketHints=(market:string)=>market.includes("中国")?[".cn","china","zh-cn"]:market.includes("德国")?[".de","germany","eu-de"]:[market.toLowerCase()];
const nonArticlePath=/^\/?$|^\/(?:support|zh-cn|en|eu-de)\/?$|\/(?:contact|contact-us|search|blogs|newsroom|newsroom_list|press-releases)\/?$/i;
const isArticleUrl=(value:string)=>{try{return !nonArticlePath.test(new URL(value).pathname);}catch{return false;}};

export class EvidenceService{
 constructor(private readonly provider?:SearchProvider,private readonly extractor=extractPublicPage){}
 async ingest(project:Project,inputUrl:string):Promise<SourceOutput>{
  const url=canonical(inputUrl);const page=await this.extractor(url);
  const host=new URL(url).hostname.replace(/^www\./,"");
  const brand=project.brandName.toLowerCase().replace(/\s+/g,"");
  const official=host.toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]/g,"").includes(brand);
  const sourceType=official?"OFFICIAL" as const:"OTHER" as const;
  return{sourceId:`EV-${createHash("sha256").update(`${project.id}:${url}`).digest("hex").slice(0,10).toUpperCase()}`,title:page.title,url,publisher:page.publisher,publishedAt:page.publishedAt,summary:page.description,content:page.markdown,retrievedAt:new Date().toISOString(),sourceType,qualityGrade:official?"A":"D",extractionStatus:"SUCCESS"};
 }
 async discover(project:Project){
  const provider=this.provider??createSearchProvider();
  const benchmark=this.provider?[]:getBenchmarkSources(project);
  const results=[...benchmark,...await provider.search({project,queries:buildSearchQueries(project),maxSources:30})];
  const unique=new Map<string,SourceOutput>();
  for(const item of results){try{const key=canonical(item.url);if(isArticleUrl(key)&&!unique.has(key))unique.set(key,{...item,url:key});}catch{/* 丢弃无效 URL */}}
  const hints=marketHints(project.targetMarket);const relevance=(item:SourceOutput)=>{const value=`${item.title} ${item.summary} ${item.url}`.toLowerCase();return hints.reduce((score,hint)=>score+(value.includes(hint)?1:0),0);};
  const sorted=[...unique.values()].sort((a,b)=>rank[a.sourceType]-rank[b.sourceType]||relevance(b)-relevance(a)||Date.parse(b.publishedAt||"")-Date.parse(a.publishedAt||""));
  const trusted=sorted.filter(item=>item.sourceType==="OFFICIAL"||item.sourceType==="INSTITUTION"||item.sourceType==="MEDIA");
  if(benchmark.length){const preferred=benchmark.map(item=>canonical(item.url)).filter(isArticleUrl);return preferred.map(url=>unique.get(url)).filter((item):item is SourceOutput=>Boolean(item));}
  if(trusted.length<3)return sorted.slice(0,16);
  return [...trusted.filter(item=>item.sourceType==="OFFICIAL").slice(0,5),...trusted.filter(item=>item.sourceType==="INSTITUTION").slice(0,3),...trusted.filter(item=>item.sourceType==="MEDIA").slice(0,4)].slice(0,12);
 }
 async collect(project:Project){
  const candidates=await this.discover(project);
  const evidence:SourceOutput[]=[];
  for(let offset=0;offset<candidates.length&&evidence.filter(item=>item.extractionStatus==="SUCCESS").length<10;offset+=4){
   const batch=await Promise.all(candidates.slice(offset,offset+4).map(async item=>{
    const sourceId=`EV-${createHash("sha256").update(`${project.id}:${item.url}`).digest("hex").slice(0,10).toUpperCase()}`;
    if(/example\.(com|org)\/brandscope-(mock|search)\//.test(item.url))return{...item,sourceId,content:item.summary,qualityGrade:grade[item.sourceType],extractionStatus:"SUCCESS" as const};
    try{const page=await this.extractor(item.url);return{...item,sourceId,title:page.title||item.title,publisher:page.publisher||item.publisher,publishedAt:page.publishedAt||item.publishedAt,summary:page.description,content:page.markdown,qualityGrade:grade[item.sourceType],extractionStatus:"SUCCESS" as const};}
    catch{return{...item,sourceId,content:"",qualityGrade:grade[item.sourceType],extractionStatus:"FAILED" as const};}
   }));
   for(const item of batch){if(item.extractionStatus==="SUCCESS"&&evidence.some(existing=>similarity(`${item.title}\n${item.content||""}`,`${existing.title}\n${existing.content||""}`)>0.82))continue;evidence.push(item);}
  }
  const successful=evidence.filter(item=>item.extractionStatus==="SUCCESS");
  return successful.length?successful.slice(0,10):evidence.slice(0,10);
 }
}

export const evidenceService=new EvidenceService();
