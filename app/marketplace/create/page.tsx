"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  FileCode,
  Layers,
  Sliders,
  CheckCircle,
  AlertTriangle,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { scanTemplateSecurity } from "@/lib/marketplace/security-scanner";
import { TemplateCategory } from "@/types/marketplace";

const CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: "procedural", label: "Procedural Generator" },
  { id: "materials", label: "Materials & Shaders" },
  { id: "environment", label: "Environment & Scenery" },
  { id: "architecture", label: "Architecture & Structures" },
  { id: "characters", label: "Characters & Anatomy" },
  { id: "game_assets", label: "Game Assets & Props" },
  { id: "vehicles", label: "Vehicles & Transport" },
  { id: "animation", label: "Animation & Rigs" },
];

const DEFAULT_STARTER_SCRIPT = `import bpy

# Clean up scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Create procedural object
bpy.ops.mesh.primitive_torus_add(major_radius=2.0, minor_radius=0.5)
torus = bpy.context.active_object
torus.name = "MyProceduralModel"

# Add bevel & subdivision
sub_mod = torus.modifiers.new(name="Subsurf", type='SUBSURF')
sub_mod.levels = 2

# Apply smooth shading
bpy.ops.object.shade_smooth()
`;

export default function CreateTemplatePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("procedural");
  const [tagsInput, setTagsInput] = useState("procedural, blender, model");
  const [thumbnailUrl, setThumbnailUrl] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60");
  const [license, setLicense] = useState("MIT");
  const [script, setScript] = useState(DEFAULT_STARTER_SCRIPT);
  const [authorName, setAuthorName] = useState("Community Creator");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Live security scan result
  const [scanResult, setScanResult] = useState(() =>
    scanTemplateSecurity(DEFAULT_STARTER_SCRIPT, {
      filesystem: false,
      network: false,
      external_process: false,
      blender_api: true,
      geometry: true,
      materials: true,
      modifiers: true,
    })
  );

  useEffect(() => {
    const res = scanTemplateSecurity(script, {
      filesystem: false,
      network: false,
      external_process: false,
      blender_api: true,
      geometry: true,
      materials: true,
      modifiers: true,
    });
    setScanResult(res);
  }, [script]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !script.trim()) {
      setSubmitError("Please fill in title, description, and Python script.");
      return;
    }

    if (!scanResult.safe) {
      setSubmitError("Template script failed security scan. Please remove prohibited operations.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch("/api/marketplace/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          tags,
          thumbnailUrl,
          license,
          authorName,
          initialVersion: {
            version: "1.0.0",
            script,
            capabilities: scanResult.capabilities,
            changelog: "Initial verified release",
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to publish template");
      }

      const { template } = await res.json();
      router.push(`/marketplace/${template.slug}`);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to publish");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Marketplace
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-sm font-semibold text-white">Publish New Template</span>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting || !scanResult.safe}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/25 flex items-center gap-2"
        >
          <UploadCloud className="w-4 h-4" /> {submitting ? "Publishing..." : "Publish Template"}
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Metadata & Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-white">Publish to Community</h1>
              <p className="text-xs text-slate-400">
                Share your procedural generator, shaders, or scene builders with thousands of 3D creators worldwide.
              </p>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Template Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Procedural Crystal Cluster Generator"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500 placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    License
                  </label>
                  <select
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                  >
                    <option value="MIT">MIT License</option>
                    <option value="CC0">CC0 (Public Domain)</option>
                    <option value="CC-BY">Creative Commons BY 4.0</option>
                    <option value="Custom">Custom Sculptor License</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description *
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain what this generator builds, key parameters, and how to use it..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 placeholder:text-slate-600 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="procedural, crystal, scifi"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Author Display Name
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Thumbnail Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Python Script Input */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-sm text-white">Blender Python Script (bpy) *</h3>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {script.length.toLocaleString()} characters
                </span>
              </div>

              <textarea
                rows={12}
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-cyan-200 outline-none focus:border-cyan-500 resize-y leading-relaxed"
                required
              />
            </div>
          </div>

          {/* Right Column: Live Security Verification Scanner (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-5 sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  {scanResult.safe ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                  )}
                  <h3 className="font-bold text-sm text-white">Live AST Security Scan</h3>
                </div>

                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    scanResult.safe
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  Score: {scanResult.score}/100
                </span>
              </div>

              {/* Status message */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  scanResult.safe
                    ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/5 border-rose-500/30 text-rose-300"
                }`}
              >
                {scanResult.safe ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">
                    {scanResult.safe ? "Approved for Publishing" : "Security Policy Violations"}
                  </p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {scanResult.safe
                      ? "This Python script adheres to all security sandboxing policies and only uses authorized Blender APIs."
                      : "The script attempts prohibited operations. Resolve the violations below to publish."}
                  </p>
                </div>
              </div>

              {/* Violations List */}
              {scanResult.violations.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-rose-400">Violations Detected:</span>
                  <ul className="space-y-1">
                    {scanResult.violations.map((v: string, i: number) => (
                      <li
                        key={i}
                        className="text-[11px] p-2 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono"
                      >
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detected Capabilities */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300">
                  Detected Capabilities:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Blender API:</span>
                    <span className={scanResult.capabilities.blender_api ? "text-cyan-400 font-bold" : "text-slate-600"}>
                      {scanResult.capabilities.blender_api ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Geometry:</span>
                    <span className={scanResult.capabilities.geometry ? "text-cyan-400 font-bold" : "text-slate-600"}>
                      {scanResult.capabilities.geometry ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Materials:</span>
                    <span className={scanResult.capabilities.materials ? "text-cyan-400 font-bold" : "text-slate-600"}>
                      {scanResult.capabilities.materials ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Modifiers:</span>
                    <span className={scanResult.capabilities.modifiers ? "text-cyan-400 font-bold" : "text-slate-600"}>
                      {scanResult.capabilities.modifiers ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || !scanResult.safe}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-2.5 shadow-lg shadow-cyan-500/25"
              >
                {submitting ? "Publishing..." : "Submit & Publish Template"}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
