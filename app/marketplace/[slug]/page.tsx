/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Sparkles,
  ShieldCheck,
  Star,
  Download,
  Share2,
  Heart,
  Sliders,
  CheckCircle,
  FileCode,
  ArrowLeft,
  Play,
  Layers,
  Terminal,
  AlertTriangle,
  Lock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { MarketplaceTemplate, TemplateVersion } from "@/types/marketplace";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function TemplateDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { slug } = use(params);

  const [template, setTemplate] = useState<MarketplaceTemplate | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parameter State
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [usingTemplate, setUsingTemplate] = useState(false);

  // Review State
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/marketplace/templates/${slug}`);
      if (!res.ok) {
        throw new Error("Template not found");
      }
      const data = await res.json();
      const tpl: MarketplaceTemplate = data.template;
      setTemplate(tpl);
      if (tpl.versions && tpl.versions.length > 0) {
        setSelectedVersion(tpl.versions[0]);
        // Initialize default parameter values
        const defaults: Record<string, any> = {};
        tpl.versions[0].parameterSchema.forEach((p: any) => {
          defaults[p.name] = p.default;
        });
        setParamValues(defaults);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load template");
    } finally {
      setLoading(false);
    }
  };

  const handleParamChange = (name: string, value: any) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleFavorite = async () => {
    if (!template) return;
    try {
      const res = await fetch(`/api/marketplace/templates/${slug}/favorite`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.isFavorited);
        setTemplate((prev: MarketplaceTemplate | null) =>
          prev
            ? {
                ...prev,
                favorites: data.isFavorited ? prev.favorites + 1 : Math.max(0, prev.favorites - 1),
              }
            : null
        );
      }
    } catch (err) {
      console.error("Favorite toggle error:", err);
    }
  };

  const handleUseTemplate = async () => {
    if (!template || !selectedVersion) return;
    try {
      setUsingTemplate(true);
      const res = await fetch(`/api/marketplace/templates/${slug}/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId: selectedVersion.id,
          parameterValues: paramValues,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to dispatch template");
      }

      const data = await res.json();
      setIsUseModalOpen(false);
      // Route user to project studio with execution task loaded
      router.push(`/projects/${data.projectId}?executionId=${data.executionId}`);
    } catch (err: any) {
      alert(`Error using template: ${err.message}`);
    } finally {
      setUsingTemplate(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;
    try {
      setSubmittingReview(true);
      const res = await fetch(`/api/marketplace/templates/${slug}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: newRating, comment: newComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setTemplate((prev: MarketplaceTemplate | null) =>
          prev
            ? {
                ...prev,
                reviews: [data.review, ...prev.reviews],
                reviewCount: prev.reviewCount + 1,
              }
            : null
        );
        setNewComment("");
      }
    } catch (err) {
      console.error("Submit review error:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading asset template...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold">Template Not Found</h2>
          <p className="text-sm text-slate-400">{error || "The requested template does not exist."}</p>
          <Link href="/marketplace">
            <Button variant="secondary" size="sm">
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Marketplace
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-sm font-semibold text-white truncate max-w-xs">{template.title}</span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleFavorite}
            className={`flex items-center gap-1.5 ${isFavorited ? "text-rose-400" : "text-slate-400"}`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? "fill-rose-500" : ""}`} />
            <span className="text-xs">{template.favorites}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsUseModalOpen(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/25 flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" /> Use Template
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Visual Preview & Parameter Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Visual Display */}
          <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="relative h-80 sm:h-96 w-full bg-slate-950 overflow-hidden">
              <img
                src={template.thumbnailUrl}
                alt={template.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Badge variant="cyan" className="font-bold text-xs uppercase">
                  {template.category}
                </Badge>
                <Badge variant="emerald" className="text-xs flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> AST Verified Safe
                </Badge>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Blender Compatibility</span>
                  <p className="text-sm font-semibold text-white">Blender 4.0 - 4.3 LTS</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsUseModalOpen(true)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950 mr-1.5" /> Send to Blender
                </Button>
              </div>
            </div>
          </div>

          {/* Interactive Parameters Schema Configurator */}
          {selectedVersion && selectedVersion.parameterSchema.length > 0 && (
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-sm text-white">Live Parameter Schema</h3>
                </div>
                <span className="text-xs text-slate-400">
                  Custom parameters injected directly into Python script
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedVersion.parameterSchema.map((param: any) => (
                  <div key={param.name} className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">{param.label}</span>
                      <span className="text-cyan-400 font-mono font-semibold">
                        {String(paramValues[param.name] ?? param.default)}
                      </span>
                    </div>

                    {param.type === "number" ? (
                      <input
                        type="range"
                        min={param.min ?? 0}
                        max={param.max ?? 100}
                        step={param.step ?? 1}
                        value={paramValues[param.name] ?? param.default}
                        onChange={(e) => handleParamChange(param.name, parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    ) : param.type === "boolean" ? (
                      <button
                        type="button"
                        onClick={() => handleParamChange(param.name, !paramValues[param.name])}
                        className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          paramValues[param.name]
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {paramValues[param.name] ? "Enabled" : "Disabled"}
                      </button>
                    ) : param.type === "select" ? (
                      <select
                        value={paramValues[param.name] ?? param.default}
                        onChange={(e) => handleParamChange(param.name, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs p-1.5 text-slate-300 outline-none focus:border-cyan-500"
                      >
                        {param.options?.map((opt: string) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={paramValues[param.name] ?? param.default}
                        onChange={(e) => handleParamChange(param.name, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs p-1.5 text-slate-300 outline-none focus:border-cyan-500"
                      />
                    )}

                    {param.description && (
                      <p className="text-[10px] text-slate-500">{param.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Python Script Preview */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Blender Python Script</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {selectedVersion?.script.length.toLocaleString()} bytes
              </span>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-72 scrollbar-thin">
              <code>{selectedVersion?.script}</code>
            </pre>
          </div>
        </div>

        {/* Right Column: Metadata, Security Scorecard & Reviews (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Info Card */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{template.title}</h1>
              <p className="text-xs text-slate-400 leading-relaxed">{template.description}</p>
            </div>

            {/* Creator & Stats */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                  {template.authorName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-200">{template.authorName}</p>
                  <p className="text-[10px] text-slate-500">Verified Creator</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="font-bold">{template.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold">{template.downloads}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {template.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <Button
              onClick={() => setIsUseModalOpen(true)}
              className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-2.5 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" /> Use Template In Project
            </Button>
          </div>

          {/* Security Audit Scorecard */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">AST Security Audit</h3>
              </div>
              <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Score: 100/100
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Sandboxed Execution
                </span>
                <span className="text-emerald-400 font-semibold">Enforced</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> Filesystem & Network Access
                </span>
                <span className="text-slate-400 font-mono">Blocked</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Subprocess / Shell Execution
                </span>
                <span className="text-slate-400 font-mono">None</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Blender API Capabilities
                </span>
                <span className="text-cyan-400 font-mono">bpy.ops, mesh, mat</span>
              </div>
            </div>
          </div>

          {/* Reviews & Ratings Section */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> Community Reviews ({template.reviews.length})
              </h3>
            </div>

            {/* Review Input */}
            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setNewRating(s)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          s <= newRating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-700"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={2}
                placeholder="Leave feedback on this template..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 placeholder:text-slate-600 resize-none"
              />

              <Button
                type="submit"
                size="sm"
                disabled={submittingReview || !newComment.trim()}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs"
              >
                {submittingReview ? "Submitting..." : "Post Review"}
              </Button>
            </form>

            {/* Reviews List */}
            <div className="space-y-3 pt-2 max-h-60 overflow-y-auto scrollbar-thin">
              {template.reviews.map((rev: any) => (
                <div key={rev.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{rev.userName}</span>
                    <div className="flex items-center gap-0.5">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Use Template Modal */}
      <Modal
        isOpen={isUseModalOpen}
        onClose={() => setIsUseModalOpen(false)}
        title="Apply Template to Blender Project"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            This will copy the verified Python generator into an execution task with your configured parameters and broadcast it directly to your connected Blender add-on.
          </p>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Template:</span>
              <span className="font-semibold text-white">{template.title}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-300">
              <span>Version:</span>
              <span className="font-mono text-cyan-400">{selectedVersion?.version}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-300">
              <span>Applied Parameters:</span>
              <span className="font-semibold text-white">
                {Object.keys(paramValues).length} custom values
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsUseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={usingTemplate}
              onClick={handleUseTemplate}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4"
            >
              {usingTemplate ? "Injecting into Project..." : "Confirm & Send to Studio"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
