import { NextRequest, NextResponse } from "next/server";
import { DebugRequestSchema } from "@/lib/validation/api";
import { getAIProvider } from "@/lib/ai/adapter";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { validateBlenderScript } from "@/lib/blender/validator";

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const rateKey = `dbg_${user.id}`;
    const rateCheck = checkRateLimit(rateKey, { maxRequests: 25 });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many debugging requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = DebugRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid debug payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { error, script, blenderVersion } = parsed.data;

    const ai = getAIProvider();
    const result = await ai.debugBlender({
      error,
      script,
      blenderVersion,
    });

    // Validate the corrected script safety before returning to user
    const safetyCheck = validateBlenderScript(result.correctedCode);

    return NextResponse.json({
      debugId: result.debugId,
      diagnosis: result.diagnosis,
      changes: result.changes,
      correctedCode: result.correctedCode,
      safetyWarnings: safetyCheck.warnings,
      safeToPreview: safetyCheck.safeToPreview,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Debug analysis failure";
    console.error("[API Debug Error]:", error);
    return NextResponse.json(
      { error: errMessage, code: "DEBUG_FAILED" },
      { status: 500 }
    );
  }
}
