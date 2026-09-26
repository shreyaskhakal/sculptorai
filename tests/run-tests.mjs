import { execSync } from "node:child_process";

console.log("=================================================");
console.log("  SCULPTOR AI — AUTOMATED TEST SUITE RUNNER      ");
console.log("=================================================\n");

try {
  // 1. Run Unit Validator Test
  execSync("node tests/unit/validator.test.mjs", { stdio: "inherit" });
  console.log("");

  // 2. Run AI Prompt & Schema Test
  execSync("node tests/ai/generation.test.mjs", { stdio: "inherit" });
  console.log("");

  // 3. Run Blender Scripts Python Test
  execSync("python tests/blender/scripts.test.py", { stdio: "inherit" });

  console.log("=================================================");
  console.log("  ✓ ALL TEST SUITES PASSED CLEANLY!              ");
  console.log("=================================================");
} catch (error) {
  console.error("Test execution failed:", error);
  process.exit(1);
}
