export type ProjectDTO = {
  id: string; name: string; brandName: string; category: string; targetMarket: string;
  competitors: string; researchObjective: string; status: string; createdAt: string; updatedAt: string;
  _count?: { research: number; insights: number }; brief?: { id: string } | null;
  readOnly?: boolean;
};

export type SourceDTO = { id: string; title: string; url: string; publisher: string; publishedAt: string | null; retrievedAt: string; sourceType: string; summary: string; content:string; qualityGrade:string; extractionStatus:string; enabled:boolean; _count?:{research:number} };
export type ResearchDTO = { id: string; module: string; title: string; summary: string; keyFacts:string; marketSignals:string; inference: string; marketingMeaning:string; limitations:string; status: string; position: number; sources: SourceDTO[] };
export type InsightDTO = { id: string; type: string; content: string; evidence:string; researchModules:string; status: string; position: number };
export type BriefDTO = { id: string; background: string; marketingObjective: string; positioning: string; persona: string; coreInsights: string; communication: string; contentSuggestions: string; channels: string; kpis: string; gtmStrategy?: string; competitorMatrix?: string; userJourney?: string; overseasChannels?: string; kolStrategy?: string; localizationPlan?: string; northStarMetrics?: string; pricingEconomics?: string; growthExperiments?: string; userInterviewPlan?: string; markdown: string; updatedAt: string };
export type ProjectDetailDTO = ProjectDTO & { sources:SourceDTO[]; research: ResearchDTO[]; insights: InsightDTO[]; brief: BriefDTO | null };

export const moduleMeta = [
  ["BRAND_CONTEXT", "品牌背景"],
  ["MARKET_SIGNALS", "市场信号"],
  ["TARGET_AUDIENCE", "目标用户"],
  ["CUSTOMER_PAINS", "用户痛点"],
  ["COMPETITOR_POSITIONING", "竞品定位"],
  ["OPPORTUNITIES_RISKS", "机会与风险"],
] as const;
