import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { dbCollaboration } from "@/lib/supabase/db-collaboration";
import { ProjectRole } from "@/lib/security/rbac";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const { id: projectId, memberId } = params;
    const body = await req.json();
    const { role } = body;

    if (!role || !["owner", "editor", "commenter", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    const updated = await dbCollaboration.updateRole(
      projectId,
      memberId,
      role as ProjectRole,
      user.id
    );

    if (!updated) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, member: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update member role";
    const status = msg.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const { id: projectId, memberId } = params;

    const removed = await dbCollaboration.removeMember(
      projectId,
      memberId,
      user.id
    );

    if (!removed) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to remove member";
    const status = msg.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
