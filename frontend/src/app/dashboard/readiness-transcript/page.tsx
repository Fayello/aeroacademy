"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import {
  ArrowLeft,
  Award,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileCheck,
  GraduationCap,
  Loader2,
  Shield,
  Target,
} from "lucide-react";

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
    totalInlinePracticesCompleted: number;
    uniqueCoursesWithPractices: number;
    inlinePracticeCompletionRate: number;
  };
  domains: Array<{
    domainId: string;
    domainName: string;
    avgMastery: number;
    completionPct: number;
    completedOutcomes: number;
    totalOutcomes: number;
    avgAssessmentScore: number;
  }>;
  recentAssessments: Array<{
    id: string;
    title: string;
    domain: string;
    score: number;
    maxScore: number;
    completedAt: string;
  }>;
  recommendations: Array<{
    type: "OUTCOME" | "ASSESSMENT" | "LAB" | "MAINTAIN";
    priority: "HIGH" | "MEDIUM" | "LOW";
    title: string;
    description: string;
    link?: string;
  }>;
}

interface RankedProfile {
  user: { id: string; name: string | null; xp: number };
  level: number;
  globalRank: {
    rating: number;
    division: string;
    divisionTier: number;
    gamesPlayed: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
    domainCount: number;
  };
  domainRanks: Array<{
    domain: string;
    domainId: string;
    rating: number;
    division: string;
    divisionTier: number;
    gamesPlayed: number;
    mastery: number;
  }>;
  stats: {
    bossMissionsCompleted: number;
    labsCompleted: number;
  };
}

