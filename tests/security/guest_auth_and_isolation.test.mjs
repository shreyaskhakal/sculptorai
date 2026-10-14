import assert from "node:assert";
import { createGuestSession, verifyGuestToken } from "../../lib/security/guest-session.ts";
import { getAuthenticatedUser } from "../../lib/supabase/server-auth.ts";
import { db } from "../../lib/supabase/db.ts";

export async function testGuestAuthAndIsolation() {
  console.log("▶ Testing Guest Access, Cryptographic Token Verification & Cross-Tenant Isolation...");

  // 1. Test Cryptographic Guest Session Creation and Verification
  const session1 = createGuestSession();
  assert.ok(session1.guestId, "Guest ID must be defined");
  assert.ok(session1.token.startsWith("gst_"), "Guest token must start with gst_ prefix");
  
  const verified1 = verifyGuestToken(session1.token);
  assert.ok(verified1, "Valid guest token must verify successfully");
  assert.strictEqual(verified1.guestId, session1.guestId, "Verified guest ID must match generated ID");
  console.log("  ✓ Cryptographic guest session creation and HMAC-SHA256 signature verified");

  // 2. Reject Tampered or Forged Guest Tokens
  const tamperedSigToken = `${session1.token.slice(0, -4)}dead`;
  assert.strictEqual(verifyGuestToken(tamperedSigToken), null, "Tampered signature must be rejected");

  const forgedIdToken = `gst_11111111-2222-4333-8444-555555555555.${session1.token.split(".")[1]}`;
  assert.strictEqual(verifyGuestToken(forgedIdToken), null, "Forged UUID with mismatched signature must be rejected");

  assert.strictEqual(verifyGuestToken("not-a-token"), null, "Malformed token must be rejected");
  console.log("  ✓ Forged and tampered guest tokens strictly rejected");

  // 3. Test Server Auth with Bearer Guest Token
  const reqWithGuestBearer = {
    headers: new Headers({
      authorization: `Bearer ${session1.token}`,
    }),
  };
  const authRes1 = await getAuthenticatedUser(reqWithGuestBearer);
  assert.ok(authRes1.user, "Guest with valid Bearer token must authenticate");
  assert.strictEqual(authRes1.user.id, session1.guestId, "Authenticated ID must match guest ID");
  assert.strictEqual(authRes1.user.isGuest, true, "User must be marked isGuest: true");
  console.log("  ✓ Server authenticates Bearer guest token for Blender add-on compatibility");

  // 4. Test Server Auth with x-guest-token Header
  const reqWithGuestHeader = {
    headers: new Headers({
      "x-guest-token": session1.token,
    }),
  };
  const authRes2 = await getAuthenticatedUser(reqWithGuestHeader);
  assert.ok(authRes2.user, "Guest with x-guest-token header must authenticate");
  assert.strictEqual(authRes2.user.id, session1.guestId);
  console.log("  ✓ Server authenticates x-guest-token header");

  // 5. Test Server Auth with Guest Session Cookie
  const reqWithCookie = {
    headers: new Headers({
      cookie: `sculptor_guest_token=${session1.token}`,
    }),
  };
  const authRes3 = await getAuthenticatedUser(reqWithCookie);
  assert.ok(authRes3.user, "Guest with cookie must authenticate");
  assert.strictEqual(authRes3.user.id, session1.guestId);
  console.log("  ✓ Server authenticates sculptor_guest_token cookie");

  // 6. Test Public Access for Visitors Without Credentials
  const cleanReq = {
    headers: new Headers(),
  };
  const authResClean = await getAuthenticatedUser(cleanReq);
  assert.ok(authResClean.user, "Unauthenticated public visitor must receive valid guest session");
  assert.ok(authResClean.guestToken, "Server must mint guestToken for visitor");
  assert.strictEqual(authResClean.user.isGuest, true);
  console.log("  ✓ Public visitors without credentials seamlessly receive a secure guest identity");

  // 7. Test Cross-Guest Project Isolation (Tenant Isolation)
  const session2 = createGuestSession();
  assert.notStrictEqual(session1.guestId, session2.guestId, "Different guests must have distinct IDs");

  const projectA = await db.createProject({
    userId: session1.guestId,
    name: "Guest A Sci-Fi Drone",
    description: "Private drone concept",
    blenderVersion: "4.x",
  });
  assert.ok(projectA.id, "Guest A project created");

  // Guest A can retrieve own project
  const fetchedByA = await db.getProjectById(projectA.id, session1.guestId);
  assert.ok(fetchedByA, "Guest A must be able to retrieve own project");
  assert.strictEqual(fetchedByA.name, "Guest A Sci-Fi Drone");

  // Guest B CANNOT retrieve Guest A's project
  const fetchedByB = await db.getProjectById(projectA.id, session2.guestId);
  assert.strictEqual(fetchedByB, null, "Guest B must NOT be able to retrieve Guest A's project");
  console.log("  ✓ Cross-guest access denied: Guest B cannot view Guest A's private project");

  // Guest B CANNOT update Guest A's project
  const updatedByB = await db.updateProject(projectA.id, session2.guestId, { name: "Hacked by B" });
  assert.strictEqual(updatedByB, null, "Guest B must NOT be able to update Guest A's project");

  // Guest B CANNOT delete Guest A's project
  const deletedByB = await db.deleteProject(projectA.id, session2.guestId);
  assert.strictEqual(deletedByB, false, "Guest B must NOT be able to delete Guest A's project");

  // Verify project remains unchanged
  const stillExists = await db.getProjectById(projectA.id, session1.guestId);
  assert.strictEqual(stillExists?.name, "Guest A Sci-Fi Drone", "Project name must remain untampered");
  console.log("  ✓ Cross-guest mutation denied: Guest B cannot update or delete Guest A's project");

  // 8. Test Execution Task Isolation
  const taskA = await db.createExecution({
    generationId: "gen_guest_a",
    projectId: projectA.id,
    userId: session1.guestId,
    blenderVersion: "4.x",
    script: "import bpy",
    prompt: "Generate drone frame",
  });
  assert.strictEqual(taskA.status, "pending");

  // Guest B cannot claim Guest A's task
  const claimByB = await db.claimExecutionById(taskA.id, session2.guestId, "4.x");
  assert.strictEqual(claimByB, null, "Guest B must not be able to claim Guest A's execution task");

  // Guest A claims own task
  const claimByA = await db.claimExecutionById(taskA.id, session1.guestId, "4.x");
  assert.ok(claimByA, "Guest A claims own task");
  assert.strictEqual(claimByA.status, "claimed");
  console.log("  ✓ Execution task isolated: only matching guest/device can claim the task");

  // Clean up
  await db.deleteProject(projectA.id, session1.guestId);
  console.log("  ✓ Cleaned up test guest projects\n");
}

if (process.argv[1]?.endsWith("guest_auth_and_isolation.test.mjs")) {
  testGuestAuthAndIsolation()
    .then(() => {
      console.log("All Guest Auth & Isolation tests passed!");
    })
    .catch((err) => {
      console.error("Test failed:", err);
      process.exit(1);
    });
}
