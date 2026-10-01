import {
  AIProvider,
  ModelPlanInput,
  ModelPlan,
  GeneratedCode,
  ImageAnalysisInput,
  ImageAnalysis,
  BlenderDebugInput,
  DebugResult,
  SceneEditInput,
  ScenePatch,
  TaskGraph,
} from "../../types/ai";
import { generateModelPlanWithAI } from "./generation";
import { analyzeImageWithAI } from "./vision";
import { debugBlenderWithAI } from "./debugging";
import { editSceneWithAI } from "./scene-editor";
import { planTaskGraphWithAI } from "./planner";

export class ModernAIProvider implements AIProvider {
  public name = "SculptorAI Multi-Model Provider";
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
  }

  async generateModelPlan(
    input: ModelPlanInput
  ): Promise<{ plan: ModelPlan; code: GeneratedCode; warnings: string[] }> {
    return generateModelPlanWithAI(input, this.apiKey);
  }

  async analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysis> {
    return analyzeImageWithAI(input, this.apiKey);
  }

  async debugBlender(input: BlenderDebugInput): Promise<DebugResult> {
    return debugBlenderWithAI(input, this.apiKey);
  }

  async editScene(
    input: SceneEditInput
  ): Promise<{ patch: ScenePatch; code: GeneratedCode; warnings: string[] }> {
    return editSceneWithAI(input, this.apiKey);
  }

  async planTaskGraph(goal: string, context?: string): Promise<TaskGraph> {
    return planTaskGraphWithAI(goal, context, this.apiKey);
  }
}
