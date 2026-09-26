import { NextRequest, NextResponse } from "next/server";
import { ExecutionResultSchema } from "@/lib/validation/api";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const parsed = ExecutionResultSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid execution result payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { status, stdout, stderr, durationMs } = parsed.data;

    const result = {
      executionId: id,
      status,
      stdout,
      stderr,
      durationMs: durationMs || null,
      completedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record execution result";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
