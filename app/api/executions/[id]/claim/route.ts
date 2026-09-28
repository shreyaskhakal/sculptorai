import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { db } from "@/lib/supabase/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const { id } = params;
    let blenderVersion = "4.x";
    try {
      const body = await req.json();
      if (body?.blenderVersion) blenderVersion = body.blenderVersion;
    } catch {
      // Body optional
    }

    const claimed = await db.claimExecutionById(id, user.id, blenderVersion);
    if (!claimed) {
      return NextResponse.json(
        { error: "Task not found, already claimed, or already processed" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      execution: claimed,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to claim execution task";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
