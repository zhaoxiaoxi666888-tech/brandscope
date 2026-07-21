import type { BriefDTO } from "./data";

type BriefContent = Pick<BriefDTO, "background" | "marketingObjective" | "positioning" | "persona" | "coreInsights" | "communication" | "contentSuggestions" | "channels" | "kpis">;

export function briefToMarkdown(brandName: string, brief: BriefContent) {
  return `# ${brandName}｜品牌营销简报\n\n## 项目背景\n${brief.background}\n\n## 营销目标\n${brief.marketingObjective}\n\n## 品牌定位\n${brief.positioning}\n\n## 目标用户\n${brief.persona}\n\n## 核心洞察\n${brief.coreInsights}\n\n## 传播方向\n${brief.communication}\n\n## 内容建议\n${brief.contentSuggestions}\n\n## 渠道建议\n${brief.channels}\n\n## 衡量指标\n${brief.kpis}\n`;
}
