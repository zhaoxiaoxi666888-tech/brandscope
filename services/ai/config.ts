const configuredProvider=process.env.AI_PROVIDER||(process.env.OPENAI_API_KEY?"openai":"mock");
export const aiConfig={
 provider:configuredProvider==="openai"&&!process.env.OPENAI_API_KEY?"mock":configuredProvider,
 model:process.env.OPENAI_MODEL||"gpt-5.6-terra",
 timeoutMs:Number(process.env.AI_TIMEOUT_MS||45_000),
 maxOutputTokens:Number(process.env.AI_MAX_OUTPUT_TOKENS||6_000),
 maxRetries:Math.min(2,Math.max(0,Number(process.env.AI_MAX_RETRIES||2))),
} as const;

export const deepSeekConfig={
 model:process.env.DEEPSEEK_MODEL||"deepseek-v4-flash",
 baseURL:process.env.DEEPSEEK_BASE_URL||"https://api.deepseek.com",
 timeoutMs:aiConfig.timeoutMs,
 maxOutputTokens:aiConfig.maxOutputTokens,
 maxRetries:aiConfig.maxRetries,
} as const;
