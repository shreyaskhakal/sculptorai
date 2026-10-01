# SculptorAI — Full Repository & Architecture Audit
**Date**: October 2026  
**Auditor**: Lead Systems, AI, 3D, Security & DevOps Engineer  
**Repository State**: Advanced Production MVP (Commit: Origin Main)  
**Verification Baseline**: 8/8 Test Suites Passing (100% Clean), Next.js 14.2.15 Production Build Passing  

---

## Executive Summary
SculptorAI has established a remarkably solid and clean MVP foundation. The system successfully demonstrates end-to-end procedural 3D generation using Gemini 1.5, AST-based/regex security sandboxing of Python code, Supabase PostgreSQL data persistence with Row-Level Security (RLS), atomic task queue claiming, and a functional Blender 4.x add-on with bidirectional status/execution reporting.

However, moving from an advanced prototype to a premier commercial product ("AI + Blender + Figma-like 3D creation platform") requires closing critical architectural gaps:
1. **Scene Awareness & Incremental Scene Editing**: The AI currently regenerates full scripts rather than understanding compact scene snapshots, computing scene diffs, and applying structured scene patches.
2. **Web 3D Viewer & GLB Pipeline**: The web studio currently lacks an embedded WebGL 3D viewer (Three.js / React Three Fiber), relying entirely on user inspection of Python code or switching to Blender.
3. **Blender Realtime Heartbeat & Status**: The Blender add-on connects and claims tasks synchronously, but lacks an automated background heartbeat loop that continuously reports device status (`CONNECTED`, `IDLE`, `BUSY`, `EXECUTING`, `OFFLINE`) to the web dashboard.
4. **AI Architecture & Model Routing**: Gemini calls are consolidated in a single class with hardcoded fallback rules instead of a modular `lib/ai/` abstraction with model routing, vision pipelines, structured schema validation, cost control, and retry mechanisms.
5. **Multi-Step Agentic Task Graph**: Complex prompts (e.g. "build an entire sci-fi command room") require multi-step decomposition, task graphs, and incremental approval checkpoints.
6. **Commercial Polish**: Onboarding wizard, rich template gallery, version comparison, capabilities-based safety score, distributed rate limiting, and automated benchmark evaluation suite (`tests/ai-evals/`).

---

## 1. Existing Functionality (Working & Verified)

| Component | Status | Verification & Code Evidence |
| :--- | :--- | :--- |
| **Authentication & Auth Provider** | ✅ Working | Supabase Auth with SSR cookies (`@supabase/ssr`), mock/demo fallback mode (`AuthProvider.tsx`), login & signup pages. |
| **Project CRUD & RLS** | ✅ Working | Postgres schema with RLS policies, multi-tenant isolation, project creation, deletion cascading to messages and generations. |
| **AI Generation Pipeline** | ✅ Working | `POST /api/generate` with Gemini generative models (`gemini-1.5-flash`), structured JSON outputs validated via Zod (`ModelPlanSchema`). |
| **Code Safety Validator** | ✅ Working | Hardened AST & regex validation (`lib/blender/validator.ts`), blocks subprocess, raw OS commands, filesystem writes, network exfiltration, reflection attacks. |
| **Atomic Task Claiming** | ✅ Working | PostgreSQL RPC `claim_next_execution_task` with `FOR UPDATE SKIP LOCKED` prevents race conditions when claiming execution tasks. |
| **Blender Add-on v1.0** | ✅ Working | Python add-on with N-panel UI in 3D Viewport, operator execution with undo history, stdout/stderr capture, execution timing. |
| **AI Error Self-Repair** | ✅ Working | Traceback capture in Blender -> `POST /api/debug` -> Gemini error diagnosis -> surgical code fix -> automated safety re-validation. |
| **Monaco Editor & Diff** | ✅ Working | Web studio includes Monaco Editor for Python viewing/editing and side-by-side Monaco DiffViewer for generation history comparison. |
| **Rate Limiter & Sanitizer**| ✅ Working | In-memory token bucket rate limiter (`lib/security/rate-limiter.ts`) and input sanitization (`lib/security/sanitize.ts`). |
| **Automated Test Suite** | ✅ Working | 8 comprehensive test suites (`tests/run-tests.mjs`) testing security, AI schemas, API validation, RLS, execution queue, and E2E workflows. |

---

## 2. Partially Implemented Functionality

1. **Blender Connection & Heartbeat**:
   - *Current*: Blender add-on connects via manual button clicks ("Test Connection", "Claim Web Task").
   - *Gap*: No continuous background timer/heartbeat daemon reporting device ID, Blender version, add-on version, and activity status (`CONNECTED`, `IDLE`, `BUSY`, `EXECUTING`, `OFFLINE`). The web dashboard does not display a live indicator for Blender.
