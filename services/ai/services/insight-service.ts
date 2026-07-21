import type { Project } from "@prisma/client"; import type { ResearchOutput } from "../types"; import { AIService } from "../ai-service";
export class InsightService{constructor(private ai=new AIService()){} generate(project:Project,research:ResearchOutput[]){return this.ai.generateInsights(project,research)}}
export const insightService=new InsightService();
