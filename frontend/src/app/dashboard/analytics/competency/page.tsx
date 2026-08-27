"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  ArrowLeft,
  Zap,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";

interface RadarPoint {
  domain: string;
  displayName: string;
  outcomeScore: number;
  masteryScore: number;
  labCompletion: number;
  combined: number;
  totalOutcomes: number;
  completedOutcomes: number;
  totalSkills: number;
  activeSkills: number;
}

interface TrajectoryData {
  chartData: Array<Record<string, any>>;
  domainNames: string[];
}

interface CorrelationData {
  domainScores: Array<{
    domain: string;
    displayName: string;
    score: number;
    evidenceCount: number;
  }>;
  correlationMatrix: Array<{
    domainA: string;
    domainB: string;
    correlation: number;
    strength: string;
  }>;
  strongestCorrelations: Array<{
    domainA: string;
    domainB: string;
    correlation: number;
    strength: string;
  }>;
  gaps: string[];
}

interface TrendData {
  trends: Array<{
    domainId: string;
    domainName: string;
    thisWeekAvg: number;
    lastWeekAvg: number;
    change: number;
    changePct: number;
    trend: string;
    thisWeekEvidenceCount: number;
    lastWeekEvidenceCount: number;
  }>;
  overall: {
    thisWeekEvidence: number;
    lastWeekEvidence: number;
    trend: string;
  };
}

const DOMAIN_COLORS: Record<string, string> = {
  SYSTEMS: "#3b82f6",
  NETWORKING: "#06b6d4",
  DEVOPS: "#8b5cf6",
  DATABASES: "#f59e0b",
  SECURITY: "#ef4444",
  QA: "#10b981",
};

const STRENGTH_COLORS: Record<string, string> = {
  STRONG: "#22c55e",
  MODERATE: "#f59e0b",
  WEAK: "#f97316",
  NONE: "#94a3b8",
};

