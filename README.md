# SculptorAI — Your AI Copilot for Blender

> **Describe it. Generate it. Build it in Blender.**  
> SculptorAI is an AI operating layer for Blender that transforms natural language and reference images into structured 3D modeling plans, executable Blender Python (`bpy`), automated scene debugging, and native desktop Blender executions with explicit user approval.

---

## 1. Product Overview

SculptorAI is **not** another generic text-to-mesh black box. It understands the mechanics and geometry primitives of Blender:
- **Understands Blender workflows**: Object hierarchies, modifiers (Bevel, Subsurf, Boolean), and Principled BSDF node shaders.
- **Multimodal Computer Vision**: Analyzes reference photographs, decomposing them into geometric primitives and step-by-step modeling plans with honest uncertainty disclosures.
- **Blender Error Fixer**: Automatically analyzes tracebacks, diagnoses the root cause within Blender's API, and writes minimal surgical patches.
- **Explicit Safety Gate**: Untrusted AI-generated code is NEVER silently executed. Users inspect the script and explicitly click **Approve & Run**.
- **Native Blender Add-on**: A dedicated 3D Viewport sidebar panel communicating directly with the SculptorAI engine.

---

## 2. System Architecture

```text
                        ┌──────────────────────┐
                        │      User / Artist   │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ Next.js Web Studio   │
                        │ 3-Column Workspace   │
                        └──────────┬───────────┘
                                   │ HTTPS
                                   ▼
                     ┌────────────────────────────┐
                     │ Next.js API Routes         │
                     │ Auth / Validator / Limits  │
                     └───────┬───────────┬────────┘
                             │           │
                   ┌─────────┘           └─────────────┐
                   ▼                                   ▼
         ┌───────────────────┐              ┌──────────────────┐
         │ Gemini API        │              │ Supabase Cloud   │
         │ Vision + Code Gen │              │ PostgreSQL + RLS │
         │ Structured Output │              │ Storage Buckets  │
         └─────────┬─────────┘              └──────────────────┘
                   │
                   ▼
         ┌───────────────────┐
         │ Code Safety AST   │
         │ regex & validator │
         └─────────┬─────────┘
                   │
                   ▼
         ┌───────────────────┐
         │ Blender Add-on    │  (3D View > Sidebar > SculptorAI)
         │ Approve & Run Gate│
         └─────────┬─────────┘
                   ▼
         ┌───────────────────┐
         │ Blender Runtime   │
         │ bpy engine & undo │
         └───────────────────┘
```

---

## 3. Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Monaco Editor for Python.
- **Backend**: Next.js Serverless API routes with Zod runtime validation and token-bucket rate limiting.
- **AI Engine**: Google Gemini API (`gemini-1.5-flash` / `gemini-1.5-pro`) with Zod-enforced structured JSON output and provider abstraction.
- **Database & Auth**: Supabase PostgreSQL with strict Row Level Security (RLS) policies and private storage buckets.
- **Blender Desktop**: Python 3.10+ / Blender 3.6 LTS & 4.x Add-on (`bpy` API).

---

## 4. Repository Structure

