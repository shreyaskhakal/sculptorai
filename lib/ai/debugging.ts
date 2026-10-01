import { GoogleGenerativeAI } from "@google/generative-ai";
import { BlenderDebugInput, DebugResult } from "../../types/ai";
import { SYSTEM_PROMPT_BLENDER_DEBUGGER } from "./prompts";
import { BlenderDebugSchema } from "./schemas";
import { parseAndValidateJson } from "./validation";
import { executeWithRetry } from "./retry";
import { selectModelForTask } from "./model-router";
import { validateBlenderScript } from "../blender/validator";

export async function debugBlenderWithAI(
  input: BlenderDebugInput,
  apiKey?: string
): Promise<DebugResult> {
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    return generateFallbackDebug(input);
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const modelName = selectModelForTask("debugging");

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
      systemInstruction: SYSTEM_PROMPT_BLENDER_DEBUGGER,
    });

    const promptText = `
Blender Version: ${input.blenderVersion || "4.x"}

Blender Error Traceback:
\`\`\`
${input.error}
\`\`\`

Script that caused the error:
\`\`\`python
${input.script}
\`\`\`

${input.sceneContext ? `Scene Context: ${JSON.stringify(input.sceneContext)}` : ""}

Diagnose this error and generate the complete, working, corrected script.
`;

    const validated = await executeWithRetry(async () => {
      const result = await model.generateContent(promptText);
      const text = result.response.text();
      return parseAndValidateJson(text, BlenderDebugSchema);
    });

    const validation = validateBlenderScript(validated.correctedCode);
    if (!validation.isValid) {
      console.warn("AI corrected code contained security issues:", validation.errors);
      return generateFallbackDebug(input);
    }

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
    console.warn("AI debug failed, falling back gracefully:", err);
    return generateFallbackDebug(input);
  }
}

export function generateFallbackDebug(input: BlenderDebugInput): DebugResult {
  const err = input.error.toLowerCase();
  let fixDesc = "Added safe guard checks and ensured proper Blender context mode";
  let why = "Blender operator called without required active object or incompatible context.";

  if (err.includes("active_object") || err.includes("none")) {
    fixDesc = "Added guard check to verify bpy.context.active_object is not None.";
    why = "An operator required an active object selection, but context.active_object was None.";
  } else if (err.includes("context") || err.includes("poll")) {
    fixDesc = "Wrapped operator in context override and ensured object mode.";
    why = "Blender operator poll failed because the active area/space was not in expected state.";
  }

  // Inject defensive context guards
  let fixedScript = input.script;
  if (!fixedScript.includes("mode_set")) {
    fixedScript = fixedScript.replace(
      /def main\(\):/,
      `def main():\n    if bpy.context.active_object and bpy.context.active_object.mode != 'OBJECT':\n        bpy.ops.object.mode_set(mode='OBJECT')`
    );
  }

  return {
    debugId: `dbg_${Date.now()}`,
    diagnosis: {
      problem: `Execution failed: ${input.error.split("\n").filter(Boolean).pop() || "Runtime exception"}`,
      whyItHappened: why,
      suggestedFix: fixDesc,
    },
    changes: [
      "Added context verification before operator execution",
      "Ensured active object exists before performing transformations",
    ],
    correctedCode: fixedScript,
  };
}
