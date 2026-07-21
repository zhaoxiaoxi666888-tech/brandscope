import type { BriefOutput, BriefRequest, InsightOutput, InsightRequest, ResearchOutput, ResearchRequest } from "./types";

export interface LLMProvider {
  generateResearch(request: ResearchRequest): Promise<ResearchOutput[]>;
  generateInsights(request: InsightRequest): Promise<InsightOutput[]>;
  generateBrief(request: BriefRequest): Promise<BriefOutput>;
}
