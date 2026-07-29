import type { Project } from "@prisma/client";
import type { SourceOutput } from "@/services/ai/types";

type BenchmarkCase={brand:string;aliases?:string[];market:string;urls:Array<{title:string;url:string;sourceType:SourceOutput["sourceType"]}>};

// Benchmark v3 只保存可公开核验的具体页面、报告或帮助文档。
// 不使用搜索页、虚构文章路径或无法核验的占位 URL。
export const benchmarkDatasetV2:BenchmarkCase[]=[
 {brand:"Oura",market:"美国",urls:[
  {title:"Oura：Sleep Score 方法说明",url:"https://support.ouraring.com/hc/en-us/articles/360025445574-Sleep-Score",sourceType:"OFFICIAL"},
  {title:"Oura：Readiness 的产品定义",url:"https://ouraring.com/blog/what-is-readiness/",sourceType:"OFFICIAL"},
  {title:"Oura：Daytime Stress 功能说明",url:"https://ouraring.com/blog/inside-the-ring-daytime-stress/",sourceType:"OFFICIAL"},
  {title:"Oura：用户健康数据保护说明",url:"https://support.ouraring.com/hc/en-us/articles/360025586673-How-Oura-Protects-Your-Data",sourceType:"OFFICIAL"},
  {title:"Oura Privacy Policy",url:"https://ouraring.com/privacy-policy",sourceType:"OFFICIAL"},
  {title:"Oura Personalized Wellness White Paper",url:"https://ouraring.com/blog/wp-content/uploads/2024/02/Oura_Innovating_Health_White_Paper_v3.pdf",sourceType:"OFFICIAL"},
  {title:"Counterpoint：全球可穿戴设备市场观察",url:"https://www.counterpointresearch.com/insights/global-wearable-band-market",sourceType:"INSTITUTION"},
  {title:"Oura Health 公司与产品背景",url:"https://en.wikipedia.org/wiki/Oura_Health",sourceType:"OTHER"},
 ]},
 {brand:"Whoop",market:"美国",urls:[
  {title:"WHOOP Recovery 官方说明",url:"https://support.whoop.com/s/article/WHOOP-Recovery",sourceType:"OFFICIAL"},
  {title:"WHOOP Recovery Impacts 官方说明",url:"https://support.whoop.com/s/article/Recovery-Insights",sourceType:"OFFICIAL"},
  {title:"WHOOP Strain 官方说明",url:"https://support.whoop.com/s/article/WHOOP-Strain?language=en_US",sourceType:"OFFICIAL"},
  {title:"WHOOP Basics 产品概览",url:"https://support.whoop.com/s/article/WHOOP-Basics",sourceType:"OFFICIAL"},
  {title:"WHOOP Membership Features & Benefits",url:"https://support.whoop.com/s/article/Membership-Features-Benefits?language=en_US",sourceType:"OFFICIAL"},
  {title:"WHOOP Full Privacy Policy",url:"https://www.whoop.com/gb/en/full-privacy-policy/",sourceType:"OFFICIAL"},
  {title:"WHOOP：How Does Recovery Work",url:"https://www.whoop.com/us/en/thelocker/how-does-whoop-recovery-work-101/",sourceType:"OFFICIAL"},
  {title:"WHOOP One Membership Plan",url:"https://www.whoop.com/us/en/one/",sourceType:"OFFICIAL"},
 ]},
 {brand:"Ultrahuman",market:"印度",urls:[
  {title:"Ultrahuman 印度产品与平台概览",url:"https://www.ultrahuman.com/in/",sourceType:"OFFICIAL"},
  {title:"Ultrahuman Annual Report 2024",url:"https://www.ultrahuman.com/documents/annual-report-2024/",sourceType:"OFFICIAL"},
  {title:"Ultrahuman：咖啡因与睡眠时间",url:"https://blog.ultrahuman.com/blog/how-caffeine-affects-your-sleep-and-when-you-should-stop-drinking-it/",sourceType:"OFFICIAL"},
  {title:"Ultrahuman：环法自行车赛睡眠与恢复",url:"https://blog.ultrahuman.com/blog/why-sleep-is-the-hardest-tour-de-france-stage-to-win/",sourceType:"OFFICIAL"},
  {title:"Ultrahuman：昼夜节律与睡眠周期",url:"https://blog.ultrahuman.com/blog/what-is-circadian-rhythm/",sourceType:"OFFICIAL"},
  {title:"Ultrahuman：可穿戴设备与睡眠呼吸管理",url:"https://blog.ultrahuman.com/blog/leveraging-wearables-for-sleep-apnea/",sourceType:"OFFICIAL"},
  {title:"Ultrahuman：睡眠规律性研究",url:"https://blog.ultrahuman.com/blog/how-an-inconsistent-sleep-schedule-takes-its-toll-on-your-body/",sourceType:"OFFICIAL"},
  {title:"Ultrahuman：印度智能穿戴知识产权声明",url:"https://blog.ultrahuman.com/blog/?p=50099",sourceType:"OFFICIAL"},
 ]},
];

export function getBenchmarkSources(project:Project):SourceOutput[]{
 const name=project.brandName.toLowerCase();
 const entry=benchmarkDatasetV2.find(item=>[item.brand,...(item.aliases||[])].some(alias=>name.includes(alias.toLowerCase()))&&project.targetMarket.includes(item.market));
 if(!entry)return[];
 return entry.urls.map(item=>({...item,publisher:new URL(item.url).hostname.replace(/^www\./,""),publishedAt:null,retrievedAt:new Date().toISOString(),summary:`BrandScope Benchmark Dataset v3：${item.title}`}));
}
