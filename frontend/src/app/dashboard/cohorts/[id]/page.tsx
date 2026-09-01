"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Users,
  AlertTriangle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Award,
  BookOpen,
  ExternalLink,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";

interface DomainStat {
  domainId: string;
  name: string;
  avgMastery: number;
  labsCompleted: number;
}

interface Member {
  id: string;
  name: string;
  email: string;
  division: string;
  xp: number;
  role: string;
  labsCompleted: number;
  avgMastery: number;
}

interface Dashboard {
  cohort: { id: string; name: string; year: number; semester: string };
  curriculum: { id: string; name: string };
  stats: {
    totalStudents: number;
    totalLabsCompleted: number;
    strongestDomain: DomainStat | null;
    weakestDomain: DomainStat | null;
    atRiskCount: number;
    atRiskStudents: { id: string; name: string; email: string }[];
  };
  domains: DomainStat[];
  members: Member[];
}

export default function CohortDetailPage() {
  const { id } = useParams();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "risk">("overview");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchApi(`/cohorts/${id}/dashboard`);
        if (!cancelled) setDashboard(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#7AD62A]" />
      </div>
    );
  }

  if (error || !dashboard) {
    return <div className="text-center py-20 text-red-500 text-sm">{error || "Not found"}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div>
        <Link
          href="/dashboard/cohorts"
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-[#7AD62A]"
        >
          <ChevronLeft size={16} />
          All cohorts
        </Link>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#1b3657] p-6">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Cohort Operations</p>
              <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-white">
                <Users size={28} className="text-[#7AD62A]" />
                {dashboard.cohort.name}
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                {dashboard.cohort.semester} {dashboard.cohort.year} · {dashboard.curriculum.name}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
                Use this record to review cohort readiness, spot academic risk early, and move from delivery activity into defensible grading and intervention.
              </p>
            </div>
            <div className="rounded-2xl border border-[#7AD62A]/20 bg-[#0b1627]/80 p-5">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={16} className="text-[#7AD62A]" />
                <p className="text-sm font-semibold text-white">Best next step</p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Current risk load</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {dashboard.stats.atRiskCount > 0 ? `${dashboard.stats.atRiskCount} learners need intervention review` : "No immediate intervention queue"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Suggested operator path</p>
                  <p className="mt-2 text-sm font-semibold text-white">Review overview, inspect student evidence, then act on risk.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-white">{dashboard.stats.totalStudents}</div>
          <div className="text-xs text-slate-400">Students</div>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-[#7AD62A]">{dashboard.stats.totalLabsCompleted}</div>
          <div className="text-xs text-slate-400">Labs Completed</div>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {dashboard.stats.strongestDomain?.avgMastery ?? 0}%
          </div>
          <div className="text-xs text-slate-400">Avg Practical</div>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{dashboard.stats.atRiskCount}</div>
          <div className="text-xs text-slate-400">At Risk</div>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center gap-1 rounded-lg bg-white/5 p-1 sm:w-fit">
        {[
          { key: "overview" as const, label: "Overview" },
          { key: "students" as const, label: "Students" },
          { key: "risk" as const, label: "At Risk" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:flex-none ${
              activeTab === tab.key
                ? "bg-[#0f172a] text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-[#7AD62A]" />
                <h3 className="text-sm font-semibold text-white">Strongest Domain</h3>
              </div>
              {dashboard.stats.strongestDomain ? (
                <>
                  <div className="text-2xl font-bold text-white mb-1">
                    {dashboard.stats.strongestDomain.name}
                  </div>
                  <div className="text-sm text-[#7AD62A]">
                    {dashboard.stats.strongestDomain.avgMastery}% avg mastery
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">No data</p>
              )}
            </div>
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={18} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-white">Weakest Domain</h3>
              </div>
              {dashboard.stats.weakestDomain ? (
                <>
                  <div className="text-2xl font-bold text-white mb-1">
                    {dashboard.stats.weakestDomain.name}
                  </div>
                  <div className="text-sm text-amber-500">
                    {dashboard.stats.weakestDomain.avgMastery}% avg mastery
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">No data</p>
              )}
            </div>
          </div>

          {/* Domain Heatmap */}
          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Domain Mastery Heatmap</h3>
            <div className="space-y-3">
              {dashboard.domains.map((d) => (
                <div key={d.domainId}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-200">{d.name}</span>
                    <span className="font-medium text-white">{d.avgMastery}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${d.avgMastery}%`,
                        backgroundColor:
                          d.avgMastery >= 80
                            ? "#229C62"
                            : d.avgMastery >= 60
                            ? "#7AD62A"
                            : d.avgMastery >= 40
                            ? "#f59e0b"
                            : "#ef4444",
                      }}
                    />
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {d.labsCompleted} labs completed
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#7AD62A]" />
                <h3 className="text-sm font-semibold text-white">Teaching signal</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                {dashboard.stats.totalStudents > 0
                  ? "This cohort has enough activity to review readiness and grading discipline, not just enrollment."
                  : "Enrollment is visible, but more learner activity is needed before the cohort becomes a strong academic signal."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-[#7AD62A]" />
                <h3 className="text-sm font-semibold text-white">Instructional focus</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                Use the strongest and weakest domains to decide whether your next action is reinforcement, progression, or intervention.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
              <div className="flex items-center gap-2">
                <ExternalLink size={16} className="text-[#7AD62A]" />
                <h3 className="text-sm font-semibold text-white">Follow-through</h3>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <Link href="/dashboard/gradebook" className="inline-flex items-center justify-center rounded-lg bg-[#7AD62A] px-4 py-2 text-sm font-semibold text-[#0F203A] transition-colors hover:bg-[#6bc422]">
                  Open gradebook
                </Link>
                <Link href="/dashboard/curricula" className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5">
                  Review curricula
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
            <h3 className="text-sm font-semibold text-white">Student evidence review</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Review practical activity, mastery, and XP together so academic decisions are based on visible proof rather than assumptions.
            </p>
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-white/10 bg-[#0f172a] md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-400">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-400">Division</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase text-slate-400">Labs</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase text-slate-400">Mastery</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-400">XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {dashboard.members.map((m) => (
                <tr key={m.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#7AD62A]/10 flex items-center justify-center text-xs font-semibold text-[#0F203A]">
                        {(m.name || m.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{m.name || m.email.split("@")[0]}</div>
                        <div className="text-xs text-slate-400">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-xs text-slate-300">{m.division}</td>
                  <td className="px-6 py-3 text-center text-sm text-slate-200">{m.labsCompleted}</td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`text-sm font-medium ${
                        m.avgMastery >= 80
                          ? "text-[#7AD62A]"
                          : m.avgMastery >= 60
                          ? "text-amber-500"
                          : "text-red-500"
                      }`}
                    >
                      {m.avgMastery}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-slate-200">{m.xp.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {dashboard.members.map((m) => (
              <div key={m.id} className="rounded-xl border border-white/10 bg-[#0f172a] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{m.name || m.email.split("@")[0]}</p>
                    <p className="mt-1 truncate text-xs text-slate-400">{m.email}</p>
                  </div>
                  <div className="rounded-full bg-[#7AD62A]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#7AD62A]">
                    {m.division}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-white/[0.04] p-3">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Labs</p>
                    <p className="mt-1 text-sm font-semibold text-white">{m.labsCompleted}</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-3">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Mastery</p>
                    <p className="mt-1 text-sm font-semibold text-white">{m.avgMastery}%</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-3">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">XP</p>
                    <p className="mt-1 text-sm font-semibold text-white">{m.xp.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "risk" && (
        <div className="space-y-4">
          {dashboard.stats.atRiskStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Award size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No students at risk</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-white">
                  {dashboard.stats.atRiskCount} Students Below 50% Mastery
                </h3>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-slate-300">
                These learners need a guided intervention review before assessment confidence or transcript trust can improve.
              </p>
              <div className="space-y-3">
                {dashboard.stats.atRiskStudents.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-semibold text-amber-700">
                        {(s.name || s.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {s.name || s.email.split("@")[0]}
                        </div>
                        <div className="text-xs text-slate-400">{s.email}</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300">At Risk</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
