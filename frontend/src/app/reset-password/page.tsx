"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle, ChevronLeft, Loader2 } from "lucide-react";
import { auth } from "@/lib/api";
import toast from "@/lib/toast";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="animate-spin text-emerald-600" size={28} />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email") || "";
  const code = searchParams.get("code") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 mb-4">
            <Lock className="text-amber-600" size={24} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Reset link expired</h1>
          <p className="text-sm text-slate-500 mb-6">Password reset links have been replaced with a more secure OTP code system.</p>
          <Link href="/forgot-password" className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-5 rounded-xl transition-all duration-200 text-sm">
            Request a code instead
          </Link>
        </div>
      </div>
    );
  }

  if (!email || !code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 mb-4">
            <Lock className="text-red-600" size={24} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Invalid reset link</h1>
          <p className="text-sm text-slate-500 mb-6">This password reset link is invalid or expired.</p>
          <Link href="/forgot-password" className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-5 rounded-xl transition-all duration-200 text-sm">
            Request a new code
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      toast.error("Password must contain uppercase, lowercase, and a number");
      return;
    }
    setLoading(true);
    try {
      await auth.resetPasswordOtp(email, code, newPassword);
      setSuccess(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Reset failed. The code may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/login" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ChevronLeft size={16} />
          Back to sign in
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 mb-4">
            <img src="/logo-icon.svg" alt="XpertClass" className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Set new password</h1>
          <p className="text-sm text-slate-500 mt-1">Choose a strong password for your account</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    id="newPassword"
                    type="password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    id="confirmPassword"
                    type="password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-5 rounded-xl transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="animate-spin" size={16} aria-label="Resetting password" /> : "Reset password"}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-emerald-600" size={24} />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Password updated</h2>
              <p className="text-sm text-slate-500 mb-6">Your password has been reset successfully.</p>
              <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-5 rounded-xl transition-all duration-200 text-sm w-full">
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
