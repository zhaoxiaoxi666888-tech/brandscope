# Sprint 5 Report — Automatic Evidence Discovery

## 目标

用户只提供品牌名称、品类、目标市场和竞品后，系统自动生成检索词、发现公开 URL、筛选高质量来源、调用 Sprint 4 Evidence Layer 提取正文，并由 DeepSeek 生成 Research 与建议 Insight。

本轮没有修改 Prompt、数据库结构或 UI 风格，也没有加入聊天、Agent、RAG、登录和向量数据库。

## 架构

```text
Project
→ buildSearchQueries
→ SearchProvider
→ PublicWebSearchProvider / BraveSearchProvider / MockSearchProvider
→ EvidenceService.discover
→ PageExtractor
→ EvidenceStore
→ ResearchService
→ DeepSeekProvider
→ Research + Insights
```

## 搜索关键词

每个项目最多生成七类查询：

- 品牌 + 目标市场 + official
- 品牌 + 目标市场 + 品类焦点 + official
- 品牌 + 目标市场 + 品类焦点 + 产品/用户
- 品牌 + annual report / investor relations / PDF
- 品牌 + 目标市场 + industry report
- 品牌 + 目标市场 + Reuters / Bloomberg
- 品牌 + 竞品 + 目标市场 + positioning

品类焦点会移除“高端、市场、产品、设备、电器、行业、消费”等通用词，避免 Dyson 个护研究被清洁电器页面淹没。

## 搜索 Provider

- `SEARCH_PROVIDER=public`：无需密钥的公开网页发现 Provider。
- `SEARCH_PROVIDER=web`：保留已有 Brave Search Provider，适合对稳定性要求更高的环境。
- `SEARCH_PROVIDER=mock`：保留自动化测试和演示模式。

Public Provider 会遵循标准 HTTP/HTTPS/ALL_PROXY 环境，不记录代理地址或任何密钥。单个查询失败最多重试一次；部分查询失败时保留已发现结果，只有所有查询都失败才终止。

## 质量筛选

候选来源按以下顺序处理：

1. 品牌官网
2. 政府、监管机构、正式披露与行业研究
3. 权威媒体

过滤社交平台、内容农场、百科镜像、电商聚合和明显低质量域名。每个查询同域只取一个候选，全局同域最多三个，防止单一站点占满结果。

来源通过品牌相关性以及目标市场、品类焦点或年报主题进行过滤。官方、机构、媒体分别设置数量配额。最多保存八条成功 Evidence；送入单次分析的 Evidence Bundle 取质量与市场相关性最高的三条，单条最多使用约 7,000 字符。完整 Markdown 仍保存在数据库中。

## Evidence 与 Research

搜索结果 snippet 只用于初筛，不直接发送给 DeepSeek。所有候选 URL 都先经过 Sprint 4 PageExtractor：安全 URL 校验、正文抓取、导航/广告/Cookie 清洗、Markdown 转换与长度控制。

Evidence 会先保存，再调用 DeepSeek。Research 每个模块必须返回已存在的 Evidence ID；结构校验或模型调用失败不会覆盖上一版 Research。

## 固定案例验收

### Apple｜中国

- 自动发现成功：6 条 Evidence
- 送模 Evidence：3 条
- 六个 Research：成功
- Insights：成功
- Mock 引用：0

代表来源包括 Apple 中国官网、Apple Support、Apple Newsroom 与公开行业研究页面。

### 安克创新｜德国

- 自动发现成功：5 条 Evidence
- 送模 Evidence：3 条
- 六个 Research：成功（一次结构失败后人工重试成功）
- Insights：成功
- Mock 引用：0

代表来源包括安克创新官网、新华社经济参考网与公开年度报告页面。

### Dyson｜中国

- 自动发现成功：5 条 Evidence
- 送模 Evidence：3 条
- 六个 Research：成功
- Insights：成功
- Mock 引用：0

代表来源包括 Dyson 中国官网、官方 Newsroom、公司披露页面和权威媒体。

## 测试

自动化测试覆盖：

- 七类检索词
- Public Provider 无密钥构造
- URL 解析与去重
- 官网优先
- 单查询同域限制
- 来源类型配额
- Evidence 正文清洗与截断
- DeepSeek Schema 校验
- 失败不覆盖旧数据
- Mock 测试不访问真实模型

完整 lint、typecheck、test 和 build 结果以交付汇报为准。

## 当前限制

- 无密钥 Public Provider 依赖公开搜索页面，稳定性与服务条款可用性不如正式 Search API。
- PDF 财报 URL 可以被发现，但当前 PageExtractor 只处理 HTML 和纯文本，PDF 正文提取仍是 P1。
- 相关性判断为确定性规则，不等同于人工研究判断。
- DeepSeek 结构化输出仍有偶发失败；Provider 已进行一次结构修复，但个别案例可能需要用户重试。
