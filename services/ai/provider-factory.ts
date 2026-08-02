import type { LLMProvider } from "./llm-provider";
import { MockLLMProvider } from "./providers/mock-llm-provider";
import { OpenAILLMProvider } from "./providers/openai-llm-provider";
import { DeepSeekLLMProvider } from "./providers/deepseek-llm-provider";

export type ProviderName = "mock"|"openai"|"deepseek";

export function resolveProviderName(name: string | undefined = process.env.AI_PROVIDER):ProviderName {
  const selected=name||(process.env.OPENAI_API_KEY?"openai":"mock");
  if(selected==="openai"&&!process.env.OPENAI_API_KEY)return "mock";
  if(selected==="mock"||selected==="openai"||selected==="deepseek")return selected;
  throw new Error(`不支持的 AI Provider：${selected}`);
}

export function createProvider(name: string | undefined = process.env.AI_PROVIDER): LLMProvider {
  switch (resolveProviderName(name)) {
    case "openai": {
      return new OpenAILLMProvider(process.env.OPENAI_API_KEY!);
    }
    case "deepseek": {
      if (!process.env.DEEPSEEK_API_KEY) throw new Error("DeepSeek 模式缺少 DEEPSEEK_API_KEY，请在服务端环境变量中配置后重试。");
      return new DeepSeekLLMProvider(process.env.DEEPSEEK_API_KEY,{baseURL:process.env.DEEPSEEK_BASE_URL});
    }
    case "mock": return new MockLLMProvider();
  }
}
