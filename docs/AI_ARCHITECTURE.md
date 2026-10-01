# SculptorAI — Modern AI Model Architecture

## 1. Design Principles

SculptorAI avoids hardcoded model names and uncontrolled free-form text. All AI interactions pass through:

1. **Centralized Model Routing**: Dynamic model selection configured strictly via environment variables.
2. **Schema-Guaranteed Structured Outputs**: Enforced JSON contracts using Zod (`ModelPlanSchema`, `ScenePatchSchema`, `TaskGraphSchema`, `ImageAnalysisSchema`, `BlenderDebugSchema`).
3. **Resilience & Rate Limiting**: Exponential backoff with jitter and timeout guards (`lib/ai/retry.ts`).
4. **Token & Cost Accounting**: In-flight token calculation and pricing tracking (`lib/ai/cost-control.ts`).
5. **Deterministic Fallbacks**: Every AI function features a zero-dependency procedural fallback ensuring the app remains 100% operational even during complete upstream network or quota outages.

---

## 2. Model Router Topology

Configured in `lib/ai/model-router.ts`:

| Task Role | Default Model ID | Environment Variable | Purpose |
| :--- | :--- | :--- | :--- |
| **Generation (Fast)** | `gemini-1.5-flash` | `AI_GENERATION_MODEL` | Fast generation for simple/medium 3D models |
| **Reasoning (Complex)** | `gemini-1.5-pro` | `AI_REASONING_MODEL` | Multi-step agent task graph decomposition & complex assets |
| **Vision Analysis** | `gemini-1.5-flash` | `AI_VISION_MODEL` | Multimodal reference image decomposition into geometric primitives |
| **Traceback Debugging** | `gemini-1.5-flash` | `AI_DEBUG_MODEL` | Surgical Python diagnosis and context-mode self-repair |
| **Scene Editing** | `gemini-1.5-flash` | `AI_SCENE_EDITOR_MODEL` | Incremental scene patch generation based on live Blender snapshots |

---

## 3. Schema Contracts

### `ModelPlan`
```json
{
  "intent": "create_model",
  "summary": "Procedural Scandinavian dining table",
  "objects": [
    {
      "name": "TableTop",
      "type": "mesh",
      "description": "Beveled chamfered rectangular oak top",
      "approxDimensions": { "x": 2.0, "y": 0.9, "z": 0.04 },
      "modifiers": ["Bevel"]
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "title": "Create Tabletop Mesh",
      "instructions": "Spawn cube at origin, scale to dimensions, and apply bevel modifier",
      "targetObject": "TableTop",
      "operationType": "primitive"
    }
  ],
  "materials": [
    {
      "name": "OakWood",
      "targetObject": "TableTop",
      "type": "principled_bsdf",
      "roughness": 0.35,
      "metallic": 0.05
    }
  ],
  "lighting": [
    { "name": "KeyLight", "type": "AREA", "energyWatts": 350, "position": [2.5, -3.0, 3.5] }
  ],
  "camera": { "focalLengthMm": 50, "position": [3.5, -3.5, 2.5], "type": "PERSP" }
}
```

---

## 4. Cost Control & Accounting

- Model token usage is tracked per request via `trackAIUsage()` and persisted to `ai_usage` in Supabase.
- Standard rates:
  - Gemini 1.5 Flash: $0.075 / 1M prompt tokens, $0.30 / 1M output tokens.
  - Gemini 1.5 Pro: $1.25 / 1M prompt tokens, $5.00 / 1M output tokens.
