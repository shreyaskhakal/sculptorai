# Frontend Roadmap

## Stack
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui or equivalent accessible component system
- Monaco Editor for Python code
- Three.js only where a browser 3D preview provides real value

## Design direction
Dark, professional 3D/creative-tool interface.
Avoid excessive neon. Prioritize:
- readable code
- clear AI state
- obvious Run/Approve controls
- project organization
- fast workflow

## Pages

### 1. Landing
Sections:
- hero
- demo animation
- how it works
- use cases
- Blender workflow
- pricing placeholder
- CTA

### 2. Auth
- sign in
- sign up
- reset password

### 3. Dashboard
Cards:
- recent projects
- recent generations
- usage
- create project

### 4. Project workspace
Three-column layout:

Left:
- project navigation
- conversation history

Center:
- AI conversation
- prompt box
- image upload
- quick actions

Right:
- generated Blender plan
- Python code
- execution state
- download/copy/run

### 5. Generation history
- prompt
- date
- model
- status
- code version
- restore

### 6. Settings
- profile
- API/connection status
- usage
- delete account

## Components
- `PromptComposer`
- `ImageDropzone`
- `ChatMessage`
- `ModelPlanCard`
- `CodeViewer`
- `ExecutionPanel`
- `ErrorPanel`
- `GenerationHistory`
- `ProjectSidebar`
- `UsageMeter`
- `BlenderConnectionStatus`

## Frontend state
Use server state for:
- projects
- generations
- executions

Use local state for:
- current prompt
- selected code
- UI panels
- temporary upload state

## UX rules
- Never lose typed prompts.
- Show progress stages:
  `Analyzing -> Planning -> Generating -> Validating`
- Clearly distinguish AI explanation from executable code.
- Show code language as Python.
- Disable Run until code is validated and user explicitly approves.
- Always show errors in human-readable form.
- Allow retry without losing previous generation.

## Frontend phases

### Phase 1
Landing + dashboard + mock chat.

### Phase 2
Real Gemini generation + code viewer.

### Phase 3
Image upload + image analysis.

### Phase 4
Execution history + error debugger.

### Phase 5
Blender add-on connection UI.

### Phase 6
3D preview and advanced tools.
