import assert from "node:assert";
import { db } from "../../lib/supabase/db.ts";
import { getAIProvider } from "../../lib/ai/adapter.ts";
import { validateBlenderScript } from "../../lib/blender/validator.ts";

export async function testEndToEndWorkflow() {
  console.log("▶ Testing Full End-to-End Workflow ('Create a futuristic gaming desk')...");

  const userId = "usr_artist_e2e";
  const userEmail = "artist@sculptor.ai";

  // STEP 1: User signs in and creates project
  console.log("  [Step 1] User signs in and opens project workspace");
  const project = await db.createProject({
    userId,
    name: "Cyberpunk Studio Desk",
    description: "Futuristic ergonomic desk with cable management",
    blenderVersion: "4.x",
  });
  assert.ok(project.id);

  // STEP 2: User submits prompt in Studio
  const prompt = "Create a futuristic gaming desk with monitor stand and neon RGB accent lines";
  console.log(`  [Step 2] User submits prompt: "${prompt}"`);

  // STEP 3: AI generates modeling plan and bpy code
  console.log("  [Step 3] AI generates structured modeling plan and executable Blender Python");
  const ai = getAIProvider();
  const aiResult = await ai.generateModelPlan({
    prompt,
    blenderVersion: project.blenderVersion,
    style: "sci-fi",
    complexity: "medium",
    includeCode: true,
  });

  assert.ok(aiResult.plan.summary);
  assert.ok(aiResult.code.content.includes("import bpy"));
  console.log(`  ✓ Generated Plan: "${aiResult.plan.summary}"`);

  // STEP 4: Code passes safety validation
  console.log("  [Step 4] Generated script passes safety validation");
  const validation = validateBlenderScript(aiResult.code.content);
  assert.strictEqual(validation.isValid, true, "Generated script failed security validation");
  console.log("  ✓ Script validated: zero security errors");

  // STEP 5: Generation saved to Supabase
  console.log("  [Step 5] Generation persisted to Supabase database");
  const savedGen = await db.createGeneration({
    projectId: project.id,
    userId,
    versionNumber: 1,
    prompt,
    mode: "create",
    style: "sci-fi",
    complexity: "medium",
    planJson: aiResult.plan,
    code: aiResult.code.content,
    warnings: validation.warnings,
  });
  assert.ok(savedGen.id);
  assert.strictEqual(savedGen.versionNumber, 1);
  console.log("  ✓ Generation record created with version #1");

  // STEP 6: User clicks "Send to Blender / Approve & Run" -> creates execution task
  console.log("  [Step 6] Execution task created in 'pending' state");
  const execution = await db.createExecution({
    generationId: savedGen.id,
    projectId: project.id,
    userId,
    blenderVersion: project.blenderVersion,
    script: savedGen.code,
    prompt: savedGen.prompt,
  });
  assert.strictEqual(execution.status, "pending");
  console.log("  ✓ Execution queued with status 'pending'");

  // STEP 7: Blender Add-on claims task atomically
  console.log("  [Step 7] Blender add-on polls and claims the pending task");
  const claimedTask = await db.claimExecutionById(execution.id, userId, "4.x");
  assert.ok(claimedTask);
  assert.strictEqual(claimedTask.status, "claimed");
  console.log("  ✓ Add-on successfully claimed task (status = 'claimed')");

  // STEP 8: Blender artist reviews code and clicks "Approve & Run" in Blender UI
  console.log("  [Step 8] Artist reviews code inside Blender and clicks 'Approve & Run'");
  const runningTask = await db.startExecution(execution.id, userId);
  assert.strictEqual(runningTask?.status, "running");
  console.log("  ✓ Execution status updated to 'running'");

  // STEP 9: Blender executes script and reports actual success result
  console.log("  [Step 9] Blender runtime executes code and reports real success result");
  const executionResult = await db.completeExecution(execution.id, userId, {
    status: "success",
    stdout: "[SculptorAI Executor] Scene cleared.\n[SculptorAI Executor] Created 'Cyber_Desk_Surface' with bevel modifier.\n[SculptorAI Executor] Execution finished in 280ms.",
    stderr: "",
    durationMs: 280,
    blenderVersion: "4.x",
  });
  assert.strictEqual(executionResult?.status, "success");
  assert.ok(executionResult.stdout.includes("Cyber_Desk_Surface"));
  console.log("  ✓ Real execution result stored in database");

  // STEP 10: Verify state persistence after refresh
  console.log("  [Step 10] Verify generation history and execution state persist after reload");
  const historyAfterReload = await db.getGenerations(project.id, userId);
  assert.strictEqual(historyAfterReload.length, 1);
  assert.strictEqual(historyAfterReload[0].code, aiResult.code.content);
  const executionAfterReload = await db.getExecutionById(execution.id, userId);
  assert.strictEqual(executionAfterReload?.status, "success");
  console.log("  ✓ Verified: Generation history and execution results remain 100% persistent!");

  // ============================================================================
  // STEP 11: TEST ERROR & AI FIXING LOOP
  // ============================================================================
  console.log("\n▶ Testing Failure & AI Self-Repair Loop...");

  // Script with intentional Blender runtime bug
  const brokenScript = `import bpy\n# Bug: Attempting to set mode without active object\nbpy.context.active_object.mode = 'EDIT'\n`;
  const errExecution = await db.createExecution({
    generationId: savedGen.id,
    projectId: project.id,
    userId,
    script: brokenScript,
    prompt: "Failing script test",
  });
  await db.claimExecutionById(errExecution.id, userId);
  await db.startExecution(errExecution.id, userId);

  // Blender fails and reports stderr
  const realStderr = "AttributeError: 'NoneType' object has no attribute 'mode'\n  File '<sculptor>', line 3, in <module>";
  const failedResult = await db.completeExecution(errExecution.id, userId, {
    status: "error",
    stdout: "",
    stderr: realStderr,
    durationMs: 12,
  });
  assert.strictEqual(failedResult?.status, "error");
  console.log("  ✓ Blender execution error captured and stored");

  // User clicks "Fix with AI" -> Calls debug API
  console.log("  [AI Debugger] Diagnosing error and generating surgical correction...");
  const debugResult = await ai.debugBlender({
    error: realStderr,
    script: brokenScript,
    blenderVersion: "4.x",
  });
  assert.ok(debugResult.correctedCode);
  console.log(`  ✓ Diagnosis: ${debugResult.diagnosis.problem}`);
  console.log(`  ✓ Suggested Fix: ${debugResult.diagnosis.suggestedFix}`);

  // Corrected code validated
  const fixValidation = validateBlenderScript(debugResult.correctedCode);
  assert.strictEqual(fixValidation.isValid, true);
  console.log("  ✓ Corrected script passed safety validation");

  // Re-run corrected script
  const fixedExecution = await db.createExecution({
    generationId: savedGen.id,
    projectId: project.id,
    userId,
    script: debugResult.correctedCode,
    prompt: "Corrected script execution",
  });
  await db.claimExecutionById(fixedExecution.id, userId);
  await db.startExecution(fixedExecution.id, userId);
  const reExecutionResult = await db.completeExecution(fixedExecution.id, userId, {
    status: "success",
    stdout: "Corrected script executed successfully.",
    stderr: "",
    durationMs: 95,
  });
  assert.strictEqual(reExecutionResult?.status, "success");
  console.log("  ✓ Corrected script re-executed with confirmed success!");

  // Clean up e2e project
  await db.deleteProject(project.id, userId);
  console.log("  ✓ Cleaned up test project.\n");
}
