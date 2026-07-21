import type { Project } from "@prisma/client";
import type { SourceOutput } from "@/services/ai/types";
export type SearchRequest={project:Project;queries:string[];maxSources:number};
export interface SearchProvider{search(request:SearchRequest):Promise<SourceOutput[]>}
