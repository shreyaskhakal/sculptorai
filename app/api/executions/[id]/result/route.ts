import { NextRequest, NextResponse } from "next/server";
import { ExecutionResultSchema } from "@/lib/validation/api";
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
    const body = await req.json();

    const parsed = ExecutionResultSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid execution result payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { status, stdout, stderr, durationMs } = parsed.data;
    const blenderVersion = body.blenderVersion || "4.x";

    const completed = await db.completeExecution(id, user.id, {
      status,
      stdout,
      stderr,
      durationMs,
      blenderVersion,
    });

    if (!completed) {
      return NextResponse.json({ error: "Execution not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      result: completed,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record execution result";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
