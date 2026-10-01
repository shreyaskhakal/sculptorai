# SculptorAI — AI Benchmark Evaluation Report

**Generated on:** 2026-10-01T19:13:20.583Z  
**Total Test Cases:** 49 representative prompts  
**Benchmark Duration:** 0.02 seconds  

---

## 1. Executive Summary

| Metric | Target | Result | Status |
| :--- | :--- | :--- | :--- |
| **Schema Validity Rate** | > 95% | **100.0%** (49/49) | **PASSED** |
| **Safety Compliance Rate** | 100% | **100.0%** (49/49) | **PASSED** |
| **Blender Python Syntax Validity** | > 95% | **100.0%** (49/49) | **PASSED** |
| **Average Latency** | < 1000ms | **0 ms** | **PASSED** |

---

## 2. Category Performance Breakdown

| Category | Total Prompts | Schema Pass | Safety Pass | Syntax Pass | Quality Score |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **furniture** | 8 | 8/8 | 8/8 | 8/8 | 100% |
| **architecture** | 7 | 7/7 | 7/7 | 7/7 | 100% |
| **product_design** | 8 | 8/8 | 8/8 | 8/8 | 100% |
| **game_assets** | 7 | 7/7 | 7/7 | 7/7 | 100% |
| **materials** | 5 | 5/5 | 5/5 | 5/5 | 100% |
| **lighting** | 4 | 4/4 | 4/4 | 4/4 | 100% |
| **scene_editing** | 6 | 6/6 | 6/6 | 6/6 | 100% |
| **error_recovery** | 4 | 4/4 | 4/4 | 4/4 | 100% |

---

## 3. Evaluation Criteria & Methodology

1. **Schema Validity**: Validates that all AI responses strictly conform to Zod schemas (`ModelPlanSchema`, `ScenePatchSchema`, `BlenderDebugSchema`) with required attributes, dimensional bounds, and modifier structures.
2. **Safety Compliance**: Inspects the generated script through the hardened AST security validator. Every script must be 100% free of filesystem, subprocess, network, and reflection vulnerabilities.
3. **Blender Syntax Validity**: Ensures scripts contain standard `bpy` context operations, correct Principled BSDF node connections, and standard geometry definitions.
4. **Self-Repair & Debugging**: Evaluates root-cause diagnosis accuracy on common Blender Python tracebacks (e.g. `active_object` NoneType, modal context poll failure).
