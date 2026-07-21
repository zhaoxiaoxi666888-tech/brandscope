import type { SearchProvider } from "../types";
export class MockSearchProvider implements SearchProvider{
 async search({project}:Parameters<SearchProvider["search"]>[0]){
  const now=new Date().toISOString();
  const rows=[
   ["official","官方资料",`${project.brandName}（演示来源）`,"OFFICIAL"],
   ["market","市场观察","BrandScope 演示研究机构","INSTITUTION"],
   ["news","品牌新闻","BrandScope 演示媒体","MEDIA"],
   ["consumer","用户评价","BrandScope 演示商业平台","COMMERCE"],
   ["community","社区讨论","BrandScope 演示社区","COMMUNITY"],
   ["competitor","竞品资料","BrandScope 演示行业媒体","MEDIA"],
  ] as const;
  return rows.map(([slug,label,publisher,sourceType],index)=>({title:`演示内容｜${project.brandName}${label}`,url:`https://${index%2?"example.org":"example.com"}/brandscope-search/${project.id}/${slug}`,publisher,publishedAt:null,retrievedAt:now,sourceType,summary:`用于演示 ${project.brandName} 在 ${project.targetMarket} 的${label}证据整理流程，不代表真实搜索结果；正式研究需替换为可核验网页正文。`}));
 }
}
