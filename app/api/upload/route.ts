import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { sanitizeFilename } from "@/lib/security/sanitize";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const rateCheck = checkRateLimit(`upload_${user.id}`, { maxRequests: 20 });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many uploads. Please wait a moment." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "reference-images";
    const projectId = (formData.get("projectId") as string) || "default";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 10MB limit." },
        { status: 400 }
      );
    }

    // 2. Validate MIME type
    const validMimes = ["image/png", "image/jpeg", "image/webp", "image/jpg"];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Only PNG, JPEG, and WebP are supported." },
        { status: 400 }
      );
    }

    const safeName = `${Date.now()}_${sanitizeFilename(file.name)}`;
    const storagePath = `${user.id}/${projectId}/${safeName}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Supabase Storage integration
    const supabase = createAdminClient();
    let url = "";

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(storagePath);
        url = publicUrlData.publicUrl;
      } else {
        // Fallback data URI for local dev if bucket not provisioned
        url = `data:${file.type};base64,${buffer.toString("base64")}`;
      }
    } catch {
      url = `data:${file.type};base64,${buffer.toString("base64")}`;
    }

    return NextResponse.json({
      url,
      storagePath,
      name: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Upload failure";
    console.error("[API Upload Error]:", error);
    return NextResponse.json(
      { error: errMessage },
      { status: 500 }
    );
  }
}
