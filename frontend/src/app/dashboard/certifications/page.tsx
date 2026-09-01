"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Lock,
  Loader2,
  Shield,
  Target,
  ExternalLink,
  FileCheck,
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
  const [confirmClaim, setConfirmClaim] = useState<string | null>(null);
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
        <Loader2 size={24} className="animate-spin text-[#7AD62A]" />
      </div>
    );
  }

  const certColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    XCA: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", icon: "text-blue-400" },
    XCP: { bg: "bg-[#7AD62A]/10", border: "border-[#7AD62A]/30", text: "text-[#7AD62A]", icon: "text-[#7AD62A]" },
    XCE: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", icon: "text-amber-400" },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up pb-20">
      {/* Header */}
      <div className="angular-card bg-[#0f172a] border border-white/10 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Credential System</p>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2 mt-2">
              <Award size={28} className="text-[#7AD62A]" />
              Certifications
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Credentials are awarded from demonstrated competency, not just completion. Track your requirements, prove practical ability, and verify what you earn.
            </p>
          </div>
          <div className="rounded-2xl border border-[#7AD62A]/20 bg-[#7AD62A]/10 p-4 min-w-[240px]">
            <p className="text-xs uppercase tracking-wide text-[#7AD62A]">Verification Standard</p>
            <p className="text-sm text-white mt-2">Each issued credential includes an issuer code, issue date, status, and public verification route.</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: "Mapped domains", text: "Credentials are tied to domain mastery and practical work.", icon: Shield },
          { title: "Assessment evidence", text: "Attempts, scores, and progress are part of the trust layer.", icon: FileCheck },
          { title: "Public registry", text: "Awarded credentials can be verified through a public page.", icon: ExternalLink },
        ].map((item) => (
          <div key={item.title} className="angular-card bg-[#0f172a] border border-white/10 p-5">
            <item.icon size={18} className="text-[#7AD62A] mb-3" />
            <h2 className="text-sm font-semibold text-white">{item.title}</h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="angular-card border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          {error}
        </div>
      )}

      {/* Earned Awards */}
      {awards.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Your Certifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {awards.map((aw) => {
              const colors = certColors[aw.certification.code] || certColors.XCA;
              return (
                <div
                  key={aw.id}
                  className={`${colors.bg} angular-card border ${colors.border} p-6 relative overflow-hidden`}
                >
                  <div className="absolute top-4 right-4">
                    <Shield size={40} className={`${colors.icon} opacity-20`} />
                  </div>
                  <div className="relative z-10">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      {aw.certification.code}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
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
                      href={`/credential/${aw.credentialId}`}
                      className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-[#7AD62A] hover:underline"
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
        <h2 className="text-lg font-semibold text-white mb-3">Available Certifications</h2>
        <div className="space-y-4">
          {evaluations.map((ev) => {
            const colors = certColors[ev.code] || certColors.XCA;
            const isAwarded = awards.some((a) => a.certification.code === ev.code);

            return (
              <div
                key={ev.certificationId}
                className="angular-card bg-[#0f172a] overflow-hidden"
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
                        <h3 className="text-lg font-bold text-white">{ev.name}</h3>
                      </div>
                    </div>
                    {isAwarded ? (
                      <span className="flex items-center gap-1 px-3 py-1 bg-[#7AD62A]/10 text-[#7AD62A] rounded-full text-xs font-medium">
                        <CheckCircle2 size={12} />
                        Earned
                      </span>
                    ) : ev.eligible ? (
                      confirmClaim === ev.code ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAward(ev.code)}
                            disabled={awarding === ev.code}
                            className="px-3 py-1.5 bg-[#7AD62A] hover:bg-[#6bc422] disabled:opacity-50 text-[#0F203A] rounded-lg text-xs font-medium transition-colors"
                          >
                            {awarding === ev.code ? <Loader2 size={12} className="animate-spin" /> : "Confirm"}
                          </button>
                          <button
                            onClick={() => setConfirmClaim(null)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmClaim(ev.code)}
                          className="px-4 py-2 bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                          <Award size={14} />
                          Claim
                        </button>
                      )
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 bg-white/5 text-slate-400 rounded-full text-xs font-medium">
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
                            ? "bg-[#7AD62A]/10 border-[#7AD62A]/20"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="text-xs font-medium text-slate-300 mb-1">
                          {dr.domainName}
                        </div>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className={dr.meetsMastery ? "text-[#7AD62A]" : "text-slate-500"}>
                            {dr.mastery}% mastery
                          </span>
                          <span className={dr.meetsLabs ? "text-[#7AD62A]" : "text-slate-500"}>
                            {dr.labsCompleted} labs
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>
                      <span className="font-semibold text-white">{ev.domainsQualified}</span>/{ev.domainResults.length} domains
                    </span>
                    <span>
                      <span className="font-semibold text-white">{ev.assessmentsPassed}</span> assessments
                    </span>
                    <span>
                      <span className="font-semibold text-white">{ev.xp.toLocaleString()}</span> XP
                    </span>
                  </div>

                  {/* Missing Requirements */}
                  {ev.missingRequirements.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {ev.missingRequirements.map((mr, i) => (
                        <div key={i} className="text-xs text-amber-400 flex items-center gap-1">
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
