import test from "node:test";
import assert from "node:assert/strict";
import type { Project } from "@prisma/client";
import { BraveSearchProvider } from "../services/search/providers/brave-search-provider";
import { PublicWebSearchProvider } from "../services/search/providers/public-web-search-provider";
import { buildSearchQueries } from "../services/search/queries";

const project:Project={id:"p",name:"Apple 中国",brandName:"Apple",category:"消费电子",targetMarket:"中国",competitors:"华为、小米",researchObjective:"研究生态价值",status:"DRAFT",createdAt:new Date(),updatedAt:new Date()};

test("检索查询包含品牌、市场、品类与竞品",()=>{const queries=buildSearchQueries(project);assert.equal(queries.length,7);assert.match(queries.join(" "),/Apple/);assert.match(queries.join(" "),/中国/);assert.match(queries.join(" "),/华为/);});

test("真实检索 Provider 规范化、去重并限制同域来源",async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({web:{results:[1,2,3,4].map(index=>({title:`Apple source ${index}`,url:`https://apple.com/page-${index}`,description:"公开资料摘要",profile:{long_name:"Apple"}})).concat([{title:"Research",url:"https://example.org/report",description:"机构资料",profile:{long_name:"Institute"}}])}}),{status:200});try{const result=await new BraveSearchProvider("test").search({project,queries:["one"],maxSources:10});assert.equal(result.filter(item=>new URL(item.url).hostname==="apple.com").length,3);assert.equal(result[0].sourceType,"OFFICIAL");assert.equal(new Set(result.map(item=>item.url)).size,result.length);}finally{globalThis.fetch=original;}});

test("公开网页发现 Provider 返回去重 URL 并优先官网",async()=>{const html=`<div class="result"><a class="result__a" href="//duckduckgo.com/l/?uddg=${encodeURIComponent("https://www.apple.com.cn/newsroom/")}">Apple 官方新闻</a><div class="result__snippet">Apple 中国官方新闻</div></div><div class="result"><a class="result__a" href="//duckduckgo.com/l/?uddg=${encodeURIComponent("https://www.reuters.com/technology/apple-china")}">Apple China report</a><div class="result__snippet">Apple China market report</div></div>`;const provider=new PublicWebSearchProvider(async()=>new Response(html,{status:200,headers:{"content-type":"text/html"}}));const result=await provider.search({project,queries:["Apple China"],maxSources:10});assert.equal(result.length,2);assert.equal(result[0].sourceType,"OFFICIAL");assert.equal(new Set(result.map(item=>item.url)).size,2);});
