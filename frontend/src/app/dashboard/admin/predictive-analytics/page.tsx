"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  Minus,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
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
  const styles: Record<AtRiskStudent["riskLevel"], string> = {
    critical: "border-red-400/20 bg-red-500/10 text-red-300",
    high: "border-orange-400/20 bg-orange-500/10 text-orange-300",
    medium: "border-amber-400/20 bg-amber-500/10 text-amber-300",
    low: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  };

  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[level]}`}>{level.charAt(0).toUpperCase() + level.slice(1)} Risk</span>;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "improving") return <TrendingUp className="h-4 w-4 text-[#7AD62A]" />;
  if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-400" />;
  return <Minus className="h-4 w-4 text-slate-400" />;
}

function InterventionIcon({ type }: { type: string }) {
  switch (type) {
    case "email":
      return <Mail className="h-4 w-4 text-blue-400" />;
    case "meeting":
      return <UserCheck className="h-4 w-4 text-violet-400" />;
    case "assignment":
      return <BookOpen className="h-4 w-4 text-amber-400" />;
    case "resource":
      return <Target className="h-4 w-4 text-cyan-400" />;
    case "peer":
      return <Users className="h-4 w-4 text-teal-400" />;
    default:
      return <Zap className="h-4 w-4 text-slate-400" />;
  }
}

function RiskBar({
  distribution,
}: {
  distribution: PredictiveDashboard["riskDistribution"];
}) {
  const total = distribution.reduce((sum, item) => sum + item.count, 0);
  const colors = ["bg-emerald-500", "bg-lime-500", "bg-amber-500", "bg-orange-500", "bg-red-500"];

  return (
    <div className="space-y-3">
      <div className="flex h-4 overflow-hidden rounded-full bg-white/5">
        {distribution.map((segment, index) => {
          const pct = total > 0 ? (segment.count / total) * 100 : 0;
          return <div key={segment.range} className={colors[index % colors.length]} style={{ width: `${pct}%` }} title={`${segment.range}: ${segment.count}`} />;
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-300">
        {distribution.map((segment, index) => (
          <div key={segment.range} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-sm ${colors[index % colors.length]}`} />
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
  const [selectedCohort, setSelectedCohort] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [expandedIntervention, setExpandedIntervention] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchApi<PredictiveDashboard>("/api/v1/ai/predictive/dashboard"),
      fetchApi<AtRiskStudent[]>("/api/v1/ai/predictive/at-risk"),
      fetchApi<Cohort[]>("/api/v1/cohorts"),
    ])
      .then(([dashData, riskData, cohortData]) => {
        if (cancelled) return;
        setDashboard(dashData);
        setAtRiskStudents(riskData);
        setCohorts(cohortData);
        if (cohortData.length > 0) setSelectedCohort(cohortData[0].id);
      })
      .catch((err) => {
        console.error("Failed to load predictive dashboard", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCohort) return;
    let cancelled = false;

    fetchApi<Intervention[]>(`/api/v1/ai/predictive/interventions/${selectedCohort}`)
      .then((data) => {
        if (!cancelled) setInterventions(data);
      })
      .catch((err) => {
        console.error("Failed to load interventions", err);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCohort]);

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
      <div className="angular-card overflow-hidden border border-white/10 bg-gradient-to-br from-[#0F203A] via-slate-900 to-[#16315c] p-8 text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-[#7AD62A]" />
              <div>
                <h1 className="text-2xl font-bold">Predictive Analytics</h1>
                <p className="mt-1 text-slate-300">
                  Detect learner risk early, route interventions by urgency, and document support actions before performance drops become credential failures.
                </p>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Primary Use</p>
                <p className="mt-2 font-medium text-white">Escalate high-risk learners into coach, faculty, or remediation workflows.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Evidence Standard</p>
                <p className="mt-2 font-medium text-white">Pair risk scores with activity, mastery, and assessment trends before taking action.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Next Step</p>
                <p className="mt-2 font-medium text-white">Review at-risk learners first, then trigger interventions for the affected cohort.</p>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/admin/cohort-intelligence"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Compare with cohort intelligence
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-[#0f172a] p-1.5">
        {(["overview", "at-risk", "interventions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-[#7AD62A] text-[#0F203A] shadow-sm" : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            {tab === "overview" && "Overview"}
            {tab === "at-risk" && "At-Risk Students"}
            {tab === "interventions" && "Interventions"}
          </button>
        ))}
      </div>

      {activeTab === "overview" && overview && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total Students" value={overview.totalStudents} icon={Users} valueClassName="text-white" />
            <MetricCard label="High / Critical Risk" value={overview.criticalRisk + overview.highRisk} icon={AlertTriangle} valueClassName="text-red-400" iconClassName="text-red-400 bg-red-500/10" />
            <MetricCard label="Avg Mastery" value={`${(overview.avgMastery * 100).toFixed(1)}%`} icon={BarChart3} valueClassName="text-white" />
            <MetricCard label="Avg Assessment" value={`${overview.avgAssessmentScore.toFixed(1)}%`} icon={CheckCircle} valueClassName="text-white" />
          </div>

          <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Risk Distribution</h3>
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
            <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Student Trends</h3>
              {dashboard?.trendSummary && (
                <div className="space-y-3">
                  <TrendRow label="Improving" value={dashboard.trendSummary.improving} icon={<TrendingUp className="h-4 w-4 text-[#7AD62A]" />} tone="bg-emerald-500/10 text-[#7AD62A]" />
                  <TrendRow label="Stable" value={dashboard.trendSummary.stable} icon={<Minus className="h-4 w-4 text-slate-400" />} tone="bg-white/5 text-white" />
                  <TrendRow label="Declining" value={dashboard.trendSummary.declining} icon={<TrendingDown className="h-4 w-4 text-red-400" />} tone="bg-red-500/10 text-red-300" />
                </div>
              )}
            </div>

            <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Most Common Intervention Signals</h3>
              <div className="space-y-2">
                {dashboard?.topInterventions?.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <span className="text-sm text-slate-100">{item.action}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{item.frequency}x</span>
                      <span>{item.successRate}% success</span>
                    </div>
                  </div>
                ))}
                {(!dashboard?.topInterventions || dashboard.topInterventions.length === 0) && (
                  <p className="py-4 text-center text-sm text-slate-400">No intervention signal data available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "at-risk" && (
        <div className="space-y-4">
          {atRiskStudents.length === 0 && (
            <div className="angular-card border border-white/10 bg-[#0f172a] py-12 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-[#7AD62A]" />
              <p className="mt-4 text-lg font-medium text-white">No at-risk students identified</p>
              <p className="text-sm text-slate-400">All students are currently performing within expected thresholds.</p>
            </div>
          )}
          {atRiskStudents.map((student) => {
            const isExpanded = expandedStudent === student.userId;
            return (
              <div key={student.userId} className="angular-card overflow-hidden border border-white/10 bg-[#0f172a]">
                <button
                  onClick={() => setExpandedStudent(isExpanded ? null : student.userId)}
                  className="flex w-full flex-col gap-4 p-5 text-left sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0F203A] text-sm font-bold text-white">
                        {student.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0f172a] ${
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
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{student.name}</p>
                        <RiskBadge level={student.riskLevel} />
                      </div>
                      <p className="text-sm text-slate-400">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Risk Score</p>
                      <p className="font-bold text-white">{(student.riskScore * 100).toFixed(0)}%</p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/10 bg-white/5 p-5">
                    <div className="mb-4 space-y-2">
                      <h4 className="text-sm font-medium text-slate-100">Risk Factors</h4>
                      <div className="flex flex-wrap gap-2">
                        {student.riskFactors.map((factor, index) => (
                          <span key={index} className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="mb-2 text-sm font-medium text-slate-100">Trends</h4>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <TrendInfo title="Activity" value={student.trends.activityTrend} />
                        <TrendInfo title="Mastery" value={student.trends.masteryTrend} />
                        <TrendInfo title="Assessment" value={student.trends.assessmentTrend} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <SmallMetric label="Days Inactive" value={student.metrics.daysSinceActive} valueClassName="text-white" />
                      <SmallMetric label="Mastery" value={`${(student.metrics.overallMastery * 100).toFixed(1)}%`} valueClassName="text-[#7AD62A]" />
                      <SmallMetric label="Assessment Avg" value={`${student.metrics.avgAssessmentScore.toFixed(1)}%`} valueClassName="text-white" />
                      <SmallMetric label="Level" value={student.metrics.level} valueClassName="text-white" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "interventions" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="text-sm font-medium text-slate-200">Select Cohort:</label>
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-white focus:border-[#7AD62A] focus:outline-none focus:ring-1 focus:ring-[#7AD62A]"
            >
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </option>
              ))}
            </select>
          </div>

          {interventions.length === 0 && (
            <div className="angular-card border border-white/10 bg-[#0f172a] py-12 text-center">
              <Target className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-lg font-medium text-white">No interventions for this cohort</p>
            </div>
          )}

          {interventions.map((intervention) => {
            const isExpanded = expandedIntervention === intervention.userId;
            return (
              <div key={intervention.userId} className="angular-card overflow-hidden border border-white/10 bg-[#0f172a]">
                <button
                  onClick={() => setExpandedIntervention(isExpanded ? null : intervention.userId)}
                  className="flex w-full flex-col gap-3 p-5 text-left sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">{intervention.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {intervention.urgency}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 text-[#7AD62A]" />
                        {(intervention.successProbability * 100).toFixed(0)}% success
                      </span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-white/10 bg-white/5 p-5">
                    <h4 className="mb-3 text-sm font-medium text-slate-100">Recommended Actions</h4>
                    <div className="space-y-3">
                      {intervention.actions.map((action, index) => (
                        <div key={index} className="flex items-start gap-3 rounded-lg bg-[#0b1220] p-4">
                          <div className="mt-0.5">
                            <InterventionIcon type={action.type} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{action.title}</p>
                            <p className="mt-1 text-xs text-slate-400">{action.description}</p>
                            <p className="mt-1 text-xs text-[#7AD62A]">Expected: {action.expectedImpact}</p>
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

function MetricCard({
  label,
  value,
  icon: Icon,
  valueClassName,
  iconClassName = "text-[#7AD62A] bg-[#7AD62A]/10",
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  valueClassName: string;
  iconClassName?: string;
}) {
  return (
    <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${iconClassName}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className={`text-2xl font-bold ${valueClassName}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function TrendRow({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className={`flex items-center justify-between rounded-lg p-3 ${tone}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}

function TrendInfo({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-[#0b1220] p-3">
      <TrendIcon trend={value} />
      <div>
        <p className="text-xs text-slate-400">{title}</p>
        <p className="text-sm font-medium capitalize text-white">{value}</p>
      </div>
    </div>
  );
}

function SmallMetric({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string | number;
  valueClassName: string;
}) {
  return (
    <div className="rounded-lg bg-[#0b1220] p-3 text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
}
