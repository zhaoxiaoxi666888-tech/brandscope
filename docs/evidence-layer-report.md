# Evidence Report

## 目标

本轮只建立底层 Evidence Layer：公开 URL → PageExtractor → 清洗后的 Markdown → Evidence 保存 → DeepSeek Research。没有新增 Prompt、RAG、Agent、登录或向量数据库。

## 网页抓取流程

1. 服务端接收公开 HTTP/HTTPS URL。
2. 拒绝带认证信息、回环地址、私网地址与链路本地地址。
3. 最多跟随三次重定向，每次重新执行地址安全检查。
4. 请求超时 10 秒，响应体上限约 1.5 MB。
5. PageExtractor 返回标题、发布方、发布时间、description、Markdown 和 Token 估算。
6. EvidenceService 生成项目级稳定 Evidence ID，并将结果保存到现有 Source 存储中。
7. Research 只读取数据库中已启用、提取成功且正文非空的 Evidence，不再触发 Mock Search，也不读取 snippet。

## 正文提取方式

HTML 正文优先选择 `article`，其次选择 `main`，最后回退到 `body`。标题、发布方、发布时间和 description 分别从标准 title、Open Graph、date 与 time 元数据中读取。

保留标题、段落、列表和引用的基础 Markdown 结构。纯文本页面直接规范化为空行清晰的文本。

## 清洗规则

提取前删除：

- Header、Footer、Navigation、Aside
- Script、Style、Noscript、Iframe
- 表单、SVG、Canvas、Template
- Cookie Banner
- class 或 id 可识别的广告与 Banner
- `aria-hidden` 隐藏内容

网页正文只作为研究材料，不会作为系统指令执行。

## Token 长度

使用轻量 Token 估算：中文字符按约 1 Token，其他文本按约 4 字符 1 Token。单条 Evidence 上限设置为约 4,500 Token，处于要求的 3,000–5,000 Token 区间。源页面短于上限时保留原文，不进行填充；超出时自动截断并加入明确标记。

## DeepSeek 输入格式

Research 继续通过现有 AI Service 与 LLMProvider 调用 DeepSeek。输入 Evidence 包含：

- Evidence ID
- title
- URL
- publisher
- publishedAt
- description
- 清洗后的 Markdown 正文
- retrievedAt

Prompt 文件本轮没有修改。Research 输出仍通过现有 Zod Schema 校验，失败不会覆盖旧数据。

## Apple 官网验收

测试 URL：`https://www.apple.com.cn/`

- 抓取：成功
- 标题：Apple (中国大陆) - 官方网站
- Markdown 长度：752 字符
- Token 估算：312
- Markdown 标题结构：存在
- Evidence 保存：成功
- Evidence ID：已生成并保存
- DeepSeek Research：成功
- 六个 Research 模块：成功保存
- Research 引用：仅引用已保存的 Apple 官网 Evidence

Apple 首页本身正文较短，因此低于 3,000 Token；系统不会编造或填充不存在的内容。

## 测试覆盖

- Header/Footer/Navigation/Script/广告/Cookie 清洗
- Markdown 标题与正文保留
- 约 4,500 Token 截断
- Evidence URL 去重与稳定 ID
- 正文提取失败处理
- Research 失败不覆盖旧数据
- Mock 自动化测试不调用真实 DeepSeek

## 当前限制

- 通用 HTML 提取器不执行页面 JavaScript，纯客户端渲染页面可能缺少正文。
- 付费墙、登录页面、反爬页面不会被绕过。
- Apple 首页适合验证抓取链路，但单页资料不足以支持完整市场判断；正式研究仍需要更多公开 URL。
