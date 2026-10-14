import assert from "node:assert/strict";
import { ModernAIProvider } from "../../lib/ai/provider.ts";

export async function testGeminiRequiresConfiguration() {
  const originalApiKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const provider = new ModernAIProvider();
    await assert.rejects(
      () => provider.generateModelPlan({ prompt: "Create a cube" }),
      /Google Gemini is not configured/
    );
    await assert.rejects(
      () => provider.analyzeImage({ imageBase64: "AA==", mimeType: "image/png" }),
      /Google Gemini is not configured/
    );
    await assert.rejects(
      () => provider.debugBlender({ error: "test error", script: "import bpy" }),
      /Google Gemini is not configured/
    );
    await assert.rejects(
      () => provider.editScene({
        prompt: "Move the active object",
        currentScene: { sceneName: "Test", blenderVersion: "4.x", objects: [], activeObject: null },
      }),
      /Google Gemini is not configured/
    );
    await assert.rejects(
      () => provider.planTaskGraph("Create a test asset"),
      /Google Gemini is not configured/
    );
    console.log("  ✓ All five real Gemini operations fail clearly when no provider key is configured");
  } finally {
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
  }
}
