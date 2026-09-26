"use client";

import React from "react";
import { User, Sparkles, AlertCircle } from "lucide-react";
import { ModelPlan, ImageAnalysis } from "@/types/ai";
import { ModelPlanCard } from "@/components/ai/ModelPlanCard";
import { ImageAnalysisCard } from "@/components/ai/ImageAnalysisCard";

export interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  text?: string;
  plan?: ModelPlan;
  imageAnalysis?: ImageAnalysis;
  imageUrl?: string;
  error?: string;
  createdAt?: string;
  onUseCode?: (code: string) => void;
}

export function ChatMessage({
  role,
  text,
  plan,
  imageAnalysis,
  imageUrl,
  error,
  createdAt,
  onUseCode,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-3 py-3 px-2 rounded-xl transition-colors ${
        isUser ? "bg-transparent" : "bg-[#10131D]/50 border border-[#1E2333]/40"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
          isUser
            ? "bg-[#252C3D] text-[#CCD2E3]"
            : "bg-gradient-to-br from-[#F5792A] to-[#D95F12] text-white shadow-glow-orange"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Message Body */}
      <div className="flex-1 space-y-3 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#CCD2E3]">
            {isUser ? "You" : "SculptorAI Copilot"}
          </span>
          {createdAt && (
            <span className="text-[10px] text-[#556077]">{createdAt}</span>
          )}
        </div>

        {/* User Attached Image */}
        {imageUrl && (
          <div className="max-w-xs rounded-lg overflow-hidden border border-[#2B3245]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Reference" className="w-full object-cover" />
          </div>
        )}

        {/* Text Content */}
        {text && (
          <div className="text-xs text-[#D8DEEE] leading-relaxed whitespace-pre-wrap">
            {text}
          </div>
        )}

        {/* Structured Model Plan */}
        {plan && <ModelPlanCard plan={plan} />}

        {/* Image Analysis Breakdown */}
        {imageAnalysis && (
          <ImageAnalysisCard analysis={imageAnalysis} onUseCode={onUseCode} />
        )}

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
