import { GoogleGenerativeAI } from "@google/generative-ai";
import { TaskGraph } from "../../types/ai";
import { SYSTEM_PROMPT_TASK_PLANNER } from "./prompts";
import { TaskGraphSchema } from "./schemas";
import { parseAndValidateJson } from "./validation";
import { executeWithRetry } from "./retry";
import { selectModelForTask } from "./model-router";

export async function planTaskGraphWithAI(
  goal: string,
  context?: string,
  apiKey?: string
): Promise<TaskGraph> {
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    return generateFallbackTaskGraph(goal);
  }

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
    tasks: validated.tasks.map((t) => ({
      ...t,
      status: "planned",
    })),
    estimatedTimeSeconds: validated.estimatedTimeSeconds,
  };
}

function generateFallbackTaskGraph(goal: string): TaskGraph {
  return {
    graphId: `graph_${Date.now()}`,
    goal,
    tasks: [
      {
        id: "task_1",
        title: "Create Primary Structure",
        description: `Model foundation and primary form for: ${goal}`,
        dependencies: [],
        status: "planned",
      },
      {
        id: "task_2",
        title: "Add Secondary Details & Modifiers",
        description: "Apply bevels, chamfers, and procedural accents",
        dependencies: ["task_1"],
        status: "planned",
      },
      {
        id: "task_3",
        title: "Setup Materials & Lighting",
        description: "Configure Principled BSDF node shaders and 3-point lighting",
        dependencies: ["task_2"],
        status: "planned",
      },
    ],
    estimatedTimeSeconds: 45,
  };
}
