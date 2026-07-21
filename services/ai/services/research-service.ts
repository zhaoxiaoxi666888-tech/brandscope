import type { Project } from "@prisma/client"; import { AIService } from "../ai-service";import type { SourceOutput } from "../types";
export class ResearchService{constructor(private ai=new AIService()){} generate(project:Project,sources:SourceOutput[]){return this.ai.generateResearch(project,sources)}}
export const researchService=new ResearchService();
