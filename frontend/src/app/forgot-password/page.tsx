"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Mail, CheckCircle, Shield, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchApi("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } catch {
      // Intentionally ignore — we always show success to prevent email enumeration
    } finally {
      setSubmitted(true);
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
            <Shield className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Reset your password</h1>
          <p className="text-sm text-slate-500 mt-1">Enter your email to receive a recovery link</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    id="email"
                    type="email"
                    className="input-field pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? <Loader2 className="animate-spin" size={16} aria-label="Sending" /> : "Send recovery link"}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-emerald-600" size={24} />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Check your email</h2>
              <p className="text-sm text-slate-500 mb-6">
                If an account exists for <span className="font-medium text-slate-700">{email}</span>, you&apos;ll receive a recovery link shortly.
              </p>
              <Link href="/login" className="btn-secondary w-full inline-flex">
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
