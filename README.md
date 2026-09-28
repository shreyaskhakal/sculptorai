# SculptorAI — Your AI Operating Layer for Blender

> **Describe it. Review it. Build it in Blender.**  
> SculptorAI is an AI copilot and operating layer for Blender that transforms natural language and reference images into structured 3D modeling plans, executable Blender Python (`bpy`), automated scene debugging, and native desktop Blender executions with mandatory human approval.

---

## 1. Product Overview

SculptorAI is **not** a generic black-box mesh generator. It understands the actual mechanics, geometry pipelines, and procedural workflows of Blender:
- **Understands Blender Workflows**: Generates native procedural scripts utilizing collections, object hierarchies, modifiers (Bevel, Subsurf, Boolean), and Principled BSDF node shaders.
- **Multimodal Computer Vision**: Analyzes reference images, decomposing them into primitive components, proportions, and procedural step-by-step modeling plans with honest uncertainty disclosures.
- **AI Error Diagnoser & Auto-Fixer**: When Blender throws an exception or syntax error, SculptorAI diagnoses the exact API mismatch, writes a minimal surgical patch, and previews the fix for human review.
- **Mandatory Approval Gate**: AI code is **never** silently executed. The artist reviews code in Monaco Editor or the Blender sidebar and explicitly clicks **Approve & Run**.
- **Native Blender Add-on**: A dedicated 3D Viewport sidebar panel communicating directly with the SculptorAI engine, compatible with both **Blender 3.6 LTS** and **Blender 4.x**.
- **Real-Time Persistent Workflow**: No in-memory state or simulated timeouts. Everything—projects, generations, chats, executions, and execution events—persists in Supabase PostgreSQL with strict Row Level Security (RLS).

---

## 2. End-to-End System Architecture

```text
USER / ARTIST
      ↓
Natural-language prompt or reference image
      ↓
AI understands the modeling request (Google Gemini 1.5)
      ↓
Structured Blender modeling plan (Zod validated)
      ↓
Generated Blender Python / bpy
      ↓
AST Security Validation (Fail-closed)
      ↓
Persisted to Supabase PostgreSQL (Versioned generation)
      ↓
Human reviews generated code in Monaco Editor
      ↓
Explicit "Send to Blender" / "Approve & Run" (status: pending)
      ↓
Native Blender add-on atomically claims task (status: claimed)
      ↓
Blender user reviews code in 3D Viewport sidebar
      ↓
Artist clicks "Approve & Run in Blender" (status: running)
      ↓
Blender executes code with Undo push
      ↓
Real execution results reported back to server (status: success / error, stdout, duration)
      ↓
Web Studio updates live with real stdout and duration
      ↓
[If Blender throws an error]:
AI diagnoses stderr traceback → Corrected code preview → Human approval → Re-execution
```

---

## 3. Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Monaco Editor for Python, Lucide Icons.
- **Backend**: Next.js Serverless API routes with Zod runtime validation, sliding-window rate limiting, and server-side Supabase SSR authentication.
- **AI Engine**: Google Gemini API (`gemini-1.5-flash` / `gemini-1.5-pro`) with configurable model environment variables, Zod-enforced structured JSON output, and schema retry logic.
- **Database & Auth**: Supabase PostgreSQL with strict Row Level Security (RLS) policies, database triggers, and audit event tracking.
- **Blender Desktop**: Python 3.10+ / Blender 3.6 LTS & 4.x native add-on (`bpy` API).

---

## 4. Repository Structure

