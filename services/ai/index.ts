import { AIService } from "./ai-service";

export { AIService } from "./ai-service";
export { createProvider } from "./provider-factory";
export type { LLMProvider } from "./llm-provider";

export const aiService = new AIService();
