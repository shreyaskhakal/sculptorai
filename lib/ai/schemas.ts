import { z } from "zod";

export const SceneObjectSchema = z.object({
  name: z.string(),
  type: z.string().default("mesh"),
  description: z.string(),
  approxDimensions: z
    .object({
      x: z.union([z.number(), z.string()]).optional(),
      y: z.union([z.number(), z.string()]).optional(),
      z: z.union([z.number(), z.string()]).optional(),
    })
    .optional(),
  modifiers: z.array(z.string()).optional().default([]),
});

export const ModelingStepSchema = z.object({
  stepNumber: z.number(),
  title: z.string(),
  instructions: z.string(),
  targetObject: z.string().optional(),
  operationType: z
    .enum([
      "primitive",
      "extrude",
      "bevel",
      "boolean",
      "modifier",
      "material",
      "transform",
      "other",
    ])
    .default("other"),
});

export const MaterialSpecSchema = z.object({
  name: z.string(),
  targetObject: z.string(),
  type: z.string().default("principled_bsdf"),
  baseColor: z.string().optional(),
  roughness: z.number().min(0).max(1).optional(),
  metallic: z.number().min(0).max(1).optional(),
  emissionColor: z.string().optional(),
  emissionStrength: z.number().optional(),
  notes: z.string().optional(),
});

export const LightingSpecSchema = z.object({
  name: z.string(),
  type: z.enum(["SUN", "POINT", "SPOT", "AREA"]).default("POINT"),
  energyWatts: z.number().default(100),
  colorHex: z.string().optional(),
  position: z.tuple([z.number(), z.number(), z.number()]).optional(),
  rotationDeg: z.tuple([z.number(), z.number(), z.number()]).optional(),
});

export const CameraSpecSchema = z
  .object({
    focalLengthMm: z.number().optional(),
    position: z.tuple([z.number(), z.number(), z.number()]).optional(),
    rotationDeg: z.tuple([z.number(), z.number(), z.number()]).optional(),
    type: z.enum(["PERSP", "ORTHO"]).optional(),
  })
  .optional();

export const ModelPlanSchema = z.object({
  intent: z.string().default("create_model"),
  summary: z.string(),
  objects: z.array(SceneObjectSchema).default([]),
  steps: z.array(ModelingStepSchema).default([]),
  materials: z.array(MaterialSpecSchema).default([]),
  lighting: z.array(LightingSpecSchema).default([]),
  camera: CameraSpecSchema,
  assumptions: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  blenderCode: z.string().default(""),
});

export type ModelPlanParsed = z.infer<typeof ModelPlanSchema>;

export const ImageAnalysisSchema = z.object({
  objects: z.array(
    z.object({
      name: z.string(),
      confidence: z.number().min(0).max(1).default(0.8),
      approxGeometry: z.string(),
      suggestedPrimitive: z.string(),
    })
  ),
  geometrySummary: z.string(),
  materials: z.array(z.string()),
  modelingApproach: z.array(z.string()),
  proportionsObservation: z.string(),
  uncertainties: z.array(z.string()),
  blenderCode: z.string().optional().default(""),
});

export type ImageAnalysisParsed = z.infer<typeof ImageAnalysisSchema>;

export const BlenderDebugSchema = z.object({
  problem: z.string(),
  whyItHappened: z.string(),
  suggestedFix: z.string(),
  changes: z.array(z.string()),
  correctedCode: z.string(),
});

export type BlenderDebugParsed = z.infer<typeof BlenderDebugSchema>;
