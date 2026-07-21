import * as cheerio from "cheerio";
import type { SourceOutput } from "@/services/ai/types";
import type { SearchProvider } from "../types";
import { EnvHttpProxyAgent, type Dispatcher } from "undici";

const blocked=/pinterest|facebook|instagram|tiktok|youtube|doubleclick|duckduckgo\.com|fandom|wikipedia|baidu|jd\.com|alibaba|temu|cnblogs/i;
const institutions=/\.gov\.|\.edu\.|who\.int|oecd\.org|worldbank\.org|europa\.eu|statista\.com|gartner\.com|idc\.com|cninfo\.com\.cn|xinhuanet\.com|chinadaily\.com\.cn/i;
const trustedMedia=/reuters|bloomberg|ft\.com|wsj\.com|bbc\.|nikkei|forbes|techcrunch|theverge|wired|36kr|caixin|yicai|sina\.com\.cn|geekpark/i;
const marketAliases:Record<string,string[]>={
  "中国":["中国","china","chinese"],
  "德国":["德国","germany","german"],
};

function resultUrl(value:string){
 try{const url=new URL(value,"https://html.duckduckgo.com");const encoded=url.searchParams.get("uddg");return encoded?decodeURIComponent(encoded):url.toString();}catch{return "";}
}
function classify(url:string,brand:string,title:string):SourceOutput["sourceType"]{
  const host=new URL(url).hostname.toLowerCase();const normalizedBrand=brand.toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]/g,"");
  const escaped=normalizedBrand.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  if(new RegExp(`(?:^|\\.)${escaped}\\.(?:com|cn|de|co\\.uk|com\\.cn|co\\.jp|fr|it|es|eu)$`,"i").test(host))return "OFFICIAL";
  if(institutions.test(host))return "INSTITUTION";
  if(trustedMedia.test(host))return "MEDIA";
  const normalizedTitle=title.replace(/\s+/g," ").trim().toLowerCase();const normalizedName=brand.toLowerCase();
  if(normalizedTitle.startsWith(`首页 - ${normalizedName}`)||normalizedTitle.startsWith(`关于我们 - ${normalizedName}`)||normalizedTitle.startsWith(`投资者关系 | ${normalizedName}`))return "OFFICIAL";
 return "OTHER";
}

export class PublicWebSearchProvider implements SearchProvider{
 private readonly dispatcher:Dispatcher|undefined;
 constructor(private readonly fetcher:typeof fetch=fetch){this.dispatcher=process.env.HTTPS_PROXY||process.env.HTTP_PROXY||process.env.ALL_PROXY?new EnvHttpProxyAgent():undefined;}
 async search({project,queries,maxSources}:Parameters<SearchProvider["search"]>[0]){
  const collected:SourceOutput[]=[];const seen=new Set<string>();const domains=new Map<string,number>();let failedQueries=0;
  for(const query of queries.slice(0,6)){
   if(collected.length>=maxSources)break;
   const queryDomains=new Set<string>();
   const endpoint=new URL("https://html.duckduckgo.com/html/");endpoint.searchParams.set("q",query);
   let response:Response|undefined;
   for(let attempt=0;attempt<2;attempt++){try{const candidate=await this.fetcher(endpoint,{headers:{"user-agent":"Mozilla/5.0 (compatible; BrandScope/1.0)",accept:"text/html"},signal:AbortSignal.timeout(15_000),dispatcher:this.dispatcher} as RequestInit);if(candidate.ok){response=candidate;break;}}catch{/* 对单个查询执行一次有限重试 */}if(attempt===0)await new Promise(resolve=>setTimeout(resolve,250));}
   if(!response){failedQueries++;continue;}
   const $=cheerio.load(await response.text());
   $(".result").each((_,element)=>{
    if(collected.length>=maxSources)return false;
    const anchor=$(element).find(".result__a").first();const url=resultUrl(anchor.attr("href")||"");const title=anchor.text().replace(/\s+/g," ").trim();
    if(!url||!title||!/^https?:/i.test(url)||blocked.test(url))return;
    const parsed=new URL(url);parsed.hash="";const domain=parsed.hostname.replace(/^www\./,"");const key=parsed.toString();
    if(seen.has(key)||queryDomains.has(domain)||(domains.get(domain)||0)>=3)return;seen.add(key);queryDomains.add(domain);domains.set(domain,(domains.get(domain)||0)+1);
    const summary=$(element).find(".result__snippet").text().replace(/\s+/g," ").trim().slice(0,700);
    const sourceType=classify(key,project.brandName,title);
    const combined=`${title} ${summary}`.toLowerCase();const categoryParts=project.category.split(/[与和及,，、/\s]+/).flatMap(part=>part.length>3?[part,...Array.from({length:part.length-1},(_,index)=>part.slice(index,index+2))]:[part]).filter(part=>part.length>=2);
    const targetTerms=marketAliases[project.targetMarket]??[project.targetMarket.toLowerCase()];
    const relevant=targetTerms.some(term=>combined.includes(term))||categoryParts.some(part=>combined.includes(part.toLowerCase()))||/annual report|investor|年度报告|年报|财报/i.test(combined);
    if(!combined.includes(project.brandName.toLowerCase())||(sourceType!=="OFFICIAL"&&!relevant))return;
    collected.push({title,url:key,publisher:domain,publishedAt:null,retrievedAt:new Date().toISOString(),sourceType,summary:summary||"搜索结果未提供摘要。"});
   });
  }
  if(!collected.length&&failedQueries)throw new Error("暂时无法连接公开网页发现服务。");
  const priority={OFFICIAL:0,INSTITUTION:1,MEDIA:2,COMMERCE:3,COMMUNITY:4,OTHER:5};
  return collected.sort((a,b)=>priority[a.sourceType]-priority[b.sourceType]).slice(0,maxSources);
 }
}
