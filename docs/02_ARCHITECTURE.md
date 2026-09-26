# System Architecture

## 1. High-level architecture

```text
                        ┌──────────────────────┐
                        │      User            │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ Next.js Web App      │
                        │ Chat / Projects / UI │
                        └──────────┬───────────┘
                                   │ HTTPS
                                   ▼
                    ┌────────────────────────────┐
                    │ Next.js Server/API Layer   │
                    │ Auth / Validation / AI      │
                    └───────┬───────────┬────────┘
                            │           │
                  ┌─────────┘           └─────────────┐
                  ▼                                   ▼
        ┌───────────────────┐              ┌──────────────────┐
        │ Gemini API        │              │ Supabase         │
        │ text + image      │              │ Auth/Postgres    │
        │ structured output │              │ Storage          │
        └─────────┬─────────┘              └──────────────────┘
                  │
                  ▼
        ┌───────────────────┐
        │ Blender Script     │
        │ generator/validator│
        └─────────┬─────────┘
                  │
                  │ secure API
                  ▼
        ┌───────────────────┐
        │ Blender Add-on    │
        │ prompt/code/error │
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │ Blender + bpy     │
        └───────────────────┘
```

## 2. Architectural principles
- Keep AI provider logic behind an adapter.
- Keep Blender-specific prompts/templates in a dedicated module.
- Never expose Gemini secrets to browser code.
- Use structured JSON between AI and application logic.
- Treat AI-generated code as untrusted.
- Require user approval before Blender execution.
- Version every generated script.
- Store prompts, outputs, errors and execution results for debugging.

## 3. Application layers

### Frontend
Next.js App Router + TypeScript.
Responsibilities:
- authentication
- project UI
- chat
- uploads
- script editor/viewer
- execution status
- history

### Backend
Next.js server routes/server actions or a dedicated Python service if needed.
Responsibilities:
- auth verification
- request validation
- Gemini calls
- structured output parsing
- prompt orchestration
- storage
- usage limits
- audit logging

### AI layer
Gemini adapter:
- text understanding
- image understanding
- structured modeling plan
- Blender Python generation
- error diagnosis
- correction loop

### Blender integration
Blender Python add-on:
- authenticate
- send prompt
- receive script
- show preview
- request user approval
- execute
- capture stdout/stderr
- return execution result

## 4. Data flow — text generation

```text
Prompt
 -> validate
 -> load project context
 -> Gemini
 -> structured ModelPlan
 -> BlenderCodeGenerator
 -> code validation
 -> persist generation
 -> UI
```

## 5. Data flow — image

```text
Image
 -> file validation
 -> Supabase Storage
 -> Gemini multimodal analysis
 -> ModelPlan
 -> optional Blender Python
 -> persist
```

## 6. Data flow — error fixing

```text
Blender error
 -> normalize traceback
 -> attach relevant script
 -> Gemini debugger
 -> diagnosis + patch
 -> user approval
 -> rerun
```

## 7. Suggested repository

```text
blender-ai-copilot/
├── app/
│   ├── (marketing)/
│   ├── dashboard/
│   ├── projects/
│   ├── api/
│   │   ├── generate/
│   │   ├── analyze-image/
│   │   ├── debug/
│   │   ├── executions/
│   │   └── health/
│   └── ...
├── components/
├── lib/
│   ├── ai/
│   │   ├── gemini.ts
│   │   ├── prompts.ts
│   │   ├── schemas.ts
│   │   └── adapter.ts
│   ├── blender/
│   ├── supabase/
│   ├── security/
│   └── validation/
├── types/
├── supabase/
│   └── migrations/
├── blender-addon/
│   ├── __init__.py
│   ├── api_client.py
│   ├── operators.py
│   ├── panels.py
│   ├── executor.py
│   └── error_capture.py
├── tests/
└── docs/
```
