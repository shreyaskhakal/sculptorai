/**
 * SCULPTOR AI — Community Marketplace Database Client
 * Manages templates, versioned scripts, creator profiles, ratings, and reviews with in-memory fallback.
 */

import { createAdminClient } from "./admin";
import { scanMarketplaceScript, DeclaredCapabilities } from "../marketplace/security-scanner";

export interface DBCreatorProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  totalDownloads: number;
  averageRating: number;
  createdAt: string;
}

export interface DBMarketplaceVersion {
  id: string;
  templateId: string;
  version: string;
  script: string;
  parameterSchema: Array<{
    name: string;
    type: "number" | "string" | "boolean" | "color";
    default: any;
    min?: number;
    max?: number;
    description: string;
  }>;
  securityScanStatus: "pending" | "passed" | "failed";
  securityScanReport: any;
  changelog?: string;
  createdAt: string;
}

export interface DBMarketplaceTemplate {
  id: string;
  creatorId: string;
  creatorUsername: string;
  creatorDisplayName: string;
  title: string;
  slug: string;
  description: string;
  category:
    | "Furniture"
    | "Architecture"
    | "Game Assets"
    | "Product Design"
    | "Vehicles"
    | "Characters"
    | "Environment"
    | "Procedural"
    | "Materials"
    | "Other";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  tags: string[];
  thumbnailUrl?: string;
  status: "draft" | "pending_review" | "published" | "rejected" | "archived";
  blenderVersion: string;
  currentVersion: string;
  downloadCount: number;
  favoriteCount: number;
  rating: number;
  reviewCount: number;
  declaredCapabilities: DeclaredCapabilities;
  latestVersion?: DBMarketplaceVersion;
  createdAt: string;
  updatedAt: string;
}

export interface DBTemplateReview {
  id: string;
  templateId: string;
  userId: string;
  userDisplayName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder") &&
    process.env.DEMO_MODE !== "true"
  );
}

// -----------------------------------------------------------------------------
// Verified Seed Templates
// -----------------------------------------------------------------------------

