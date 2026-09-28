import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { db } from "@/lib/supabase/db";

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    let blenderVersion = "4.x";
    try {
      const body = await req.json();
      if (body?.blenderVersion) blenderVersion = body.blenderVersion;
    } catch {
      // Body optional
    }

    const task = await db.claimNextExecution(user.id, blenderVersion);
    if (!task) {
      return NextResponse.json({ task: null, message: "No pending tasks available" });
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to claim next task";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
