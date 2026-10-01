import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { dbCollaboration } from "@/lib/supabase/db-collaboration";
import { hasPermission, ProjectRole } from "@/lib/security/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const projectId = params.id;
    const members = await dbCollaboration.getProjectMembers(projectId);

    return NextResponse.json({ members });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch members";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const projectId = params.id;
    const body = await req.json();
    const { email, role = "editor", displayName } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email address required" }, { status: 400 });
    }

    // Verify requester permission
    const requesterRole = await dbCollaboration.getUserRole(projectId, user.id);
    if (!requesterRole || !hasPermission(requesterRole, "invite_members")) {
      return NextResponse.json(
        { error: "Forbidden: Only project owners can invite new collaborators." },
        { status: 403 }
      );
    }

    const member = await dbCollaboration.addMember({
      projectId,
      userId: `usr_${Math.random().toString(36).substr(2, 8)}`,
      role: role as ProjectRole,
      userEmail: email,
      displayName,
      invitedBy: user.id,
    });

    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to invite member";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
