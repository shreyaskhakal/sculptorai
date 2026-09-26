import { NextResponse } from "next/server";

export async function GET() {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

  return NextResponse.json({
    status: "ok",
    database: hasSupabaseUrl ? "configured" : "offline_fallback",
    ai: hasGeminiKey ? "gemini_ready" : "fallback_mode",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
