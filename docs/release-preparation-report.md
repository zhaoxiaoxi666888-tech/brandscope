# BrandScope 发布准备报告

## 部署方案

公开环境仅提供 Apple 中国、Anker 德国和 Dyson 中国三个只读 Benchmark 快照。公开页面不依赖 SQLite 持久化，不需要 AI 或搜索密钥；所有写入和生成接口在服务端返回 403。本地开发模式保留完整的 SQLite、Evidence 和 DeepSeek 工作流。

## Demo 与资料

- 首页直达三个 Benchmark 项目，无需登录或等待模型。
- 项目包含完整 Research、Insights 和 Brief，Brief 可复制与下载 Markdown。
- 资料链接来自 Benchmark Dataset v2 的具体文章或报告，不使用 `example.com` 占位链接。
- 30 条 Benchmark URL 自动检查中 27 条可直接访问，3 条 Omdia 链接返回 403，属站点访问策略限制，需人工复核。

## 质量门禁

- `pnpm lint`：通过，无警告。
- `pnpm typecheck`：通过。
- `pnpm test`：34/34 通过。
- `pnpm build`：通过，Next.js 生产构建成功。
- 公开 API：三个项目和 Markdown 导出返回 200，项目创建返回 403。
- 密钥审计：`.env`、`.env.local` 和 SQLite 文件均被 Git 忽略，源码未检出密钥模式。

## 当前发布阻塞

当前本地仓库没有 Git commit、GitHub remote 或 Vercel 登录凭据，因此未能生成公开 URL。代码与部署配置已就绪，账号侧操作见 [Vercel 部署指南](deployment.md)。

## 已知限制

- 公开 Demo 是只读快照，不执行实时 AI 或网页抓取。
- 部分站点可因反爬、付费墙或地区策略不能直接打开。
- SQLite 仅支持本地单用户模式，不承诺 Vercel 线上写入持久化。
