export interface SceneObject {
  name: string;
  type: "mesh" | "curve" | "light" | "camera" | "empty" | "collection" | string;
  description: string;
  approxDimensions?: {
    x?: number | string;
    y?: number | string;
    z?: number | string;
  };
  modifiers?: string[];
}

export interface ModelingStep {
  stepNumber: number;
  title: string;
  instructions: string;
  targetObject?: string;
  operationType: "primitive" | "extrude" | "bevel" | "boolean" | "modifier" | "material" | "transform" | "other";
}

export interface MaterialSpec {
  name: string;
  targetObject: string;
  type: "principled_bsdf" | "glass" | "emission" | "metallic" | "subsurface" | string;
  baseColor?: string;
  roughness?: number;
  metallic?: number;
  emissionColor?: string;
  emissionStrength?: number;
  notes?: string;
}

export interface LightingSpec {
  name: string;
  type: "SUN" | "POINT" | "SPOT" | "AREA";
  energyWatts: number;
  colorHex?: string;
  position?: [number, number, number];
  rotationDeg?: [number, number, number];
}

export interface CameraSpec {
  focalLengthMm?: number;
  position?: [number, number, number];
  rotationDeg?: [number, number, number];
  type?: "PERSP" | "ORTHO";
}

export interface ModelPlan {
  intent: string;
  summary: string;
  objects: SceneObject[];
  steps: ModelingStep[];
  materials: MaterialSpec[];
  lighting: LightingSpec[];
  camera?: CameraSpec;
  assumptions: string[];
  warnings: string[];
}

export interface GeneratedCode {
  language: "python";
  content: string;
  entryFunction?: string;
  clearSceneFirst?: boolean;
}

export interface GenerateResult {
  generationId: string;
  status: "completed" | "failed";
  plan: ModelPlan;
  code: GeneratedCode;
  warnings: string[];
}

export interface ImageAnalysisObject {
  name: string;
  confidence: number;
  approxGeometry: string;
  suggestedPrimitive: string;
}

export interface ImageAnalysis {
  analysisId: string;
  objects: ImageAnalysisObject[];
  geometrySummary: string;
  materials: string[];
  modelingApproach: string[];
  proportionsObservation: string;
  uncertainties: string[];
  code?: GeneratedCode;
}

export interface DebugDiagnosis {
  problem: string;
  whyItHappened: string;
  suggestedFix: string;
}

export interface DebugResult {
  debugId: string;
  diagnosis: DebugDiagnosis;
  changes: string[];
  correctedCode: string;
}

export interface ModelPlanInput {
  prompt: string;
  blenderVersion?: string;
  style?: "realistic" | "low-poly" | "stylized" | "sci-fi" | "minimalist" | string;
  complexity?: "simple" | "medium" | "complex" | string;
  includeCode?: boolean;
  context?: string;
  previousCode?: string;
  mode?: "create" | "modify";
}

export interface ImageAnalysisInput {
  imageBase64: string;
  mimeType: string;
  prompt?: string;
  blenderVersion?: string;
  includeCode?: boolean;
}

export interface BlenderDebugInput {
  error: string;
  script: string;
  blenderVersion?: string;
  sceneContext?: Record<string, unknown>;
}

export interface AIProvider {
  name: string;
  generateModelPlan(input: ModelPlanInput): Promise<{ plan: ModelPlan; code: GeneratedCode; warnings: string[] }>;
  analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysis>;
  debugBlender(input: BlenderDebugInput): Promise<DebugResult>;
}
