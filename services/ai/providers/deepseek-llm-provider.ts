import OpenAI from "openai";
import type { z } from "zod";
import { briefToMarkdown } from "@/app/lib/brief-markdown";
import type { LLMProvider } from "../llm-provider";
import { deepSeekConfig } from "../config";
import { briefResponseSchema, insightResponseSchema, researchResponseSchema } from "../schemas";

type ResearchResponse=z.infer<typeof researchResponseSchema>;
type InsightResponse=z.infer<typeof insightResponseSchema>;
type BriefResponse=z.infer<typeof briefResponseSchema>;
type Operation="research"|"insights"|"brief";
export type DeepSeekMetrics={provider:"deepseek";model:string;operation:Operation;elapsedMs:number;inputTokens:number;outputTokens:number;totalTokens:number;retryCount:number;repairCount:number;costEstimate:"暂未估算";success:boolean};
type MetricsRecorder=(metrics:DeepSeekMetrics)=>void;
type Usage={inputTokens:number;outputTokens:number;totalTokens:number;retryCount:number;repairCount:number};

const contracts={
 research:`{"modules":[{"module":"BRAND_CONTEXT | MARKET_SIGNALS | TARGET_AUDIENCE | CUSTOMER_PAINS | COMPETITOR_POSITIONING | OPPORTUNITIES_RISKS","title":"字符串","summary":"字符串","keyFacts":"字符串","marketSignals":"字符串","inference":"字符串","marketingMeaning":"字符串","limitations":"字符串，可为空","sourceIds":["输入中存在的 EV-XXXXXXXXXX"]}]}。modules 必须恰好六项且 module 不重复。`,
 insights:`{"insights":[{"type":"CORE | PAIN | OPPORTUNITY | RISK","content":"观察 → 判断 → 对品牌行动的影响","evidence":"判断依据","researchModules":["关联研究模块代码"]}]}。insights 为四至八项。`,
 brief:`{"background":"字符串","marketingObjective":"字符串","positioning":"字符串","persona":"字符串","coreInsights":"字符串","communication":"字符串","contentSuggestions":"字符串","channels":"字符串","kpis":"字符串"}`,
} as const;

const defaultRecorder:MetricsRecorder=(metrics)=>console.info("[AI_METRIC]",JSON.stringify(metrics));
const defaultSleep=(milliseconds:number)=>new Promise(resolve=>setTimeout(resolve,milliseconds));
const isRetryable=(error:unknown)=>error instanceof OpenAI.APIConnectionError||error instanceof OpenAI.RateLimitError||(error instanceof OpenAI.APIError&&Boolean(error.status&&(error.status===408||error.status===409||error.status===429||error.status>=500)));

function parseJson(raw:string){return JSON.parse(raw.trim()) as unknown;}

export class DeepSeekLLMProvider implements LLMProvider{
 private readonly client:OpenAI;
 private readonly record:MetricsRecorder;
 private readonly sleep:(milliseconds:number)=>Promise<unknown>;
 constructor(apiKey:string,options?:{baseURL?:string;client?:OpenAI;record?:MetricsRecorder;sleep?:(milliseconds:number)=>Promise<unknown>}){
  this.client=options?.client??new OpenAI({apiKey,baseURL:options?.baseURL??deepSeekConfig.baseURL,timeout:deepSeekConfig.timeoutMs,maxRetries:0});
  this.record=options?.record??defaultRecorder;this.sleep=options?.sleep??defaultSleep;
 }

 private async completion(messages:OpenAI.Chat.Completions.ChatCompletionMessageParam[],usage:Usage){
  for(let attempt=0;;attempt++){
   try{
    const response=await this.client.chat.completions.create({model:deepSeekConfig.model,messages,response_format:{type:"json_object"},max_tokens:deepSeekConfig.maxOutputTokens,stream:false});
    usage.inputTokens+=response.usage?.prompt_tokens??0;usage.outputTokens+=response.usage?.completion_tokens??0;usage.totalTokens+=response.usage?.total_tokens??0;
    if(response.choices[0]?.finish_reason==="length")throw new Error("length");
    const content=response.choices[0]?.message.content;if(!content)throw new Error("empty_output");return content;
   }catch(error){
    if(!isRetryable(error)||attempt>=deepSeekConfig.maxRetries)throw error;
    usage.retryCount++;await this.sleep(250*2**attempt);
   }
  }
 }

