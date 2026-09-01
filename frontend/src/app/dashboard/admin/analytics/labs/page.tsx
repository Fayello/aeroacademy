"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Microscope, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Loader2, ArrowLeft, Search, ChevronDown, ChevronUp, Target, Zap, Info,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";


interface StepAnalytic {
  step: string;
  attempts: number;
  completions: number;
  failureRate: number;
  points: number;
}

interface WeeklyPoint {
  week: number;
  count: number;
}

interface LabAnalytic {
  labId: string;
  title: string;
  difficulty: number;
  domainName: string | null;
  totalAttempts: number;
  completions: number;
  completionRate: number;
  avgTimeMinutes: number;
  totalSubmissions: number;
  correctSubmissions: number;
  failureRate: number;
  hintUsageRate: number;
  difficultyELO: number | null;
  tooEasy: boolean;
  tooHard: boolean;
  stepAnalytics: StepAnalytic[] | null;
  weeklyCompletions: WeeklyPoint[] | null;
  weeklyAttempts: WeeklyPoint[] | null;
}

interface LabInsights extends LabAnalytic {
  lab: { title: string; description: string; difficulty: number };
  insights: string[];
}

type SortKey = "title" | "domainName" | "difficulty" | "totalAttempts" | "completionRate" | "failureRate" | "avgTimeMinutes";

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: typeof Microscope; color: string; sub?: string;
}) {
  return (
    <div className="relative overflow-hidden bg-[#0f172a] rounded-xl border border-white/10 p-5 hover:shadow-lg transition-all duration-300">
      <div className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-10 rounded-bl-full`} />
      <Icon size={20} className="text-slate-500 mb-3" />
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: number }) {
  if (difficulty < 1000) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Easy</span>;
  if (difficulty < 1300) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">Medium</span>;
  if (difficulty < 1600) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">Hard</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Expert</span>;
}

function CalibrationBadge({ tooEasy, tooHard }: { tooEasy: boolean; tooHard: boolean }) {
  if (tooEasy) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={10} /> Too Easy</span>;
  if (tooHard) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1"><AlertTriangle size={10} /> Too Hard</span>;
  return null;
}

function RateBar({ rate, color = "emerald" }: { rate: number; color?: string }) {
  const bg = color === "emerald" ? "bg-[#7AD62A]" : color === "amber" ? "bg-amber-500" : color === "red" ? "bg-red-500" : "bg-blue-600";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full ${bg} transition-all duration-500`} style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-300 w-10 text-right">{rate.toFixed(1)}%</span>
    </div>
  );
}