```text
sculptorai/
├── app/
│   ├── page.tsx                     # High-converting dark landing page
│   ├── auth/
│   │   ├── login/page.tsx           # Authentication sign in
│   │   └── signup/page.tsx          # Account registration
│   ├── dashboard/
│   │   ├── page.tsx                 # Project grid & recent generations
│   │   └── settings/page.tsx        # Add-on configuration & API keys
│   ├── projects/[projectId]/
│   │   └── page.tsx                 # 3-column Studio workspace (Chat, Monaco, Logs)
│   └── api/
│       ├── generate/route.ts        # Prompt -> Structured Plan + Blender Python
│       ├── analyze-image/route.ts   # Image -> Vision breakdown + Blockout code
│       ├── debug/route.ts           # Traceback -> Diagnosis + Repaired script
│       ├── executions/              # Execution dispatch & result reporting
│       ├── projects/                # Project management CRUD
│       └── health/route.ts          # Health monitor
├── components/
│   ├── ui/                          # Accessible Button, Modal, Badge, Tabs
│   ├── ai/                          # ModelPlanCard, ImageAnalysisCard
│   ├── chat/                        # ChatMessage, PromptComposer
│   ├── code/                        # Monaco-powered CodeViewer
│   ├── execution/                   # ExecutionPanel log viewer
│   └── projects/                    # ProjectSidebar, ProjectCard
├── lib/
│   ├── ai/                          # Gemini adapter, prompts, Zod schemas
│   ├── blender/                     # Code safety validator, bpy templates
│   ├── supabase/                    # Browser, server, and admin clients
│   ├── security/                    # Rate limiting, input sanitization
│   └── validation/                  # API request schemas
├── types/                           # TypeScript domain models
├── supabase/migrations/             # PostgreSQL schema with full RLS
├── blender-addon/                   # Complete native Blender Python add-on
│   ├── __init__.py                  # Registration & metadata
│   ├── preferences.py               # Addon preferences & server URL
│   ├── auth.py                      # Session token handling
│   ├── api_client.py                # HTTP client
│   ├── executor.py                  # Safe bpy runner with undo push
│   ├── error_capture.py             # Stdout/Stderr and traceback interception
│   ├── operators.py                 # Operators (Generate, Approve & Run, Fix)
│   └── panels.py                    # 3D Viewport sidebar UI
├── tests/                           # Unit, AI prompt, and Blender syntax test suite
├── docs/                            # Full PRD and architectural specs
├── .env.example                     # Environment template
└── package.json
```

---

## 5. Quick Start & Local Setup

### Prerequisites
- Node.js 18+ (tested on Node.js 24)
- npm 9+
- Python 3.10+
- Blender 3.6 LTS or Blender 4.x

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
> *Note: If `GEMINI_API_KEY` is not provided, SculptorAI automatically operates in an intelligent local development fallback mode, ensuring zero crashes.*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Test Suite
```bash
npm test
```
Runs unit safety validator tests, AI prompt schema verification, and Blender script compilation checks.

### 5. Production Build
```bash
npm run build
```

---

## 6. Blender Add-on Installation Guide

The native Blender add-on is located in `blender-addon/`.

### Installation Steps
1. In Blender, navigate to **Edit** > **Preferences** > **Add-ons**.
2. Compress the `blender-addon/` directory into a `.zip` archive (or select the folder).
3. Click **Install...** and choose the zip file.
4. Enable the checkbox for **SculptorAI Copilot**.
5. In Add-on Preferences:
   - Set **API URL** to `http://localhost:3000` (or your deployed production URL).
   - Enter your **API Token** from `Dashboard > Settings`.

### Usage inside Blender
1. Open the 3D Viewport.
2. Press <kbd>N</kbd> on your keyboard to reveal the right Sidebar.
3. Click on the **SculptorAI** tab.
4. Enter a prompt (e.g. *"Create a futuristic gaming desk"*).
5. Click **Generate**.
6. Review the generated code preview.
7. Click **Approve & Run in Blender**.
8. If an exception occurs, click **Fix with AI** to automatically repair and retry.

---

## 7. Security & Safe Execution Policy

- **No Auto-Execution**: AI-generated code is inherently untrusted. The system enforces an explicit human-in-the-loop approval step before any execution in Blender.
- **Server-Side Secrets**: Gemini API keys and Supabase service-role keys are strictly server-side and never exposed to browser bundles.
- **Row Level Security**: Every PostgreSQL table enforces `auth.uid() = user_id`. No user can inspect or modify another user's projects or generations.
- **Code Pre-Validation**: Prohibits dangerous operating system calls (`os.system`, `subprocess`, raw network sockets, arbitrary file deletion) before previewing scripts.
