import assert from "node:assert/strict";
import test from "node:test";
import type { Insight, Project } from "@prisma/client";
import { AIService } from "../services/ai/ai-service";
import { MockLLMProvider } from "../services/ai/providers/mock-llm-provider";

const project: Project = {
  id:"test-project", name:"Northline 日本市场研究", brandName:"Northline", category:"户外服装",
  targetMarket:"日本", competitors:"Patagonia、Goldwin", researchObjective:"验证可修复户外服装的品牌定位。",
  status:"DRAFT", ownerId:"test-user", createdAt:new Date(), updatedAt:new Date(),
};

test("MockLLMProvider keeps generated research consistent with the project",async()=>{
  const service=new AIService(new MockLLMProvider());
  const research=await service.generateResearch(project);
  assert.equal(research.length,6);
  assert.match(research[0].summary,/Northline/);
  assert.match(research[0].summary,/日本/);
  assert.doesNotMatch(JSON.stringify(research),/Aurora Skin/);
});

test("AIService produces editable insights for every generated project",async()=>{
  const service=new AIService(new MockLLMProvider());
  const research=await service.generateResearch(project);
  const insights=await service.generateInsights(project,research);
  assert.equal(insights.length,8);
  assert.deepEqual(new Set(insights.map(item=>item.type)),new Set(["CORE","PAIN","OPPORTUNITY","RISK"]));
});

test("brief contains only confirmed insights and current project context",async()=>{
  const service=new AIService(new MockLLMProvider());
  const base={projectId:project.id,position:0,createdAt:new Date(),updatedAt:new Date(),evidence:"",sourceIds:"[]",researchModules:"[]",isInference:true};
  const insights:Insight[]=[
    {...base,id:"one",type:"CORE",content:"应进入简报",status:"CONFIRMED"},
    {...base,id:"two",type:"RISK",content:"不应进入简报",status:"SUGGESTED",position:1},
  ];
  const brief=await service.generateBrief(project,insights);
  assert.match(brief.markdown,/Northline/);
  assert.match(brief.markdown,/应进入简报/);
  assert.doesNotMatch(brief.markdown,/不应进入简报/);
});
