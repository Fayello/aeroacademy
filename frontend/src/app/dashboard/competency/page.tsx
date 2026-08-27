"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  BookOpen,
  FlaskConical,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";

interface OutcomeSummary {
  id: string;
  code: string;
  title: string;
  description: string;
  weight: number;
  domainId: string;
  avgScore: number;
  attemptCount: number;
  lastDemonstrated: string | null;
  daysSinceLastPractice: number | null;
  isFading: boolean;
  coveredSkills: string[];
  linkedLabs: Array<{ id: string; title: string; difficulty: number }>;
  completedLabIds: string[];
  labCompletionPct: number;
}

interface DomainSummary {
  domainId: string;
  domainName: string;
  icon: string | null;
  totalOutcomes: number;
  completedOutcomes: number;
  completionPct: number;
  avgMastery: number;
  fadingOutcomes: number;
  totalSkillXp: number;
  assessmentCount: number;
  avgAssessmentScore: number;
  outcomes: OutcomeSummary[];
}

interface Recommendation {
  type: "OUTCOME" | "ASSESSMENT" | "LAB" | "MAINTAIN";
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  domainId: string;
  link?: string;
}

interface CompetencyProfile {
  userId: string;
  summary: {
    totalOutcomes: number;
    completedOutcomes: number;
    overallPct: number;
    fadingCount: number;
    totalLabsCompleted: number;
    totalAssessmentsCompleted: number;
    overallAssessmentScore: number;
  };
  domains: DomainSummary[];
  recentAssessments: Array<{
    id: string;
    title: string;
    domain: string;
    score: number;
    maxScore: number;
    breakdown: Record<string, number> | null;
    completedAt: string;
  }>;
  recommendations: Recommendation[];
}

const DOMAIN_COLORS: Record<string, string> = {
  SYSTEMS: "from-blue-500 to-blue-600",
  NETWORKING: "from-cyan-500 to-cyan-600",
  DEVOPS: "from-violet-500 to-violet-600",
  DATABASES: "from-amber-500 to-amber-600",
  SECURITY: "from-red-500 to-red-600",
  QA: "from-emerald-500 to-emerald-600",
};

const DOMAIN_BG: Record<string, string> = {
  SYSTEMS: "bg-blue-500/10 border-blue-200",
  NETWORKING: "bg-cyan-50 border-cyan-200",
  DEVOPS: "bg-violet-50 border-violet-200",
  DATABASES: "bg-amber-500/10 border-amber-200",
  SECURITY: "bg-red-500/10 border-red-200",
  QA: "bg-emerald-50 border-emerald-200",
};

