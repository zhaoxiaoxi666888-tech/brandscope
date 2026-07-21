# AI 质量评估

评估代码位于 `services/ai/evaluation/`，测试入口为 `tests/ai-evaluation.test.ts`。固定案例覆盖安克德国、Dyson 中国和 Apple 中国品牌生态研究。

当前八个维度：结构完整性、内容相关性、避免空泛表述、洞察不只是事实复述、支持营销决策、简报引用已确认洞察、无来源确定性数字、中文表达自然。

当前采用确定性规则测试，优点是快速、免费、适合 CI；局限是不能判断事实准确性和深层策略质量。真实 AI 接入后，应保留规则门槛，并另加人工评分样表，避免用另一个模型作为唯一裁判。

真实环境验收记录见 [Sprint 3 Validation Report](sprint-3-validation-report.md)。真实密钥缺失时不得用 Mock 结果填写真实来源、质量、Token、成本或 Prompt 改善结论。
