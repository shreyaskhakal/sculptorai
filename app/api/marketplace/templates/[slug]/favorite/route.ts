import { NextRequest, NextResponse } from "next/server";
import { getMarketplaceTemplateBySlug, toggleTemplateFavorite } from "@/lib/supabase/db-marketplace";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, props: RouteParams) {
  try {
    const { slug } = await props.params;
    const { user } = await getAuthenticatedUser(request);
    const userId = user?.id || "guest_user";

    const template = await getMarketplaceTemplateBySlug(slug);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const isFavorited = await toggleTemplateFavorite(template.id, userId);

    return NextResponse.json({ isFavorited });
  } catch (error: any) {
    console.error("POST /api/marketplace/templates/[slug]/favorite error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}
