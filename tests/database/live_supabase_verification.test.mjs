import assert from "node:assert";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

export async function testLiveSupabaseSchemaAndRLS() {
  console.log("▶ Testing Live Supabase Database Infrastructure & RLS Policies...");

  // Load .env.local if present
  if (fs.existsSync(".env.local")) {
    const envContent = fs.readFileSync(".env.local", "utf8");
    envContent.split("\n").forEach((line) => {
      const [k, ...v] = line.split("=");
      if (k && v.length) process.env[k.trim()] = v.join("=").trim();
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || url.includes("placeholder-url")) {
    console.log("  ⚠ Skipping Live Supabase test: credentials not configured in environment");
    return;
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
}

if (process.argv[1]?.endsWith("live_supabase_verification.test.mjs")) {
  testLiveSupabaseSchemaAndRLS().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
}
