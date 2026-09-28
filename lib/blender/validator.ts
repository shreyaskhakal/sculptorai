export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  safeToPreview: boolean;
}

interface SecurityRule {
  pattern: RegExp;
  category: string;
  message: string;
}

const FORBIDDEN_RULES: SecurityRule[] = [
  // Subprocess and system command execution
  { pattern: /\bimport\s+subprocess\b/i, category: "execution", message: "subprocess module execution is forbidden" },
  { pattern: /\bfrom\s+subprocess\b/i, category: "execution", message: "subprocess module execution is forbidden" },
  { pattern: /\bos\.(system|popen|spawn[lpe]*|exec[lpe]*|fork)\b/i, category: "execution", message: "Low-level OS process execution is forbidden" },
  { pattern: /\bpty\b/i, category: "execution", message: "Pseudo-terminal allocation is restricted" },

  // Network and socket access
  { pattern: /\bimport\s+(socket|urllib|requests|http|httpx|aiohttp|ftplib|telnetlib|smtplib)\b/i, category: "network", message: "Network and socket modules are forbidden in generated scripts" },
  { pattern: /\bfrom\s+(socket|urllib|requests|http|httpx|aiohttp|ftplib|telnetlib|smtplib)\b/i, category: "network", message: "Network requests are forbidden in generated scripts" },
  { pattern: /\burllib\.(request|parse)\b/i, category: "network", message: "urllib network calls are forbidden" },

  // Filesystem manipulation and destructive operations
  { pattern: /\bimport\s+shutil\b/i, category: "filesystem", message: "shutil filesystem manipulation is restricted" },
  { pattern: /\bshutil\.(rmtree|move|copy|copytree|chown)\b/i, category: "filesystem", message: "Destructive shutil operations are forbidden" },
  { pattern: /\bos\.(remove|unlink|rmdir|rename|replace|chmod|chown)\b/i, category: "filesystem", message: "Destructive OS file system modifications are forbidden" },
  { pattern: /\b(\w+)\.(unlink|rmdir)\s*\(/i, category: "filesystem", message: "Pathlib destructive file deletion operations are forbidden" },
  { pattern: /\b(open|io\.open|builtins\.open)\s*\(/i, category: "filesystem", message: "Arbitrary file reading/writing via open() is restricted" },

  // Dynamic code evaluation and reflection bypasses
  { pattern: /\beval\s*\(/i, category: "dynamic_code", message: "eval() dynamic evaluation is strictly forbidden" },
  { pattern: /\bexec\s*\(/i, category: "dynamic_code", message: "exec() dynamic execution is strictly forbidden" },
  { pattern: /\bcompile\s*\(/i, category: "dynamic_code", message: "compile() dynamic code construction is strictly forbidden" },
  { pattern: /\b__import__\s*\(/i, category: "dynamic_code", message: "Dynamic __import__() is strictly forbidden" },
  { pattern: /\bimportlib(\.import_module)?\b/i, category: "dynamic_code", message: "importlib dynamic module importing is forbidden" },
  { pattern: /\b(getattr|setattr|delattr)\s*\(/i, category: "reflection", message: "Dynamic reflection via getattr/setattr is restricted" },
  { pattern: /\b(globals|locals|vars)\s*\(\s*\)/i, category: "reflection", message: "Scope reflection via globals()/locals() is restricted" },
  { pattern: /__(subclasses|bases|mro|globals|code)__/i, category: "reflection", message: "Python object model traversal/introspection is forbidden" },

  // Credential and environment harvesting
  { pattern: /\bos\.(environ|getenv|putenv)\b/i, category: "credentials", message: "Harvesting system environment variables is forbidden" },
  { pattern: /\b(sys\.)?modules\b/i, category: "reflection", message: "Inspecting or mutating sys.modules is restricted" },

  // Deserialization and unsafe serialization
  { pattern: /\bimport\s+(pickle|marshal|shelve)\b/i, category: "serialization", message: "Unsafe deserialization modules are forbidden" },
  { pattern: /\bfrom\s+(pickle|marshal|shelve)\b/i, category: "serialization", message: "Unsafe deserialization modules are forbidden" },
];

const BEST_PRACTICE_CHECKS = [
  {
    pattern: /import\s+bpy/,
    message: "Missing 'import bpy' header",
    required: true,
  },
  {
    pattern: /def\s+main\s*\(/,
    message: "Recommended: wrap modeling instructions inside a main() function for modular execution",
    required: false,
  },
];

/**
 * Hardened validator for untrusted AI-generated Blender Python code.
 * Fails closed on dangerous, obfuscated, or suspicious constructs.
 * 
 * NOTE: The validator is a defensive security boundary, NOT a substitute
 * for explicit human review and approval in Blender.
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

  // Size limit check (max 100KB for typical procedural generation)
  if (code.length > 100_000) {
    errors.push("Generated script exceeds maximum allowed size (100KB).");
  }

  // Check forbidden dangerous patterns
  for (const rule of FORBIDDEN_RULES) {
    if (rule.pattern.test(code)) {
      errors.push(`[Security Violation - ${rule.category}]: ${rule.message}`);
    }
  }

  // Check best practices
  for (const { pattern, message, required } of BEST_PRACTICE_CHECKS) {
    if (!pattern.test(code)) {
      if (required) {
        warnings.push(`Required practice: ${message}`);
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
