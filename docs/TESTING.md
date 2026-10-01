# SculptorAI — Test & Quality Assurance Suite

SculptorAI employs comprehensive automated testing across unit, security, integration, and AI benchmark domains.

---

## 1. Running the Test Suites

### Master Test Suite (`npm test`)
Executes 8 test modules covering:
1. **AST Code Safety Validator & Attack Bypass Defense**: Blocks 12+ attack vectors (subprocess, os.system, __import__, reflection, open, shutil, env harvesting, socket exfiltration, subclass traversal).
2. **AI Generation Prompts & Output Schema**: Validates structured output across diverse primitives.
3. **API Validation & Zod Schemas**: Rejects malformed payloads and short prompts.
4. **Rate Limiting & Input Sanitization**: Verifies prompt injection stripping and request rate throttling.
5. **User Authorization & Tenant Isolation**: Verifies cross-project access blocks.
6. **Database Persistence & Versioning**: Tests SQLite/Supabase RLS simulation and cascading deletions.
7. **Execution Pipeline Lifecycle**: Tests atomic task claiming, running state transitions, and real stdout/stderr reporting.
8. **Full End-to-End Workflow**: Simulates prompt -> plan -> safety check -> queue -> claim -> approve -> execute -> version persistence.

```bash
npm test
```

### AI Benchmark Evaluation Suite (`npm run test:evals`)
Runs 50 representative prompts across 8 specialized categories:
- Furniture
- Architecture
- Product Design
- Game Assets
- Materials
- Lighting
- Conversational Scene Editing
- Error Recovery

Measures schema validity %, safety compliance %, Blender syntax correctness %, and latency.

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
