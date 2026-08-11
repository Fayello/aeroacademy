"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Microscope, Play, Loader2, AlertCircle, Activity, Terminal, Clock, Shield, Lock, Server } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import EmptyState from "@/components/ui/EmptyState";
import { getLevel, getLabLock } from "@/lib/levelGating";

function getDifficultyLabel(difficulty: number): { label: string; color: string; gradient: string } {
  if (difficulty <= 1100) return { label: "Beginner", color: "bg-emerald-100 text-emerald-700", gradient: "from-emerald-500 to-teal-600" };
  if (difficulty <= 1300) return { label: "Intermediate", color: "bg-amber-100 text-amber-700", gradient: "from-blue-500 to-indigo-600" };
  if (difficulty <= 1500) return { label: "Advanced", color: "bg-orange-100 text-orange-700", gradient: "from-orange-500 to-red-600" };
  return { label: "Expert", color: "bg-red-100 text-red-700", gradient: "from-purple-500 to-pink-600" };
}

function getEstimatedTime(flags: number): string {
  if (flags <= 2) return "~30 min";
  if (flags <= 4) return "~1 hour";
  return "~2 hours";
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
        <Loader2 className="animate-spin text-emerald-600" size={32} />
        <p className="text-sm text-slate-500">Loading labs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Microscope size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Labs</h1>
              <p className="text-emerald-100 text-sm">Deploy isolated sandbox environments for hands-on practice</p>
            </div>
          </div>
          {systemStats && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <Activity size={16} className={systemStats.systemStatus === "HEALTHY" ? "text-emerald-300" : "text-amber-300"} />
                <span className="text-sm font-medium">{systemStats.capacityPercentage || 0}% capacity</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <Server size={16} className="text-emerald-300" />
                <span className="text-sm font-medium">{systemStats.activeContainers || 0}/{systemStats.maxCapacity || 20} nodes</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Labs Grid */}
      {labs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Microscope size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No labs available</h3>
          <p className="text-sm text-slate-500">Lab environments will appear here once configured.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labs.map((lab) => {
            const difficulty = getDifficultyLabel(lab.difficulty || 1200);
            const flags = lab.flags?.length || 0;
            const solvedFlags = lab.flags?.filter((f: any) => f.submissions?.length > 0).length || 0;
            const gate = getLabLock(lab.difficulty || 1200, level);
            const isLocked = gate.locked;

            return isLocked ? (
              <div
                key={lab.id}
                className="relative overflow-hidden bg-white rounded-xl border border-slate-200 opacity-60 cursor-not-allowed"
                role="button"
                aria-disabled="true"
                aria-label={`${lab.title} — locked, requires level ${gate.requiredLevel}`}
              >
                <div className="h-40 overflow-hidden relative">
                  {lab.imageUrl ? (
                    <img src={lab.imageUrl} alt={lab.title} className="w-full h-full object-cover grayscale" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${difficulty.gradient} flex items-center justify-center`}>
                      <Microscope size={48} className="text-white/30" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${difficulty.color}`}>{difficulty.label}</span>
                  </div>
                  <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                    <div className="bg-slate-800/80 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                      <Lock size={12} /> Level {gate.requiredLevel} required
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold mb-1 text-slate-500">{lab.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{gate.reason}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1"><Shield size={12} />{solvedFlags}/{flags} flags</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{getEstimatedTime(flags)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">{flags} objectives</span>
                    <span className="text-sm font-medium text-slate-400">Locked</span>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={lab.id}
                href={`/dashboard/labs/${lab.id}`}
                className="group relative overflow-hidden bg-white rounded-xl border border-slate-200 hover:shadow-lg hover:border-emerald-300 transition-all duration-300"
              >
                <div className="h-40 overflow-hidden relative">
                  {lab.imageUrl ? (
                    <img src={lab.imageUrl} alt={lab.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${difficulty.gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                      <Microscope size={48} className="text-white/30" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${difficulty.color}`}>{difficulty.label}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold mb-1 text-slate-900 group-hover:text-emerald-700 transition-colors">{lab.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{lab.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1"><Shield size={12} />{solvedFlags}/{flags} flags</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{getEstimatedTime(flags)}</span>
                  </div>
                  {flags > 0 && (
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                      <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${(solvedFlags / flags) * 100}%` }} />
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">{flags} objectives</span>
                    <span className="text-sm font-medium text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1">
                      Open <Play size={12} fill="currentColor" />
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
