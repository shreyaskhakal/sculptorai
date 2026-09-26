"use client";

import React, { useState, useRef } from "react";
import { Image as ImageIcon, Send, X, Sparkles, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface PromptComposerProps {
  onSubmitPrompt: (
    prompt: string,
    options: {
      imageFile?: File | null;
      imageBase64?: string | null;
      style: string;
      blenderVersion: string;
    }
  ) => void;
  isLoading?: boolean;
  loadingStage?: string;
}

export function PromptComposer({
  onSubmitPrompt,
  isLoading = false,
  loadingStage,
}: PromptComposerProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [style, setStyle] = useState("low-poly");
  const [blenderVersion, setBlenderVersion] = useState("4.x");
  const [showOptions, setShowOptions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!prompt.trim() && !selectedImage) || isLoading) return;

    let base64Data: string | null = null;
    if (imagePreview) {
      const parts = imagePreview.split(",");
      base64Data = parts[1] || null;
    }

    onSubmitPrompt(prompt, {
      imageFile: selectedImage,
      imageBase64: base64Data,
      style,
      blenderVersion,
    });

    setPrompt("");
    handleRemoveImage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickPrompts = [
    "Futuristic desk with RGB",
    "Low-poly wooden chair",
    "Sci-fi security drone",
    "Medieval lantern",
  ];

  return (
    <div className="bg-[#10131E] border border-[#23293D] rounded-xl p-3 shadow-2xl">
      {/* Loading Stage Indicator */}
      {isLoading && loadingStage && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-[#161B29] border border-[#262D42] text-xs text-[#00E5FF]">
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
          <span>{loadingStage}...</span>
        </div>
      )}

      {/* Attached Image Preview */}
      {imagePreview && (
        <div className="relative inline-block mb-3 p-1.5 bg-[#151926] border border-[#262E44] rounded-lg">
          <div className="relative w-20 h-20 rounded overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Reference Thumbnail"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={handleRemoveImage}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Prompt Textarea */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          selectedImage
            ? "Describe how you want SculptorAI to model or modify this reference image..."
            : "Describe what you want to build in Blender (e.g. 'Futuristic desk with RGB lighting and dual monitors')..."
        }
        rows={2}
        className="w-full bg-transparent text-white text-xs placeholder-[#5A657D] focus:outline-none resize-none leading-relaxed"
      />

      {/* Action Row */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1C2130] mt-2">
        <div className="flex items-center gap-2">
          {/* File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-[#8C98B2] hover:text-white"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>+ Reference</span>
          </Button>

          {/* Settings / Style Toggle */}
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              showOptions
                ? "bg-[#1D2333] text-[#00E5FF]"
                : "text-[#75819B] hover:text-white hover:bg-[#161A26]"
            }`}
            title="Configure modeling parameters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Quick Suggestions (if empty) */}
          {!prompt && !selectedImage && (
            <div className="hidden lg:flex items-center gap-1.5">
              {quickPrompts.slice(0, 2).map((qp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(qp)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[#151926] text-[#7A86A1] hover:text-white hover:bg-[#1C2234] border border-[#22283A] transition-colors"
                >
                  {qp}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="button"
          onClick={() => handleSubmit()}
          isLoading={isLoading}
          disabled={!prompt.trim() && !selectedImage}
          size="sm"
          variant="primary"
          className="font-semibold text-xs px-4"
        >
          {selectedImage ? (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze Image</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Generate</span>
            </>
          )}
        </Button>
      </div>

      {/* Modeling Options Drawer */}
      {showOptions && (
        <div className="flex items-center gap-4 pt-2.5 mt-2 border-t border-[#1C2130] text-[11px] text-[#8C98B2]">
          <div className="flex items-center gap-1.5">
            <span>Style:</span>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="bg-[#141825] border border-[#242A3D] rounded px-2 py-1 text-white focus:outline-none"
            >
              <option value="low-poly">Low-Poly</option>
              <option value="realistic">Realistic</option>
              <option value="stylized">Stylized</option>
              <option value="sci-fi">Sci-Fi</option>
              <option value="minimalist">Minimalist</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Blender:</span>
            <select
              value={blenderVersion}
              onChange={(e) => setBlenderVersion(e.target.value)}
              className="bg-[#141825] border border-[#242A3D] rounded px-2 py-1 text-white focus:outline-none"
            >
              <option value="4.x">Blender 4.x</option>
              <option value="3.6">Blender 3.6 LTS</option>
            </select>
          </div>

          <span className="text-[10px] text-[#556077] ml-auto">
            Ctrl + Enter to send
          </span>
        </div>
      )}
    </div>
  );
}
