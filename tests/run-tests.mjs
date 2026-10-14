import { execFileSync, execSync, spawnSync } from "node:child_process";
import { testDatabasePersistence } from "./database/persistence.test.mjs";
import { testExecutionLifecycle } from "./execution/lifecycle.test.mjs";
import { testEndToEndWorkflow } from "./e2e/end-to-end.test.mjs";
import { testRealtimeBroadcast } from "./realtime/broadcast.test.mjs";
import { testRBACMatrix } from "./security/rbac.test.mjs";
import { testMarketplaceSecurity } from "./marketplace/security_pipeline.test.mjs";
import { testDemoAuthAndTenantSecurity } from "./security/auth_demo_bypass.test.mjs";
import { testLiveSupabaseSchemaAndRLS } from "./database/live_supabase_verification.test.mjs";
import { testGeminiRequiresConfiguration } from "./ai/provider.test.mjs";
import { testHealthEndpoint } from "./api/health.test.mjs";
import { testBlenderStreamAuthorization } from "./api/blender_stream.test.mjs";
import { testNoFabricatedStudioDefaults } from "./ui/no_fabricated_studio_defaults.test.mjs";
import { testGuestAuthAndIsolation } from "./security/guest_auth_and_isolation.test.mjs";

console.log("=================================================");
console.log("  SCULPTOR AI — MASTER TEST SUITE RUNNER         ");
console.log("=================================================\n");

const suiteResults = [];
const originalDemoMode = process.env.DEMO_MODE;

async function runSuite(name, run) {
  try {
    const result = await run();
    suiteResults.push({ name, status: result === "BLOCKED" ? "BLOCKED" : "PASS" });
  } catch (error) {
    suiteResults.push({ name, status: "FAIL" });
    throw error;
  }
}

function pythonAvailable() {
  const result = spawnSync(process.env.PYTHON || "python", ["--version"], { stdio: "ignore" });
  return !result.error && result.status === 0;
}

function printSummary() {
  const passed = suiteResults.filter((result) => result.status === "PASS").length;
  const failed = suiteResults.filter((result) => result.status === "FAIL").length;
  const blocked = suiteResults.filter((result) => result.status === "BLOCKED").length;
  console.log("\n=================================================");
  console.log(`  Test suites: ${passed} passed, ${failed} failed, ${blocked} blocked`);
  for (const result of suiteResults) console.log(`  ${result.status}: ${result.name}`);
  console.log("=================================================\n");
}

async function runAllSuites() {
  process.env.DEMO_MODE = "true";
  try {
    // 1. Run Unit Code Safety Validator & Bypass Defense Test
    await runSuite("Blender code safety validator", () => execSync("node tests/unit/validator.test.mjs", { stdio: "inherit" }));
    console.log("");

    // 2. Run AI Prompt & Structured Schema Test
    await runSuite("AI output fixture shape checks", () => execSync("node tests/ai/generation.test.mjs", { stdio: "inherit" }));
    await runSuite("Gemini missing-key behavior", testGeminiRequiresConfiguration);
    console.log("");

    // 3. Run Endpoint Surface & Guard Tests
    await runSuite("Health endpoint configuration disclosure", testHealthEndpoint);
    await runSuite("Blender stream authentication and project isolation", testBlenderStreamAuthorization);
    await runSuite("Studio fabricated-data safeguards", testNoFabricatedStudioDefaults);
    console.log("");

    // 4. Run Authorization & User Isolation Test
    await runSuite("Authorization and user isolation", () => execSync("node tests/security/auth_rls.test.mjs", { stdio: "inherit" }));
    console.log("");

    // 5. Run Production Demo Mode Defense & Tenant Security Test
    await runSuite("Demo auth and configured database failure behavior", testDemoAuthAndTenantSecurity);
    console.log("");

    // 6. Run Guest Access, Cryptographic Token Verification & Cross-Tenant Isolation
    await runSuite("Guest access and token isolation", testGuestAuthAndIsolation);
    console.log("");

    // Verify the local SQL hardening migration without applying it to any database.
    await runSuite("Task-claim RPC privilege migration", () => execSync("node tests/security/task_claim_rpc_migration.test.mjs", { stdio: "inherit" }));
    console.log("");

    // 7. Run Database Persistence & Multi-Tenant Isolation
    await runSuite("Process-local demo-store CRUD and tenant isolation", testDatabasePersistence);
    console.log("");

    // 8. Run Execution Pipeline Lifecycle & Atomic Claiming
    await runSuite("Execution lifecycle", testExecutionLifecycle);
    console.log("");

    // 9. Run Complete End-to-End Workflow & Error Repair Loop
    await runSuite("Local end-to-end fixture workflow", testEndToEndWorkflow);
    console.log("");

    // 10. Run Blender Python Scripts Test
    await runSuite("Blender Python script compilation", () => {
      if (!pythonAvailable()) {
        console.log("BLOCKED: Python is not installed; Blender script compilation did not run.");
        return "BLOCKED";
      }
      return execFileSync(process.env.PYTHON || "python", ["tests/blender/scripts.test.py"], { stdio: "inherit" });
    });
    console.log("");

    // 11. Run Supabase Realtime Broadcast & Idempotency Test
    await runSuite("Realtime broadcast and idempotency", testRealtimeBroadcast);
    console.log("");

    // 12. Run Multi-User Project RBAC Permission Matrix Test
    await runSuite("RBAC permission matrix", testRBACMatrix);
    console.log("");

    // 13. Run Marketplace Capability Scanner & Security Test
    await runSuite("Marketplace security pipeline", testMarketplaceSecurity);
    console.log("");

    // 14. Run Live Supabase Database Infrastructure & RLS Verification
    await runSuite("Live Supabase schema and RLS", testLiveSupabaseSchemaAndRLS);
    printSummary();
  } catch (error) {
    console.error("Test execution failed:", error);
    printSummary();
    process.exitCode = 1;
  } finally {
    if (originalDemoMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = originalDemoMode;
  }
}

runAllSuites();
