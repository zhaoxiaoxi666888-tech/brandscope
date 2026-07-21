# BrandScope 技术架构

```mermaid
flowchart TD
  UI["Next.js 页面 / API"] --> ES["Evidence Layer"]
  ES --> SP["SearchProvider"]
  ES --> PE["PageExtractor"]
  UI --> AS["AI Service"]
  AS --> LP["LLMProvider"]
  LP --> DS["DeepSeek"]
  LP --> OA["OpenAI"]
  LP --> MK["Mock"]
  AS --> Z["Zod Schema"]
  Z --> DB["Prisma / SQLite"]
```

## AI 数据链路

```mermaid
flowchart LR
  W["真实公开网页"] --> X["正文提取"]
  X --> C["Evidence 清洗与限长"]
  C --> L["DeepSeek Provider"]
  L --> J["JSON 结构化输出"]
  J --> Z["Zod 校验"]
  Z --> S["成功后事务写入"]
```

## 部署模式

| 环境 | 数据 | 可写 | AI |
|---|---|---:|---|
| 本地 | Prisma + SQLite | 是 | Mock / DeepSeek / OpenAI |
| Vercel 公开 Demo | 内置 Benchmark 快照 | 否 | 不发起付费请求 |

`PUBLIC_DEMO_MODE=true` 或 Vercel 运行环境会启用只读模式。读取路由不依赖 SQLite，写入路由统一返回 HTTP 403。API Key 只在服务端 Provider 中读取。
