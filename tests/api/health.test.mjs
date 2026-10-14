import assert from "node:assert/strict";
import { GET } from "../../app/api/health/route.ts";

export async function testHealthEndpoint() {
  const envNames = [
    "GEMINI_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const original = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
  try {
    for (const name of envNames) delete process.env[name];
    const response = await GET();
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.status, "alive");
    assert.equal(body.checks.databaseConfiguration, "missing_configuration");
    assert.equal(body.checks.authenticationConfiguration, "missing_configuration");
    assert.equal(body.checks.geminiConfiguration, "missing_configuration");
    assert.equal(body.checks.databaseConnectivity, "not_checked");
    assert.equal(body.checks.geminiConnectivity, "not_checked");
    assert.equal(JSON.stringify(body).includes("key"), false, "health response must not disclose key values");
    console.log("  ✓ Health endpoint reports liveness/configuration without claiming connectivity or exposing secrets");
  } finally {
    for (const [name, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}
