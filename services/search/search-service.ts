import type { Project } from "@prisma/client";import type { SearchProvider } from "./types";import { createSearchProvider } from "./provider-factory";import { buildSearchQueries } from "./queries";
export class SearchService{constructor(private provider?:SearchProvider){}search(project:Project){const provider=this.provider??createSearchProvider();return provider.search({project,queries:buildSearchQueries(project),maxSources:Math.min(20,Math.max(6,Number(process.env.SEARCH_MAX_SOURCES||12)))})}}
export const searchService=new SearchService();