export default function CompetencyPage() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<CompetencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user.id) {
          window.location.href = "/login";
          return;
        }
        const data = await fetchApi<CompetencyProfile>(
          `/learning-outcomes/competency-profile/${user.id}/enhanced`
        );
        if (!cancelled) setProfile(data);
      } catch (err: any) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load competency profile");
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

  if (error) {
    return (
      <div className="text-center py-20">
        <XCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-sm text-slate-600">{error}</p>
      </div>
    );
  }

  if (!profile) return null;

  const { summary, domains, recentAssessments, recommendations } = profile;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Competency Profile
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your learning outcomes, assessment scores, and recommendations
          </p>
        </div>
        <Link
          href="/dashboard/analytics/competency"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors self-start"
        >
          <BarChart3 size={14} />
          Analytics
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-[#7AD62A]" />
            <span className="text-xs font-medium text-slate-500">Outcomes</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {summary.completedOutcomes}/{summary.totalOutcomes}
          </p>
          <p className="text-[11px] text-slate-400">{summary.overallPct}% complete</p>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical size={16} className="text-blue-500" />
            <span className="text-xs font-medium text-slate-500">Labs Done</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary.totalLabsCompleted}</p>
          <p className="text-[11px] text-slate-400">unique labs completed</p>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-violet-500" />
            <span className="text-xs font-medium text-slate-500">Assessments</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary.totalAssessmentsCompleted}</p>
          <p className="text-[11px] text-slate-400">
            avg score: {summary.overallAssessmentScore}%
          </p>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-xs font-medium text-slate-500">Fading</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary.fadingCount}</p>
          <p className="text-[11px] text-slate-400">outcomes need attention</p>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
          <h3 className="text-sm font-semibold text-white mb-4">
            Recommended Actions
          </h3>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  rec.priority === "HIGH"
                    ? "bg-red-500/10 border-red-200"
                    : rec.priority === "MEDIUM"
                    ? "bg-amber-500/10 border-amber-200"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {rec.type === "MAINTAIN" && <Clock size={14} className="text-amber-500" />}
                  {rec.type === "LAB" && <FlaskConical size={14} className="text-blue-500" />}
                  {rec.type === "OUTCOME" && <BookOpen size={14} className="text-slate-500" />}
                  {rec.type === "ASSESSMENT" && <Target size={14} className="text-violet-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{rec.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{rec.description}</p>
                </div>
                {rec.link && (
                  <Link
                    href={rec.link}
                    className="shrink-0 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Go <ChevronRight size={12} className="inline" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Domains</h3>
        {domains.map((domain) => {
          const isExpanded = expandedDomain === domain.domainId;
          const gradientClass = DOMAIN_COLORS[domain.domainId] || "from-slate-500 to-slate-600";
          const bgClass = DOMAIN_BG[domain.domainId] || "bg-white/5 border-white/10";

          return (
            <div
              key={domain.domainId}
              className={`rounded-xl border border-white/10 bg-[#0f172a] overflow-hidden`}
            >
              <button
                onClick={() => setExpandedDomain(isExpanded ? null : domain.domainId)}
                className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-xs font-bold">
                    {domain.domainName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-white">{domain.domainName}</p>
                  <p className="text-xs text-slate-500">
                    {domain.completedOutcomes}/{domain.totalOutcomes} outcomes ({domain.completionPct}%)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{domain.avgMastery}%</p>
                    <p className="text-[10px] text-slate-400">mastery</p>
                  </div>
                  {domain.fadingOutcomes > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200">
                      <AlertTriangle size={10} />
                      {domain.fadingOutcomes} fading
                    </span>
                  )}
                  <ChevronRight
                    size={16}
                    className={`text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 p-4 space-y-3">
                  {/* Domain Progress Bar */}
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-500`}
                      style={{ width: `${domain.completionPct}%` }}
                    />
                  </div>

                  {/* Outcomes List */}
                  <div className="space-y-2">
                    {domain.outcomes.map((outcome) => (
                      <div
                        key={outcome.id}
                        className={`p-3 rounded-lg border ${
                          outcome.isFading
                            ? "bg-amber-500/10 border-amber-200"
                            : outcome.avgScore >= 70
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-slate-400">
                                {outcome.code}
                              </span>
                              <p className="text-sm font-medium text-white truncate">
                                {outcome.title}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {outcome.description}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-bold ${
                              outcome.avgScore >= 70
                                ? "text-emerald-600"
                                : outcome.avgScore >= 40
                                ? "text-amber-600"
                                : "text-red-600"
                            }`}>
                              {outcome.avgScore}%
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {outcome.attemptCount} evidence
                            </p>
                          </div>
                        </div>

                        {/* Lab Links */}
                        {outcome.linkedLabs.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {outcome.linkedLabs.map((lab) => {
                              const isCompleted = outcome.completedLabIds.includes(lab.id);
                              return (
                                <Link
                                  key={lab.id}
                                  href={`/dashboard/labs/${lab.id}`}
                                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border ${
                                    isCompleted
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                      : "bg-[#0f172a] border-white/10 text-slate-600 hover:border-blue-300"
                                  }`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 size={10} className="text-emerald-500" />
                                  ) : (
                                    <FlaskConical size={10} />
                                  )}
                                  {lab.title.length > 30 ? lab.title.slice(0, 30) + "..." : lab.title}
                                </Link>
                              );
                            })}
                          </div>
                        )}

                        {/* Fading Warning */}
                        {outcome.isFading && (
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-600">
                            <AlertTriangle size={10} />
                            Last practiced {outcome.daysSinceLastPractice} days ago — mastery may be decaying
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Assessments */}
      {recentAssessments.length > 0 && (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Assessments</h3>
          <div className="space-y-2">
            {recentAssessments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="shrink-0">
                  <Target size={14} className="text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{a.title}</p>
                  <p className="text-xs text-slate-500">{a.domain}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${
                    (a.score / a.maxScore) * 100 >= 70 ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {a.score}/{a.maxScore}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(a.completedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
