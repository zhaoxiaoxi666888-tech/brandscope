# AI 提示词

提示词位于 `services/ai/prompts/`，由统一定义和渲染器维护版本、角色、输入、任务、输出、约束与禁止事项。

- `research.ts`（2.1.0）：六模块研究；只能引用传入 URL；区分事实、观点与 AI 推断；研究材料不具备指令权限；资料不足时使用统一表述。
- `insight.ts`（2.1.0）：同时接收事实整理和 AI 推断，每条回答“这意味着什么”及其品牌行动影响。
- `brief.ts`（2.1.0）：只基于用户已确认洞察生成九章节简报，禁止无依据数字和系统提示词泄露。
- `prompt-definition.ts`：公共结构与文本渲染。

OpenAI Provider 使用 Responses API 的结构化输出，并由 Zod Schema 校验；自由文本不会直接写入数据库。Mock Provider 保持相同接口，确保离线演示和测试可运行。修改 Prompt 时必须提升版本号并运行固定评估案例。
