export const projectFieldLimits={name:120,brandName:100,category:100,targetMarket:100,competitors:500,researchObjective:1200} as const;
export const sanitizeUserText=(value:string)=>value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,"").replace(/</g,"＜").replace(/>/g,"＞").trim();
export function validateProjectInput(body:Record<string,unknown>){
 const required=["name","brandName","category","targetMarket","researchObjective"] as const;
 if(required.some(key=>typeof body[key]!=="string"||!body[key].trim()))return"请完整填写所有必填字段。";
 for(const [field,limit] of Object.entries(projectFieldLimits))if(String(body[field]??"").length>limit)return`输入内容过长，请将${field}控制在 ${limit} 个字符以内。`;
 return null;
}
