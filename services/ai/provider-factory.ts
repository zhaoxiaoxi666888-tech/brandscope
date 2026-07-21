import type { LLMProvider } from "./llm-provider";
import { MockLLMProvider } from "./providers/mock-llm-provider";
import { OpenAILLMProvider } from "./providers/openai-llm-provider";
import { DeepSeekLLMProvider } from "./providers/deepseek-llm-provider";

export type ProviderName = "mock"|"openai"|"deepseek";

export function createProvider(name: string | undefined = process.env.AI_PROVIDER): LLMProvider {
  switch (name || "mock") {
    case "openai": {
      if (!process.env.OPENAI_API_KEY) throw new Error("真实 AI 模式缺少 OPENAI_API_KEY，请在服务端环境变量中配置后重试。");
      return new OpenAILLMProvider(process.env.OPENAI_API_KEY);
    }
    case "deepseek": {
      if (!process.env.DEEPSEEK_API_KEY) throw new Error("DeepSeek 模式缺少 DEEPSEEK_API_KEY，请在服务端环境变量中配置后重试。");
      return new DeepSeekLLMProvider(process.env.DEEPSEEK_API_KEY,{baseURL:process.env.DEEPSEEK_BASE_URL});
    }
    case "mock": return new MockLLMProvider();
    default: throw new Error(`不支持的 AI Provider：${name}`);
  }
}