const SEED_TEMPLATES: DBMarketplaceTemplate[] = [
  {
    id: "tmpl_hovercar",
    creatorId: "usr_cyber_artist",
    creatorUsername: "neo_sculptor",
    creatorDisplayName: "Neo 3D Works",
    title: "Cyberpunk Aerodynamic Hovercar",
    slug: "cyberpunk-hovercar",
    description: "Sleek anti-gravity vehicle chassis with dual vector thruster nacelles, beveled aerodynamic canopy, and procedural emission accents.",
    category: "Vehicles",
    difficulty: "Advanced",
    tags: ["cyberpunk", "vehicle", "sci-fi", "hard-surface"],
    status: "published",
    blenderVersion: "4.x",
    currentVersion: "1.2.0",
    downloadCount: 342,
    favoriteCount: 89,
    rating: 4.9,
    reviewCount: 18,
    declaredCapabilities: {
      filesystem: false,
      network: false,
      external_process: false,
      blender_api: true,
      geometry: true,
      materials: true,
      modifiers: true,
    },
    createdAt: "2026-09-15T12:00:00Z",
    updatedAt: "2026-09-28T14:30:00Z",
  },
  {
    id: "tmpl_facade",
    creatorId: "usr_arch_pro",
    creatorUsername: "studio_arch",
    creatorDisplayName: "Studio Parametric",
    title: "Parametric Louvered Facade",
    slug: "parametric-louvered-facade",
    description: "Procedural architectural curtain wall featuring sun-shading horizontal louvers, floor-to-ceiling glass mullions, and cantilevered balconies.",
    category: "Architecture",
    difficulty: "Intermediate",
    tags: ["architecture", "parametric", "facade", "building"],
    status: "published",
    blenderVersion: "4.x",
    currentVersion: "1.0.0",
    downloadCount: 512,
    favoriteCount: 124,
    rating: 4.8,
    reviewCount: 22,
    declaredCapabilities: {
      filesystem: false,
      network: false,
      external_process: false,
      blender_api: true,
      geometry: true,
      materials: true,
      modifiers: true,
    },
    createdAt: "2026-09-18T09:00:00Z",
    updatedAt: "2026-09-25T11:00:00Z",
  },
  {
    id: "tmpl_torch",
    creatorId: "usr_game_dev",
    creatorUsername: "pixel_forge",
    creatorDisplayName: "PixelForge Studios",
    title: "Medieval Dungeon Wall Torch",
    slug: "medieval-dungeon-torch",
    description: "Stylized game asset with wrought-iron twisted cage, stone bracket anchor, procedural flame emitter empty, and point light source.",
    category: "Game Assets",
    difficulty: "Beginner",
    tags: ["game-ready", "medieval", "dungeon", "props"],
    status: "published",
    blenderVersion: "4.x",
    currentVersion: "1.1.0",
    downloadCount: 789,
    favoriteCount: 210,
    rating: 5.0,
    reviewCount: 35,
    declaredCapabilities: {
      filesystem: false,
      network: false,
      external_process: false,
      blender_api: true,
      geometry: true,
      materials: true,
      modifiers: true,
    },
    createdAt: "2026-09-10T15:30:00Z",
    updatedAt: "2026-09-22T16:00:00Z",
  },
  {
    id: "tmpl_chair",
    creatorId: "usr_furniture_lab",
    creatorUsername: "ergon_design",
    creatorDisplayName: "Ergon Furniture Lab",
    title: "Aeron Minimalist Task Chair",
    slug: "aeron-minimalist-chair",
    description: "Ergonomic executive mesh chair with 5-point caster wheelbase, pneumatic cylinder, curved lumbar spine, and armrest bevels.",
    category: "Furniture",
    difficulty: "Intermediate",
    tags: ["furniture", "chair", "office", "interior"],
    status: "published",
    blenderVersion: "4.x",
    currentVersion: "1.0.0",
    downloadCount: 420,
    favoriteCount: 95,
    rating: 4.7,
    reviewCount: 14,
    declaredCapabilities: {
      filesystem: false,
      network: false,
      external_process: false,
      blender_api: true,
      geometry: true,
      materials: true,
      modifiers: true,
    },
    createdAt: "2026-09-20T10:00:00Z",
    updatedAt: "2026-09-29T12:00:00Z",
  },
  {
    id: "tmpl_shader_titanium",
    creatorId: "usr_shader_guru",
    creatorUsername: "prism_shaders",
    creatorDisplayName: "Prism Shader Labs",
    title: "Anisotropic Brushed Titanium Shader",
    slug: "anisotropic-brushed-titanium",
    description: "Node-based procedural material network with micro-groove radial anisotropy, dual clearcoat roughness, and realistic metallic fresnel.",
    category: "Materials",
    difficulty: "Beginner",
    tags: ["shader", "metal", "procedural", "materials"],
    status: "published",
    blenderVersion: "4.x",
    currentVersion: "2.0.0",
    downloadCount: 940,
    favoriteCount: 310,
    rating: 4.95,
    reviewCount: 41,
    declaredCapabilities: {
      filesystem: false,
      network: false,
      external_process: false,
      blender_api: true,
      geometry: false,
      materials: true,
      modifiers: false,
    },
    createdAt: "2026-09-05T08:00:00Z",
    updatedAt: "2026-09-30T17:00:00Z",
  },
  {
    id: "tmpl_forest",
    creatorId: "usr_env_artist",
    creatorUsername: "polygrove",
    creatorDisplayName: "PolyGrove Nature",
    title: "Low-Poly Pine Forest & Boulder Kit",
    slug: "low-poly-pine-forest",
    description: "Multi-tiered procedural conifer trees, mossy faceted boulders, and terrain scatter ready for stylized indie game environments.",
    category: "Environment",
    difficulty: "Beginner",
    tags: ["nature", "low-poly", "trees", "game-assets"],
    status: "published",
    blenderVersion: "4.x",
    currentVersion: "1.0.0",
    downloadCount: 650,
    favoriteCount: 180,
    rating: 4.85,
    reviewCount: 26,
    declaredCapabilities: {
      filesystem: false,
      network: false,
      external_process: false,
      blender_api: true,
      geometry: true,
      materials: true,
      modifiers: true,
    },
    createdAt: "2026-09-12T14:00:00Z",
    updatedAt: "2026-09-27T10:00:00Z",
  },
];

