import { GoogleGenerativeAI } from "@google/generative-ai";
import { SceneEditInput, ScenePatch, GeneratedCode } from "../../types/ai";
import { SYSTEM_PROMPT_SCENE_EDITOR } from "./prompts";
import { ScenePatchSchema } from "./schemas";
import { parseAndValidateJson } from "./validation";
import { executeWithRetry } from "./retry";
import { selectModelForTask } from "./model-router";
import { validateBlenderScript } from "../blender/validator";

export async function editSceneWithAI(
  input: SceneEditInput,
  apiKey?: string
): Promise<{ patch: ScenePatch; code: GeneratedCode; warnings: string[] }> {
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    return generateFallbackPatch(input);
  }

  const genAI = new GoogleGenerativeAI(key);
  const modelName = selectModelForTask("sceneEditor");

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
    systemInstruction: SYSTEM_PROMPT_SCENE_EDITOR,
  });

  const promptText = `
User Modification Request: "${input.prompt}"
Target Blender Version: ${input.blenderVersion || "4.x"}

Current Active Scene Snapshot:
${JSON.stringify(input.currentScene, null, 2)}

${
  input.conversationHistory && input.conversationHistory.length > 0
    ? `Recent Conversation Context:
${input.conversationHistory.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}`
    : ""
}

Generate the surgical scene modification JSON operations and executable Blender Python script.
`;

  const validated = await executeWithRetry(async () => {
    const res = await model.generateContent(promptText);
    const text = res.response.text();
    return parseAndValidateJson(text, ScenePatchSchema);
  });

  const codeValidation = validateBlenderScript(validated.blenderCode);

  const patch: ScenePatch = {
    patchId: `patch_${Date.now()}`,
    summary: validated.summary,
    operations: validated.operations,
    blenderCode: validated.blenderCode,
    estimatedComplexity: validated.estimatedComplexity,
    affectedObjects: validated.affectedObjects,
  };

  const code: GeneratedCode = {
    language: "python",
    content: validated.blenderCode,
    clearSceneFirst: false,
  };

  return {
    patch,
    code,
    warnings: codeValidation.warnings,
  };
}

function generateFallbackPatch(input: SceneEditInput): {
  patch: ScenePatch;
  code: GeneratedCode;
  warnings: string[];
} {
  const targetObj = input.currentScene.activeObject || input.currentScene.objects[0]?.name || "Object";
  const pythonScript = `# SculptorAI Incremental Modification
import bpy

def apply_modifications():
    # Safely target object '${targetObj}'
    obj = bpy.data.objects.get("${targetObj}")
    if obj:
        # Surgical edit: adjust scale or properties without deleting scene
        obj.scale = (obj.scale[0] * 0.9, obj.scale[1] * 0.9, obj.scale[2])
        print("SculptorAI: Applied modification to ${targetObj}")

if __name__ == '__main__':
    apply_modifications()
`;

  return {
    patch: {
      patchId: `patch_${Date.now()}`,
      summary: `Surgical update targeting ${targetObj} for request: "${input.prompt}"`,
      operations: [
        {
          type: "modify_object",
          target: targetObj,
          changes: { scale: [0.9, 0.9, 1.0] },
          description: `Adjusted dimensions of ${targetObj}`,
        },
      ],
      blenderCode: pythonScript,
      estimatedComplexity: "low",
      affectedObjects: [targetObj],
    },
    code: {
      language: "python",
      content: pythonScript,
      clearSceneFirst: false,
    },
    warnings: ["Running in standalone/demo mode (surgical fallback template applied)"],
  };
}
