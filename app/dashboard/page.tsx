"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Plus,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  Radio,
  FileCode,
  Zap,
  Search,
  LogOut,
  SlidersHorizontal,
  Coffee,
  Plane,
  Trees,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils/cn";
import { useAuth } from "@/components/auth/AuthProvider";

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  blenderVersion: string;
  createdAt: string;
  updatedAt: string;
  generationCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut, isDemoMode } = useAuth();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [stats, setStats] = useState<{
    totalProjects: number;
    totalGenerations: number;
    successfulExecutions: number;
    failedExecutions: number;
    recentGenerations: Array<{ id: string; title: string; projectName: string; status: string; createdAt: string }>;
  }>({
    totalProjects: 0,
    totalGenerations: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    recentGenerations: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectVersion, setNewProjectVersion] = useState("4.x");
  const [isCreating, setIsCreating] = useState(false);

  const fetchDashboardData = () => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) setProjects(data.projects);
      })
      .catch((err) => console.error("Could not fetch projects:", err));

    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data) setStats(data);
      })
      .catch((err) => console.error("Could not fetch stats:", err));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
          blenderVersion: newProjectVersion,
        }),
      });
      const created = await res.json();
      if (res.ok) {
        setProjects((prev) => [created, ...prev]);
        setIsModalOpen(false);
        setNewProjectName("");
        setNewProjectDesc("");
        router.push(`/projects/${created.id}`);
      }
    } catch (err) {
      console.error("Create project error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickCreate = (name: string, desc: string) => {
    setNewProjectName(name);
    setNewProjectDesc(desc);
    setIsModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#07080C] text-[#E2E6F2]">
      {/* Top Bar */}
      <header className="px-8 py-4 bg-[#0A0C13] border-b border-[#1C212E] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#F5792A] to-[#E0681B] flex items-center justify-center text-white shadow-glow-orange">
              <Box className="w-5 h-5" />
            </div>
            <span className="font-bold text-base tracking-wider text-white">
              SCULPTOR<span className="text-[#F5792A]">AI</span>
            </span>
          </Link>
          <span className="text-xs text-[#6B7790] ml-2">/ Dashboard</span>
          {isDemoMode && (
            <Badge variant="cyan" className="ml-2 text-[10px]">
              Demo Mode
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111420] border border-[#212739] text-xs hover:border-[#F5792A]/50 transition-colors"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[#CCD2E3]">Blender Add-on:</span>
            <span className="font-mono text-emerald-400">Ready</span>
          </Link>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-semibold px-3.5 shadow-glow-orange"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </Button>

          <div className="flex items-center gap-2 pl-3 border-l border-[#1F2536]">
            <span className="text-xs text-[#A2ACBF] hidden sm:inline">
              {user?.email || "artist@sculptor.ai"}
            </span>
            <button
              onClick={handleSignOut}
              className="text-[#6E7B95] hover:text-white p-1 rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-8 py-10 space-y-10">
        {/* Welcome & Stats Row */}
        <div>
          <h1 className="text-2xl font-extrabold text-white">Welcome back</h1>
          <p className="text-xs text-[#7A86A1] mt-1">
            Pick up where you left off or create a new procedural modeling plan.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
            <div className="p-5 rounded-2xl bg-[#0E111A] border border-[#202638] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[#7A86A1] uppercase tracking-wider">
                  Total Projects
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {projects.length}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#F5792A]/20 text-[#F5792A] flex items-center justify-center">
                <Box className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0E111A] border border-[#202638] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[#7A86A1] uppercase tracking-wider">
                  Total Generations
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {stats.totalGenerations}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/20 text-[#00E5FF] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0E111A] border border-[#202638] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[#7A86A1] uppercase tracking-wider">
                  Blender Target
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">4.x / 3.6 LTS</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Starter Templates */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7A86A1] mb-3">
            Quick Starter Projects
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() =>
                handleQuickCreate(
                  "Ceramic Coffee Mug",
                  "Low-poly ceramic coffee mug with handle and studio lighting"
                )
              }
              className="p-3.5 rounded-xl bg-[#0E111A] border border-[#202638] hover:border-[#F5792A]/50 text-left transition-all flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F5792A]/15 text-[#F5792A] flex items-center justify-center shrink-0">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white group-hover:text-[#F5792A]">
                  Ceramic Mug Kit
                </h4>
                <p className="text-[10px] text-[#7A86A1] mt-0.5">
                  Primitive lathe + handle bevel
                </p>
              </div>
            </button>

            <button
              onClick={() =>
                handleQuickCreate(
                  "Sci-Fi Quad Drone",
                  "Surveillance drone with 4 wing assemblies and emissive thrusters"
                )
              }
              className="p-3.5 rounded-xl bg-[#0E111A] border border-[#202638] hover:border-[#00E5FF]/50 text-left transition-all flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/15 text-[#00E5FF] flex items-center justify-center shrink-0">
                <Plane className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white group-hover:text-[#00E5FF]">
                  Sci-Fi Quad Drone
                </h4>
                <p className="text-[10px] text-[#7A86A1] mt-0.5">
                  Hard-surface symmetry modifiers
                </p>
              </div>
            </button>

            <button
              onClick={() =>
                handleQuickCreate(
                  "Low-Poly Forest Kit",
                  "Procedural pine trees and boulder variations for game dev"
                )
              }
              className="p-3.5 rounded-xl bg-[#0E111A] border border-[#202638] hover:border-emerald-500/50 text-left transition-all flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <Trees className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white group-hover:text-emerald-400">
                  Low-Poly Nature Kit
                </h4>
                <p className="text-[10px] text-[#7A86A1] mt-0.5">
                  Cone primitives & facet shading
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Projects Section with Search */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Projects</h2>
              <p className="text-xs text-[#7A86A1] mt-0.5">
                Select a project to enter the 3-column AI Studio workspace.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#5A667E] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#141825] border border-[#23293D] text-white text-xs focus:outline-none focus:border-[#F5792A]"
              />
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((proj) => (
              <Link
                key={proj.id}
                href={`/projects/${proj.id}`}
                className="group p-5 rounded-2xl bg-[#0E111A] border border-[#202638] hover:border-[#F5792A]/50 transition-all hover:shadow-glow-orange flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="orange" className="text-[10px]">
                      Blender {proj.blenderVersion}
                    </Badge>
                    <span className="text-[11px] text-[#69748D] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(proj.updatedAt)}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white mt-3 group-hover:text-[#F5792A] transition-colors">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-[#828FA8] mt-1.5 line-clamp-2 leading-relaxed">
                    {proj.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#1C212E] flex items-center justify-between text-xs text-[#8C98B2]">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#00E5FF]" />
                    <span>{proj.generationCount || 2} generations</span>
                  </span>
                  <span className="flex items-center text-[#F5792A] font-medium group-hover:translate-x-1 transition-transform">
                    <span>Open Studio</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}

            {filteredProjects.length === 0 && (
              <div className="col-span-full p-8 text-center bg-[#0E111A] border border-[#202638] rounded-2xl text-[#6B7790] text-xs">
                No projects matched your search &quot;{searchTerm}&quot;.
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Recent Generations</h2>
          {stats.recentGenerations.length > 0 ? (
            <div className="rounded-2xl bg-[#0E111A] border border-[#202638] divide-y divide-[#1B202E] overflow-hidden">
              {stats.recentGenerations.map((gen) => (
                <div
                  key={gen.id}
                  className="p-4 flex items-center justify-between hover:bg-[#131622] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#181D2B] text-[#00E5FF] flex items-center justify-center">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">
                        {gen.title}
                      </h4>
                      <span className="text-[10px] text-[#6E7B95]">
                        Project: {gen.projectName} • {formatDate(gen.createdAt)}
                      </span>
                    </div>
                  </div>

                  <Badge variant="emerald" className="text-[10px]">
                    {gen.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#0E111A] border border-[#202638] rounded-2xl text-[#6B7790] text-xs">
              No recent generations yet. Open a project studio to start generating 3D models.
            </div>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Blender Project"
        description="Set up a workspace for procedural modeling and script generation."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#CCD2E3] mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Sci-Fi Vehicle Asset Kit"
              className="w-full px-3 py-2 rounded-lg bg-[#151926] border border-[#262E44] text-white text-xs focus:outline-none focus:border-[#F5792A]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#CCD2E3] mb-1">
              Description (Optional)
            </label>
            <textarea
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              placeholder="Describe the scope or goals of this 3D project..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[#151926] border border-[#262E44] text-white text-xs focus:outline-none focus:border-[#F5792A] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#CCD2E3] mb-1">
              Target Blender Version
            </label>
            <select
              value={newProjectVersion}
              onChange={(e) => setNewProjectVersion(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#151926] border border-[#262E44] text-white text-xs focus:outline-none focus:border-[#F5792A]"
            >
              <option value="4.x">Blender 4.x (Latest)</option>
              <option value="3.6">Blender 3.6 LTS</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2333]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isCreating}
              className="text-xs font-semibold"
            >
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