```text
sculptorai/
├── app/
│   ├── page.tsx                     # High-converting dark landing page
│   ├── auth/
│   │   ├── login/page.tsx           # Authentication sign-in
│   │   └── signup/page.tsx          # Account registration
│   ├── dashboard/
│   │   ├── page.tsx                 # Live dynamic dashboard with real metrics
│   │   └── settings/page.tsx        # Add-on configuration & API token guide
│   ├── projects/[projectId]/
│   │   └── page.tsx                 # 3-column Studio workspace (Chat, Monaco, Live Execution)
│   └── api/
│       ├── generate/route.ts        # Prompt -> Structured Plan + Persistent bpy
│       ├── analyze-image/route.ts   # Image -> Vision breakdown + Blockout code
│       ├── debug/route.ts           # Traceback -> Diagnosis + Repaired script
│       ├── executions/              # Execution queue & lifecycle management
│       │   ├── route.ts             # POST create task, GET list tasks
│       │   ├── claim-next/          # POST atomic task claim for Blender
│       │   └── [id]/
│       │       ├── route.ts         # GET single task
│       │       ├── claim/           # POST atomic claim by ID
│       │       ├── start/           # POST mark task running
│       │       ├── result/          # POST report real stdout/stderr
│       │       └── cancel/          # POST cancel task
│       ├── projects/                # Persistent Project CRUD
│       │   ├── route.ts             # GET all projects, POST new project
│       │   └── [id]/
│       │       ├── route.ts         # GET, PATCH, DELETE project
│       │       ├── generations/     # GET project generation history
│       │       └── messages/        # GET & POST persistent chat messages
│       ├── dashboard/stats/route.ts # Live project & generation metrics
│       ├── upload/route.ts          # Multipart image upload to storage
│       └── health/route.ts          # Server health check
├── blender-addon/
│   ├── __init__.py                  # Add-on metadata and class registration
│   ├── api_client.py                # Add-on HTTP client with atomic claim & reporting
│   ├── auth.py                      # Bearer token & endpoint preferences
│   ├── compat.py                    # Blender 3.6 LTS vs 4.x compatibility bridge
│   ├── error_capture.py             # Stdout/stderr redirection and traceback capture
│   ├── executor.py                  # Isolated bpy script execution with Undo push
│   ├── operators.py                 # Interactive UI operators with approval gate
│   ├── panels.py                    # 3D Viewport sidebar UI (N-panel > SculptorAI)
│   └── preferences.py               # Add-on preferences (API URL, Bearer Token)
├── components/
│   ├── ui/                          # Accessible Button, Modal, Badge, Tabs
│   ├── ai/                          # ModelPlanCard, ImageAnalysisCard
│   ├── chat/                        # ChatMessage, PromptComposer
│   ├── code/                        # Monaco CodeViewer, DiffViewer
│   ├── execution/                   # Live ExecutionPanel with real terminal output
│   └── projects/                    # ProjectSidebar with persistent version drawer
├── lib/
│   ├── ai/                          # Gemini adapter, prompts, schemas
│   ├── blender/                     # Hardened AST code safety validator
│   ├── security/                    # Sliding-window rate limiting, input sanitization
│   └── supabase/                    # Multi-tenant DB facade, server auth, SSR clients
├── supabase/
│   └── migrations/
│       ├── 20260926_sculptor_init.sql           # Initial tables and RLS
│       └── 20260928_sculptor_production_mvp.sql # Upgraded execution lifecycle & events
├── tests/                           # 8 comprehensive automated test suites
├── docs/
│   └── END_TO_END.md                # Full architectural walkthrough & sequence diagrams
├── AUDIT.md                         # Pre-remediation architectural audit
├── IMPLEMENTATION_STATUS.md         # Component completion metrics
└── PRODUCTION_READINESS.md          # Production MVP verification report
```

---

## 5. Quickstart & Installation

