"use client";

import React from "react";
import { CheckCircle2, XCircle, Clock, Wrench, Terminal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDuration } from "@/lib/utils/cn";

export interface ExecutionPanelProps {
  status: "idle" | "pending" | "running" | "success" | "error";
  stdout?: string | null;
  stderr?: string | null;
  durationMs?: number | null;
  onFixWithAI?: () => void;
  isFixing?: boolean;
}

export function ExecutionPanel({
  status,
  stdout,
  stderr,
  durationMs,
  onFixWithAI,
  isFixing = false,
}: ExecutionPanelProps) {
  if (status === "idle") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#556077] bg-[#0C0E15] rounded-xl border border-[#212638]">
        <Terminal className="w-10 h-10 stroke-[1.2] mb-2 text-[#3D4559]" />
        <p className="text-sm font-medium text-[#7D8AA5]">No execution recorded yet.</p>
        <p className="text-xs text-[#556077] mt-1">
          Review the generated code in the Code tab and click &quot;Approve &amp; Run&quot; or execute in the Blender add-on.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0D0F17] rounded-xl border border-[#23293A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#131622] border-b border-[#212638]">
        <div className="flex items-center gap-2">
          {status === "success" && (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">
                Blender Execution Succeeded
              </span>
              <Badge variant="emerald">200 OK</Badge>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-semibold text-white">
                Blender Execution Failed
              </span>
              <Badge variant="rose">Exception</Badge>
            </>
          )}
          {(status === "pending" || status === "running") && (
            <>
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="text-xs font-semibold text-white">
                Executing in Blender...
              </span>
              <Badge variant="amber">Running</Badge>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {durationMs != null && (
            <span className="text-xs font-mono text-[#8C98B2]">
              Time: {formatDuration(durationMs)}
            </span>
          )}

          {status === "error" && onFixWithAI && (
            <Button
              size="sm"
              variant="cyan"
              onClick={onFixWithAI}
              isLoading={isFixing}
              className="text-xs font-semibold shadow-glow-cyan"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Fix with AI</span>
            </Button>
          )}
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 p-4 bg-[#090B10] font-mono text-xs overflow-y-auto space-y-4">
        {stdout && (
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#66728C] tracking-wider mb-1">
              stdout:
            </div>
            <pre className="p-3 rounded-lg bg-[#11141F] text-[#86EFAC] border border-[#1E2436] whitespace-pre-wrap">
              {stdout}
            </pre>
          </div>
        )}

        {stderr && (
          <div>
            <div className="text-[10px] uppercase font-semibold text-rose-400 tracking-wider mb-1">
              stderr / traceback:
            </div>
            <pre className="p-3 rounded-lg bg-rose-950/20 text-rose-300 border border-rose-900/40 whitespace-pre-wrap">
              {stderr}
            </pre>
          </div>
        )}

        {!stdout && !stderr && (
          <div className="text-[#556077] italic">No console logs returned.</div>
        )}
      </div>
    </div>
  );
}
