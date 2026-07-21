import type { SourceOutput } from "@/services/ai/types";
import type { SearchProvider } from "../types";

type BraveResult = { title?: string; url?: string; description?: string; profile?: { long_name?: string }; page_age?: string };
const priority: Record<SourceOutput["sourceType"], number> = { OFFICIAL: 0, INSTITUTION: 1, MEDIA: 2, COMMERCE: 3, COMMUNITY: 4, OTHER: 5 };

function classify(url: string): SourceOutput["sourceType"] {
  const host = new URL(url).hostname.toLowerCase();
  if (/\.gov\.|\.edu\.|org$/.test(host)) return "INSTITUTION";
  if (/amazon|tmall|jd\.|shop/.test(host)) return "COMMERCE";
  if (/reddit|quora|zhihu/.test(host)) return "COMMUNITY";
  return "MEDIA";
}

export class BraveSearchProvider implements SearchProvider {
  constructor(private readonly apiKey: string) {}

  async search({ project, queries, maxSources }: Parameters<SearchProvider["search"]>[0]) {
    const collected: SourceOutput[] = [];
    const seen = new Set<string>();
    const domains = new Map<string, number>();
    for (const query of queries) {
      if (collected.length >= maxSources) break;
      const url = new URL("https://api.search.brave.com/res/v1/web/search");
      url.searchParams.set("q", query);
      url.searchParams.set("count", "8");
      url.searchParams.set("safesearch", "moderate");
      const response = await fetch(url, { headers: { Accept: "application/json", "X-Subscription-Token": this.apiKey }, signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new Error(response.status === 429 ? "公开资料检索请求过于频繁，请稍后重试。" : "公开资料检索暂时失败，请稍后重试。");
      const body = await response.json() as { web?: { results?: BraveResult[] } };
      for (const item of body.web?.results ?? []) {
        if (collected.length >= maxSources) break;
        if (!item.url || !item.title || !/^https?:/.test(item.url)) continue;
        const normalized = new URL(item.url);
        normalized.hash = "";
        const key = normalized.toString();
        const domain = normalized.hostname.replace(/^www\./, "");
        if (seen.has(key) || (domains.get(domain) ?? 0) >= 3) continue;
        seen.add(key);
        domains.set(domain, (domains.get(domain) ?? 0) + 1);
        collected.push({ title: item.title, url: key, publisher: item.profile?.long_name || domain, publishedAt: item.page_age || null, retrievedAt: new Date().toISOString(), sourceType: classify(key), summary: (item.description || "公开搜索结果未提供摘要。").slice(0, 700) });
      }
    }
    const brand = project.brandName.toLowerCase();
    return collected.map((item) => ({ ...item, sourceType: item.publisher.toLowerCase().includes(brand) ? "OFFICIAL" as const : item.sourceType })).sort((a, b) => priority[a.sourceType] - priority[b.sourceType]).slice(0, maxSources);
  }
}
