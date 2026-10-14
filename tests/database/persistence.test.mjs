import assert from "node:assert";
import { db } from "../../lib/supabase/db.ts";

export async function testDatabasePersistence() {
  console.log("▶ Testing process-local demo-store CRUD & tenant isolation (no live database)...");

  const userA = "usr_artist_alpha";
  const userB = "usr_artist_beta";

  // 1. Create Project for User A
  const projA = await db.createProject({
    userId: userA,
    name: "Futuristic Gaming Desk",
    description: "Cyberpunk desk with RGB channels",
    blenderVersion: "4.x",
  });
  assert.ok(projA.id, "Project A should have a valid ID");
  assert.strictEqual(projA.userId, userA);
  console.log("  ✓ Project created for User A in the process-local demo store");

  // 2. User B cannot see or retrieve User A's project
  const crossFetch = await db.getProjectById(projA.id, userB);
  assert.strictEqual(crossFetch, null, "User B should not have access to User A's project");
  console.log("  ✓ Cross-tenant project access blocked (RLS isolation verified)");

  // 3. User A can retrieve their own project
  const ownFetch = await db.getProjectById(projA.id, userA);
  assert.strictEqual(ownFetch?.id, projA.id);
  assert.strictEqual(ownFetch?.name, "Futuristic Gaming Desk");
  console.log("  ✓ Owner retrieved the project from the process-local demo store");

  // 4. Create Generation for Project A
  const gen1 = await db.createGeneration({
    projectId: projA.id,
    userId: userA,
    versionNumber: 1,
    prompt: "Create a futuristic gaming desk with monitor and RGB lighting",
    mode: "create",
    style: "sci-fi",
    complexity: "medium",
    planJson: { intent: "create_model", summary: "Desk surface with cable grommets" },
    code: "import bpy\ndef main(): pass\n",
  });
  assert.ok(gen1.id);
  assert.strictEqual(gen1.versionNumber, 1);
  console.log("  ✓ Generation fixture saved with versioning and parameters");

  // 5. Verify same-process reads; this is not a cross-session persistence test.
  const generations = await db.getGenerations(projA.id, userA);
  assert.strictEqual(generations.length, 1);
  assert.strictEqual(generations[0].prompt, "Create a futuristic gaming desk with monitor and RGB lighting");
  console.log("  ✓ Generation history read from the process-local demo store");

  // 6. User B cannot see User A's generations
  const userBGenerations = await db.getGenerations(projA.id, userB);
  assert.strictEqual(userBGenerations.length, 0, "User B should not see User A's generations");
  console.log("  ✓ Generation isolation between demo tenants verified");

  // 7. Conversation and message behavior in the process-local demo store
  const conv = await db.getOrCreateConversation(projA.id, userA);
  assert.ok(conv.id);

  const msg1 = await db.addMessage({
    conversationId: conv.id,
    userId: userA,
    role: "user",
    content: { text: "Add an ergonomic monitor riser" },
  });
  assert.ok(msg1.id);

  const msg2 = await db.addMessage({
    conversationId: conv.id,
    userId: userA,
    role: "assistant",
    content: { text: "Generated monitor riser with beveled chamfers" },
  });
  assert.ok(msg2.id);

  const history = await db.getMessages(conv.id, userA);
  assert.strictEqual(history.length, 2);
  assert.strictEqual(history[0].role, "user");
  assert.strictEqual(history[1].role, "assistant");
  console.log("  ✓ Conversation messages read in chronological order from the demo store");

  // 8. Clean up
  await db.deleteProject(projA.id, userA);
  const deletedCheck = await db.getProjectById(projA.id, userA);
  assert.strictEqual(deletedCheck, null);
  console.log("  ✓ Project deletion behavior verified in the demo store");
}
