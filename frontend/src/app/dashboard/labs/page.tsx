"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Microscope, Play, Loader2, Activity, Terminal, Clock, Shield, Lock, Server, Cpu, Zap, Search, X } from "lucide-react";
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

type LabFlag = { id: string; submissions?: unknown[] };

function getSolvedCount(flags: LabFlag[] | undefined): number {
  return flags?.filter((f) => f.submissions?.length).length || 0;
}

function getProgressStatus(flags: LabFlag[] | undefined): string {
  if (!flags || flags.length === 0) return "NOT_STARTED";
  const solved = getSolvedCount(flags);
  if (solved >= flags.length) return "COMPLETED";
  return solved > 0 ? "IN_PROGRESS" : "NOT_STARTED";
}

export default function LabsCatalog() {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [level, setLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [progressFilter, setProgressFilter] = useState("ALL");

  const DIFFICULTIES = ["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
  const PROGRESS_FILTERS = [
    { value: "ALL", label: "All progress" },
    { value: "NOT_STARTED", label: "Not started" },
    { value: "IN_PROGRESS", label: "In progress" },
    { value: "COMPLETED", label: "Completed" },
  ];

  const filteredLabs = (labs || []).filter((lab) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      lab.title?.toLowerCase().includes(q) ||
      lab.description?.toLowerCase().includes(q) ||
      lab.difficulty?.toString().includes(q);

    const diff = getDifficultyStyle(lab.difficulty || 1200);
    const matchesDifficulty = difficultyFilter === "ALL" || diff.label === difficultyFilter;

    const progressStatus = getProgressStatus(lab.flags);
    const matchesProgress = progressFilter === "ALL" || progressStatus === progressFilter;

    return matchesSearch && matchesDifficulty && matchesProgress;
  });

  const hasActiveFilters = searchQuery !== "" || difficultyFilter !== "ALL" || progressFilter !== "ALL";

  const clearFilters = () => {
    setSearchQuery("");
    setDifficultyFilter("ALL");
    setProgressFilter("ALL");
  };

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

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search labs by title, description..."
            className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficultyFilter(d)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  difficultyFilter === d
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {d === "ALL" ? "All" : d.charAt(0) + d.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {PROGRESS_FILTERS.map((p) => (
              <button
                key={p.value}
                onClick={() => setProgressFilter(p.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  progressFilter === p.value
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2.5 py-1 rounded-full text-xs font-medium text-blue-600 hover:bg-blue-50 flex items-center gap-1"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500">
          Showing {filteredLabs.length} of {labs.length} labs
        </div>
      </div>

      {/* Labs Grid */}
      {filteredLabs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Microscope size={24} className="text-slate-400" />
          </div>
          <h3 className="text-sm font-medium text-slate-500 mb-1">
            {labs.length === 0 ? "NO LABS AVAILABLE" : "NO LABS MATCH YOUR FILTERS"}
          </h3>
          <p className="text-xs text-slate-400">
            {labs.length === 0
              ? "Lab environments will appear here once configured."
              : "Try adjusting your search or filter criteria."}
          </p>
          {labs.length > 0 && hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLabs.map((lab) => {
            const diff = getDifficultyStyle(lab.difficulty || 1200);
            const flags = lab.flags?.length || 0;
            const solvedFlags = getSolvedCount(lab.flags);
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
