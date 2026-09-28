import { AIProvider } from "../../types/ai";
import { GeminiAIProvider } from "./gemini";

let defaultProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!defaultProvider) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    defaultProvider = new GeminiAIProvider(apiKey);
  }
  return defaultProvider;
}

export { type AIProvider } from "../../types/ai";
