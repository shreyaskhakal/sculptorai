import { NextRequest, NextResponse } from "next/server";
import { getMarketplaceTemplates, createMarketplaceTemplate } from "@/lib/supabase/db-marketplace";
import { scanTemplateSecurity } from "@/lib/marketplace/security-scanner";
import { TemplateCategory } from "@/types/marketplace";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as TemplateCategory | undefined;
    const search = searchParams.get("search") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const sort = (searchParams.get("sort") as "popular" | "newest" | "rating") || "popular";

    const templates = await getMarketplaceTemplates({
      category: category && category !== ("all" as any) ? category : undefined,
      search,
      tag,
      sort,
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error("GET /api/marketplace/templates error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch marketplace templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      tags,
      thumbnailUrl,
      license,
      initialVersion,
      authorId,
      authorName,
    } = body;

    if (!title || !description || !category || !initialVersion?.script) {
      return NextResponse.json(
        { error: "Title, description, category, and initial Python script are required." },
        { status: 400 }
      );
    }

    // Security scan the uploaded script against declared capabilities
    const declaredCaps = initialVersion.capabilities || {
      filesystem: false,
      network: false,
      external_process: false,
      blender_api: true,
      geometry: true,
      materials: true,
      modifiers: true,
    };

    const scanResult = scanTemplateSecurity(initialVersion.script, declaredCaps);

    if (!scanResult.safe) {
      return NextResponse.json(
        {
          error: "Template script rejected due to security policy violations.",
          securityViolations: scanResult.violations,
          score: scanResult.score,
        },
        { status: 422 }
      );
    }

    const template = await createMarketplaceTemplate({
      title,
      description,
      category,
      tags: tags || [],
      thumbnailUrl: thumbnailUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
      license: license || "MIT",
      authorId: authorId || "system",
      authorName: authorName || "Community Creator",
      initialVersion: {
        version: initialVersion.version || "1.0.0",
        script: initialVersion.script,
        parameterSchema: initialVersion.parameterSchema || [],
        capabilities: scanResult.capabilities,
        securityScan: {
          scannedAt: scanResult.scannedAt,
          safe: scanResult.safe,
          score: scanResult.score,
          violations: scanResult.violations,
          capabilitiesDetected: scanResult.capabilities,
        },
        changelog: initialVersion.changelog || "Initial public release",
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/marketplace/templates error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create template" },
      { status: 500 }
    );
  }
}
