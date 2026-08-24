"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Lock,
  ChevronRight,
  Loader2,
  Shield,
  Star,
  Target,
  ExternalLink,
} from "lucide-react";

interface DomainResult {
  domainId: string;
  domainName: string;
  mastery: number;
  labsCompleted: number;
  meetsMastery: boolean;
  meetsLabs: boolean;
}

interface Evaluation {
  certificationId: string;
  code: string;
  name: string;
  eligible: boolean;
  domainResults: DomainResult[];
  domainsQualified: number;
  assessmentsPassed: number;
  xp: number;
  missingRequirements: string[];
}

interface AwardData {
  id: string;
  credentialId: string;
  awardedAt: string;
  expiresAt: string | null;
  evidenceSummary: unknown;
  certification: { name: string; code: string; description: string };
}

export default function CertificationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [awards, setAwards] = useState<AwardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [awarding, setAwarding] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [ev, aw] = await Promise.all([
          fetchApi("/certifications/evaluate"),
          fetchApi("/certifications/awards"),
        ]);
        if (!cancelled) {
          setEvaluations(ev);
          setAwards(aw);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleAward = async (code: string) => {
    setAwarding(code);
    try {
      await fetchApi(`/certifications/award/${code}`, { method: "POST" });
      const aw = await fetchApi("/certifications/awards");
      setAwards(aw);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to award");
    } finally {
      setAwarding(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#229C62]" />
      </div>
    );
  }

  const certColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    XCA: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-500" },
    XCP: { bg: "bg-[#E9F8EE]", border: "border-[#229C62]/30", text: "text-[#0F203A]", icon: "text-[#229C62]" },
    XCE: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-500" },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Award size={28} className="text-[#229C62]" />
          Certifications
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Earn industry-recognized certifications based on demonstrated competency
        </p>
      </div>

      {/* Earned Awards */}
      {awards.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Your Certifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {awards.map((aw) => {
              const colors = certColors[aw.certification.code] || certColors.XCA;
              return (
                <div
                  key={aw.id}
                  className={`${colors.bg} rounded-xl border ${colors.border} p-6 relative overflow-hidden`}
                >
                  <div className="absolute top-4 right-4">
                    <Shield size={40} className={`${colors.icon} opacity-20`} />
                  </div>
                  <div className="relative z-10">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      {aw.certification.code}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {aw.certification.name}
                    </h3>
                    <div className="text-xs text-slate-500 space-y-1">
                      <div>Awarded: {new Date(aw.awardedAt).toLocaleDateString()}</div>
                      {aw.expiresAt && (
                        <div>Expires: {new Date(aw.expiresAt).toLocaleDateString()}</div>
                      )}
                      <div className="font-mono text-[10px] mt-2">ID: {aw.credentialId}</div>
                    </div>
                    <Link
                      href={`/verify/${aw.credentialId}`}
                      className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-[#229C62] hover:underline"
                    >
                      <ExternalLink size={10} />
                      Verify
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Certifications */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Available Certifications</h2>
        <div className="space-y-4">
          {evaluations.map((ev) => {
            const colors = certColors[ev.code] || certColors.XCA;
            const isAwarded = awards.some((a) => a.certification.code === ev.code);

            return (
              <div
                key={ev.certificationId}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                        <Shield size={24} className={colors.icon} />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {ev.code}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{ev.name}</h3>
                      </div>
                    </div>
                    {isAwarded ? (
                      <span className="flex items-center gap-1 px-3 py-1 bg-[#E9F8EE] text-[#229C62] rounded-full text-xs font-medium">
                        <CheckCircle2 size={12} />
                        Earned
                      </span>
                    ) : ev.eligible ? (
                      <button
                        onClick={() => handleAward(ev.code)}
                        disabled={awarding === ev.code}
                        className="px-4 py-2 bg-[#229C62] hover:bg-[#0F203A] disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                      >
                        {awarding === ev.code ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Award size={14} />
                        )}
                        {awarding === ev.code ? "Awarding..." : "Claim"}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
                        <Lock size={12} />
                        Requirements pending
                      </span>
                    )}
                  </div>

                  {/* Domain Progress */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {ev.domainResults.slice(0, 6).map((dr) => (
                      <div
                        key={dr.domainId}
                        className={`p-3 rounded-lg border ${
                          dr.meetsMastery && dr.meetsLabs
                            ? "bg-[#E9F8EE] border-[#229C62]/20"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="text-xs font-medium text-slate-700 mb-1">
                          {dr.domainName}
                        </div>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className={dr.meetsMastery ? "text-[#229C62]" : "text-slate-500"}>
                            {dr.mastery}% mastery
                          </span>
                          <span className={dr.meetsLabs ? "text-[#229C62]" : "text-slate-500"}>
                            {dr.labsCompleted} labs
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>
                      <span className="font-semibold text-slate-900">{ev.domainsQualified}</span>/{ev.domainResults.length} domains
                    </span>
                    <span>
                      <span className="font-semibold text-slate-900">{ev.assessmentsPassed}</span> assessments
                    </span>
                    <span>
                      <span className="font-semibold text-slate-900">{ev.xp.toLocaleString()}</span> XP
                    </span>
                  </div>

                  {/* Missing Requirements */}
                  {ev.missingRequirements.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {ev.missingRequirements.map((mr, i) => (
                        <div key={i} className="text-xs text-amber-600 flex items-center gap-1">
                          <Target size={10} />
                          {mr}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
