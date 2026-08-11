"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Microscope, Play, Loader2, Activity, Terminal, Clock, Shield, Lock, Server, Cpu, Zap } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { getLevel, getLabLock } from "@/lib/levelGating";

function getDifficultyStyle(difficulty: number) {
  if (difficulty <= 1100) return { label: "BEGINNER", color: "text-emerald-600", dot: "bg-emerald-500", bar: "bg-emerald-500", ring: "ring-emerald-500/30" };
  if (difficulty <= 1300) return { label: "INTERMEDIATE", color: "text-amber-600", dot: "bg-amber-500", bar: "bg-amber-500", ring: "ring-amber-500/30" };
  if (difficulty <= 1500) return { label: "ADVANCED", color: "text-orange-600", dot: "bg-orange-500", bar: "bg-orange-500", ring: "ring-orange-500/30" };
  return { label: "EXPERT", color: "text-rose-600", dot: "bg-rose-500", bar: "bg-rose-500", ring: "ring-rose-500/30" };
}

function getEstimatedTime(flags: number): string {
  if (flags <= 2) return "~30m";
  if (flags <= 4) return "~1h";
  return "~2h";
}

export default function LabsCatalog() {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    try {
      const xp = parseInt(localStorage.getItem("xp") || "0", 10);
      setLevel(getLevel(xp));
    } catch {}

    async function loadData() {
      try {
        const [labsData, stats] = await Promise.all([
          fetchApi("/labs"),
          fetchApi("/labs/stats"),
        ]);
        setLabs(labsData);
        setSystemStats(stats);
      } catch {
        toast.error("Failed to load labs");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <p className="text-sm text-slate-500">Loading labs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Terminal size={16} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Labs</h1>
          </div>
        </div>
        {systemStats && (
          <div className="flex items-center gap-1 text-xs font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${systemStats.systemStatus === "HEALTHY" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span className="text-slate-500">SYS</span>
            <span className="text-slate-500">{systemStats.capacityPercentage || 0}%</span>
            <span className="text-slate-400 mx-1">|</span>
            <Cpu size={12} className="text-slate-500" />
            <span className="text-slate-500">{systemStats.activeContainers || 0}/{systemStats.maxCapacity || 20}</span>
          </div>
        )}
      </div>

      {/* Labs Grid */}
      {labs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Microscope size={24} className="text-slate-400" />
          </div>
          <h3 className="text-sm font-medium text-slate-500 mb-1">NO LABS AVAILABLE</h3>
          <p className="text-xs text-slate-400">Lab environments will appear here once configured.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labs.map((lab) => {
            const diff = getDifficultyStyle(lab.difficulty || 1200);
            const flags = lab.flags?.length || 0;
            const solvedFlags = lab.flags?.filter((f: any) => f.submissions?.length > 0).length || 0;
            const gate = getLabLock(lab.difficulty || 1200, level);
            const isLocked = gate.locked;
            const progress = flags > 0 ? (solvedFlags / flags) * 100 : 0;

            if (isLocked) {
              return (
                <div
                  key={lab.id}
                  className="relative group bg-white rounded-xl border border-slate-200 overflow-hidden cursor-not-allowed"
                  aria-disabled="true"
                  aria-label={`${lab.title} — locked, requires level ${gate.requiredLevel}`}
                >
                  {/* Frosted Glass Overlay */}
                  <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/80 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <Lock size={20} className="text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-mono text-slate-500 mb-1">LEVEL {gate.requiredLevel} REQUIRED</p>
                      <p className="text-[11px] text-slate-400">Level up to unlock this lab</p>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                        <span className={`text-[10px] font-mono tracking-wider ${diff.color}`}>{diff.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">LOCKED</span>
                    </div>

                    <h3 className="text-sm font-medium text-slate-400">{lab.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{lab.description}</p>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1"><Shield size={10} />{solvedFlags}/{flags}</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{getEstimatedTime(flags)}</span>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">{flags} OBJECTIVES</span>
                        <Lock size={12} className="text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={lab.id}
                href={`/dashboard/labs/${lab.id}`}
                className="group relative bg-white rounded-xl border border-slate-200 hover:border-slate-300 overflow-hidden transition-all duration-300 hover:shadow-lg"
              >
                {/* Top accent bar */}
                <div className={`h-0.5 w-full ${diff.bar} opacity-60`} />

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                      <span className={`text-[10px] font-mono tracking-wider ${diff.color}`}>{diff.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{getEstimatedTime(flags)}</span>
                  </div>

                  <h3 className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{lab.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{lab.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><Shield size={10} />{solvedFlags}/{flags} flags</span>
                  </div>

                  {/* Progress bar */}
                  {flags > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">PROGRESS</span>
                        <span className="text-[10px] font-mono text-slate-500">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">{flags} OBJECTIVES</span>
                    <span className="text-xs font-medium text-blue-600 group-hover:text-blue-700 flex items-center gap-1.5 transition-colors">
                      LAUNCH
                      <span className="w-5 h-5 rounded-md bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-all">
                        <Play size={10} fill="currentColor" />
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
