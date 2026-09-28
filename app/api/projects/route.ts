import { NextRequest, NextResponse } from "next/server";
import { ProjectCreateSchema } from "@/lib/validation/api";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const { user, error, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: statusCode || 401 });
    }

    const projects = await db.getProjects(user.id);
    return NextResponse.json({ projects });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch projects";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: statusCode || 401 });
    }

    const body = await req.json();
    const parsed = ProjectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid project parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, description, blenderVersion } = parsed.data;

    const newProject = await db.createProject({
      userId: user.id,
      name,
      description: description || "",
      blenderVersion: blenderVersion || "4.x",
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create project";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
