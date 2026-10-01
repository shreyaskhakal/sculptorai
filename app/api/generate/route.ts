import { NextRequest, NextResponse } from "next/server";
import { GenerateRequestSchema } from "@/lib/validation/api";
import { getAIProvider } from "@/lib/ai/adapter";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { sanitizePrompt } from "@/lib/security/sanitize";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { db } from "@/lib/supabase/db";

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

    // Resolve or create project if sent from direct add-on session
    let project = await db.getProjectById(projectId, user.id);
    if (!project) {
      // Check if user has any existing projects, or create a default session project
      const userProjects = await db.getProjects(user.id);
      if (userProjects.length > 0) {
        project = userProjects[0];
        projectId = project.id;
      } else {
        project = await db.createProject({
          userId: user.id,
          name: "Blender AI Project",
          description: "Workspace created from AI Copilot",
          blenderVersion,
        });
        projectId = project.id;
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
    const errMessage = error instanceof Error ? error.message : "Internal generation error";
    console.error("[API Generate Error]:", error);
    return NextResponse.json(
      { error: errMessage, code: "GENERATION_FAILED" },
      { status: 500 }
    );
  }
}
