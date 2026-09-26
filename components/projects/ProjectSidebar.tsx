"use client";

import React from "react";
import Link from "next/link";
import {
  Box,
  MessageSquare,
  History,
  FolderKanban,
  Settings,
  ArrowLeft,
  Plus,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export interface ProjectSidebarProps {
  projectId: string;
  projectName: string;
  blenderVersion: string;
  activeView: "chat" | "history" | "assets" | "settings";
  onSelectView: (view: "chat" | "history" | "assets" | "settings") => void;
  generationsCount?: number;
}

export function ProjectSidebar({
  projectName,
  blenderVersion,
  activeView,
  onSelectView,
  generationsCount = 0,
}: ProjectSidebarProps) {
  return (
    <aside className="w-64 bg-[#0A0C13] border-r border-[#1C212E] flex flex-col h-full select-none">
      {/* Top Project Header */}
      <div className="p-4 border-b border-[#1C212E]">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-[#7A86A1] hover:text-white mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#F5792A]/20 text-[#F5792A] flex items-center justify-center">
            <Box className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-semibold text-white truncate">
              {projectName}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-[#7A86A1] font-mono">
                Blender {blenderVersion}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 p-3 space-y-1 overflow-y-auto">
        <button
          onClick={() => onSelectView("chat")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeView === "chat"
              ? "bg-[#181D2B] text-white border border-[#262E44]"
              : "text-[#8C98B2] hover:bg-[#121520] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-[#F5792A]" />
            <span>AI Copilot Studio</span>
          </div>
        </button>

        <button
          onClick={() => onSelectView("history")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeView === "history"
              ? "bg-[#181D2B] text-white border border-[#262E44]"
              : "text-[#8C98B2] hover:bg-[#121520] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-[#00E5FF]" />
            <span>Generation History</span>
          </div>
          <Badge variant="default" className="text-[10px]">
            {generationsCount}
          </Badge>
        </button>

        <button
          onClick={() => onSelectView("assets")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeView === "assets"
              ? "bg-[#181D2B] text-white border border-[#262E44]"
              : "text-[#8C98B2] hover:bg-[#121520] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <FolderKanban className="w-4 h-4 text-emerald-400" />
            <span>Scene Assets</span>
          </div>
        </button>

        <button
          onClick={() => onSelectView("settings")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeView === "settings"
              ? "bg-[#181D2B] text-white border border-[#262E44]"
              : "text-[#8C98B2] hover:bg-[#121520] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-[#A2ACBF]" />
            <span>Project Settings</span>
          </div>
        </button>

        {/* Quick Conversational History */}
        <div className="pt-4 mt-4 border-t border-[#191D2A]">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-semibold text-[#5E6A82] uppercase tracking-wider">
              Conversations
            </span>
            <button className="text-[#7A86A1] hover:text-white p-0.5 rounded">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="px-2.5 py-1.5 rounded-md bg-[#131622] text-[#CCD2E3] text-[11px] truncate flex items-center gap-2 border border-[#1E2333]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
              <span className="truncate">Main Scene Modeling</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-md text-[#7A86A1] hover:text-white hover:bg-[#11141F] text-[11px] truncate flex items-center gap-2 transition-colors cursor-pointer">
              <span className="w-1.5 h-1.5 rounded-full bg-[#353D52]" />
              <span className="truncate">Materials & Shading</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add-on Connection Status Widget */}
      <div className="p-3 bg-[#0D0F17] border-t border-[#1C212E]">
        <div className="p-2.5 rounded-lg bg-[#141824] border border-[#212738]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#F5792A] animate-pulse" />
              Blender Add-on
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Ready</span>
          </div>
          <p className="text-[10px] text-[#7A86A1] mt-1 leading-tight">
            Sidebar: 3D View &gt; SculptorAI
          </p>
        </div>
      </div>
    </aside>
  );
}
