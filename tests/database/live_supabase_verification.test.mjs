import assert from "node:assert";
import { createClient } from "@supabase/supabase-js";

export async function testLiveSupabaseSchemaAndRLS() {
  console.log("▶ Testing Live Supabase Database Infrastructure & RLS Policies...");

  // Live tests must use a dedicated isolated test project, never app/deployment credentials.
  if (process.env.RUN_LIVE_SUPABASE_TESTS !== "true") {
    console.log("  ⚠ BLOCKED: set RUN_LIVE_SUPABASE_TESTS=true to opt into isolated Supabase integration checks");
    return "BLOCKED";
  }

  const url = process.env.SUPABASE_TEST_URL;
  const anonKey = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_TEST_SECRET_KEY;

  if (!url || !anonKey || !serviceKey || url.includes("placeholder")) {
    console.log("  ⚠ BLOCKED: dedicated SUPABASE_TEST_* credentials are unavailable");
    return "BLOCKED";
  }

  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  // 1. Verify core tables exist and can be queried by admin client
  const tables = [
    "projects",
    "conversations",
    "messages",
    "generations",
    "executions",
    "execution_events",
    "blender_devices",
    "scene_snapshots",
    "generation_versions",
    "templates",
    "ai_usage",
    "project_members",
    "marketplace_templates",
  ];

  for (const table of tables) {
    const { data, error } = await adminClient.from(table).select("*").limit(1);
    assert.strictEqual(error, null, `Table ${table} should be queryable by admin client without error`);
    assert.ok(Array.isArray(data), `Table ${table} query should return an array`);
  }
  console.log(`  ✓ All ${tables.length} Supabase tables verified and accessible`);

  // 2. Verify Anon Client with RLS enforces isolation
  if (anonKey && !anonKey.includes("placeholder")) {
    const anonClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });

    // Unauthenticated user should NOT be able to see private projects
    const { data: anonProjects, error: anonErr } = await anonClient.from("projects").select("*");
    // With RLS enabled, anon user either gets empty array or RLS error
    if (anonProjects) {
      assert.strictEqual(anonProjects.length, 0, "Anonymous unauthenticated client must NOT see any projects");
    }
    console.log("  ✓ Row Level Security (RLS) properly blocks unauthorized project reads");

    // Public templates table should be accessible
    const { data: publicTemplates } = await anonClient.from("templates").select("*");
    assert.ok(Array.isArray(publicTemplates), "Public templates table is publicly accessible as declared in policy");
    console.log("  ✓ Public RLS policy permits reading templates catalog");
  }

  console.log("Live Supabase Database & Security Verification Passed!\n");
  return "PASS";
}

if (process.argv[1]?.endsWith("live_supabase_verification.test.mjs")) {
  testLiveSupabaseSchemaAndRLS().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
}
