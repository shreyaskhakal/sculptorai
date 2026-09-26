import { execSync } from "node:child_process";

console.log("=================================================");
console.log("  SCULPTOR AI — MASTER TEST SUITE RUNNER         ");
console.log("=================================================\n");

try {
  // 1. Run Unit Code Safety Validator Test
  execSync("node tests/unit/validator.test.mjs", { stdio: "inherit" });
  console.log("");

  // 2. Run AI Prompt & Structured Schema Test
  execSync("node tests/ai/generation.test.mjs", { stdio: "inherit" });
  console.log("");

  // 3. Run API Schemas & Security Sanitization Test
  execSync("node tests/api/endpoints.test.mjs", { stdio: "inherit" });
  console.log("");

  // 4. Run Authorization & User Isolation Test
  execSync("node tests/security/auth_rls.test.mjs", { stdio: "inherit" });
  console.log("");

  // 5. Run Blender Python Scripts Test
  execSync("python tests/blender/scripts.test.py", { stdio: "inherit" });

  console.log("=================================================");
  console.log("  ✓ ALL 5 TEST SUITES PASSED 100% CLEANLY!       ");
  console.log("=================================================");
} catch (error) {
  console.error("Test execution failed:", error);
  process.exit(1);
}
