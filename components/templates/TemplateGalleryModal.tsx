"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, Layers, Search, ArrowRight } from "lucide-react";
import { DBTemplate } from "@/lib/supabase/db";

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: DBTemplate) => void;
}

const CATEGORIES = ["All", "Furniture", "Architecture", "Game Assets", "Product Design", "Characters"];

export function TemplateGalleryModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateGalleryModalProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<DBTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetch(`/api/templates?category=${activeCategory === "All" ? "" : activeCategory}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.templates) setTemplates(data.templates);
      })
      .catch((err) => console.error("Error loading templates:", err))
      .finally(() => setIsLoading(false));
  }, [isOpen, activeCategory]);

  const filtered = templates.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="3D Asset & Scene Template Library"
    >
      <div className="space-y-4 pt-1 max-h-[75vh] flex flex-col">
        {/* Search & Category Filter Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6A7894]" />
            <input
              type="text"
              placeholder="Search templates (e.g. desk, corridor, headphones, vehicle)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0D1017] border border-[#202738] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#606E88] focus:border-[#00E5FF] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-[#00E5FF] text-black font-semibold shadow-glow-cyan"
                    : "bg-[#141926] text-[#7A87A2] hover:text-white border border-[#202638]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#7A86A1]">
              Loading starter templates...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#7A86A1]">
              No templates found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 rounded-xl bg-[#0D1017] border border-[#1E2538] hover:border-[#00E5FF]/40 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-[#00E5FF] transition-colors">
                        {tpl.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#1A2233] text-[#A3B2D1] border border-[#28324A]">
                        {tpl.difficulty}
                      </span>
                    </div>

                    <p className="text-xs text-[#8A97B2] line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {tpl.tags?.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-[#161B29] text-[#707E9C]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-[#1C2233] mt-3">
                    <span className="text-[11px] text-[#606E88] font-mono">
                      {tpl.category}
                    </span>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        onSelectTemplate(tpl);
                        onClose();
                      }}
                      className="text-xs flex items-center gap-1.5 py-1 px-3"
                    >
                      <span>Use Template</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
