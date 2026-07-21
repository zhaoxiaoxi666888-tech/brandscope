import test from "node:test";
import assert from "node:assert/strict";
import { PageExtractor } from "../services/evidence/page-extractor";

test("PageExtractor 清除导航、广告、Cookie、脚本并返回 Markdown",async()=>{
 const html=`<!doctype html><html><head><title>Apple 测试页面</title><meta property="og:site_name" content="Apple"><meta name="description" content="Apple 页面描述"></head><body><header>顶部导航</header><nav>产品导航</nav><div class="cookie-banner">接受 Cookie</div><main><h1>Apple Intelligence</h1><p>这是一段用于验证官网正文提取的内容，包含足够长度并应当被保留。品牌团队可以据此核验页面信息和来源关系。</p><h2>隐私设计</h2><p>系统通过设备端处理与明确权限控制帮助用户理解数据使用方式，相关内容仅作为网页证据，不会被当成系统指令执行。</p></main><aside class="advert">广告</aside><footer>页脚</footer><script>危险脚本</script></body></html>`;
 const fetcher:typeof fetch=async()=>new Response(html,{status:200,headers:{"content-type":"text/html; charset=utf-8"}});
 const result=await new PageExtractor(fetcher).extract("https://93.184.216.34/apple");
 assert.equal(result.title,"Apple 测试页面");assert.equal(result.publisher,"Apple");assert.match(result.markdown,/# Apple Intelligence/);assert.match(result.markdown,/## 隐私设计/);assert.doesNotMatch(result.markdown,/顶部导航|产品导航|Cookie|广告|页脚|危险脚本/);
});

test("PageExtractor 将超长正文限制在约 4500 Token",async()=>{
 const html=`<html><body><main><h1>长页面</h1><p>${"品牌研究正文内容。".repeat(6000)}</p></main></body></html>`;
 const fetcher:typeof fetch=async()=>new Response(html,{status:200,headers:{"content-type":"text/html"}});
 const result=await new PageExtractor(fetcher).extract("https://93.184.216.34/long");
 assert.ok(result.tokenEstimate<=4550);assert.match(result.markdown,/正文已按约 4,500 Token 截断/);
});
