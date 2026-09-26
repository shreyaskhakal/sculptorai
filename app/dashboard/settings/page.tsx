"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Box, Key, Download, Radio, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("sculptor_live_99d19a28b03e4811a7");
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="min-h-screen bg-[#07080C] text-[#E2E6F2]">
      {/* Top Bar */}
      <header className="px-8 py-4 bg-[#0A0C13] border-b border-[#1C212E] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-[#7A86A1] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <span className="text-xs text-[#6B7790]">/ Project Settings</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-10 space-y-8">
        <div>
          <h1 className="text-xl font-bold text-white">SculptorAI Settings</h1>
          <p className="text-xs text-[#7A86A1] mt-1">
            Manage your Blender add-on connection, API security, and profile.
          </p>
        </div>

        {/* Section 1: Blender Add-on Connection */}
        <div className="p-6 rounded-2xl bg-[#0E111A] border border-[#202638] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Radio className="w-5 h-5 text-[#F5792A]" />
              <h2 className="text-sm font-semibold text-white">
                Blender Add-on Connection
              </h2>
            </div>
            <Badge variant="emerald">Online</Badge>
          </div>

          <div className="space-y-3 text-xs text-[#CCD2E3]">
            <div>
              <label className="block text-[11px] font-semibold text-[#7A86A1] uppercase tracking-wider mb-1">
                Server Endpoint URL
              </label>
              <input
                type="text"
                readOnly
                value="http://localhost:3000"
                className="w-full px-3 py-2 rounded-lg bg-[#141825] border border-[#23293D] font-mono text-xs text-[#00E5FF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#7A86A1] uppercase tracking-wider mb-1">
                Session API Token
              </label>
              <div className="flex items-center gap-2">
                <input
                  type={showKey ? "text" : "password"}
                  readOnly
                  value={apiKey}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#141825] border border-[#23293D] font-mono text-xs text-white focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowKey(!showKey)}
                  className="text-xs"
                >
                  {showKey ? "Hide" : "Reveal"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigator.clipboard.writeText(apiKey)}
                  className="text-xs"
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>

          {/* Add-on Installation Guide */}
          <div className="pt-4 border-t border-[#1C212E] text-xs space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-1.5">
              <Download className="w-4 h-4 text-[#00E5FF]" />
              <span>How to Install Add-on into Blender</span>
            </h3>
            <ol className="list-decimal list-inside text-[#828FA8] space-y-1 text-[11px] leading-relaxed">
              <li>Open Blender 3.6 or 4.x.</li>
              <li>Go to <strong className="text-white">Edit &gt; Preferences &gt; Add-ons</strong>.</li>
              <li>Click <strong className="text-white">Install...</strong> and select the <code className="text-[#F5792A]">blender-addon.zip</code> file.</li>
              <li>Check the checkbox to enable <strong className="text-white">SculptorAI Copilot</strong>.</li>
              <li>Enter your Server URL (<code className="text-[#00E5FF]">http://localhost:3000</code>) and API Token.</li>
              <li>Open the 3D Viewport sidebar (press <kbd className="px-1 py-0.5 rounded bg-[#1D2232] text-white">N</kbd>) and switch to the <strong className="text-white">SculptorAI</strong> tab!</li>
            </ol>
          </div>
        </div>

        {/* Section 2: Security & Safety Gate */}
        <div className="p-6 rounded-2xl bg-[#0E111A] border border-[#202638] space-y-3">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Execution Safety Policy</h2>
          </div>
          <p className="text-xs text-[#828FA8] leading-relaxed">
            SculptorAI enforces mandatory explicit user review. Generated Python code is never silently executed. All script operations are scoped, validated, and logged to ensure scene integrity.
          </p>
        </div>
      </main>
    </div>
  );
}
