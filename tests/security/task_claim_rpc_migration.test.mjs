import assert from "node:assert/strict";
import fs from "node:fs";

const migrationPath = "supabase/migrations/20261014134255_restrict_task_claim_rpc.sql";
const sql = fs.readFileSync(migrationPath, "utf8");

for (const signature of [
  "claim_next_execution_task(uuid, text)",
  "claim_execution_task_by_id(uuid, uuid, text)",
]) {
  const escaped = signature.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(sql, new RegExp(`ALTER FUNCTION public\\.${escaped}[\\s\\S]*?SECURITY INVOKER`));
  assert.match(sql, new RegExp(`REVOKE ALL ON FUNCTION public\\.${escaped}[\\s\\S]*?FROM PUBLIC, anon, authenticated`));
  assert.match(sql, new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${escaped}[\\s\\S]*?TO service_role`));
}

assert.match(sql, /SET search_path = pg_catalog, public/);
console.log("  ✓ Claim RPC migration restricts execution to service_role and fixes search_path");
