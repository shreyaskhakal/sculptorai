# API Specification

Base URL:
`/api`

All authenticated endpoints require a valid user session.

## POST /api/generate

Purpose: Generate a Blender modeling plan and Python.

Request:
```json
{
  "projectId": "uuid",
  "prompt": "Create a futuristic gaming desk",
  "blenderVersion": "4.x",
  "includeCode": true,
  "style": "realistic",
  "complexity": "medium"
}
```

Response:
```json
{
  "generationId": "uuid",
  "status": "completed",
  "plan": {
    "summary": "A modular futuristic gaming desk",
    "objects": [],
    "steps": [],
    "materials": [],
    "lighting": [],
    "camera": {},
    "assumptions": []
  },
  "code": {
    "language": "python",
    "content": "import bpy\n..."
  },
  "warnings": []
}
```

## POST /api/analyze-image

Multipart/form-data:
- `projectId`
- `image`
- `prompt` optional
- `includeCode` optional
- `blenderVersion`

Response:
```json
{
  "analysisId": "uuid",
  "objects": [],
  "geometry": {},
  "materials": [],
  "modelingApproach": [],
  "confidence": {},
  "code": {
    "language": "python",
    "content": "..."
  }
}
```

## POST /api/debug

Request:
```json
{
  "projectId": "uuid",
  "generationId": "uuid",
  "blenderVersion": "4.x",
  "error": "Traceback ...",
  "script": "import bpy ..."
}
```

Response:
```json
{
  "debugId": "uuid",
  "diagnosis": "The selected object is null...",
  "changes": [],
  "correctedCode": "import bpy ..."
}
```

## POST /api/executions

Creates an execution request for the Blender add-on.

Request:
```json
{
  "generationId": "uuid",
  "blenderVersion": "4.x"
}
```

Response:
```json
{
  "executionId": "uuid",
  "status": "pending",
  "script": "..."
}
```

The add-on then reports the result.

## POST /api/executions/:id/result

Request:
```json
{
  "status": "success",
  "stdout": "...",
  "stderr": "",
  "durationMs": 1420
}
```

## GET /api/projects

Returns user's projects.

## POST /api/projects

```json
{
  "name": "Cyberpunk Desk",
  "description": "..."
}
```

## GET /api/projects/:id/generations

Returns generation history.

## GET /api/health

Returns:
```json
{
  "status": "ok",
  "database": "ok",
  "ai": "ok"
}
```

## API design rules
- Use Zod or equivalent runtime validation.
- Never trust client-supplied user IDs.
- Never expose server-side AI secrets.
- Return consistent error envelopes.
- Add request IDs.
- Log failures without logging secrets.
