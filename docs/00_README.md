# Blender AI Copilot — Antigravity Build Documents

These documents are the source-of-truth specifications for building the Blender AI Copilot with Google Antigravity.

## Product
A Blender-focused AI copilot that turns natural language and reference images into:
- Blender modeling plans
- Blender Python scripts
- scene/material/lighting/animation instructions
- error fixes
- later, direct Blender execution through a Blender add-on

## Recommended MVP
1. Text -> Blender Python
2. Image -> modeling plan + optional Python
3. Blender error -> diagnosis + corrected Python
4. Copy/download script
5. Blender add-on for sending prompts and executing approved scripts

## Documents
- `01_PRD.md` — product requirements
- `02_ARCHITECTURE.md` — system architecture
- `03_FRONTEND_ROADMAP.md` — frontend pages/components/state
- `04_BACKEND_ROADMAP.md` — backend services/data flow
- `05_API_SPEC.md` — API contracts
- `06_DATABASE.md` — Supabase/Postgres schema and RLS
- `07_ANTIGRAVITY_MASTER_PROMPT.md` — master prompt to give Google Antigravity
- `08_BUILD_PHASES.md` — implementation phases and acceptance tests
- `09_BLENDER_ADDON.md` — Blender add-on design
- `10_SECURITY.md` — security and safe code execution rules

## Core stack
- Next.js + TypeScript
- Tailwind CSS
- Three.js where a web 3D preview is needed
- Gemini API for multimodal reasoning and code generation
- Supabase Auth + Postgres + Storage
- Blender Python API + Blender add-on
- Vercel for web deployment

## Important product rule
Do not try to train a custom 3D foundation model for v1. The product differentiation is the Blender-specific agent, workflow planning, code generation, debugging, and Blender integration.

## Official technical references
- Gemini API: https://ai.google.dev/gemini-api/docs
- Gemini image understanding: https://ai.google.dev/gemini-api/docs/image-understanding
- Blender Python API: https://docs.blender.org/api/
- Supabase: https://supabase.com/docs
- Vercel + Next.js: https://vercel.com/frameworks/nextjs
