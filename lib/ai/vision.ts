import { GoogleGenerativeAI } from "@google/generative-ai";
import { ImageAnalysisInput, ImageAnalysis } from "../../types/ai";
import { SYSTEM_PROMPT_IMAGE_ANALYZER } from "./prompts";
import { ImageAnalysisSchema } from "./schemas";
import { parseAndValidateJson } from "./validation";
import { executeWithRetry } from "./retry";
import { selectModelForTask } from "./model-router";
import { requireGeminiApiKey } from "./config";
import { validateBlenderScript } from "../blender/validator";

export async function analyzeImageWithAI(
  input: ImageAnalysisInput,
  apiKey?: string
): Promise<ImageAnalysis> {
  const key = requireGeminiApiKey(apiKey, "vision");

  try {
    const genAI = new GoogleGenerativeAI(key);
    const modelName = selectModelForTask("vision");

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
      systemInstruction: SYSTEM_PROMPT_IMAGE_ANALYZER,
    });

    const prompt = `
Analyze this reference image for 3D reconstruction and procedural modeling in Blender ${input.blenderVersion || "4.x"}.
${input.prompt ? `User Context/Goal: "${input.prompt}"` : ""}

Formulate a structured component breakdown with confidence estimates, geometry analysis, and starting Python blockout code.
`;

    const validated = await executeWithRetry(async () => {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: input.imageBase64,
            mimeType: input.mimeType || "image/png",
          },
        },
      ]);
      const text = result.response.text();
      return parseAndValidateJson(text, ImageAnalysisSchema);
    });

    const codeValidation = validated.blenderCode
      ? validateBlenderScript(validated.blenderCode)
      : null;
    if (codeValidation && !codeValidation.isValid) {
      throw new Error(`Image analysis script failed safety validation: ${codeValidation.errors.join("; ")}`);
    }

    return {
      analysisId: `analysis_${Date.now()}`,
      objects: (validated.objects || []).map((o: any) => ({
        name: o.name || "Object",
        confidence: typeof o.confidence === "number" ? o.confidence : 0.8,
        approxGeometry: o.approxGeometry || "",
        suggestedPrimitive: o.suggestedPrimitive || "Cube",
      })),
      geometrySummary: validated.geometrySummary || "",
      materials: validated.materials || [],
      modelingApproach: validated.modelingApproach || [],
      proportionsObservation: validated.proportionsObservation || "",
      uncertainties: validated.uncertainties || [],
      code: validated.blenderCode
        ? {
            language: "python",
            content: validated.blenderCode,
            clearSceneFirst: true,
          }
        : undefined,
    };
  } catch (err: unknown) {
    console.error("[Vision AI Error]", err instanceof Error ? err.name : "UnknownError");
    throw new Error("Google Gemini vision analysis failed.");
  }
}
