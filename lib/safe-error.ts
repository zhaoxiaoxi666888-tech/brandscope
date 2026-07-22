export function safeErrorMessage(error:unknown,fallback:string){
  const value=error instanceof Error?error.message:fallback;
  return value.replace(/sk-[A-Za-z0-9_-]{8,}/g,"[已隐藏]").replace(/Bearer\s+\S+/gi,"Bearer [已隐藏]").slice(0,500)||fallback;
}
