import test from "node:test";
import assert from "node:assert/strict";
import { createProvider } from "../services/ai/provider-factory";
import { createSearchProvider } from "../services/search/provider-factory";

test("真实模式缺少密钥时明确失败，不静默回退 Mock", () => {
  const openAIKey = process.env.OPENAI_API_KEY;
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;
  const deepSeekKey = process.env.DEEPSEEK_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.BRAVE_SEARCH_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  try {
    assert.throws(() => createProvider("openai"), /缺少 OPENAI_API_KEY/);
    assert.throws(() => createSearchProvider("web"), /缺少 BRAVE_SEARCH_API_KEY/);
    assert.throws(() => createProvider("deepseek"), /缺少 DEEPSEEK_API_KEY/);
  } finally {
    if (openAIKey) process.env.OPENAI_API_KEY = openAIKey;
    if (braveKey) process.env.BRAVE_SEARCH_API_KEY = braveKey;
    if (deepSeekKey) process.env.DEEPSEEK_API_KEY = deepSeekKey;
  }
});

test("Provider Factory 可以选择 DeepSeek，且构造过程不调用网络", () => {
  const original = process.env.DEEPSEEK_API_KEY;
  process.env.DEEPSEEK_API_KEY = "test-only";
  try { assert.equal(createProvider("deepseek").constructor.name,"DeepSeekLLMProvider"); }
  finally { if(original)process.env.DEEPSEEK_API_KEY=original;else delete process.env.DEEPSEEK_API_KEY; }
});

test("Mock 模式不需要密钥", () => {
  assert.doesNotThrow(() => createProvider("mock"));
  assert.doesNotThrow(() => createSearchProvider("mock"));
});

test("公开网页发现模式不需要密钥且不会在构造时调用网络",()=>{assert.equal(createSearchProvider("public").constructor.name,"PublicWebSearchProvider");});
