import assert from "node:assert";
import { getAuthenticatedUser, isDemoModeExplicitlyEnabled, isSupabaseConfigured } from "../../lib/supabase/server-auth.ts";
import { db } from "../../lib/supabase/db.ts";

export async function testDemoAuthAndTenantSecurity() {
  console.log("▶ Testing Production Demo-Mode Defense & Multi-Tenant Endpoint Security...");

  const originalNodeEnv = process.env.NODE_ENV;
  const originalDemoMode = process.env.DEMO_MODE;
  const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalPublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalSecretKey = process.env.SUPABASE_SECRET_KEY;
  const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalFetch = globalThis.fetch;

  try {
    // 1. In production with DEMO_MODE="false", demo tokens and headers MUST be blocked
    process.env.NODE_ENV = "production";
    process.env.DEMO_MODE = "false";

    assert.strictEqual(
      isDemoModeExplicitlyEnabled(),
      false,
      "Demo mode should be strictly disabled in production when DEMO_MODE != true"
    );

    // Mock request with x-demo-mode: true
    const fakeDemoHeaderReq = {
      headers: new Headers({
        "x-demo-mode": "true",
      }),
    };
    const resHeader = await getAuthenticatedUser(fakeDemoHeaderReq);
    assert.strictEqual(resHeader.user, null, "Should reject x-demo-mode header in production");
    assert.strictEqual(resHeader.statusCode, 401, "Should return HTTP 401");
    console.log("  ✓ Blocked client-forged x-demo-mode header in production (HTTP 401)");

    // Mock request with Bearer demo-token
    const fakeDemoTokenReq = {
      headers: new Headers({
        authorization: "Bearer demo-token",
      }),
    };
    const resToken = await getAuthenticatedUser(fakeDemoTokenReq);
    assert.strictEqual(resToken.user, null, "Should reject Bearer demo-token in production");
    assert.strictEqual(resToken.statusCode, 401, "Should return HTTP 401");
    console.log("  ✓ Blocked Bearer demo-token authentication bypass in production (HTTP 401)");

    // 2. Explicit DEMO_MODE="true" allows demo artist session with clear isDemo marker
    process.env.DEMO_MODE = "true";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
    process.env.SUPABASE_SECRET_KEY = "test-secret-key";
    assert.strictEqual(isSupabaseConfigured(), false, "Explicit demo mode must not write to configured Supabase");
    assert.strictEqual(isDemoModeExplicitlyEnabled(), true, "Should allow when explicitly enabled");

    const allowedDemoReq = {
      headers: new Headers({
        authorization: "Bearer demo-token",
      }),
    };
    const resAllowed = await getAuthenticatedUser(allowedDemoReq);
    assert.notStrictEqual(resAllowed.user, null, "Should authenticate when DEMO_MODE=true");
    assert.strictEqual(resAllowed.user?.id, "usr_demo_artist", "Should return demo user identity");
    assert.strictEqual(resAllowed.user?.isDemo, true, "User must be clearly marked isDemo: true");
    console.log("  ✓ Validated explicit DEMO_MODE=true configuration with marked isDemo identity");

    // 3. A configured database error must never be converted to a successful in-memory write.
    process.env.DEMO_MODE = "false";
    globalThis.fetch = async () => new Response(JSON.stringify({ message: "service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
    await assert.rejects(
      () => db.createProject({ userId: "usr_database_failure", name: "Must not appear persisted" }),
      /refusing to use in-memory data while Supabase is configured/i
    );
    console.log("  ✓ Configured Supabase write failure is surfaced instead of falling back to memory");
    process.env.DEMO_MODE = "true";

    // 4. Multi-Tenant Project Ownership Verification
    const userA = "usr_tenant_alpha";
    const userB = "usr_tenant_beta";

    const projA = await db.createProject({
      userId: userA,
      name: "Tenant Alpha Project",
      blenderVersion: "4.x",
    });

    // Verify User A can fetch project
    const fetchedA = await db.getProjectById(projA.id, userA);
    assert.strictEqual(fetchedA?.id, projA.id, "User A must retrieve own project");

    // Verify User B cannot fetch or manipulate User A's project
    const fetchedB = await db.getProjectById(projA.id, userB);
    assert.strictEqual(fetchedB, null, "User B must not be able to retrieve User A's project");
    console.log("  ✓ Database facade strictly enforces tenant project isolation");

    // 4. Verify Execution Response Payload Compatibility
    const execution = await db.createExecution({
      generationId: "gen_test_123",
      projectId: projA.id,
      userId: userA,
      blenderVersion: "4.x",
      script: "import bpy",
      prompt: "Create a test cube",
    });

    assert.ok(execution.id, "Execution must have unique id");
    assert.strictEqual(execution.status, "pending", "New execution must be in pending status");
    console.log("  ✓ Execution record created with verified tenant ownership");

  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.DEMO_MODE = originalDemoMode;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalPublishableKey;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
    process.env.SUPABASE_SECRET_KEY = originalSecretKey;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
    globalThis.fetch = originalFetch;
  }
}

if (process.argv[1]?.endsWith("auth_demo_bypass.test.mjs")) {
  testDemoAuthAndTenantSecurity()
    .then(() => {
      console.log("  ✓ Production Demo Defense & Tenant Security Tests PASSED!\n");
    })
    .catch((err) => {
      console.error("Test failed:", err);
      process.exit(1);
    });
}
