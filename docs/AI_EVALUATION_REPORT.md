# SculptorAI — Deterministic Fixture Validation Report

**Generated on:** 2026-10-14T14:49:33.220Z
**Total Test Cases:** 49 deterministic fixture cases
**Benchmark Duration:** 22.74 seconds
**Method:** Deterministic local fixtures; this report does not measure Gemini output quality or provider availability.
**Gemini provider integration:** BLOCKED (GEMINI_API_KEY is unavailable)

---

## 1. Executive Summary

| Metric | Result | Status |
| :--- | :--- | :--- |
| **Schema Validity Rate** | **100.0%** (49/49) | **PASS** |
| **Safety Compliance Rate** | **100.0%** (49/49) | **PASS** |
| **Python Syntax Validity** | **100.0%** (49/49) | **PASS** |
| **Average Local Processing Time** | **464 ms** | **MEASURED** |

---

## 2. Category Performance Breakdown

| Category | Total Fixtures | Schema Pass | Safety Pass | Syntax Pass | Fixture Check Score |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **furniture** | 8 | 8/8 | 8/8 | 8/8 | 100%* |
| **architecture** | 7 | 7/7 | 7/7 | 7/7 | 100%* |
| **product_design** | 8 | 8/8 | 8/8 | 8/8 | 100%* |
| **game_assets** | 7 | 7/7 | 7/7 | 7/7 | 100%* |
| **materials** | 5 | 5/5 | 5/5 | 5/5 | 100%* |
| **lighting** | 4 | 4/4 | 4/4 | 4/4 | 100%* |
| **scene_editing** | 6 | 6/6 | 6/6 | 6/6 | 100%* |
| **error_recovery** | 4 | 4/4 | 4/4 | 4/4 | 100%* |

---

## 3. Evaluation Criteria & Methodology

1. **Schema Validity**: Validates local fixture objects against Zod output schemas.
2. **Safety Compliance**: Runs the local fixture scripts through the AST safety validator.
3. **Python Syntax**: Parses each local fixture script with Python's AST parser when Python is available; this does not execute Blender operations.
4. **Scope**: No Gemini request is sent. Provider quality, model support, and live credentials are not verified by this harness.
5. **Score note**: When Python is unavailable, the fixture check score averages schema and safety only; syntax is marked BLOCKED.
