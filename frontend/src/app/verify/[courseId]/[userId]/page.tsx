"use client";

import { useEffect, useState, use } from "react";
import { fetchApi } from "@/lib/api";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  FileCheck,
  Calendar,
  User,
} from "lucide-react";
import Link from "next/link";

interface VerifyResponse {
  valid: boolean;
  reason?: string;
  completed?: number;
  total?: number;
  certificate?: {
    courseName: string;
    userName: string;
    issuedAt: string;
  };
}

export default function VerifyPage({ params }: { params: Promise<{ courseId: string; userId: string }> }) {
  const { courseId, userId } = use(params);
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<VerifyResponse>(`/verify/${courseId}/${userId}`)
      .then(setData)
      .catch(() => setData({ valid: false, reason: "Verification failed" }))
      .finally(() => setLoading(false));
  }, [courseId, userId]);

  return (
    <div className="min-h-screen bg-[#08111f] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-[#0f172a] rounded-2xl border border-white/10 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-8 text-white text-center">
            <div className="w-14 h-14 rounded-full bg-white/20 mx-auto mb-3 flex items-center justify-center">
              <Shield size={28} />
            </div>
            <h1 className="text-xl font-bold">Certificate Verification</h1>
            <p className="text-sm text-emerald-100 mt-1">XpertClass Academy Public Registry</p>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 size={32} className="animate-spin text-[#7AD62A] mx-auto" />
                <p className="text-sm text-slate-500 mt-3">Verifying certificate...</p>
              </div>
            ) : data?.valid ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#7AD62A]/10 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-[#7AD62A]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Certificate Verified</h2>
                  <p className="text-sm text-[#7AD62A] font-medium mt-1">This certificate is authentic</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 text-left">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <User size={16} className="text-[#7AD62A] mb-2" />
                    <p className="text-xs uppercase tracking-wide text-slate-500">Holder</p>
                    <p className="text-sm font-medium text-white mt-1">{data.certificate?.userName}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <FileCheck size={16} className="text-[#7AD62A] mb-2" />
                    <p className="text-xs uppercase tracking-wide text-slate-500">Award</p>
                    <p className="text-sm font-medium text-white mt-1">{data.certificate?.courseName}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <Calendar size={16} className="text-[#7AD62A] mb-2" />
                    <p className="text-xs uppercase tracking-wide text-slate-500">Issued</p>
                    <p className="text-sm font-medium text-white mt-1">
                      {data.certificate?.issuedAt
                        ? new Date(data.certificate.issuedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Verification note</p>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    This certificate record confirms a completed training outcome recorded by XpertClass Academy and can be used for employer or institutional verification.
                  </p>
                </div>
                <div className="rounded-xl border border-[#7AD62A]/20 bg-[#7AD62A]/5 p-4 text-left">
                  <p className="text-xs uppercase tracking-wide text-[#7AD62A]">Registry status</p>
                  <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                    Verified on public record. The certificate details above match an issuer-controlled training completion entry.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center">
                  <XCircle size={32} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Certificate Not Found</h2>
                  <p className="text-sm text-slate-500 mt-1">{data?.reason || "This certificate could not be verified."}</p>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-[#7AD62A] hover:text-[#6bc422] font-medium"
              >
                <Shield size={14} />
                Visit XpertClass Academy
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
