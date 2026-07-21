import { pageExtractor, type ExtractedPage } from "./page-extractor";

// 兼容旧调用点；新的 Evidence 流程统一由 PageExtractor 返回 Markdown。
export async function extractPublicPage(input:string):Promise<ExtractedPage>{return pageExtractor.extract(input);}
export type { ExtractedPage };
