import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const { status, device } = await db.getBlenderDeviceStatus(user.id);

    return NextResponse.json({
      status,
      device,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to get device status";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
