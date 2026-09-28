import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { ProjectUpdateSchema } from "@/lib/validation/api";
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

    return NextResponse.json(project);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve project";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: statusCode || 401 });
    }

    const { id } = params;
    const body = await req.json();
    const parsed = ProjectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await db.updateProject(id, user.id, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update project";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: statusCode || 401 });
    }

    const { id } = params;
    const deleted = await db.deleteProject(id, user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete project";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
