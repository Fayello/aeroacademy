"use client";

import { useEffect, useState, use } from "react";
import { fetchApi } from "@/lib/api";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  Award,
  ExternalLink,
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
    <div className="min-h-screen bg-white/5 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-[#0f172a] rounded-2xl border border-white/10 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-8 text-white text-center">
            <div className="w-14 h-14 rounded-full bg-white/20 mx-auto mb-3 flex items-center justify-center">
              <Shield size={28} />
            </div>
            <h1 className="text-xl font-bold">Certificate Verification</h1>
            <p className="text-sm text-emerald-100 mt-1">XpertClass Academy</p>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 size={32} className="animate-spin text-emerald-600 mx-auto" />
                <p className="text-sm text-slate-500 mt-3">Verifying certificate...</p>
              </div>
            ) : data?.valid ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Certificate Verified</h2>
                  <p className="text-sm text-emerald-600 font-medium mt-1">This certificate is authentic</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 space-y-3 text-left">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Student</span>
                    <span className="font-medium text-white">{data.certificate?.userName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Course</span>
                    <span className="font-medium text-white">{data.certificate?.courseName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Issued</span>
                    <span className="font-medium text-white">
                      {data.certificate?.issuedAt
                        ? new Date(data.certificate.issuedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "—"}
                    </span>
                  </div>
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

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
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
