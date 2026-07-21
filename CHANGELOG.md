# 更新记录

## Sprint 5 Benchmark Dataset v2

- 固定 Apple 中国、Anker 德国、Dyson 中国三个回归案例。
- 仅使用具体文章或报告 URL，排除首页、联系页、搜索页和栏目页。
- 每个案例使用至少 8 条成功 Evidence 重新生成 Research、Insights 和 Brief。
- 新增 `docs/brand-quality-report-v2.md`。

## DeepSeek Provider

- 新增 `AI_PROVIDER=deepseek`，保留 Mock 与 OpenAI Provider
- 使用 DeepSeek OpenAI-compatible Chat Completions JSON Output
- 复用 Research、Insight、Brief Zod Schema，并增加一次有限结构修复
- 增加 DeepSeek Provider 与 Provider Factory 单元测试

## Sprint 3.1

- DeepSeek 网络重试改为 Provider 内显式控制并记录实际次数
- 记录模型、耗时、Token、结构修复次数与成功状态；价格缺失时不估算成本
- 增加项目输入上限、服务端生成锁和 AI 分析模式边界提示
- Research、Insight、Brief Prompt 升级至 2.1.0

## Sprint 3

- 新增可切换的 OpenAI / Mock 模型服务与集中配置
- 新增可切换的 Brave Search / Mock 公开信息检索层
- 使用 Responses API、Zod 结构化输出、有限重试和中文错误
- 研究内容区分公开资料整理与 AI 判断，来源增加获取时间和类型
- 搜索结果按 URL 去重、限制单域数量和总来源数
- 研究生成改为成功后事务替换，失败不覆盖已有成果

## Sprint 3 Validation

- 修复真实 Provider 缺少密钥时静默回退 Mock 的验收阻断问题
- 新增真实/Mock Provider 配置回归测试
- 建立真实 AI 验收报告；因本地缺少真实密钥，本轮如实判定未通过

## 0.2.5 - 2026-07-21

- 落地统一设计 Token 与基础 UI 组件
- 增加安克德国、Dyson 中国、泡泡玛特英国三套完整演示项目
- 将 Mock Provider 明确为 MockLLMProvider，并按研究、洞察、简报拆分业务服务
- 建立版本化 Prompt 定义与三个独立 Prompt
- 建立八维度、三案例的最小 AI 质量评估
- 补齐中文产品、设计、架构、Prompt 与评估文档
- 增加 Apple 中国品牌生态研究，并纳入固定 AI 质量评估
# Sprint 4

- 新增 EvidenceService：自动查询、URL 规范化、来源排序、网页正文提取与内容去重。
- 新增项目内 Evidence 页面，展示等级、发布时间、正文长度和引用次数。
- Research 使用稳定 Evidence ID 引用网页正文；Insight 保存关联 Research 模块。
- Source 升级为项目级 Evidence，并与 Research 建立多对多关系。
- 增加 SSRF 防护、超时、响应体限制和失败不覆盖保护。
# Sprint 5

- 新增无密钥 Public Web Search Provider，并保留 Mock 与 Brave Provider。
- 自动生成品牌、市场、品类、年报、行业报告、权威媒体和竞品检索词。
- 增加来源质量、相关性、同域限制与类型配额。
- Research 自动完成 URL 发现、正文提取、Evidence 保存与 DeepSeek 生成。
- 增加代理环境支持、查询级有限重试和 GBK/GB2312 页面解码。
