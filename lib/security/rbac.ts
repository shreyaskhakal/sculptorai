/**
 * SCULPTOR AI — Role-Based Access Control (RBAC) System
 * Enforces project permissions for Owner, Editor, Commenter, and Viewer roles.
 */

export type ProjectRole = "owner" | "editor" | "commenter" | "viewer";

export type ProjectAction =
  | "view_project"
  | "view_scene"
  | "use_ai"
  | "generate_code"
  | "edit_code"
  | "execute_task"
  | "approve_task"
  | "comment"
  | "invite_members"
  | "change_roles"
  | "remove_members"
  | "delete_project";

/**
 * Authoritative Server-Side Permission Matrix
 */
const PERMISSION_MATRIX: Record<ProjectRole, Record<ProjectAction, boolean>> = {
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

export function hasPermission(role: ProjectRole, action: ProjectAction): boolean {
  return Boolean(PERMISSION_MATRIX[role]?.[action]);
}

export function validateActionOrThrow(role: ProjectRole, action: ProjectAction) {
  if (!hasPermission(role, action)) {
    throw new Error(
      `Permission denied: Role '${role}' is not authorized to perform action '${action}'.`
    );
  }
}
