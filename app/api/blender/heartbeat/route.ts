import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { db } from "@/lib/supabase/db";
import { broadcastBlenderHeartbeat } from "@/lib/realtime/broadcast";

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const body = await req.json();
    const {
      deviceId,
      deviceName,
      blenderVersion,
      addonVersion,
      status,
      currentProjectId,
      currentExecutionId,
    } = body;

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }

    const device = await db.recordBlenderHeartbeat({
      userId: user.id,
      deviceId,
      deviceName,
      blenderVersion,
      addonVersion,
      status: status || "IDLE",
      currentProjectId,
      currentExecutionId,
    });

    // Realtime broadcast of device health & status
    await broadcastBlenderHeartbeat({
      deviceId,
      deviceName: deviceName || "Blender Desktop",
      blenderVersion: blenderVersion || "4.x",
      addonVersion: addonVersion || "1.1.0",
      status: (status || "IDLE") as any,
      currentProjectId,
      currentExecutionId,
      lastSeen: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      device,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record heartbeat";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