interface CapabilityRanking {
  capabilityScore: number;
  tier: string;
  breakdown: {
    technicalPerformance: number;
    difficulty: number;
    consistency: number;
    problemSolving: number;
  };
  details: {
    assessmentsCompleted: number;
    avgAssessmentScore: number;
    labsCompleted: number;
    flagsSolved: number;
    bossMissionsCompleted: number;
    activeDaysLast30: number;
    independenceRate: number;
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getReadinessBand(score: number) {
  if (score >= 80) return { label: "Assessment-ready", detail: "Strong enough for practical evaluation and employer review." };
  if (score >= 55) return { label: "Building readiness", detail: "Meaningful progress is visible, but more proof should be accumulated." };
  return { label: "Foundation stage", detail: "The learner is still assembling a practical record." };
}

export default function ReadinessTranscriptPage() {
  const searchParams = useSearchParams();
  const requestedUserId = searchParams.get("userId");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareExpiresAt, setShareExpiresAt] = useState<string | null>(null);
  const [competency, setCompetency] = useState<CompetencyProfile | null>(null);
  const [rankedProfile, setRankedProfile] = useState<RankedProfile | null>(null);
  const [capability, setCapability] = useState<CapabilityRanking | null>(null);
  const [inlinePracticeStats, setInlinePracticeStats] = useState<{
    totalCompleted: number;
    coursesWithPractices: number;
    completionRate: number;
    practicesScore: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const fallbackUserId = storedUser?.id as string | undefined;

        const targetUserId = requestedUserId || fallbackUserId;
        setViewerRole(storedUser?.role || null);

        if (!targetUserId) {
          window.location.href = "/login";
          return;
        }

        const transcript = await fetchApi<{
          competency: CompetencyProfile;
          rankedProfile: RankedProfile;
          capability: CapabilityRanking | null;
          inlinePracticeStats?: {
            totalCompleted: number;
            coursesWithPractices: number;
            completionRate: number;
            practicesScore: number;
          };
        }>(`/learning-outcomes/readiness-transcript/${targetUserId}`);

        if (cancelled) return;
        setCompetency(transcript.competency);
        setRankedProfile(transcript.rankedProfile);
        setCapability(transcript.capability);
        setInlinePracticeStats(transcript.inlinePracticeStats || null);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load readiness transcript");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [requestedUserId]);
  const transcriptScore = useMemo(() => {
    const competencyScore = competency?.summary.overallPct || 0;
    const capabilityScore = capability?.capabilityScore || 0;
    const assessmentScore = competency?.summary.overallAssessmentScore || 0;
    const labsScore = Math.min(100, (competency?.summary.totalLabsCompleted || 0) * 8);
    return Math.round(
      competencyScore * 0.35 +
        capabilityScore * 0.3 +
        assessmentScore * 0.2 +
        labsScore * 0.15,
    );
  }, [capability?.capabilityScore, competency?.summary]);

  const readinessBand = getReadinessBand(transcriptScore);
  const learnerName = rankedProfile?.user?.name || "Learner";
  const topDomains = (rankedProfile?.domainRanks || []).slice(0, 5);
  const recruiterView = Boolean(requestedUserId) && (viewerRole === "ADMIN" || viewerRole === "RECRUITER");

  async function handleCreateShareLink() {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const fallbackUserId = storedUser?.id as string | undefined;
    const targetUserId = requestedUserId || fallbackUserId;
    if (!targetUserId) return;

    setShareLoading(true);
    try {
      const response = await fetchApi<{ token: string; expiresAt: string }>(
        "/learning-outcomes/readiness-transcript/share",
        {
          method: "POST",
          body: JSON.stringify({ userId: targetUserId }),
        },
      );

      const shareUrl = `${window.location.origin}/transcript/${response.token}`;
      setShareUrl(shareUrl);
      setShareExpiresAt(response.expiresAt);

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied");
      } else {
        toast.success("Share link created");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create share link");
    } finally {
      setShareLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#7AD62A]" />
      </div>
    );
  }

  if (error || !competency || !rankedProfile) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-8 text-center">
        <p className="text-sm text-slate-300">{error || "Transcript unavailable."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={recruiterView ? "/dashboard/enterprise" : "/dashboard"} className="inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-200">
            <ArrowLeft size={15} />
            {recruiterView ? "Back to enterprise workspace" : "Back to dashboard"}
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-white">Readiness Transcript</h1>
          <p className="mt-1 text-sm text-slate-400">
            A recruiter-readable summary of practical evidence, capability, and learning momentum.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.08]"
        >
          <Download size={15} />
          Export / Print
        </button>
        <button
          type="button"
          onClick={() => void handleCreateShareLink()}
          disabled={shareLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7AD62A] px-4 py-2 text-sm font-semibold text-[#0F203A] transition-colors hover:bg-[#6bc422] disabled:opacity-70"
        >
          {shareLoading ? <Loader2 size={15} className="animate-spin" /> : <FileCheck size={15} />}
          Create share link
        </button>
      </div>

      {shareUrl && (
        <div className="rounded-2xl border border-[#7AD62A]/20 bg-[#0f172a] p-4">
          <p className="text-sm font-semibold text-white">Shareable transcript link</p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              readOnly
              value={shareUrl}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 outline-none"
            />
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(shareUrl);
                toast.success("Share link copied");
              }}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.08]"
            >
              Copy link
            </button>
          </div>
          {shareExpiresAt && (
            <p className="mt-2 text-xs text-slate-400">
              This link expires on {formatDate(shareExpiresAt)}.
            </p>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#132743] to-[#193553] p-6">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">
              {recruiterView ? "Recruiter view" : "Learner proof record"}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white">{learnerName}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              This transcript combines competency progress, domain capability, assessment performance, and practical activity into one clearer employability signal.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Transcript score</p>
                <p className="mt-2 text-2xl font-bold text-white">{transcriptScore}/100</p>
                <p className="mt-1 text-xs text-slate-400">{readinessBand.label}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Capability tier</p>
                <p className="mt-2 text-2xl font-bold text-white">{capability?.tier || "Unranked"}</p>
                <p className="mt-1 text-xs text-slate-400">{capability?.capabilityScore || 0}/100 capability score</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Competitive standing</p>
                <p className="mt-2 text-2xl font-bold text-white">{rankedProfile.globalRank.division}</p>
                <p className="mt-1 text-xs text-slate-400">Tier {rankedProfile.globalRank.divisionTier}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#7AD62A]/20 bg-[#0b1627]/80 p-5">
            <p className="text-sm font-semibold text-white">Decision summary</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{readinessBand.detail}</p>
            <div className="mt-4 space-y-3">
              {[
                `${competency.summary.completedOutcomes} of ${competency.summary.totalOutcomes} outcomes already demonstrated`,
                `${competency.summary.totalLabsCompleted} labs completed with ${competency.summary.totalAssessmentsCompleted} assessments on record`,
                ...(inlinePracticeStats && inlinePracticeStats.totalCompleted > 0
                  ? [`${inlinePracticeStats.totalCompleted} inline exercises passed across ${inlinePracticeStats.coursesWithPractices} course(s) (bridge to harder labs)`]
                  : []),
                `${rankedProfile.globalRank.gamesPlayed} ranked domain events and ${rankedProfile.stats.bossMissionsCompleted} boss missions completed`,
              ].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`grid gap-4 ${inlinePracticeStats && inlinePracticeStats.totalCompleted > 0 ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
        {[
          { label: "Outcome completion", value: `${competency.summary.overallPct}%`, icon: Target, detail: `${competency.summary.completedOutcomes}/${competency.summary.totalOutcomes}` },
          { label: "Assessment average", value: `${competency.summary.overallAssessmentScore}%`, icon: Award, detail: `${competency.summary.totalAssessmentsCompleted} completed` },
          { label: "Labs completed", value: `${competency.summary.totalLabsCompleted}`, icon: ClipboardCheck, detail: "Practical evidence" },
          ...(inlinePracticeStats && inlinePracticeStats.totalCompleted > 0
            ? [{ label: "Inline exercises", value: `${inlinePracticeStats.totalCompleted}`, icon: FileCheck, detail: `${inlinePracticeStats.completionRate}% completion rate` }]
            : []),
          { label: "XP level", value: `Level ${rankedProfile.level}`, icon: GraduationCap, detail: `${rankedProfile.user.xp.toLocaleString()} XP` },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
            <item.icon size={16} className="text-[#7AD62A]" />
            <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-xl font-bold text-white">{item.value}</p>
            <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[#7AD62A]" />
              <h3 className="text-sm font-semibold text-white">Capability Breakdown</h3>
            </div>
            {capability ? (
              <div className="mt-4 space-y-3">
                {[
                  { label: "Technical performance", value: capability.breakdown.technicalPerformance, detail: "Assessments, lab quality, and flag performance" },
                  { label: "Difficulty exposure", value: capability.breakdown.difficulty, detail: "More realistic and demanding work completed" },
                  { label: "Consistency", value: capability.breakdown.consistency, detail: `${capability.details.activeDaysLast30} active days in the last 30 days` },
                  { label: "Problem solving", value: capability.breakdown.problemSolving, detail: `${capability.details.independenceRate}% independent solve rate` },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <span className="text-sm font-bold text-[#7AD62A]">{item.value}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#7AD62A] to-[#6bc422]" style={{ width: `${item.value}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{item.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">Capability data is not available yet.</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-[#7AD62A]" />
              <h3 className="text-sm font-semibold text-white">Top Domain Strengths</h3>
            </div>
            <div className="mt-4 space-y-3">
              {topDomains.map((domain) => (
                <div key={domain.domainId} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{domain.domain}</p>
                    <span className="text-sm font-bold text-white">{domain.rating}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {domain.division} Tier {domain.divisionTier} · {domain.gamesPlayed} ranked activities · {domain.mastery}% mastery
                  </p>
                </div>
              ))}
              {topDomains.length === 0 && (
                <p className="text-sm text-slate-400">No ranked domain history is available yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6">
            <div className="flex items-center gap-2">
              <FileCheck size={16} className="text-[#7AD62A]" />
              <h3 className="text-sm font-semibold text-white">Domain Transcript</h3>
            </div>
            <div className="mt-4 space-y-3">
              {competency.domains
                .slice()
                .sort((a, b) => b.avgMastery - a.avgMastery)
                .map((domain) => (
                  <div key={domain.domainId} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{domain.domainName}</p>
                      <span className="text-sm font-bold text-[#7AD62A]">{domain.avgMastery}%</span>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Completion</p>
                        <p className="mt-1 text-sm text-slate-200">{domain.completionPct}%</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Outcomes</p>
                        <p className="mt-1 text-sm text-slate-200">{domain.completedOutcomes}/{domain.totalOutcomes}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Assessment avg</p>
                        <p className="mt-1 text-sm text-slate-200">{domain.avgAssessmentScore}%</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#7AD62A]" />
              <h3 className="text-sm font-semibold text-white">Recommended Next Moves</h3>
            </div>
            <div className="mt-4 space-y-3">
              {competency.recommendations.slice(0, 5).map((item, index) => (
                <div key={`${item.title}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                  {item.link && (
                    <Link href={item.link} className="mt-3 inline-flex text-xs font-medium text-[#7AD62A] hover:text-[#6bc422]">
                      Open recommended action
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {competency.recentAssessments.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-[#7AD62A]" />
                <h3 className="text-sm font-semibold text-white">Recent Assessments</h3>
              </div>
              <div className="mt-4 space-y-3">
                {competency.recentAssessments.slice(0, 4).map((assessment) => (
                  <div key={assessment.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{assessment.title}</p>
                      <span className="text-sm font-bold text-white">{assessment.score}/{assessment.maxScore}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {assessment.domain} · {formatDate(assessment.completedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
