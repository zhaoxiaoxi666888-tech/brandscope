import * as cheerio from "cheerio";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// 大型年报和现代媒体页的 HTML 常包含内联数据；原始响应受 6 MB 限制，清洗后仍受 4,500 Token 限制。
const MAX_BYTES=6_000_000;
const MAX_TOKENS=4_500;

function privateAddress(address:string){
 if(address.toLowerCase().startsWith("::ffff:"))return privateAddress(address.slice(7));
 if(isIP(address)===6)return address==="::1"||address==="::"||address.startsWith("fc")||address.startsWith("fd")||address.startsWith("fe80:");
 const parts=address.split(".").map(Number);
 return parts[0]===10||parts[0]===127||parts[0]===0||(parts[0]===169&&parts[1]===254)||(parts[0]===172&&parts[1]>=16&&parts[1]<=31)||(parts[0]===192&&parts[1]===168);
}

async function assertPublicUrl(value:string){
 const url=new URL(value);
 if(!["http:","https:"].includes(url.protocol)||url.username||url.password)throw new Error("仅支持公开的 HTTP 或 HTTPS 网页。");
 const addresses=await lookup(url.hostname,{all:true});
 if(!addresses.length||addresses.some(item=>privateAddress(item.address)))throw new Error("出于安全原因，无法访问该地址。");
 return url;
}

function clean(value:string){return value.replace(/\u00a0/g," ").replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim();}
function estimatedTokens(value:string){const cjk=(value.match(/[\u3400-\u9fff]/g)||[]).length;const other=value.length-cjk;return cjk+Math.ceil(other/4);}
function truncateTokens(value:string){if(estimatedTokens(value)<=MAX_TOKENS)return value;let low=0,high=value.length;while(low<high){const middle=Math.ceil((low+high)/2);if(estimatedTokens(value.slice(0,middle))<=MAX_TOKENS)low=middle;else high=middle-1;}return `${value.slice(0,low).trim()}\n\n[正文已按约 4,500 Token 截断]`;}

async function readLimited(response:Response,encoding="utf-8"){
 if(!response.body)return "";
 const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();throw new Error("网页内容过长，已停止读取。");}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 const ascii=new TextDecoder("latin1").decode(bytes.slice(0,4096));const declared=/charset\s*=\s*["']?([^;"'\s/>]+)/i.exec(ascii)?.[1]||encoding;const normalized=/^(gbk|gb2312)$/i.test(declared)?"gb18030":declared;
 try{return new TextDecoder(normalized).decode(bytes);}catch{return new TextDecoder().decode(bytes);}
}

function toMarkdown($:cheerio.CheerioAPI,root:ReturnType<cheerio.CheerioAPI>){
 root.find("br").replaceWith("\n");
 root.find("h1,h2,h3,h4,h5,h6,p,li,blockquote").each((_,element)=>{
  const node=$(element);const tag=element.tagName.toLowerCase();const text=clean(node.text());if(!text){node.remove();return;}
  if(/^h[1-6]$/.test(tag))node.replaceWith(`\n${"#".repeat(Number(tag[1]))} ${text}\n`);
  else if(tag==="li")node.replaceWith(`\n- ${text}`);
  else if(tag==="blockquote")node.replaceWith(`\n> ${text}\n`);
  else node.replaceWith(`\n${text}\n`);
 });
 return clean(root.text());
}

export type ExtractedPage={title:string;publisher:string;publishedAt:string|null;markdown:string;description:string;tokenEstimate:number};

export class PageExtractor{
 constructor(private readonly fetcher:typeof fetch=fetch){}
 async extract(input:string):Promise<ExtractedPage>{
  let url=await assertPublicUrl(input);let response:Response|undefined;
  for(let redirects=0;redirects<4;redirects++){
   response=await this.fetcher(url,{redirect:"manual",headers:{"user-agent":"BrandScope/1.0 public-evidence-reader","accept":"text/html,text/plain"},signal:AbortSignal.timeout(10_000)});
   if(response.status>=300&&response.status<400){const location=response.headers.get("location");if(!location)break;url=await assertPublicUrl(new URL(location,url).toString());continue;}break;
  }
  if(!response?.ok)throw new Error(`网页读取失败（HTTP ${response?.status??"未知"}）。`);
  const contentType=response.headers.get("content-type")||"";if(!/text\/html|text\/plain|application\/xhtml\+xml/.test(contentType))throw new Error("该链接不是可读取的网页正文。");
  const declared=Number(response.headers.get("content-length")||0);if(declared>MAX_BYTES)throw new Error("网页内容过长，已停止读取。");
  const charset=/charset\s*=\s*["']?([^;"'\s]+)/i.exec(contentType)?.[1]||"utf-8";const raw=await readLimited(response,charset);
  if(contentType.includes("text/plain")){const markdown=truncateTokens(clean(raw));if(markdown.length<120)throw new Error("页面没有提取到足够正文。");return{title:url.hostname,publisher:url.hostname,publishedAt:null,markdown,description:markdown.slice(0,420),tokenEstimate:estimatedTokens(markdown)};}
  const $=cheerio.load(raw);
  $("script,style,noscript,nav,footer,header,aside,form,iframe,svg,canvas,template,[aria-hidden='true'],[class*='cookie' i],[id*='cookie' i],[class*='advert' i],[id*='advert' i],[class*='banner' i],[role='navigation']").remove();
  const title=clean($("meta[property='og:title']").attr("content")||$("title").first().text()||url.hostname).slice(0,240);
  const publisher=clean($("meta[property='og:site_name']").attr("content")||url.hostname).slice(0,160);
  const publishedAt=$("meta[property='article:published_time'],meta[name='date'],time[datetime]").first().attr("content")||null;
  const description=clean($("meta[name='description']").attr("content")||$("meta[property='og:description']").attr("content")||"").slice(0,700);
  const root=$("article").first().length?$("article").first():$("main").first().length?$("main").first():$("body");
  const markdown=truncateTokens(toMarkdown($,root));if(markdown.length<120)throw new Error("页面没有提取到足够正文。");
  return{title,publisher,publishedAt,markdown,description:description||markdown.slice(0,420),tokenEstimate:estimatedTokens(markdown)};
 }
}

export const pageExtractor=new PageExtractor();
