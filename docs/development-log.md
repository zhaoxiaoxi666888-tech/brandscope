# BrandScope 开发记录

| 阶段 | 主要交付 | 关键判断 |
|---|---|---|
| MVP | Project、Research、Insights、Brief 与 Markdown 导出 | 先验证单一工作闭环，不做企业 SaaS |
| UX 打磨 | 工作型首页、Research 工作区、Insights 决策区、咨询式 Brief | 从营销感转向工具感 |
| Mock AI | LLMProvider、Mock Provider、独立 Prompt 与 Schema | 无 Key 也能完整运行和测试 |
| DeepSeek | Chat Completions、JSON 解析、Zod、有限修复与重试 | 不把具体模型写进页面或业务流程 |
| Validation | 固定案例、模块评分、洞察去留、Brief 评价 | 生成成功不等于工作价值 |
| Evidence Layer | 网页正文提取、清洗、去重、分级、ID 引用 | 输入质量优先于继续扩写 Prompt |
| Benchmark v2 | Apple、Anker、Dyson；25 条具体 Evidence | 固定案例才能比较迭代效果 |
| Public Demo | 三案例只读快照、写接口 403 | 不暴露密钥、不产生费用、不伪装实时 AI |
| Deployment | GitHub 公开仓库与 Vercel Production | SQLite 留在本地，线上不做复杂迁移 |

## v1.0.0

BrandScope 已形成适合求职展示的公开版本：核心链路完整、三个 Benchmark 可浏览、质量结果有记录、测试与安全边界明确。项目仍是个人作品与产品验证，不宣称已商业化。

## 主要失败与修正

1. **Mock 来源过于完整：**界面可运行但无法证明研究价值；改为真实模型和固定验收。
2. **搜索摘要与首页充当 Evidence：**内容空泛且不可核验；升级为具体文章正文。
3. **洞察数量优先：**出现“市场竞争激烈”等套话；改为逐条保留/修改/删除。
4. **线上 SQLite 风险：**无状态环境无法稳定写入；公开部署改为只读快照。

## 长期维护原则

- 产品价值优先于工程复杂度
- Provider 可替换，页面与业务流程保持稳定
- 新能力必须通过固定 Benchmark 回归
- 不确定性和失败如实记录，不用流畅文案掩盖
