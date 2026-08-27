"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  Award,
  Calendar,
  User,
  Target,
  ExternalLink,
} from "lucide-react";

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
          `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000"}/api/v1/verify/credential/${credentialId}`
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F203A] to-[#7AD62A] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F203A] to-[#7AD62A] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">XpertClass</h1>
          <p className="text-white/60 text-sm">Credential Verification</p>
        </div>

        {/* Verification Card */}
        <div className="bg-[#0f172a] rounded-2xl shadow-2xl overflow-hidden">
          {result?.verified ? (
            <>
              {/* Success Header */}
              <div className="bg-[#7AD62A]/10 p-6 text-center border-b border-[#7AD62A]/20">
                <div className="w-16 h-16 rounded-full bg-[#7AD62A] mx-auto mb-3 flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-[#0F203A]">Verified Credential</h2>
                <p className="text-sm text-[#7AD62A]">{result.credential}</p>
                {result.expired && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    Expired
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <User size={16} className="text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-500">Holder</div>
                    <div className="text-sm font-medium text-white">{result.holder}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Award size={16} className="text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-500">Certification</div>
                    <div className="text-sm font-medium text-white">
                      {result.credential} ({result.code})
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500">Issued</div>
                      <div className="text-sm font-medium text-white">
                        {result.issued ? new Date(result.issued).toLocaleDateString() : "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500">Expires</div>
                      <div className="text-sm font-medium text-white">
                        {result.expires ? new Date(result.expires).toLocaleDateString() : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Domain Results */}
                {result.evidenceSummary?.domainResults && result.evidenceSummary.domainResults.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase mb-2">Domain Competency</div>
                    <div className="space-y-2">
                      {result.evidenceSummary.domainResults.map((d, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-700">{d.domainName}</span>
                            <span className="font-medium text-white">{d.mastery}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
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
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
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
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[10px] text-slate-400 font-mono">
                    Credential: {credentialId}
                  </div>
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

        {/* Footer */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-white/60 hover:text-white text-sm flex items-center justify-center gap-1 transition-colors"
          >
            <ExternalLink size={12} />
            xpertclass.academy
          </a>
        </div>
      </div>
    </div>
  );
}
