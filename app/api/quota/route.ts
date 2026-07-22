import { publicQuota } from "@/lib/usage-limits";
export async function GET(){try{return Response.json(await publicQuota());}catch{return Response.json({dailyProjectLimit:2,maxEvidenceUrls:8,remainingAiCalls:0,dailyAiCallLimit:0});}}
