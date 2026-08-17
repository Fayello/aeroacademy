"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Microscope, Play, Loader2, Clock, Shield, Lock, Search, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import toast from "@/lib/toast";
import { getLevel, getLabLock } from "@/lib/levelGating";
import { getDifficultyStyle, getEstimatedTime, getSolvedCount, getProgressStatus } from "@/lib/labs";
import type { Lab, LabStats } from "@/types/api";

export default function LabsCatalog() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<LabStats | null>(null);
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
      setLevel(getLevel(parseInt(localStorage.getItem("xp") || "0", 10)));
    } catch {
      setLevel(1);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [labsData, stats] = await Promise.all([
          fetchApi("/labs"),
          fetchApi("/labs/stats"),
        ]);
        if (!cancelled) {
          setLabs(labsData);
          setSystemStats(stats);
        }
      } catch {
        if (!cancelled) toast.error("Failed to load labs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-full max-w-md bg-slate-200 rounded-lg animate-pulse" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-7 w-20 bg-slate-200 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <div key={id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-full bg-slate-200 rounded animate-pulse" />
              <div className="h-1 w-full bg-slate-200 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Labs"
        description={`${filteredLabs.length} of ${labs.length} labs`}
      />

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search labs by title, description..."
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                difficultyFilter === d
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
            >
              {d === "ALL" ? "All" : d.charAt(0) + d.slice(1).toLowerCase()}
            </button>
          ))}
          <span className="w-px h-6 bg-slate-200 self-center" />
          {PROGRESS_FILTERS.map((p) => (
            <button
              key={p.value}
              onClick={() => setProgressFilter(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                progressFilter === p.value
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
            >
              {p.label}
            </button>
          ))}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-full border border-slate-200 transition-all"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Labs Grid */}
      {filteredLabs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Microscope size={40} className="mx-auto mb-3 text-slate-300" />
          <h3 className="text-sm font-medium text-slate-500 mb-1">
            {labs.length === 0 ? "No labs available" : "No labs match your filters"}
          </h3>
          <p className="text-xs text-slate-400">
            {labs.length === 0
              ? "Lab environments will appear here once configured."
              : "Try adjusting your search or filter criteria."}
          </p>
          {labs.length > 0 && hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden cursor-not-allowed opacity-50"
                  aria-disabled="true"
                  aria-label={`${lab.title} — locked, requires level ${gate.requiredLevel}`}
                >
                  <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/80 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <Lock size={20} className="text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-mono text-slate-500 mb-1">LEVEL {gate.requiredLevel} REQUIRED</p>
                      <p className="text-[11px] text-slate-400">Level up to unlock this lab</p>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
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
                className="group relative bg-white rounded-xl border border-slate-200 hover:border-slate-300 overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                <div className={`h-0.5 w-full ${diff.bar} opacity-60`} />
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                      <span className={`text-[10px] font-mono tracking-wider ${diff.color}`}>{diff.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{getEstimatedTime(flags)}</span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-900 group-hover:text-slate-700 transition-colors">{lab.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{lab.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><Shield size={10} />{solvedFlags}/{flags} flags</span>
                  </div>
                  {flags > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">PROGRESS</span>
                        <span className="text-[10px] font-mono text-slate-500">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-slate-800 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">{flags} OBJECTIVES</span>
                    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 flex items-center gap-1.5 transition-colors">
                      LAUNCH
                      <span className="w-5 h-5 rounded-md bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-all">
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