2. **Generation History & Versioning**:
   - *Current*: `generations` table stores `version_number` and snapshots code and plan JSON.
   - *Gap*: No dedicated `generation_versions` table with parent version lineage, branching, 3D visual comparison, or one-click rollback/restore.
3. **Reference Image Analysis**:
   - *Current*: `POST /api/analyze-image` accepts images and returns object breakdowns and visual notes.
   - *Gap*: Vision analysis is not connected to a structured 3D blockout generator, confidence scoring (geometry vs material confidence), or automated step-by-step scene creation.
4. **Safety System**:
   - *Current*: Forbidden pattern regex matching with boolean validation.
   - *Gap*: No allowlist capability model (declaring exact permitted Blender modules and APIs), and no user-facing "Safety Score" breakdown (`LOW RISK`, `MODERATE RISK`, `HIGH RISK`).
5. **Realtime Updates**:
   - *Current*: Studio page polls `GET /api/executions?id=...` every 2 seconds.
   - *Gap*: Supabase Realtime channel subscription is not activated on the client, leaving polling as the primary mechanism instead of a fallback.

---

## 3. Broken Functionality

1. **Execution Status Realtime Desync on Multiple Windows**:
   - Polling only runs if an execution ID is set in local React state. If the user navigates away or opens a new tab, active execution state does not re-attach automatically.
2. **Module typeless warning on Node**:
   - Test runner outputs `[MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of ... is not specified`. Needs `"type": "module"` configuration or explicit module imports in Node/Jiti.
3. **Mobile Layout Bottom Navigation Overlap**:
   - On smaller viewports, the bottom navigation bar covers Monaco Editor action buttons and the prompt composer submit button.

---

## 4. Missing Functionality (To Be Implemented)

1. **Web 3D Viewer (Three.js / React Three Fiber / Drei)**:
   - 3-panel professional layout: Left (AI Chat & History), Center (Interactive 3D WebGL Viewer), Right (Code / Plan / Execution / Scene Outliner), Bottom (Logs & Timeline).
   - Orbit, pan, zoom, camera reset, wireframe mode, solid mode, grid, axes, and object selection.
2. **GLB / GLTF Pipeline**:
   - Blender add-on automatic GLB export operator upon execution success -> upload to Supabase Storage -> stream to Web 3D Viewer with signed URLs.
3. **Scene-Aware AI & Compact Scene Snapshots**:
   - Blender operator extracting scene hierarchy: active objects, dimensions, locations, rotations, materials, modifiers, and collections into a lightweight JSON snapshot (<10KB).
   - AI prompts taking the scene snapshot to perform surgical modifications ("Make legs 20% thinner", "Change wooden objects to dark walnut") without wiping the scene.
4. **Structured Scene Patch Format**:
   - Schema-validated patch operations: `create_object`, `modify_object`, `modify_material`, `add_modifier`, `transform_object`, `delete_object`.
5. **Modernized AI Model Architecture (`lib/ai/`)**:
   - Provider abstraction, model router, prompt management, retry handling, cost and token calculation, and environment-driven model selection (`GEMINI_MODEL_GENERATION`, `GEMINI_MODEL_VISION`, `GEMINI_MODEL_DEBUG`, `GEMINI_MODEL_REASONING`).
6. **AI Agent Mode & Task Graph**:
   - Multi-step procedural planner decomposing large instructions into a dependency DAG (`Task 1 -> Task 2 -> Task 3`), with individual status tracking and step-by-step or bulk approval checkpoints.
7. **Production Templates Library**:
   - Curated starter templates across Furniture, Architecture, Game Assets, Product Design, and Characters with starter prompts, tags, and difficulty ratings.
8. **Onboarding Setup Wizard**:
   - Interactive guided tour: Welcome -> Add-on Installation -> Connection Test -> First 3D Generation -> Conversational Refinement.
9. **Usage & Cost Tracking Dashboard**:
   - Tracking generation count, execution minutes, storage usage, estimated AI token cost, and subscription tier allowances (Free / Pro / Studio).
10. **Benchmark AI Evaluation Suite (`tests/ai-evals/`)**:
    - Automated evaluation harness with 50+ diverse 3D modeling prompts testing schema validity, safety compliance, syntax validity, and self-repair rates.
11. **CI/CD Pipeline**:
    - GitHub Actions workflow running lint, typecheck, unit tests, security audits, and production build.

---

## 5. Technical Debt

1. **Monolithic Gemini File (`lib/ai/gemini.ts`)**:
   - Contains fallback mock plans, Gemini SDK calls, schema parsing, and prompt assembly in a single file (>470 lines). Needs refactoring into `lib/ai/` modular components while preserving backward compatibility.
