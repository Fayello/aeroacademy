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
      {/* Header */}
      <div>
        <Link
          href="/dashboard/cohorts"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#7AD62A] transition-colors mb-3"
        >
          <ChevronLeft size={16} />
          All cohorts
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users size={28} className="text-[#7AD62A]" />
          {dashboard.cohort.name}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {dashboard.cohort.semester} {dashboard.cohort.year} — {dashboard.curriculum.name}
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-white">{dashboard.stats.totalStudents}</div>
          <div className="text-xs text-slate-500">Students</div>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-[#7AD62A]">{dashboard.stats.totalLabsCompleted}</div>
          <div className="text-xs text-slate-500">Labs Completed</div>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {dashboard.stats.strongestDomain?.avgMastery ?? 0}%
          </div>
          <div className="text-xs text-slate-500">Avg Practical</div>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{dashboard.stats.atRiskCount}</div>
          <div className="text-xs text-slate-500">At Risk</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {[
          { key: "overview" as const, label: "Overview" },
          { key: "students" as const, label: "Students" },
          { key: "risk" as const, label: "At Risk" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[#0f172a] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Strongest / Weakest */}
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
                    <span className="text-slate-700">{d.name}</span>
                    <span className="font-medium text-white">{d.avgMastery}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
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
                  <div className="text-xs text-slate-500 mt-0.5">
                    {d.labsCompleted} labs completed
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === "students" && (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Student</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Division</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Labs</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Mastery</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dashboard.members.map((m) => (
                <tr key={m.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#7AD62A]/10 flex items-center justify-center text-xs font-semibold text-[#0F203A]">
                        {(m.name || m.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{m.name || m.email.split("@")[0]}</div>
                        <div className="text-xs text-slate-500">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-xs text-slate-500">{m.division}</td>
                  <td className="px-6 py-3 text-center text-sm text-slate-700">{m.labsCompleted}</td>
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
                  <td className="px-6 py-3 text-right text-sm text-slate-600">{m.xp.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* At Risk Tab */}
      {activeTab === "risk" && (
        <div className="space-y-4">
          {dashboard.stats.atRiskStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Award size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No students at risk</p>
            </div>
          ) : (
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-white">
                  {dashboard.stats.atRiskCount} Students Below 50% Mastery
                </h3>
              </div>
              <div className="space-y-3">
                {dashboard.stats.atRiskStudents.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-semibold text-amber-700">
                        {(s.name || s.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {s.name || s.email.split("@")[0]}
                        </div>
                        <div className="text-xs text-slate-500">{s.email}</div>
                      </div>
                    </div>
                    <span className="text-xs text-amber-600 font-medium">At Risk</span>
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
