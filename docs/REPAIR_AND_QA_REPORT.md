# SculptorAI repair and QA report

**Audit date:** 2026-10-14
**Repository:** `shreyaskhakal/sculptorai`
**Checkout:** `main`, starting commit `c45fb22`
**Scope:** local code review and repairs, local automated checks, read-only public deployment and Supabase metadata checks. No production writes, database migration application, or deployment were performed.

## Executive status

The repository now fails closed when configured Supabase writes fail, restricts synthetic demo authentication to explicit demo mode, rejects missing Gemini configuration instead of returning fabricated AI success, and avoids exposing raw provider errors through affected API routes. A local SQL migration hardens the two task-claim RPCs. Those application changes are **not deployed**, and the migration is **not applied** to the live database.

**Production readiness: NOT VERIFIED.** The current evidence does not justify the earlier `96.8%` readiness claim in `docs/LIVE_QA_REPORT.md`; that document includes test totals, build status, live database behavior, and feature execution claims that this audit could not reproduce or independently substantiate. Treat its claims as historical and superseded by this report.

## Evidence and status

| Area | Status | Evidence / limit |
| --- | --- | --- |
| Checkout | PASS | Public GitHub repository cloned at `main`, starting from `c45fb22`; tree was clean before edits. |
| Supabase write fallback | PASS (local regression) | New regression test verifies a configured Supabase write error surfaces and is not converted to a successful in-memory write. |
| Demo authentication | PASS (local regression) | Explicit `DEMO_MODE=true` creates a marked demo identity; production request headers/tokens cannot assert demo mode. |
| Gemini failure handling | PASS (local regression) | All five provider operations fail clearly when key is missing. Provider output is not replaced with deterministic fabricated results. |
| Health API behavior | PASS (local regression) | New test asserts liveness and configuration reporting, with connectivity labeled `not_checked`; response does not contain key values. |
| Blender event stream authorization | PASS (local regression) | `/api/blender/stream` now requires a verified user and project ownership before subscribing; anonymous and inaccessible-project requests are tested as 401/404. |
| Blender add-on event thread safety | NOT TESTED (source repair made) | SSE worker now claims notified tasks using frozen auth/config, queues results, and updates Blender properties through a Blender main-thread timer. Add-on cleanup stops the timer. Blender runtime verification is unavailable. |
| Blender direct-generation execution persistence | NOT TESTED (source repair made) | Generation IDs are no longer misused as execution IDs. After artist approval, the add-on creates a persisted execution task, checks the server start response, and then executes locally. |
| Task-claim RPC migration | PASS (static local test) | Migration sets `SECURITY INVOKER`, fixed `search_path`, revokes execution from `PUBLIC`, `anon`, and `authenticated`, and grants it to `service_role`. This verifies file contents only. |
| Live task-claim RPC privileges | FAIL (production finding; pending remediation) | Read-only Supabase catalog/advisor results showed both live functions are `SECURITY DEFINER`, have no fixed search path, and are executable by `anon` and `authenticated`. The migration has not been run remotely. |
| Live RLS metadata | PARTIAL | Read-only query found 19 public base tables with RLS enabled. Security advisor also identified five tables with RLS enabled but no policies (`assets`, `conversations`, `debug_sessions`, `messages`, `usage_events`). RLS enabled alone does not prove appropriate access control. |
| Live database connectivity and tenant behavior | NOT TESTED | The public health endpoint only established configuration presence; it explicitly reported connectivity as unchecked. Dedicated isolated `SUPABASE_TEST_*` credentials were not available. No production data was modified. |
| Public deployment HTTP response | PASS (availability only) | `https://sculptorai.vercel.app/` and `/api/health` each returned HTTP 200. This does not verify the deployed commit or application flows. The sampled health response reported database configured and AI fallback mode; it did not confirm database connectivity. |
| Gemini integration / output quality | BLOCKED | No local Gemini key was available. Deterministic fixture tests are not provider tests. No Gemini request was sent. |
| Blender add-on source syntax | PASS | Bundled Python 3.12 AST-parsed all 10 `blender-addon/*.py` modules. This is syntax-only and does not import Blender's `bpy` runtime. |
| Blender add-on and real execution | NOT TESTED | Blender was not launched and hardware/add-on transport was not exercised. Local lifecycle and end-to-end checks use an in-process store and fixture results only. |
| Public browser inspection | FAIL (deployed behavior) | Read-only browser inspection found the anonymous homepage's Studio CTA opened `/projects/proj_cyberpunk_desk`; the route rendered a hardcoded desk script and plan, synthetic desk/monitor geometry, a “Validated bpy” badge, a connected Blender state, and a collaborator count of one. These were not backed by an authenticated project or real run. Local fixes remove these defaults and protect the route, but are not deployed. |
| Authenticated browser/project/studio E2E | NOT TESTED | No dedicated test account or isolated deployment was available. Signup/login, persisted project creation, Gemini generation, approval, and refresh behavior were not exercised in a live browser. Homepage HTTP 200 is not an end-to-end test. |
| Blender Python script compilation | PASS | The six script fixtures compiled with the bundled Python runtime. The normal `python` command is absent; test commands now honor `PYTHON` for an alternate executable. |
| Lint | PASS | `npm run lint` completed with no warnings or errors after stabilizing the auth-header callbacks and effect dependencies in the dashboard and project workspace. |
| TypeScript | PASS | `npx tsc --noEmit` completed with exit code 0. |
| Production build | PASS | Final `npm run build` completed with exit code 0 on Next.js 14.2.35; compilation, lint/type validation, and all 27 static pages completed. Earlier attempts hit transient Windows `.next` directory `EPERM` errors, which did not recur in the final build. |
| Next.js security patch | PASS (known advisory coverage) | `next` and `eslint-config-next` are pinned at 14.2.35, the vendor-patched 14.x release for the cited December 2025 RSC advisory. This does not establish coverage for future/unpublished advisories. |

