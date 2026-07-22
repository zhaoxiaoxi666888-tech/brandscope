import test from "node:test";
import assert from "node:assert/strict";
import OpenAI from "openai";
import type { Project } from "@prisma/client";
import { DeepSeekLLMProvider } from "../services/ai/providers/deepseek-llm-provider";

const project:Project={id:"p",name:"品牌研究",brandName:"测试品牌",category:"消费电子",targetMarket:"德国",competitors:"竞品甲",researchObjective:"比较品牌进入目标市场的机会与风险",status:"DRAFT",ownerId:"test-user",createdAt:new Date(),updatedAt:new Date()};
const source={sourceId:"EV-ABCDEF1234",title:"官方资料",url:"https://example.com/source",publisher:"品牌官网",publishedAt:null,retrievedAt:new Date().toISOString(),sourceType:"OFFICIAL" as const,summary:"公开资料摘要",content:"用于测试的完整网页正文材料。"};
const modules=["BRAND_CONTEXT","MARKET_SIGNALS","TARGET_AUDIENCE","CUSTOMER_PAINS","COMPETITOR_POSITIONING","OPPORTUNITIES_RISKS"] as const;
const validResearch={modules:modules.map((module,index)=>({module,title:`研究模块标题需要足够完整 ${index}`,summary:"这是一段经过来源约束的详细研究内容，用于验证结构校验能够接受完整且具体的中文研究输出。",keyFacts:"网页正文明确支持的关键事实。",marketSignals:"材料呈现的市场信号。",inference:"这是基于上述公开资料形成的有限推断，需要用户继续核验。",marketingMeaning:"品牌营销应优先验证这一判断。",limitations:"当前材料范围有限。",sourceIds:[source.sourceId]}))};

function fakeClient(outputs:Array<string|Error>){
 let calls=0;
 const client={chat:{completions:{create:async()=>{
  const output=outputs[calls++];if(output instanceof Error)throw output;
  return{choices:[{finish_reason:"stop",message:{content:output}}],usage:{prompt_tokens:100,completion_tokens:50,total_tokens:150}};
 }}}};
 return{client:client as unknown as OpenAI,get calls(){return calls;}};
}

test("DeepSeekProvider 使用 Chat Completions JSON 输出并通过 Zod",async()=>{
 const fake=fakeClient([JSON.stringify(validResearch)]);
 const provider=new DeepSeekLLMProvider("test",{client:fake.client,record:()=>{}});
 const result=await provider.generateResearch({project,sources:[source],prompt:"生成品牌研究 JSON"});
 assert.equal(fake.calls,1);assert.equal(result.length,6);assert.equal(result[0].sources[0].url,source.url);
});

test("DeepSeekProvider 对结构错误最多执行一次定向修复",async()=>{
 const fake=fakeClient([JSON.stringify({modules:[]}),JSON.stringify(validResearch)]);
 const provider=new DeepSeekLLMProvider("test",{client:fake.client,record:()=>{}});
 const result=await provider.generateResearch({project,sources:[source],prompt:"生成品牌研究 JSON"});
 assert.equal(fake.calls,2);assert.equal(result.length,6);
});

test("DeepSeekProvider 拒绝两次均不符合 Schema 的内容",async()=>{
 const fake=fakeClient([JSON.stringify({modules:[]}),JSON.stringify({modules:[]})]);
 const provider=new DeepSeekLLMProvider("test",{client:fake.client,record:()=>{}});
 await assert.rejects(()=>provider.generateResearch({project,sources:[source],prompt:"生成品牌研究 JSON"}),/未通过结构校验/);
 assert.equal(fake.calls,2);
});

test("DeepSeekProvider 对非法 JSON 只修复一次",async()=>{
 const fake=fakeClient(["不是 JSON",JSON.stringify(validResearch)]);const provider=new DeepSeekLLMProvider("test",{client:fake.client,record:()=>{}});
 const result=await provider.generateResearch({project,sources:[source],prompt:"生成品牌研究 JSON"});assert.equal(fake.calls,2);assert.equal(result.length,6);
});

test("DeepSeekProvider 对超时执行有限重试并记录 Token 与耗时",async()=>{
 const metrics:import("../services/ai/providers/deepseek-llm-provider").DeepSeekMetrics[]=[];
 const fake=fakeClient([new OpenAI.APIConnectionTimeoutError({message:"timeout"}),new OpenAI.APIConnectionTimeoutError({message:"timeout"}),JSON.stringify(validResearch)]);
 const provider=new DeepSeekLLMProvider("test",{client:fake.client,sleep:async()=>{},record:item=>metrics.push(item)});
 const result=await provider.generateResearch({project,sources:[source],prompt:"生成品牌研究 JSON"});
 assert.equal(fake.calls,3);assert.equal(result.length,6);assert.equal(metrics[0].retryCount,2);assert.equal(metrics[0].inputTokens,100);assert.equal(metrics[0].outputTokens,50);assert.equal(metrics[0].costEstimate,"暂未估算");assert.equal(metrics[0].success,true);
});

test("DeepSeekProvider 超过两次网络重试后返回中文错误",async()=>{
 const timeout=()=>new OpenAI.APIConnectionTimeoutError({message:"timeout"});const fake=fakeClient([timeout(),timeout(),timeout()]);
 const provider=new DeepSeekLLMProvider("test",{client:fake.client,sleep:async()=>{},record:()=>{}});
 await assert.rejects(()=>provider.generateResearch({project,sources:[source],prompt:"生成品牌研究 JSON"}),/无法连接 DeepSeek/);assert.equal(fake.calls,3);
});
