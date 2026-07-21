import type { Insight, Project } from "@prisma/client";
import type { LLMProvider } from "./llm-provider";
import { createProvider } from "./provider-factory";
import { buildBriefPrompt, buildInsightPrompt, buildResearchPrompt } from "./prompts";
import type { ResearchOutput, SourceOutput } from "./types";

export class AIService {
  constructor(private readonly provider?: LLMProvider) {}

  private currentProvider() {
    return this.provider ?? createProvider();
  }

  generateResearch(project: Project, sources:SourceOutput[]=[] ) {
    return this.currentProvider().generateResearch({ project, sources, prompt: buildResearchPrompt(project,sources) });
  }

  generateInsights(project: Project, research: ResearchOutput[]) {
    return this.currentProvider().generateInsights({ project, research, prompt: buildInsightPrompt(project, research) });
  }

  generateBrief(project: Project, insights: Insight[]) {
    return this.currentProvider().generateBrief({ project, insights, prompt: buildBriefPrompt(project, insights) });
  }
}
