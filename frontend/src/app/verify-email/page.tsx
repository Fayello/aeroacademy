"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/api";
import toast from "@/lib/toast";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await auth.resendVerification(email);
      setResent(true);
      toast.success("New verification link sent!");
    } catch {
      toast.error("Failed to resend verification link");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md">
        <Link href="/login" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8 transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">Back to login</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="bg-emerald-600 p-2 rounded-xl">
              <img src="/logo-icon.svg" alt="XpertClass" className="w-8 h-8" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">XpertClass</span>
          </div>

          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-5">
            <Mail className="text-emerald-600" size={24} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h1>
          <p className="text-slate-500 text-sm mb-1">
            We sent a verification link to
          </p>
          <p className="text-slate-900 font-medium text-sm mb-6">{email || "your email"}</p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              Click the link in the email to verify your account and start learning. The link will expire in 24 hours.
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              Didn&apos;t receive the email?{" "}
              <button
                onClick={handleResend}
                disabled={resending || resent}
                className="text-emerald-600 hover:text-emerald-700 font-medium disabled:text-slate-400"
              >
                {resent ? "Sent!" : resending ? "Sending..." : "Resend link"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
