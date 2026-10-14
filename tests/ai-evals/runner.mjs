/**
 * SCULPTOR AI — AI Benchmark Evaluation Harness
 * Evaluates representative 3D prompts across 8 specialized domains.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync, spawnSync } from "node:child_process";
import { validateBlenderScript } from "../../lib/blender/validator.ts";
import { generateFallbackPlan } from "../../lib/ai/generation.ts";
import { generateFallbackPatch } from "../../lib/ai/scene-editor.ts";
import { generateFallbackDebug } from "../../lib/ai/debugging.ts";
import { ModelPlanSchema, ScenePatchSchema, BlenderDebugSchema } from "../../lib/ai/schemas.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runEvaluations() {
  console.log("\n=======================================================");
  console.log("  SCULPTOR AI — BENCHMARK EVALUATION HARNESS");
  console.log("=======================================================\n");

  const datasetPath = path.join(__dirname, "benchmark-dataset.json");
  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));

  let totalCount = dataset.length;
  let schemaPasses = 0;
  let safetyPasses = 0;
  let syntaxPasses = 0;
  let failedCases = 0;
  const pythonExecutable = process.env.PYTHON || "python";
  const pythonProbe = spawnSync(pythonExecutable, ["--version"], { stdio: "ignore" });
  const pythonReady = !pythonProbe.error && pythonProbe.status === 0;
  let totalLatencyMs = 0;

  const resultsByCategory = {};

  const startTime = Date.now();

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    const cat = item.category;
    if (!resultsByCategory[cat]) {
      resultsByCategory[cat] = { total: 0, schemaPass: 0, safetyPass: 0, syntaxPass: 0 };
    }
    resultsByCategory[cat].total++;

    const itemStart = Date.now();
    let schemaValid = false;
    let safetyValid = false;
    let syntaxValid = false;

    try {
      if (cat === "scene_editing") {
        const dummyScene = {
          sceneName: "MainScene",
          blenderVersion: "4.x",
          objects: [{ name: "Desk_Top", type: "mesh" }, { name: "Desk_Leg_01", type: "mesh" }],
          activeObject: "Desk_Top",
        };
        const editRes = generateFallbackPatch({
          instruction: item.prompt,
          currentScene: dummyScene,
        });

        const parseRes = ScenePatchSchema.safeParse(editRes.patch);
        schemaValid = parseRes.success;
        const safeRes = validateBlenderScript(editRes.code.content);
        safetyValid = safeRes.isValid;
        syntaxValid = pythonReady && isValidPythonSyntax(editRes.code.content);
      } else if (cat === "error_recovery") {
        const dbgRes = generateFallbackDebug({
          error: item.prompt,
          script: "import bpy\nbpy.context.active_object.data.materials.append(None)",
        });

        const parseRes = BlenderDebugSchema.safeParse({
          problem: dbgRes.diagnosis.problem,
          whyItHappened: dbgRes.diagnosis.whyItHappened,
          suggestedFix: dbgRes.diagnosis.suggestedFix,
          changes: dbgRes.changes,
          correctedCode: dbgRes.correctedCode,
        });
        schemaValid = parseRes.success;
        const safeRes = validateBlenderScript(dbgRes.correctedCode);
        safetyValid = safeRes.isValid;
        syntaxValid = pythonReady && isValidPythonSyntax(dbgRes.correctedCode);
      } else {
        const genRes = generateFallbackPlan({
          prompt: item.prompt,
          style: "clean",
          complexity: "medium",
        });

        const parseRes = ModelPlanSchema.safeParse({
          ...genRes.plan,
          blenderCode: genRes.code.content,
        });
        schemaValid = parseRes.success;

        const safeRes = validateBlenderScript(genRes.code.content);
        safetyValid = safeRes.isValid;
        syntaxValid = pythonReady ? isValidPythonSyntax(genRes.code.content) : false;
      }
    } catch (err) {
      console.error(`Error evaluating [${item.id}]:`, err.message);
    }

    const itemElapsed = Date.now() - itemStart;
    totalLatencyMs += itemElapsed;

    if (schemaValid) {
      schemaPasses++;
      resultsByCategory[cat].schemaPass++;
    }
    if (safetyValid) {
      safetyPasses++;
      resultsByCategory[cat].safetyPass++;
    }
    if (syntaxValid) {
      syntaxPasses++;
      resultsByCategory[cat].syntaxPass++;
    }
    if (!schemaValid || !safetyValid || (pythonReady && !syntaxValid)) failedCases++;

    const statusSymbol = schemaValid && safetyValid && (!pythonReady || syntaxValid) ? "✓" : "⚠";
    console.log(` [${i + 1}/${totalCount}] ${statusSymbol} (${item.category}) ${item.id}: ${item.prompt.slice(0, 55)}... [${itemElapsed}ms]`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const avgLatency = Math.round(totalLatencyMs / totalCount);
  const schemaPassPct = ((schemaPasses / totalCount) * 100).toFixed(1);
  const safetyPassPct = ((safetyPasses / totalCount) * 100).toFixed(1);
  const syntaxPassPct = pythonReady ? ((syntaxPasses / totalCount) * 100).toFixed(1) : "n/a";
  const schemaStatus = schemaPasses === totalCount ? "PASS" : "FAIL";
  const safetyStatus = safetyPasses === totalCount ? "PASS" : "FAIL";
  const syntaxStatus = pythonReady ? (syntaxPasses === totalCount ? "PASS" : "FAIL") : "BLOCKED";

  console.log("\n=======================================================");
  console.log("  EVALUATION SUMMARY RESULTS");
  console.log("=======================================================");
  console.log(" Evaluation type:           Deterministic fixture validation (no Gemini calls)");
  console.log(` Total Prompts Evaluated:   ${totalCount}`);
  console.log(` Schema Validity:           ${schemaPasses}/${totalCount} (${schemaPassPct}%)`);
  console.log(` Safety Compliance:         ${safetyPasses}/${totalCount} (${safetyPassPct}%)`);
  console.log(` Blender Syntax Validity:   ${pythonReady ? `${syntaxPasses}/${totalCount} (${syntaxPassPct}%)` : "BLOCKED (Python unavailable)"}`);
  console.log(` Average Processing Time:   ${avgLatency} ms`);
  console.log(` Total Evaluation Time:     ${durationSec}s\n`);
  console.log(` Gemini provider status:    ${process.env.GEMINI_API_KEY ? "NOT TESTED (fixture-only run)" : "BLOCKED (GEMINI_API_KEY is unavailable)"}`);
  console.log(` Failed cases:              ${failedCases}`);

  console.log("Category Breakdown:");
  for (const [cat, data] of Object.entries(resultsByCategory)) {
    console.log(`  - ${cat.padEnd(16)}: ${data.total} prompts | Schema: ${data.schemaPass}/${data.total} | Safety: ${data.safetyPass}/${data.total} | Syntax: ${data.syntaxPass}/${data.total}`);
  }
  console.log("=======================================================\n");

  // Generate markdown report in docs/AI_EVALUATION_REPORT.md
  const reportPath = path.join(__dirname, "../../docs/AI_EVALUATION_REPORT.md");
  const reportContent = `# SculptorAI — Deterministic Fixture Validation Report

**Generated on:** ${new Date().toISOString()}  
**Total Test Cases:** ${totalCount} deterministic fixture cases
**Benchmark Duration:** ${durationSec} seconds  
**Method:** Deterministic local fixtures; this report does not measure Gemini output quality or provider availability.
**Gemini provider integration:** ${process.env.GEMINI_API_KEY ? "NOT TESTED (fixture-only run)" : "BLOCKED (GEMINI_API_KEY is unavailable)"}

---

## 1. Executive Summary

| Metric | Result | Status |
| :--- | :--- | :--- |
| **Schema Validity Rate** | **${schemaPassPct}%** (${schemaPasses}/${totalCount}) | **${schemaStatus}** |
| **Safety Compliance Rate** | **${safetyPassPct}%** (${safetyPasses}/${totalCount}) | **${safetyStatus}** |
| **Python Syntax Validity** | ${pythonReady ? `**${syntaxPassPct}%** (${syntaxPasses}/${totalCount})` : "Not run (Python unavailable)"} | **${syntaxStatus}** |
| **Average Local Processing Time** | **${avgLatency} ms** | **MEASURED** |

---

## 2. Category Performance Breakdown

| Category | Total Fixtures | Schema Pass | Safety Pass | Syntax Pass | Fixture Check Score |
| :--- | :---: | :---: | :---: | :---: | :---: |
${Object.entries(resultsByCategory)
  .map(([cat, d]) => {
    const checksRun = pythonReady ? 3 : 2;
    const passedChecks = d.schemaPass + d.safetyPass + (pythonReady ? d.syntaxPass : 0);
    const score = ((passedChecks / (d.total * checksRun)) * 100).toFixed(0);
    return `| **${cat}** | ${d.total} | ${d.schemaPass}/${d.total} | ${d.safetyPass}/${d.total} | ${pythonReady ? `${d.syntaxPass}/${d.total}` : "BLOCKED"} | ${score}%* |`;
  })
  .join("\n")}

---

## 3. Evaluation Criteria & Methodology

1. **Schema Validity**: Validates local fixture objects against Zod output schemas.
2. **Safety Compliance**: Runs the local fixture scripts through the AST safety validator.
3. **Python Syntax**: Parses each local fixture script with Python's AST parser when Python is available; this does not execute Blender operations.
4. **Scope**: No Gemini request is sent. Provider quality, model support, and live credentials are not verified by this harness.
5. **Score note**: When Python is unavailable, the fixture check score averages schema and safety only; syntax is marked BLOCKED.
`;

  fs.writeFileSync(reportPath, reportContent, "utf-8");
  console.log(`Evaluation report successfully generated: docs/AI_EVALUATION_REPORT.md`);
  if (schemaStatus !== "PASS" || safetyStatus !== "PASS" || (pythonReady && syntaxStatus !== "PASS") || failedCases > 0) {
    process.exitCode = 1;
  }
}

function isValidPythonSyntax(source) {
  try {
    execFileSync(process.env.PYTHON || "python", ["-c", "import ast, sys; ast.parse(sys.stdin.read())"], {
      input: source,
      encoding: "utf8",
      stdio: ["pipe", "ignore", "pipe"],
    });
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("Python is required for fixture syntax verification but is unavailable.");
    }
    return false;
  }
}

runEvaluations().catch((err) => {
  console.error("Evaluation run failed:", err);
  process.exit(1);
});
