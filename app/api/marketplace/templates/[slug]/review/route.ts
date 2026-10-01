import { NextRequest, NextResponse } from "next/server";
import { getMarketplaceTemplateBySlug, addTemplateReview } from "@/lib/supabase/db-marketplace";
import { getAuthenticatedUser } from "@/lib/supabase/server-auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, props: RouteParams) {
  try {
    const { slug } = await props.params;
    const { user } = await getAuthenticatedUser(request);
    const userId = user?.id || "guest_user";
    const userName = user?.email?.split("@")[0] || "Sculptor Artist";

    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "A valid rating between 1 and 5 is required." },
        { status: 400 }
      );
    }

    const template = await getMarketplaceTemplateBySlug(slug);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const review = await addTemplateReview({
      templateId: template.id,
      userId,
      userName,
      rating,
      comment: comment || "",
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/marketplace/templates/[slug]/review error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to post review" },
      { status: 500 }
    );
  }
}
