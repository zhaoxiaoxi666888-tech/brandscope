import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadLocalEnv(){
  const envFile=resolve(process.cwd(),".env.local");
  if(!existsSync(envFile))return;
  for(const line of readFileSync(envFile,"utf8").split(/\r?\n/)){
    const match=line.match(/^([A-Z0-9_]+)=(.*)$/);
    if(!match||process.env[match[1]])continue;
    process.env[match[1]]=match[2].trim().replace(/^(["'])(.*)\1$/,"$2");
  }
}
