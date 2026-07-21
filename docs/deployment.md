# Vercel 部署指南

## 部署策略

Vercel 只部署只读 Benchmark Demo。`vercel.json` 已设置 `PUBLIC_DEMO_MODE=true`，公开访问不需要 SQLite 持久化、DeepSeek Key 或 Search Key。所有写接口在服务端返回 403。

## Dashboard 操作

1. 将代码推送到 GitHub 新仓库。
2. 打开 Vercel Dashboard，点击 **Add New… → Project**。
3. 在 **Import Git Repository** 选择 BrandScope 仓库。
4. Framework Preset 保持 **Next.js**，Root Directory 保持仓库根目录。
5. 不添加 DeepSeek、OpenAI 或 Brave 密钥。
6. 确认 `PUBLIC_DEMO_MODE=true`；它已写入 `vercel.json`。
7. 点击 **Deploy**。
8. 部署完成后依次打开首页、三个 Benchmark 项目和 Markdown 下载。

如果在 Vercel Dashboard 修改环境变量，需要重新部署才会应用新值。