### Prerequisites
- **Node.js**: v18.17+ or v20+ (Node v24 supported)
- **Blender**: Blender 3.6 LTS or Blender 4.x
- **Google Gemini API Key**: [Google AI Studio](https://aistudio.google.com/)
- **Supabase Account**: [Supabase](https://supabase.com) (or use local fallback mode)

### Step 1: Clone and Install Dependencies
```bash
git clone https://github.com/shreyaskhakal/sculptorai.git
cd sculptorai
npm install
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your configuration:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL_GENERATION=gemini-1.5-flash
GEMINI_MODEL_VISION=gemini-1.5-flash
GEMINI_MODEL_DEBUG=gemini-1.5-flash

NEXT_PUBLIC_APP_URL=http://localhost:3000
```
*(Note: If you run SculptorAI without Supabase credentials, it automatically enables **Demo Mode** with a tenant-isolated local persistent store).*

### Step 3: Run Database Migrations
In your Supabase project SQL Editor, run:
1. `supabase/migrations/20260926_sculptor_init.sql`
2. `supabase/migrations/20260928_sculptor_production_mvp.sql`

### Step 4: Run Automated Tests
```bash
npm test
```
All 8 test suites will execute and verify:
- Code Safety Validator & Bypass Defense
- AI Prompt & Structured Output Schemas
- API Validation & Sanitization
- User Authorization & RLS Isolation
- Database Multi-Tenant Persistence
- Execution Lifecycle & Atomic Claiming
- Complete End-to-End Workflow & Error Repair
- Blender Python Compilation

### Step 5: Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Blender Add-on Installation & Handshake

### 1. Install the Add-on in Blender
1. Open **Blender** (3.6 LTS or 4.x).
2. Go to `Edit > Preferences > Add-ons > Install...`.
3. Select the `blender-addon.zip` archive located in the repository root (or compress the `blender-addon/` directory into a `.zip`).
4. Enable the checkbox for **"3D View: SculptorAI Copilot"**.

### 2. Configure Connection & Authentication
In the Add-on Preferences:
- **Server API URL**: `http://localhost:3000` (or your production domain).
- **API Token**: Enter your Supabase session Bearer token (or use `demo-token` for local testing).
- Click **"Test Connection"** to verify backend health.

### 3. Execution in Blender
1. Press `N` in the 3D Viewport to open the sidebar.
2. Click the **SculptorAI** tab.
3. Click **"Claim Web Task"** to atomically claim pending execution tasks sent from the Web Studio.
4. **Review the code in Blender**: Notice the status reads `"Claimed (Requires User Approval)"`.
5. Click **"Approve & Run in Blender"**.
6. The scene is generated, undo history is pushed, and real results are sent back to the Web Studio!

---

## 7. Security Architecture

1. **Server-Enforced Authorization**:
   - Every protected API route validates the Supabase session or Bearer token via `getAuthenticatedUser()`.
   - Client-provided user IDs are discarded. Tenant isolation is enforced across every query.
2. **Fail-Closed Python Safety Validator**:
   - All AI-generated code is analyzed before display.
   - Blocks: `subprocess`, `os.system`, `__import__`, `importlib`, `getattr`, `globals()`, `locals()`, `open()`, `shutil`, `socket`, `urllib`, `requests`, and `pickle`.
3. **Mandatory Human Approval Gate**:
   - Neither the web app nor the Blender add-on will ever automatically execute code without explicit user consent.
4. **Input Sanitization & Per-User Rate Limiting**:
   - Strips prompt injection tokens (`<|system|>`), path traversal characters, and null bytes.
   - Sliding-window rate limiters prevent denial-of-service abuse.
5. **Atomic Claiming**:
   - Database transactions use PostgreSQL `FOR UPDATE SKIP LOCKED` to guarantee exactly one Blender instance claims any pending execution task.

---

## 8. Clearly Labeled Demo Mode

When running in an environment without configured Supabase credentials or with `DEMO_MODE=true`:
- The application displays a visible **"Demo Mode"** badge in the navigation bar.
- Operates with an in-memory, tenant-isolated fallback store so developers can preview the UI, test prompt workflows, and verify editor features.
- Never misrepresents demo runs as real Blender executions.

---

## 9. Deployment to Production

### Deploying on Vercel
1. Push the repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `NEXT_PUBLIC_APP_URL`).
4. Deploy! Next.js App Router will compile all 17 static and dynamic routes.

---

## 10. License

SculptorAI is open-source software licensed under the MIT License.