## Root causes fixed in this checkout

1. **Misleading fallback success:** database facades could return process-local fallback data after Supabase was configured but failed. The fallback guard now permits in-memory mode only when local/demo configuration is explicitly active.
2. **Implicit demo identity:** auth context could provide a synthetic user without a sufficiently explicit local demo boundary. Demo identity creation now depends on `DEMO_MODE=true`; production configuration gaps do not synthesize a signed-in user.
3. **Fabricated AI success:** several AI paths produced deterministic plans, scene edits, image-analysis output, or debugging responses when credentials/provider calls failed. Production paths now require Gemini and return sanitized errors; deterministic helpers are retained only as test fixtures.
4. **Unsafe/raw error handling:** selected routes exposed provider/storage messages. They now return generic, status-classified errors. The health endpoint now distinguishes configuration from connectivity.
5. **Unauthenticated Blender event stream:** the SSE route subscribed by arbitrary `projectId` without verifying a user, exposing project events and task scripts. It now verifies identity and project ownership before opening a stream.
6. **Blender thread and task lifecycle:** the listener thread modified `bpy` properties directly, cloud task events were displayed without claiming, and local generation stored a generation ID in the execution ID field. Work now passes claimed tasks to the main thread, persists locally generated execution tasks only after explicit approval, and checks server start failures before running code. These changes have only source-level verification.
7. **Overstated test evidence:** test/eval output previously implied real provider, Blender, persistence, and syntax verification that fixture-only checks could not establish. Labels and reporting have been corrected; unavailable Python checks report `BLOCKED`.
8. **Privileged RPC exposure:** the local migration and static test address live advisor findings, but the remote security issue remains until the migration is reviewed, applied, and re-verified.
9. **Fabricated studio state:** the workspace initialized a demo desk plan and destructive Blender script in every project, the viewer generated synthetic geometry when no real plan/snapshot existed, and UI badges implied validation, Blender presence, and a collaborator. Homepage CTAs also opened a fixed project ID. The local workspace now loads only an authenticated/authorized project, begins with no generated plan or script, shows an empty preview state, labels static validation accurately, blocks execution until validation passes, and displays actual collaborator counts. The homepage routes to signup/dashboard. A source regression test covers these conditions. The public deployment still has the old behavior until a reviewed release is deployed.

