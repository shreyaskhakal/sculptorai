import assert from "node:assert/strict";

console.log("-------------------------------------------------");
console.log("  TEST SUITE: Multi-User Project RBAC Matrix     ");
console.log("-------------------------------------------------");

const PERMISSION_MATRIX = {
  owner: {
    view_project: true,
    view_scene: true,
    use_ai: true,
    generate_code: true,
    edit_code: true,
    execute_task: true,
    approve_task: true,
    comment: true,
    invite_members: true,
    change_roles: true,
    remove_members: true,
    delete_project: true,
  },
  editor: {
    view_project: true,
    view_scene: true,
    use_ai: true,
    generate_code: true,
    edit_code: true,
    execute_task: true,
    approve_task: true,
    comment: true,
    invite_members: false,
    change_roles: false,
    remove_members: false,
    delete_project: false,
  },
  commenter: {
    view_project: true,
    view_scene: true,
    use_ai: true,
    generate_code: false,
    edit_code: false,
    execute_task: false,
    approve_task: false,
    comment: true,
    invite_members: false,
    change_roles: false,
    remove_members: false,
    delete_project: false,
  },
  viewer: {
    view_project: true,
    view_scene: true,
    use_ai: false,
    generate_code: false,
    edit_code: false,
    execute_task: false,
    approve_task: false,
    comment: false,
    invite_members: false,
    change_roles: false,
    remove_members: false,
    delete_project: false,
  },
};

export function hasPermission(role, action) {
  return Boolean(PERMISSION_MATRIX[role]?.[action]);
}

export function validateActionOrThrow(role, action) {
  if (!hasPermission(role, action)) {
    throw new Error(`Permission denied: Role '${role}' is not authorized to perform action '${action}'.`);
  }
}

export async function testRBACMatrix() {
  // 1. Test Owner Permissions
  assert.equal(hasPermission("owner", "delete_project"), true);
  assert.equal(hasPermission("owner", "invite_members"), true);
  assert.equal(hasPermission("owner", "execute_task"), true);
  console.log("  ✓ Owner has full administrative, editing, and execution rights");

  // 2. Test Editor Permissions
  assert.equal(hasPermission("editor", "generate_code"), true);
  assert.equal(hasPermission("editor", "execute_task"), true);
  assert.equal(hasPermission("editor", "invite_members"), false);
  assert.equal(hasPermission("editor", "delete_project"), false);
  assert.throws(() => validateActionOrThrow("editor", "delete_project"), /Permission denied/);
  console.log("  ✓ Editor can edit and execute, but CANNOT manage members or delete project");

  // 3. Test Commenter Permissions
  assert.equal(hasPermission("commenter", "view_project"), true);
  assert.equal(hasPermission("commenter", "comment"), true);
  assert.equal(hasPermission("commenter", "edit_code"), false);
  assert.equal(hasPermission("commenter", "execute_task"), false);
  assert.throws(() => validateActionOrThrow("commenter", "execute_task"), /Permission denied/);
  console.log("  ✓ Commenter can comment, but CANNOT edit code or dispatch executions");

  // 4. Test Viewer Permissions
  assert.equal(hasPermission("viewer", "view_project"), true);
  assert.equal(hasPermission("viewer", "view_scene"), true);
  assert.equal(hasPermission("viewer", "use_ai"), false);
  assert.equal(hasPermission("viewer", "generate_code"), false);
  assert.equal(hasPermission("viewer", "execute_task"), false);
  assert.equal(hasPermission("viewer", "comment"), false);
  assert.throws(() => validateActionOrThrow("viewer", "use_ai"), /Permission denied/);
  assert.throws(() => validateActionOrThrow("viewer", "execute_task"), /Permission denied/);
  console.log("  ✓ Viewer has read-only access (cannot use AI, edit, or execute)");

  // 5. Test Non-Member (undefined role)
  assert.equal(hasPermission("guest", "view_project"), false);
  assert.throws(() => validateActionOrThrow("guest", "view_project"), /Permission denied/);
  console.log("  ✓ Non-member / guest is completely blocked from all actions");

  console.log("  ✓ RBAC Permission Matrix tests PASSED!\n");
}

if (process.argv[1]?.endsWith("rbac.test.mjs")) {
  testRBACMatrix();
}
