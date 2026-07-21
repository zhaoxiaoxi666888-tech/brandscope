# BrandScope v1.0.0 — Public Benchmark Demo

BrandScope 是面向品牌营销、海外营销和 GTM 从业者的证据驱动 AI 品牌研究工作台。

## 本版本包含

- Evidence → Research → Insights → Brand Brief 完整工作流
- URL 正文提取、清洗、去重、分级和稳定 Evidence ID
- 品牌研究六模块、人工确认洞察、九章节品牌营销简报与 Markdown 导出
- Mock、OpenAI、DeepSeek 可切换 LLM Provider
- JSON 结构化输出、Zod 校验、有限重试与失败不覆盖
- Apple 中国、Anker 德国、Dyson 中国三个固定 Benchmark
- 25 条具体 Evidence、18 条 Insights，11 条可直接保留
- 无需登录与 API Key 的公开只读 Demo

## Benchmark 结论

- Apple：B-
- Anker：B+
- Dyson：B+
- 三份 Brief 均为“修改后可以讨论”

## Demo

https://brandscope-eta.vercel.app

## AI 与 Evidence 架构

公开网页正文经 Evidence Layer 清洗后进入 Research/Insight/Brief 服务，模型通过统一 LLMProvider 调用，返回 JSON 经 Zod 验证后才允许保存。公开 Demo 使用固定快照，不执行实时搜索或付费模型调用。

## 已知限制

- SQLite 仅用于本地单用户模式
- 付费墙、反爬和动态网页可能无法提取
- 来源分级、事实和 AI 推断仍需人工核验
- 公开 Demo 禁止所有写操作

## 本地运行

```bash
pnpm install
cp .env.example .env
pnpm setup
pnpm dev
```

完整说明见 README。