 private async parse<T>(operation:Operation,prompt:string,schema:z.ZodType<T>,contract:string){
  const started=Date.now();const usage:Usage={inputTokens:0,outputTokens:0,totalTokens:0,retryCount:0,repairCount:0};let success=false;
  const system=`你是 BrandScope 的结构化分析服务。只输出一个合法 JSON 对象，不要 Markdown、解释或代码围栏。JSON 必须严格符合：${contract}`;
  try{
   const raw=await this.completion([{role:"system",content:system},{role:"user",content:prompt}],usage);
   let first:{success:true;data:T}|{success:false;error:z.ZodError}|null=null;try{first=schema.safeParse(parseJson(raw));}catch{first=null;}
   if(first?.success){success=true;return first.data;}
   usage.repairCount=1;
   const issues=first&&!first.success?first.error.issues.slice(0,8).map(item=>`${item.path.join(".")}: ${item.message}`).join("；"):"返回内容不是合法 JSON 对象";
   const repairPrompt=`以下内容未通过结构校验。只修复 JSON 语法、字段类型和缺失字段，不增加输入中没有的事实。只返回修复后的 JSON 对象。\n校验要求：${contract}\n问题：${issues}\n待修复内容：${raw.slice(0,12000)}`;
   const repaired=await this.completion([{role:"system",content:system},{role:"user",content:repairPrompt}],usage);
   let result:{success:true;data:T}|{success:false;error:z.ZodError};try{result=schema.safeParse(parseJson(repaired));}catch{throw new Error("schema_invalid");}
   if(!result.success)throw new Error("schema_invalid");success=true;return result.data;
  }catch(error){
   if(error instanceof OpenAI.AuthenticationError)throw new Error("DeepSeek API Key 无效，请检查服务端环境变量。");
   if(error instanceof OpenAI.RateLimitError)throw new Error("DeepSeek 请求过于频繁，请稍后重试。");
   if(error instanceof OpenAI.APIConnectionError)throw new Error("暂时无法连接 DeepSeek 服务，请稍后重试。");
   if(error instanceof OpenAI.NotFoundError)throw new Error("当前账号无法使用所配置的 DeepSeek 模型，请通过 /models 查询可用模型后重试。");
   if(error instanceof Error&&error.message==="length")throw new Error("DeepSeek 输出超出长度限制，请缩小研究范围后重试。");
   if(error instanceof OpenAI.APIError)throw new Error("DeepSeek 服务暂时无法完成请求，请稍后重试。");
   throw new Error("DeepSeek 返回内容未通过结构校验，请重试。");
  }finally{
   this.record({provider:"deepseek",model:deepSeekConfig.model,operation,elapsedMs:Date.now()-started,...usage,costEstimate:"暂未估算",success});
  }
 }

 async generateResearch(request:Parameters<LLMProvider["generateResearch"]>[0]){
  const parsed=await this.parse<ResearchResponse>("research",request.prompt,researchResponseSchema,contracts.research);const byId=new Map(request.sources.map(item=>[item.sourceId,item]));
  const modules=parsed.modules.map(module=>({...module,sources:module.sourceIds.map(id=>byId.get(id)).filter((item):item is NonNullable<typeof item>=>Boolean(item))}));
  if(modules.some(module=>module.sources.length===0))throw new Error("DeepSeek 未能为所有研究模块关联有效来源，请重试。");return modules;
 }
 async generateInsights(request:Parameters<LLMProvider["generateInsights"]>[0]){const parsed=await this.parse<InsightResponse>("insights",request.prompt,insightResponseSchema,contracts.insights);return parsed.insights.map(item=>({...item,status:"SUGGESTED" as const}));}
 async generateBrief(request:Parameters<LLMProvider["generateBrief"]>[0]){const parsed=await this.parse<BriefResponse>("brief",request.prompt,briefResponseSchema,contracts.brief);return{...parsed,markdown:briefToMarkdown(request.project.brandName,parsed)};}
}
