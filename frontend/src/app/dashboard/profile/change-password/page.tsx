"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Lock, Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const schema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/\d/, "Must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type Values = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: Values) => {
    try {
      await fetchApi("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ oldPassword: values.oldPassword, newPassword: values.newPassword }),
      });
      toast.success("Password updated successfully!");
      router.push("/dashboard/profile");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <Link href="/dashboard/profile" className="inline-flex items-center gap-1 text-sm text-emerald-200 hover:text-white transition-colors mb-4">
            <ArrowLeft size={16} /> Back to profile
          </Link>
          <h1 className="text-2xl font-bold">Change Password</h1>
          <p className="text-emerald-100 text-sm mt-1">Update your account password</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="oldPassword" className="block text-sm font-medium text-slate-700 mb-2">Current password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="oldPassword"
                {...register("oldPassword")}
                type="password"
                className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.oldPassword ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"} bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
                placeholder="Enter current password"
              />
            </div>
            {errors.oldPassword && <p className="text-xs text-red-600 mt-1.5">{errors.oldPassword.message}</p>}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-2">New password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="newPassword"
                {...register("newPassword")}
                type="password"
                className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.newPassword ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"} bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
                placeholder="Min. 8 characters"
              />
            </div>
            {errors.newPassword && <p className="text-xs text-red-600 mt-1.5">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">Confirm new password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="confirmPassword"
                {...register("confirmPassword")}
                type="password"
                className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.confirmPassword ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"} bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
                placeholder="Repeat new password"
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-600 mt-1.5">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-5 rounded-xl transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
