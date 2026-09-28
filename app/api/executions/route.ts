import { NextRequest, NextResponse } from "next/server";
import { ExecutionCreateSchema } from "@/lib/validation/api";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { db } from "@/lib/supabase/db";
import { validateBlenderScript } from "@/lib/blender/validator";

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const body = await req.json();
    const parsed = ExecutionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid execution request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { generationId, blenderVersion, script, prompt } = parsed.data;

    // Safety validation before accepting execution task
    if (script) {
      const validation = validateBlenderScript(script);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: "Generated script failed security validation and cannot be queued for execution.",
            securityViolations: validation.errors,
          },
          { status: 400 }
        );
      }
    }

    // Resolve project ID (either passed in body or extracted from generation)
    const projectId = body.projectId || (await (async () => {
      const projects = await db.getProjects(user.id);
      return projects[0]?.id || "proj_default";
    })());

    const record = await db.createExecution({
      generationId,
      projectId,
      userId: user.id,
      blenderVersion: blenderVersion || "4.x",
      script: script || "",
      prompt: prompt || "Model Generation",
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create execution";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const statusFilter = searchParams.get("status") || undefined;
    const projectFilter = searchParams.get("projectId") || undefined;

    if (id) {
      const record = await db.getExecutionById(id, user.id);
      if (!record) {
        return NextResponse.json({ error: "Execution not found or access denied" }, { status: 404 });
      }
      return NextResponse.json(record);
    }

    const executions = await db.getExecutions(user.id, {
      status: statusFilter,
      projectId: projectFilter,
    });

    return NextResponse.json({ executions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch executions";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
