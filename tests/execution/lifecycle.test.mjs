import assert from "node:assert";
import { db } from "../../lib/supabase/db.ts";

export async function testExecutionLifecycle() {
  console.log("▶ Testing Execution Pipeline Lifecycle & Atomic Claim Handshake...");

  const userId = "usr_artist_lifecycle";
  const proj = await db.createProject({
    userId,
    name: "Lifecycle Test Project",
    blenderVersion: "4.x",
  });

  // 1. Create Pending Execution Task
  const exec = await db.createExecution({
    generationId: "gen_lifecycle_1",
    projectId: proj.id,
    userId,
    blenderVersion: "4.x",
    script: "import bpy\ndef main(): pass\n",
    prompt: "Test cube procedural generation",
  });
  assert.ok(exec.id);
  assert.strictEqual(exec.status, "pending");
  console.log("  ✓ Task created with status 'pending'");

  // 2. Client 1 claims the task atomically
  const claimed1 = await db.claimExecutionById(exec.id, userId, "4.x");
  assert.ok(claimed1);
  assert.strictEqual(claimed1.status, "claimed");
  assert.ok(claimed1.claimedAt);
  console.log("  ✓ Client 1 claimed task atomically (status = 'claimed')");

  // 3. Client 2 tries to claim the same task -> Collision prevented!
  const claimed2 = await db.claimExecutionById(exec.id, userId, "4.x");
  assert.strictEqual(claimed2, null, "Atomic claim collision! Client 2 claimed an already claimed task!");
  console.log("  ✓ Race condition prevented: Client 2 denied duplicate claim");

  // 4. Start execution (marked running)
  const running = await db.startExecution(exec.id, userId);
  assert.ok(running);
  assert.strictEqual(running.status, "running");
  assert.ok(running.startedAt);
  console.log("  ✓ Task transitioned to 'running' state upon user approval");

  // 5. Complete execution with real stdout and duration
  const completed = await db.completeExecution(exec.id, userId, {
    status: "success",
    stdout: "Created cube mesh at (0, 0, 0)\nExecution complete.",
    stderr: "",
    durationMs: 142,
    blenderVersion: "4.2",
  });
  assert.ok(completed);
  assert.strictEqual(completed.status, "success");
  assert.strictEqual(completed.durationMs, 142);
  assert.strictEqual(completed.blenderVersion, "4.2");
  console.log("  ✓ Task reported execution success with real stdout and timing");

  // 6. Test Error Flow
  const errorTask = await db.createExecution({
    generationId: "gen_err_1",
    projectId: proj.id,
    userId,
    script: "bpy.context.object.mode = 'EDIT'",
    prompt: "Intentionally broken script",
  });
  await db.claimExecutionById(errorTask.id, userId);
  await db.startExecution(errorTask.id, userId);
  const failed = await db.completeExecution(errorTask.id, userId, {
    status: "error",
    stdout: "",
    stderr: "AttributeError: 'NoneType' object has no attribute 'mode'",
    durationMs: 15,
  });
  assert.strictEqual(failed?.status, "error");
  assert.ok(failed?.stderr.includes("AttributeError"));
  console.log("  ✓ Task reported real execution error and traceback");

  // 7. Test Cancellation
  const cancelTask = await db.createExecution({
    generationId: "gen_cancel_1",
    projectId: proj.id,
    userId,
    script: "import bpy",
    prompt: "Task to cancel",
  });
  const cancelled = await db.cancelExecution(cancelTask.id, userId);
  assert.strictEqual(cancelled?.status, "cancelled");
  console.log("  ✓ Pending task successfully cancelled");

  // Clean up
  await db.deleteProject(proj.id, userId);
}
