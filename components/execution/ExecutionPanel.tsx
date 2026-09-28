"use client";

import React from "react";
import { CheckCircle2, XCircle, Clock, Wrench, Terminal, ShieldAlert, Cpu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDuration } from "@/lib/utils/cn";

export interface ExecutionPanelProps {
  status: "idle" | "pending" | "claimed" | "running" | "success" | "error" | "cancelled";
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
        <p className="text-sm font-medium text-[#7D8AA5]">No execution dispatched yet.</p>
        <p className="text-xs text-[#556077] mt-1 max-w-sm">
          Review the generated code in the Code tab and click &quot;Approve &amp; Run&quot; to queue the task for the Blender add-on.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0D0F17] rounded-xl border border-[#23293A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#131622] border-b border-[#212638]">
        <div className="flex items-center gap-2">
          {status === "pending" && (
            <>
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="text-xs font-semibold text-white">
                Pending in Queue
              </span>
              <Badge variant="amber">Awaiting Claim</Badge>
            </>
          )}

          {status === "claimed" && (
            <>
              <Cpu className="w-4 h-4 text-[#00E5FF] animate-pulse" />
              <span className="text-xs font-semibold text-white">
                Claimed by Blender
              </span>
              <Badge variant="cyan">Awaiting Approval in Blender</Badge>
            </>
          )}

          {status === "running" && (
            <>
              <Clock className="w-4 h-4 text-[#F5792A] animate-spin" />
              <span className="text-xs font-semibold text-white">
                Running in Blender...
              </span>
              <Badge variant="orange">Executing</Badge>
            </>
          )}

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

          {status === "cancelled" && (
            <>
              <ShieldAlert className="w-4 h-4 text-[#7A86A1]" />
              <span className="text-xs font-semibold text-white">
                Execution Cancelled
              </span>
              <Badge variant="default">Cancelled</Badge>
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
        {status === "pending" && (
          <div className="p-3 rounded-lg bg-[#141825] border border-[#232A3D] text-[#8C98B2] text-xs space-y-1">
            <p className="font-semibold text-white">Task dispatched to Blender queue.</p>
            <p>1. Open Blender and navigate to the <strong>SculptorAI</strong> tab in the 3D Viewport sidebar.</p>
            <p>2. Click <strong>&quot;Claim Web Task&quot;</strong> to load this script.</p>
            <p>3. Review the code inside Blender and click <strong>&quot;Approve &amp; Run&quot;</strong>.</p>
          </div>
        )}

        {status === "claimed" && (
          <div className="p-3 rounded-lg bg-[#0F1D2B] border border-[#00E5FF]/30 text-[#00E5FF] text-xs">
            The script was claimed by your Blender add-on and is awaiting explicit human approval in Blender before running.
          </div>
        )}

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

        {!stdout && !stderr && status !== "pending" && status !== "claimed" && (
          <div className="text-[#556077] italic">No console logs returned.</div>
        )}
      </div>
    </div>
  );
}
