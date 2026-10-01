import { AIProvider } from "../../types/ai";
import { ModernAIProvider } from "./provider";

let defaultProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!defaultProvider) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    defaultProvider = new ModernAIProvider(apiKey);
  }
  return defaultProvider;
}

export { type AIProvider } from "../../types/ai";
export { ModernAIProvider } from "./provider";

