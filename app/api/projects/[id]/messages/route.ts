import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";
import { db } from "@/lib/supabase/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: statusCode || 401 });
    }

    const { id } = params;
    const project = await db.getProjectById(id, user.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    const conv = await db.getOrCreateConversation(id, user.id);
    const messages = await db.getMessages(conv.id, user.id);

    return NextResponse.json({
      conversationId: conv.id,
      messages,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load messages";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error, statusCode } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: statusCode || 401 });
    }

    const { id } = params;
    const project = await db.getProjectById(id, user.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    const body = await req.json();
    const { role, content, imageUrl, metadata } = body;

    if (!role || !content) {
      return NextResponse.json({ error: "Role and content are required" }, { status: 400 });
    }

    const conv = await db.getOrCreateConversation(id, user.id);
    const saved = await db.addMessage({
      conversationId: conv.id,
      userId: user.id,
      role,
      content,
      imageUrl,
      metadata,
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
