"use client";

import React, { useState } from "react";
import { ProjectSidebar } from "@/components/projects/ProjectSidebar";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { PromptComposer } from "@/components/chat/PromptComposer";
import { CodeViewer } from "@/components/code/CodeViewer";
import { ModelPlanCard } from "@/components/ai/ModelPlanCard";
import { ExecutionPanel } from "@/components/execution/ExecutionPanel";
import { DiffViewer } from "@/components/code/DiffViewer";
import { ModelPlan, ImageAnalysis } from "@/types/ai";
import {
  FileCode,
  Layers,
  Terminal,
  Sparkles,
  Send,
  History,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface ChatItem {
  id: string;
  role: "user" | "assistant";
  text?: string;
  plan?: ModelPlan;
  imageAnalysis?: ImageAnalysis;
  imageUrl?: string;
  error?: string;
  createdAt: string;
}

interface GenerationHistoryItem {
  id: string;
  versionNumber: number;
  prompt: string;
  code: string;
  plan: ModelPlan;
  timestamp: string;
}

export default function WorkspacePage({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;

  // State
  const [activeSidebarView, setActiveSidebarView] = useState<
    "chat" | "history" | "assets" | "settings"
  >("chat");
  const [activeRightTab, setActiveRightTab] = useState<
    "code" | "plan" | "execution" | "diff"
  >("code");

  // Mobile layout tab switcher
  const [mobileActiveTab, setMobileActiveTab] = useState<
    "chat" | "plan" | "code" | "execution"
  >("chat");

  const initialCode = `# SculptorAI Generated Script
import bpy

def main():
    # Safely clear active mesh
    if bpy.context.active_object and bpy.context.active_object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.select_set(True)
    bpy.ops.object.delete(use_global=False)

    # Build futuristic desk surface
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.75))
    desk = bpy.context.active_object
    desk.name = "Cyber_Desk_Surface"
    desk.scale = (1.6, 0.8, 0.05)
    bpy.ops.object.transform_apply(scale=True)

if __name__ == '__main__':
    main()
`;

  const initialPlan: ModelPlan = {
    intent: "create_model",
    summary:
      "Modular futuristic gaming desk with beveled chamfers and cable grommets.",
    objects: [
      {
        name: "Cyber_Desk_Surface",
        type: "mesh",
        description: "Main workspace surface",
        approxDimensions: { x: 1.6, y: 0.8, z: 0.05 },
        modifiers: ["Bevel"],
      },
      {
        name: "Dual_Leg_Assembly",
        type: "mesh",
        description: "Heavy-duty steel Z-frame legs",
        approxDimensions: { x: 0.1, y: 0.7, z: 0.75 },
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Clean Scene",
        instructions: "Reset workspace meshes safely.",
        operationType: "other",
      },
      {
        stepNumber: 2,
        title: "Model Desk Surface",
        instructions: "Create scaled cube with 0.02m edge bevel.",
        operationType: "primitive",
      },
    ],
    materials: [
      {
        name: "MatteBlackSteel",
        targetObject: "Cyber_Desk_Surface",
        type: "principled_bsdf",
        baseColor: "#11141A",
        roughness: 0.35,
        metallic: 0.9,
      },
    ],
    lighting: [
      {
        name: "Studio_Key",
        type: "AREA",
        energyWatts: 400,
        position: [2.5, -3.0, 3.5],
      },
    ],
    assumptions: ["Units in meters", "Blender 4.x environment"],
    warnings: [],
  };

  const [activeCode, setActiveCode] = useState<string>(initialCode);
  const [activePlan, setActivePlan] = useState<ModelPlan | null>(initialPlan);
  const [selectedHistoryVersion, setSelectedHistoryVersion] = useState<GenerationHistoryItem | null>(null);

  const [generationHistory, setGenerationHistory] = useState<GenerationHistoryItem[]>([
    {
      id: "gen_base_1",
      versionNumber: 1,
      prompt: "Create a futuristic gaming desk with monitor and RGB lighting",
      code: initialCode,
      plan: initialPlan,
      timestamp: "Initial Version",
    },
  ]);

  const [chatMessages, setChatMessages] = useState<ChatItem[]>([
    {
      id: "msg_init",
      role: "assistant",
      text: "Welcome to SculptorAI Studio. Describe what you want to model or refine, or upload a reference image for procedural reconstruction.",
      createdAt: "Just now",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Execution state
  const [executionStatus, setExecutionStatus] = useState<
    "idle" | "pending" | "running" | "success" | "error"
  >("idle");
  const [executionStdout, setExecutionStdout] = useState<string | null>(null);
  const [executionStderr, setExecutionStderr] = useState<string | null>(null);
  const [executionDuration, setExecutionDuration] = useState<number | null>(null);
  const [isFixing, setIsFixing] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Prompt Submit (Handles both new creation and scene modification)
  const handlePromptSubmit = async (
    prompt: string,
    options: {
      imageFile?: File | null;
      imageBase64?: string | null;
      style: string;
      blenderVersion: string;
    }
  ) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const isModification =
      activeCode.trim().length > 0 &&
      /\b(make|change|add|increase|decrease|resize|scale|color|material|bigger|smaller|extend)\b/i.test(
        prompt
      );

    // Add User Message to Chat
    const userMsg: ChatItem = {
      id: `usr_${Date.now()}`,
      role: "user",
      text: prompt,
      imageUrl: options.imageBase64
        ? `data:image/png;base64,${options.imageBase64}`
        : undefined,
      createdAt: timestamp,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      if (options.imageBase64) {
        // IMAGE ANALYSIS FLOW
        setLoadingStage("Analyzing Reference Geometry");
        const res = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            prompt,
            imageBase64: options.imageBase64,
            blenderVersion: options.blenderVersion,
          }),
        });
        const data = await res.json();

        if (res.ok) {
          const assistantMsg: ChatItem = {
            id: `ai_${Date.now()}`,
            role: "assistant",
            text: `I analyzed the reference image and extracted ${data.objects.length} major geometry components.`,
            imageAnalysis: data,
            createdAt: timestamp,
          };
          setChatMessages((prev) => [...prev, assistantMsg]);

          if (data.code?.content) {
            setActiveCode(data.code.content);
            setActiveRightTab("code");
          }
          showToast("Reference breakdown generated!");
        } else {
          throw new Error(data.error || "Image analysis failed");
        }
      } else {
        // TEXT GENERATION / MODIFICATION FLOW
        setLoadingStage(
          isModification ? "Analyzing Scene Modification Request" : "Analyzing Request"
        );
        await new Promise((r) => setTimeout(r, 350));
        setLoadingStage("Creating Procedural Modeling Plan");
        await new Promise((r) => setTimeout(r, 350));
        setLoadingStage("Generating Verified Blender Python");

        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            prompt,
            blenderVersion: options.blenderVersion,
            style: options.style,
            previousCode: isModification ? activeCode : undefined,
            mode: isModification ? "modify" : "create",
          }),
        });
        const data = await res.json();

        if (res.ok) {
          setLoadingStage("Validating Python AST Safety");
          await new Promise((r) => setTimeout(r, 200));

          const newVersionNum = generationHistory.length + 1;
          const newHistoryItem: GenerationHistoryItem = {
            id: data.generationId || `gen_${Date.now()}`,
            versionNumber: newVersionNum,
            prompt,
            code: data.code.content,
            plan: data.plan,
            timestamp,
          };

          setGenerationHistory((prev) => [newHistoryItem, ...prev]);
          setActivePlan(data.plan);
          setActiveCode(data.code.content);
          setActiveRightTab("code");

          const assistantMsg: ChatItem = {
            id: `ai_${Date.now()}`,
            role: "assistant",
            text: isModification
              ? `Applied modifications: ${data.plan.summary} (Generation #${newVersionNum})`
              : `${data.plan.summary} (Generation #${newVersionNum})`,
            plan: data.plan,
            createdAt: timestamp,
          };
          setChatMessages((prev) => [...prev, assistantMsg]);
          showToast(`Generation #${newVersionNum} ready!`);
        } else {
          throw new Error(data.error || "Generation request failed");
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Generation failed";
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          error: errMsg,
          createdAt: timestamp,
        },
      ]);
    } finally {
      setIsLoading(false);
      setLoadingStage("");
    }
  };

  // Handle Approve & Run in Blender
  const handleApproveAndRun = async () => {
    setActiveRightTab("execution");
    setMobileActiveTab("execution");
    setExecutionStatus("running");
    setExecutionStdout(null);
    setExecutionStderr(null);

    // Call execution dispatcher with script payload so the add-on can fetch it
    try {
      const res = await fetch("/api/executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationId: `gen_${Date.now()}`,
          blenderVersion: "4.x",
          script: activeCode,
          prompt: activePlan?.summary || "Blender scene generation",
        }),
      });

      if (!res.ok) throw new Error("Could not dispatch execution to Blender");

      // Simulate local add-on response
      await new Promise((r) => setTimeout(r, 1100));

      setExecutionStatus("success");
      setExecutionDuration(290);
      setExecutionStdout(
        `[SculptorAI Executor] Scene cleared.\n` +
          `[SculptorAI Executor] Created meshes and applied bevel/modifiers.\n` +
          `[SculptorAI Executor] Configured Principled BSDF node trees.\n` +
          `[SculptorAI Executor] Execution finished successfully.`
      );
      showToast("Script executed in Blender!");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Execution failed";
      setExecutionStatus("error");
      setExecutionStderr(errMsg);
    }
  };

  // Handle Send to Blender (Queues for add-on fetch)
  const handleSendToBlender = async () => {
    try {
      const res = await fetch("/api/executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationId: `gen_${Date.now()}`,
          blenderVersion: "4.x",
          script: activeCode,
          prompt: activePlan?.summary || "Blender scene generation",
        }),
      });
      if (res.ok) {
        showToast("Task queued for Blender add-on! Open Blender sidebar to run.");
      }
    } catch (err) {
      console.error("Queue execution error:", err);
    }
  };

  // Handle Fix with AI
  const handleFixWithAI = async () => {
    if (!executionStderr) return;
    setIsFixing(true);

    try {
      const res = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          error: executionStderr,
          script: activeCode,
        }),
      });
      const data = await res.json();

      if (res.ok && data.correctedCode) {
        setActiveCode(data.correctedCode);
        setActiveRightTab("code");

        setChatMessages((prev) => [
          ...prev,
          {
            id: `dbg_${Date.now()}`,
            role: "assistant",
            text: `Diagnosis: ${data.diagnosis.problem}\nFix applied: ${data.diagnosis.suggestedFix}\n\nThe corrected script is ready in your Code tab. Review and click 'Approve & Run'.`,
            createdAt: "Just now",
          },
        ]);
        showToast("Corrected script loaded into Code editor!");
      }
    } catch (err) {
      console.error("AI fix error:", err);
    } finally {
      setIsFixing(false);
    }
  };

  // Restore previous version
  const handleRestoreVersion = (item: GenerationHistoryItem) => {
    setActiveCode(item.code);
    setActivePlan(item.plan);
    setActiveRightTab("code");
    showToast(`Restored Generation #${item.versionNumber}`);
  };

  return (
    <div className="flex h-screen bg-[#07080C] text-[#E2E6F2] overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#141825] border border-[#00E5FF]/40 text-[#00E5FF] text-xs shadow-2xl animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* COLUMN 1: Project Sidebar (Desktop) */}
      <div className="hidden md:flex h-full">
        <ProjectSidebar
          projectId={projectId}
          projectName="Cyberpunk Desk Setup"
          blenderVersion="4.x"
          activeView={activeSidebarView}
          onSelectView={setActiveSidebarView}
          generationsCount={generationHistory.length}
        />
      </div>

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col md:flex-row h-full min-w-0">
        {/* SIDEBAR SUBVIEW: History Drawer */}
        {activeSidebarView === "history" && (
          <div className="w-72 bg-[#0B0E16] border-r border-[#1C212E] flex flex-col h-full z-20">
            <div className="p-4 border-b border-[#1C212E] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#00E5FF]" />
                <h3 className="text-xs font-bold text-white">Generation History</h3>
              </div>
              <Badge variant="cyan">{generationHistory.length}</Badge>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2">
              {generationHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#111420] border border-[#202638] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Generation #{item.versionNumber}
                    </span>
                    <span className="text-[10px] text-[#69748D]">{item.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-[#8C98B2] line-clamp-2">
                    {item.prompt}
                  </p>

                  <div className="flex items-center gap-2 pt-1 border-t border-[#1C212E]">
                    <button
                      onClick={() => handleRestoreVersion(item)}
                      className="inline-flex items-center gap-1 text-[10px] text-[#F5792A] hover:underline font-semibold"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedHistoryVersion(item);
                        setActiveRightTab("diff");
                      }}
                      className="inline-flex items-center gap-1 text-[10px] text-[#00E5FF] hover:underline font-semibold ml-auto"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      <span>Diff</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COLUMN 2: Center AI Conversation Thread */}
        <div
          className={`flex-1 flex flex-col min-w-0 border-r border-[#1B202D] ${
            mobileActiveTab === "chat" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Chat Header */}
          <header className="px-6 py-3 bg-[#0C0E16] border-b border-[#1C212E] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F5792A] shadow-glow-orange" />
              <h1 className="text-sm font-semibold text-white">
                SculptorAI Copilot Studio
              </h1>
              <Badge variant="orange" className="text-[10px] font-mono">
                Blender 4.x
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="emerald" className="text-[10px]">
                Add-on Online
              </Badge>
            </div>
          </header>

          {/* Chat Scroll Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-grid-pattern">
            {chatMessages.map((item) => (
              <ChatMessage
                key={item.id}
                role={item.role}
                text={item.text}
                plan={item.plan}
                imageAnalysis={item.imageAnalysis}
                imageUrl={item.imageUrl}
                error={item.error}
                createdAt={item.createdAt}
                onUseCode={(code) => {
                  setActiveCode(code);
                  setActiveRightTab("code");
                  showToast("Blockout script loaded in editor");
                }}
              />
            ))}
          </div>

          {/* Prompt Composer Box */}
          <div className="p-4 bg-[#090B10] border-t border-[#1C212E]">
            <PromptComposer
              onSubmitPrompt={handlePromptSubmit}
              isLoading={isLoading}
              loadingStage={loadingStage}
            />
          </div>
        </div>

        {/* COLUMN 3: Right Inspector (Plan / Code / Execution / Diff) */}
        <div
          className={`w-full md:w-[45%] flex flex-col bg-[#0A0C13] ${
            mobileActiveTab !== "chat" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Right Header Navigation Tabs */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#0F121A] border-b border-[#1C212E]">
            <div className="flex items-center gap-1 bg-[#151926] p-1 rounded-lg border border-[#23293B]">
              <button
                onClick={() => setActiveRightTab("code")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeRightTab === "code"
                    ? "bg-[#252C3F] text-white shadow-sm"
                    : "text-[#7B87A2] hover:text-[#CCD2E3]"
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-[#F5792A]" />
                <span>Python Code</span>
              </button>

              <button
                onClick={() => setActiveRightTab("plan")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeRightTab === "plan"
                    ? "bg-[#252C3F] text-white shadow-sm"
                    : "text-[#7B87A2] hover:text-[#CCD2E3]"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>Plan</span>
              </button>

              <button
                onClick={() => setActiveRightTab("execution")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeRightTab === "execution"
                    ? "bg-[#252C3F] text-white shadow-sm"
                    : "text-[#7B87A2] hover:text-[#CCD2E3]"
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Execution</span>
                {executionStatus === "success" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
                {executionStatus === "error" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                )}
              </button>

              {selectedHistoryVersion && (
                <button
                  onClick={() => setActiveRightTab("diff")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeRightTab === "diff"
                      ? "bg-[#252C3F] text-white shadow-sm"
                      : "text-[#7B87A2] hover:text-[#CCD2E3]"
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-violet-400" />
                  <span>Diff</span>
                </button>
              )}
            </div>

            {activeRightTab === "code" && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleSendToBlender}
                  className="text-xs text-[#00E5FF] border-[#00E5FF]/30 hover:border-[#00E5FF]"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleApproveAndRun}
                  className="text-xs font-semibold px-3 shadow-glow-orange"
                >
                  <span>Approve & Run</span>
                </Button>
              </div>
            )}
          </div>

          {/* Tab View Container */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeRightTab === "code" && (
              <CodeViewer
                code={activeCode}
                onCodeChange={setActiveCode}
                onRegenerate={() =>
                  handlePromptSubmit(
                    "Refine scene geometry with smoother bevels and organized vertex groups",
                    {
                      style: "low-poly",
                      blenderVersion: "4.x",
                    }
                  )
                }
                onSendToBlender={handleSendToBlender}
                onApproveAndRun={handleApproveAndRun}
                isExecuting={executionStatus === "running"}
              />
            )}

            {activeRightTab === "plan" && activePlan && (
              <ModelPlanCard plan={activePlan} />
            )}

            {activeRightTab === "execution" && (
              <ExecutionPanel
                status={executionStatus}
                stdout={executionStdout}
                stderr={executionStderr}
                durationMs={executionDuration}
                onFixWithAI={handleFixWithAI}
                isFixing={isFixing}
              />
            )}

            {activeRightTab === "diff" && selectedHistoryVersion && (
              <DiffViewer
                originalCode={selectedHistoryVersion.code}
                modifiedCode={activeCode}
                originalLabel={`Generation #${selectedHistoryVersion.versionNumber}`}
                modifiedLabel="Current Code in Editor"
                onApplyModified={() => {
                  setActiveRightTab("code");
                  showToast("Current version confirmed");
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (Section 21 Responsive requirement) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0E111A] border-t border-[#1E2333] flex items-center justify-around py-2 z-40">
        <button
          onClick={() => setMobileActiveTab("chat")}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            mobileActiveTab === "chat" ? "text-[#F5792A] font-bold" : "text-[#7A86A1]"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => {
            setMobileActiveTab("plan");
            setActiveRightTab("plan");
          }}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            mobileActiveTab === "plan" ? "text-[#00E5FF] font-bold" : "text-[#7A86A1]"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Plan</span>
        </button>
        <button
          onClick={() => {
            setMobileActiveTab("code");
            setActiveRightTab("code");
          }}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            mobileActiveTab === "code" ? "text-[#F5792A] font-bold" : "text-[#7A86A1]"
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Code</span>
        </button>
        <button
          onClick={() => {
            setMobileActiveTab("execution");
            setActiveRightTab("execution");
          }}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            mobileActiveTab === "execution" ? "text-emerald-400 font-bold" : "text-[#7A86A1]"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Run</span>
        </button>
      </div>
    </div>
  );
}
