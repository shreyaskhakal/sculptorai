"use client";

import React, { useState, useEffect } from "react";
import { Users, UserPlus, Shield, Trash2, Mail, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProjectRole } from "@/lib/security/rbac";
import { DBProjectMember } from "@/lib/supabase/db-collaboration";

interface ProjectMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  isOwner?: boolean;
}

export function ProjectMembersModal({
  isOpen,
  onClose,
  projectId,
  isOwner = true,
}: ProjectMembersModalProps) {
  const [members, setMembers] = useState<DBProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ProjectRole>("editor");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const fetchMembers = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      const data = await res.json();
      if (data.members) setMembers(data.members);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projectId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setStatusMsg("");
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          displayName: inviteName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg("Invitation sent successfully!");
        setInviteEmail("");
        setInviteName("");
        fetchMembers();
      } else {
        setStatusMsg(`Failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: ProjectRole) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) fetchMembers();
    } catch {
      // Ignore
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this collaborator?")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchMembers();
    } catch {
      // Ignore
    }
  };

  const getRoleBadgeVariant = (role: ProjectRole) => {
    switch (role) {
      case "owner":
        return "orange";
      case "editor":
        return "emerald";
      case "commenter":
        return "cyan";
      case "viewer":
        return "default";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project Collaborators & RBAC"
      description="Manage role-based permissions, pair-program on Blender scenes, and invite teammates."
    >
      <div className="space-y-6">
        {/* Invite Form (Owner Only) */}
        {isOwner && (
          <form
            onSubmit={handleInvite}
            className="p-4 rounded-xl bg-[#10131F] border border-[#23293D] space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <UserPlus className="w-4 h-4 text-[#F5792A]" />
              <span>Invite New Collaborator</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="email"
                placeholder="colleague@studio.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="col-span-1 sm:col-span-2 px-3 py-1.5 rounded-lg bg-[#161B29] border border-[#273047] text-white text-xs focus:outline-none focus:border-[#F5792A]"
                required
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
                className="px-2 py-1.5 rounded-lg bg-[#161B29] border border-[#273047] text-white text-xs focus:outline-none focus:border-[#F5792A]"
              >
                <option value="editor">Editor (Can Model & Run)</option>
                <option value="commenter">Commenter (Chat & Suggest)</option>
                <option value="viewer">Viewer (Read Only)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-emerald-400">{statusMsg}</span>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={inviting}
                className="text-xs px-3 shadow-glow-orange"
              >
                <span>Send Invite</span>
              </Button>
            </div>
          </form>
        )}

        {/* Members Roster */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A86A1]">
              Active Members ({members.length})
            </h4>
            <span className="text-[10px] text-[#556077]">
              Permission Matrix: Owner &gt; Editor &gt; Commenter &gt; Viewer
            </span>
          </div>

          <div className="divide-y divide-[#1D2232] rounded-xl bg-[#0E111A] border border-[#202638] overflow-hidden">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-3.5 flex items-center justify-between hover:bg-[#131622] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#20273A] to-[#2B3550] border border-[#3A4668] flex items-center justify-center font-bold text-xs text-white">
                    {member.displayName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        {member.displayName}
                      </span>
                      <Badge variant={getRoleBadgeVariant(member.role)} className="text-[9px] uppercase">
                        {member.role}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-[#69758F]">
                      {member.userEmail}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isOwner && member.role !== "owner" && (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as ProjectRole)}
                        className="px-2 py-1 rounded bg-[#161B29] border border-[#262E44] text-[11px] text-white focus:outline-none"
                      >
                        <option value="editor">Editor</option>
                        <option value="commenter">Commenter</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleRemove(member.id)}
                        className="p-1 rounded text-[#6E7B95] hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-[#1C212E]">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
