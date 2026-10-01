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
  sceneSnapshot?: SceneSnapshot;
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

// -----------------------------------------------------------------------------
// Scene Awareness & Snapshot Types
// -----------------------------------------------------------------------------

export interface CompactSceneObject {
  name: string;
  type: string;
  location?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  dimensions?: [number, number, number];
  materials?: string[];
  modifiers?: string[];
  collection?: string;
}

export interface SceneSnapshot {
  sceneName: string;
  blenderVersion: string;
  objects: CompactSceneObject[];
  cameras?: string[];
  lights?: string[];
  collections?: string[];
  activeObject?: string | null;
  selectedObjects?: string[];
  timestamp?: string;
}

// -----------------------------------------------------------------------------
// Scene Patch System Types
// -----------------------------------------------------------------------------

export type PatchOperationType =
  | "create_object"
  | "modify_object"
  | "delete_object"
  | "duplicate_object"
  | "rename_object"
  | "transform_object"
  | "modify_mesh"
  | "modify_material"
  | "add_modifier"
  | "remove_modifier"
  | "modify_modifier"
  | "create_collection"
  | "move_object"
  | "create_light"
  | "modify_light"
  | "create_camera"
  | "modify_camera";

export interface PatchOperation {
  type: PatchOperationType;
  target?: string;
  name?: string;
  changes?: Record<string, any>;
  description?: string;
}

export interface ScenePatch {
  patchId: string;
  summary: string;
  operations: PatchOperation[];
  blenderCode: string;
  estimatedComplexity: "low" | "medium" | "high";
  affectedObjects: string[];
}

export interface SceneEditInput {
  prompt: string;
  currentScene: SceneSnapshot;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  blenderVersion?: string;
}

// -----------------------------------------------------------------------------
// AI Agent Task Graph Types
// -----------------------------------------------------------------------------

export type TaskNodeStatus =
  | "pending"
  | "planned"
  | "validated"
  | "approved"
  | "running"
  | "success"
  | "failed"
  | "cancelled";

export interface TaskNode {
  id: string;
  title: string;
  description: string;
  dependencies: string[];
  status: TaskNodeStatus;
  targetObject?: string;
  generatedCode?: string;
  validationWarnings?: string[];
  executionResult?: {
    success: boolean;
    stdout?: string;
    error?: string;
    durationMs?: number;
  };
}

export interface TaskGraph {
  graphId: string;
  goal: string;
  tasks: TaskNode[];
  estimatedTimeSeconds: number;
}

// -----------------------------------------------------------------------------
// AI Provider Interface
// -----------------------------------------------------------------------------

export interface AIProvider {
  name: string;
  generateModelPlan(input: ModelPlanInput): Promise<{ plan: ModelPlan; code: GeneratedCode; warnings: string[] }>;
  analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysis>;
  debugBlender(input: BlenderDebugInput): Promise<DebugResult>;
  editScene?(input: SceneEditInput): Promise<{ patch: ScenePatch; code: GeneratedCode; warnings: string[] }>;
  planTaskGraph?(goal: string, context?: string): Promise<TaskGraph>;
}

