import { NextRequest, NextResponse } from "next/server";
import { GenerateRequestSchema } from "@/lib/validation/api";
import { getAIProvider } from "@/lib/ai/adapter";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { sanitizePrompt } from "@/lib/security/sanitize";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { db } from "@/lib/supabase/db";
import { toSafeServiceError } from "@/lib/security/service-error";

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const rateKey = `gen_${user.id}`;
    const rateCheck = checkRateLimit(rateKey, { maxRequests: 30 });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before generating again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = GenerateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    let { projectId, prompt, blenderVersion, style, complexity, previousCode, mode } = parsed.data;
    const sanitized = sanitizePrompt(prompt);

    // Resolve or verify project ownership
    if (projectId && projectId !== "blender_addon_session" && projectId !== "default") {
      const project = await db.getProjectById(projectId, user.id);
      if (!project) {
        return NextResponse.json(
          { error: "Project not found or access denied" },
          { status: 404 }
        );
      }
    } else {
      // Direct add-on session or quick generate: resolve default project or create
      const userProjects = await db.getProjects(user.id);
      if (userProjects.length > 0) {
        projectId = userProjects[0].id;
      } else {
        const createdProject = await db.createProject({
          userId: user.id,
          name: "Blender AI Project",
          description: "Workspace created from AI Copilot",
          blenderVersion,
        });
        projectId = createdProject.id;
      }
    }

    const existingGenerations = await db.getGenerations(projectId, user.id);
    const nextVersion = existingGenerations.length + 1;

    const ai = getAIProvider();
    const result = await ai.generateModelPlan({
      prompt: sanitized,
      blenderVersion,
      style,
      complexity,
      includeCode: true,
      previousCode,
      mode,
    });

    // Persist generation to Supabase / database
    const savedGeneration = await db.createGeneration({
      projectId,
      userId: user.id,
      versionNumber: nextVersion,
      prompt: sanitized,
      mode,
      style,
      complexity,
      planJson: result.plan,
      code: result.code.content,
      warnings: result.warnings,
    });

    // Query relevant marketplace templates for AI recommendation (never auto-executed)
    let recommendedTemplates: Array<{ id: string; title: string; slug: string; category: string; rating: number }> = [];
    try {
      const { getMarketplaceTemplates } = await import("@/lib/supabase/db-marketplace");
      const matched = await getMarketplaceTemplates({ search: sanitized.slice(0, 40) });
      recommendedTemplates = matched.slice(0, 2).map((t) => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        category: t.category,
        rating: t.rating,
      }));
    } catch {
      // Non-blocking recommendation failure
    }

    return NextResponse.json({
      generationId: savedGeneration.id,
      projectId: savedGeneration.projectId,
      versionNumber: savedGeneration.versionNumber,
      status: "completed",
      plan: result.plan,
      code: result.code,
      warnings: result.warnings,
      recommendedTemplates,
      createdAt: savedGeneration.createdAt,
    });
  } catch (error: unknown) {
    const failure = toSafeServiceError(error, "GENERATION");
    console.error("[API Generate Error]", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { error: failure.message, code: failure.code },
      { status: failure.status }
    );
  }
}
