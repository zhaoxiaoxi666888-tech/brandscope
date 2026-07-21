import OpenAI from "openai";
const apiKey=process.env.DEEPSEEK_API_KEY;if(!apiKey)throw new Error("缺少 DEEPSEEK_API_KEY，请先在本地 .env 配置。");
const client=new OpenAI({apiKey,baseURL:process.env.DEEPSEEK_BASE_URL||"https://api.deepseek.com",maxRetries:0,timeout:15_000});
const models=await client.models.list();console.log(models.data.map(item=>item.id).sort().join("\n"));
