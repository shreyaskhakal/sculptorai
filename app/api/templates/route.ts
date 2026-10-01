import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;

    const templates = await db.getTemplates(category);

    return NextResponse.json({
      templates,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load templates";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
