"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import {
  ArrowLeft,
  Award,
  ClipboardCheck,
  FileCheck,
  GraduationCap,
  Loader2,
  MapPin,
  Scale,
  Shield,
} from "lucide-react";
import type { CandidateRegistryProfile } from "@/types/api";

function compareValue(values: number[]) {
  const highest = Math.max(...values);
  return highest;
}

export default function EnterpriseComparePage() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") || "";
  const ids = useMemo(
    () =>
      idsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 3),
    [idsParam],
  );
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<CandidateRegistryProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const results = await Promise.all(
          ids.map((id) =>
            fetchApi<CandidateRegistryProfile>(`/recruitment/candidate/${id}`),
          ),
        );
        if (!cancelled) setProfiles(results);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load comparison candidates");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#7AD62A]" />
      </div>
    );
  }

  if (ids.length === 0) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/enterprise" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
          <ArrowLeft size={15} />
          Back to enterprise workspace
        </Link>
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-8 text-center">
          <p className="text-lg font-semibold text-white">No candidates selected</p>
          <p className="mt-2 text-sm text-slate-400">Choose up to three candidates from the talent pool to compare them side by side.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/enterprise" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
          <ArrowLeft size={15} />
          Back to enterprise workspace
        </Link>
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-8 text-center">
          <p className="text-lg font-semibold text-white">Comparison unavailable</p>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const evidenceTop = compareValue(profiles.map((profile) => profile.evidence.evidenceScore));
  const labsTop = compareValue(profiles.map((profile) => profile.evidence.labsSolved));
  const lessonsTop = compareValue(profiles.map((profile) => profile.evidence.lessonsCompleted));
  const capabilityTop = compareValue(profiles.map((profile) => profile.capability?.capabilityScore || 0));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard/enterprise" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
            <ArrowLeft size={15} />
            Back to enterprise workspace
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-white">Candidate Comparison</h1>
          <p className="mt-1 text-sm text-slate-400">
            Side-by-side proof review for recruiter and institution decisions.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#7AD62A]/20 bg-[#7AD62A]/10 px-4 py-2 text-sm text-slate-200">
          <Scale size={15} className="text-[#7AD62A]" />
          {profiles.length} candidate{profiles.length === 1 ? "" : "s"} selected
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {profiles.map((profile) => {
          const bestEvidence = profile.evidence.evidenceScore === evidenceTop;
          const bestLabs = profile.evidence.labsSolved === labsTop;
          const bestLessons = profile.evidence.lessonsCompleted === lessonsTop;
          const bestCapability = (profile.capability?.capabilityScore || 0) === capabilityTop;

          return (
            <div key={profile.id} className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{profile.name}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} />
                      {profile.city || "N/A"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap size={12} />
                      {profile.organization?.name || "Independent"}
                    </span>
                  </div>
                </div>
                <Link href={`/dashboard/enterprise/registry/${profile.id}`} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/[0.08]">
                  Open
                </Link>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Decision summary</p>
                <p className="mt-2 text-sm font-semibold text-white">{profile.evidence.readinessLabel}</p>
                <p className="mt-1 text-sm text-slate-400">{profile.evidence.proofLabel}</p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Evidence score", value: `${profile.evidence.evidenceScore}/100`, best: bestEvidence, icon: FileCheck },
                  { label: "Labs solved", value: `${profile.evidence.labsSolved}`, best: bestLabs, icon: ClipboardCheck },
                  { label: "Lessons completed", value: `${profile.evidence.lessonsCompleted}`, best: bestLessons, icon: Award },
                  { label: "Capability score", value: `${profile.capability?.capabilityScore || 0}/100`, best: bestCapability, icon: Shield },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl border p-4 ${item.best ? "border-[#7AD62A]/25 bg-[#7AD62A]/10" : "border-white/10 bg-white/[0.03]"}`}>
                    <item.icon size={15} className={item.best ? "text-[#7AD62A]" : "text-slate-400"} />
                    <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              {profile.evidence.topDomains.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Top domains</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.evidence.topDomains.map((domain) => (
                      <span key={`${profile.id}-${domain.domainId}`} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-300">
                        {domain.name} {domain.rating}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.capability && (
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Technical performance", value: profile.capability.breakdown.technicalPerformance },
                    { label: "Difficulty exposure", value: profile.capability.breakdown.difficulty },
                    { label: "Consistency", value: profile.capability.breakdown.consistency },
                    { label: "Problem solving", value: profile.capability.breakdown.problemSolving },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-400">{item.label}</p>
                        <span className="text-xs font-semibold text-white">{item.value}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#7AD62A] to-[#6bc422]" style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 flex gap-2 border-t border-white/10 pt-4">
                <Link href={`/dashboard/readiness-transcript?userId=${profile.id}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-100 transition-colors hover:bg-white/[0.08]">
                  <FileCheck size={13} />
                  Transcript
                </Link>
                <a href={`mailto:${profile.email}`} className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#7AD62A] px-3 py-2 text-xs font-semibold text-[#0F203A] transition-colors hover:bg-[#6bc422]">
                  Contact
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
