"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { fetchApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/format";
import type { Organization } from "@/types/api";
import { CAMEROON_CITIES } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { User, Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "@/lib/toast";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(250, "Bio must be under 250 characters").optional(),
  city: z.string().optional(),
  organizationId: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const storedUser = localStorage.getItem("user");
        const orgs = await fetchApi("/auth/organizations");
        if (!cancelled) setOrganizations(orgs);
        if (storedUser) {
          const u = JSON.parse(storedUser);
          reset({ name: u.name || "", bio: u.bio || "", city: u.city || "", organizationId: u.organizationId || "" });
        }
      } catch {
        if (!cancelled) toast.error("Failed to load profile data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [reset]);

  const onSubmit = async (values: ProfileValues) => {
    try {
      const updatedUser = await fetchApi("/auth/profile", { method: "PATCH", body: JSON.stringify(values) });
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Profile updated.");
      router.push("/dashboard/profile");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update profile"));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <Link href="/dashboard/profile" className="inline-flex items-center gap-1 text-sm text-emerald-200 hover:text-white transition-colors mb-4">
            <ArrowLeft size={16} />
            Back to profile
          </Link>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-emerald-100 text-sm mt-1">Update your personal information</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input id="name" {...register("name")} className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.name ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"} bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`} placeholder="Your name" />
            </div>
            {errors.name && <p className="text-xs text-red-600 mt-1.5">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">City</label>
            <select {...register("city")} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
              <option value="">Select city</option>
              {CAMEROON_CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="org" className="block text-sm font-medium text-slate-700 mb-2">Organization</label>
            <select {...register("organizationId")} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
              <option value="">Independent Learner</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
            <textarea {...register("bio")} rows={4} className={`w-full px-4 py-3 rounded-xl border ${errors.bio ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"} bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none`} placeholder="Tell us about yourself..." />
            <div className="flex justify-between items-center mt-1.5">
              {errors.bio && <p className="text-xs text-red-600">{errors.bio.message}</p>}
              <span className="text-xs text-slate-400 ml-auto">Max 250 characters</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting || !isDirty} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-5 rounded-xl transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save changes
            </button>
            <Link href="/dashboard/profile" className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 px-5 rounded-xl border border-slate-300 transition-all text-sm">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
