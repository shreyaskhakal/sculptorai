import { execSync } from "node:child_process";
import { testDatabasePersistence } from "./database/persistence.test.mjs";
import { testExecutionLifecycle } from "./execution/lifecycle.test.mjs";
import { testEndToEndWorkflow } from "./e2e/end-to-end.test.mjs";
import { testRealtimeBroadcast } from "./realtime/broadcast.test.mjs";
import { testRBACMatrix } from "./security/rbac.test.mjs";
import { testMarketplaceSecurity } from "./marketplace/security_pipeline.test.mjs";

console.log("=================================================");
console.log("  SCULPTOR AI — MASTER TEST SUITE RUNNER         ");
console.log("=================================================\n");

async function runAllSuites() {
  try {
    // 1. Run Unit Code Safety Validator & Bypass Defense Test
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

    // 5. Run Database Persistence & Multi-Tenant Isolation
    await testDatabasePersistence();
    console.log("");

    // 6. Run Execution Pipeline Lifecycle & Atomic Claiming
    await testExecutionLifecycle();
    console.log("");

    // 7. Run Complete End-to-End Workflow & Error Repair Loop
    await testEndToEndWorkflow();
    console.log("");

    // 8. Run Blender Python Scripts Test
    execSync("python tests/blender/scripts.test.py", { stdio: "inherit" });
    console.log("");

    // 9. Run Supabase Realtime Broadcast & Idempotency Test
    await testRealtimeBroadcast();
    console.log("");

    // 10. Run Multi-User Project RBAC Permission Matrix Test
    await testRBACMatrix();
    console.log("");

    // 11. Run Marketplace Capability Scanner & Security Test
    await testMarketplaceSecurity();

    console.log("\n=================================================");
    console.log("  ✓ ALL 11 TEST SUITES PASSED 100% CLEANLY!      ");
    console.log("=================================================");
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

runAllSuites();
