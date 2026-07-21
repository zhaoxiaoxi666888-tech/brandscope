import type { Insight,Project } from "@prisma/client"; import { AIService } from "../ai-service";
export class BriefService{constructor(private ai=new AIService()){} generate(project:Project,insights:Insight[]){return this.ai.generateBrief(project,insights)}}
export const briefService=new BriefService();
