"use client";

import React from "react";
import { ArrowLeftRight, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface DiffViewerProps {
  originalCode: string;
  modifiedCode: string;
  originalLabel?: string;
  modifiedLabel?: string;
  onApplyModified?: () => void;
}

export function DiffViewer({
  originalCode,
  modifiedCode,
  originalLabel = "Previous Version",
  modifiedLabel = "New Version",
  onApplyModified,
}: DiffViewerProps) {
  const originalLines = originalCode.split("\n");
  const modifiedLines = modifiedCode.split("\n");

  return (
    <div className="flex flex-col h-full bg-[#0D0F17] rounded-xl border border-[#23293A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#121520] border-b border-[#212638]">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-[#00E5FF]" />
          <span className="text-xs font-semibold text-white">Version Diff Comparison</span>
        </div>

        {onApplyModified && (
          <Button
            size="sm"
            variant="primary"
            onClick={onApplyModified}
            className="text-xs font-semibold px-3"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply This Version</span>
          </Button>
        )}
      </div>

      {/* Side-by-side panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#212638] flex-1 overflow-y-auto font-mono text-[11px]">
        {/* Left: Original */}
        <div className="p-3 bg-[#0A0C13]/70">
          <div className="text-[10px] uppercase font-bold text-[#717E98] tracking-wider mb-2">
            {originalLabel}
          </div>
          <div className="space-y-0.5">
            {originalLines.map((line, idx) => (
              <div key={idx} className="flex gap-2 text-[#8894AB]">
                <span className="w-6 text-right select-none text-[#434B5E]">{idx + 1}</span>
                <span className="whitespace-pre-wrap">{line || " "}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Modified */}
        <div className="p-3 bg-[#0B0E16]">
          <div className="text-[10px] uppercase font-bold text-[#10B981] tracking-wider mb-2">
            {modifiedLabel}
          </div>
          <div className="space-y-0.5">
            {modifiedLines.map((line, idx) => {
              const isDiff = line !== originalLines[idx];
              return (
                <div
                  key={idx}
                  className={`flex gap-2 ${
                    isDiff ? "bg-emerald-950/20 text-[#86EFAC]" : "text-[#CAD2E3]"
                  }`}
                >
                  <span className="w-6 text-right select-none text-[#434B5E]">{idx + 1}</span>
                  <span className="whitespace-pre-wrap">{line || " "}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
