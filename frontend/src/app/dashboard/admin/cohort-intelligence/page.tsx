"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, BarChart3, Loader2, TrendingUp, AlertTriangle,
  ChevronDown, ChevronUp, Target,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import EmptyState from "@/components/ui/EmptyState";


interface CohortData {
  cohort: { id: string; name: string };
  students: number;
  overallAverage: number;
  totalAssessments: number;
  categorySummary: Array<{
    category: string;
    avgScore: number;
    attempts: number;
    minScore: number;
    maxScore: number;
    failureRate: number;
  }>;
  studentsRanked: Array<{
    id: string;
    name: string;
    email: string;
    avgScore: number;
    totalAssessments: number;
    assessments: Array<{
      title: string;
      category: string;
      score: number;
      maxScore: number;
      percentage: number;
      date: string;
    }>;
  }>;
}

interface Cohort {
  id: string;
  name: string;
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 80) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#7AD62A]/10 text-[#7AD62A]">{score}%</span>;
  if (score >= 60) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">{score}%</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">{score}%</span>;
}

export default function CohortIntelligencePage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohort, setSelectedCohort] = useState("");
  const [data, setData] = useState<CohortData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [sortKey, setSortKey] = useState<"name" | "avgScore" | "totalAssessments">("avgScore");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchApi("/cohorts").then((d) => {
      if (!cancelled) setCohorts(Array.isArray(d) ? d : []);
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const loadCohort = useCallback(async (cohortId: string) => {
    setSelectedCohort(cohortId);
    if (!cohortId) { setData(null); return; }
    setLoadingData(true);
    try {
      const d = await fetchApi(`/ai/cohort-intelligence/${cohortId}`);
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoadingData(false);
    }
  }, []);

  const sortedStudents = data ? [...data.studentsRanked].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "string" && typeof bv === "string") return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  }) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8 border border-white/10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center">
              <Users size={24} className="text-[#7AD62A]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Cohort Intelligence</h1>
              <p className="text-sm text-slate-500">Assessment performance analytics for your cohorts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cohort Selector */}
      <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-[#7AD62A]" size={24} />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Cohort</label>
            <select
              value={selectedCohort}
              onChange={(e) => loadCohort(e.target.value)}
              className="w-full max-w-md px-3 py-2 text-sm border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]"
            >
              <option value="">Choose a cohort...</option>
              {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loadingData && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-[#7AD62A]" size={28} />
        </div>
      )}

      {/* Results */}
      {data && !loadingData && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-5">
              <Users size={18} className="text-slate-400 mb-2" />
              <div className="text-2xl font-bold text-white">{data.students}</div>
              <div className="text-sm text-slate-500">Students</div>
            </div>
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-5">
              <BarChart3 size={18} className="text-slate-400 mb-2" />
              <div className="text-2xl font-bold text-[#7AD62A]">{data.overallAverage}%</div>
              <div className="text-sm text-slate-500">Overall Average</div>
            </div>
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-5">
              <Target size={18} className="text-slate-400 mb-2" />
              <div className="text-2xl font-bold text-white">{data.totalAssessments}</div>
              <div className="text-sm text-slate-500">Total Assessments</div>
            </div>
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-5">
              <TrendingUp size={18} className="text-slate-400 mb-2" />
              <div className="text-2xl font-bold text-white">
                {data.categorySummary.length > 0 ? data.categorySummary.length : 0}
              </div>
              <div className="text-sm text-slate-500">Categories Tested</div>
            </div>
          </div>

          {/* Category Summary */}
          {data.categorySummary.length > 0 && (
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
              <h3 className="font-semibold text-white mb-4">Category Performance</h3>
              <div className="space-y-3">
                {data.categorySummary.map((cat) => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-300">{cat.category}</span>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{cat.attempts} attempts</span>
                        <span>Range: {cat.minScore}%-{cat.maxScore}%</span>
                        <ScoreBadge score={cat.avgScore} />
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${
                        cat.avgScore >= 70 ? "bg-[#7AD62A]" : cat.avgScore >= 50 ? "bg-amber-500" : "bg-red-500"
                      }`} style={{ width: `${cat.avgScore}%` }} />
                    </div>
                    {cat.failureRate > 30 && (
                      <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} /> {cat.failureRate}% failure rate — students need support
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Rankings */}
          <div className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-white/5">
              <h3 className="font-semibold text-white">Student Rankings ({sortedStudents.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left font-medium text-slate-500 w-8">#</th>
                    {[
                      { key: "name" as const, label: "Student" },
                      { key: "avgScore" as const, label: "Avg Score" },
                      { key: "totalAssessments" as const, label: "Assessments" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => { setSortKey(col.key); setSortAsc(sortKey === col.key ? !sortAsc : false); }}
                        className="px-4 py-3 text-left font-medium text-slate-500 cursor-pointer hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          {sortKey === col.key ? (sortAsc ? <ChevronUp size={12} className="text-[#7AD62A]" /> : <ChevronDown size={12} className="text-[#7AD62A]" />) : <ChevronDown size={12} className="text-slate-300" />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((s, i) => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-white/5/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          i === 0 ? "bg-amber-500/10 text-amber-400" : i === 1 ? "bg-white/10 text-slate-400" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-white/5 text-slate-500"
                        }`}>{i + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{s.name}</div>
                        <div className="text-xs text-slate-400">{s.email}</div>
                      </td>
                      <td className="px-4 py-3"><ScoreBadge score={s.avgScore} /></td>
                      <td className="px-4 py-3 text-slate-400">{s.totalAssessments}</td>
                    </tr>
                  ))}
                  {sortedStudents.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-12 text-center"><EmptyState icon={Users} title="No assessment data yet" description="" /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
