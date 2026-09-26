# Backend Roadmap

## Recommended approach
Start with Next.js server-side API routes for MVP. Add a separate Python/FastAPI service only when Blender-specific server processing or background jobs require it.

## Services

### 1. Auth
Supabase Auth.

### 2. Project service
CRUD for projects.

### 3. AI service
Provider adapter around Gemini.

### 4. Generation service
Creates:
- modeling plan
- Blender Python
- explanations

### 5. Image service
- validate image
- upload to Storage
- call multimodal AI
- persist analysis

### 6. Debug service
- accept traceback
- accept script/context
- request diagnosis
- generate patch
- store correction

### 7. Execution service
The web backend does NOT execute arbitrary Blender code.
The Blender add-on executes locally after user approval.

### 8. Usage service
Track:
- generations
- image analyses
- executions
- tokens if available
- plan limits

## Backend request pipeline

```text
HTTP request
 -> authenticate
 -> validate schema
 -> rate limit
 -> load project context
 -> call AI
 -> validate AI response
 -> store generation
 -> return typed response
```

## AI orchestration

### Step A — planner
Input:
- user prompt
- optional image
- project context
- Blender version

Output:
- intent
- object list
- modeling approach
- materials
- dimensions
- modifiers
- dependencies
- risks

### Step B — code generator
Input:
- ModelPlan
- Blender version
- user preferences

Output:
- Blender Python
- expected result
- dependencies
- warnings

### Step C — validator
Check:
- response schema
- code size
- obvious unsafe operations
- imports
- required structure

Do not claim that static validation proves code is safe.

### Step D — debugger
Input:
- traceback
- last script
- Blender version
- scene context

Output:
- diagnosis
- corrected code
- change summary

## Error handling
Return stable error codes:
- `AUTH_REQUIRED`
- `INVALID_REQUEST`
- `FILE_TOO_LARGE`
- `UNSUPPORTED_IMAGE`
- `AI_TIMEOUT`
- `AI_RATE_LIMIT`
- `AI_INVALID_OUTPUT`
- `SCRIPT_VALIDATION_FAILED`
- `BLENDER_EXECUTION_FAILED`
- `INTERNAL_ERROR`

## Backend phases

### Phase 1
Mock endpoints.

### Phase 2
Gemini integration.

### Phase 3
Supabase persistence.

### Phase 4
Image pipeline.

### Phase 5
Debugging pipeline.

### Phase 6
Blender add-on API.

### Phase 7
usage limits, analytics, billing.
