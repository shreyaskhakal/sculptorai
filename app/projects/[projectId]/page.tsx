"use client";

import React, { useState, useEffect } from "react";
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
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/components/auth/AuthProvider";

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

interface ProjectData {
  id: string;
  name: string;
  description: string;
  blenderVersion: string;
}

export default function WorkspacePage({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;
  const { isDemoMode } = useAuth();

  // Navigation & Tabs
  const [activeSidebarView, setActiveSidebarView] = useState<
    "chat" | "history" | "assets" | "settings"
  >("chat");
  const [activeRightTab, setActiveRightTab] = useState<
    "code" | "plan" | "execution" | "diff"
  >("code");
  const [mobileActiveTab, setMobileActiveTab] = useState<
    "chat" | "plan" | "code" | "execution"
  >("chat");

  // Project Meta
  const [project, setProject] = useState<ProjectData | null>(null);

  // Active Code & Plan
  const [activeCode, setActiveCode] = useState<string>(
    `# SculptorAI Generated Script\nimport bpy\n\ndef main():\n    if bpy.context.active_object and bpy.context.active_object.mode != 'OBJECT':\n        bpy.ops.object.mode_set(mode='OBJECT')\n    bpy.ops.object.select_all(action='DESELECT')\n    for obj in bpy.data.objects:\n        if obj.type == 'MESH':\n            obj.select_set(True)\n    bpy.ops.object.delete(use_global=False)\n    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.75))\n    desk = bpy.context.active_object\n    desk.name = "Cyber_Desk_Surface"\n    desk.scale = (1.6, 0.8, 0.05)\n    bpy.ops.object.transform_apply(scale=True)\n\nif __name__ == '__main__':\n    main()\n`
  );
  const [activePlan, setActivePlan] = useState<ModelPlan | null>({
    intent: "create_model",
    summary: "Modular futuristic gaming desk with beveled chamfers and cable grommets.",
    objects: [
      {
        name: "Cyber_Desk_Surface",
        type: "mesh",
        description: "Main workspace surface",
        approxDimensions: { x: 1.6, y: 0.8, z: 0.05 },
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
        name: "Dark_Matte_Carbon",
        targetObject: "Cyber_Desk_Surface",
        type: "principled_bsdf",
        roughness: 0.35,
        metallic: 0.9,
      },
    ],
    lighting: [],
    camera: undefined,
    assumptions: ["Units in meters", "Blender 4.x / 3.6 LTS"],
    warnings: [],
  });

  const [selectedHistoryVersion, setSelectedHistoryVersion] =
    useState<GenerationHistoryItem | null>(null);
  const [generationHistory, setGenerationHistory] = useState<GenerationHistoryItem[]>([]);
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

  // Real Execution State
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<
    "idle" | "pending" | "claimed" | "running" | "success" | "error" | "cancelled"
  >("idle");
  const [executionStdout, setExecutionStdout] = useState<string | null>(null);
  const [executionStderr, setExecutionStderr] = useState<string | null>(null);
  const [executionDuration, setExecutionDuration] = useState<number | null>(null);
  const [isFixing, setIsFixing] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Initial Data (Project, Generations, Messages)
  useEffect(() => {
    let isMounted = true;

    // Load Project Details
    fetch(`/api/projects/${projectId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setProject(data);
        }
      })
      .catch((err) => console.error("Error loading project:", err));

    // Load Persistent Generations
    fetch(`/api/projects/${projectId}/generations`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && Array.isArray(data.generations) && data.generations.length > 0) {
          const mapped: GenerationHistoryItem[] = data.generations.map((g: any) => ({
            id: g.id,
            versionNumber: g.versionNumber,
            prompt: g.prompt,
            code: g.code,
            plan: g.planJson,
            timestamp: new Date(g.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));
          setGenerationHistory(mapped);
          if (mapped[0]) {
            setActiveCode(mapped[0].code);
            setActivePlan(mapped[0].plan);
          }
        }
      })
      .catch((err) => console.error("Error loading generations:", err));

    // Load Persistent Chat Messages
    fetch(`/api/projects/${projectId}/messages`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && Array.isArray(data.messages) && data.messages.length > 0) {
          const mapped: ChatItem[] = data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            text: m.content?.text || (typeof m.content === "string" ? m.content : ""),
            plan: m.metadata?.plan,
            imageUrl: m.imageUrl,
            createdAt: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));
          setChatMessages(mapped);
        }
      })
      .catch((err) => console.error("Error loading messages:", err));

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // 2. Real Execution Polling Lifecycle
  useEffect(() => {
    if (
      !activeExecutionId ||
      executionStatus === "idle" ||
      executionStatus === "success" ||
      executionStatus === "error" ||
      executionStatus === "cancelled"
    ) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/executions?id=${activeExecutionId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data && data.status) {
          setExecutionStatus(data.status);

          if (data.stdout !== undefined && data.stdout !== null) {
            setExecutionStdout(data.stdout);
          }
          if (data.stderr !== undefined && data.stderr !== null) {
            setExecutionStderr(data.stderr);
          }
          if (data.durationMs !== undefined && data.durationMs !== null) {
            setExecutionDuration(data.durationMs);
          }

          if (data.status === "claimed") {
            showToast("Claimed by Blender! Approve execution in Blender sidebar.");
          } else if (data.status === "running") {
            showToast("Blender is executing Python script...");
          } else if (data.status === "success") {
            showToast("Blender confirmed execution succeeded!");
            clearInterval(interval);
          } else if (data.status === "error") {
            showToast("Blender reported execution error.");
            clearInterval(interval);
          } else if (data.status === "cancelled") {
            showToast("Execution was cancelled.");
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("Execution status polling error:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeExecutionId, executionStatus]);

  // 3. Handle Prompt Submit
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

    // Add User Message to Chat and Persist
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

    // Persist message in background
    fetch(`/api/projects/${projectId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "user",
        content: { text: prompt },
        imageUrl: options.imageBase64 ? `data:image/png;base64,${options.imageBase64}` : undefined,
      }),
    }).catch((err) => console.error("Could not persist user message:", err));

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

          // Persist assistant message
          fetch(`/api/projects/${projectId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: "assistant",
              content: { text: assistantMsg.text },
              metadata: { imageAnalysis: data },
            }),
          }).catch(console.error);
        } else {
          throw new Error(data.error || "Image analysis failed");
        }
      } else {
        // TEXT GENERATION / MODIFICATION FLOW
        setLoadingStage(
          isModification ? "Analyzing Scene Modification Request" : "Analyzing Request"
        );
        setLoadingStage("Creating Procedural Modeling Plan");
        setLoadingStage("Generating Verified Blender Python");

        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            prompt,
            blenderVersion: options.blenderVersion || project?.blenderVersion || "4.x",
            style: options.style,
            previousCode: isModification ? activeCode : undefined,
            mode: isModification ? "modify" : "create",
          }),
        });
        const data = await res.json();

        if (res.ok) {
          const newVersionNum = data.versionNumber || generationHistory.length + 1;
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

          const assistantText = isModification
            ? `Applied modifications: ${data.plan.summary} (Generation #${newVersionNum})`
            : `${data.plan.summary} (Generation #${newVersionNum})`;

          const assistantMsg: ChatItem = {
            id: `ai_${Date.now()}`,
            role: "assistant",
            text: assistantText,
            plan: data.plan,
            createdAt: timestamp,
          };
          setChatMessages((prev) => [...prev, assistantMsg]);
          showToast(`Generation #${newVersionNum} ready!`);

          // Persist assistant message
          fetch(`/api/projects/${projectId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: "assistant",
              content: { text: assistantText },
              metadata: { plan: data.plan },
            }),
          }).catch(console.error);
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

  // 4. Handle Real Send to Blender Queue / Approve & Run
  const handleDispatchExecution = async (autoApproveInUi: boolean = false) => {
    setActiveRightTab("execution");
    setMobileActiveTab("execution");
    setExecutionStatus("pending");
    setExecutionStdout(null);
    setExecutionStderr(null);
    setExecutionDuration(null);

    try {
      const currentGenId =
        selectedHistoryVersion?.id || generationHistory[0]?.id || `gen_${Date.now()}`;

      const res = await fetch("/api/executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationId: currentGenId,
          projectId,
          blenderVersion: project?.blenderVersion || "4.x",
          script: activeCode,
          prompt: activePlan?.summary || "Blender scene generation",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not dispatch execution to Blender");
      }

      const execId = data.id || data.executionId;
      setActiveExecutionId(execId);
      setExecutionStatus("pending");
      showToast("Task queued for Blender add-on. Open Blender to claim & run.");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Execution dispatch failed";
      setExecutionStatus("error");
      setExecutionStderr(errMsg);
    }
  };

  const handleApproveAndRun = () => handleDispatchExecution(true);
  const handleSendToBlender = () => handleDispatchExecution(false);

  // 5. Handle AI Debugging of Real Stderr Traceback
  const handleFixWithAI = async () => {
    if (!executionStderr) return;
    setIsFixing(true);

    try {
      const res = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          blenderVersion: project?.blenderVersion || "4.x",
          error: executionStderr,
          script: activeCode,
        }),
      });
      const data = await res.json();

      if (res.ok && data.correctedCode) {
        setActiveCode(data.correctedCode);
        setActiveRightTab("code");

        const fixExplanation = `AI Diagnosis: ${data.diagnosis.problem}\nWhy: ${data.diagnosis.whyItHappened}\nSuggested Fix: ${data.diagnosis.suggestedFix}\n\nThe corrected code is now loaded in your editor for review. Review it and click "Approve & Run" when ready.`;

        setChatMessages((prev) => [
          ...prev,
          {
            id: `dbg_${Date.now()}`,
            role: "assistant",
            text: fixExplanation,
            createdAt: "Just now",
          },
        ]);

        fetch(`/api/projects/${projectId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "assistant",
            content: { text: fixExplanation },
          }),
        }).catch(console.error);

        showToast("Corrected script loaded into Code editor! Review before running.");
      } else {
        throw new Error(data.error || "AI could not generate fix");
      }
    } catch (err) {
      console.error("AI fix error:", err);
      showToast("Could not diagnose error automatically.");
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

      {/* COLUMN 1: Left Navigation / Project History Sidebar */}
      <ProjectSidebar
        projectId={projectId}
        projectName={project?.name || "Cyberpunk Desk Setup"}
        blenderVersion={project?.blenderVersion || "4.x"}
        activeView={activeSidebarView}
        onSelectView={setActiveSidebarView}
        generationsCount={generationHistory.length}
      />

      {/* History Drawer View when selected */}
      <div className="flex-1 flex overflow-hidden">
        {activeSidebarView === "history" && (
          <div className="w-80 bg-[#0B0D14] border-r border-[#1C212E] p-4 flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1C212E] mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A86A1] flex items-center gap-2">
                <History className="w-4 h-4 text-[#00E5FF]" />
                <span>Generation History</span>
              </h3>
              <Badge variant="cyan" className="text-[10px]">
                {generationHistory.length} Versions
              </Badge>
            </div>

            <div className="space-y-3">
              {generationHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[#10131D] border border-[#20273A] hover:border-[#F5792A]/50 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="orange" className="text-[10px]">
                      v{item.versionNumber}
                    </Badge>
                    <span className="text-[10px] text-[#6A768F]">
                      {item.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-white font-medium line-clamp-2">
                    {item.prompt}
                  </p>

                  <div className="pt-2 flex items-center gap-2 border-t border-[#191F2F]">
                    <button
                      onClick={() => handleRestoreVersion(item)}
                      className="inline-flex items-center gap-1 text-[10px] text-[#A2ACBF] hover:text-white transition-colors"
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
                {project?.name || "SculptorAI Copilot Studio"}
              </h1>
              <Badge variant="orange" className="text-[10px] font-mono">
                Blender {project?.blenderVersion || "4.x / 3.6 LTS"}
              </Badge>
              {isDemoMode && (
                <Badge variant="cyan" className="text-[10px]">
                  Demo Mode
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131622] border border-[#212638] text-[11px] text-[#CCD2E3]">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Blender Pipeline Ready</span>
              </div>
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
                  showToast("Script loaded in editor");
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
                {executionStatus === "claimed" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-ping" />
                )}
                {executionStatus === "pending" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-spin" />
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
                  title="Queue task for Blender add-on"
                >
                  <Send className="w-3 h-3" />
                  <span>Send to Blender</span>
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleApproveAndRun}
                  className="text-xs font-semibold px-3 shadow-glow-orange"
                  title="Approve and queue task for execution"
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
                      blenderVersion: project?.blenderVersion || "4.x",
                    }
                  )
                }
                onSendToBlender={handleSendToBlender}
                onApproveAndRun={handleApproveAndRun}
                isExecuting={executionStatus === "running" || executionStatus === "pending"}
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

      {/* MOBILE BOTTOM NAVIGATION BAR */}
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
