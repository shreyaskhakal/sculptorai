import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/adapter";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { sanitizePrompt } from "@/lib/security/sanitize";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const rateKey = `img_${user.id}`;
    const rateCheck = checkRateLimit(rateKey, { maxRequests: 15 });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many image analyses requested. Please wait a moment." },
        { status: 429 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let imageBase64 = "";
    let mimeType = "image/png";
    let userPrompt = "";
    let blenderVersion = "4.x";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("image") as File | null;
      userPrompt = (formData.get("prompt") as string) || "";
      blenderVersion = (formData.get("blenderVersion") as string) || "4.x";

      if (!file) {
        return NextResponse.json({ error: "Missing image file in request" }, { status: 400 });
      }

      // Validate size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "Image file exceeds 10MB limit" }, { status: 400 });
      }

      // Validate MIME
      mimeType = file.type || "image/png";
      const validTypes = ["image/png", "image/jpeg", "image/webp", "image/jpg"];
      if (!validTypes.includes(mimeType)) {
        return NextResponse.json(
          { error: "Unsupported image format. Please upload PNG, JPEG, or WebP." },
          { status: 400 }
        );
      }

      const buffer = await file.arrayBuffer();
      imageBase64 = Buffer.from(buffer).toString("base64");
    } else {
      const body = await req.json();
      imageBase64 = body.imageBase64 || "";
      mimeType = body.mimeType || "image/png";
      userPrompt = body.prompt || "";
      blenderVersion = body.blenderVersion || "4.x";

      if (!imageBase64) {
        return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
      }
    }

    const sanitizedPrompt = sanitizePrompt(userPrompt);

    const ai = getAIProvider();
    const result = await ai.analyzeImage({
      imageBase64,
      mimeType,
      prompt: sanitizedPrompt,
      blenderVersion,
      includeCode: true,
    });

    return NextResponse.json({
      analysisId: result.analysisId,
      objects: result.objects,
      geometrySummary: result.geometrySummary,
      materials: result.materials,
      modelingApproach: result.modelingApproach,
      proportionsObservation: result.proportionsObservation,
      uncertainties: result.uncertainties,
      code: result.code,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Image analysis failure";
    console.error("[API Image Analysis Error]:", error);
    return NextResponse.json(
      { error: errMessage, code: "IMAGE_ANALYSIS_FAILED" },
      { status: 500 }
    );
  }
}
