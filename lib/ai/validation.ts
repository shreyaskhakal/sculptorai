import { z, ZodSchema } from "zod";

/**
 * Strips markdown code blocks and repairs common minor JSON formatting errors.
 */
export function cleanJsonString(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\s*/i, "").replace(/```\s*$/, "");
  }
  text = text.trim();

  // Remove potential trailing commas before closing braces/brackets
  text = text.replace(/,(\s*[\]}])/g, "$1");

  return text;
}

/**
 * Parses and validates structured JSON output against a given Zod schema.
 */
export function parseAndValidateJson<T>(rawText: string, schema: ZodSchema<T>): T {
  const cleaned = cleanJsonString(rawText);
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    throw new Error(`Failed to parse AI JSON response: ${err.message}. Content was: ${cleaned.slice(0, 300)}...`);
  }
  return schema.parse(parsed);
}