2. **In-Memory Rate Limiting**:
   - `lib/security/rate-limiter.ts` uses an in-memory Map, which does not share state across distributed serverless instances (Vercel). Requires a distributed token-bucket strategy or persistent Redis/Postgres adapter.
3. **Mock Data Persistence in Demo Mode**:
   - When running in Demo Mode, projects are stored in browser memory/local storage and do not persist across browser refreshes if local storage keys are cleared.

---

## 6. Security Concerns

1. **AST / Regex Validator Evasion**:
   - While forbidden rules block obvious patterns (`subprocess`, `os.system`, `open()`, `eval()`), regex parsing can theoretically be bypassed via obscure Python string encoding or attribute getattr chains if not supplemented with strict capabilities allowlisting.
2. **API Key Exposure Risk**:
   - Verified: `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are strictly server-side. However, documentation must clearly remind developers never to prefix them with `NEXT_PUBLIC_`.
3. **Untrusted Uploads**:
   - Image upload endpoint (`/api/upload`) must strictly validate MIME magic numbers, sanitize file names against directory traversal, and enforce maximum file size limits (5MB).

---

## 7. UX & Product Experience Problems

1. **Lack of Immediate Visual Feedback**:
   - Users who do not have Blender running currently only see Python code. They cannot visualize what the 3D model looks like without switching windows.
2. **All-or-Nothing Generation**:
   - Requesting a small change ("add drawers") currently prompts the AI to write a completely new script that clears the entire scene, losing previously modeled geometry.
3. **No Connection Indicator on Dashboard**:
   - The user cannot tell from the project dashboard whether Blender is running and connected on their workstation before entering the studio.

---

## 8. Performance & Scalability

1. **Large Script Payloads**:
   - Complex scenes can generate thousands of lines of Python. Using compact procedural operations and modular helper functions keeps scripts lean.
2. **Supabase Realtime vs Polling**:
   - Continuous 2-second HTTP polling from multiple tabs creates unnecessary serverless invocations and database read load. Migrating to Supabase Realtime with fallback polling eliminates redundant traffic.
3. **3D Asset Delivery**:
   - Generated GLB files must be streamed with proper caching headers, CDN distribution, and Draco/meshopt compression where practical.

---

## 9. Recommended Implementation Plan (Phased Order)

- **Phase 1: Stability & Foundation Modernization**
  - Modularize `lib/ai/` (model router, provider abstraction, retry, cost tracking).
  - Modernize dependencies safely, update TypeScript types, eliminate warnings.
  - Setup CI/CD GitHub Actions workflow.
- **Phase 2: Blender Connection & Realtime Heartbeat**
  - Implement `/api/blender/heartbeat`, `/api/blender/status`, and device registration.
  - Update Blender add-on with continuous background heartbeat and status reporting.
  - Add real-time connection status badges to dashboard and studio header.
- **Phase 3: Web 3D Viewer & GLB Pipeline**
  - Embed WebGL Three.js / React Three Fiber interactive viewer in Studio center panel.
  - Implement GLB export operator in Blender add-on and storage upload pipeline.
  - Support orbit, zoom, pan, wireframe, solid mode, camera reset, and lighting controls.
- **Phase 4: Scene Intelligence & Conversational Editing**
  - Implement Blender scene snapshot extractor (<10KB compact JSON representation).
  - Implement Scene Patch Engine (`create_object`, `modify_object`, `modify_material`, `delete_object`).
  - Conversational scene editor with visual change diff ("+ Added Drawer", "~ Modified roughness").
- **Phase 5: Reference Image 3D Reconstruction**
  - Enhanced Vision AI pipeline extracting silhouette, components, proportions, confidence scores.
  - Two-stage generation: Initial blockout -> High-detail procedural refinement.
- **Phase 6: AI Agent Mode & Multi-Step Task Graph**
  - Graph-based procedural planner (`TaskGraph`, DAG execution).
  - Human approval checkpoints (Approve All or step-by-step).
- **Phase 7: Security Hardening & Production Polish**
  - Capabilities-based allowlist validator with visual Safety Score card.
  - Distributed rate limiting and audit logging.
  - Usage tracking and cost estimation dashboard.
- **Phase 8: Commercial Product Experience**
  - 3D Template Library with categories (Furniture, Architecture, Game Assets, etc.).
  - Onboarding Setup Wizard.
  - Comprehensive AI evaluation benchmark (`tests/ai-evals/`).
  - Full documentation suite (`ARCHITECTURE.md`, `DEPLOYMENT.md`, `END_TO_END.md`, `SECURITY.md`, etc.).
