"use client";

import { useEffect, useState } from "react";
import { Shield, Trophy, TrendingUp, BookOpen, Microscope, Clock, Lock, Star } from "lucide-react";
import Link from "next/link";
import { useDashboard } from "@/hooks/useDashboard";
import { getLevel, getLevelProgress } from "@/lib/levelGating";
import type { User, Achievement } from "@/types/api";

const DIVISION_INFO: Record<string, { color: string; bg: string; next: string; nextAt: number }> = {
  BRONZE:   { color: "text-amber-700", bg: "bg-amber-100", next: "SILVER", nextAt: 800 },
  SILVER:   { color: "text-slate-500", bg: "bg-slate-200", next: "GOLD", nextAt: 1200 },
  GOLD:     { color: "text-amber-600", bg: "bg-amber-100", next: "PLATINUM", nextAt: 1600 },
  PLATINUM: { color: "text-emerald-600", bg: "bg-emerald-100", next: "DIAMOND", nextAt: 2000 },
  DIAMOND:  { color: "text-blue-600", bg: "bg-blue-100", next: "TITAN", nextAt: 2400 },
  TITAN:    { color: "text-indigo-600", bg: "bg-indigo-100", next: "", nextAt: Infinity },
};

const LEVEL_UNLOCKS = [
  { level: 3, label: "Beginner Labs", icon: Microscope },
  { level: 4, label: "Intermediate Content", icon: BookOpen },
  { level: 5, label: "Registry", icon: Shield },
  { level: 7, label: "Advanced Content", icon: BookOpen },
  { level: 10, label: "Certifications", icon: Trophy },
];

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const { userMetrics } = useDashboard();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch { /* ignore */ }
  }, []);

  if (!user) return null;

  const xp = userMetrics?.xp || 0;
  const level = getLevel(xp);
  const progress = getLevelProgress(xp);
  const xpInLevel = xp % 1000;
  const division = userMetrics?.division || "BRONZE";
  const divInfo = DIVISION_INFO[division] || DIVISION_INFO.BRONZE;
  const rank = userMetrics?.rank || 1200;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-white">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{user.name || user.email.split("@")[0]}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              <span>{user.email}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">{user.role}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/dashboard/profile/edit" className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2 px-4 rounded-lg text-sm transition-all">
              Edit profile
            </Link>
            <Link href="/dashboard/profile/change-password" className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2 px-4 rounded-lg text-sm transition-all">
              Change password
            </Link>
          </div>
        </div>
      </div>

      {/* Level & Division */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Level Progress */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp size={22} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Level {level}</h2>
              <p className="text-sm text-slate-500">{xp.toLocaleString()} total XP</p>
            </div>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{xpInLevel.toLocaleString()} / 1,000 XP in this level</span>
            <span className="font-medium text-slate-900">{Math.round(progress * 100)}%</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {(1000 - xpInLevel).toLocaleString()} XP to Level {level + 1}
          </p>
        </div>

        {/* Division */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${divInfo.bg}`}>
              <Shield size={22} className={divInfo.color} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${divInfo.color}`}>{division}</h2>
              <p className="text-sm text-slate-500">ELO Rating: {rank}</p>
            </div>
          </div>
          {divInfo.next && (
            <>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (rank / divInfo.nextAt) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>{rank} / {divInfo.nextAt} ELO</span>
                <span className="font-medium text-slate-900">{divInfo.next}</span>
              </div>
            </>
          )}
          {!divInfo.next && (
            <p className="text-xs text-slate-400">Maximum division reached</p>
          )}
        </div>
      </div>

      {/* Level Unlocks */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Content Unlocks</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {LEVEL_UNLOCKS.map(({ level: reqLevel, label, icon: Icon }) => {
            const unlocked = level >= reqLevel;
            return (
              <div
                key={reqLevel}
                className={`p-4 rounded-xl border text-center transition-all ${
                  unlocked
                    ? "bg-emerald-50 border-emerald-200 hover:shadow-md"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${
                  unlocked ? "bg-emerald-100" : "bg-slate-100"
                }`}>
                  {unlocked ? (
                    <Icon size={18} className="text-emerald-600" />
                  ) : (
                    <Lock size={18} className="text-slate-400" />
                  )}
                </div>
                <p className="text-xs font-medium text-slate-700">{label}</p>
                <p className={`text-[10px] mt-1 ${unlocked ? "text-emerald-600" : "text-slate-400"}`}>
                  {unlocked ? "Unlocked" : `Lv.${reqLevel}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Skills</h2>
          <div className="space-y-4">
            {[
              { label: "Web Security", progress: userMetrics?.courseProgress || 0 },
              { label: "Cloud Hardening", progress: 0 },
              { label: "Exploitation", progress: 0 },
              { label: "AI Security", progress: 0 },
            ].map((skill) => (
              <div key={skill.label}>
                <div className="flex justify-between text-sm text-slate-600 mb-1.5">
                  <span>{skill.label}</span>
                  <span className="font-medium text-slate-900">{skill.progress}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" style={{ width: `${skill.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Achievements</h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {userMetrics && userMetrics.achievements && userMetrics.achievements.length > 0 ? userMetrics.achievements.map((ach: Achievement) => (
              <div key={ach.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-all">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500" fill="currentColor" />
                  <p className="text-sm font-medium text-slate-900">{ach.title?.replaceAll("_", " ")}</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">{ach.description}</p>
                {ach.unlockedAt && (
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    <Clock size={10} className="inline mr-1" />
                    {new Date(ach.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )) : (
              <p className="text-sm text-slate-500 text-center py-8">No achievements yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