const SEED_SCRIPTS: Record<string, string> = {
  tmpl_hovercar: `import bpy

def create_hovercar():
    # Clear existing mesh
    if "Hovercar_Body" in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects["Hovercar_Body"], do_unlink=True)

    # Main Chassis
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.4))
    body = bpy.context.active_object
    body.name = "Hovercar_Body"
    body.scale = (1.2, 2.5, 0.4)
    bpy.ops.object.transform_apply(scale=True)

    # Bevel modifier for aerodynamic edges
    bev = body.modifiers.new(name="AeroBevel", type='BEVEL')
    bev.width = 0.08
    bev.segments = 3

    # Dual Thrusters
    for side, x in [("L", -0.7), ("R", 0.7)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=0.8, location=(x, -1.1, 0.35))
        thruster = bpy.context.active_object
        thruster.name = f"Thruster_{side}"
        thruster.rotation_euler = (1.5708, 0, 0)

create_hovercar()
`,
  tmpl_facade: `import bpy

def create_facade():
    # Ground Anchor
    bpy.ops.mesh.primitive_plane_add(size=10.0, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "Plaza_Ground"

    # Curtain Wall Frame
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 3.0))
    wall = bpy.context.active_object
    wall.name = "Curtain_Wall"
    wall.scale = (4.0, 0.2, 6.0)
    bpy.ops.object.transform_apply(scale=True)

    # Horizontal Louvers
    for i in range(8):
        z = 0.6 + i * 0.7
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.25, z))
        louver = bpy.context.active_object
        louver.name = f"Louver_{i+1}"
        louver.scale = (4.2, 0.3, 0.04)
        louver.rotation_euler = (0.26, 0, 0)

create_facade()
`,
  tmpl_torch: `import bpy

def create_torch():
    # Wall Mount Bracket
    bpy.ops.mesh.primitive_cube_add(size=0.15, location=(0, 0, 1.5))
    bracket = bpy.context.active_object
    bracket.name = "Torch_Bracket"

    # Torch Stem
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.6, location=(0, 0.15, 1.6))
    stem = bpy.context.active_object
    stem.name = "Torch_Stem"
    stem.rotation_euler = (0.35, 0, 0)

    # Flame Light Emitter
    light_data = bpy.data.lights.new(name="Torch_Flame_Light", type='POINT')
    light_data.energy = 80.0
    light_data.color = (1.0, 0.55, 0.15)
    light_obj = bpy.data.objects.new("Torch_Flame_Light", light_data)
    bpy.context.collection.objects.link(light_obj)
    light_obj.location = (0, 0.25, 1.85)

create_torch()
`,
  tmpl_chair: `import bpy

def create_chair():
    # Base Hub
    bpy.ops.mesh.primitive_cylinder_add(radius=0.35, depth=0.08, location=(0, 0, 0.1))
    hub = bpy.context.active_object
    hub.name = "Chair_Hub"

    # Pneumatic Cylinder Column
    bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.45, location=(0, 0, 0.325))
    col = bpy.context.active_object
    col.name = "Pneumatic_Column"

    # Seat Cushion
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.55))
    seat = bpy.context.active_object
    seat.name = "Chair_Seat"
    seat.scale = (0.5, 0.5, 0.08)
    bpy.ops.object.transform_apply(scale=True)
    bev = seat.modifiers.new(name="Bevel", type='BEVEL')
    bev.width = 0.04

    # Backrest
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.22, 0.95))
    back = bpy.context.active_object
    back.name = "Chair_Backrest"
    back.scale = (0.45, 0.05, 0.45)
    bpy.ops.object.transform_apply(scale=True)

create_chair()
`,
  tmpl_shader_titanium: `import bpy

def setup_titanium_material():
    mat = bpy.data.materials.new(name="Anisotropic_Titanium")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.78, 0.79, 0.81, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.95
        bsdf.inputs['Roughness'].default_value = 0.22
        if 'Anisotropic' in bsdf.inputs:
            bsdf.inputs['Anisotropic'].default_value = 0.65

setup_titanium_material()
`,
  tmpl_forest: `import bpy

def create_forest():
    # Terrain Ground
    bpy.ops.mesh.primitive_plane_add(size=8.0, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "Forest_Ground"

    # Pine Trees
    for i, (x, y) in enumerate([(-1.5, 1.0), (1.2, -0.8), (0.0, 1.8), (-1.2, -1.5)]):
        # Trunk
        bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.6, location=(x, y, 0.3))
        trunk = bpy.context.active_object
        trunk.name = f"PineTrunk_{i+1}"
        # Foliage Cones
        for tier in range(3):
            z = 0.6 + tier * 0.4
            r = 0.5 - tier * 0.1
            bpy.ops.mesh.primitive_cone_add(radius1=r, depth=0.55, location=(x, y, z))
            foliage = bpy.context.active_object
            foliage.name = f"PineFoliage_{i+1}_T{tier+1}"

create_forest()
`,
};

