import React from "react";
import { ShieldCheck, ShieldAlert, Check, X, AlertTriangle } from "lucide-react";
import { ValidationResult } from "@/lib/blender/validator";

interface SafetyScoreCardProps {
  validation?: ValidationResult | null;
  code?: string;
}

export function SafetyScoreCard({ validation, code }: SafetyScoreCardProps) {
  const isClean = validation ? validation.isValid : true;
  const errors = validation?.errors || [];
  const warnings = validation?.warnings || [];

  const checks = [
    { label: "No subprocess / OS command execution", passed: !errors.some((e) => e.includes("subprocess") || e.includes("execution")) },
    { label: "No network requests or socket exfiltration", passed: !errors.some((e) => e.includes("network")) },
    { label: "No unauthorized filesystem operations", passed: !errors.some((e) => e.includes("filesystem")) },
    { label: "No dynamic code evaluation (eval / exec)", passed: !errors.some((e) => e.includes("dynamic_code")) },
    { label: "Authorized Blender APIs & mathutils only", passed: isClean },
  ];

  return (
    <div className={`p-3.5 rounded-xl border backdrop-blur-md transition-all ${
      isClean
        ? "bg-[#0F141F]/80 border-emerald-500/20 shadow-sm"
        : "bg-rose-950/20 border-rose-500/30 shadow-glow-rose"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#1C2333]">
        <div className="flex items-center gap-2">
          {isClean ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          )}
          <span className="text-xs font-bold tracking-wider uppercase text-[#8E9BB5]">
            SculptorAI Security Boundary
          </span>
        </div>

        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
          isClean
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
            : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
        }`}>
          {isClean ? "LOW RISK — SAFE TO RUN" : "BLOCKED — SECURITY VIOLATION"}
        </span>
      </div>

      {/* Safety Capabilities Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-[#9DA9C4]">
            {c.passed ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
            <span className={c.passed ? "" : "text-rose-300 font-semibold"}>
              {c.label}
            </span>
          </div>
        ))}
      </div>

      {/* Security Violations Display */}
      {errors.length > 0 && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-900/20 border border-rose-800/40 text-xs text-rose-300">
          <div className="flex items-center gap-1.5 font-bold mb-1 text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Violations Detected:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
