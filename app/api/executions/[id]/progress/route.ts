import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { db } from "@/lib/supabase/db";
import { broadcastExecutionProgress } from "@/lib/realtime/broadcast";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const executionId = params.id;
    const body = await req.json();
    const { percent, stage, message } = body;

    const execution = await db.getExecutionById(executionId, user.id);
    if (!execution) {
      return NextResponse.json({ error: "Execution task not found" }, { status: 404 });
    }

    // Broadcast realtime progress event
    await broadcastExecutionProgress({
      executionId,
      projectId: execution.projectId,
      percent: typeof percent === "number" ? percent : 50,
      stage: stage || "Running",
      message: message || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record progress";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