class MarketplaceStore {
  private templates: DBMarketplaceTemplate[] = [...SEED_TEMPLATES];
  private versions: DBMarketplaceVersion[] = SEED_TEMPLATES.map((t) => ({
    id: `ver_${t.id}_1`,
    templateId: t.id,
    version: t.currentVersion,
    script: SEED_SCRIPTS[t.id] || "# SculptorAI Template\nimport bpy\n",
    parameterSchema: [
      { name: "scale", type: "number", default: 1.0, min: 0.1, max: 5.0, description: "Overall model scale" },
      { name: "colorHex", type: "color", default: "#F5792A", description: "Primary accent color" },
      { name: "bevelRadius", type: "number", default: 0.05, min: 0.01, max: 0.2, description: "Edge chamfer radius" },
    ],
    securityScanStatus: "passed",
    securityScanReport: { passed: true, score: "SECURE", violations: [] },
    changelog: "Initial verified release",
    createdAt: t.createdAt,
  }));
  private reviews: DBTemplateReview[] = [
    {
      id: "rev_1",
      templateId: "tmpl_hovercar",
      userId: "usr_reviewer_1",
      userDisplayName: "Elena Rostova",
      rating: 5,
      comment: "Super clean edge loops! Modified the canopy into a racer version easily.",
      createdAt: "2026-09-25T14:00:00Z",
    },
    {
      id: "rev_2",
      templateId: "tmpl_facade",
      userId: "usr_reviewer_2",
      userDisplayName: "Marcus Vance",
      rating: 5,
      comment: "Saved me 3 hours on an architectural rendering deadline.",
      createdAt: "2026-09-27T18:30:00Z",
    },
  ];
  private favorites: Set<string> = new Set(); // "templateId:userId"
  private downloads: { templateId: string; userId: string; timestamp: string }[] = [];

