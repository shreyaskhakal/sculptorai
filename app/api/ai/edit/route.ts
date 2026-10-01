import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { getAIProvider } from "@/lib/ai/adapter";
import { validateBlenderScript } from "@/lib/blender/validator";
import { db } from "@/lib/supabase/db";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { sanitizePrompt } from "@/lib/security/sanitize";

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: statusCode || 401 });
    }

    const rateKey = `edit_${user.id}`;
    const rateLimit = checkRateLimit(rateKey, { maxRequests: 30 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }


    const body = await req.json();
    const {
      projectId,
      prompt,
      currentScene,
      conversationHistory,
      blenderVersion,
    } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "A valid prompt is required" }, { status: 400 });
    }

    const cleanPrompt = sanitizePrompt(prompt);
    const ai = getAIProvider();

    let editResult;
    if (ai.editScene) {
      editResult = await ai.editScene({
        prompt: cleanPrompt,
        currentScene: currentScene || { sceneName: "Scene", blenderVersion: "4.x", objects: [] },
        conversationHistory,
        blenderVersion: blenderVersion || "4.x",
      });
    } else {
      // Fallback to generateModelPlan
      const planRes = await ai.generateModelPlan({
        prompt: cleanPrompt,
        blenderVersion: blenderVersion || "4.x",
        mode: "modify",
      });
      editResult = {
        patch: {
          patchId: `patch_${Date.now()}`,
          summary: planRes.plan.summary,
          operations: [],
          blenderCode: planRes.code.content,
          estimatedComplexity: "medium" as const,
          affectedObjects: planRes.plan.objects.map((o) => o.name),
        },
        code: planRes.code,
        warnings: planRes.warnings,
      };
    }

    const safety = validateBlenderScript(editResult.code.content);

    // Save generation and version if projectId provided
    let genRecord = null;
    if (projectId) {
      const prevGenerations = await db.getGenerations(projectId, user.id);
      const nextVersion = prevGenerations.length + 1;

      genRecord = await db.createGeneration({
        projectId,
        userId: user.id,
        versionNumber: nextVersion,
        prompt: cleanPrompt,
        mode: "modify",
        planJson: editResult.patch,
        code: editResult.code.content,
        warnings: [...editResult.warnings, ...safety.warnings],
      });

      if (genRecord) {
        await db.saveGenerationVersion({
          projectId,
          userId: user.id,
          generationId: genRecord.id,
          versionNumber: genRecord.versionNumber,
          prompt: cleanPrompt,
          code: editResult.code.content,
          planJson: editResult.patch,
          snapshotJson: currentScene,
        });
      }
    }


    return NextResponse.json({
      success: true,
      patch: editResult.patch,
      code: editResult.code,
      safety,
      generation: genRecord,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to execute scene edit";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
