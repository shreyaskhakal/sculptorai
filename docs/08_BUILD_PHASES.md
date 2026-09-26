# Build Phases and Acceptance Tests

## Phase 0 — Repository foundation
### Build
- Next.js app
- TypeScript
- Tailwind
- linting
- formatting
- environment template

### Test
- app starts
- production build succeeds
- no TypeScript errors

---

## Phase 1 — Product shell
### Build
- landing
- auth pages
- dashboard
- project workspace
- settings

### Test
- navigation works
- responsive layout
- empty/loading/error states

---

## Phase 2 — Auth + database
### Build
- Supabase Auth
- profiles
- projects
- RLS
- storage buckets

### Test
- user A cannot read user B's project
- authenticated user can create project
- logout/login works

---

## Phase 3 — AI generation
### Build
- Gemini adapter
- prompt orchestration
- structured schema
- code viewer

### Test
Prompt:
"Create a low-poly table."

Expected:
- plan returned
- Python returned
- valid JSON envelope
- generation persisted

---

## Phase 4 — Image analysis
### Build
- upload
- storage
- Gemini multimodal analysis

### Test
Upload chair image.
Expected:
- object identification
- geometry observations
- modeling steps
- uncertainty/warnings

---

## Phase 5 — Debugger
### Build
- error input
- traceback normalization
- AI diagnosis
- corrected script

### Test
Submit a known broken script.
Expected:
- cause
- correction
- revised code

---

## Phase 6 — Blender add-on
### Build
- sidebar panel
- authentication
- prompt
- code preview
- approval
- execution
- result reporting

### Test
Prompt:
"Create a cube and move it 2 meters on X."

Expected:
- script received
- user approves
- Blender executes
- result is reported

---

## Phase 7 — Correction loop
### Build
Blender error -> backend -> Gemini -> corrected script -> user approval.

### Test
Intentionally submit a script that produces a known error.
Expected:
- error captured
- AI correction returned
- retry succeeds

---

## Phase 8 — Production hardening
- rate limits
- file limits
- logging
- monitoring
- security review
- performance
- deployment

### Final demo
The complete flow must work:
Prompt -> AI -> Blender Python -> Add-on -> Blender -> execution result.
