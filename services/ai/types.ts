import type { Insight, Project } from "@prisma/client";

export type SourceOutput = {
  sourceId?: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
  summary: string;
  content?: string;
  qualityGrade?: "A" | "B" | "C" | "D";
  extractionStatus?: "PENDING" | "SUCCESS" | "FAILED";
  retrievedAt: string;
  sourceType: "OFFICIAL" | "INSTITUTION" | "MEDIA" | "COMMERCE" | "COMMUNITY" | "OTHER";
};

export type ResearchOutput = {
  module: string;
  title: string;
  summary: string;
  inference: string;
  keyFacts?: string;
  marketSignals?: string;
  marketingMeaning?: string;
  limitations?: string;
  sources: SourceOutput[];
};

export type InsightOutput = {
  type: "CORE" | "PAIN" | "OPPORTUNITY" | "RISK";
  content: string;
  evidence?: string;
  researchModules?: string[];
  status: "SUGGESTED";
};

export type BriefOutput = {
  background: string;
  marketingObjective: string;
  positioning: string;
  persona: string;
  coreInsights: string;
  communication: string;
  contentSuggestions: string;
  channels: string;
  kpis: string;
  markdown: string;
};

export type ResearchRequest = { project: Project; prompt: string; sources: SourceOutput[] };
export type InsightRequest = { project: Project; research: Array<Pick<ResearchOutput, "module" | "title" | "summary" | "inference">>; prompt: string };
export type BriefRequest = { project: Project; insights: Insight[]; prompt: string };
