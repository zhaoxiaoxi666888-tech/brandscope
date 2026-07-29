import type { BriefOutput, ResearchOutput } from "../types";

type GtmEvaluationFields={gtmStrategy?:string;userJourney?:string;localizationPlan?:string;northStarMetrics?:string;pricingEconomics?:string;userInterviewPlan?:string};
export type EvaluationInput={projectName:string;research:ResearchOutput[];insights:Array<{content:string;status:string}>;brief:BriefOutput&GtmEvaluationFields};
export type EvaluationDimension="structureCompleteness"|"contentRelevance"|"avoidsGenericLanguage"|"insightBeyondFactRestatement"|"supportsMarketingDecision"|"briefUsesConfirmedInsights"|"noUnsupportedPreciseNumbers"|"naturalChinese";

function sharesMeaningfulPhrase(source:string,target:string){
 const pairs=Array.from({length:Math.max(0,source.length-1)},(_,index)=>source.slice(index,index+2)).filter(value=>/[\u4e00-\u9fff]{2}/.test(value));
 return pairs.filter(value=>target.includes(value)).length>=3;
}

export function evaluateOutput(input:EvaluationInput){
 const text=[...input.research.map(item=>item.title+item.summary),...input.insights.map(item=>item.content),...Object.values(input.brief)].join("\n");
 const confirmed=input.insights.filter(item=>item.status==="CONFIRMED").map(item=>item.content);
 const dimensions={
  structureCompleteness:input.research.length===6&&input.insights.length>=8&&[input.brief.background,input.brief.marketingObjective,input.brief.positioning,input.brief.persona,input.brief.coreInsights,input.brief.gtmStrategy,input.brief.userJourney,input.brief.localizationPlan,input.brief.northStarMetrics,input.brief.pricingEconomics,input.brief.userInterviewPlan].every(Boolean),
  contentRelevance:input.research.every(item=>item.summary.length>35),
  avoidsGenericLanguage:!/示例内容|待补充|众所周知|赋能|引领行业/.test(text),
  insightBeyondFactRestatement:input.insights.filter(item=>/需要|应|机会|风险|可以|来自|影响|让|会|不是|而是/.test(item.content)).length>=4,
  supportsMarketingDecision:input.insights.some(item=>/定位|内容|用户|传播|选择|品牌/.test(item.content)),
  briefUsesConfirmedInsights:confirmed.some(value=>sharesMeaningfulPhrase(value,input.brief.coreInsights)),
  noUnsupportedPreciseNumbers:!/\b\d+(?:\.\d+)?%|增长\d+|市场规模[^。]*\d+/.test(text),
  naturalChinese:input.insights.every(item=>/[\u4e00-\u9fff]/.test(item.content)&&!/[A-Za-z]{12,}/.test(item.content)),
 } satisfies Record<EvaluationDimension,boolean>;
 return{caseName:input.projectName,dimensions,passed:Object.values(dimensions).every(Boolean)};
}
