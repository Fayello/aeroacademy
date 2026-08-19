"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/api";
import toast from "@/lib/toast";
import { CheckCircle2, Loader2, ArrowLeft, Mail } from "lucide-react";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
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
    if (pasted) {
      const newCode = pasted.split("").concat(Array(6 - pasted.length).fill(""));
      setCode(newCode);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    if (!email) {
      toast.error("Email not found. Please register again.");
      return;
    }

    setLoading(true);
    try {
      const res = await auth.verifyEmail(email, fullCode);
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setSuccess(true);
      toast.success("Email verified! Welcome to XpertClass.");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid or expired code";
      toast.error(msg);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await auth.resendOtp(email);
      toast.success("New verification code sent!");
    } catch {
      toast.error("Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-emerald-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Email Verified!</h1>
          <p className="text-slate-500">Redirecting you to your dashboard...</p>
        </div>
      </div>
    );
  }

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

          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-5">
            <Mail className="text-indigo-600" size={24} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Verify your email</h1>
          <p className="text-slate-500 text-sm mb-1">
            We sent a 6-digit code to
          </p>
          <p className="text-slate-900 font-medium text-sm mb-6">{email || "your email"}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-3">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-xl font-bold text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || code.join("").length !== 6}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Didn&apos;t receive the code?{" "}
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-indigo-600 hover:text-indigo-700 font-medium disabled:text-slate-400"
              >
                {resending ? "Sending..." : "Resend code"}
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
      <VerifyEmailForm />
    </Suspense>
  );
}
