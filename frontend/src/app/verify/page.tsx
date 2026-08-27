"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/api";
import toast from "@/lib/toast";
import { CheckCircle2, Loader2, ArrowLeft, AlertCircle } from "lucide-react";

function VerifyTokenForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token provided. Please check your email for the correct link.");
      return;
    }

    let cancelled = false;
    auth
      .verifyEmailByToken(token)
      .then((res: any) => {
        if (cancelled) return;
        localStorage.setItem("token", res.access_token);
        localStorage.setItem("refresh_token", res.refresh_token);
        localStorage.setItem("user", JSON.stringify(res.user));
        setStatus("success");
        toast.success("Email verified! Welcome to XpertClass.");
        setTimeout(() => router.push("/dashboard"), 1500);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Invalid or expired verification link";
        setStatus("error");
        setErrorMessage(msg);
      });

    return () => { cancelled = true; };
  }, [token, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white/5">
        <div className="text-center">
          <Loader2 className="animate-spin text-emerald-600 mx-auto mb-4" size={32} />
          <p className="text-slate-500">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white/5 px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-emerald-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
          <p className="text-slate-500">Redirecting you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white/5 px-6">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-200 mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">Back to login</span>
        </Link>

        <div className="bg-[#0f172a] rounded-2xl shadow-sm border border-white/10 p-8 text-center">
          <div className="flex items-center gap-2.5 mb-6 justify-center">
            <div className="bg-emerald-600 p-2 rounded-xl">
              <img src="/logo-icon.svg" alt="XpertClass" className="w-8 h-8" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">XpertClass</span>
          </div>

          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="text-red-600" size={24} />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
          <p className="text-slate-500 text-sm mb-6">{errorMessage}</p>

          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all duration-200 text-center"
            >
              Go to Login
            </Link>
            <Link
              href="/register"
              className="block w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200 text-center"
            >
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white/5">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      }
    >
      <VerifyTokenForm />
    </Suspense>
  );
}
