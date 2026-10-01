import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const summary = await db.getAiUsageSummary(user.id);

    return NextResponse.json({
      success: true,
      usage: summary,
      plan: {
        tier: "PRO",
        monthlyAllowance: 500,
        remainingGenerations: Math.max(0, 500 - summary.totalGenerations),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load usage";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
