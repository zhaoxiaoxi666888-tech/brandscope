"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client:SupabaseClient|undefined;
export function getSupabaseBrowser(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!anonKey)return null;
  client??=createClient(url,anonKey);
  return client;
}

export async function apiFetch(input:RequestInfo|URL,init:RequestInit={}){
  const supabase=getSupabaseBrowser();
  const token=supabase?(await supabase.auth.getSession()).data.session?.access_token:undefined;
  const headers=new Headers(init.headers);if(token)headers.set("authorization",`Bearer ${token}`);
  return fetch(input,{...init,headers});
}
