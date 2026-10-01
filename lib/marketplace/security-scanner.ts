/**
 * SCULPTOR AI — Marketplace Security Pipeline & Capability Scanner
 * Enforces strict capability boundaries and AST-level safety on all community scripts.
 */

import { validateBlenderScript } from "@/lib/blender/validator";

export interface DeclaredCapabilities {
  filesystem: boolean;
  network: boolean;
  external_process: boolean;
  blender_api: boolean;
  geometry: boolean;
  materials: boolean;
  modifiers: boolean;
}

export interface SecurityScanResult {
  passed: boolean;
  score: "SECURE" | "SUSPICIOUS" | "CRITICAL_REJECT";
  violations: string[];
  detectedCapabilities: Partial<DeclaredCapabilities>;
  scanTimestamp: string;
}

export function scanMarketplaceScript(
  script: string,
  declaredCapabilities: Partial<DeclaredCapabilities> = {}
): SecurityScanResult {
  const violations: string[] = [];

  // 1. Run core AST validator
  const coreValidation = validateBlenderScript(script);
  if (!coreValidation.isValid) {
    violations.push(...coreValidation.errors);
  }

  // 2. Enforce zero-tolerance forbidden primitives
  const forbiddenPatterns = [
    { pattern: /\beval\s*\(/i, reason: "Forbidden dynamic evaluation eval()" },
    { pattern: /\bexec\s*\(/i, reason: "Forbidden dynamic execution exec()" },
    { pattern: /\bos\.(system|popen|spawn)/i, reason: "Forbidden OS process execution" },
    { pattern: /\bsubprocess\./i, reason: "Forbidden subprocess module invocation" },
    { pattern: /\bshutil\./i, reason: "Forbidden destructive filesystem operations" },
    { pattern: /\bsocket\./i, reason: "Forbidden raw network socket operations" },
    { pattern: /\burllib|requests|http\.client/i, reason: "Forbidden network requests" },
    { pattern: /\bos\.environ/i, reason: "Forbidden environment variable harvesting" },
    { pattern: /__subclasses__|__mro__|__bases__/i, reason: "Forbidden Python object model traversal" },
    { pattern: /getattr\s*\(\s*__builtins__/i, reason: "Forbidden builtins reflection bypass" },
  ];

  for (const { pattern, reason } of forbiddenPatterns) {
    if (pattern.test(script)) {
      violations.push(reason);
    }
  }

  // 3. Capability boundary verification
  const detectedCapabilities: Partial<DeclaredCapabilities> = {
    filesystem: /\bopen\s*\(|pathlib\./i.test(script),
    network: /\b(socket|urllib|requests|http)\b/i.test(script),
    external_process: /\b(subprocess|os\.system|popen)\b/i.test(script),
    blender_api: /\bbpy\b/i.test(script),
    geometry: /\b(primitive|mesh|bmesh|vertices|faces)\b/i.test(script),
    materials: /\b(principled_bsdf|materials|node_tree)\b/i.test(script),
    modifiers: /\bmodifiers\.new\b/i.test(script),
  };

  if (!declaredCapabilities.filesystem && detectedCapabilities.filesystem) {
    violations.push("Code attempts filesystem operations without declared 'filesystem' capability");
  }

  if (!declaredCapabilities.network && detectedCapabilities.network) {
    violations.push("Code attempts network operations without declared 'network' capability");
  }

  if (!declaredCapabilities.external_process && detectedCapabilities.external_process) {
    violations.push("Code attempts process spawning without declared 'external_process' capability");
  }

  const passed = violations.length === 0;
  let score: SecurityScanResult["score"] = "SECURE";
  if (!passed) {
    score = violations.some((v) => v.toLowerCase().includes("process") || v.toLowerCase().includes("forbidden"))
      ? "CRITICAL_REJECT"
      : "SUSPICIOUS";
  }

  return {
    passed,
    score,
    violations,
    detectedCapabilities,
    scanTimestamp: new Date().toISOString(),
  };
}

export function scanTemplateSecurity(
  script: string,
  declaredCapabilities?: Partial<DeclaredCapabilities>
) {
  const result = scanMarketplaceScript(script, declaredCapabilities);
  return {
    safe: result.passed,
    score: result.score === "SECURE" ? 100 : result.score === "SUSPICIOUS" ? 60 : 0,
    violations: result.violations,
    capabilities: {
      filesystem: Boolean(result.detectedCapabilities.filesystem),
      network: Boolean(result.detectedCapabilities.network),
      external_process: Boolean(result.detectedCapabilities.external_process),
      blender_api: Boolean(result.detectedCapabilities.blender_api),
      geometry: Boolean(result.detectedCapabilities.geometry),
      materials: Boolean(result.detectedCapabilities.materials),
      modifiers: Boolean(result.detectedCapabilities.modifiers),
    },
    scannedAt: result.scanTimestamp,
  };
}
