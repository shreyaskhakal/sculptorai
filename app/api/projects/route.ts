import { NextRequest, NextResponse } from "next/server";
import { ProjectCreateSchema } from "@/lib/validation/api";

export interface ProjectRecord {
  id: string;
  userId: string;
  name: string;
  description: string;
  blenderVersion: string;
  createdAt: string;
  updatedAt: string;
  generationCount: number;
}

// Global project store for dev and fallback
const memoryProjects: ProjectRecord[] = [
  {
    id: "proj_cyberpunk_desk",
    userId: "usr_default",
    name: "Cyberpunk Desk Setup",
    description: "Modular futuristic gaming desk with RGB underglow and cable trays",
    blenderVersion: "4.x",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
    generationCount: 4,
  },
  {
    id: "proj_low_poly_table",
    userId: "usr_default",
    name: "Low-Poly Furniture Kit",
    description: "Modular low-poly props for indie game environment",
    blenderVersion: "4.x",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date().toISOString(),
    generationCount: 2,
  },
];

export async function GET() {
  return NextResponse.json({ projects: memoryProjects });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ProjectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid project parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, description, blenderVersion } = parsed.data;

    const newProject: ProjectRecord = {
      id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: "usr_default",
      name,
      description: description || "",
      blenderVersion: blenderVersion || "4.x",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
    };

    memoryProjects.unshift(newProject);

    return NextResponse.json(newProject, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create project";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
