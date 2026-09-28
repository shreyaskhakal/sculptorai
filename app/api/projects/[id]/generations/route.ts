import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { db } from "@/lib/supabase/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: statusCode || 401 });
    }

    const { id } = params;
    const project = await db.getProjectById(id, user.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    const generations = await db.getGenerations(id, user.id);

    return NextResponse.json({
      projectId: id,
      generations,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve generations";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
