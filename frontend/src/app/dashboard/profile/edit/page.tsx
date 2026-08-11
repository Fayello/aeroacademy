"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { fetchApi } from "@/lib/api";
import { CAMEROON_CITIES } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { User, Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

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
  const [organizations, setOrganizations] = useState<any[]>([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    async function loadData() {
      try {
        const storedUser = localStorage.getItem("user");
        const orgs = await fetchApi("/auth/organizations");
        setOrganizations(orgs);
        if (storedUser) {
          const u = JSON.parse(storedUser);
          reset({ name: u.name || "", bio: u.bio || "", city: u.city || "", organizationId: u.organizationId || "" });
        }
      } catch {
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [reset]);

  const onSubmit = async (values: ProfileValues) => {
    try {
      const updatedUser = await fetchApi("/auth/profile", { method: "PATCH", body: JSON.stringify(values) });
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Profile updated.");
      router.push("/dashboard/profile");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/profile" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={16} />
          Back to profile
        </Link>
      </div>

      <div className="card p-6">
        <h1 className="text-lg font-semibold text-slate-900 mb-6">Edit Profile</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input id="name" {...register("name")} className={`input-field pl-10 ${errors.name ? "border-red-300" : ""}`} placeholder="Your name" />
            </div>
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
            <select {...register("city")} className="input-field">
              <option value="">Select city</option>
              {CAMEROON_CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="org" className="block text-sm font-medium text-slate-700 mb-1.5">Organization</label>
            <select {...register("organizationId")} className="input-field">
              <option value="">Independent Learner</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
            <textarea {...register("bio")} rows={4} className={`input-field resize-none ${errors.bio ? "border-red-300" : ""}`} placeholder="Tell us about yourself..." />
            <div className="flex justify-between items-center mt-1">
              {errors.bio && <p className="text-xs text-red-600">{errors.bio.message}</p>}
              <span className="text-xs text-slate-400 ml-auto">Max 250 characters</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting || !isDirty} className="btn-primary flex-1">
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save changes
            </button>
            <Link href="/dashboard/profile" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
