export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  safeToPreview: boolean;
}

const FORBIDDEN_PATTERNS = [
  { pattern: /\bimport\s+subprocess\b/i, message: "subprocess module is restricted" },
  { pattern: /\bfrom\s+subprocess\b/i, message: "subprocess module is restricted" },
  { pattern: /\bos\.system\b/i, message: "os.system execution is restricted" },
  { pattern: /\bos\.popen\b/i, message: "os.popen execution is restricted" },
  { pattern: /\bimport\s+shutil\b/i, message: "shutil file operations should be handled carefully" },
  { pattern: /\bshutil\.rmtree\b/i, message: "Recursive directory deletion is blocked" },
  { pattern: /\bimport\s+socket\b/i, message: "Raw socket operations are restricted in generated code" },
  { pattern: /\bimport\s+urllib\b/i, message: "Direct network fetch in script is restricted" },
  { pattern: /\bimport\s+requests\b/i, message: "Direct HTTP requests in script are restricted" },
  { pattern: /\beval\s*\(/i, message: "Dynamic eval execution is flagged" },
  { pattern: /\bexec\s*\(/i, message: "Dynamic exec execution is flagged" },
  { pattern: /\bopen\s*\([^,)]+,\s*['"][wa]/i, message: "Arbitrary file write operation detected" },
];

const BEST_PRACTICE_CHECKS = [
  {
    pattern: /import\s+bpy/,
    message: "Missing 'import bpy' header",
    required: true,
  },
  {
    pattern: /def\s+main\s*\(/,
    message: "Recommended: wrap execution inside a main() function for modularity",
    required: false,
  },
];

/**
 * Validates untrusted AI-generated Blender Python code before showing it
 * or allowing user approval.
 * 
 * Note: Static regex/AST checks cannot guarantee 100% safety of arbitrary code.
 * Explicit user review and consent are mandatory before executing in Blender.
 */
export function validateBlenderScript(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!code || code.trim().length === 0) {
    return {
      isValid: false,
      warnings: [],
      errors: ["Script content is empty"],
      safeToPreview: true,
    };
  }

  // Size limit check (max 100KB for typical generation)
  if (code.length > 100_000) {
    errors.push("Generated script exceeds maximum allowed size (100KB).");
  }

  // Check forbidden dangerous patterns
  for (const { pattern, message } of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      errors.push(`Security Warning: ${message}`);
    }
  }

  // Check best practices
  for (const { pattern, message, required } of BEST_PRACTICE_CHECKS) {
    if (!pattern.test(code)) {
      if (required) {
        warnings.push(`Best practice: ${message}`);
      } else {
        warnings.push(message);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    safeToPreview: true,
  };
}
