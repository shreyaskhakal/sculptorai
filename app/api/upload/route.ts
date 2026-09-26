import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { sanitizeFilename } from "@/lib/security/sanitize";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    const rateCheck = checkRateLimit(`upload_${ip}`, { maxRequests: 20 });
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
    const storagePath = `${projectId}/${safeName}`;
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
        const { data: signedData } = await supabase.storage
          .from(bucket)
          .createSignedUrl(storagePath, 3600 * 24); // 24hr signed URL

        url = signedData?.signedUrl || "";
      }
    } catch {
      // Fallback to local Data URI if Supabase bucket isn't reachable
    }

    if (!url) {
      url = `data:${file.type};base64,${buffer.toString("base64")}`;
    }

    return NextResponse.json({
      success: true,
      storagePath,
      url,
      mimeType: file.type,
      sizeBytes: file.size,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Upload error";
    console.error("[Upload API Error]:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
