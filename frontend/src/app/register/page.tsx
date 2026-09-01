"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, API_URL, API_VERSION } from "@/lib/api";
import { getErrorMessage } from "@/lib/format";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "@/lib/toast";
import { Mail, Lock, UserPlus, Loader2, User, CheckCircle2, XCircle } from "lucide-react";

  const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/\d/, "Must contain at least one number"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((value) => value, "You must accept the terms and conditions"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

const BENEFITS = [
  "12 months of free access",
  "Courses, labs, and guided beginner paths",
  "Earn XP & climb the leaderboard",
  "Deploy real Docker sandbox labs",
  "Earn industry-recognized certifications",
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  });

  const passwordValue = useWatch({ control: control, name: "password" }) || "";
  const strength = useMemo(() => {
    return (
      (passwordValue.length >= 8 ? 1 : 0) +
      (/[A-Z]/.test(passwordValue) ? 1 : 0) +
      (/[0-9]/.test(passwordValue) ? 1 : 0) +
      (/[^A-Za-z0-9]/.test(passwordValue) ? 1 : 0)
    );
  }, [passwordValue]);

  const strengthLabel = strength <= 2 ? "Weak" : strength === 3 ? "Fair" : "Strong";
  const strengthColor = strength <= 2 ? "bg-red-500" : strength === 3 ? "bg-amber-500" : "bg-[#7AD62A]";

  const onSubmit = async (values: RegisterValues) => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      await auth.register({ email: values.email, password: values.password, name: values.name, timezone });
      toast.success("Account created! Check your email for the verification code.");
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Registration failed"));
    }
  };

  const handleGoogleSignup = () => {
    const state = crypto.randomUUID();
    sessionStorage.setItem("oauth_state", state);
    window.location.href = `${API_URL}${API_VERSION}/auth/google?state=${state}`;
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Marketing */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#0F203A]">
        <div className="absolute inset-0 angular-grid-bg opacity-10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 py-12">
          <div className="max-w-lg">
            <h2 className="text-3xl font-bold text-white mb-4">
              Start free for 1 year
            </h2>
            <p className="text-slate-300 text-lg mb-10">
              Build proof of skill through hands-on labs, structured courses, and a personalized first path.
            </p>

            <div className="space-y-4">
              {BENEFITS.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <CheckCircle2 size={20} className="text-[#7AD62A] shrink-0" />
                  <span className="text-white font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#7AD62A] rounded-full"></div>
                <span>12 months free</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#7AD62A] rounded-full"></div>
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#0f172a]">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-10">
            <img src="/logo-icon.svg" alt="XpertClass" className="w-9 h-9" />
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">Xpert</span><span className="text-[#7AD62A]">Class</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">Create your account</h1>
            <p className="text-slate-500 mt-2">No credit card required. Verify your email, personalize your path, and start practicing.</p>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={handleGoogleSignup}
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-3 border border-white/10 rounded-xl bg-[#0f172a] text-slate-300 text-sm font-medium hover:bg-white/5 hover:border-slate-400 transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0f172a] px-3 text-slate-400">or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Full name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="name"
                  {...register("name")}
                  type="text"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.name ? "border-red-300 ring-2 ring-red-100" : "border-white/10"} bg-[#0f172a] text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] transition-all duration-200`}
                  placeholder="Your full name"
                />
              </div>
              {errors.name && <p className="text-xs text-red-600 mt-1.5">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="email"
                  {...register("email")}
                  type="email"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.email ? "border-red-300 ring-2 ring-red-100" : "border-white/10"} bg-[#0f172a] text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] transition-all duration-200`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="password"
                  {...register("password")}
                  type="password"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.password ? "border-red-300 ring-2 ring-red-100" : "border-white/10"} bg-[#0f172a] text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] transition-all duration-200`}
                  placeholder="Min. 8 characters"
                />
              </div>
              {passwordValue && (
                <div className="mt-2 space-y-1">
                  <div
                    className="flex gap-1 h-1.5"
                    role="progressbar"
                    aria-valuenow={strength}
                    aria-valuemin={0}
                    aria-valuemax={4}
                    aria-label={`Password strength: ${strengthLabel}`}
                  >
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          step <= strength ? strengthColor : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">{strengthLabel}</p>
                </div>
              )}
              {errors.password && <p className="text-xs text-red-600 mt-1.5">{errors.password.message}</p>}
              <div className="mt-2 grid grid-cols-2 gap-1">
                {[
                  { label: "8+ characters", met: passwordValue.length >= 8 },
                  { label: "Uppercase letter", met: /[A-Z]/.test(passwordValue) },
                  { label: "Lowercase letter", met: /[a-z]/.test(passwordValue) },
                  { label: "Number", met: /\d/.test(passwordValue) },
                ].map((req) => (
                  <div key={req.label} className="flex items-center gap-1 text-[10px]">
                    {req.met ? <CheckCircle2 size={10} className="text-[#7AD62A]" /> : <XCircle size={10} className="text-slate-300" />}
                    <span className={req.met ? "text-[#7AD62A]" : "text-slate-400"}>{req.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="confirmPassword"
                  {...register("confirmPassword")}
                  type="password"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.confirmPassword ? "border-red-300 ring-2 ring-red-100" : "border-white/10"} bg-[#0f172a] text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] transition-all duration-200`}
                  placeholder="Repeat your password"
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-600 mt-1.5">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex items-start gap-2">
              <input
                id="acceptTerms"
                {...register("acceptTerms")}
                type="checkbox"
                className="mt-1 w-4 h-4 rounded border-white/10 accent-[#7AD62A]"
              />
              <label htmlFor="acceptTerms" className="text-sm text-slate-400">
                I agree to the{" "}
                <Link href="/terms" className="text-[#7AD62A] hover:underline font-medium">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-[#7AD62A] hover:underline font-medium">Privacy Policy</Link>
              </label>
            </div>
            {errors.acceptTerms && <p className="text-xs text-red-600">{errors.acceptTerms.message}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] font-medium py-3 px-5 rounded-xl transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-[#7AD62A] hover:text-[#6bc422] font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
