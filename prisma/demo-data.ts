import type { BriefOutput, ResearchOutput } from "../services/ai/types";
import { briefToMarkdown } from "../app/lib/brief-markdown";
import benchmarkProjects from "./demo-data-v3.json";

export type DemoInsight = {
  type: "CORE" | "PAIN" | "OPPORTUNITY" | "RISK";
  content: string;
  status: "CONFIRMED" | "SUGGESTED";
};

export type GtmBriefFields = {
  gtmStrategy: string;
  competitorMatrix: string;
  userJourney: string;
  overseasChannels: string;
  kolStrategy: string;
  localizationPlan: string;
  northStarMetrics: string;
  pricingEconomics: string;
  growthExperiments: string;
  userInterviewPlan: string;
};

export type DemoProject = {
  id: string;
  name: string;
  brandName: string;
  category: string;
  targetMarket: string;
  competitors: string;
  researchObjective: string;
  status: string;
  research: ResearchOutput[];
  insights: DemoInsight[];
  brief: BriefOutput & GtmBriefFields;
};

// Benchmark v3 是面向海外 GTM 面试展示的只读快照。
// JSON 只保存结构化结果；来源由 benchmark-dataset-v3 独立管理，避免模型输出伪造 URL。
export const demoProjects = (benchmarkProjects as unknown as DemoProject[]).map(project=>({
  ...project,
  brief:{...project.brief,markdown:briefToMarkdown(project.brandName,project.brief)},
}));
