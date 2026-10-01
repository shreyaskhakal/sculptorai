import { NextRequest, NextResponse } from "next/server";
import { getMarketplaceTemplateBySlug } from "@/lib/supabase/db-marketplace";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, props: RouteParams) {
  try {
    const { slug } = await props.params;
    const template = await getMarketplaceTemplateBySlug(slug);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error(`GET /api/marketplace/templates/[slug] error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch template" },
      { status: 500 }
    );
  }
}
