"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth } from "@/lib/api";
import toast from "@/lib/toast";
import Link from "next/link";
import { Shield, ArrowLeft, Mail, Loader2, KeyRound } from "lucide-react";

const emailSchema = z.object({ email: z.string().email("Invalid email") });
type EmailValues = z.infer<typeof emailSchema>;

const resetSchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code"),
  password: z.string().min(8, "At least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });
type ResetValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const emailForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  const onEmailSubmit = async (values: EmailValues) => {
    setLoading(true);
    try {
      await auth.forgotPassword(values.email);
      setEmail(values.email);
      setStep("reset");
      toast.success("Verification code sent to your email");
    } catch {
      toast.error("Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const onResetSubmit = async (values: ResetValues) => {
    setLoading(true);
    try {
      await auth.resetPasswordOtp(email, values.code, values.password);
      toast.success("Password reset successfully!");
      window.location.href = "/login";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid or expired code";
      toast.error(msg);
    } finally {
      setLoading(false);
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
              <Shield className="text-white" size={22} />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">XpertClass</span>
          </div>

          {step === "email" ? (
            <>
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-5">
                <KeyRound className="text-amber-600" size={24} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset your password</h1>
              <p className="text-slate-500 text-sm mb-6">Enter your email and we&apos;ll send you a verification code.</p>

              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      {...emailForm.register("email")}
                      type="email"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                      placeholder="you@example.com"
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-xs text-red-600 mt-1.5">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "Send Verification Code"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-5">
                <Mail className="text-indigo-600" size={24} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Enter verification code</h1>
              <p className="text-slate-500 text-sm mb-1">We sent a 6-digit code to</p>
              <p className="text-slate-900 font-medium text-sm mb-6">{email}</p>

              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Verification Code</label>
                  <input
                    {...resetForm.register("code")}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-center text-lg tracking-[0.5em] font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                    placeholder="000000"
                  />
                  {resetForm.formState.errors.code && (
                    <p className="text-xs text-red-600 mt-1.5">{resetForm.formState.errors.code.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                  <input
                    {...resetForm.register("password")}
                    type="password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Min 8 characters"
                  />
                  {resetForm.formState.errors.password && (
                    <p className="text-xs text-red-600 mt-1.5">{resetForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                  <input
                    {...resetForm.register("confirmPassword")}
                    type="password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Repeat password"
                  />
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1.5">{resetForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "Reset Password"}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("email"); emailForm.reset(); resetForm.reset(); }}
                  className="w-full py-2 text-sm text-slate-500 hover:text-slate-700"
                >
                  Use a different email
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
