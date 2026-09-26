import { NextRequest, NextResponse } from "next/server";
import { ExecutionCreateSchema } from "@/lib/validation/api";

// In-memory execution store for local dev & sync with add-on
const executionRecords = new Map<string, {
  executionId: string;
  generationId: string;
  status: "pending" | "running" | "success" | "error";
  script?: string;
  stdout?: string;
  stderr?: string;
  durationMs?: number;
  blenderVersion: string;
  createdAt: string;
  completedAt?: string;
}>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ExecutionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid execution request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { generationId, blenderVersion, script, prompt } = parsed.data;
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const record = {
      executionId,
      generationId,
      status: "pending" as const,
      blenderVersion,
      script: script || "",
      prompt: prompt || "Model Generation",
      createdAt: new Date().toISOString(),
    };

    executionRecords.set(executionId, record);

    return NextResponse.json(record, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create execution";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const statusFilter = searchParams.get("status");

  if (id) {
    const record = executionRecords.get(id);
    if (!record) {
      return NextResponse.json({ error: "Execution not found" }, { status: 404 });
    }
    return NextResponse.json(record);
  }

  // Filter by status if requested (e.g. status=pending for Blender add-on polling)
  let list = Array.from(executionRecords.values());
  if (statusFilter) {
    list = list.filter((r) => r.status === statusFilter);
  }

  const recent = list.slice(-20).reverse();
  return NextResponse.json({ executions: recent });
}
