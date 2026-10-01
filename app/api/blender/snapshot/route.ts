import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { db } from "@/lib/supabase/db";

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const body = await req.json();
    const { projectId, sceneName, blenderVersion, snapshot } = body;

    if (!projectId || !snapshot) {
      return NextResponse.json(
        { error: "projectId and snapshot are required" },
        { status: 400 }
      );
    }

    const saved = await db.saveSceneSnapshot({
      userId: user.id,
      projectId,
      sceneName,
      blenderVersion,
      snapshot,
    });

    return NextResponse.json({
      success: true,
      snapshot: saved,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save scene snapshot";
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
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const snapshot = await db.getLatestSceneSnapshot(projectId, user.id);

    return NextResponse.json({
      snapshot,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to get scene snapshot";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