  async getTemplates(filter?: {
    category?: string;
    search?: string;
    status?: string;
  }): Promise<DBMarketplaceTemplate[]> {
    let list = this.templates;

    if (filter?.status) {
      list = list.filter((t) => t.status === filter.status);
    } else {
      list = list.filter((t) => t.status === "published");
    }

    if (filter?.category && filter.category !== "All") {
      list = list.filter((t) => t.category.toLowerCase() === filter.category?.toLowerCase());
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return list.map((t) => {
      const latestVer = this.versions.find((v) => v.templateId === t.id && v.version === t.currentVersion);
      return { ...t, latestVersion: latestVer };
    });
  }

  async getTemplateBySlug(slug: string): Promise<DBMarketplaceTemplate | null> {
    const tmpl = this.templates.find((t) => t.slug === slug);
    if (!tmpl) return null;
    const latestVer = this.versions.find((v) => v.templateId === tmpl.id && v.version === tmpl.currentVersion);
    return { ...tmpl, latestVersion: latestVer };
  }

  async createTemplate(creatorId: string, data: {
    title: string;
    slug: string;
    description: string;
    category: any;
    difficulty: any;
    tags: string[];
    script: string;
    parameterSchema?: any[];
    declaredCapabilities?: Partial<DeclaredCapabilities>;
  }): Promise<{ template: DBMarketplaceTemplate; scan: any }> {
    const scan = scanMarketplaceScript(data.script, data.declaredCapabilities);
    if (!scan.passed) {
      throw new Error(`Security validation failed: ${scan.violations.join(", ")}`);
    }

    const templateId = `tmpl_${Date.now()}`;
    const newTmpl: DBMarketplaceTemplate = {
      id: templateId,
      creatorId,
      creatorUsername: "creator_artist",
      creatorDisplayName: "Verified Creator",
      title: data.title,
      slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      description: data.description,
      category: data.category,
      difficulty: data.difficulty,
      tags: data.tags || [],
      status: "published",
      blenderVersion: "4.x",
      currentVersion: "1.0.0",
      downloadCount: 0,
      favoriteCount: 0,
      rating: 5.0,
      reviewCount: 0,
      declaredCapabilities: {
        filesystem: false,
        network: false,
        external_process: false,
        blender_api: true,
        geometry: true,
        materials: true,
        modifiers: true,
        ...data.declaredCapabilities,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newVer: DBMarketplaceVersion = {
      id: `ver_${templateId}_1`,
      templateId,
      version: "1.0.0",
      script: data.script,
      parameterSchema: data.parameterSchema || [],
      securityScanStatus: "passed",
      securityScanReport: scan,
      changelog: "Initial published release",
      createdAt: new Date().toISOString(),
    };

    this.templates.unshift(newTmpl);
    this.versions.unshift(newVer);

    return { template: { ...newTmpl, latestVersion: newVer }, scan };
  }

  async recordDownload(templateId: string, userId: string, projectId?: string): Promise<number> {
    const tmpl = this.templates.find((t) => t.id === templateId);
    if (!tmpl) return 0;

    // Prevent duplicate download spam from same user within 10 minutes
    const tenMinsAgo = Date.now() - 10 * 60 * 1000;
    const recent = this.downloads.find(
      (d) => d.templateId === templateId && d.userId === userId && new Date(d.timestamp).getTime() > tenMinsAgo
    );
    if (!recent) {
      tmpl.downloadCount += 1;
      this.downloads.push({ templateId, userId, timestamp: new Date().toISOString() });
    }
    return tmpl.downloadCount;
  }

  async toggleFavorite(templateId: string, userId: string): Promise<{ isFavorited: boolean; count: number }> {
    const tmpl = this.templates.find((t) => t.id === templateId);
    if (!tmpl) return { isFavorited: false, count: 0 };

    const key = `${templateId}:${userId}`;
    let isFavorited = false;
    if (this.favorites.has(key)) {
      this.favorites.delete(key);
      tmpl.favoriteCount = Math.max(0, tmpl.favoriteCount - 1);
    } else {
      this.favorites.add(key);
      tmpl.favoriteCount += 1;
      isFavorited = true;
    }
    return { isFavorited, count: tmpl.favoriteCount };
  }

  async addReview(templateId: string, userId: string, rating: number, comment: string, userDisplayName?: string): Promise<DBTemplateReview> {
    const tmpl = this.templates.find((t) => t.id === templateId);
    if (!tmpl) throw new Error("Template not found");

    const newRev: DBTemplateReview = {
      id: `rev_${Date.now()}`,
      templateId,
      userId,
      userDisplayName: userDisplayName || "Fellow Artist",
      rating: Math.min(5, Math.max(1, rating)),
      comment,
      createdAt: new Date().toISOString(),
    };

    this.reviews.unshift(newRev);

    // Recompute average rating
    const tmplReviews = this.reviews.filter((r) => r.templateId === templateId);
    const sum = tmplReviews.reduce((acc, r) => acc + r.rating, 0);
    tmpl.reviewCount = tmplReviews.length;
    tmpl.rating = Number((sum / tmplReviews.length).toFixed(1));

    return newRev;
  }

  async getReviews(templateId: string): Promise<DBTemplateReview[]> {
    return this.reviews.filter((r) => r.templateId === templateId);
  }
}

const fallbackStore = new MarketplaceStore();

export const dbMarketplace = {
  async getTemplates(filter?: { category?: string; search?: string; status?: string }) {
    if (!isSupabaseConfigured()) return fallbackStore.getTemplates(filter);
    try {
      const supabase = createAdminClient();
      let query = supabase.from("marketplace_templates").select("*, marketplace_template_versions(*)");
      if (filter?.status) {
        query = query.eq("status", filter.status);
      } else {
        query = query.eq("status", "published");
      }
      if (filter?.category && filter.category !== "All") {
        query = query.eq("category", filter.category);
      }
      if (filter?.search) {
        query = query.ilike("title", `%${filter.search}%`);
      }
      const { data, error } = await query;
      if (error || !data) return fallbackStore.getTemplates(filter);
      return data;
    } catch {
      return fallbackStore.getTemplates(filter);
    }
  },

  async getTemplateBySlug(slug: string) {
    if (!isSupabaseConfigured()) return fallbackStore.getTemplateBySlug(slug);
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("marketplace_templates")
        .select("*, marketplace_template_versions(*)")
        .eq("slug", slug)
        .maybeSingle();
      if (error || !data) return fallbackStore.getTemplateBySlug(slug);
      return data;
    } catch {
      return fallbackStore.getTemplateBySlug(slug);
    }
  },

  async createTemplate(creatorId: string, data: any) {
    if (!isSupabaseConfigured()) return fallbackStore.createTemplate(creatorId, data);
    try {
      const scan = scanMarketplaceScript(data.script, data.declaredCapabilities);
      if (!scan.passed) {
        throw new Error(`Security validation failed: ${scan.violations.join(", ")}`);
      }
      const supabase = createAdminClient();
      const { data: created, error } = await supabase
        .from("marketplace_templates")
        .insert({
          creator_id: creatorId,
          title: data.title,
          slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          description: data.description,
          category: data.category,
          difficulty: data.difficulty,
          tags: data.tags || [],
          status: "published",
        })
        .select()
        .single();
      if (error || !created) return fallbackStore.createTemplate(creatorId, data);
      return { template: created, scan };
    } catch {
      return fallbackStore.createTemplate(creatorId, data);
    }
  },

  async recordDownload(templateId: string, userId: string, projectId?: string) {
    if (!isSupabaseConfigured()) return fallbackStore.recordDownload(templateId, userId, projectId);
    return fallbackStore.recordDownload(templateId, userId, projectId);
  },

  async toggleFavorite(templateId: string, userId: string) {
    if (!isSupabaseConfigured()) return fallbackStore.toggleFavorite(templateId, userId);
    return fallbackStore.toggleFavorite(templateId, userId);
  },

  async addReview(templateId: string, userId: string, rating: number, comment: string, userDisplayName?: string) {
    if (!isSupabaseConfigured()) return fallbackStore.addReview(templateId, userId, rating, comment, userDisplayName);
    return fallbackStore.addReview(templateId, userId, rating, comment, userDisplayName);
  },

  async getReviews(templateId: string) {
    if (!isSupabaseConfigured()) return fallbackStore.getReviews(templateId);
    return fallbackStore.getReviews(templateId);
  },
};

// -----------------------------------------------------------------------------
// High-Level Helper Functions
// -----------------------------------------------------------------------------

import { MarketplaceTemplate, TemplateVersion, TemplateReview } from "@/types/marketplace";

function mapToMarketplaceTemplate(
  t: DBMarketplaceTemplate,
  versions: DBMarketplaceVersion[] = [],
  reviews: DBTemplateReview[] = []
): MarketplaceTemplate {
  const vers: TemplateVersion[] = (versions.length > 0 ? versions : (t.latestVersion ? [t.latestVersion] : [])).map((v) => ({
    id: v.id,
    version: v.version,
    script: v.script,
    parameterSchema: (v.parameterSchema || []).map((p) => ({
      name: p.name,
      label: p.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      type: p.type as any,
      default: p.default,
      min: p.min,
      max: p.max,
      description: p.description,
    })),
    capabilities: t.declaredCapabilities || {},
    securityScan: {
      scannedAt: v.createdAt,
      safe: v.securityScanStatus === "passed",
      score: v.securityScanStatus === "passed" ? 100 : 0,
      violations: [],
    },
    changelog: v.changelog,
    createdAt: v.createdAt,
  }));

  const revs: TemplateReview[] = reviews.map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.userDisplayName,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
  }));

  return {
    id: t.id,
    title: t.title,
    slug: t.slug,
    description: t.description,
    category: (t.category.toLowerCase().replace(/\s+/g, "_") as any),
    tags: t.tags || [],
    thumbnailUrl: t.thumbnailUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
    license: "MIT",
    authorId: t.creatorId,
    authorName: t.creatorDisplayName,
    rating: t.rating,
    reviewCount: t.reviewCount,
    downloads: t.downloadCount,
    favorites: t.favoriteCount,
    status: t.status as any,
    versions: vers,
    reviews: revs,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export async function getMarketplaceTemplates(filter?: any): Promise<MarketplaceTemplate[]> {
  const templates = await dbMarketplace.getTemplates(filter);
  return (templates || []).map((t: any) => {
    const versions = t.marketplace_template_versions || (t.latestVersion ? [t.latestVersion] : []);
    return mapToMarketplaceTemplate(t, versions, []);
  });
}

export async function getMarketplaceTemplateBySlug(slug: string): Promise<MarketplaceTemplate | null> {
  const t = await dbMarketplace.getTemplateBySlug(slug);
  if (!t) return null;
  const versions = (t as any).marketplace_template_versions || (t.latestVersion ? [t.latestVersion] : []);
  const reviews = await dbMarketplace.getReviews(t.id);
  return mapToMarketplaceTemplate(t, versions, reviews);
}

export async function createMarketplaceTemplate(data: any): Promise<MarketplaceTemplate> {
  const res = await dbMarketplace.createTemplate(data.authorId || "usr_creator", {
    title: data.title,
    slug: data.title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    description: data.description,
    category: data.category,
    difficulty: "Intermediate",
    tags: data.tags,
    script: data.initialVersion.script,
    parameterSchema: data.initialVersion.parameterSchema,
    declaredCapabilities: data.initialVersion.capabilities,
  });
  return mapToMarketplaceTemplate(res.template, res.template.latestVersion ? [res.template.latestVersion] : [], []);
}

export async function incrementTemplateDownloads(templateId: string, userId: string): Promise<number> {
  return dbMarketplace.recordDownload(templateId, userId);
}

export async function toggleTemplateFavorite(templateId: string, userId: string): Promise<boolean> {
  const res = await dbMarketplace.toggleFavorite(templateId, userId);
  return res.isFavorited;
}

export async function addTemplateReview(data: {
  templateId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
}): Promise<TemplateReview> {
  const rev = await dbMarketplace.addReview(data.templateId, data.userId, data.rating, data.comment, data.userName);
  return {
    id: rev.id,
    userId: rev.userId,
    userName: rev.userDisplayName,
    rating: rev.rating,
    comment: rev.comment,
    createdAt: rev.createdAt,
  };
}