## Commands and environment notes

- `npm ci`: **BLOCKED** on this Windows host by an `EPERM` directory-creation error under `node_modules`.
- `npm install --ignore-scripts --no-audit --no-fund`: completed after roughly three minutes and restored the working dependency tree; Next.js and its ESLint config are now at 14.2.35, and `jiti` is declared as a dev dependency because existing package scripts already require it.
- Initial `npm test`, `npm run test:evals`, `npm run lint`, `npm run build`, and TypeScript checks were attempted before dependencies were available and could not run meaningfully.
- Final `npm test` (with `PYTHON` set to the bundled Python 3.12 executable): exit code 0, **17 passed, 0 failed, 1 blocked**. The blocker is dedicated isolated Supabase credentials.
- Final `npm run test:evals` (same `PYTHON` override): exit code 0; 49/49 fixture schema, safety, and Python syntax checks passed. These are deterministic fixtures, not Gemini provider calls; the provider remains blocked.
- Final `npm run lint`: exit code 0, no warnings or errors.
- Final `npx tsc --noEmit`: exit code 0.
- Bundled Python AST check: all 10 Blender add-on Python modules parsed successfully; this does not verify Blender API compatibility or runtime behavior.
- Final `npm run build`: exit code 0. Next.js compiled successfully, completed lint/type validation, generated all 27 static pages, and collected build traces. Earlier attempts had failed with `.next` directory `EPERM`, but the final run succeeded.

## Required follow-up before production readiness can be claimed

1. Review and apply `supabase/migrations/20261014134255_restrict_task_claim_rpc.sql` through the normal database change process; then rerun Supabase security advisors and verify function ACLs and `search_path` from the live catalog.
2. Decide intended access rules for the five RLS-enabled tables without policies, then add and test least-privilege policies. Do not add broad policies just to silence the advisor.
3. Install Python and Blender (including the supported add-on/runtime), then run actual syntax, add-on transport, approval, execution, and result-reporting checks.
4. Configure Gemini in a safe test environment and verify real generation, vision, debug, timeout, quota, malformed-output, and refusal/error behavior.
5. Run the app against a dedicated isolated Supabase test project using only `SUPABASE_TEST_*` credentials; validate schema and cross-tenant access without querying/modifying production user data.
6. Confirm the deployed Vercel revision, deploy reviewed changes through the normal release path, then check deployed health and smoke-test authenticated user flows.

## Unresolved issues by priority

- **P0:** The live task-claim RPCs remain callable by `anon` and `authenticated` while defined as `SECURITY DEFINER` with no fixed search path. Apply the reviewed local migration and verify the live ACL/search path before treating execution claiming as safe.
- **P1:** Five RLS-enabled tables have no policies; intended access rules and least-privilege policies need review. Live Supabase CRUD/tenant checks, Gemini integration, browser user journeys, Blender execution, and Vercel revision verification remain blocked or not tested. The SSE source currently bridges only the process-local event bus, so delivery across separate serverless instances is not established.
- **P2:** No additional P2 blocker was confirmed in this local repair pass. Performance and broader usability checks were not independently benchmarked.

## References

- Next.js 14.2.15 was pinned at audit start. The official [December 11, 2025 Next.js security update](https://nextjs.org/blog/security-update-2025-12-11) lists 14.2.35 as patched for the covered RSC vulnerabilities. Dependency update and post-update checks are recorded separately in the final report update.
