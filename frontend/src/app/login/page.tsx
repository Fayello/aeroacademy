"use client";

import { useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, API_URL, API_VERSION } from "@/lib/api";
import { getErrorMessage } from "@/lib/format";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import toast from "@/lib/toast";
import { initTokenRefresh } from "@/lib/api";
import { Mail, Lock, LogIn, Loader2, Shield, Terminal, Microscope, Award, BookOpen, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: Terminal, title: "Real-Time Terminal", description: "Full SSH access to lab environments" },
  { icon: Microscope, title: "37+ Hands-on Labs", description: "Deploy Docker sandboxes in seconds" },
  { icon: BookOpen, title: "9 Structured Courses", description: "50+ lessons with quizzes and projects" },
  { icon: Award, title: "Earn Certifications", description: "Prove your skills to employers" },
];

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });
  const [needsVerification, setNeedsVerification] = useState<string | null>(null);

  const onSubmit = async (values: LoginValues) => {
    try {
      const res = await auth.login(values);
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      Cookies.set("token", res.access_token, { expires: 7, path: "/" });
      initTokenRefresh();
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      if (msg.toLowerCase().includes("verify your email")) {
        setNeedsVerification(values.email);
      } else {
        toast.error(msg);
      }
    }
  };

  const handleGoogleLogin = () => {
    const state = crypto.randomUUID();
    sessionStorage.setItem("oauth_state", state);
    window.location.href = `${API_URL}${API_VERSION}/auth/google?state=${state}`;
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-10">
            <img src="/logo-icon.svg" alt="XpertClass" className="w-9 h-9" />
            <span className="text-xl font-bold tracking-tight">
              <span className="text-[#0F203A]">Xpert</span><span className="text-[#229C62]">Class</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-slate-500 mt-2">Sign in to continue your learning journey</p>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">or continue with email</span>
            </div>
          </div>

          {/* Form */}
          {needsVerification && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={18} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-amber-800 font-medium">Email not verified</p>
                  <p className="text-xs text-amber-600 mt-1">Please verify <span className="font-medium">{needsVerification}</span> before signing in.</p>
                  <div className="flex gap-2 mt-2">
                    <Link href={`/verify-email?email=${encodeURIComponent(needsVerification)}`} className="text-xs font-medium text-amber-700 hover:text-amber-800 underline">
                      Enter code
                    </Link>
                    <span className="text-amber-300">|</span>
                    <button type="button" onClick={async () => { await auth.resendOtp(needsVerification); toast.success("Code resent!"); }} className="text-xs font-medium text-amber-700 hover:text-amber-800 underline">
                      Resend code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="email"
                  {...register("email")}
                  type="email"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.email ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"} bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="password"
                  {...register("password")}
                  type="password"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.password ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"} bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200`}
                  placeholder="Enter your password"
                />
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1.5">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-5 rounded-xl transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Marketing */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 py-12">
          <div className="max-w-lg">
            <h2 className="text-3xl font-bold text-white mb-4">
              Start your journey in security, Linux & DevOps
            </h2>
            <p className="text-emerald-100 text-lg mb-10">
              Join thousands of engineers across Cameroon building real skills through hands-on labs and structured courses.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <feature.icon size={20} className="text-emerald-200 mb-2" />
                  <h3 className="text-sm font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-xs text-emerald-200">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-emerald-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
