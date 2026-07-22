# Vercel + Supabase 部署指南

## 部署策略

Vercel 部署公开可用 MVP。Benchmark 始终公开只读；登录用户的私人项目保存到 Supabase PostgreSQL，真实模型调用仅发生在服务端。

## Dashboard 操作

1. 将代码推送到 GitHub 新仓库。
2. 打开 Vercel Dashboard，点击 **Add New… → Project**。
3. 在 **Import Git Repository** 选择 BrandScope 仓库。
4. Framework Preset 保持 **Next.js**，Root Directory 保持仓库根目录。
5. 配置 `DATABASE_URL`、`DIRECT_URL`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`AI_PROVIDER=deepseek`、`DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`、`DEEPSEEK_BASE_URL`、`SEARCH_PROVIDER=manual` 与 `PUBLIC_DAILY_AI_CALL_LIMIT`。
6. 执行 `pnpm db:deploy` 初始化 PostgreSQL Schema；不要在生产执行 Seed。
7. 点击 **Deploy**。
8. 在 Supabase Auth URL Configuration 中，将 Site URL 设为生产地址并加入本地开发 Redirect URL。
9. 部署后验证未登录 Benchmark、邮箱登录、私人项目隔离、URL 安全检查与三段生成限额。

`.env`、`.env.local`、数据库文件和 API Key 不进入 Git。Vercel 环境变量更新后必须重新部署才会生效。
