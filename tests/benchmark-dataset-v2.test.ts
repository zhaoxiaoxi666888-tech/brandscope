import test from "node:test";
import assert from "node:assert/strict";
import { benchmarkDatasetV2 } from "../services/evidence/benchmark-dataset-v2";

test("Benchmark v2 固定 Apple、Anker、Dyson 且每组至少 8 篇",()=>{
 assert.deepEqual(benchmarkDatasetV2.map(item=>item.brand),["Apple","Anker","Dyson"]);
 for(const item of benchmarkDatasetV2)assert.ok(item.urls.length>=8,`${item.brand} 少于 8 篇`);
});

test("Benchmark v2 不把首页、搜索页或栏目页作为 Evidence",()=>{
 const forbidden=[
  /^https:\/\/(www\.)?apple\.com\/?$/,
  /investor\.apple\.com\/(sec-filings|investor-relations)\/default\.aspx/,
  /^https:\/\/ir\.anker-in\.com\/?$/,
  /techradar\.com\/search/,
  /^https:\/\/(www\.)?(statista|canalys|gfk|euromonitor|iimedia|iresearch)\.[^/]+\/?$/,
  /^https:\/\/(www\.)?(dyson\.cn|yicai\.com|36kr\.com)\/?$/,
  /\/newsroom\/?$/,
 ];
 for(const item of benchmarkDatasetV2)for(const source of item.urls)assert.ok(!forbidden.some(pattern=>pattern.test(source.url)),source.url);
});
