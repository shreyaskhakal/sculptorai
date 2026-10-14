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

    if (projectId !== "default") {
      const { db } = await import("@/lib/supabase/db");
      const project = await db.getProjectById(projectId, user.id);
      if (!project) {
        return NextResponse.json(
          { error: "Project not found or access denied" },
          { status: 404 }
        );
      }
    }

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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2b. Validate magic bytes (file signature) to prevent MIME spoofing
    const isPng = buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    const isJpeg = buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isWebp = buffer.length > 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";

    if (!isPng && !isJpeg && !isWebp) {
      return NextResponse.json(
        { error: "Invalid file signature. File header does not match a valid PNG, JPEG, or WebP image." },
        { status: 400 }
      );
    }

    const safeName = `${Date.now()}_${sanitizeFilename(file.name)}`;
    const storagePath = `${user.id}/${projectId}/${safeName}`;

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
        if (process.env.NODE_ENV === "production") {
          console.error("[Storage Upload Error]", uploadError.name);
          return NextResponse.json(
            { error: `Storage upload failed: ${uploadError.message}. Ensure bucket '${bucket}' exists in Supabase Storage.` },
            { status: 500 }
          );
        }
        // Fallback data URI for local dev if bucket not provisioned
        url = `data:${file.type};base64,${buffer.toString("base64")}`;
      }
    } catch (storageErr: unknown) {
      if (process.env.NODE_ENV === "production") {
        const msg = storageErr instanceof Error ? storageErr.message : String(storageErr);
        return NextResponse.json(
          { error: `Storage connection failed: ${msg}` },
          { status: 500 }
        );
      }
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
    console.error("[API Upload Error]", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { error: "The upload could not be completed. Please try again.", code: "UPLOAD_FAILED" },
      { status: 503 }
    );
  }
}
