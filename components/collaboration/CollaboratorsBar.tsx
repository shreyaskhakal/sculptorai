"use client";

import React, { useState } from "react";
import { Users, UserPlus } from "lucide-react";
import { CollaboratorPresence } from "@/types/realtime";
import { ProjectMembersModal } from "./ProjectMembersModal";

interface CollaboratorsBarProps {
  projectId: string;
  collaborators: CollaboratorPresence[];
  remoteSelection?: string | null;
  remoteSelectorName?: string | null;
  isOwner?: boolean;
}

export function CollaboratorsBar({
  projectId,
  collaborators,
  remoteSelection,
  remoteSelectorName,
  isOwner = true,
}: CollaboratorsBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Remote selection badge */}
        {remoteSelection && remoteSelectorName && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-300 animate-pulse">
            <span className="font-semibold">{remoteSelectorName}</span>
            <span className="text-cyan-400/70">selected:</span>
            <span className="font-mono bg-cyan-900/60 px-1 py-0.5 rounded text-white">
              {remoteSelection}
            </span>
          </div>
        )}

        {/* Stacked collaborator presence avatars */}
        <div
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111420] border border-[#212739] hover:border-[#F5792A]/50 cursor-pointer transition-colors"
          title="Click to manage collaborators"
        >
          <div className="flex -space-x-1.5 overflow-hidden">
            {collaborators.slice(0, 3).map((c, idx) => (
              <div
                key={c.userId || idx}
                className="inline-block h-5 w-5 rounded-full ring-2 ring-[#0A0C13] bg-gradient-to-tr from-amber-600 to-orange-500 text-white text-[9px] font-bold flex items-center justify-center"
                title={`${c.displayName} (${c.role})`}
              >
                {c.displayName?.charAt(0).toUpperCase() || "U"}
              </div>
            ))}
            {collaborators.length === 0 && (
              <div className="h-5 w-5 rounded-full ring-2 ring-[#0A0C13] bg-zinc-700 text-white text-[9px] font-bold flex items-center justify-center">
                1
              </div>
            )}
          </div>

          <span className="text-[11px] text-[#A2ACBF] font-medium hidden sm:inline">
            {collaborators.length > 0 ? `${collaborators.length} Online` : "Collab"}
          </span>

          <UserPlus className="w-3.5 h-3.5 text-[#6E7B95] ml-0.5" />
        </div>
      </div>

      <ProjectMembersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        isOwner={isOwner}
      />
    </>
  );
}
