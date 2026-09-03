"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Award,
  Calendar,
  User,
  ExternalLink,
  FileCheck,
  ShieldCheck,
  Copy,
} from "lucide-react";
import Link from "next/link";

interface VerificationResult {
  verified: boolean;
  credential?: string;
  code?: string;
  holder?: string;
  issued?: string;
  expires?: string;
  expired?: boolean;
  evidenceSummary?: {
    domainResults?: Array<{
      domainName: string;
      mastery: number;
      labsCompleted: number;
    }>;
    domainsQualified?: number;
    assessmentsPassed?: number;
    xp?: number;
  };
  error?: string;
}

export default function VerifyPage() {
  const { credentialId } = useParams();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `${process.env.BACKEND_INTERNAL_URL || "http://backend:4000"}/api/v1/verify/credential/${credentialId}`
        );
        const data = await res.json();
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) setResult({ verified: false, error: "Failed to verify" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [credentialId]);

  const copyRegistryId = async () => {
    try {
      await navigator.clipboard.writeText(String(credentialId));
    } catch {
      // Silent fallback; the registry page remains usable without clipboard access.
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F203A] to-[#7AD62A] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08111f] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Logo */}
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#7AD62A]">Issuer Registry</p>
          <h1 className="text-2xl font-bold text-white mt-2">XpertClass Credential Verification</h1>
          <p className="text-slate-400 text-sm mt-1">Verify certificate status, holder identity, issuance date, and competency evidence.</p>
        </div>

        {/* Verification Card */}
        <div className="bg-[#0f172a] rounded-2xl shadow-2xl overflow-hidden border border-white/10">
          {result?.verified ? (
            <>
              {/* Success Header */}
              <div className="bg-[#7AD62A]/10 p-6 border-b border-[#7AD62A]/20">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#7AD62A] flex items-center justify-center">
                      <CheckCircle2 size={32} className="text-[#0F203A]" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#7AD62A]">Verification Status</p>
                      <h2 className="text-xl font-bold text-white mt-1">Verified Credential</h2>
                      <p className="text-sm text-slate-300 mt-1">{result.credential}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#7AD62A]/20 bg-[#0f172a]/40 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Credential ID</p>
                    <p className="text-xs font-mono text-white mt-1">{credentialId}</p>
                  </div>
                </div>
                {result.expired && (
                  <span className="inline-block mt-4 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    Expired
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { title: "Issuer", text: "XpertClass Academy", icon: ShieldCheck },
                    { title: "Status", text: result.expired ? "Verified but expired" : "Verified and active", icon: CheckCircle2 },
                    { title: "Evidence", text: "Backed by recorded competency evidence", icon: FileCheck },
                  ].map((item) => (
                    <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <item.icon size={16} className="text-[#7AD62A] mb-2" />
                      <div className="text-xs uppercase tracking-wide text-slate-500">{item.title}</div>
                      <div className="text-sm font-medium text-white mt-1">{item.text}</div>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <User size={16} className="text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-500">Holder</div>
                    <div className="text-sm font-medium text-white">{result.holder}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <Award size={16} className="text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-500">Certification</div>
                    <div className="text-sm font-medium text-white">
                      {result.credential} ({result.code})
                    </div>
                  </div>
                </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <Calendar size={16} className="text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500">Issued</div>
                      <div className="text-sm font-medium text-white">
                        {result.issued ? new Date(result.issued).toLocaleDateString() : "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <Calendar size={16} className="text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500">Expires</div>
                      <div className="text-sm font-medium text-white">
                        {result.expires ? new Date(result.expires).toLocaleDateString() : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCheck size={16} className="text-[#7AD62A]" />
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Issuer statement</div>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    This record confirms that the listed holder satisfied the issuance conditions recorded by XpertClass Academy at the time of award.
                  </p>
                </div>

                <div className="rounded-xl border border-[#7AD62A]/20 bg-[#7AD62A]/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-[#7AD62A]">Registry reference</div>
                      <div className="text-sm font-mono text-white mt-1 break-all">{credentialId}</div>
                    </div>
                    <button
                      onClick={() => { void copyRegistryId(); }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-slate-200 hover:bg-white/5 text-xs font-medium transition-colors"
                    >
                      <Copy size={12} />
                      Copy ID
                    </button>
                  </div>
                </div>

                {/* Domain Results */}
                {result.evidenceSummary?.domainResults && result.evidenceSummary.domainResults.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase mb-2">Competency Evidence</div>
                    <div className="space-y-2">
                      {result.evidenceSummary.domainResults.map((d, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-300">{d.domainName}</span>
                            <span className="font-medium text-white">{d.mastery}%</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#7AD62A] rounded-full"
                              style={{ width: `${d.mastery}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {d.labsCompleted} labs completed
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary Stats */}
                {result.evidenceSummary && (
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {result.evidenceSummary.assessmentsPassed ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-500">Assessments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {result.evidenceSummary.domainsQualified ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-500">Domains</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {(result.evidenceSummary.xp ?? 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">XP</div>
                    </div>
                  </div>
                )}

                {/* Credential ID */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="text-[10px] text-slate-400 font-mono">
                    Registry record: {credentialId}
                  </div>
                  <Link href="/" className="inline-flex items-center gap-1 text-xs text-[#7AD62A] hover:underline">
                    <ExternalLink size={10} />
                    xpertclass.academy
                  </Link>
                </div>
              </div>
            </>
          ) : (
            /* Failure */
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
                <XCircle size={32} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Credential Not Found</h2>
              <p className="text-sm text-slate-500 mb-4">
                {result?.error || "This credential could not be verified."}
              </p>
              <div className="text-[10px] text-slate-400 font-mono">
                ID: {credentialId}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
