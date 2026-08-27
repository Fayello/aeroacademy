"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart3, Users, GraduationCap, BookOpen, Microscope, Trophy, Award, Target, Activity, TrendingUp, Loader2, ShieldCheck, Download, FileDown } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { downloadAnalyticsCsv, downloadAnalyticsPdf } from "@/lib/analyticsReport";
import type { AnalyticsOverview } from "@/types/api";

function maxOf(values: number[]): number {
  return Math.max(...values, 1);
}

function BarChart({ data, height = 200, color = "emerald" }: { data: { label: string; value: number }[]; height?: number; color?: string }) {
  const max = maxOf(data.map((d) => d.value));
  const barColor = color === "emerald" ? "#229C62" : color === "blue" ? "#2563eb" : color === "amber" ? "#d97706" : color === "violet" ? "#7c3aed" : "#229C62";

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max((d.value / max) * (height - 28), d.value > 0 ? 4 : 2);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group relative" title={`${d.label}: ${d.value}`}>
              <div className="hidden group-hover:flex absolute -top-1 left-1/2 -translate-x-1/2 z-10 px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-medium whitespace-nowrap">
                {d.label}: {d.value}
              </div>
              <div
                className="w-full max-w-[24px] rounded-t-md transition-all duration-300"
                style={{ height: h, backgroundColor: d.value > 0 ? barColor : "#e2e8f0" }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-slate-400 truncate">
            {i % 5 === 0 || data.length <= 7 ? d.label : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function HBar({ label, value, max, color = "emerald" }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const barColor = color === "emerald" ? "bg-[#7AD62A]" : color === "blue" ? "bg-blue-600" : color === "amber" ? "bg-amber-500" : color === "violet" ? "bg-violet-600" : "bg-[#7AD62A]";
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-600 truncate">{label}</span>
        <span className="font-semibold text-white ml-2">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${Math.max(pct, value > 0 ? 3 : 0)}%` }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: typeof Users; color: string }) {
  return (
    <div className="relative overflow-hidden angular-card bg-[#0f172a] p-5 hover:shadow-lg transition-all duration-300">
      <div className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-10 rounded-bl-full`}></div>
      <Icon size={20} className="text-slate-500 mb-3" />
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchApi("/admin/analytics/overview")
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const growthData = useMemo(() => (data?.userGrowth || []).map((d) => ({ label: d.date.slice(5), value: d.count })), [data]);

  const maxLabStarts = useMemo(() => maxOf((data?.labStats || []).map((l) => l.starts)), [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#7AD62A]" size={32} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        Analytics data is unavailable.
      </div>
    );
  }

  const totals = data.totals;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden angular-card bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8 text-white border border-white/10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center">
              <BarChart3 size={24} className="text-[#7AD62A]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
              <p className="text-sm text-slate-500">Platform performance, engagement and learning analytics</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2 bg-[#0f172a] rounded-lg border border-white/10 px-4 py-2 text-sm">
              <Users size={16} className="text-[#7AD62A]" />
              <span className="font-medium">{totals.activeUsers30d} active users (30d)</span>
            </div>
            <div className="flex items-center gap-2 bg-[#0f172a] rounded-lg border border-white/10 px-4 py-2 text-sm">
              <Target size={16} className="text-[#7AD62A]" />
              <span className="font-medium">{totals.flagsSolved} flags captured</span>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadAnalyticsCsv(data)}
                className="bg-[#0f172a] rounded-lg border border-white/10 px-4 py-2 text-sm flex items-center gap-2 hover:shadow transition-shadow"
              >
                <Download size={16} className="text-[#7AD62A]" />
                CSV
              </button>
              <button
                onClick={() => {
                  setExporting(true);
                  downloadAnalyticsPdf(data).finally(() => setExporting(false));
                }}
                disabled={exporting}
                className="bg-[#0f172a] rounded-lg border border-white/10 px-4 py-2 text-sm flex items-center gap-2 hover:shadow transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {exporting ? <Loader2 size={16} className="animate-spin text-[#7AD62A]" /> : <FileDown size={16} className="text-[#7AD62A]" />}
                {exporting ? "Generating..." : "PDF"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Users" value={totals.users} icon={Users} color="bg-[#7AD62A]" />
        <StatCard label="Students" value={totals.students} icon={GraduationCap} color="bg-blue-500" />
        <StatCard label="Courses" value={totals.courses} icon={BookOpen} color="bg-violet-500" />
        <StatCard label="Lessons" value={totals.lessons} icon={Activity} color="bg-amber-500" />
        <StatCard label="Labs" value={totals.labs} icon={Microscope} color="bg-rose-500" />
        <StatCard label="Master Classes" value={totals.masterClasses} icon={Trophy} color="bg-cyan-500" />
        <StatCard label="Trainers" value={totals.trainers} icon={Award} color="bg-[#7AD62A]" />
        <StatCard label="Lessons Completed" value={totals.lessonsCompleted} icon={ShieldCheck} color="bg-blue-500" />
        <StatCard label="Quiz Submissions" value={totals.quizSubmissions} icon={Activity} color="bg-violet-500" />
        <StatCard label="Flags Solved" value={totals.flagsSolved} icon={Target} color="bg-amber-500" />
      </div>

      {/* User growth + Quiz/Flag stats */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 angular-card bg-[#0f172a] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2"><TrendingUp size={16} className="text-[#7AD62A]" /> User Growth</h3>
              <p className="text-xs text-slate-500 mt-1">New registrations — last 30 days</p>
            </div>
            <div className="text-2xl font-bold text-white">{totals.users}</div>
          </div>
          <BarChart data={growthData} height={200} color="emerald" />
        </div>

        <div className="space-y-4">
          <div className="angular-card bg-[#0f172a] p-6">
            <h3 className="font-semibold text-white mb-4">Quiz Performance</h3>
            <div className="space-y-3">
              <HBar label="Passed" value={data.quizStats.passed} max={data.quizStats.submissions} color="emerald" />
              <HBar label="Failed" value={data.quizStats.failed} max={data.quizStats.submissions} color="amber" />
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">Pass rate</span>
              <span className="text-lg font-bold text-[#7AD62A]">{data.quizStats.passRate}%</span>
            </div>
          </div>
          <div className="angular-card bg-[#0f172a] p-6">
            <h3 className="font-semibold text-white mb-4">Flag Submissions</h3>
            <div className="space-y-3">
              <HBar label="Correct" value={data.flagStats.correct} max={data.flagStats.correct + data.flagStats.incorrect} color="emerald" />
              <HBar label="Incorrect" value={data.flagStats.incorrect} max={data.flagStats.correct + data.flagStats.incorrect} color="red" />
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">Accuracy</span>
              <span className="text-lg font-bold text-[#7AD62A]">
                {data.flagStats.correct + data.flagStats.incorrect > 0
                  ? Math.round((data.flagStats.correct / (data.flagStats.correct + data.flagStats.incorrect)) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity (14 days) */}
      <div className="angular-card bg-[#0f172a] p-6">
        <h3 className="font-semibold text-white mb-1">Learning Activity</h3>
        <p className="text-xs text-slate-500 mb-4">Daily engagement — last 14 days</p>
        <div className="flex gap-1 items-end" style={{ height: 160 }}>
          {data.activity.map((d) => {
            const max = Math.max(
              ...data.activity.map((a) => a.lessons + a.flags + a.quizzes + a.registrations),
              1,
            );
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative" title={d.date}>
                <div className="hidden group-hover:flex absolute -top-1 left-1/2 -translate-x-1/2 z-10 px-2 py-1 rounded bg-slate-900 text-white text-[10px] whitespace-nowrap flex-col items-center">
                  <span>{d.date}</span>
                  <span>L{d.lessons} F{d.flags} Q{d.quizzes} R{d.registrations}</span>
                </div>
                <div className="w-full flex justify-center gap-[1px]">
                  <div className="w-[22%] max-w-[7px] rounded-t-sm bg-[#7AD62A]" style={{ height: Math.max((d.lessons / max) * 130, d.lessons ? 3 : 0) }} />
                  <div className="w-[22%] max-w-[7px] rounded-t-sm bg-amber-500" style={{ height: Math.max((d.flags / max) * 130, d.flags ? 3 : 0) }} />
                  <div className="w-[22%] max-w-[7px] rounded-t-sm bg-violet-500" style={{ height: Math.max((d.quizzes / max) * 130, d.quizzes ? 3 : 0) }} />
                  <div className="w-[22%] max-w-[7px] rounded-t-sm bg-blue-500" style={{ height: Math.max((d.registrations / max) * 130, d.registrations ? 3 : 0) }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#7AD62A] inline-block" /> Lessons</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Flags</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-violet-500 inline-block" /> Quizzes</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> Registrations</span>
        </div>
      </div>

      {/* Distribution + Levels */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="angular-card bg-[#0f172a] p-6">
          <h3 className="font-semibold text-white mb-4">Role Distribution</h3>
          <div className="space-y-3">
            {data.roleDistribution.map((r) => (
              <HBar key={r.role} label={r.role} value={r.count} max={totals.users} color="emerald" />
            ))}
          </div>
        </div>
        <div className="angular-card bg-[#0f172a] p-6">
          <h3 className="font-semibold text-white mb-4">Division Distribution</h3>
          <div className="space-y-3">
            {data.divisionDistribution.map((d) => (
              <HBar key={d.division} label={d.division} value={d.count} max={maxOf(data.divisionDistribution.map((x) => x.count))} color="violet" />
            ))}
          </div>
        </div>
        <div className="angular-card bg-[#0f172a] p-6">
          <h3 className="font-semibold text-white mb-4">Users by Level</h3>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {data.levelDistribution.length === 0 && <p className="text-sm text-slate-500">No level data yet.</p>}
            {data.levelDistribution.map((l) => (
              <HBar key={l.level} label={`Level ${l.level}`} value={l.count} max={maxOf(data.levelDistribution.map((x) => x.count))} color="blue" />
            ))}
          </div>
        </div>
      </div>

      {/* Course completion + Lab usage */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="angular-card bg-[#0f172a] p-6">
          <h3 className="font-semibold text-white mb-4">Course Completion</h3>
          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
            {data.courseStats.length === 0 && <p className="text-sm text-slate-500">No course activity yet.</p>}
            {data.courseStats.map((c) => (
              <div key={c.courseId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600 truncate">{c.courseTitle}</span>
                  <span className="text-xs text-slate-500 shrink-0 ml-2">{c.completed}/{c.totalLessons} · {c.students} students</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#7AD62A] transition-all duration-500" style={{ width: `${c.completionRate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="angular-card bg-[#0f172a] p-6">
          <h3 className="font-semibold text-white mb-4">Lab Usage</h3>
          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
            {data.labStats.length === 0 && <p className="text-sm text-slate-500">No lab activity yet.</p>}
            {data.labStats.map((l) => (
              <div key={l.labId} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 truncate">{l.labTitle}</span>
                    <span className="text-xs text-slate-500 shrink-0 ml-2">{l.starts} starts · {l.solvers} solvers</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${(l.starts / maxLabStarts) * 100}%` }} />
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-mono px-2 py-1 rounded bg-slate-100 text-slate-500">{l.difficulty}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top performers */}
      <div className="angular-card bg-[#0f172a] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-white">Top Performers</h3>
          <span className="text-xs text-slate-500">By XP</span>
        </div>
        <div className="divide-y divide-slate-100">
          {data.topPerformers.map((u, i) => (
            <div key={u.id} className="px-6 py-3 flex items-center gap-4 hover:bg-white/5/50 transition-colors">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-white/10 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}>
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{u.name}</p>
                <p className="text-xs text-slate-500 truncate">{u.organization || u.city || u.email}</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                <span className="px-2 py-1 rounded bg-slate-100">{u.division}</span>
                <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-700">{u.flagsSolved} flags</span>
                <span className="px-2 py-1 rounded bg-[#7AD62A]/10 text-[#0F203A]">{u.lessonsCompleted} lessons</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">{u.xp.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">XP · Lv.{u.level}</p>
              </div>
            </div>
          ))}
          {data.topPerformers.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-slate-500">No students yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
