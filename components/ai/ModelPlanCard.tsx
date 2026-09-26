"use client";

import React, { useState } from "react";
import { ModelPlan } from "@/types/ai";
import { Badge } from "@/components/ui/Badge";
import {
  Layers,
  ListOrdered,
  Palette,
  Sun,
  Camera,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Box,
} from "lucide-react";

export interface ModelPlanCardProps {
  plan: ModelPlan;
}

export function ModelPlanCard({ plan }: ModelPlanCardProps) {
  const [activeTab, setActiveTab] = useState<"objects" | "steps" | "materials" | "lighting">("objects");
  const [showWarnings, setShowWarnings] = useState(true);

  return (
    <div className="bg-[#10131C] border border-[#212738] rounded-xl overflow-hidden shadow-lg">
      {/* Plan Header */}
      <div className="p-4 bg-[#141824] border-b border-[#212738]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] shadow-glow-cyan" />
            <h4 className="text-sm font-semibold text-white tracking-wide">
              Blender Modeling Plan
            </h4>
          </div>
          <Badge variant="cyan" className="font-mono text-[10px]">
            {plan.intent.toUpperCase()}
          </Badge>
        </div>
        <p className="text-xs text-[#A2ACBF] mt-1.5 leading-relaxed">
          {plan.summary}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-[#1C212E] bg-[#0C0E15] px-2">
        <button
          onClick={() => setActiveTab("objects")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "objects"
              ? "border-[#F5792A] text-white"
              : "border-transparent text-[#7A859E] hover:text-[#CCD2E3]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Objects ({plan.objects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("steps")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "steps"
              ? "border-[#F5792A] text-white"
              : "border-transparent text-[#7A859E] hover:text-[#CCD2E3]"
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Steps ({plan.steps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("materials")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "materials"
              ? "border-[#F5792A] text-white"
              : "border-transparent text-[#7A859E] hover:text-[#CCD2E3]"
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Materials ({plan.materials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("lighting")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "lighting"
              ? "border-[#F5792A] text-white"
              : "border-transparent text-[#7A859E] hover:text-[#CCD2E3]"
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Lighting & Camera</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 max-h-[280px] overflow-y-auto">
        {activeTab === "objects" && (
          <div className="space-y-2.5">
            {plan.objects.map((obj, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-[#141723] border border-[#212638] flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Box className="w-3.5 h-3.5 text-[#F5792A]" />
                    <span className="text-xs font-semibold text-white">{obj.name}</span>
                    <Badge variant="default" className="text-[10px]">
                      {obj.type}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#8C98B2] mt-1">{obj.description}</p>
                </div>
                {obj.modifiers && obj.modifiers.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-end max-w-[140px]">
                    {obj.modifiers.map((m, mi) => (
                      <span
                        key={mi}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-[#1D2232] text-[#9EAAC4] border border-[#2A3146]"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "steps" && (
          <div className="space-y-2">
            {plan.steps.map((st, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-2 rounded-lg bg-[#141723] border border-[#212638]"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#1F2536] text-[10px] font-bold text-[#F5792A]">
                  {st.stepNumber}
                </span>
                <div className="flex-1">
                  <h5 className="text-xs font-semibold text-white">{st.title}</h5>
                  <p className="text-[11px] text-[#8C98B2] mt-0.5">{st.instructions}</p>
                </div>
                <Badge variant="default" className="text-[9px]">
                  {st.operationType}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {activeTab === "materials" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {plan.materials.map((mat, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-[#141723] border border-[#212638]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{mat.name}</span>
                  {mat.baseColor && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: mat.baseColor }}
                      />
                      <span className="text-[10px] font-mono text-[#8C98B2]">
                        {mat.baseColor}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-[#7E8B9E] mt-1">
                  Assigned to: <strong className="text-[#A2ACBF]">{mat.targetObject}</strong>
                </p>
                {mat.notes && (
                  <p className="text-[10px] text-[#A2ACBF] mt-1 italic">{mat.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "lighting" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-[#7E8B9E] uppercase tracking-wider">
                Lighting Setup
              </span>
              {plan.lighting.map((light, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#141723] border border-[#212638] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-medium text-white">{light.name}</span>
                    <Badge variant="amber" className="text-[9px]">
                      {light.type}
                    </Badge>
                  </div>
                  <span className="font-mono text-[11px] text-[#8C98B2]">
                    {light.energyWatts}W
                  </span>
                </div>
              ))}
            </div>

            {plan.camera && (
              <div className="p-2.5 rounded-lg bg-[#141723] border border-[#212638]">
                <div className="flex items-center gap-2 text-xs font-medium text-white">
                  <Camera className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>Main Camera Setup</span>
                </div>
                <p className="text-[11px] text-[#8C98B2] mt-1">
                  Focal Length: {plan.camera.focalLengthMm || 50}mm | Type: {plan.camera.type || "PERSP"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warnings & Assumptions Footer */}
      {(plan.warnings.length > 0 || plan.assumptions.length > 0) && (
        <div className="px-4 py-2 bg-[#0A0C13] border-t border-[#1C212E]">
          <button
            onClick={() => setShowWarnings(!showWarnings)}
            className="flex items-center justify-between w-full text-[11px] text-[#8C98B2] hover:text-white"
          >
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Assumptions & Technical Warnings ({plan.warnings.length + plan.assumptions.length})</span>
            </span>
            {showWarnings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showWarnings && (
            <div className="mt-2 space-y-1 text-[10px] text-[#76829D]">
              {plan.assumptions.map((a, i) => (
                <p key={`a_${i}`}>• Assumption: {a}</p>
              ))}
              {plan.warnings.map((w, i) => (
                <p key={`w_${i}`} className="text-amber-400/90">• {w}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
