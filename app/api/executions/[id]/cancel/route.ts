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
    const cancelled = await db.cancelExecution(id, user.id);
    if (!cancelled) {
      return NextResponse.json(
        { error: "Execution task cannot be cancelled or does not exist" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      execution: cancelled,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to cancel execution";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
