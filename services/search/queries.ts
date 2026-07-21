import type { Project } from "@prisma/client";
export function buildSearchQueries(project:Project){
 const brand=project.brandName,market=project.targetMarket,category=project.category;
 const focus=category.replace(/高端|市场|产品|设备|电器|行业|消费/g,"").trim()||category;
 return [
  `${brand} ${market} official`,
  `${brand} ${market} ${focus} official`,
  `${brand} ${market} ${focus} 产品 用户`,
  `${brand} annual report investor relations PDF`,
  `${brand} ${market} ${category} industry report`,
  `${brand} ${market} Reuters Bloomberg news`,
  `${brand} ${project.competitors} ${market} market positioning`,
 ].slice(0,7);
}
