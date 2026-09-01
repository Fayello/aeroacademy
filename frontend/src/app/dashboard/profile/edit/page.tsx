"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { fetchApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/format";
import type { Organization } from "@/types/api";
import { useRouter } from "next/navigation";
import {
  User, Save, ArrowLeft, Loader2, AtSign, MapPin, Building2,
  Mail, Bell, Globe, Info, Monitor, Trophy, Briefcase,
} from "lucide-react";
import Link from "next/link";
import toast from "@/lib/toast";
import { useDisplayMode } from "@/lib/displayMode";

const TIMEZONES = [
  "UTC",
  "Africa/Douala",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const EMAIL_PREFS = [
  { key: "achievements", label: "Achievements", desc: "When you unlock an achievement" },
  { key: "milestones", label: "Milestones", desc: "Level ups and XP milestones" },
  { key: "streaks", label: "Streaks", desc: "Streak reminders and milestones" },
  { key: "labCompletions", label: "Lab Completions", desc: "When you complete a lab" },
  { key: "courseUpdates", label: "Course Updates", desc: "New lessons and course changes" },
  { key: "weeklyDigest", label: "Weekly Digest", desc: "Weekly progress summary" },
];

const AVATAR_GRADIENTS = [
  { id: "green-lime", classes: "from-[#7AD62A] to-[#7AD62A]", label: "Green" },
  { id: "navy-teal", classes: "from-[#0F203A] to-teal-600", label: "Navy" },
  { id: "purple-pink", classes: "from-purple-500 to-pink-500", label: "Purple" },
  { id: "orange-red", classes: "from-orange-400 to-red-500", label: "Orange" },
  { id: "blue-cyan", classes: "from-blue-500 to-cyan-400", label: "Blue" },
  { id: "indigo-purple", classes: "from-indigo-500 to-purple-500", label: "Indigo" },
  { id: "emerald-teal", classes: "from-emerald-500 to-teal-400", label: "Emerald" },
  { id: "amber-yellow", classes: "from-amber-500 to-yellow-400", label: "Amber" },
];

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be under 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, _ and - allowed")
    .optional()
    .or(z.literal("")),
  bio: z.string().max(250, "Bio must be under 250 characters").optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),
  organizationId: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

