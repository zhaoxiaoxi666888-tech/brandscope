# BrandScope 简历与口述文案

链接占位：`GitHub：https://github.com/zhaoxiaoxi666888-tech/brandscope` ｜ `Demo：https://brandscope-eta.vercel.app`

## 1. 中文简历三条版

- 独立完成 BrandScope 的产品定义、工作流设计、AI 能力接入与迭代验收，将品牌研究重构为 Evidence → Research → Insights → Brand Brief 的可追溯流程。
- 设计 Evidence Layer 与可切换 LLM Provider，接入 DeepSeek，并以 JSON、Zod 校验、有限重试和失败不覆盖机制约束真实模型输出。
- 建立 Apple 中国、Anker 德国、Dyson 中国固定 Benchmark：整理 25 条具体 Evidence，评估 18 条洞察，其中 11 条可直接保留；发布公开只读 Demo。

## 2. 中文简历四条版

- 基于 30+ 品牌营销、海外营销与 GTM 岗位任务，定义证据驱动 AI 品牌研究工作台的 MVP 范围。
- 设计项目、六模块研究、人工确认洞察、九章节简报与 Markdown 导出的完整工作流。
- 建立网页正文提取、来源分级和 Evidence 引用机制，并接入 DeepSeek、OpenAI、Mock 可切换 Provider 与结构校验。
- 用三个固定案例完成质量回归：25 条 Evidence、18 条 Insights、11 条可直接保留，34+ 自动测试，公开 Demo 全部写操作受限。

## 3. 中文简历极简两条版

- 独立完成 BrandScope 产品定义与落地，用 Evidence → Research → Insights → Brief 工作流解决品牌研究来源分散、输出难复核的问题。
- 接入 DeepSeek 与 Evidence Layer，以三个固定 Benchmark、25 条证据和 34+ 测试建立质量基线，并发布只读作品 Demo。

## 4. 面向品牌营销岗位

- 将竞品、市场、用户与品牌资料统一为六模块研究，并让营销人员确认洞察后再生成简报，避免 AI 直接替代品牌判断。
- 围绕 Apple 中国、Anker 德国、Dyson 中国完成 25 条 Evidence 的桌面研究与质量复盘，形成可用于第一次讨论的品牌简报初稿。
- 通过固定 Benchmark 识别空泛洞察、证据不足与行动建议失真，建立“观察—判断—行动影响”的审核标准。

## 5. 面向海外营销 / GTM 岗位

- 面向跨市场研究设计品牌、市场、用户、竞品、机会与风险的统一框架，减少跨工具的信息搬运。
- 以 Anker 德国等案例验证本地市场资料到 GTM 简报的链路，并明确欧洲数据不能直接等同德国结论。
- 用来源等级、证据引用和人工确认机制提升跨市场判断的可解释性。

## 6. 面向 AI 产品岗位

- 定义非聊天式 AI 产品工作流，将模型能力约束在 Research、Insight、Brief 三个结构化任务中。
- 抽象 LLMProvider，接入 DeepSeek/OpenAI/Mock；实现 JSON 解析、Zod 校验、一次结构修复、有限重试和失败不覆盖。
- 建立固定 Benchmark 与质量评估框架，以洞察保留率和 Brief 可讨论性衡量 AI 价值，而非只看生成成功率。

## 7. 30 秒面试口述版

BrandScope 是我围绕品牌营销真实工作流做的 AI 品牌研究工作台。它不是聊天机器人，而是把公开网页整理成 Evidence，再生成六模块 Research，由用户确认 Insights，最后形成 Brand Brief。我接入了 DeepSeek 和可切换 Provider，并用 Apple、Anker、Dyson 三个固定案例做质量验收。目前公开 Demo 是安全的只读版本，25 条 Evidence 产生了 18 条洞察，其中 11 条可以直接保留。

## 8. 2 分钟项目介绍版

我在分析品牌营销、海外营销和 GTM 工作时发现，真正耗时的不是写一段文案，而是在搜索、AI、Notion、Excel 和 PPT 之间搬运资料，并判断哪些结论可信。所以我把 BrandScope 定位为证据驱动的品牌研究工作台，而不是 ChatGPT 套壳。

产品只有一条主流程：Evidence → Research → Insights → Brand Brief。Evidence Layer 抓取并清洗公开网页正文，Research 把信息组织成六个固定模块，AI 生成候选洞察，但是否确认、修改或删除由用户决定；Brief 只能使用已确认洞察。

工程上，我保持了简单架构：Next.js、TypeScript、Prisma 与 SQLite，并抽象 LLMProvider，让 Mock、OpenAI 和 DeepSeek 可以切换。模型输出必须是 JSON，并通过 Zod 校验；网络失败、结构错误或重复点击都不会覆盖已有成功数据。

我没有用“看起来不错”作为验收，而是固定 Apple 中国、Anker德国、Dyson 中国三个 Benchmark，整理 25 条具体 Evidence，逐项评估 Research、18 条 Insights 和三份 Brief。最终 11 条洞察可直接保留，三份 Brief 均达到修改后可以讨论。公开 Demo 为只读快照，不调用付费 AI。这一项目主要证明了我能把业务问题收敛为产品工作流，并建立 AI 质量与安全边界。
