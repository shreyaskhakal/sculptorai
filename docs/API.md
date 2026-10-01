# SculptorAI REST API Reference

All requests accept and return `application/json`. Authenticated routes require standard Bearer token or Supabase session cookies.

---

## 1. AI Generation & Intelligence

### `POST /api/generate`
Generates a structured modeling plan and Python script from a natural language prompt.
- **Body**: `{ "prompt": string, "style"?: string, "complexity"?: string, "blenderVersion"?: string, "context"?: string, "previousCode"?: string }`
- **Response**: `{ "plan": ModelPlan, "code": GeneratedCode, "warnings": string[] }`

### `POST /api/ai/edit`
Performs surgical scene modifications against a live Blender scene snapshot.
- **Body**: `{ "projectId": string, "instruction": string, "sceneSnapshot": SceneSnapshot }`
- **Response**: `{ "patch": ScenePatch, "code": GeneratedCode, "warnings": string[] }`

### `POST /api/analyze-image`
Extracts 3D components and blockout script from a reference image.
- **Body**: `{ "imageBase64": string, "mimeType": string, "prompt"?: string }`
- **Response**: `{ "analysis": ImageAnalysis }`

### `POST /api/debug`
Diagnoses Blender execution tracebacks and generates a working fix.
- **Body**: `{ "error": string, "script": string, "blenderVersion"?: string }`
- **Response**: `{ "diagnosis": { "problem": string, "whyItHappened": string, "suggestedFix": string }, "correctedCode": string }`

### `GET /api/ai/usage`
Retrieves cumulative token, latency, and estimated cost metrics for the active account.

---

## 2. Blender Integration & Heartbeat

### `POST /api/blender/heartbeat`
Registers client device telemetry and active state.
- **Body**: `{ "deviceId": string, "deviceName": string, "blenderVersion": string, "addonVersion": string, "status": "idle" | "executing" | "error", "projectId"?: string }`
- **Response**: `{ "ok": true, "timestamp": string }`

### `GET /api/blender/status`
Fetches connection health of the active Blender add-on bridge.
- **Response**: `{ "isOnline": boolean, "status": string, "lastSeen": string, "device": object }`

### `POST /api/blender/snapshot`
Receives and stores compact scene snapshot for the project.
- **Body**: `{ "projectId": string, "snapshot": SceneSnapshot }`
- **Response**: `{ "ok": true }`

---

## 3. Execution Pipeline

### `GET /api/executions?projectId=[id]`
Lists recent execution tasks.

### `POST /api/executions`
Queues a new script execution task.
- **Body**: `{ "projectId": string, "script": string, "description": string }`

### `POST /api/executions/claim-next`
Atomically claims the oldest pending task for an add-on instance.

### `POST /api/executions/[id]/start`
Marks a task as running upon human approval.

### `POST /api/executions/[id]/result`
Reports completion stdout, stderr, and execution duration.

### `POST /api/executions/[id]/cancel`
Cancels an un-executed task.

---

## 4. Projects & Version History

### `GET /api/projects` | `POST /api/projects`
List or create projects.

### `GET /api/projects/[id]` | `DELETE /api/projects/[id]`
Retrieve or delete a project.

### `GET /api/versions?projectId=[id]`
Retrieves immutable snapshots of past model iterations.

### `POST /api/versions`
Restores or labels a specific model version checkpoint.

### `GET /api/templates`
Fetches the built-in library of starter 3D templates across Furniture, Architecture, Game Assets, and Product Design.
