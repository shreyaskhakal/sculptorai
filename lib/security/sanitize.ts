/**
 * Sanitizes natural language user prompts to mitigate basic prompt injection attacks
 * and ensure clean string representations.
 */
export function sanitizePrompt(input: string): string {
  if (!input) return "";

  let cleaned = input.trim();

  // Strip control characters
  cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

  // Prevent delimiter breakouts
  cleaned = cleaned.replace(/<\|im_start\|>|<\|im_end\|>|<\|system\|>/gi, "");

  // Limit reasonable prompt length (e.g. 4000 characters)
  if (cleaned.length > 4000) {
    cleaned = cleaned.slice(0, 4000);
  }

  return cleaned;
}

/**
 * Validates and normalizes safe storage filenames.
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal and dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.+/g, ".")
    .slice(0, 100);
}
