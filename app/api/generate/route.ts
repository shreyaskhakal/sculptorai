import { NextRequest, NextResponse } from "next/server";
import { GenerateRequestSchema } from "@/lib/validation/api";
import { getAIProvider } from "@/lib/ai/adapter";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { sanitizePrompt } from "@/lib/security/sanitize";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    const rateCheck = checkRateLimit(`gen_${ip}`, { maxRequests: 30 });
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

    const { projectId, prompt, blenderVersion, style, complexity, previousCode, mode } = parsed.data;
    const sanitized = sanitizePrompt(prompt);

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

    const generationId = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    return NextResponse.json({
      generationId,
      projectId,
      status: "completed",
      plan: result.plan,
      code: result.code,
      warnings: result.warnings,
      createdAt: new Date().toISOString(),
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
