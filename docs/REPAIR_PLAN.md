# SculptorAI Repair Plan

## Baseline (2026-10-14)
- [x] Confirm repository identity and default branch via GitHub integration.
- [x] Clone `shreyaskhakal/sculptorai` into this workspace's `work/sculptorai` directory.
- [x] Inspect branch, commit, and working tree: `main` at `c45fb22`; clean at start.
- [x] Inspect package scripts, lockfile, existing tests, migrations, and readiness reports.
- [x] Attempt clean install and baseline checks. `npm ci` could not complete on this Windows host (EPERM creating a node_modules directory); initial test/lint/build attempts were consequently unavailable. A later `npm install --ignore-scripts --no-audit --no-fund` completed and enabled local checks.
- [x] Record baseline limits in this plan; the committed prior readiness report is not treated as evidence.
- [x] Inspect public deployment homepage and `/api/health` (HTTP 200 each); deployment source revision and runtime integration were not established by those responses.

## Repair and verification checklist
- [x] Trace authentication and demo-mode boundaries; explicit demo mode is marked and configured database errors no longer silently become in-memory writes.
- [x] Trace Gemini operations; missing credentials/provider errors no longer produce fabricated successful generation/vision/debug results.
- [x] Harden API error serialization and report health as liveness/configuration rather than asserting untested connectivity.
- [x] Add a local migration to restrict task-claim RPC execution and set a fixed search path; production migration remains unapplied.
- [x] Add regression checks for demo fallback, Gemini missing-key behavior, health response disclosure, and RPC migration text.
- [x] Rerun test, eval, lint, and typecheck after dependency updates; build attempts remain blocked by the Windows sandbox's `.next` directory `EPERM`.
- [x] Review final diff and status; no local secret files were added. Only `.env.example` is present.
- [x] Write `docs/REPAIR_AND_QA_REPORT.md` with evidence-based PASS/FAIL/BLOCKED/NOT TESTED statuses.
- [x] Inspect the live homepage and anonymous project CTA in a browser; remove the fixed sample-project route and synthetic project/code/geometry/presence/validation claims locally.
- [x] Add a regression check for empty studio defaults, accurate validation labeling, auth redirect, and homepage routing; rerun all local checks after completion.

## Constraints
- No production deploy, production configuration change, database migration application, force-push, or destructive production data operation is authorized.
- External Supabase, Gemini, Vercel, and Blender checks require available credentials/services/hardware and will be reported as blocked or not tested when unavailable.
- The production Supabase RPC privilege issue was verified by read-only catalog/advisor queries; this workspace's migration does not change the remote project.
