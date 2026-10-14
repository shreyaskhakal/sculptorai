import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  AIProvider,
  ModelPlanInput,
  ModelPlan,
  GeneratedCode,
  ImageAnalysisInput,
  ImageAnalysis,
  BlenderDebugInput,
  DebugResult,
} from "../../types/ai";
import {
  SYSTEM_PROMPT_BLENDER_ARCHITECT,
  SYSTEM_PROMPT_IMAGE_ANALYZER,
  SYSTEM_PROMPT_BLENDER_DEBUGGER,
} from "./prompts";
import {
  ModelPlanSchema,
  ImageAnalysisSchema,
  BlenderDebugSchema,
} from "./schemas";
import { validateBlenderScript } from "../blender/validator";
import { selectModelForTask } from "./model-router";
import { executeWithRetry } from "./retry";

export const GEMINI_MODEL_GENERATION = process.env.GEMINI_MODEL_GENERATION || "gemini-2.0-flash";
export const GEMINI_MODEL_VISION = process.env.GEMINI_MODEL_VISION || "gemini-2.0-flash";
export const GEMINI_MODEL_DEBUG = process.env.GEMINI_MODEL_DEBUG || "gemini-2.0-flash";

export class GeminiAIProvider implements AIProvider {
  public name = "Google Gemini";
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  private cleanJsonString(raw: string): string {
    let text = raw.trim();
    if (text.startsWith("```json")) {
      text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/^```\s*/i, "").replace(/```\s*$/, "");
    }
    return text.trim();
  }

  async generateModelPlan(
    input: ModelPlanInput
  ): Promise<{ plan: ModelPlan; code: GeneratedCode; warnings: string[] }> {
    const blenderVer = input.blenderVersion || "4.x";
    const style = input.style || "low-poly";
    const complexity = input.complexity || "medium";

    if (!this.genAI) {
      throw new Error("Google Gemini is not configured. Set GEMINI_API_KEY to enable generation.");
    }

    const selectedModel = selectModelForTask("generation", complexity);

    try {
      const model = this.genAI.getGenerativeModel({
        model: selectedModel,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
        systemInstruction: SYSTEM_PROMPT_BLENDER_ARCHITECT,
      });

      const promptText = `
Request: "${input.prompt}"
Target Blender Version: ${blenderVer}
Target Style: ${style}
Target Complexity: ${complexity}
${input.previousCode ? `Existing Scene Script to Modify:
\`\`\`python
${input.previousCode}
\`\`\`
CRITICAL INSTRUCTION: The user is requesting a modification or refinement to the scene above. Retain established objects and collections, and surgically apply requested geometric, material, scale, or lighting changes.` : ""}
${input.context ? `Additional Scene Context: ${input.context}` : ""}

Generate the complete JSON modeling plan and executable Blender Python (bpy).
`;

      const validated = await executeWithRetry(async () => {
        const result = await model.generateContent(promptText);
        const responseText = result.response.text();
        const cleanedJson = this.cleanJsonString(responseText);
        const parsed = JSON.parse(cleanedJson);
        return ModelPlanSchema.parse(parsed);
      });

      const codeValidation = validateBlenderScript(validated.blenderCode);

      const combinedWarnings = [
        ...validated.warnings,
        ...codeValidation.warnings,
      ];

      return {
        plan: {
          intent: validated.intent,
          summary: validated.summary,
          objects: validated.objects,
          steps: validated.steps,
          materials: validated.materials,
          lighting: validated.lighting,
          camera: validated.camera,
          assumptions: validated.assumptions,
          warnings: combinedWarnings,
        },
        code: {
          language: "python",
          content: validated.blenderCode,
          clearSceneFirst: true,
        },
        warnings: combinedWarnings,
      };
    } catch (err: unknown) {
      console.error("[Gemini API Generation Error]", err instanceof Error ? err.name : "UnknownError");
      throw new Error("Google Gemini generation failed.");
    }
  }

  async analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysis> {
    if (!this.genAI) {
      throw new Error("Google Gemini is not configured. Set GEMINI_API_KEY to enable image analysis.");
    }

    const selectedModel = selectModelForTask("vision");

    try {
      const model = this.genAI.getGenerativeModel({
        model: selectedModel,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
        systemInstruction: SYSTEM_PROMPT_IMAGE_ANALYZER,
      });

      const prompt = `
Analyze this reference image for 3D reconstruction and procedural modeling in Blender ${input.blenderVersion || "4.x"}.
${input.prompt ? `User guidance: ${input.prompt}` : ""}
Respond with the required JSON structure.
`;

      const imagePart = {
        inlineData: {
          data: input.imageBase64,
          mimeType: input.mimeType,
        },
      };

      const validated = await executeWithRetry(async () => {
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        const cleaned = this.cleanJsonString(responseText);
        const parsed = JSON.parse(cleaned);
        return ImageAnalysisSchema.parse(parsed);
      });

      return {
        analysisId: `analysis_${Date.now()}`,
        objects: validated.objects,
        geometrySummary: validated.geometrySummary,
        materials: validated.materials,
        modelingApproach: validated.modelingApproach,
        proportionsObservation: validated.proportionsObservation,
        uncertainties: validated.uncertainties,
        code: validated.blenderCode
          ? {
              language: "python",
              content: validated.blenderCode,
            }
          : undefined,
      };
    } catch (err: unknown) {
      console.error("[Gemini Vision Analysis Error]", err instanceof Error ? err.name : "UnknownError");
      throw new Error("Google Gemini vision analysis failed.");
    }
  }

  async debugBlender(input: BlenderDebugInput): Promise<DebugResult> {
    if (!this.genAI) {
      throw new Error("Google Gemini is not configured. Set GEMINI_API_KEY to enable error analysis.");
    }

    const selectedModel = selectModelForTask("debugging");

    try {
      const model = this.genAI.getGenerativeModel({
        model: selectedModel,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
        systemInstruction: SYSTEM_PROMPT_BLENDER_DEBUGGER,
      });

      const promptText = `
Blender Version: ${input.blenderVersion || "4.x"}
Error Traceback:
${input.error}

Executed Script:
\`\`\`python
${input.script}
\`\`\`

Identify the root cause, why it happened in Blender's API, and provide the corrected script in JSON.
`;

      const validated = await executeWithRetry(async () => {
        const result = await model.generateContent(promptText);
        const cleaned = this.cleanJsonString(result.response.text());
        const parsed = JSON.parse(cleaned);
        return BlenderDebugSchema.parse(parsed);
      });

      return {
        debugId: `dbg_${Date.now()}`,
        diagnosis: {
          problem: validated.problem,
          whyItHappened: validated.whyItHappened,
          suggestedFix: validated.suggestedFix,
        },
        changes: validated.changes,
        correctedCode: validated.correctedCode,
      };
    } catch (err: unknown) {
      console.error("[Gemini Debug Analysis Error]", err instanceof Error ? err.name : "UnknownError");
      throw new Error("Google Gemini debug analysis failed.");
    }
  }


}
