"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  Mail,
  UserCheck,
  BookOpen,
  Zap,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface AtRiskStudent {
  userId: string;
  name: string;
  email: string;
  riskScore: number;
  riskLevel: "critical" | "high" | "medium" | "low";
  riskFactors: string[];
  trends: {
    activityTrend: string;
    masteryTrend: string;
    assessmentTrend: string;
  };
  metrics: {
    daysSinceActive: number;
    overallMastery: number;
    avgAssessmentScore: number;
    totalXp: number;
    level: number;
  };
}

interface PredictiveDashboard {
  cohortOverview: {
    totalStudents: number;
    criticalRisk: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    avgMastery: number;
    avgAssessmentScore: number;
  };
  trendSummary: {
    improving: number;
    stable: number;
    declining: number;
  };
  topInterventions: Array<{
    action: string;
    frequency: number;
    successRate: number;
  }>;
  riskDistribution: Array<{ range: string; count: number }>;
}

interface Intervention {
  userId: string;
  name: string;
  urgency: string;
  actions: Array<{
    type: string;
    title: string;
    description: string;
    expectedImpact: string;
  }>;
  successProbability: number;
}

interface Cohort {
  id: string;
  name: string;
}

function RiskBadge({ level }: { level: AtRiskStudent["riskLevel"] }) {
  const styles: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-green-100 text-green-700 border-green-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[level]}`}
    >
      {level.charAt(0).toUpperCase() + level.slice(1)} Risk
    </span>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "improving")
    return <TrendingUp className="h-4 w-4 text-[#7AD62A]" />;
  if (trend === "declining")
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-slate-400" />;
}

function InterventionIcon({ type }: { type: string }) {
  switch (type) {
    case "email":
      return <Mail className="h-4 w-4 text-blue-500" />;
    case "meeting":
      return <UserCheck className="h-4 w-4 text-purple-500" />;
    case "assignment":
      return <BookOpen className="h-4 w-4 text-amber-500" />;
    case "resource":
      return <Target className="h-4 w-4 text-teal-500" />;
    case "peer":
      return <Users className="h-4 w-4 text-cyan-500" />;
    default:
      return <Zap className="h-4 w-4 text-slate-500" />;
  }
}

function RiskBar({
  distribution,
}: {
  distribution: PredictiveDashboard["riskDistribution"];
}) {
  const total = distribution.reduce((sum, d) => sum + d.count, 0);
  const colors = ["bg-green-500", "bg-lime-500", "bg-amber-500", "bg-orange-500", "bg-red-500"];
  return (
    <div className="space-y-2">
      <div className="flex h-4 overflow-hidden rounded-full">
        {distribution.map((segment, i) => {
          const pct = total > 0 ? (segment.count / total) * 100 : 0;
          return (
            <div
              key={segment.range}
              className={`${colors[i % colors.length]}`}
              style={{ width: `${pct}%` }}
              title={`${segment.range}: ${segment.count}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        {distribution.map((segment, i) => (
          <div key={segment.range} className="flex items-center gap-1.5">
            <div
              className={`h-2.5 w-2.5 rounded-sm ${colors[i % colors.length]}`}
            />
            {segment.range}: {segment.count}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PredictiveAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "at-risk" | "interventions">("overview");
  const [dashboard, setDashboard] = useState<PredictiveDashboard | null>(null);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [expandedIntervention, setExpandedIntervention] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [dashData, riskData] = await Promise.all([
        fetchApi<PredictiveDashboard>("/api/v1/ai/predictive/dashboard"),
        fetchApi<AtRiskStudent[]>("/api/v1/ai/predictive/at-risk"),
      ]);
      setDashboard(dashData);
      setAtRiskStudents(riskData);
    } catch (err) {
      console.error("Failed to load predictive dashboard", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCohorts = useCallback(async () => {
    try {
      const data = await fetchApi<Cohort[]>("/api/v1/cohorts");
      setCohorts(data);
      if (data.length > 0) setSelectedCohort(data[0].id);
    } catch (err) {
      console.error("Failed to load cohorts", err);
    }
  }, []);

  const loadInterventions = useCallback(async (cohortId: string) => {
    if (!cohortId) return;
    try {
      const data = await fetchApi<Intervention[]>(
        `/api/v1/ai/predictive/interventions/${cohortId}`
      );
      setInterventions(data);
    } catch (err) {
      console.error("Failed to load interventions", err);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadCohorts();
  }, [loadDashboard, loadCohorts]);

  useEffect(() => {
    if (selectedCohort) loadInterventions(selectedCohort);
  }, [selectedCohort, loadInterventions]);

  const riskLevelForScore = (score: number): AtRiskStudent["riskLevel"] => {
    if (score >= 0.75) return "critical";
    if (score >= 0.5) return "high";
    if (score >= 0.25) return "medium";
    return "low";
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7AD62A]" />
      </div>
    );
  }

  const overview = dashboard?.cohortOverview;

  return (
    <div className="space-y-8 p-6">
      {/* Hero Header */}
      <div className="angular-card p-8 text-white" style={{ backgroundColor: "#0F203A" }}>
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-[#7AD62A]" />
          <div>
            <h1 className="text-2xl font-bold">Predictive Analytics</h1>
            <p className="mt-1 text-slate-300">
              Early identification of at-risk students and targeted interventions
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {(["overview", "at-risk", "interventions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-[#0f172a] text-[#0F203A] shadow-sm"
                : "text-slate-500 hover:text-slate-200"
            }`}
          >
            {tab === "overview" && "Overview"}
            {tab === "at-risk" && "At-Risk Students"}
            {tab === "interventions" && "Interventions"}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && overview && (
        <div className="space-y-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#7AD62A]/10 p-2.5">
                  <Users className="h-5 w-5 text-[#7AD62A]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Students</p>
                  <p className="text-2xl font-bold text-[#0F203A]">
                    {overview.totalStudents}
                  </p>
                </div>
              </div>
            </div>
            <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2.5">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">High / Critical Risk</p>
                  <p className="text-2xl font-bold text-red-600">
                    {overview.criticalRisk + overview.highRisk}
                  </p>
                </div>
              </div>
            </div>
            <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#7AD62A]/10 p-2.5">
                  <BarChart3 className="h-5 w-5 text-[#7AD62A]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Avg Mastery</p>
                  <p className="text-2xl font-bold text-[#0F203A]">
                    {(overview.avgMastery * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#7AD62A]/10 p-2.5">
                  <CheckCircle className="h-5 w-5 text-[#7AD62A]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Avg Assessment</p>
                  <p className="text-2xl font-bold text-[#0F203A]">
                    {overview.avgAssessmentScore.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#0F203A]">
              Risk Distribution
            </h3>
            <RiskBar
              distribution={
                dashboard?.riskDistribution ?? [
                  { range: "0-20%", count: overview.lowRisk },
                  { range: "20-40%", count: overview.mediumRisk },
                  { range: "40-60%", count: overview.highRisk },
                  { range: "60-80%", count: overview.criticalRisk },
                  { range: "80-100%", count: 0 },
                ]
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Student Trends */}
            <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
              <h3 className="mb-4 text-lg font-semibold text-[#0F203A]">
                Student Trends
              </h3>
              {dashboard?.trendSummary && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-green-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#7AD62A]" />
                      <span className="text-sm font-medium text-slate-700">
                        Improving
                      </span>
                    </div>
                    <span className="text-lg font-bold text-[#7AD62A]">
                      {dashboard.trendSummary.improving}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">
                        Stable
                      </span>
                    </div>
                    <span className="text-lg font-bold text-slate-600">
                      {dashboard.trendSummary.stable}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-red-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-slate-700">
                        Declining
                      </span>
                    </div>
                    <span className="text-lg font-bold text-red-500">
                      {dashboard.trendSummary.declining}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Most Common Risk Factors */}
            <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
              <h3 className="mb-4 text-lg font-semibold text-[#0F203A]">
                Most Common Risk Factors
              </h3>
              <div className="space-y-2">
                {dashboard?.topInterventions?.slice(0, 5).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-slate-700">{item.action}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{item.frequency}×</span>
                      <span>{item.successRate}% success</span>
                    </div>
                  </div>
                ))}
                {(!dashboard?.topInterventions ||
                  dashboard.topInterventions.length === 0) && (
                  <p className="py-4 text-center text-sm text-slate-400">
                    No risk factor data available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* At-Risk Students Tab */}
      {activeTab === "at-risk" && (
        <div className="space-y-4">
          {atRiskStudents.length === 0 && (
            <div className="angular-card border border-white/10 bg-[#0f172a] py-12 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-[#7AD62A]" />
              <p className="mt-4 text-lg font-medium text-slate-700">
                No at-risk students identified
              </p>
              <p className="text-sm text-slate-400">
                All students are performing well
              </p>
            </div>
          )}
          {atRiskStudents.map((student) => {
            const isExpanded = expandedStudent === student.userId;
            return (
              <div
                key={student.userId}
                className="overflow-hidden angular-card border border-white/10 bg-[#0f172a]"
              >
                <button
                  onClick={() =>
                    setExpandedStudent(isExpanded ? null : student.userId)
                  }
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0F203A] text-sm font-bold text-white">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                          student.riskLevel === "critical"
                            ? "bg-red-500"
                            : student.riskLevel === "high"
                            ? "bg-orange-500"
                            : student.riskLevel === "medium"
                            ? "bg-amber-500"
                            : "bg-green-500"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#0F203A]">
                          {student.name}
                        </p>
                        <RiskBadge level={student.riskLevel} />
                      </div>
                      <p className="text-sm text-slate-500">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Risk Score</p>
                      <p className="font-bold text-[#0F203A]">
                        {(student.riskScore * 100).toFixed(0)}%
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-white/5 p-5">
                    <div className="mb-4 space-y-2">
                      <h4 className="text-sm font-medium text-slate-700">
                        Risk Factors
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {student.riskFactors.map((factor, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-700"
                          >
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="mb-2 text-sm font-medium text-slate-700">
                        Trends
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 rounded-lg bg-[#0f172a] p-3">
                          <TrendIcon trend={student.trends.activityTrend} />
                          <div>
                            <p className="text-xs text-slate-400">Activity</p>
                            <p className="text-sm font-medium capitalize text-slate-700">
                              {student.trends.activityTrend}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-[#0f172a] p-3">
                          <TrendIcon trend={student.trends.masteryTrend} />
                          <div>
                            <p className="text-xs text-slate-400">Mastery</p>
                            <p className="text-sm font-medium capitalize text-slate-700">
                              {student.trends.masteryTrend}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-[#0f172a] p-3">
                          <TrendIcon trend={student.trends.assessmentTrend} />
                          <div>
                            <p className="text-xs text-slate-400">Assessment</p>
                            <p className="text-sm font-medium capitalize text-slate-700">
                              {student.trends.assessmentTrend}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg bg-[#0f172a] p-3 text-center">
                        <p className="text-xs text-slate-400">Days Inactive</p>
                        <p className="mt-1 text-lg font-bold text-[#0F203A]">
                          {student.metrics.daysSinceActive}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#0f172a] p-3 text-center">
                        <p className="text-xs text-slate-400">Mastery</p>
                        <p className="mt-1 text-lg font-bold text-[#7AD62A]">
                          {(student.metrics.overallMastery * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#0f172a] p-3 text-center">
                        <p className="text-xs text-slate-400">Assessment Avg</p>
                        <p className="mt-1 text-lg font-bold text-[#0F203A]">
                          {student.metrics.avgAssessmentScore.toFixed(1)}%
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#0f172a] p-3 text-center">
                        <p className="text-xs text-slate-400">Level</p>
                        <p className="mt-1 text-lg font-bold text-[#0F203A]">
                          {student.metrics.level}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Interventions Tab */}
      {activeTab === "interventions" && (
        <div className="space-y-6">
          {/* Cohort Selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-700">
              Select Cohort:
            </label>
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm focus:border-[#7AD62A] focus:outline-none focus:ring-1 focus:ring-[#7AD62A]"
            >
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {interventions.length === 0 && (
            <div className="angular-card border border-white/10 bg-[#0f172a] py-12 text-center">
              <Target className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-lg font-medium text-slate-700">
                No interventions for this cohort
              </p>
            </div>
          )}

          {interventions.map((intervention) => {
            const isExpanded = expandedIntervention === intervention.userId;
            return (
              <div
                key={intervention.userId}
                className="overflow-hidden angular-card border border-white/10 bg-[#0f172a]"
              >
                <button
                  onClick={() =>
                    setExpandedIntervention(
                      isExpanded ? null : intervention.userId
                    )
                  }
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <div>
                    <p className="font-semibold text-[#0F203A]">
                      {intervention.name}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {intervention.urgency}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 text-[#7AD62A]" />
                        {(intervention.successProbability * 100).toFixed(0)}%
                        success
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-white/5 p-5">
                    <h4 className="mb-3 text-sm font-medium text-slate-700">
                      Recommended Actions
                    </h4>
                    <div className="space-y-3">
                      {intervention.actions.map((action, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-lg bg-[#0f172a] p-4"
                        >
                          <div className="mt-0.5">
                            <InterventionIcon type={action.type} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#0F203A]">
                              {action.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {action.description}
                            </p>
                            <p className="mt-1 text-xs text-[#7AD62A]">
                              Expected: {action.expectedImpact}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}