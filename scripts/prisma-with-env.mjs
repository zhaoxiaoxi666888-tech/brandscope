import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const binary=resolve(process.cwd(),"node_modules/.bin",process.platform==="win32"?"prisma.cmd":"prisma");
const result=spawnSync(binary,process.argv.slice(2),{stdio:"inherit",env:process.env});
process.exit(result.status??1);
