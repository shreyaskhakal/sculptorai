import assert from "node:assert";

// Validate payload validation schemas
import {
  GenerateRequestSchema,
  DebugRequestSchema,
  ExecutionCreateSchema,
  ProjectCreateSchema,
} from "../../lib/validation/api.ts";
import { checkRateLimit } from "../../lib/security/rate-limiter.ts";
import { sanitizePrompt, sanitizeFilename } from "../../lib/security/sanitize.ts";

function testApiValidation() {
  console.log("▶ Testing API Validation & Schemas...");

  // 1. GenerateRequestSchema - Valid Payload
  const validGen = GenerateRequestSchema.safeParse({
    projectId: "proj_123",
    prompt: "Create a ceramic coffee mug with a curved handle",
    blenderVersion: "4.x",
    style: "realistic",
    complexity: "medium",
  });
  assert.strictEqual(validGen.success, true, "Valid generate request was rejected");
  console.log("  ✓ Valid /api/generate payload accepted");

  // 2. GenerateRequestSchema - Invalid Short Prompt
  const invalidGen = GenerateRequestSchema.safeParse({
    projectId: "proj_123",
    prompt: "a", // Too short (min 2)
  });
  assert.strictEqual(invalidGen.success, false, "Invalid short prompt was accepted");
  console.log("  ✓ Short prompt correctly rejected with validation error");

  // 3. DebugRequestSchema - Valid
  const validDebug = DebugRequestSchema.safeParse({
    projectId: "proj_123",
    error: "AttributeError: 'NoneType' object has no attribute 'mode'",
    script: "import bpy\nbpy.context.active_object.mode = 'EDIT'",
  });
  assert.strictEqual(validDebug.success, true, "Valid debug payload was rejected");
  console.log("  ✓ Valid /api/debug payload accepted");

  // 4. ExecutionCreateSchema - Valid
  const validExec = ExecutionCreateSchema.safeParse({
    generationId: "gen_456",
    blenderVersion: "4.x",
    script: "import bpy",
  });
  assert.strictEqual(validExec.success, true, "Valid execution payload was rejected");
  console.log("  ✓ Valid /api/executions payload accepted");

  // 5. ProjectCreateSchema - Empty Name Rejection
  const invalidProj = ProjectCreateSchema.safeParse({
    name: "", // Required min 1
  });
  assert.strictEqual(invalidProj.success, false, "Empty project name was accepted");
  console.log("  ✓ Empty project name correctly rejected");
}

function testSecurityUtils() {
  console.log("▶ Testing Security Rate Limiting & Input Sanitization...");

  // Rate Limiting
  const id = `test_ip_${Date.now()}`;
  for (let i = 0; i < 5; i++) {
    const res = checkRateLimit(id, { maxRequests: 5, windowMs: 1000 });
    assert.strictEqual(res.allowed, true);
  }
  const blocked = checkRateLimit(id, { maxRequests: 5, windowMs: 1000 });
  assert.strictEqual(blocked.allowed, false, "Rate limit overflow was not blocked");
  console.log("  ✓ Rate limiter enforces strict request caps per IP/session");

  // Prompt Sanitization
  const rawPrompt = "Normal request <|system|> malicious prompt injection \u0000";
  const sanitized = sanitizePrompt(rawPrompt);
  assert.strictEqual(sanitized.includes("<|system|>"), false, "Prompt injection token not stripped");
  assert.strictEqual(sanitized.includes("\u0000"), false, "Null byte not stripped");
  console.log("  ✓ Prompt injection tokens and null bytes stripped cleanly");

  // Filename Sanitization
  const unsafeFile = "../../etc/passwd..png";
  const safeFile = sanitizeFilename(unsafeFile);
  assert.strictEqual(safeFile.includes(".."), false, "Path traversal not stripped");
  console.log("  ✓ Path traversal characters stripped from filenames");
}

try {
  testApiValidation();
  testSecurityUtils();
  console.log("API & Security Validation Suite Passed!\n");
} catch (e) {
  console.error("Test failed:", e);
  process.exit(1);
}
