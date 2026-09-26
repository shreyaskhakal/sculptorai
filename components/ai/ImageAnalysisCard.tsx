"use client";

import React from "react";
import { ImageAnalysis } from "@/types/ai";
import { Badge } from "@/components/ui/Badge";
import { Scan, Eye, Layers, AlertCircle, Sparkles } from "lucide-react";

export interface ImageAnalysisCardProps {
  analysis: ImageAnalysis;
  onUseCode?: (code: string) => void;
}

export function ImageAnalysisCard({ analysis, onUseCode }: ImageAnalysisCardProps) {
  return (
    <div className="bg-[#10131D] border border-[#23293C] rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 bg-[#141825] border-b border-[#212739] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scan className="w-4 h-4 text-[#00E5FF]" />
          <h4 className="text-sm font-semibold text-white">
            Multimodal Reference Analysis
          </h4>
        </div>
        <Badge variant="cyan">Vision AI</Badge>
      </div>

      <div className="p-4 space-y-4">
        {/* Geometry & Proportions */}
        <div>
          <span className="text-[11px] font-semibold uppercase text-[#76829D] tracking-wider">
            Geometry & Proportions
          </span>
          <p className="text-xs text-[#CCD2E3] mt-1 leading-relaxed">
            {analysis.geometrySummary}
          </p>
          <p className="text-[11px] text-[#8C98B2] mt-1">
            <strong>Proportions:</strong> {analysis.proportionsObservation}
          </p>
        </div>

        {/* Identified Objects */}
        <div>
          <span className="text-[11px] font-semibold uppercase text-[#76829D] tracking-wider">
            Identified Objects ({analysis.objects.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {analysis.objects.map((obj, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-[#141723] border border-[#212638] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{obj.name}</span>
                    <Badge variant="emerald" className="text-[9px]">
                      {Math.round(obj.confidence * 100)}% match
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#8C98B2] mt-1">{obj.approxGeometry}</p>
                </div>
                <div className="mt-2 text-[10px] text-[#00E5FF] font-mono">
                  Primitive: {obj.suggestedPrimitive}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modeling Approach */}
        <div>
          <span className="text-[11px] font-semibold uppercase text-[#76829D] tracking-wider">
            Suggested Modeling Strategy
          </span>
          <div className="space-y-1.5 mt-2">
            {analysis.modelingApproach.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-[#CCD2E3] bg-[#141723] p-2 rounded-lg border border-[#212638]"
              >
                <span className="text-[#00E5FF] font-mono text-[11px] font-bold">
                  {i + 1}.
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Materials */}
        <div>
          <span className="text-[11px] font-semibold uppercase text-[#76829D] tracking-wider">
            Detected Surface Materials
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {analysis.materials.map((mat, i) => (
              <Badge key={i} variant="default" className="text-xs">
                {mat}
              </Badge>
            ))}
          </div>
        </div>

        {/* Uncertainty Warnings */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Uncertainty & Measurement Limitations</span>
          </div>
          <ul className="mt-1.5 space-y-1 text-[11px] text-amber-200/80 list-disc list-inside">
            {analysis.uncertainties.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </div>

        {/* Generated Code Available */}
        {analysis.code && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onUseCode && onUseCode(analysis.code!.content)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/30 border border-[#00E5FF]/40 text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Generated Blockout in Editor</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
