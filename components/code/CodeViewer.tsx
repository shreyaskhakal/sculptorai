"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Copy,
  Check,
  Download,
  RotateCw,
  Send,
  ShieldCheck,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

// Dynamically import Monaco Editor to avoid SSR window issues
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0C0E14] text-[#717C96] text-xs font-mono">
      Initializing Python Editor...
    </div>
  ),
});

export interface CodeViewerProps {
  code: string;
  onCodeChange?: (newCode: string) => void;
  onRegenerate?: () => void;
  onSendToBlender?: () => void;
  onApproveAndRun?: () => void;
  isExecuting?: boolean;
  readOnly?: boolean;
}

export function CodeViewer({
  code,
  onCodeChange,
  onRegenerate,
  onSendToBlender,
  onApproveAndRun,
  isExecuting = false,
  readOnly = false,
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!code) return;
    const blob = new Blob([code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sculptor_model_${Date.now()}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lineCount = code ? code.split("\n").length : 0;

  return (
    <div className="flex flex-col h-full bg-[#0D0F17] rounded-xl border border-[#23293A] overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#121520] border-b border-[#212638]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#A2ACBF] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F5792A]" />
            blender_script.py
          </span>
          <Badge variant="default" className="text-[10px] font-mono">
            {lineCount} lines
          </Badge>
          <div className="flex items-center gap-1 text-[11px] text-[#10B981]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Validated bpy</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="text-xs text-[#A2ACBF]"
            title="Copy script to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="text-xs text-[#A2ACBF]"
            title="Download .py file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </Button>

          {onRegenerate && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRegenerate}
              className="text-xs"
              title="Regenerate code"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </Button>
          )}

          {onSendToBlender && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onSendToBlender}
              className="text-xs text-[#00E5FF] border-[#00E5FF]/30 hover:border-[#00E5FF]"
              title="Send script to Blender add-on"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to Blender</span>
            </Button>
          )}

          {onApproveAndRun && (
            <Button
              size="sm"
              variant="primary"
              onClick={onApproveAndRun}
              isLoading={isExecuting}
              className="text-xs font-semibold px-3.5 shadow-glow-orange"
              title="Approve and execute script in Blender"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Approve & Run</span>
            </Button>
          )}
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 min-h-[350px]">
        {code ? (
          <Editor
            height="100%"
            language="python"
            theme="vs-dark"
            value={code}
            onChange={(val) => onCodeChange && onCodeChange(val || "")}
            options={{
              readOnly,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "JetBrains Mono, Menlo, monospace",
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: "on",
              padding: { top: 12, bottom: 12 },
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 text-[#58627A]">
            <p className="text-sm font-medium">No Blender Python code generated yet.</p>
            <p className="text-xs mt-1">
              Enter a prompt in the chat or upload a reference image to create your scene.
            </p>
          </div>
        )}
      </div>

      {/* Footer Banner */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0A0C12] border-t border-[#1C212E] text-[11px] text-[#69748D]">
        <span>Target: Blender 3.6 / 4.x (bpy)</span>
        <span className="text-[#A2ACBF]">
          Safety Notice: Code is executed only after your explicit approval.
        </span>
      </div>
    </div>
  );
}
