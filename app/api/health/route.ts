import { NextResponse } from "next/server";

export async function GET() {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasPublicSupabaseKey = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const hasPrivilegedSupabaseKey = Boolean(
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  return NextResponse.json({
    status: "alive",
    checks: {
      databaseConfiguration:
        hasSupabaseUrl && hasPublicSupabaseKey && hasPrivilegedSupabaseKey
          ? "configured"
          : "missing_configuration",
      authenticationConfiguration:
        hasSupabaseUrl && hasPublicSupabaseKey ? "configured" : "missing_configuration",
      geminiConfiguration: hasGeminiKey ? "configured" : "missing_configuration",
      databaseConnectivity: "not_checked",
      geminiConnectivity: "not_checked",
    },
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
