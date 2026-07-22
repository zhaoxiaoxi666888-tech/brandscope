# BrandScope v1.1.0 — Public MVP

BrandScope 从只读作品 Demo 升级为受控的公开真实研究 MVP，同时保留三个无需登录即可浏览的只读 Benchmark。

## 主要变化

- Supabase PostgreSQL 持久化与邮箱 Auth。
- 私人项目按用户隔离，Benchmark 服务端固定只读。
- 用户手动提交最多 8 个公开 Evidence URL。
- Research、Insights、Brief 各限一次真实生成。
- 每用户每日 2 个项目、全站每日 AI 调用预算与数据库幂等记录。
- GenerationRun 记录模型、Token、耗时、状态和失败原因。
- 全部业务表启用 RLS 且不向 anon key 开放直接访问。
- SSRF 防护、正文限长、结构化输出校验与失败不覆盖保持生效。

## 部署边界

公开 Benchmark 不触发付费模型。私人研究只读取用户提交的公开网页，不执行自动搜索；达到额度后明确停止，不回退模拟结果。
