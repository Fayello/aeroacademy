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
      <Link href="/dashboard/profile" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Back to profile
      </Link>

      <div className="card p-6">
        <h1 className="text-lg font-semibold text-slate-900 mb-6">Change Password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="oldPassword" className="block text-sm font-medium text-slate-700 mb-1.5">Current password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                id="oldPassword"
                {...register("oldPassword")}
                type="password"
                className={`input-field pl-10 ${errors.oldPassword ? "border-red-300" : ""}`}
                placeholder="Enter current password"
              />
            </div>
            {errors.oldPassword && <p className="text-xs text-red-600 mt-1">{errors.oldPassword.message}</p>}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                id="newPassword"
                {...register("newPassword")}
                type="password"
                className={`input-field pl-10 ${errors.newPassword ? "border-red-300" : ""}`}
                placeholder="Min. 8 characters"
              />
            </div>
            {errors.newPassword && <p className="text-xs text-red-600 mt-1">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">Confirm new password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                id="confirmPassword"
                {...register("confirmPassword")}
                type="password"
                className={`input-field pl-10 ${errors.confirmPassword ? "border-red-300" : ""}`}
                placeholder="Repeat new password"
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
