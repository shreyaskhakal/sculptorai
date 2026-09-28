import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { db } from "@/lib/supabase/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const { id } = params;
    const record = await db.getExecutionById(id, user.id);
    if (!record) {
      return NextResponse.json({ error: "Execution not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch execution";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
