import { PrismaClient } from "@prisma/client";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();
const prisma=new PrismaClient();
const tables=["Project","Research","Source","Insight","Brief","GenerationRun","DailyBudget","_ResearchToSource"];

try{
  for(const table of tables)await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
  console.log(`已为 ${tables.length} 张业务表启用 RLS（无公开策略）`);
}finally{
  await prisma.$disconnect();
}
