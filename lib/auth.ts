import { createClient } from "@supabase/supabase-js";

export class AuthError extends Error {
  constructor(message="请先登录后继续。",public readonly status=401){super(message);}
}

export async function requireUser(request:Request){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const value=request.headers.get("authorization")||"";
  const token=value.startsWith("Bearer ")?value.slice(7).trim():"";
  if(!url||!anonKey)throw new AuthError("登录服务尚未配置，请稍后再试。",503);
  if(!token)throw new AuthError();
  const client=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await client.auth.getUser(token);
  if(error||!data.user)throw new AuthError("登录状态已失效，请重新登录。",401);
  return{userId:data.user.id,email:data.user.email||""};
}

export function authErrorResponse(error:unknown){
  return error instanceof AuthError?Response.json({error:error.message},{status:error.status}):null;
}
