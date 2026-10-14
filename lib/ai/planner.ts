import { GoogleGenerativeAI } from "@google/generative-ai";
import { TaskGraph } from "../../types/ai";
import { SYSTEM_PROMPT_TASK_PLANNER } from "./prompts";
import { TaskGraphSchema } from "./schemas";
import { parseAndValidateJson } from "./validation";
import { executeWithRetry } from "./retry";
import { selectModelForTask } from "./model-router";
import { requireGeminiApiKey } from "./config";

export async function planTaskGraphWithAI(
  goal: string,
  context?: string,
  apiKey?: string
): Promise<TaskGraph> {
  const key = requireGeminiApiKey(apiKey, "task planning");

  const genAI = new GoogleGenerativeAI(key);
  const modelName = selectModelForTask("reasoning");

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
    systemInstruction: SYSTEM_PROMPT_TASK_PLANNER,
  });

  const promptText = `
Modeling Goal: "${goal}"
${context ? `Additional Context: ${context}` : ""}

Decompose this into an ordered, dependency-aware task graph.
`;

  const validated = await executeWithRetry(async () => {
    const res = await model.generateContent(promptText);
    const text = res.response.text();
    return parseAndValidateJson(text, TaskGraphSchema);
  });

  return {
    graphId: `graph_${Date.now()}`,
    goal: validated.goal,
    tasks: (validated.tasks || []).map((t) => ({
      ...t,
      dependencies: t.dependencies || [],
      status: "planned",
    })),
    estimatedTimeSeconds: validated.estimatedTimeSeconds || 60,
  };
}
