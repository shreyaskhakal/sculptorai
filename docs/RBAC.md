# SculptorAI — Role-Based Access Control (RBAC)

## Authoritative Permission Matrix

SculptorAI enforces strict server-side authorization and Row Level Security (RLS) policies. Role checks are NEVER trusted from the frontend alone.

| Capability | Owner | Editor | Commenter | Viewer |
| :--- | :---: | :---: | :---: | :---: |
| **View Project & Files** | YES | YES | YES | YES |
| **View 3D Scene Viewport** | YES | YES | YES | YES |
| **Use AI Assistant** | YES | YES | YES | NO |
| **Generate Code** | YES | YES | NO | NO |
| **Edit Code in Workspace** | YES | YES | NO | NO |
| **Execute Tasks in Blender**| YES | YES | NO | NO |
| **Approve Execution Tasks** | YES | YES | NO | NO |
| **Comment on Workspace** | YES | YES | YES | NO |
| **Invite Team Members** | YES | NO | NO | NO |
| **Change Member Roles** | YES | NO | NO | NO |
| **Remove Team Members** | YES | NO | NO | NO |
| **Delete Project** | YES | NO | NO | NO |

---

## Enforcement Layers

1. **Database Row Level Security (PostgreSQL)**:
   - Queries to `projects`, `executions`, `project_members`, and `generation_versions` join `project_members` to verify the authenticated user's assigned role.
2. **Server-Side API Guard**:
   - `lib/security/rbac.ts` evaluates `validateActionOrThrow(role, action)`. Unauthorized operations immediately return HTTP 403 Forbidden.
3. **UI Adaptation**:
   - Buttons for execution, member invitation, or deletion are disabled or hidden for unauthorized roles with clear explanatory tooltips.
