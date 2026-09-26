import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  return NextResponse.json({
    projectId: id,
    generations: [
      {
        id: "gen_sample_1",
        projectId: id,
        prompt: "Create a low-poly wooden table with 4 legs and beveled corners",
        status: "completed",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        summary: "Low-poly 4-legged wooden table with chamfered edges",
      },
      {
        id: "gen_sample_2",
        projectId: id,
        prompt: "Add a monitor stand and cable grommet to the desk surface",
        status: "completed",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        summary: "Monitor riser shelf with cylindrical grommet cutout",
      },
    ],
  });
}
