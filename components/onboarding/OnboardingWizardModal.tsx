"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2,
  Download,
  Terminal,
  Play,
  Sparkles,
  ArrowRight,
  Radio,
  FileCheck,
} from "lucide-react";

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartModeling?: () => void;
  blenderStatus?: string;
}

export function OnboardingWizardModal({
  isOpen,
  onClose,
  onStartModeling,
  blenderStatus = "OFFLINE",
}: OnboardingWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      num: 1,
      title: "Welcome to SculptorAI",
      desc: "Your AI-powered 3D copilot that plans, validates, and builds procedural Blender assets using natural language.",
    },
    {
      num: 2,
      title: "Install Blender Add-on",
      desc: "Download and enable the official SculptorAI add-on inside Blender 3.6 LTS or 4.x.",
    },
    {
      num: 3,
      title: "Connect Workstation",
      desc: "Test the bridge connection between your local Blender viewport and SculptorAI Studio.",
    },
    {
      num: 4,
      title: "First Generation & Refinement",
      desc: "Describe what you want to model, inspect the change plan, approve execution, and refine conversationally.",
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SculptorAI Quickstart Setup"
    >
      <div className="space-y-6 pt-1">
        {/* Step Progress Bar */}
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#232A3D] -z-0" />
          {steps.map((s) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                className="relative z-10 flex flex-col items-center gap-1.5 bg-[#121622] px-2"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? "bg-emerald-500 text-white shadow-glow-emerald"
                      : isCurrent
                      ? "bg-[#00E5FF] text-black shadow-glow-cyan"
                      : "bg-[#1E2538] text-[#6A7690]"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span className="text-[10px] font-medium text-[#7D8AA5] hidden sm:block">
                  Step {s.num}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="bg-[#0D1017] p-5 rounded-xl border border-[#1E2538]">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F5792A]" />
                <span>Next-Gen 3D Creation Workflow</span>
              </h3>
              <p className="text-xs text-[#95A2BD] leading-relaxed">
                SculptorAI bridges natural language and precision Blender modeling. Describe an asset, see a structured 3D plan with dimensions and materials, preview it in WebGL, and execute it into your active Blender scene with zero security risks.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3 rounded-lg bg-[#151B29] border border-[#232C42]">
                  <div className="font-semibold text-white mb-1">Human-in-the-Loop</div>
                  <div className="text-[11px] text-[#7A88A6]">Explicit approval required before running generated Python.</div>
                </div>
                <div className="p-3 rounded-lg bg-[#151B29] border border-[#232C42]">
                  <div className="font-semibold text-white mb-1">Scene-Aware AI</div>
                  <div className="text-[11px] text-[#7A88A6]">Edits modify existing objects instead of regenerating from scratch.</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-[#00E5FF]" />
                <span>Download & Enable Add-on</span>
              </h3>
              <p className="text-xs text-[#95A2BD] leading-relaxed">
                1. Click the button below to download <span className="font-mono text-[#00E5FF]">blender-addon.zip</span>.
                <br />
                2. Inside Blender, open <strong>Edit &gt; Preferences &gt; Add-ons &gt; Install</strong> and select the zip.
                <br />
                3. Enable the checkbox for <strong>SculptorAI Copilot</strong>.
              </p>
              <div className="pt-2">
                <a
                  href="/blender-addon.zip"
                  download="blender-addon.zip"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#00E5FF] text-black font-semibold text-xs shadow-glow-cyan hover:bg-[#33EAFF] transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download blender-addon.zip (v1.1.0)</span>
                </a>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Verify Bridge Connection</span>
              </h3>
              <p className="text-xs text-[#95A2BD] leading-relaxed">
                Open Blender&apos;s 3D Viewport, press <kbd className="px-1.5 py-0.5 bg-[#202738] rounded text-[#00E5FF]">N</kbd> to open the sidebar, and switch to the <strong>SculptorAI</strong> tab.
              </p>
              <div className="p-3.5 rounded-lg bg-[#151B29] border border-[#232C42] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    blenderStatus === "CONNECTED" || blenderStatus === "IDLE"
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-[#7A86A1]"
                  }`} />
                  <span className="text-white font-medium">Workstation Status:</span>
                  <span className={blenderStatus === "CONNECTED" || blenderStatus === "IDLE" ? "text-emerald-400 font-bold" : "text-[#7A86A1]"}>
                    {blenderStatus}
                  </span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => window.location.reload()}>
                  Refresh Status
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-[#F5792A]" />
                <span>Ready to Create & Refine</span>
              </h3>
              <p className="text-xs text-[#95A2BD] leading-relaxed">
                You are all set! Try starting with a simple instruction:
              </p>
              <div className="p-3 rounded-lg bg-[#151B29] border border-[#232C42] text-xs font-mono text-[#CCD5E8]">
                &quot;Create a modern gaming desk with cable trays and dual monitor arm&quot;
              </div>
              <p className="text-xs text-[#7A88A6]">
                Then conversationally refine: <em>&quot;Make the legs 20% thinner&quot;</em> or <em>&quot;Add RGB ambient light strips&quot;</em>.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between pt-2">
          {currentStep > 1 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
              className="flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                if (onStartModeling) onStartModeling();
              }}
              className="shadow-glow-orange"
            >
              Enter SculptorAI Studio
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
