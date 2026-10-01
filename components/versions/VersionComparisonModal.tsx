"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ArrowLeftRight, Check, Plus, Minus, RefreshCw, GitCommit } from "lucide-react";
import { DBGenerationVersion } from "@/lib/supabase/db";

interface VersionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: DBGenerationVersion[];
  currentVersionNumber?: number;
  onRestoreVersion: (version: DBGenerationVersion) => void;
}

export function VersionComparisonModal({
  isOpen,
  onClose,
  versions,
  currentVersionNumber = 1,
  onRestoreVersion,
}: VersionComparisonModalProps) {
  const [baseVerNum, setBaseVerNum] = useState<number>(
    versions.length > 1 ? versions[1].versionNumber : currentVersionNumber
  );
  const [targetVerNum, setTargetVerNum] = useState<number>(currentVersionNumber);

  const baseVer = versions.find((v) => v.versionNumber === baseVerNum) || versions[0];
  const targetVer = versions.find((v) => v.versionNumber === targetVerNum) || versions[0];

  // Compute structured diff between versions
  const baseObjects: string[] = baseVer?.planJson?.objects?.map((o: any) => o.name) || [];
  const targetObjects: string[] = targetVer?.planJson?.objects?.map((o: any) => o.name) || [];

  const addedObjects = targetObjects.filter((o) => !baseObjects.includes(o));
  const removedObjects = baseObjects.filter((o) => !targetObjects.includes(o));
  const retainedObjects = targetObjects.filter((o) => baseObjects.includes(o));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="3D Model Version Comparison & Lineage"
    >
      <div className="space-y-5 pt-1">
        {/* Version Selector Header */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#0D1017] border border-[#1E2538]">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#7A88A6] uppercase tracking-wider">
              Base Version (Before)
            </label>
            <select
              value={baseVerNum}
              onChange={(e) => setBaseVerNum(Number(e.target.value))}
              className="w-full bg-[#151B29] border border-[#232C42] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.versionNumber}>
                  v{v.versionNumber}: {v.prompt.slice(0, 30)}...
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#7A88A6] uppercase tracking-wider">
              Target Version (After)
            </label>
            <select
              value={targetVerNum}
              onChange={(e) => setTargetVerNum(Number(e.target.value))}
              className="w-full bg-[#151B29] border border-[#232C42] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.versionNumber}>
                  v{v.versionNumber}: {v.prompt.slice(0, 30)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Change Breakdown */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-[#00E5FF]" />
            <span>
              Geometric & Scene Object Diff (v{baseVer?.versionNumber} ↔ v{targetVer?.versionNumber})
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {addedObjects.length > 0 && (
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Added Objects ({addedObjects.length}):</span>
                </div>
                <div className="text-[#95A5C7] pl-5">
                  {addedObjects.join(", ")}
                </div>
              </div>
            )}

            {removedObjects.length > 0 && (
              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 space-y-1">
                <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                  <Minus className="w-3.5 h-3.5" />
                  <span>Removed Objects ({removedObjects.length}):</span>
                </div>
                <div className="text-[#95A5C7] pl-5">
                  {removedObjects.join(", ")}
                </div>
              </div>
            )}

            {retainedObjects.length > 0 && (
              <div className="p-3 rounded-lg bg-[#121622] border border-[#1E2538] space-y-1">
                <div className="font-semibold text-[#A2B1D0] flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>Retained & Refined Objects ({retainedObjects.length}):</span>
                </div>
                <div className="text-[#7A87A2] pl-5">
                  {retainedObjects.join(", ")}
                </div>
              </div>
            )}

            {addedObjects.length === 0 && removedObjects.length === 0 && (
              <div className="py-4 text-center text-xs text-[#7A88A6]">
                Both versions share identical object topology. Modifications are material or procedural shader refinements.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1C2233]">
          <span className="text-[11px] text-[#6A7894]">
            Created: {targetVer ? new Date(targetVer.createdAt).toLocaleString() : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            {baseVer && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onRestoreVersion(baseVer);
                  onClose();
                }}
              >
                Restore v{baseVer.versionNumber}
              </Button>
            )}
            {targetVer && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onRestoreVersion(targetVer);
                  onClose();
                }}
              >
                Apply v{targetVer.versionNumber}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