export default function LabAnalyticsPage() {
  const [labs, setLabs] = useState<LabAnalytic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLab, setSelectedLab] = useState<LabAnalytic | null>(null);
  const [insights, setInsights] = useState<LabInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalAttempts");
  const [sortAsc, setSortAsc] = useState(false);
  const [domainFilter, setDomainFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    fetchApi("/ai/lab-analytics")
      .then((d) => { if (!cancelled) setLabs(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const domains = useMemo(() => {
    const set = new Set(labs.map((l) => l.domainName).filter(Boolean));
    return ["all", ...Array.from(set)] as string[];
  }, [labs]);

  const filtered = useMemo(() => {
    let result = labs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l) => l.title.toLowerCase().includes(q) || (l.domainName || "").toLowerCase().includes(q));
    }
    if (domainFilter !== "all") {
      result = result.filter((l) => l.domainName === domainFilter);
    }
    result = [...result].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === "string" && typeof bv === "string") return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return result;
  }, [labs, searchQuery, domainFilter, sortKey, sortAsc]);

  const totals = useMemo(() => ({
    totalLabs: labs.length,
    totalAttempts: labs.reduce((s, l) => s + l.totalAttempts, 0),
    avgCompletion: labs.length > 0 ? labs.reduce((s, l) => s + l.completionRate, 0) / labs.length : 0,
    avgFailure: labs.length > 0 ? labs.reduce((s, l) => s + l.failureRate, 0) / labs.length : 0,
    tooEasy: labs.filter((l) => l.tooEasy).length,
    tooHard: labs.filter((l) => l.tooHard).length,
  }), [labs]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) { setSortAsc((a) => !a); return key; }
      setSortAsc(false);
      return key;
    });
  }, []);

  const loadInsights = useCallback(async (lab: LabAnalytic) => {
    setSelectedLab(lab);
    setInsightsLoading(true);
    try {
      const data = await fetchApi(`/ai/lab-analytics/${lab.labId}`) as LabInsights;
      setInsights(data);
    } catch {
      setInsights(null);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown size={12} className="text-slate-300" />;
    return sortAsc ? <ChevronUp size={12} className="text-[#7AD62A]" /> : <ChevronDown size={12} className="text-[#7AD62A]" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#7AD62A]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8 border border-white/10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/dashboard/admin/analytics" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <ArrowLeft size={18} className="text-slate-400" />
            </Link>
            <div className="w-12 h-12 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center">
              <Microscope size={24} className="text-[#7AD62A]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Lab Analytics</h1>
              <p className="text-sm text-slate-500">Step-level insights, difficulty calibration, and engagement trends</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Labs" value={totals.totalLabs} icon={Microscope} color="bg-[#7AD62A]" />
        <StatCard label="Total Attempts" value={totals.totalAttempts.toLocaleString()} icon={Target} color="bg-blue-500" />
        <StatCard label="Avg Completion" value={`${totals.avgCompletion.toFixed(1)}%`} icon={TrendingUp} color="bg-[#7AD62A]" />
        <StatCard label="Avg Failure Rate" value={`${totals.avgFailure.toFixed(1)}%`} icon={TrendingDown} color="bg-amber-500" />
        <StatCard label="Too Easy" value={totals.tooEasy} icon={CheckCircle} color="bg-green-500" sub="Completion > 85%" />
        <StatCard label="Too Hard" value={totals.tooHard} icon={AlertTriangle} color="bg-red-500" sub="Completion < 15%" />
      </div>

      {/* Filters */}
      <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search labs by name or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]"
            />
          </div>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] bg-[#0f172a]"
          >
            {domains.map((d) => (
              <option key={d} value={d}>{d === "all" ? "All Domains" : d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lab Table + Detail */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Table */}
        <div className={`${selectedLab ? "lg:col-span-3" : "lg:col-span-5"} bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden transition-all`}>
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <h3 className="font-semibold text-white">All Labs ({filtered.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {[
                    { key: "title" as SortKey, label: "Lab" },
                    { key: "domainName" as SortKey, label: "Domain" },
                    { key: "difficulty" as SortKey, label: "Diff" },
                    { key: "totalAttempts" as SortKey, label: "Attempts" },
                    { key: "completionRate" as SortKey, label: "Completion" },
                    { key: "failureRate" as SortKey, label: "Failure" },
                    { key: "avgTimeMinutes" as SortKey, label: "Avg Time" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-4 py-3 text-left font-medium text-slate-500 cursor-pointer hover:text-slate-200 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        <SortIcon col={col.key} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lab) => (
                  <tr
                    key={lab.labId}
                    onClick={() => loadInsights(lab)}
                    className={`border-b border-slate-50 cursor-pointer transition-colors ${
                      selectedLab?.labId === lab.labId ? "bg-[#7AD62A]/10/50" : "hover:bg-white/5"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white truncate max-w-[200px]">{lab.title}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{lab.domainName || "—"}</td>
                    <td className="px-4 py-3"><DifficultyBadge difficulty={lab.difficulty} /></td>
                    <td className="px-4 py-3 font-medium text-slate-300">{lab.totalAttempts}</td>
                    <td className="px-4 py-3 min-w-[140px]"><RateBar rate={lab.completionRate} color="emerald" /></td>
                    <td className="px-4 py-3 min-w-[140px]"><RateBar rate={lab.failureRate} color="amber" /></td>
                    <td className="px-4 py-3 text-slate-400">{lab.avgTimeMinutes.toFixed(0)}m</td>
                    <td className="px-4 py-3"><CalibrationBadge tooEasy={lab.tooEasy} tooHard={lab.tooHard} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">No labs found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedLab && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white truncate pr-2">{selectedLab.title}</h3>
                <button onClick={() => { setSelectedLab(null); setInsights(null); }} className="text-slate-400 hover:text-slate-300 transition-colors shrink-0">
                  <span className="text-xs">Close</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-slate-500">Attempts</div>
                  <div className="text-lg font-bold text-white">{selectedLab.totalAttempts}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-slate-500">Completions</div>
                  <div className="text-lg font-bold text-[#7AD62A]">{selectedLab.completions}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-slate-500">Avg Time</div>
                  <div className="text-lg font-bold text-white">{selectedLab.avgTimeMinutes.toFixed(0)}m</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-slate-500">Submissions</div>
                  <div className="text-lg font-bold text-white">{selectedLab.totalSubmissions}</div>
                </div>
              </div>

              {/* AI Insights */}
              {insightsLoading && (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
                  <Loader2 size={14} className="animate-spin" /> Loading insights...
                </div>
              )}
              {insights && insights.insights.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-400 mb-2">
                    <Zap size={12} /> AI Insights
                  </div>
                  <ul className="space-y-1">
                    {insights.insights.map((insight, i) => (
                      <li key={i} className="text-xs text-amber-800">{insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weekly Trend Chart */}
              {selectedLab.weeklyCompletions && selectedLab.weeklyCompletions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                    <TrendingUp size={12} /> Weekly Completions
                  </h4>
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedLab.weeklyCompletions}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                          labelFormatter={(v) => `Week ${v}`}
                        />
                        <Line type="monotone" dataKey="count" stroke="#229C62" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Weekly Attempts Chart */}
              {selectedLab.weeklyAttempts && selectedLab.weeklyAttempts.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                    <Target size={12} /> Weekly Attempts
                  </h4>
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={selectedLab.weeklyAttempts}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} labelFormatter={(v) => `Week ${v}`} />
                        <Bar dataKey="count" fill="#2563eb" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Step Breakdown */}
            {selectedLab.stepAnalytics && selectedLab.stepAnalytics.length > 0 && (
              <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Info size={14} /> Step Breakdown
                </h3>
                <div className="space-y-3">
                  {selectedLab.stepAnalytics.map((step, i) => {
                    const rate = step.failureRate;
                    const barColor = rate > 70 ? "bg-red-500" : rate > 40 ? "bg-amber-500" : "bg-[#7AD62A]";
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-300 truncate max-w-[180px]">{step.step}</span>
                          <span className="text-xs text-slate-500 shrink-0 ml-2">{step.completions}/{step.attempts}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                            <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(100 - rate, 100)}%` }} />
                          </div>
                          <span className="text-xs font-medium w-10 text-right" style={{ color: rate > 70 ? "#dc2626" : rate > 40 ? "#d97706" : "#229C62" }}>
                            {rate.toFixed(0)}% fail
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
