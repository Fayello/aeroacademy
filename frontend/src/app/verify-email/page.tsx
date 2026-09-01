"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/api";
import toast from "@/lib/toast";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    try {
      await auth.resendVerification(email);
      toast.success("New verification link sent!");
      setCooldown(30);
    } catch {
      toast.error("Failed to resend verification link");
    } finally {
      setResending(false);
    }
  }, [email, cooldown]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white/5 px-6">
      <div className="w-full max-w-md">
        <Link href="/login" className="flex items-center gap-2 text-slate-500 hover:text-slate-200 mb-8 transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">Back to login</span>
        </Link>

        <div className="bg-[#0f172a] rounded-2xl shadow-sm border border-white/10 p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="bg-[#7AD62A] p-2 rounded-xl">
              <Image src="/logo-icon.svg" alt="XpertClass" width={32} height={32} className="w-8 h-8" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">XpertClass</span>
          </div>

          <div className="w-14 h-14 bg-[#7AD62A]/10 rounded-2xl flex items-center justify-center mb-5">
            <Mail className="text-[#7AD62A]" size={24} />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-slate-500 text-sm mb-1">
            We sent a verification link to
          </p>
          <p className="text-white font-medium text-sm mb-6">{email || "your email"}</p>

          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              Click the link in the email to verify your account and start learning. The link expires in 24 hours.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Check your spam or junk folder if you don&apos;t see it.
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              Didn&apos;t receive the email?{" "}
              <button
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="text-[#7AD62A] hover:text-[#6bc422] font-medium disabled:text-slate-400"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend link"}
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
      <div className="min-h-screen flex items-center justify-center bg-white/5">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
