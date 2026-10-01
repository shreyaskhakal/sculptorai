import { NextRequest, NextResponse } from "next/server";
import { getMarketplaceTemplateBySlug, incrementTemplateDownloads } from "@/lib/supabase/db-marketplace";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { db } from "@/lib/supabase/db";
import { validateBlenderScript } from "@/lib/blender/validator";
import { broadcastTaskCreated } from "@/lib/realtime/broadcast";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, props: RouteParams) {
  try {
    const { slug } = await props.params;
    const { user, error: authError } = await getAuthenticatedUser(request);
    const userId = user?.id || "guest_user";

    const body = await request.json().catch(() => ({}));
    const { projectId, versionId, parameterValues } = body;

    const template = await getMarketplaceTemplateBySlug(slug);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Resolve version
    const version = versionId
      ? template.versions.find((v: any) => v.id === versionId || v.version === versionId)
      : template.versions[0];

    if (!version) {
      return NextResponse.json({ error: "Specified version not found" }, { status: 404 });
    }

    // Parameter substitution: prepend parameter variable overrides if provided
    let finalScript = version.script;
    if (parameterValues && typeof parameterValues === "object") {
      const paramAssignments = Object.entries(parameterValues)
        .map(([key, val]) => {
          const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "");
          const safeVal = typeof val === "string" ? JSON.stringify(val) : String(val);
          return `${safeKey} = ${safeVal}`;
        })
        .join("\n");

      finalScript = `# === Applied Parameters ===\n${paramAssignments}\n# ==========================\n\n${finalScript}`;
    }

    // Run security validator
    const validation = validateBlenderScript(finalScript);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Template script failed safety validation.",
          securityViolations: validation.errors,
        },
        { status: 422 }
      );
    }

    // Target project resolution
    let targetProjectId = projectId;
    if (!targetProjectId) {
      const userProjects = await db.getProjects(userId);
      targetProjectId = userProjects[0]?.id || "proj_default";
    }

    // Increment download metrics
    await incrementTemplateDownloads(template.id, userId);

    // Create execution task in database
    const execution = await db.createExecution({
      generationId: `mkt_${template.slug}_${Date.now()}`,
      projectId: targetProjectId,
      userId,
      blenderVersion: "4.x",
      script: finalScript,
      prompt: `Applied Template: ${template.title} (v${version.version})`,
    });

    // Broadcast task.created to Supabase Realtime
    await broadcastTaskCreated({
      taskId: execution.id,
      projectId: targetProjectId,
      generationId: execution.generationId,
      blenderVersion: execution.blenderVersion,
      prompt: execution.prompt,
      script: execution.script,
      createdAt: execution.createdAt,
    });

    return NextResponse.json({
      success: true,
      executionId: execution.id,
      projectId: targetProjectId,
      template: {
        id: template.id,
        title: template.title,
        version: version.version,
      },
      script: finalScript,
    });
  } catch (error: any) {
    console.error("POST /api/marketplace/templates/[slug]/use error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to use template" },
      { status: 500 }
    );
  }
}
