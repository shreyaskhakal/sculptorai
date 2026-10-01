/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  ShieldCheck,
  Star,
  Download,
  Tag,
  Box,
  Plus,
  ArrowRight,
  Filter,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MarketplaceTemplate, TemplateCategory } from "@/types/marketplace";

const CATEGORIES: { id: TemplateCategory | "all"; label: string }[] = [
  { id: "all", label: "All Assets" },
  { id: "procedural", label: "Procedural" },
  { id: "materials", label: "Materials & Shaders" },
  { id: "environment", label: "Environments" },
  { id: "architecture", label: "Architecture" },
  { id: "characters", label: "Characters" },
  { id: "game_assets", label: "Game Assets" },
];

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "rating">("popular");

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortBy]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (search.trim()) params.set("search", search.trim());
      params.set("sort", sortBy);

      const res = await fetch(`/api/marketplace/templates?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTemplates();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">SculptorAI</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-sm font-semibold text-cyan-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Community Marketplace
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              Studio Dashboard
            </Button>
          </Link>
          <Link href="/marketplace/create">
            <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/25 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Publish Template
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Header */}
      <div className="relative border-b border-slate-800 bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950 px-6 py-12 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% AST Sandboxed & AST Capability Verified
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Blender 3D Asset & Scene Marketplace
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">
            Discover, preview, and inject procedural generators, hyper-realistic shaders, and complete scenes directly into your Blender projects with single-click dispatch.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="pt-2 max-w-xl mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search procedural cities, neon materials, vehicles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm placeholder:text-slate-500 transition-colors shadow-inner"
              />
            </div>
            <Button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-5">
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Category Pills & Sort */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg text-xs px-2.5 py-1.5 text-slate-300 outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest Releases</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse flex flex-col p-4 space-y-4"
              >
                <div className="w-full h-44 rounded-xl bg-slate-800/60" />
                <div className="h-5 w-2/3 bg-slate-800/80 rounded" />
                <div className="h-4 w-full bg-slate-800/40 rounded" />
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Box className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300">No templates found</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Try adjusting your search query or category filters, or be the first to publish one!
            </p>
            <Link href="/marketplace/create">
              <Button size="sm" className="mt-2 bg-cyan-500 text-slate-950 font-semibold">
                Publish a Template
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl) => (
              <Link
                key={tpl.id}
                href={`/marketplace/${tpl.slug}`}
                className="group relative rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 flex flex-col overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                  <img
                    src={tpl.thumbnailUrl}
                    alt={tpl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <Badge variant="cyan" className="text-[10px] uppercase font-bold tracking-wider">
                      {tpl.category}
                    </Badge>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      100% Safe
                    </span>
                  </div>

                  {/* Bottom Stats Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-semibold text-white">{tpl.rating.toFixed(1)}</span>
                      <span className="text-slate-400">({tpl.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{tpl.downloads.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                      {tpl.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tpl.tags.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/50"
                      >
                        #{tag}
                      </span>
                    ))}
                    {tpl.tags.length > 3 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{tpl.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-cyan-400 border border-slate-700">
                        {tpl.authorName.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-300 truncate max-w-[120px]">
                        {tpl.authorName}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1 text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      View Template <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
