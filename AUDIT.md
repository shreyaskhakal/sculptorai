# SculptorAI — Full Architectural & Security Audit

**Date:** September 2026  
**Auditor:** SculptorAI Engineering Team (Lead Full-Stack / AI / Blender / Security)  
**Repository State:** Pre-Completion MVP Audit  

---

## 1. Executive Summary

The SculptorAI repository contains a modern, high-quality Next.js (App Router) + Tailwind CSS frontend, a structured Blender add-on, comprehensive Zod validation schemas, Google Gemini AI integrations, and initial Supabase schema migrations. 

However, critical subsystems—specifically **persistence, authentication enforcement, the execution pipeline, and real-time Blender synchronization**—are currently either running in-memory or simulated with mock timers. This document provides an exhaustive breakdown of the working, simulated, broken, missing, and vulnerable areas of the codebase.

---

## 2. Component-by-Component Audit

### 2.1 Working Components
- **Frontend Presentation & Layout**: Responsive dark aesthetic, landing page (`/`), authentication pages (`/auth/login`, `/auth/signup`), and Studio workspace (`/projects/[projectId]`).
- **Code Viewer & Plan Visualizer**: Monaco code editor integration (`CodeViewer.tsx`), structured plan rendering (`ModelPlanCard.tsx`), and visual diff viewer (`DiffViewer.tsx`).
- **Gemini AI Core Prompting**: Well-crafted system prompts (`lib/ai/prompts.ts`) for Blender Architect, Image Analyzer, and Blender Debugger.
- **Input Sanitization & Rate Limiting**: In-memory sliding-window rate limiter (`lib/security/rate-limiter.ts`) and prompt sanitization (`lib/security/sanitize.ts`).
- **Blender Add-on Foundation**: Preferences UI, sidebar panels in 3D Viewport (`panels.py`), modal operators (`operators.py`), and safe execution runner with stdout/stderr redirection (`executor.py`).
- **Existing Unit Tests**: 5 test suites (`tests/run-tests.mjs`) validating prompt schemas, AST regex checks, basic API schemas, rate limiting, and Blender script compilation.

---

### 2.2 Partially Working Components
- **Supabase Database & Migrations**: `supabase/migrations/20260926_sculptor_init.sql` defines 9 tables and RLS policies, but the application API routes currently bypass Supabase in favor of in-memory objects.
- **AI Model Provider**: `GeminiAIProvider` connects to Google Generative AI, but hardcodes `gemini-1.5-flash` in source code without environment variable overrides (`GEMINI_MODEL_GENERATION`, `GEMINI_MODEL_VISION`, `GEMINI_MODEL_DEBUG`) or schema retry logic.
- **Image Analysis**: Multipart & base64 endpoint (`/api/analyze-image`) accepts images, but base64 payloads risk exceeding database limits if not moved to Supabase Storage.
- **Dashboard UI**: Renders projects, but statistics (active generations = 8) and recent activity feeds are hardcoded static data.
- **Blender Add-on Polling**: Has a basic `fetch_pending_tasks` operator, but lacks atomic task claiming, lifecycle progression (`pending` -> `claimed` -> `running` -> `success`/`error`), and robust auth token validation.

---

### 2.3 Simulated Behavior (Critical)
- **Studio Execution Simulator (`app/projects/[projectId]/page.tsx`)**:
  - `handleApproveAndRun()` dispatches an execution record, then executes:
    ```typescript
    await new Promise((r) => setTimeout(r, 1100));
    setExecutionStatus("success");
    setExecutionDuration(290);
    setExecutionStdout("[SculptorAI Executor] Scene cleared.\n...");
    ```
  - **Verdict**: Completely fake execution and fake stdout. Must be replaced with real pending execution creation and polling/realtime tracking of the Blender add-on.
- **In-Memory Project Store (`app/api/projects/route.ts`)**:
  - Uses `memoryProjects` array initialized with fake Cyberpunk Desk and Low-Poly Furniture projects.
- **In-Memory Executions Store (`app/api/executions/route.ts`)**:
  - Uses `executionRecords = new Map<string, ...>()`, losing all execution history on server restart.
- **Hardcoded Generations Endpoint (`app/api/projects/[id]/generations/route.ts`)**:
  - Returns hardcoded mock generations array (`gen_sample_1`, `gen_sample_2`).

---

