import test from "node:test";
import assert from "node:assert/strict";
import { demoProjectDetail, demoProjectList, readOnlyResponse } from "../lib/demo-mode";

test("公开 Demo 只提供三个固定 Benchmark 项目",()=>{
 const projects=demoProjectList();
 assert.deepEqual(projects.map(item=>item.id),["oura-us","whoop-us","ultrahuman-in"]);
 assert.ok(projects.every(item=>item.readOnly&&item._count.research===6&&item.brief));
});

test("公开 Demo 项目包含 Research、Insights、Brief 和来源",()=>{
 for(const id of ["oura-us","whoop-us","ultrahuman-in"]){const project=demoProjectDetail(id);assert.ok(project);assert.equal(project.research.length,6);assert.ok(project.insights.length>=6);assert.ok(project.brief);assert.ok(project.sources.length>=8);}
});

test("只读阻断返回明确的 403",async()=>{
 const response=readOnlyResponse();assert.equal(response.status,403);assert.match((await response.json()).error,/公开只读/);
});
