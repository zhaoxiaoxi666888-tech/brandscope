import type { SearchProvider } from "./types";
import { MockSearchProvider } from "./providers/mock-search-provider";
import { BraveSearchProvider } from "./providers/brave-search-provider";
import { PublicWebSearchProvider } from "./providers/public-web-search-provider";

export function createSearchProvider(name=process.env.SEARCH_PROVIDER||"mock"):SearchProvider {
  if (name === "mock") return new MockSearchProvider();
  if (name === "public") return new PublicWebSearchProvider();
  if (name === "web") {
    if (!process.env.BRAVE_SEARCH_API_KEY) throw new Error("真实公开信息检索缺少 BRAVE_SEARCH_API_KEY，请在服务端环境变量中配置后重试。");
    return new BraveSearchProvider(process.env.BRAVE_SEARCH_API_KEY);
  }
  throw new Error(`不支持的搜索 Provider：${name}`);
}
