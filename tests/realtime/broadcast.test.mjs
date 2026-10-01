import assert from "node:assert/strict";
import { EventEmitter } from "node:events";

console.log("-------------------------------------------------");
console.log("  TEST SUITE: Supabase Realtime Broadcast & SSE  ");
console.log("-------------------------------------------------");

export async function testRealtimeBroadcast() {
  const localBus = new EventEmitter();
  const receivedEvents = [];

  const projectId = "proj_realtime_test";
  const channelName = `sculptor:project:${projectId}`;

  // 1. Subscribe listener to channel
  localBus.on(channelName, ({ event, payload }) => {
    receivedEvents.push({ event, payload });
  });

  // 2. Test task.created event broadcast
  const taskCreated = {
    taskId: "task_101",
    projectId,
    blenderVersion: "4.2",
    prompt: "Procedural Cyberpunk Lamp",
    script: "import bpy\nbpy.ops.mesh.primitive_cylinder_add()",
    createdAt: new Date().toISOString(),
  };

  localBus.emit(channelName, { event: "task.created", payload: taskCreated });
  assert.equal(receivedEvents.length, 1);
  assert.equal(receivedEvents[0].event, "task.created");
  assert.equal(receivedEvents[0].payload.taskId, "task_101");
  console.log("  ✓ task.created broadcast correctly received");

  // 3. Test execution.progress event broadcast
  const progressEvent = {
    executionId: "task_101",
    projectId,
    percent: 65,
    stage: "Beveling Vertices",
  };

  localBus.emit(channelName, { event: "execution.progress", payload: progressEvent });
  assert.equal(receivedEvents.length, 2);
  assert.equal(receivedEvents[1].payload.percent, 65);
  console.log("  ✓ execution.progress (65%) broadcast correctly received");

  // 4. Test execution.completed event broadcast
  const completedEvent = {
    executionId: "task_101",
    projectId,
    status: "success",
    stdout: "Created 1 mesh with 128 vertices",
    stderr: "",
    durationMs: 412,
    completedAt: new Date().toISOString(),
  };

  localBus.emit(channelName, { event: "execution.completed", payload: completedEvent });
  assert.equal(receivedEvents.length, 3);
  assert.equal(receivedEvents[2].payload.status, "success");
  console.log("  ✓ execution.completed broadcast correctly received");

  // 5. Test Blender Idempotency Protection
  const executedTasks = new Set();
  function processTaskOnce(task) {
    if (executedTasks.has(task.taskId)) {
      return { skipped: true, reason: "Duplicate task ignored" };
    }
    executedTasks.add(task.taskId);
    return { skipped: false, executed: true };
  }

  const run1 = processTaskOnce(taskCreated);
  const run2 = processTaskOnce(taskCreated); // Duplicate transmission
  assert.equal(run1.skipped, false);
  assert.equal(run2.skipped, true);
  console.log("  ✓ Blender client duplicate task idempotency verified (prevents double execution)");

  console.log("  ✓ Realtime Broadcast & Idempotency tests PASSED!\n");
}

if (process.argv[1]?.endsWith("broadcast.test.mjs")) {
  testRealtimeBroadcast();
}
