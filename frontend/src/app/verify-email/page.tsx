"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/api";
import toast from "@/lib/toast";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";

function VerifyEmailContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((c) => c !== "") && newCode.join("").length === 6) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (codeStr: string) => {
    if (!email || verifying) return;
    setVerifying(true);
    try {
      await auth.verifyEmail(email, codeStr);
      toast.success(t("verifyEmail.success"));
      router.push("/dashboard");
    } catch {
      toast.error(t("verifyEmail.invalidCode"));
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    try {
      await auth.resendVerification(email);
      toast.success(t("verifyEmail.codeSent"));
      setCooldown(30);
    } catch {
      toast.error(t("verifyEmail.resendFailed"));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white/5 px-6">
      <div className="w-full max-w-md">
        <Link href="/login" className="flex items-center gap-2 text-slate-500 hover:text-slate-200 mb-8 transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">{t("verifyEmail.backLogin")}</span>
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

          <h1 className="text-2xl font-bold text-white mb-2">{t("verifyEmail.title")}</h1>
          <p className="text-slate-500 text-sm mb-1">
            {t("verifyEmail.sentTo")}
          </p>
          <p className="text-white font-medium text-sm mb-6">{email || t("verifyEmail.emailFallback")}</p>

          <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={verifying}
                className="w-12 h-14 text-center text-xl font-bold text-white bg-white/5 border border-white/10 rounded-xl focus:border-[#7AD62A] focus:ring-1 focus:ring-[#7AD62A] outline-none transition-all disabled:opacity-50"
              />
            ))}
          </div>

          {verifying && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-4">
              <Loader2 className="animate-spin" size={14} />
              <span>{t("verifyEmail.verifying")}</span>
            </div>
          )}

          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <p className="text-xs text-slate-400 leading-relaxed">
              {t("verifyEmail.instructions")}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              {t("verifyEmail.notReceived")}{" "}
              <button
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="text-[#7AD62A] hover:text-[#6bc422] font-medium disabled:text-slate-400"
              >
                {cooldown > 0 ? t("verifyEmail.resendIn", { seconds: cooldown }) : resending ? t("verifyEmail.sending") : t("verifyEmail.resend")}
              </button>
            </p>
            <Link href="/register" className="text-xs text-slate-500 hover:text-slate-300 mt-3 inline-block">
              {t("verifyEmail.differentEmail")}
            </Link>
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
