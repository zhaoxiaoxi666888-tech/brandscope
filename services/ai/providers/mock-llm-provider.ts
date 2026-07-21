import { briefToMarkdown } from "@/app/lib/brief-markdown";
import type { LLMProvider } from "../llm-provider";

const source = (slug: string, title: string, market: string) => ({
  title,
  url: `https://example.com/brandscope-mock/${slug}`,
  publisher: "BrandScope 模拟研究资料",
  publishedAt: "2026-06-01",
  retrievedAt: new Date().toISOString(),
  sourceType: "OTHER" as const,
  summary: `用于演示 ${market} 市场研究结构的模拟来源，不代表实时检索结果。`,
});

export class MockLLMProvider implements LLMProvider {
  async generateResearch({ project }: Parameters<LLMProvider["generateResearch"]>[0]) {
    const { brandName: brand, category, targetMarket: market, competitors, researchObjective } = project;
    const competitor = competitors.split(/[,，、]/).map(item => item.trim()).find(Boolean) || "同类品牌";
    return [
      { module:"BRAND_CONTEXT", title:`${brand} 需要把产品特点转化为清晰的品牌角色`, summary:`${brand} 正在研究 ${market} 的 ${category} 市场。当前最重要的不是增加更多卖点，而是围绕“${researchObjective}”建立一致、容易理解的品牌背景与进入理由。`, sources:[source("brand-context","品牌背景模拟资料",market)] },
      { module:"MARKET_SIGNALS", title:`${market} 市场正在奖励更明确、更可信的价值表达`, summary:`${category} 消费者面对大量相似选择，更依赖清晰定位、具体使用场景与可信证据降低决策成本。${brand} 应优先验证哪些市场信号与研究目标直接相关。`, sources:[source("market-signals",`${market}${category}市场信号模拟资料`,market)] },
      { module:"TARGET_AUDIENCE", title:`优先用户是有明确任务、但缺少确定方案的人`, summary:`首批目标用户不应只按人口属性定义。更有效的切入方式是识别正在主动比较 ${category}、对现有选择不满意，并愿意为更高确定性付费的人群。`, sources:[source("target-audience","目标用户模拟访谈摘要",market)] },
      { module:"CUSTOMER_PAINS", title:`用户真正需要解决的是选择成本与结果不确定性`, summary:`用户痛点通常不仅是功能缺失，还包括难以比较、难以信任以及不知道哪种方案适合自己。${brand} 需要把复杂信息整理成可验证、可行动的选择依据。`, sources:[source("customer-pains","用户痛点模拟研究",market)] },
      { module:"COMPETITOR_POSITIONING", title:`与 ${competitor} 的差异必须落到用户能够感知的取舍`, summary:`竞品对比不应停留在功能清单。${brand} 需要说明自己为谁服务、舍弃什么，以及在什么场景下比 ${competitor} 更值得被选择。`, sources:[source("competitor-positioning","竞品定位模拟扫描",market)] },
      { module:"OPPORTUNITIES_RISKS", title:`机会来自聚焦，风险来自缺少证据的泛化表达`, summary:`${brand} 的机会是围绕研究目标建立一个具体、可复述的市场位置；主要风险是把通用品类趋势误当成自身优势，或在缺少证据时做出过强承诺。`, sources:[source("opportunities-risks","机会与风险模拟评估",market)] },
    ].map(item=>({...item,inference:"AI 推断：该判断用于演示结构，真实执行前需要通过公开来源与用户研究进一步验证。"}));
  }

  async generateInsights({ project }: Parameters<LLMProvider["generateInsights"]>[0]) {
    const { brandName: brand, category, targetMarket: market, competitors } = project;
    const competitor = competitors.split(/[,，、]/).map(item => item.trim()).find(Boolean) || "主流竞品";
    return [
      { type:"CORE" as const, content:`${brand} 的增长机会不在于增加更多卖点，而在于让 ${market} 用户更快理解为什么选择它。`, status:"SUGGESTED" as const },
      { type:"CORE" as const, content:`清晰的使用场景和可信证据，比宽泛的“高品质”表达更能形成品牌记忆。`, status:"SUGGESTED" as const },
      { type:"PAIN" as const, content:`${category} 用户面对大量相似信息，难以判断哪种方案真正适合自己。`, status:"SUGGESTED" as const },
      { type:"PAIN" as const, content:`用户对营销承诺保持警惕，需要更具体、可验证的选择依据。`, status:"SUGGESTED" as const },
      { type:"OPPORTUNITY" as const, content:`围绕一个高频决策场景建立内容与体验，可以降低用户理解 ${brand} 的成本。`, status:"SUGGESTED" as const },
      { type:"OPPORTUNITY" as const, content:`通过与 ${competitor} 的明确取舍对比，建立更聚焦的品牌位置。`, status:"SUGGESTED" as const },
      { type:"RISK" as const, content:`如果定位覆盖过多用户和场景，${brand} 可能再次落入同质化表达。`, status:"SUGGESTED" as const },
      { type:"RISK" as const, content:`模拟研究不能替代真实市场证据，进入执行前必须验证关键判断。`, status:"SUGGESTED" as const },
    ];
  }

  async generateBrief({ project, insights }: Parameters<LLMProvider["generateBrief"]>[0]) {
    const confirmed = insights.filter(item => item.status === "CONFIRMED").sort((a,b) => a.position-b.position);
    const coreInsights = confirmed.map(item => `- ${item.content}`).join("\n");
    const brief = {
      background:`${project.brandName} 计划研究 ${project.targetMarket} 的 ${project.category} 市场。${project.researchObjective}`,
      marketingObjective:`建立 ${project.brandName} 清晰、可信且容易被目标用户理解的品牌认知，并验证首个高潜市场切入点。`,
      positioning:`面向正在主动比较 ${project.category}、但缺少确定选择依据的用户，提供更聚焦、更容易行动的品牌方案。`,
      persona:`身处 ${project.targetMarket}、正在主动寻找 ${project.category} 解决方案，并愿意为更低决策成本和更高确定性付费的早期用户。`,
      coreInsights,
      communication:`让复杂选择变得清晰，让品牌价值变得可信。`,
      contentSuggestions:`1. 核心使用场景与真实问题\n2. 与主流选择的明确取舍\n3. 关键证据与验证过程\n4. 用户从比较到决策的完整路径`,
      channels:`优先选择目标用户主动研究与比较 ${project.category} 的渠道，再用自有内容承接信任与转化。`,
      kpis:`研究内容完成率、核心信息理解度、目标行动转化率、有效反馈数量、复访与持续关注率。`,
      markdown:"",
    };
    brief.markdown = briefToMarkdown(project.brandName, brief);
    return brief;
  }
}
