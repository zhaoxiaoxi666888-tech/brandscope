const active=new Set<string>();
export function acquireGenerationLock(key:string){if(active.has(key))return null;active.add(key);return()=>active.delete(key);}
