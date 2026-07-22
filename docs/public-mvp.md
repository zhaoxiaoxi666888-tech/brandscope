# BrandScope v1.1 Public MVP

## 范围

- 三个 Benchmark 对所有访客公开只读。
- 邮箱登录用户可创建私人项目并提交最多 8 个公开网页 URL。
- 每个项目最多生成一次 Research、一次 Insights、一次 Brief。
- 每位用户每天最多创建 2 个项目；全站每日 AI 调用次数由环境变量控制。

## 安全边界

- 所有私人数据查询同时约束 Supabase 用户 ID 与项目 ID。
- PostgreSQL 业务表启用 RLS 且不创建公开策略，anon key 无法绕过 Next.js API 直接读取业务数据。
- Benchmark 写操作固定返回 HTTP 403。
- Evidence Layer 仅允许 HTTP/HTTPS，解析 DNS 后阻止本机、内网、链路本地地址与危险重定向。
- 网页内容被视为不可信材料；模型密钥仅从服务端环境变量读取。
- 生成结果通过 JSON 解析与 Zod Schema 校验后才写入数据库；失败不覆盖旧数据。

## 成本保护

- `PUBLIC_DAILY_AI_CALL_LIMIT` 控制全站每日最多生成调用数，默认 30。
- `GenerationRun` 记录 provider、model、输入/输出 Token、耗时、状态和截断后的失败原因。
- 达到限额时返回“今日公开体验额度已用完”，不会回退 Mock。

## 明确不做

自动搜索、RAG、多 Agent、团队、计费、社媒监控与复杂权限不在 v1.1 范围内。