export default function CompetencyAnalyticsPage() {
  const [radarData, setRadarData] = useState<RadarPoint[]>([]);
  const [trajectory, setTrajectory] = useState<TrajectoryData | null>(null);
  const [correlation, setCorrelation] = useState<CorrelationData | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"radar" | "trajectory" | "correlation" | "trends">("radar");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user.id) {
          window.location.href = "/login";
          return;
        }
        const uid = user.id;
        const [radar, traj, corr, trendData] = await Promise.allSettled([
          fetchApi<RadarPoint[]>(`/competency-analytics/radar/${uid}`),
          fetchApi<TrajectoryData>(`/competency-analytics/trajectory/${uid}`),
          fetchApi<CorrelationData>(`/competency-analytics/correlation/${uid}`),
          fetchApi<TrendData>(`/competency-analytics/trends/${uid}`),
        ]);
        if (!cancelled) {
          if (radar.status === "fulfilled") setRadarData(radar.value);
          if (traj.status === "fulfilled") setTrajectory(traj.value);
          if (corr.status === "fulfilled") setCorrelation(corr.value);
          if (trendData.status === "fulfilled") setTrends(trendData.value);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  const hasData = radarData.some((d) => d.combined > 0);
  const tabs = [
    { key: "radar" as const, label: "Radar", icon: BarChart3 },
    { key: "trajectory" as const, label: "Trajectory", icon: TrendingUp },
    { key: "correlation" as const, label: "Correlation", icon: Zap },
    { key: "trends" as const, label: "Trends", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </Link>
        <PageHeader title="Competency Analytics" description="Deep insights into your competency patterns" />
      </div>

      {/* Empty state — no data at all */}
      {!hasData && !loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#E9F8EE] flex items-center justify-center mx-auto mb-4">
            <BarChart3 size={28} className="text-[#229C62]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Your competency profile is empty</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Complete courses, labs, and assessments to build your competency radar. Your skills will be mapped across domains like Systems, Networking, Security, and more.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/dashboard/courses"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#229C62] hover:bg-[#1d8a56] text-white text-sm font-semibold transition-colors"
            >
              <BookOpen size={16} />
              Browse Courses
            </Link>
            <Link
              href="/dashboard/labs"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
            >
              <FlaskConical size={16} />
              Try a Lab
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

      {/* Radar Chart */}
      {activeTab === "radar" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Domain Competency Radar
          </h3>
          {radarData.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">
              Complete labs and assessments to build your radar profile
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="displayName"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                    />
                    <Radar
                      name="Outcome Score"
                      dataKey="outcomeScore"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                    />
                    <Radar
                      name="Mastery Score"
                      dataKey="masteryScore"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.15}
                    />
                    <Radar
                      name="Lab Completion"
                      dataKey="labCompletion"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.1}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Domain Details */}
              <div className="space-y-3">
                {radarData.map((d) => (
                  <div key={d.domain} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: DOMAIN_COLORS[d.domain] || "#94a3b8" }}
                      />
                      <span className="text-sm font-medium text-slate-900">
                        {d.displayName}
                      </span>
                      <span className="text-xs font-bold text-slate-700 ml-auto">
                        {d.combined}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500">
                      <div>
                        <span className="font-medium">Outcomes:</span>{" "}
                        {d.completedOutcomes}/{d.totalOutcomes}
                      </div>
                      <div>
                        <span className="font-medium">Skills:</span>{" "}
                        {d.activeSkills}/{d.totalSkills}
                      </div>
                      <div>
                        <span className="font-medium">Labs:</span>{" "}
                        {d.labCompletion}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Growth Trajectory */}
      {activeTab === "trajectory" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Growth Trajectory (30 days)
          </h3>
          {!trajectory || trajectory.chartData.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">
              Complete activities to see your growth trajectory
            </p>
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trajectory.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  {trajectory.domainNames.map((dn) => (
                    <Line
                      key={dn}
                      type="monotone"
                      dataKey={dn}
                      stroke={DOMAIN_COLORS[dn] || "#94a3b8"}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Cross-Domain Correlation */}
      {activeTab === "correlation" && (
        <div className="space-y-6">
          {/* Correlation Heatmap */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Cross-Domain Correlation
            </h3>
            {!correlation || correlation.correlationMatrix.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-10">
                Complete activities in multiple domains to see correlations
              </p>
            ) : (
              <>
                {/* Heatmap Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="p-2"></th>
                        {correlation.domainScores.map((d) => (
                          <th key={d.domain} className="p-2 text-center font-medium text-slate-600">
                            {d.displayName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {correlation.domainScores.map((row) => (
                        <tr key={row.domain}>
                          <td className="p-2 font-medium text-slate-600 whitespace-nowrap">
                            {row.displayName}
                          </td>
                          {correlation.domainScores.map((col) => {
                            if (row.domain === col.domain) {
                              return (
                                <td key={col.domain} className="p-2 text-center">
                                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                                    —
                                  </div>
                                </td>
                              );
                            }
                            const pair = correlation.correlationMatrix.find(
                              (m) =>
                                (m.domainA === row.displayName && m.domainB === col.displayName) ||
                                (m.domainB === row.displayName && m.domainA === col.displayName)
                            );
                            const corr = pair?.correlation ?? 0;
                            const bg =
                              corr >= 0.7
                                ? "bg-green-100 text-green-700"
                                : corr >= 0.4
                                ? "bg-yellow-100 text-yellow-700"
                                : corr > 0
                                ? "bg-orange-100 text-orange-700"
                                : "bg-slate-50 text-slate-400";
                            return (
                              <td key={col.domain} className="p-2 text-center">
                                <div
                                  className={`w-8 h-8 rounded flex items-center justify-center font-bold ${bg}`}
                                >
                                  {corr.toFixed(2)}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Strongest Correlations */}
                {correlation.strongestCorrelations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-xs font-semibold text-slate-700 mb-3">
                      Strongest Correlations
                    </h4>
                    <div className="space-y-2">
                      {correlation.strongestCorrelations.map((c, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-200"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: STRENGTH_COLORS[c.strength] || "#94a3b8",
                            }}
                          />
                          <span className="text-sm text-slate-700">
                            {c.domainA} ↔ {c.domainB}
                          </span>
                          <span className="text-xs text-slate-500 ml-auto">
                            {c.correlation.toFixed(2)} ({c.strength.toLowerCase()})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gaps */}
                {correlation.gaps.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-700">
                      <strong>Gaps:</strong> No evidence in{" "}
                      {correlation.gaps.join(", ")}. Complete labs in these
                      domains to build a fuller profile.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Weekly Trends */}
      {activeTab === "trends" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Week-over-Week Trends
          </h3>
          {!trends || trends.trends.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">
              Complete activities to see weekly trends
            </p>
          ) : (
            <>
              {/* Overall */}
              <div className="flex items-center gap-4 mb-6 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  {trends.overall.trend === "UP" && (
                    <TrendingUp size={16} className="text-emerald-500" />
                  )}
                  {trends.overall.trend === "DOWN" && (
                    <TrendingDown size={16} className="text-red-500" />
                  )}
                  {trends.overall.trend === "STABLE" && (
                    <Minus size={16} className="text-slate-400" />
                  )}
                  <span className="text-sm font-medium text-slate-900">
                    Overall: {trends.overall.thisWeekEvidence} evidence this week
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  vs {trends.overall.lastWeekEvidence} last week
                </span>
              </div>

              {/* Domain Trends */}
              <div className="space-y-3">
                {trends.trends.map((t) => (
                  <div
                    key={t.domainId}
                    className="flex items-center gap-4 p-3 rounded-lg border border-slate-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{t.domainName}</p>
                      <p className="text-xs text-slate-500">
                        {t.thisWeekEvidenceCount} evidence this week
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {t.thisWeekAvg}%
                      </p>
                      <p className="text-[10px] text-slate-400">
                        from {t.lastWeekAvg}%
                      </p>
                    </div>
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.trend === "UP"
                          ? "bg-emerald-50 text-emerald-600"
                          : t.trend === "DOWN"
                          ? "bg-red-50 text-red-600"
                          : "bg-slate-50 text-slate-500"
                      }`}
                    >
                      {t.trend === "UP" && <TrendingUp size={12} />}
                      {t.trend === "DOWN" && <TrendingDown size={12} />}
                      {t.trend === "STABLE" && <Minus size={12} />}
                      {t.change > 0 ? "+" : ""}
                      {t.change}%
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
}
