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
    const running = await db.startExecution(id, user.id);
    if (!running) {
      return NextResponse.json(
        { error: "Execution task not found or cannot be transitioned to running" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      execution: running,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to mark execution as running";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
