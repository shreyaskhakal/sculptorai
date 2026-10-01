/**
 * Model Router for SculptorAI
 * Centralizes model selection based on task capability requirements
 * and environment variable overrides.
 */

export interface ModelRouteConfig {
  generation: string;
  reasoning: string;
  vision: string;
  debugging: string;
  sceneEditor: string;
}

export function getModelRoutes(): ModelRouteConfig {
  const defaultFast = process.env.AI_FAST_MODEL || process.env.GEMINI_MODEL_GENERATION || "gemini-1.5-flash";
  const defaultReasoning = process.env.AI_QUALITY_MODEL || process.env.GEMINI_MODEL_REASONING || "gemini-1.5-pro";
  const defaultVision = process.env.GEMINI_MODEL_VISION || "gemini-1.5-flash";
  const defaultDebug = process.env.GEMINI_MODEL_DEBUG || "gemini-1.5-flash";

  return {
    generation: defaultFast,
    reasoning: defaultReasoning,
    vision: defaultVision,
    debugging: defaultDebug,
    sceneEditor: defaultReasoning,
  };
}

export function selectModelForTask(
  taskType: "generation" | "reasoning" | "vision" | "debugging" | "sceneEditor",
  complexity?: "simple" | "medium" | "complex" | string
): string {
  const routes = getModelRoutes();
  if (taskType === "generation" && complexity === "complex") {
    // Route complex multi-object scenes to reasoning model if available
    return routes.reasoning;
  }
  return routes[taskType] || routes.generation;
}
