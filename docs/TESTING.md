# SculptorAI — Test & Quality Assurance Suite

SculptorAI employs comprehensive automated testing across unit, security, integration, realtime, RBAC, marketplace, and AI benchmark domains.

---

## 1. Running the Test Suites

### Master Test Suite (`npm test`)
Executes 11 test modules covering:
1. **AST Code Safety Validator & Attack Bypass Defense**: Blocks 12+ attack vectors (subprocess, os.system, __import__, reflection, open, shutil, env harvesting, socket exfiltration, subclass traversal).
2. **AI Generation Prompts & Output Schema**: Validates structured output across diverse primitives.
3. **API Validation & Zod Schemas**: Rejects malformed payloads and short prompts.
4. **Rate Limiting & Input Sanitization**: Verifies prompt injection stripping and request rate throttling.
5. **User Authorization & Tenant Isolation**: Verifies cross-project access blocks.
6. **Database Persistence & Versioning**: Tests SQLite/Supabase RLS simulation and cascading deletions.
7. **Execution Pipeline Lifecycle**: Tests atomic task claiming, running state transitions, and real stdout/stderr reporting.
8. **Full End-to-End Workflow**: Simulates prompt -> plan -> safety check -> queue -> claim -> approve -> execute -> version persistence.
9. **Supabase Realtime Broadcast & SSE**: Tests event broadcasting (`task.created`, `execution.progress`, `execution.completed`, `blender.heartbeat`) and Blender client duplicate task idempotency.
10. **Multi-User Project RBAC Permission Matrix**: Tests all 4 roles (`owner`, `editor`, `commenter`, `viewer`) across 12 distinct action capabilities and non-member isolation.
11. **Marketplace Capability Scanner & Security Pipeline**: Tests zero-tolerance AST attack defense, declared capability boundary verification, and legitimate procedural generator scoring (100/100).

```bash
npm test
```

### AI Benchmark Evaluation Suite (`npm run test:evals`)
Runs 49 representative prompts across 8 specialized categories:
- Furniture (8/8)
- Architecture (7/7)
- Product Design (8/8)
- Game Assets (7/7)
- Materials (5/5)
- Lighting (4/4)
- Conversational Scene Editing (6/6)
- Error Recovery (4/4)

Measures schema validity (100%), safety compliance (100%), Blender syntax correctness (100%), and latency (~1ms).

```bash
npm run test:evals
```

### TypeScript Static Typecheck
```bash
npx tsc --noEmit
```

### ESLint Linter
```bash
npm run lint
```

### Production Build
```bash
npm run build
```
