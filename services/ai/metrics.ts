import { AsyncLocalStorage } from "node:async_hooks";

export type AiMetric={inputTokens:number;outputTokens:number;elapsedMs:number};
const storage=new AsyncLocalStorage<AiMetric[]>();
export const recordAiMetric=(metric:AiMetric)=>{storage.getStore()?.push(metric);};
export async function captureAiMetrics<T>(work:()=>Promise<T>){
  const items:AiMetric[]=[];const value=await storage.run(items,work);
  return{value,metrics:{inputTokens:items.reduce((n,x)=>n+x.inputTokens,0),outputTokens:items.reduce((n,x)=>n+x.outputTokens,0),elapsedMs:items.reduce((n,x)=>n+x.elapsedMs,0)}};
}