### 2.4 Broken Components
- **Server-Side Authentication**:
  - `/api/projects`, `/api/executions`, `/api/generate`, `/api/debug`, and `/api/analyze-image` do not verify the Supabase JWT cookie or Bearer token.
  - User ID is hardcoded as `"usr_default"`, violating user isolation.
- **Cross-User Project Isolation**:
  - Since APIs don't authenticate requests against `auth.users`, any user or client can query or overwrite all in-memory projects and executions.

---

### 2.5 Missing Endpoints & Capabilities
- `GET /api/projects/[projectId]`: Hardcoded route does not fetch from database.
- `PATCH /api/projects/[projectId]`: Missing entirely.
- `DELETE /api/projects/[projectId]`: Hardcoded mock return, does not delete from database.
- `POST /api/executions/[id]/claim`: Missing; Blender clients cannot claim tasks atomically.
- `POST /api/executions/[id]/start`: Missing; no way to signal execution has started in Blender.
- `POST /api/executions/[id]/cancel`: Missing; no way to cancel pending executions.
- `GET /api/executions/[id]`: Missing dedicated endpoint (currently overloaded in `GET /api/executions?id=...`).
- **Generation & Chat Message Persistence**: AI generation outputs and chat conversations are stored only in React component state. Refreshing or switching projects wipes history.
- **Atomic Task Claiming**: No PostgreSQL transaction or atomic state lock to prevent multiple Blender instances from claiming the same execution.

---

### 2.6 Security Risks
1. **Unauthenticated API Access**: Public endpoints allow arbitrary script generation and execution queuing without valid credentials.
2. **Untrusted User Identity**: System relies on client-provided or hardcoded IDs instead of server-verified sessions.
3. **Blender Code Safety Gaps**: `lib/blender/validator.ts` only blocks top-level `subprocess`, `os.system`, `os.popen`, `shutil.rmtree`, and `eval/exec`. It fails to detect:
   - Dynamic imports: `__import__`, `importlib.import_module`
   - Introspection bypasses: `getattr(os, "system")`, `globals()`, `locals()`
   - Unrestricted file reads: `open('/etc/passwd')`
   - Network exfiltration: `urllib.request`, `http.client`, `socket`
   - Environment harvesting: `os.environ`, `os.getenv`
4. **Secrets in Add-on**: Blender preferences store plain tokens without cryptographic validation.

---

### 2.7 Persistence Gaps
- Projects, generations, conversations, messages, executions, and debug logs are completely decoupled from Supabase.
- Table schema in `20260926_sculptor_init.sql` lacks `claimed_at`, `started_at`, `script`, and `prompt` in `executions`.
- Missing `execution_events` audit table.

---

### 2.8 Blender Integration Gaps
- Add-on lacks automated heartbeat and active task claim protocol.
- No version negotiation between Blender 3.6 LTS and Blender 4.x.
- Web Studio does not reflect real add-on connection status or real task completion events.

---

### 2.9 Deployment Risks
- `package.json` contains typeless warning during tests.
- `.env.example` lacks documentation for `GEMINI_MODEL_GENERATION`, `GEMINI_MODEL_VISION`, `GEMINI_MODEL_DEBUG`.
- In-memory state precludes horizontal scaling or serverless deployment (Vercel/Cloud Run).

---

## 3. Recommended Remediation Order
1. **Database Schema & Migrations**: Align Supabase schema with execution lifecycle requirements (`claimed_at`, `started_at`, `script`, `prompt`, `execution_events`).
2. **Authentication & Session Verification**: Secure all API routes using Supabase SSR (`createServerSupabaseClient` and Bearer token verification).
3. **Project & Generation Persistence**: Replace in-memory stores in `/api/projects` and `/api/projects/[id]` with real Supabase queries.
4. **Chat & History Persistence**: Store Studio conversation messages and generation versions in Supabase.
5. **Real Execution Lifecycle**: Implement `/api/executions`, `/claim`, `/start`, `/result`, `/cancel` with atomic state updates.
6. **Blender Add-on Updates**: Update add-on to claim, start, approve, run, and report real results.
7. **Studio Real-Time Sync**: Replace `setTimeout` simulation in Studio with polling/realtime execution status updates.
8. **AI Provider Modernization**: Add configurable Gemini model environment variables and robust Zod parsing with retry.
9. **Hardened Python Safety Validator**: Block dynamic imports, obfuscated calls, and file/network access.
10. **Dynamic Dashboard**: Calculate actual project counts, generation counts, and execution metrics from Supabase.
11. **Comprehensive Tests & Verification**: End-to-end tests for both happy path and failure/debug flows.
