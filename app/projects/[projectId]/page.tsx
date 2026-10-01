"use client";

import React, { useState, useEffect } from "react";
import { ProjectSidebar } from "@/components/projects/ProjectSidebar";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { PromptComposer } from "@/components/chat/PromptComposer";
import { CodeViewer } from "@/components/code/CodeViewer";
import { ModelPlanCard } from "@/components/ai/ModelPlanCard";
import { ExecutionPanel } from "@/components/execution/ExecutionPanel";
import { DiffViewer } from "@/components/code/DiffViewer";
import { ThreeDViewer } from "@/components/viewer/ThreeDViewer";
import { OnboardingWizardModal } from "@/components/onboarding/OnboardingWizardModal";
import { TemplateGalleryModal } from "@/components/templates/TemplateGalleryModal";
import { VersionComparisonModal } from "@/components/versions/VersionComparisonModal";
import { SafetyScoreCard } from "@/components/security/SafetyScoreCard";
import { ModelPlan, ImageAnalysis, SceneSnapshot } from "@/types/ai";
import { DBGenerationVersion, DBTemplate } from "@/lib/supabase/db";
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
  Eye,
  Box,
  Download,
  Play,
  HelpCircle,
  LayoutGrid,
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

  // Navigation & View Toggles
  const [activeSidebarView, setActiveSidebarView] = useState<
    "chat" | "history" | "assets" | "settings"
  >("chat");
  const [activeRightTab, setActiveRightTab] = useState<
    "code" | "plan" | "execution" | "diff" | "scene"
  >("code");
  const [centerLayoutView, setCenterLayoutView] = useState<"3d" | "split" | "editor">("split");
  const [mobileActiveTab, setMobileActiveTab] = useState<
    "chat" | "3d" | "code" | "execution"
  >("3d");

  // Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const [isVersionComparisonOpen, setIsVersionComparisonOpen] = useState(false);

  // Project Meta & Live Blender Status
  const [project, setProject] = useState<ProjectData | null>(null);
  const [blenderStatus, setBlenderStatus] = useState<string>("IDLE");
  const [sceneSnapshot, setSceneSnapshot] = useState<SceneSnapshot | null>(null);
  const [selectedObjectName, setSelectedObjectName] = useState<string | null>(null);

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
  const [versionsList, setVersionsList] = useState<DBGenerationVersion[]>([]);
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

  // 1. Fetch Initial Data (Project, Generations, Messages, Versions)
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

    // Load Versions
    fetch(`/api/versions?projectId=${projectId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.versions) {
          setVersionsList(data.versions);
        }
      })
      .catch(console.error);

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

  // 2. Continuous Blender Heartbeat & Status Polling
  useEffect(() => {
    const checkBlenderStatus = async () => {
      try {
        const res = await fetch("/api/blender/status");
        if (res.ok) {
          const data = await res.json();
          if (data.status) setBlenderStatus(data.status);
        }
      } catch {
        setBlenderStatus("OFFLINE");
      }
    };

    checkBlenderStatus();
    const timer = setInterval(checkBlenderStatus, 8000);
    return () => clearInterval(timer);
  }, []);

  // 3. Real Execution Polling Lifecycle
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
            showToast("Executing procedurally in Blender...");
          } else if (data.status === "success") {
            showToast("Blender execution complete!");
          } else if (data.status === "error") {
            showToast("Blender encountered an execution error.");
          }
        }
      } catch (err) {
        console.error("Error polling execution status:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeExecutionId, executionStatus]);

  // 4. Handle Prompt Submit (Unified Text, Modification, or Vision)
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
      /\b(make|change|add|increase|decrease|resize|scale|color|material|bigger|smaller|extend|thinner|wider|darker|lighter)\b/i.test(
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
      } else if (isModification) {
        // CONVERSATIONAL SCENE EDIT FLOW
        setLoadingStage("Planning Surgical Scene Modifications");
        const res = await fetch("/api/ai/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            prompt,
            currentScene: sceneSnapshot || {
              sceneName: "Scene",
              blenderVersion: options.blenderVersion,
              objects: activePlan?.objects || [],
            },
            blenderVersion: options.blenderVersion,
          }),
        });
        const data = await res.json();

        if (res.ok) {
          setActiveCode(data.code.content);
          if (data.patch) {
            setActivePlan({
              intent: "modify_scene",
              summary: data.patch.summary,
              objects: data.patch.affectedObjects.map((name: string) => ({
                name,
                type: "mesh",
                description: "Modified object",
              })),
              steps: [],
              materials: [],
              lighting: [],
              assumptions: [],
              warnings: data.safety?.warnings || [],
            });
          }

          const assistantMsg: ChatItem = {
            id: `ai_${Date.now()}`,
            role: "assistant",
            text: `Surgically updated scene: ${data.patch.summary}`,
            createdAt: timestamp,
          };
          setChatMessages((prev) => [...prev, assistantMsg]);
          showToast("Surgical scene modifications ready for review!");
        } else {
          throw new Error(data.error || "Scene edit failed");
        }
      } else {
        // FULL GENERATION FLOW
        setLoadingStage("Generating Verified Blender Python");
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            prompt,
            style: options.style,
            blenderVersion: options.blenderVersion,
          }),
        });
        const data = await res.json();

        if (res.ok) {
          setActiveCode(data.code.content);
          setActivePlan(data.plan);

          const assistantMsg: ChatItem = {
            id: `ai_${Date.now()}`,
            role: "assistant",
            text: `Here is the structured 3D modeling plan for "${prompt}". Review the code and approve to execute in Blender.`,
            plan: data.plan,
            createdAt: timestamp,
          };
          setChatMessages((prev) => [...prev, assistantMsg]);
          showToast("New model generated!");
        } else {
          throw new Error(data.error || "Generation failed");
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
      setLoadingStage("");
    }
  };

  // 5. Queue Task for Blender Execution Handshake
  const handleQueueTask = async () => {
    if (!activeCode.trim()) {
      showToast("No script available to queue");
      return;
    }

    try {
      const res = await fetch("/api/executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          script: activeCode,
          prompt: activePlan?.summary || "User Approved 3D Modeling Task",
          blenderVersion: project?.blenderVersion || "4.x",
        }),
      });

      const data = await res.json();
      if (res.ok && data.execution) {
        setActiveExecutionId(data.execution.id);
        setExecutionStatus("pending");
        setActiveRightTab("execution");
        showToast("Task queued for Blender add-on!");
      } else {
        showToast(data.error || "Failed to queue task");
      }
    } catch (err) {
      showToast("Network error queueing task");
    }
  };

  // 6. Fix with AI Self-Repair Loop
  const handleFixWithAI = async () => {
    if (!executionStderr && !executionStdout) {
      showToast("No execution error to diagnose");
      return;
    }

    setIsFixing(true);
    try {
      const res = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          error: executionStderr || executionStdout,
          script: activeCode,
          blenderVersion: project?.blenderVersion || "4.x",
        }),
      });

      const data = await res.json();
      if (res.ok && data.correctedCode) {
        setActiveCode(data.correctedCode);
        setActiveRightTab("code");
        showToast("AI repaired the script! Review and re-approve.");
      } else {
        showToast(data.error || "Diagnosis failed");
      }
    } catch (err) {
      showToast("AI diagnosis request failed");
    } finally {
      setIsFixing(false);
    }
  };

  // 7. Handle Template Selected
  const handleSelectTemplate = (tpl: DBTemplate) => {
    setActiveCode(tpl.starterCode);
    if (tpl.starterPlan) {
      setActivePlan(tpl.starterPlan);
    }
    showToast(`Loaded template: ${tpl.title}`);
  };

  // 8. Download Exports (Python, GLB, Plan)
  const handleExport = (format: "py" | "json" | "glb") => {
    if (format === "py") {
      const blob = new Blob([activeCode], { type: "text/x-python" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.name || "sculptor_model"}.py`;
      a.click();
      showToast("Exported Python script!");
    } else if (format === "json") {
      const blob = new Blob([JSON.stringify(activePlan, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.name || "sculptor_plan"}.json`;
      a.click();
      showToast("Exported modeling plan!");
    } else {
      showToast("Use the Blender add-on 'Export 3D Preview' button to export GLB.");
    }
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

      {/* Modals */}
      <OnboardingWizardModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        blenderStatus={blenderStatus}
      />
      <TemplateGalleryModal
        isOpen={isTemplateGalleryOpen}
        onClose={() => setIsTemplateGalleryOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
      <VersionComparisonModal
        isOpen={isVersionComparisonOpen}
        onClose={() => setIsVersionComparisonOpen(false)}
        versions={versionsList}
        onRestoreVersion={(v) => {
          setActiveCode(v.code);
          if (v.planJson) setActivePlan(v.planJson);
          showToast(`Applied Version #${v.versionNumber}`);
        }}
      />

      {/* COLUMN 1: Left Project Sidebar */}
      <ProjectSidebar
        projectId={projectId}
        projectName={project?.name || "SculptorAI Studio"}
        blenderVersion={project?.blenderVersion || "4.x"}
        activeView={activeSidebarView}
        onSelectView={setActiveSidebarView}
        generationsCount={generationHistory.length}
      />

      {/* MAIN STUDIO AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP STUDIO TOOLBAR / HEADER */}
        <header className="h-12 px-4 bg-[#0C0F17] border-b border-[#1C212E] flex items-center justify-between z-10 shrink-0">
          {/* Left: Project title & Blender status badge */}
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F5792A] shadow-glow-orange" />
            <span className="text-sm font-bold text-white tracking-wide">
              {project?.name || "SculptorAI Studio"}
            </span>

            {/* Live Workstation Connection Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131724] border border-[#21273B] text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  blenderStatus === "CONNECTED" || blenderStatus === "IDLE"
                    ? "bg-emerald-400 animate-pulse shadow-glow-emerald"
                    : blenderStatus === "EXECUTING" || blenderStatus === "BUSY"
                    ? "bg-[#00E5FF] animate-spin"
                    : "bg-[#5A667E]"
                }`}
              />
              <span className="text-[#8E9DB8] font-medium">Blender:</span>
              <span
                className={`font-semibold ${
                  blenderStatus === "CONNECTED" || blenderStatus === "IDLE"
                    ? "text-emerald-400"
                    : blenderStatus === "EXECUTING"
                    ? "text-[#00E5FF]"
                    : "text-[#7B879E]"
                }`}
              >
                {blenderStatus === "CONNECTED" || blenderStatus === "IDLE"
                  ? "Connected"
                  : blenderStatus}
              </span>
            </div>
          </div>

          {/* Center: Viewport Mode Switcher */}
          <div className="hidden lg:flex items-center gap-1 bg-[#131724] p-1 rounded-lg border border-[#21273B]">
            <button
              onClick={() => setCenterLayoutView("3d")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                centerLayoutView === "3d"
                  ? "bg-[#252C40] text-[#00E5FF] shadow-sm"
                  : "text-[#7B87A2] hover:text-white"
              }`}
            >
              3D Viewport
            </button>
            <button
              onClick={() => setCenterLayoutView("split")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                centerLayoutView === "split"
                  ? "bg-[#252C40] text-[#00E5FF] shadow-sm"
                  : "text-[#7B87A2] hover:text-white"
              }`}
            >
              Split Studio
            </button>
            <button
              onClick={() => setCenterLayoutView("editor")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                centerLayoutView === "editor"
                  ? "bg-[#252C40] text-[#F5792A] shadow-sm"
                  : "text-[#7B87A2] hover:text-white"
              }`}
            >
              Code Only
            </button>
          </div>

          {/* Right: Actions, Modals, Exports */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsTemplateGalleryOpen(true)}
              className="text-xs text-[#A2ACBF] hover:text-[#00E5FF]"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Templates</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVersionComparisonOpen(true)}
              className="text-xs text-[#A2ACBF] hover:text-[#00E5FF]"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Versions</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOnboardingOpen(true)}
              className="text-xs text-[#A2ACBF]"
              title="First-time setup guide"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </Button>

            <Button
              size="sm"
              variant="primary"
              onClick={handleQueueTask}
              className="text-xs font-semibold px-3 shadow-glow-orange flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Approve & Run</span>
            </Button>
          </div>
        </header>

        {/* 3-COLUMN WORKSPACE BODY */}
        <div className="flex-1 flex overflow-hidden">
          {/* COLUMN A: AI Chat & Prompt Composer (Left) */}
          <div
            className={`w-full md:w-80 lg:w-96 flex flex-col bg-[#0B0D14] border-r border-[#1C212E] ${
              mobileActiveTab === "chat" ? "flex" : "hidden md:flex"
            }`}
          >
            {/* Chat Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
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
            <div className="p-3.5 bg-[#080A0F] border-t border-[#1C212E]">
              <PromptComposer
                onSubmitPrompt={handlePromptSubmit}
                isLoading={isLoading}
                loadingStage={loadingStage}
              />
            </div>
          </div>

          {/* COLUMN B: Center Interactive 3D WebGL Viewer */}
          {(centerLayoutView === "3d" || centerLayoutView === "split") && (
            <div
              className={`flex-1 p-3 bg-[#07090F] flex flex-col min-w-0 ${
                mobileActiveTab === "3d" ? "flex" : "hidden md:flex"
              }`}
            >
              <ThreeDViewer
                modelPlan={activePlan}
                sceneSnapshot={sceneSnapshot}
                onSelectObject={setSelectedObjectName}
                selectedObjectName={selectedObjectName}
              />
            </div>
          )}

          {/* COLUMN C: Right Inspector (Code / Plan / Execution / Diff) */}
          {(centerLayoutView === "editor" || centerLayoutView === "split") && (
            <div
              className={`w-full ${
                centerLayoutView === "split" ? "md:w-96 lg:w-[32rem]" : "flex-1"
              } flex flex-col bg-[#090B12] border-l border-[#1C212E] ${
                mobileActiveTab === "code" || mobileActiveTab === "execution"
                  ? "flex"
                  : "hidden md:flex"
              }`}
            >
              {/* Tab Navigation */}
              <div className="flex items-center justify-between px-3 py-2 bg-[#0E111A] border-b border-[#1B202D]">
                <div className="flex items-center gap-1 bg-[#141825] p-1 rounded-lg border border-[#212739]">
                  <button
                    onClick={() => setActiveRightTab("code")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      activeRightTab === "code"
                        ? "bg-[#252C40] text-white shadow-sm"
                        : "text-[#7B87A2] hover:text-[#CCD2E3]"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-[#F5792A]" />
                    <span>Code</span>
                  </button>

                  <button
                    onClick={() => setActiveRightTab("plan")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      activeRightTab === "plan"
                        ? "bg-[#252C40] text-white shadow-sm"
                        : "text-[#7B87A2] hover:text-[#CCD2E3]"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-[#00E5FF]" />
                    <span>Plan</span>
                  </button>

                  <button
                    onClick={() => setActiveRightTab("execution")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      activeRightTab === "execution"
                        ? "bg-[#252C40] text-white shadow-sm"
                        : "text-[#7B87A2] hover:text-[#CCD2E3]"
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Run</span>
                    {executionStatus === "success" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>

                  {selectedHistoryVersion && (
                    <button
                      onClick={() => setActiveRightTab("diff")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        activeRightTab === "diff"
                          ? "bg-[#252C40] text-white shadow-sm"
                          : "text-[#7B87A2] hover:text-[#CCD2E3]"
                      }`}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-violet-400" />
                      <span>Diff</span>
                    </button>
                  )}
                </div>

                {/* Quick Export Menu */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleExport("py")}
                    className="text-xs text-[#A2ACBF] hover:text-white"
                    title="Download Python Script"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Tab Content Body */}
              <div className="flex-1 p-3 overflow-y-auto">
                {activeRightTab === "code" && (
                  <CodeViewer
                    code={activeCode}
                    onCodeChange={setActiveCode}
                    onApproveAndRun={handleQueueTask}
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
          )}
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
          onClick={() => setMobileActiveTab("3d")}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            mobileActiveTab === "3d" ? "text-[#00E5FF] font-bold" : "text-[#7A86A1]"
          }`}
        >
          <Box className="w-4 h-4" />
          <span>3D View</span>
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
