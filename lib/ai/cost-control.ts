/**
 * Token and cost tracking utility for SculptorAI API operations.
 */

export interface UsageReport {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  model: string;
}

// Approximate pricing per 1M tokens (USD)
const PRICING_TABLE: Record<string, { promptPer1M: number; completionPer1M: number }> = {
  "gemini-1.5-flash": { promptPer1M: 0.075, completionPer1M: 0.30 },
  "gemini-1.5-pro": { promptPer1M: 1.25, completionPer1M: 5.00 },
  "gemini-2.0-flash": { promptPer1M: 0.10, completionPer1M: 0.40 },
};

export function estimateTokenCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const normalizedModel = Object.keys(PRICING_TABLE).find(k => model.includes(k)) || "gemini-1.5-flash";
  const pricing = PRICING_TABLE[normalizedModel];

  const inputCost = (promptTokens / 1_000_000) * pricing.promptPer1M;
  const outputCost = (completionTokens / 1_000_000) * pricing.completionPer1M;

  return Number((inputCost + outputCost).toFixed(6));
}

export function estimateTokensFromString(text: string): number {
  // Conservative estimate: ~4 characters per token
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
