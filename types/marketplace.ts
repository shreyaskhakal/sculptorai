/**
 * SCULPTOR AI — Marketplace Type Definitions
 */

export type TemplateCategory =
  | "procedural"
  | "materials"
  | "environment"
  | "architecture"
  | "characters"
  | "game_assets"
  | "vehicles"
  | "animation"
  | "other";

export interface TemplateParameter {
  name: string;
  label: string;
  type: "number" | "string" | "boolean" | "color" | "select";
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description?: string;
}

export interface TemplateVersion {
  id: string;
  version: string;
  script: string;
  parameterSchema: TemplateParameter[];
  capabilities: {
    filesystem?: boolean;
    network?: boolean;
    external_process?: boolean;
    blender_api?: boolean;
    geometry?: boolean;
    materials?: boolean;
    modifiers?: boolean;
  };
  securityScan: {
    scannedAt: string;
    safe: boolean;
    score: number | string;
    violations: string[];
    capabilitiesDetected?: any;
  };
  changelog?: string;
  createdAt: string;
}

export interface TemplateReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface MarketplaceTemplate {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  thumbnailUrl: string;
  license: string;
  authorId: string;
  authorName: string;
  rating: number;
  reviewCount: number;
  downloads: number;
  favorites: number;
  status: "published" | "draft" | "pending_review" | "rejected";
  versions: TemplateVersion[];
  reviews: TemplateReview[];
  createdAt: string;
  updatedAt: string;
}