interface UserProfile {
  id?: string;
  name?: string;
  username?: string;
  bio?: string;
  city?: string;
  timezone?: string;
  organizationId?: string;
  avatarUrl?: string;
  emailPreferences?: Record<string, boolean>;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [emailPrefs, setEmailPrefs] = useState<Record<string, boolean>>({});
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [showEmailPrefs, setShowEmailPrefs] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("from-[#7AD62A] to-[#7AD62A]");
  const { mode, setMode } = useDisplayMode();

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting, isDirty } } =
    useForm<ProfileValues>({
      resolver: zodResolver(profileSchema),
    });

  const watchUsername = watch("username");

  const loadData = useCallback(async () => {
    try {
      const [profile, orgs] = await Promise.allSettled([
        fetchApi<UserProfile>("/auth/me"),
        fetchApi<Organization[]>("/auth/organizations"),
      ]);

      if (orgs.status === "fulfilled") setOrganizations(orgs.value);

      if (profile.status === "fulfilled") {
        const u = profile.value;
        if (u.avatarUrl) setSelectedAvatar(u.avatarUrl);
        reset({
          name: u.name || "",
          username: u.username || "",
          bio: u.bio || "",
          city: u.city || "",
          timezone: u.timezone || "UTC",
          organizationId: u.organizationId || "",
        });
        if (u.emailPreferences && typeof u.emailPreferences === "object") {
          setEmailPrefs(u.emailPreferences as Record<string, boolean>);
        }
      } else {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u.avatarUrl) setSelectedAvatar(u.avatarUrl);
          reset({ name: u.name || "", username: u.username || "", bio: u.bio || "", city: u.city || "", timezone: u.timezone || "UTC", organizationId: u.organizationId || "" });
        }
      }
    } catch {
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const onSubmit = async (values: ProfileValues) => {
    try {
      const payload: Record<string, string> = {};
      payload.name = values.name;
      if (values.username) payload.username = values.username;
      else payload.username = "";
      if (values.bio !== undefined) payload.bio = values.bio;
      if (values.city !== undefined) payload.city = values.city;
      if (values.timezone !== undefined) payload.timezone = values.timezone;
      if (values.organizationId !== undefined) payload.organizationId = values.organizationId;
      payload.avatarUrl = selectedAvatar;

      const updatedUser = await fetchApi("/auth/profile", { method: "PATCH", body: JSON.stringify(payload) });
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Profile updated successfully!");
      router.push("/dashboard/profile");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update profile"));
    }
  };

  const saveEmailPrefs = async (newPrefs: Record<string, boolean>) => {
    setSavingPrefs(true);
    try {
      await fetchApi("/auth/email-preferences", {
        method: "PATCH",
        body: JSON.stringify({ preferences: newPrefs }),
      });
      setEmailPrefs(newPrefs);
      toast.success("Email preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#7AD62A]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="angular-card relative overflow-hidden p-8 text-white" style={{ background: "linear-gradient(135deg, #0F203A, #229C62, #7AD62A)" }}>
        <div className="absolute inset-0 angular-grid-bg opacity-[0.06] pointer-events-none" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
        </div>
        <div className="relative z-10">
          <Link href="/dashboard/profile" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-4">
            <ArrowLeft size={16} />
            Back to profile
          </Link>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-white/80 text-sm mt-1">Manage your public identity and preferences</p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="angular-card bg-[#0f172a] overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Personal Information</h2>
          <p className="text-sm text-slate-500 mt-0.5">Your public profile details</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Avatar</label>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${selectedAvatar} flex items-center justify-center shrink-0 ring-4 ring-white shadow-lg transition-all duration-200`}>
                <span className="text-xl font-bold text-white">
                  {(watch("name") || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{watch("name") || "Your Name"}</p>
                <p className="text-xs text-slate-500">{watchUsername ? `@${watchUsername}` : "No username set"}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              {AVATAR_GRADIENTS.map((gradient) => (
                <button
                  key={gradient.id}
                  type="button"
                  title={gradient.label}
                  onClick={() => setSelectedAvatar(gradient.classes)}
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient.classes} ring-2 transition-all duration-150 shrink-0 ${
                    selectedAvatar === gradient.classes
                      ? "ring-slate-900 ring-offset-2 scale-110"
                      : "ring-transparent hover:ring-slate-300 hover:ring-offset-1"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">Display Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                id="name"
                {...register("name")}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm ${errors.name ? "border-red-300 ring-2 ring-red-100" : "border-white/10"} bg-[#0f172a] text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] transition-all`}
                placeholder="Your display name"
              />
            </div>
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1.5">
              Username <span className="text-slate-400 font-normal">(pseudonym)</span>
            </label>
            <div className="relative">
              <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                id="username"
                {...register("username")}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm ${errors.username ? "border-red-300 ring-2 ring-red-100" : "border-white/10"} bg-[#0f172a] text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] transition-all`}
                placeholder="your_pseudonym"
              />
            </div>
            {errors.username && <p className="text-xs text-red-600 mt-1">{errors.username.message}</p>}
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Info size={11} />
              Your unique pseudonym. Letters, numbers, _ and - only.
            </p>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-slate-300 mb-1.5">Bio</label>
            <textarea
              {...register("bio")}
              rows={3}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm ${errors.bio ? "border-red-300 ring-2 ring-red-100" : "border-white/10"} bg-[#0f172a] text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] transition-all resize-none`}
              placeholder="Tell us about yourself..."
            />
            <div className="flex justify-between items-center mt-1">
              {errors.bio && <p className="text-xs text-red-600">{errors.bio.message}</p>}
              <span className="text-xs text-slate-400 ml-auto">
                {(watch("bio") || "").length}/250
              </span>
            </div>
          </div>

          {/* City + Timezone Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-slate-300 mb-1.5">
                <MapPin size={13} className="inline mr-1" />City
              </label>
              <input
                {...register("city")}
                type="text"
                placeholder="e.g. Yaoundé, Douala, Lagos..."
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0f172a] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] transition-all"
              />
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-slate-300 mb-1.5">
                <Globe size={13} className="inline mr-1" />Timezone
              </label>
              <select
                {...register("timezone")}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0f172a] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] transition-all"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Organization */}
          <div>
            <label htmlFor="org" className="block text-sm font-medium text-slate-300 mb-1.5">
              <Building2 size={13} className="inline mr-1" />Organization
            </label>
            <select
              {...register("organizationId")}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0f172a] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] transition-all"
            >
              <option value="">Independent Learner</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="flex-1 flex items-center justify-center gap-2 bg-[#7AD62A] hover:bg-[#1a7a4d] text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save changes
            </button>
            <Link
              href="/dashboard/profile"
              className="flex items-center justify-center gap-2 bg-[#0f172a] hover:bg-white/5 text-slate-300 font-medium py-2.5 px-5 rounded-xl border border-white/10 transition-all text-sm"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Email Preferences */}
      <div className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowEmailPrefs(!showEmailPrefs)}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Bell size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Email Notifications</h2>
              <p className="text-sm text-slate-500">Choose what emails you receive</p>
            </div>
          </div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform ${showEmailPrefs ? "rotate-180" : ""}`}>
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {showEmailPrefs && (
          <div className="px-6 pb-6 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {EMAIL_PREFS.map((pref) => (
              <label
                key={pref.key}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {emailPrefs[pref.key] ? (
                    <Mail size={16} className="text-[#7AD62A]" />
                  ) : (
                    <Mail size={16} className="text-slate-300" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-300">{pref.label}</p>
                    <p className="text-xs text-slate-400">{pref.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={savingPrefs}
                  onClick={() => {
                    const newPrefs = { ...emailPrefs, [pref.key]: !emailPrefs[pref.key] };
                    setEmailPrefs(newPrefs);
                    saveEmailPrefs(newPrefs);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    emailPrefs[pref.key] ? "bg-[#7AD62A]" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-[#0f172a] transition-transform shadow-sm ${
                      emailPrefs[pref.key] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Display Mode */}
      <div className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Monitor size={18} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Display Mode</h2>
              <p className="text-sm text-slate-500">Choose how the platform appears to you</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMode("PROFESSIONAL")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                mode === "PROFESSIONAL"
                  ? "border-[#7AD62A] bg-[#7AD62A]/10"
                  : "border-white/10 hover:border-white/10 bg-[#0f172a]"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={16} className={mode === "PROFESSIONAL" ? "text-[#7AD62A]" : "text-slate-400"} />
                <span className="text-sm font-semibold text-white">Professional</span>
              </div>
              <p className="text-xs text-slate-500">Genome, mastery, missions, labs. No XP fire, no rank badges.</p>
            </button>

            <button
              type="button"
              onClick={() => setMode("PROGRESSION")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                mode === "PROGRESSION"
                  ? "border-[#7AD62A] bg-[#7AD62A]/10"
                  : "border-white/10 hover:border-white/10 bg-[#0f172a]"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={16} className={mode === "PROGRESSION" ? "text-[#7AD62A]" : "text-slate-400"} />
                <span className="text-sm font-semibold text-white">Progression</span>
              </div>
              <p className="text-xs text-slate-500">XP, levels, missions, mastery, unlocks. Default experience.</p>
            </button>

            <button
              type="button"
              onClick={() => setMode("COMPETITIVE")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                mode === "COMPETITIVE"
                  ? "border-[#7AD62A] bg-[#7AD62A]/10"
                  : "border-white/10 hover:border-white/10 bg-[#0f172a]"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={16} className={mode === "COMPETITIVE" ? "text-[#7AD62A]" : "text-slate-400"} />
                <span className="text-sm font-semibold text-white">Competitive</span>
              </div>
              <p className="text-xs text-slate-500">Everything: ranks, leaderboards, boss missions, seasons.</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
