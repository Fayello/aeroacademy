"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { API_URL, API_VERSION } from "@/lib/api";
import {
  Award,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileCheck,
  Loader2,
  Shield,
  Target,
} from "lucide-react";

interface PublicTranscript {
  learner: {
    id: string;
    name: string | null;
    email: string;
    city: string | null;
    bio: string | null;
    xp: number;
    rank: number;
    division: string;
    createdAt: string;
    organization: { name: string; type: string } | null;
  };
  transcriptScore: number;
  readiness: { label: string; detail: string };
  generatedAt: string;
  competency: {
    summary: {
      totalOutcomes: number;
      completedOutcomes: number;
      overallPct: number;
      fadingCount: number;
      totalLabsCompleted: number;
      totalAssessmentsCompleted: number;
      overallAssessmentScore: number;
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
  };
  rankedProfile: {
    level: number;
    globalRank: {
      division: string;
      divisionTier: number;
      gamesPlayed: number;
    };
    domainRanks: Array<{
      domainId: string;
      domain: string;
      rating: number;
      division: string;
      divisionTier: number;
      gamesPlayed: number;
      mastery: number;
    }>;
  } | null;
  capability: {
    capabilityScore: number;
    tier: string;
    breakdown: {
      technicalPerformance: number;
      difficulty: number;
      consistency: number;
      problemSolving: number;
    };
  } | null;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PublicTranscriptPage() {
  const params = useParams<{ token: string }>();
  const token = typeof params?.token === "string" ? params.token : "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PublicTranscript | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) return;
      try {
        const response = await fetch(
          `${API_URL}${API_VERSION}/learning-outcomes/readiness-transcript/public/${token}`,
          { credentials: "include" },
        );
        if (!response.ok) {
          throw new Error("This transcript link is invalid or expired");
        }
        const transcript = (await response.json()) as PublicTranscript;
        if (!cancelled) setData(transcript);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "This transcript link is invalid or expired");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08111f]">
        <Loader2 size={28} className="animate-spin text-[#7AD62A]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#08111f] px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#0f172a] p-8 text-center">
          <p className="text-lg font-semibold text-white">Transcript unavailable</p>
          <p className="mt-2 text-sm text-slate-400">{error || "The transcript could not be loaded."}</p>
        </div>
      </div>
    );
  }

  const topDomains = (data.rankedProfile?.domainRanks || []).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#08111f] px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Shared readiness transcript</p>
            <h1 className="mt-2 text-3xl font-bold">{data.learner.name || "Learner"}</h1>
            <p className="mt-2 text-sm text-slate-400">
              Generated on {formatDate(data.generatedAt)} for recruiter, institution, and capability review.
            </p>
          </div>
          <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.08]">
            Visit XpertClass
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#132743] to-[#193553] p-6">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Capability summary</p>
              <h2 className="mt-3 text-3xl font-bold">{data.transcriptScore}/100</h2>
              <p className="mt-2 text-sm font-semibold text-white">{data.readiness.label}</p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">{data.readiness.detail}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Level</p>
                  <p className="mt-2 text-xl font-bold text-white">{data.rankedProfile?.level || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Division</p>
                  <p className="mt-2 text-xl font-bold text-white">{data.rankedProfile?.globalRank.division || data.learner.division}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Capability tier</p>
                  <p className="mt-2 text-xl font-bold text-white">{data.capability?.tier || "Pending"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#7AD62A]/20 bg-[#0b1627]/80 p-5">
              <p className="text-sm font-semibold text-white">Evidence highlights</p>
              <div className="mt-4 space-y-3">
                {[
                  `${data.competency.summary.completedOutcomes} of ${data.competency.summary.totalOutcomes} outcomes demonstrated`,
                  `${data.competency.summary.totalLabsCompleted} labs and ${data.competency.summary.totalAssessmentsCompleted} assessments completed`,
                  `${data.rankedProfile?.globalRank.gamesPlayed || 0} ranked activities recorded`,
                ].map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Outcome completion", value: `${data.competency.summary.overallPct}%`, icon: Target, detail: `${data.competency.summary.completedOutcomes}/${data.competency.summary.totalOutcomes}` },
            { label: "Assessment average", value: `${data.competency.summary.overallAssessmentScore}%`, icon: Award, detail: `${data.competency.summary.totalAssessmentsCompleted} completed` },
            { label: "Labs completed", value: `${data.competency.summary.totalLabsCompleted}`, icon: ClipboardCheck, detail: "Practical evidence" },
            { label: "Capability score", value: `${data.capability?.capabilityScore || 0}/100`, icon: Shield, detail: data.capability?.tier || "Pending" },
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
              </div>
            </div>

            {data.capability && (
              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-[#7AD62A]" />
                  <h3 className="text-sm font-semibold text-white">Capability Breakdown</h3>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Technical performance", value: data.capability.breakdown.technicalPerformance },
                    { label: "Difficulty exposure", value: data.capability.breakdown.difficulty },
                    { label: "Consistency", value: data.capability.breakdown.consistency },
                    { label: "Problem solving", value: data.capability.breakdown.problemSolving },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{item.label}</p>
                        <span className="text-sm font-bold text-[#7AD62A]">{item.value}</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#7AD62A] to-[#6bc422]" style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6">
              <div className="flex items-center gap-2">
                <FileCheck size={16} className="text-[#7AD62A]" />
                <h3 className="text-sm font-semibold text-white">Domain Transcript</h3>
              </div>
              <div className="mt-4 space-y-3">
                {data.competency.domains
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

            {data.competency.recentAssessments.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#7AD62A]" />
                  <h3 className="text-sm font-semibold text-white">Recent Assessments</h3>
                </div>
                <div className="mt-4 space-y-3">
                  {data.competency.recentAssessments.slice(0, 4).map((assessment) => (
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
    </div>
  );
}
