"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Box,
  Terminal,
  CheckCircle,
  Scan,
  Wrench,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Play,
  Copy,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function LandingPage() {
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  const workflowSteps = [
    {
      title: "1. Natural Description",
      desc: "Type what you want or drop a reference photograph.",
      prompt: "Create a low-poly cyber desk with monitor mount and RGB LED strip",
      badge: "Prompt Input",
    },
    {
      title: "2. Procedural Plan & bpy",
      desc: "SculptorAI formulates a verified hierarchy, materials, and clean Python.",
      prompt: "Generated 3 objects, 2 Principled BSDF shaders, and camera framing.",
      badge: "AI Plan Engine",
    },
    {
      title: "3. User Review & Approval",
      desc: "Untrusted code is NEVER auto-run. You inspect before approving.",
      prompt: "Verified bpy code with context guards and collection isolation.",
      badge: "Safety Gate",
    },
    {
      title: "4. Build in Blender",
      desc: "Blender executes natively via add-on. Automatic AI repair if errors occur.",
      prompt: "✓ Mesh created in 240ms. Revert anytime with Blender Undo (Ctrl+Z).",
      badge: "Blender 4.x Native",
    },
  ];

  return (
    <div className="min-h-screen bg-[#07080C] text-[#E2E6F2] selection:bg-[#F5792A]/30">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#090A0F]/80 backdrop-blur-md border-b border-[#1A1F2D]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#F5792A] to-[#E0681B] flex items-center justify-center text-white shadow-glow-orange">
              <Box className="w-5 h-5" />
            </div>
            <span className="font-bold text-base tracking-wider text-white">
              SCULPTOR<span className="text-[#F5792A]">AI</span>
            </span>
            <Badge variant="orange" className="ml-2 hidden sm:inline-flex text-[10px]">
              Copilot for Blender
            </Badge>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-[#929EB6]">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#addon" className="hover:text-white transition-colors">
              Blender Add-on
            </a>
            <a href="#use-cases" className="hover:text-white transition-colors">
              Use Cases
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button size="sm" variant="ghost" className="text-xs">
                Sign In
              </Button>
            </Link>
            <Link href="/projects/proj_cyberpunk_desk">
              <Button size="sm" variant="primary" className="text-xs font-semibold">
                Launch Studio
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#F5792A]/15 via-[#00E5FF]/10 to-transparent blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161B29] border border-[#273046] text-xs text-[#00E5FF] mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Operating Layer for Blender</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Describe what you want.{" "}
            <span className="bg-gradient-to-r from-[#F5792A] via-[#FA8A3D] to-[#00E5FF] bg-clip-text text-transparent">
              Build it in Blender.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#8E9BB5] max-w-2xl mx-auto leading-relaxed">
            SculptorAI translates your creative vision and reference photos into
            rigorous modeling plans, production Blender Python, and one-click
            Blender executions with native error debugging.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/projects/proj_cyberpunk_desk">
              <Button size="lg" variant="primary" className="font-semibold text-sm px-6 shadow-glow-orange">
                Start Creating Free
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="text-sm px-6">
                Explore Dashboard
              </Button>
            </Link>
          </div>

          {/* Interactive Pipeline Showcase */}
          <div className="mt-16 max-w-4xl mx-auto rounded-2xl bg-[#0D1018] border border-[#232A3E] p-4 sm:p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2536]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs font-mono text-[#6E7B95] ml-2">
                  SculptorAI Copilot Pipeline
                </span>
              </div>
              <Badge variant="cyan" className="font-mono text-[10px]">
                Interactive Flow
              </Badge>
            </div>

            {/* Steps Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {workflowSteps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveWorkflowStep(idx)}
                  className={`p-2.5 rounded-lg text-left transition-all border ${
                    activeWorkflowStep === idx
                      ? "bg-[#1B2132] border-[#F5792A] text-white"
                      : "bg-[#111420] border-[#1D2334] text-[#78859F] hover:text-white"
                  }`}
                >
                  <div className="text-[10px] font-bold text-[#F5792A] uppercase">
                    {step.badge}
                  </div>
                  <div className="text-xs font-semibold mt-0.5 truncate">
                    {step.title}
                  </div>
                </button>
              ))}
            </div>

            {/* Active Display Window */}
            <div className="mt-4 p-4 rounded-xl bg-[#080A10] border border-[#1C2130] font-mono text-xs">
              <div className="text-[#64718C] text-[11px] mb-1">
                // Step {activeWorkflowStep + 1} State
              </div>
              <p className="text-emerald-400 font-semibold">
                {workflowSteps[activeWorkflowStep].desc}
              </p>
              <div className="mt-3 p-3 rounded-lg bg-[#10131E] border border-[#1F2538] text-[#CCD2E3]">
                {workflowSteps[activeWorkflowStep].prompt}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-6 border-t border-[#161B29] bg-[#0A0D15]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#F5792A]">
              Deterministic Workflow
            </h2>
            <h3 className="text-3xl font-extrabold text-white mt-2">
              From Idea to Native Blender Scene in Seconds
            </h3>
            <p className="text-xs text-[#828FA8] mt-2">
              Not a black-box video generator. Real Blender Python you can inspect, modify, and own.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0F121C] border border-[#212739] hover:border-[#38425E] transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#F5792A]/20 text-[#F5792A] flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-white">1. Describe or Drop Photo</h4>
              <p className="text-xs text-[#8A96AE] mt-2 leading-relaxed">
                Describe desired geometry, lighting, and materials in natural English, or drop a photograph for computer vision analysis.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F121C] border border-[#212739] hover:border-[#38425E] transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/20 text-[#00E5FF] flex items-center justify-center mb-4">
                <Terminal className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-white">2. Inspect Modeling Plan</h4>
              <p className="text-xs text-[#8A96AE] mt-2 leading-relaxed">
                Receive hierarchical object breakdowns, modifier recommendations, Principled BSDF setups, and executable Python scripts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F121C] border border-[#212739] hover:border-[#38425E] transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Play className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-white">3. Approve &amp; Build</h4>
              <p className="text-xs text-[#8A96AE] mt-2 leading-relaxed">
                Click &quot;Approve &amp; Run&quot; inside the native Blender sidebar. If an error occurs, the AI diagnostician fixes it automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#00E5FF]">
              Engineered for 3D Artists
            </h2>
            <h3 className="text-3xl font-extrabold text-white mt-2">
              Everything Needed to Supercharge Blender
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0E111A] border border-[#202638]">
              <Layers className="w-6 h-6 text-[#F5792A] mb-3" />
              <h4 className="text-sm font-semibold text-white">AI Modeling Planner</h4>
              <p className="text-xs text-[#828FA8] mt-1.5 leading-relaxed">
                Generates modular hierarchies, dimension estimates, and modifier sequences before writing any script.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0E111A] border border-[#202638]">
              <Scan className="w-6 h-6 text-[#00E5FF] mb-3" />
              <h4 className="text-sm font-semibold text-white">Image Understanding</h4>
              <p className="text-xs text-[#828FA8] mt-1.5 leading-relaxed">
                Reconstructs object silhouettes and shapes from photos with transparent uncertainty limitations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0E111A] border border-[#202638]">
              <Wrench className="w-6 h-6 text-amber-400 mb-3" />
              <h4 className="text-sm font-semibold text-white">Blender Error Fixer</h4>
              <p className="text-xs text-[#828FA8] mt-1.5 leading-relaxed">
                Paste tracebacks or let the add-on report them. Diagnoses root causes and returns working patches.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0E111A] border border-[#202638]">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3" />
              <h4 className="text-sm font-semibold text-white">Explicit Safety Gate</h4>
              <p className="text-xs text-[#828FA8] mt-1.5 leading-relaxed">
                Untrusted Python is never run silently. Artists retain full control with explicit Approve &amp; Run gates.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0E111A] border border-[#202638]">
              <Box className="w-6 h-6 text-[#F5792A] mb-3" />
              <h4 className="text-sm font-semibold text-white">PBR Material Engine</h4>
              <p className="text-xs text-[#828FA8] mt-1.5 leading-relaxed">
                Constructs modern Principled BSDF node trees with roughness, metallic, and emission presets.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0E111A] border border-[#202638]">
              <Zap className="w-6 h-6 text-[#00E5FF] mb-3" />
              <h4 className="text-sm font-semibold text-white">Native Blender Add-on</h4>
              <p className="text-xs text-[#828FA8] mt-1.5 leading-relaxed">
                Integrates directly into Blender&apos;s 3D View sidebar. Send prompts, preview code, and run without leaving Blender.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="use-cases" className="py-20 px-6 bg-[#090C14] border-t border-[#161B29]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#F5792A]">
              Who is SculptorAI for?
            </h2>
            <h3 className="text-3xl font-extrabold text-white mt-2">
              Empowering 3D Creators Across Industries
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { role: "Students", desc: "Learn Blender workflows & bpy syntax" },
              { role: "3D Artists", desc: "Speed up procedural scene blockouts" },
              { role: "Indie Devs", desc: "Generate game-ready low-poly props" },
              { role: "Product Designers", desc: "Rapid concept iteration & materials" },
              { role: "Architects", desc: "Procedural layouts and lighting setups" },
              { role: "Technical Artists", desc: "Automate repetitive Blender scripts" },
            ].map((uc, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#10131E] border border-[#1F2538] text-center">
                <h5 className="text-xs font-bold text-white">{uc.role}</h5>
                <p className="text-[11px] text-[#7A86A1] mt-1">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <footer className="py-16 px-6 border-t border-[#1C212E] bg-[#06080E] text-center">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to experience the future of Blender?
          </h3>
          <p className="text-xs text-[#828FA8] mt-2">
            No credit card required. Connect the add-on and start creating in minutes.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/projects/proj_cyberpunk_desk">
              <Button size="lg" variant="primary" className="font-semibold text-xs px-6 shadow-glow-orange">
                Launch SculptorAI Studio
              </Button>
            </Link>
          </div>

          <div className="mt-12 text-[11px] text-[#556077]">
            © {new Date().getFullYear()} SculptorAI. Built for Blender creators worldwide.
          </div>
        </div>
      </footer>
    </div>
  );
}
