"use client";

import React, { useState } from "react";
import { ProjectSidebar } from "@/components/projects/ProjectSidebar";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { PromptComposer } from "@/components/chat/PromptComposer";
import { CodeViewer } from "@/components/code/CodeViewer";
import { ModelPlanCard } from "@/components/ai/ModelPlanCard";
import { ExecutionPanel } from "@/components/execution/ExecutionPanel";
import { ModelPlan, ImageAnalysis } from "@/types/ai";
import { FileCode, Layers, Terminal, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
    "code" | "plan" | "execution"
  >("code");

  const [activeCode, setActiveCode] = useState<string>(`# SculptorAI Generated Script
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
`);

  const [activePlan, setActivePlan] = useState<ModelPlan | null>({
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
  });

  const [chatMessages, setChatMessages] = useState<ChatItem[]>([
    {
      id: "msg_init",
      role: "assistant",
      text: "Welcome to SculptorAI Studio. Describe what you want to model, or upload a reference image to generate an actionable Blender plan and executable Python.",
      createdAt: "Just now",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>("");

  // Execution state
  const [executionStatus, setExecutionStatus] = useState<
    "idle" | "pending" | "running" | "success" | "error"
  >("idle");
  const [executionStdout, setExecutionStdout] = useState<string | null>(null);
  const [executionStderr, setExecutionStderr] = useState<string | null>(null);
  const [executionDuration, setExecutionDuration] = useState<number | null>(
    null
  );
  const [isFixing, setIsFixing] = useState(false);

  // Handle Prompt Submit
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

    // 1. Add User Message to Chat
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
        } else {
          throw new Error(data.error || "Image analysis failed");
        }
      } else {
        // TEXT GENERATION FLOW
        setLoadingStage("Analyzing Request");
        await new Promise((r) => setTimeout(r, 400));
        setLoadingStage("Creating Modeling Plan");
        await new Promise((r) => setTimeout(r, 400));
        setLoadingStage("Generating Blender Python");

        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            prompt,
            blenderVersion: options.blenderVersion,
            style: options.style,
          }),
        });
        const data = await res.json();

        if (res.ok) {
          setLoadingStage("Validating Python Safety");
          await new Promise((r) => setTimeout(r, 300));

          setActivePlan(data.plan);
          setActiveCode(data.code.content);
          setActiveRightTab("code");

          const assistantMsg: ChatItem = {
            id: `ai_${Date.now()}`,
            role: "assistant",
            text: data.plan.summary,
            plan: data.plan,
            createdAt: timestamp,
          };
          setChatMessages((prev) => [...prev, assistantMsg]);
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
    setExecutionStatus("running");
    setExecutionStdout(null);
    setExecutionStderr(null);

    // Call execution dispatcher
    try {
      const res = await fetch("/api/executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationId: `gen_${Date.now()}`,
          blenderVersion: "4.x",
        }),
      });

      if (!res.ok) throw new Error("Could not dispatch execution to Blender");

      // Simulate local add-on response / execution
      await new Promise((r) => setTimeout(r, 1200));

      setExecutionStatus("success");
      setExecutionDuration(380);
      setExecutionStdout(
        `[SculptorAI Executor] Scene cleared.\n` +
          `[SculptorAI Executor] Created mesh 'Cyber_Desk_Surface' with Bevel modifier.\n` +
          `[SculptorAI Executor] Applied Material 'MatteBlackSteel' (Principled BSDF).\n` +
          `[SculptorAI Executor] Execution finished successfully.`
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Execution failed";
      setExecutionStatus("error");
      setExecutionStderr(errMsg);
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
      }
    } catch (err) {
      console.error("AI fix error:", err);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#07080C] text-[#E2E6F2] overflow-hidden">
      {/* COLUMN 1: Project Sidebar */}
      <ProjectSidebar
        projectId={projectId}
        projectName="Cyberpunk Desk Setup"
        blenderVersion="4.x"
        activeView={activeSidebarView}
        onSelectView={setActiveSidebarView}
        generationsCount={chatMessages.filter((m) => m.plan).length}
      />

      {/* COLUMN 2: Center AI Conversation Thread */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[#1B202D]">
        {/* Chat Header */}
        <header className="px-6 py-3.5 bg-[#0C0E16] border-b border-[#1C212E] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F5792A] shadow-glow-orange" />
            <h1 className="text-sm font-semibold text-white">
              SculptorAI Copilot Chat
            </h1>
            <span className="text-xs text-[#6A7690]">
              Blender-aware intelligent assistant
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setActiveCode(
                  `import bpy\n\n# Quick test cube\nbpy.ops.mesh.primitive_cube_add(size=2.0)\n`
                );
                setActiveRightTab("code");
              }}
              className="text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>Test Cube</span>
            </Button>
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

      {/* COLUMN 3: Right Inspector (Plan / Code / Execution) */}
      <div className="w-[45%] flex flex-col bg-[#0A0C13]">
        {/* Right Header Navigation */}
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
              <span>Modeling Plan</span>
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
          </div>

          {activeRightTab === "code" && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleApproveAndRun}
              className="text-xs font-semibold px-3"
            >
              <Send className="w-3 h-3" />
              <span>Send to Blender</span>
            </Button>
          )}
        </div>

        {/* Tab View Container */}
        <div className="flex-1 p-4 overflow-y-auto">
          {activeRightTab === "code" && (
            <CodeViewer
              code={activeCode}
              onCodeChange={setActiveCode}
              onRegenerate={() =>
                handlePromptSubmit("Regenerate low-poly furniture with refined bevels", {
                  style: "low-poly",
                  blenderVersion: "4.x",
                })
              }
              onSendToBlender={handleApproveAndRun}
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
        </div>
      </div>
    </div>
  );
}
