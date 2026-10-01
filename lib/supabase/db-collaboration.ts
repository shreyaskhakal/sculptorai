/**
 * SCULPTOR AI — Project Collaboration & RBAC Database Client
 * Manages project memberships, role assignments, and permissions with in-memory fallback.
 */

import { createAdminClient } from "./admin";
import { ProjectRole, hasPermission } from "../security/rbac";

export interface DBProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  invitedBy?: string | null;
  userEmail: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder") &&
    process.env.DEMO_MODE !== "true"
  );
}

class CollaborationStore {
  private members: DBProjectMember[] = [
    {
      id: "mem_owner_default",
      projectId: "proj_cyberpunk_desk",
      userId: "usr_demo_artist",
      role: "owner",
      userEmail: "artist@sculptor.ai",
      displayName: "Lead 3D Artist",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "mem_collab_1",
      projectId: "proj_cyberpunk_desk",
      userId: "usr_collab_editor",
      role: "editor",
      userEmail: "shreyas@sculptor.ai",
      displayName: "Shreyas (Editor)",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "mem_collab_2",
      projectId: "proj_cyberpunk_desk",
      userId: "usr_collab_viewer",
      role: "viewer",
      userEmail: "client@studio.com",
      displayName: "Client Reviewer (Viewer)",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  async getProjectMembers(projectId: string): Promise<DBProjectMember[]> {
    return this.members.filter((m) => m.projectId === projectId);
  }

  async getUserRole(projectId: string, userId: string): Promise<ProjectRole | null> {
    const member = this.members.find(
      (m) => m.projectId === projectId && m.userId === userId
    );
    return member ? member.role : null;
  }

  async addMember(data: {
    projectId: string;
    userId: string;
    role: ProjectRole;
    userEmail: string;
    displayName?: string;
    invitedBy?: string;
  }): Promise<DBProjectMember> {
    const existing = this.members.find(
      (m) => m.projectId === data.projectId && (m.userId === data.userId || m.userEmail === data.userEmail)
    );
    if (existing) {
      existing.role = data.role;
      existing.updatedAt = new Date().toISOString();
      return existing;
    }

    const newMember: DBProjectMember = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      projectId: data.projectId,
      userId: data.userId,
      role: data.role,
      userEmail: data.userEmail,
      displayName: data.displayName || data.userEmail.split("@")[0],
      invitedBy: data.invitedBy || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.members.push(newMember);
    return newMember;
  }

  async updateRole(
    projectId: string,
    memberId: string,
    role: ProjectRole,
    requesterId: string
  ): Promise<DBProjectMember | null> {
    const requesterRole = await this.getUserRole(projectId, requesterId);
    if (!requesterRole || !hasPermission(requesterRole, "change_roles")) {
      throw new Error("Unauthorized: Only project owners can modify member roles.");
    }

    const member = this.members.find(
      (m) => m.id === memberId && m.projectId === projectId
    );
    if (!member) return null;

    member.role = role;
    member.updatedAt = new Date().toISOString();
    return member;
  }

  async removeMember(
    projectId: string,
    memberId: string,
    requesterId: string
  ): Promise<boolean> {
    const requesterRole = await this.getUserRole(projectId, requesterId);
    if (!requesterRole || !hasPermission(requesterRole, "remove_members")) {
      throw new Error("Unauthorized: Only project owners can remove members.");
    }

    const idx = this.members.findIndex(
      (m) => m.id === memberId && m.projectId === projectId
    );
    if (idx === -1) return false;

    this.members.splice(idx, 1);
    return true;
  }
}

const fallbackStore = new CollaborationStore();

export const dbCollaboration = {
  async getProjectMembers(projectId: string): Promise<DBProjectMember[]> {
    if (!isSupabaseConfigured()) return fallbackStore.getProjectMembers(projectId);

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", projectId);

      if (error || !data) return fallbackStore.getProjectMembers(projectId);

      return data.map((m: any) => ({
        id: m.id,
        projectId: m.project_id,
        userId: m.user_id,
        role: m.role as ProjectRole,
        invitedBy: m.invited_by,
        userEmail: m.user_email || `user_${m.user_id.slice(0, 8)}@sculptor.ai`,
        displayName: m.display_name || "Collaborator",
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      }));
    } catch {
      return fallbackStore.getProjectMembers(projectId);
    }
  },

  async getUserRole(projectId: string, userId: string): Promise<ProjectRole | null> {
    if (!isSupabaseConfigured()) return fallbackStore.getUserRole(projectId, userId);

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data) return fallbackStore.getUserRole(projectId, userId);
      return data.role as ProjectRole;
    } catch {
      return fallbackStore.getUserRole(projectId, userId);
    }
  },

  async addMember(data: {
    projectId: string;
    userId: string;
    role: ProjectRole;
    userEmail: string;
    displayName?: string;
    invitedBy?: string;
  }): Promise<DBProjectMember> {
    if (!isSupabaseConfigured()) return fallbackStore.addMember(data);

    try {
      const supabase = createAdminClient();
      const { data: created, error } = await supabase
        .from("project_members")
        .upsert(
          {
            project_id: data.projectId,
            user_id: data.userId,
            role: data.role,
            invited_by: data.invitedBy || null,
          },
          { onConflict: "project_id,user_id" }
        )
        .select()
        .single();

      if (error || !created) return fallbackStore.addMember(data);

      return {
        id: created.id,
        projectId: created.project_id,
        userId: created.user_id,
        role: created.role as ProjectRole,
        invitedBy: created.invited_by,
        userEmail: data.userEmail,
        displayName: data.displayName || data.userEmail.split("@")[0],
        createdAt: created.created_at,
        updatedAt: created.updated_at,
      };
    } catch {
      return fallbackStore.addMember(data);
    }
  },

  async updateRole(
    projectId: string,
    memberId: string,
    role: ProjectRole,
    requesterId: string
  ): Promise<DBProjectMember | null> {
    if (!isSupabaseConfigured()) {
      return fallbackStore.updateRole(projectId, memberId, role, requesterId);
    }

    try {
      const supabase = createAdminClient();
      const { data: updated, error } = await supabase
        .from("project_members")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", memberId)
        .eq("project_id", projectId)
        .select()
        .single();

      if (error || !updated) {
        return fallbackStore.updateRole(projectId, memberId, role, requesterId);
      }

      return {
        id: updated.id,
        projectId: updated.project_id,
        userId: updated.user_id,
        role: updated.role as ProjectRole,
        invitedBy: updated.invited_by,
        userEmail: updated.user_email || `user_${updated.user_id.slice(0, 8)}@sculptor.ai`,
        displayName: updated.display_name || "Collaborator",
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      };
    } catch {
      return fallbackStore.updateRole(projectId, memberId, role, requesterId);
    }
  },

  async removeMember(
    projectId: string,
    memberId: string,
    requesterId: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return fallbackStore.removeMember(projectId, memberId, requesterId);
    }

    try {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("id", memberId)
        .eq("project_id", projectId);

      if (error) return fallbackStore.removeMember(projectId, memberId, requesterId);
      return true;
    } catch {
      return fallbackStore.removeMember(projectId, memberId, requesterId);
    }
  },
};
