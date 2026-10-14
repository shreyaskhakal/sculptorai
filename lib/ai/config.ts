export type GeminiCapability = "generation" | "vision" | "debugging" | "scene editing" | "task planning";

export function requireGeminiApiKey(apiKey: string | undefined, capability: GeminiCapability): string {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(`Google Gemini is not configured. Set GEMINI_API_KEY to enable ${capability}.`);
  }
  return key;
}
