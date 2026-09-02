"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shield, Award, CheckCircle, Trophy, Loader2, MapPin, GraduationCap, ChevronLeft, Mail, FileCheck, BriefcaseBusiness, ClipboardCheck } from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import type { CandidateRegistryProfile } from "@/types/api";

export default function CandidateRegistry() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<CandidateRegistryProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchApi(`/recruitment/candidate/${id}`) as CandidateRegistryProfile;
        if (!cancelled) setProfile(data);
      } catch {
        toast.error("Candidate not found.");
        router.push("/dashboard/enterprise");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  const readinessLabel = profile.evidence.proofLabel;
  const evidenceSummary = [
    { label: "Division", value: profile.division },
    { label: "Evidence score", value: `${profile.evidence.evidenceScore}/100` },
    { label: "Lab submissions", value: String(profile.evidence.labsSolved) },
    { label: "Learning progress", value: String(profile.evidence.lessonsCompleted) },
  ];
  const evidenceScore = profile.evidence.evidenceScore;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <Link href="/dashboard/enterprise" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-200">
        <ChevronLeft size={16} />
        Back to talent pool
      </Link>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#1b3657] p-6 flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="w-16 h-16 rounded-full bg-[#7AD62A]/10 flex items-center justify-center text-2xl font-bold text-[#0F203A] shrink-0">
          {profile.name?.[0] || '?'}
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Candidate Registry</p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-white">{profile.name}</h1>
            <CheckCircle size={16} className="text-[#7AD62A]" />
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1"><MapPin size={14} />{profile.city || "N/A"}</span>
            <span className="flex items-center gap-1"><GraduationCap size={14} />{profile.organization?.name || "Independent"}</span>
            <span className="flex items-center gap-1"><Mail size={14} />{profile.email}</span>
          </div>
          {profile.bio && <p className="text-sm text-slate-300 mt-3 max-w-2xl">{profile.bio}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Readiness signal</p>
              <p className="mt-2 text-sm font-semibold text-white">{profile.evidence.readinessLabel}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Organization link</p>
              <p className="mt-2 text-sm font-semibold text-white">{profile.organization?.type || "Independent"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Registry purpose</p>
              <p className="mt-2 text-sm font-semibold text-white">Evidence before outreach</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          <Link href={`/dashboard/readiness-transcript?userId=${profile.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.08]">
            <FileCheck size={15} />
            Open Transcript
          </Link>
          <a href={`mailto:${profile.email}`} className="btn-primary text-sm shrink-0 justify-center">
            Contact
          </a>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-xs text-slate-300">
            This record is designed to help institutions compare practical evidence, organization context, and learning momentum before making contact.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#7AD62A]/10 flex items-center justify-center mx-auto mb-3">
              <Shield size={28} className="text-[#7AD62A]" />
            </div>
            <p className="text-lg font-semibold text-white">{profile.division}</p>
            <p className="text-xs text-slate-500">{profile.clearance}</p>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Evidence score</p>
              <p className="mt-2 text-2xl font-bold text-white">{evidenceScore}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-[#7AD62A] to-[#6bc422]" style={{ width: `${evidenceScore}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-[#7AD62A]" />
              Evidence Summary
            </h3>
            <div className="space-y-2">
              {evidenceSummary.map((stat) => (
                <div key={stat.label} className="flex justify-between py-2 border-b border-white/10 last:border-0 text-sm">
                  <span className="text-slate-500">{stat.label}</span>
                  <span className="font-semibold text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
            <h3 className="text-sm font-semibold text-white mb-3">Metrics</h3>
            <div className="space-y-2">
              {[
                { label: "XP", value: profile.xp.toLocaleString() },
                { label: "Labs", value: profile._count.labSubmissions },
                { label: "Lessons", value: profile._count.progress },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between py-2 border-b border-white/10 last:border-0 text-sm">
                  <span className="text-slate-500">{stat.label}</span>
                  <span className="font-semibold text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <BriefcaseBusiness size={16} className="text-[#7AD62A]" />
              Hiring Relevance
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Best fit</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {profile.organization?.type === "UNIVERSITY" ? "Graduate pipeline review" : "Direct capability screening"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Why this profile matters</p>
                <p className="mt-2 text-sm font-semibold text-white">Practical activity is visible, not hidden behind claims.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Next move</p>
                <p className="mt-2 text-sm font-semibold text-white">Review evidence, then initiate contact.</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-[#7AD62A]" />
              Proof Checklist
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Practical activity",
                  value: profile.evidence.labsSolved > 0 ? "Visible" : "Limited",
                  detail: `${profile.evidence.labsSolved} lab submission${profile.evidence.labsSolved === 1 ? "" : "s"} recorded`,
                },
                {
                  label: "Learning continuity",
                  value: profile.evidence.lessonsCompleted > 0 ? "Visible" : "Limited",
                  detail: `${profile.evidence.lessonsCompleted} completed lesson record${profile.evidence.lessonsCompleted === 1 ? "" : "s"}`,
                },
                {
                  label: "Institution context",
                  value: profile.organization ? "Present" : "Independent",
                  detail: profile.organization?.name || "No linked institution",
                },
                {
                  label: "Recognition signals",
                  value: profile.achievements.length > 0 ? "Present" : "Limited",
                  detail: `${profile.achievements.length} achievement${profile.achievements.length === 1 ? "" : "s"} published`,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Shield size={16} className="text-[#7AD62A]" />
              Readiness Transcript
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Readiness band</p>
                <p className="mt-2 text-sm font-semibold text-white">{profile.evidence.readinessLabel}</p>
                <p className="mt-1 text-xs text-slate-400">{readinessLabel}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Recognition signals</p>
                <p className="mt-2 text-sm font-semibold text-white">{profile.evidence.achievementsCount} achievement{profile.evidence.achievementsCount === 1 ? "" : "s"}</p>
                <p className="mt-1 text-xs text-slate-400">Published signals that support practical activity.</p>
              </div>
            </div>

            {profile.evidence.topDomains.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Top domain strengths</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.evidence.topDomains.map((domain) => (
                    <span key={domain.domainId} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-200">
                      {domain.name} {domain.rating}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.capability && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Capability score", value: `${profile.capability.capabilityScore}/100`, detail: profile.capability.tier },
                  { label: "Technical performance", value: `${profile.capability.breakdown.technicalPerformance}`, detail: "Assessments, labs, and flag quality" },
                  { label: "Consistency", value: `${profile.capability.breakdown.consistency}`, detail: `${profile.capability.details.activeDaysLast30} active days in the last 30` },
                  { label: "Problem solving", value: `${profile.capability.breakdown.problemSolving}`, detail: `${profile.capability.details.independenceRate}% independent solve rate` },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Award size={16} className="text-amber-500" />
              Achievements
            </h3>
          {profile.achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile.achievements.map((item) => (
                <div key={item.achievement.id} className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Trophy size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.achievement.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Award} title="No achievements yet" description="" />
          )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FileCheck size={16} className="text-[#7AD62A]" />
              Registry Guidance
            </h3>
            <p className="text-sm leading-relaxed text-slate-300">
              Use this page as an institutional review screen: confirm location and organization context, compare practical activity, inspect achievements, then move into outreach only when the evidence matches your role requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
