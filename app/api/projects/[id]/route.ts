import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  return NextResponse.json({
    id,
    name: id === "proj_cyberpunk_desk" ? "Cyberpunk Desk Setup" : "Blender 3D Project",
    description: "AI-assisted procedural modeling project",
    blenderVersion: "4.x",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  return NextResponse.json({ success: true, deletedId: id });
}
