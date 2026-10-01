import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const versions = await db.getGenerationVersions(projectId, user.id);

    return NextResponse.json({
      versions,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load versions";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const body = await req.json();
    const { projectId, versionNumber, prompt, code, planJson, parentVersionId, glbUrl, snapshotJson } = body;

    if (!projectId || !versionNumber || !code) {
      return NextResponse.json(
        { error: "projectId, versionNumber, and code are required" },
        { status: 400 }
      );
    }

    const version = await db.saveGenerationVersion({
      userId: user.id,
      projectId,
      versionNumber,
      prompt: prompt || `Version ${versionNumber}`,
      code,
      planJson: planJson || {},
      parentVersionId,
      glbUrl,
      snapshotJson,
    });

    return NextResponse.json({
      success: true,
      version,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save version";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
