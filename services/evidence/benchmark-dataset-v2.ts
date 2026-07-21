import type { Project } from "@prisma/client";
import type { SourceOutput } from "@/services/ai/types";

type BenchmarkCase={brand:string;aliases?:string[];market:string;urls:Array<{title:string;url:string;sourceType:SourceOutput["sourceType"]}>};

// Benchmark v2 只保存具体文章或报告 URL，不把首页、搜索页和栏目页当作 Evidence。
export const benchmarkDatasetV2:BenchmarkCase[]=[
 {brand:"Apple",market:"中国",urls:[
  {title:"Apple 2024 Form 10-K",url:"https://www.sec.gov/Archives/edgar/data/320193/000032019324000123/aapl-20240928.htm",sourceType:"INSTITUTION"},
  {title:"Introducing Apple Intelligence",url:"https://www.apple.com/newsroom/2024/06/introducing-apple-intelligence-for-iphone-ipad-and-mac/",sourceType:"OFFICIAL"},
  {title:"Apple Intelligence is available today",url:"https://www.apple.com/newsroom/2024/10/apple-intelligence-is-available-today-on-iphone-ipad-and-mac/",sourceType:"OFFICIAL"},
  {title:"Apple Services set records in 2025",url:"https://www.apple.com/newsroom/2026/01/2025-marked-a-record-breaking-year-for-apple-services/",sourceType:"OFFICIAL"},
  {title:"Apple introduces iPhone 16 and iPhone 16 Plus",url:"https://www.apple.com/newsroom/2024/09/apple-introduces-iphone-16-and-iphone-16-plus/",sourceType:"OFFICIAL"},
  {title:"Apple debuts iPhone 16 Pro and iPhone 16 Pro Max",url:"https://www.apple.com/newsroom/2024/09/apple-debuts-iphone-16-pro-and-iphone-16-pro-max/",sourceType:"OFFICIAL"},
  {title:"China Smartphone Market Share: Quarterly",url:"https://counterpointresearch.com/en/insights/china-smartphone-share",sourceType:"INSTITUTION"},
  {title:"China Smartphone Shipments Slip in Q4 2025",url:"https://counterpointresearch.com/en/insights/China-Smartphone-Shipments-Q4-2025",sourceType:"INSTITUTION"},
  {title:"China premium smartphone market in 2024",url:"https://www.counterpointresearch.com/insight/post-insight-research-notes-blogs-chinas-smartphone-market-premiumization-trend-continues-to-strengthen-in-2024/",sourceType:"INSTITUTION"},
  {title:"Omdia Mainland China smartphone market 3Q25",url:"https://omdia.tech.informa.com/pr/2025/oct/omdia-mainland-chinas-smartphone-market-declined-3percent-in-3q25-as-vivo-regained-top-position-amid-intensifying-competition",sourceType:"INSTITUTION"},
  {title:"Omdia Mainland China smartphone market 2025",url:"https://omdia.tech.informa.com/pr/2026/jan/mainland-chinas-smartphone-market-declined-1eprcent-in-2025-as-huawei-reclaimed-the-top-spot-after-five-years",sourceType:"INSTITUTION"},
  {title:"Omdia global smartphone market 2025",url:"https://omdia.tech.informa.com/pr/2026/jan/global-smartphone-market-grew-2percent-in-2025-while-memory-headwinds-set-the-stage-for-a-challenging-2026",sourceType:"INSTITUTION"},
 ]},
 {brand:"Anker",aliases:["安克","安克创新"],market:"德国",urls:[
  {title:"Anker 2024 Annual Report",url:"https://vip.stock.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?id=11056541",sourceType:"INSTITUTION"},
  {title:"安克创新2025半年报欧洲市场摘要",url:"https://finance.sina.com.cn/tech/roll/2025-08-29/doc-infnrnmi7403856.shtml",sourceType:"MEDIA"},
  {title:"安克创新亮相 IFA 2025",url:"http://jjckb.xinhuanet.com/20250905/c0693225e5664ba295d51cb0a773dfc0/c.html",sourceType:"MEDIA"},
  {title:"Anker GaN Ladegeräte Leitfaden",url:"https://www.anker.com/eu-de/blogs/ladegerate/gan-charger",sourceType:"OFFICIAL"},
  {title:"Schnellladen erklärt",url:"https://www.anker.com/eu-de/blogs/ladegerate/schnellladen-erklaert",sourceType:"OFFICIAL"},
  {title:"Schnellladegerät für iPhone",url:"https://www.anker.com/eu-de/blogs/ladegerate/schnellladegerat-fur-iphone",sourceType:"OFFICIAL"},
  {title:"Das neue Anker",url:"https://www.anker.com/eu-de/blogs/das-wichtigste-auf-einen-blick/das-neue-anker",sourceType:"OFFICIAL"},
  {title:"TechRadar Soundcore Liberty 5 Pro review",url:"https://www.techradar.com/audio/wireless-headphones/anker-soundcore-liberty-5-pro-review",sourceType:"MEDIA"},
  {title:"TechRadar best tech of 2025",url:"https://www.techradar.com/tech/the-best-tech-of-2025-so-far-the-17-finest-gadgets-weve-tested-this-year",sourceType:"MEDIA"},
 ]},
 {brand:"Dyson",market:"中国",urls:[
  {title:"Dyson 2024 financial results",url:"https://www.dyson.co.uk/discover/news/press-releases/dyson-financial-results-2024",sourceType:"OFFICIAL"},
  {title:"戴森机主服务与中国用户体验",url:"https://www.dyson.cn/newsroom_list/dyson-care",sourceType:"OFFICIAL"},
  {title:"戴森中国室内呼吸需求研究",url:"https://www.dyson.cn/newsroom_list/breath-free",sourceType:"OFFICIAL"},
  {title:"戴森中国官方售后服务",url:"https://www.dyson.cn/repair-services",sourceType:"OFFICIAL"},
  {title:"戴森的可持续发展之旅",url:"https://www.dyson.cn/sustainability.html",sourceType:"OFFICIAL"},
  {title:"第一财经：高端吹风机消费研究",url:"https://www.yicai.com/news/5240793.html",sourceType:"MEDIA"},
  {title:"第一财经：中国清洁电器与戴森",url:"https://www.yicai.com/news/102055379.html",sourceType:"MEDIA"},
  {title:"36氪：高端吹风机市场",url:"https://36kr.com/p/1391342843493125",sourceType:"MEDIA"},
  {title:"艾媒：中国个人护理用品市场",url:"https://www.iimedia.cn/c1061/112544.html",sourceType:"INSTITUTION"},
 ]},
];

export function getBenchmarkSources(project:Project):SourceOutput[]{
 const name=project.brandName.toLowerCase();
 const entry=benchmarkDatasetV2.find(item=>[item.brand,...(item.aliases||[])].some(alias=>name.includes(alias.toLowerCase()))&&project.targetMarket.includes(item.market));
 if(!entry)return[];
 return entry.urls.map(item=>({...item,publisher:new URL(item.url).hostname.replace(/^www\./,""),publishedAt:null,retrievedAt:new Date().toISOString(),summary:`BrandScope Benchmark Dataset v2：${item.title}`}));
}
