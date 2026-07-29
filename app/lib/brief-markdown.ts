import type { BriefDTO } from "./data";

type LegacyBriefContent = Pick<
  BriefDTO,
  | "background"
  | "marketingObjective"
  | "positioning"
  | "persona"
  | "coreInsights"
  | "communication"
  | "contentSuggestions"
  | "channels"
  | "kpis"
>;

type GtmBriefContent = Pick<
  BriefDTO,
  | "gtmStrategy"
  | "competitorMatrix"
  | "userJourney"
  | "overseasChannels"
  | "kolStrategy"
  | "localizationPlan"
  | "northStarMetrics"
  | "pricingEconomics"
  | "growthExperiments"
  | "userInterviewPlan"
>;

type BriefContent = LegacyBriefContent & Partial<GtmBriefContent>;

type MatrixRow = { dimension: string; own: string; competitors: string[] };
type ChannelRow = { platform: string; priority: string; role: string };
type KolRow = { tier: string; platform: string; role: string; budgetShare: string; selection: string };

function safeParseArray<T>(value: string | undefined, fallback: T[] = []): T[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function renderCompetitorMatrix(raw: string | undefined): string {
  const rows = safeParseArray<MatrixRow>(raw);
  if (!rows.length) return "";
  const lines = ["| 维度 | 本品 | 竞品对比 |", "| --- | --- | --- |"];
  for (const row of rows) {
    lines.push(`| ${escapeCell(row.dimension)} | ${escapeCell(row.own)} | ${escapeCell(row.competitors.join(" / "))} |`);
  }
  return lines.join("\n");
}

function renderOverseasChannels(raw: string | undefined): string {
  const rows = safeParseArray<ChannelRow>(raw);
  if (!rows.length) return "";
  const lines = ["| 平台 | 优先级 | 角色 |", "| --- | --- | --- |"];
  for (const row of rows) {
    lines.push(`| ${escapeCell(row.platform)} | ${escapeCell(row.priority)} | ${escapeCell(row.role)} |`);
  }
  return lines.join("\n");
}

function renderKolStrategy(raw: string | undefined): string {
  const rows = safeParseArray<KolRow>(raw);
  if (!rows.length) return "";
  const lines = ["| 层级 | 平台 | 合作模式 | 预算配比 | 筛选标准 |", "| --- | --- | --- | --- | --- |"];
  for (const row of rows) {
    lines.push(
      `| ${escapeCell(row.tier)} | ${escapeCell(row.platform)} | ${escapeCell(row.role)} | ${escapeCell(row.budgetShare)} | ${escapeCell(row.selection)} |`
    );
  }
  return lines.join("\n");
}

function renderGrowthExperiments(raw: string | undefined): string {
  const rows = safeParseArray<{ hypothesis: string; method: string; success: string }>(raw);
  if (!rows.length) return "";
  const lines = ["| 假设 | 验证方法 | 成功标准 |", "| --- | --- | --- |"];
  for (const row of rows) {
    lines.push(`| ${escapeCell(row.hypothesis)} | ${escapeCell(row.method)} | ${escapeCell(row.success)} |`);
  }
  return lines.join("\n");
}

function section(title: string, body: string): string {
  return body.trim() ? `\n## ${title}\n${body}\n` : "";
}

function matrixSection(title: string, raw: string | undefined, render: (value: string | undefined) => string): string {
  const rendered = render(raw);
  return rendered ? `\n## ${title}\n${rendered}\n` : "";
}

export function briefToMarkdown(brandName: string, brief: BriefContent) {
  const hasGtm = Boolean(
    brief.gtmStrategy ||
      brief.competitorMatrix ||
      brief.userJourney ||
      brief.overseasChannels ||
      brief.kolStrategy ||
      brief.localizationPlan ||
      brief.northStarMetrics ||
      brief.pricingEconomics ||
      brief.growthExperiments ||
      brief.userInterviewPlan
  );
  const header = `# ${brandName}｜${hasGtm ? "品牌 GTM 与营销简报" : "品牌营销简报"}

## 项目背景
${brief.background}

## 营销与增长目标
${brief.marketingObjective}

## 品牌定位与价值主张
${brief.positioning}

## 目标用户
${brief.persona}

## 核心洞察
${brief.coreInsights}
`;
  const gtmBody = `${section("GTM 进入策略（0/30/60/90 天）", brief.gtmStrategy || "")}${matrixSection("竞品对比矩阵", brief.competitorMatrix, renderCompetitorMatrix)}${section("用户旅程与转化漏斗", brief.userJourney || "")}${matrixSection("海外渠道矩阵", brief.overseasChannels, renderOverseasChannels)}${matrixSection("KOL / 达人策略", brief.kolStrategy, renderKolStrategy)}${section("本地化运营", brief.localizationPlan || "")}${section("北极星指标与漏斗指标", brief.northStarMetrics || "")}${section("定价与单位经济", brief.pricingEconomics || "")}${matrixSection("上市前增长实验", brief.growthExperiments, renderGrowthExperiments)}${section("用户访谈与洞察验证", brief.userInterviewPlan || "")}`;
  const legacyBody = `## 传播方向
${brief.communication || ""}

## 内容建议
${brief.contentSuggestions || ""}

## 渠道建议
${brief.channels || ""}

## 衡量指标
${brief.kpis || ""}
`;
  return hasGtm ? header + gtmBody : header + legacyBody;
}
