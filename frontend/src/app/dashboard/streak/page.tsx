"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Flame, Loader2, Shield, Calendar, TrendingUp, Snowflake } from "lucide-react";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakFreezes: number;
  dailyMissionCombo: number;
}

export default function StreakPage() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<StreakData>("/dashboard/streak");
        setStreak(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-[#229C62] animate-spin" />
      </div>
    );
  }

  if (!streak) return null;

  const freezeMilestones = [7, 14, 21, 30, 60, 90];
  const nextFreezeAt = freezeMilestones.find((m) => m > streak.currentStreak) || 100;
  const freezeProgress = Math.min(100, (streak.currentStreak / nextFreezeAt) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Main streak card */}
      <div className="bg-gradient-to-br from-[#0F203A] to-[#1a3a5c] rounded-xl p-8 text-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-white/10 p-3 rounded-xl">
            <Flame size={28} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Streak</h1>
            <p className="text-white/50 text-sm">Keep your momentum going</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-[#7AD62A]">{streak.currentStreak}</p>
            <p className="text-sm text-white/50 mt-1">Current Streak</p>
          </div>
          <div className="text-center">
            <p className="text-5xl font-bold text-white/80">{streak.longestStreak}</p>
            <p className="text-sm text-white/50 mt-1">Best Streak</p>
          </div>
          <div className="text-center">
            <p className="text-5xl font-bold text-cyan-400">{streak.dailyMissionCombo}</p>
            <p className="text-sm text-white/50 mt-1">Daily Combo</p>
          </div>
        </div>
      </div>

      {/* Freeze section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-cyan-50 p-2 rounded-lg">
            <Snowflake size={20} className="text-cyan-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Streak Freezes</h2>
            <p className="text-sm text-slate-500">Protect your streak when life happens</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-600">Available freezes</span>
              <span className="text-lg font-bold text-cyan-600">{streak.streakFreezes}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-2">Next freeze earned at {nextFreezeAt}-day streak</p>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${freezeProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {nextFreezeAt - streak.currentStreak} more days to earn a freeze
          </p>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          <p>How it works:</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Earn 1 freeze for every 7-day streak</li>
            <li>Freeze auto-activates if you miss 1 day</li>
            <li>Max 3 freezes stored at a time</li>
          </ul>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-amber-50 p-2 rounded-lg">
            <TrendingUp size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Streak Milestones</h2>
            <p className="text-sm text-slate-500">XP bonuses at every 7-day mark</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[7, 14, 21, 30, 60, 90, 180, 365].map((days) => {
            const reached = streak.longestStreak >= days;
            return (
              <div
                key={days}
                className={`rounded-lg border p-3 text-center ${
                  reached
                    ? "bg-amber-50 border-amber-200"
                    : "bg-slate-50 border-slate-200 opacity-50"
                }`}
              >
                <Flame size={16} className={`mx-auto mb-1 ${reached ? "text-amber-500" : "text-slate-300"}`} />
                <p className="text-sm font-bold text-slate-900">{days} days</p>
                <p className="text-[10px] text-slate-500">+500 XP bonus</p>
                {reached && (
                  <span className="inline-block mt-1 text-[9px] font-medium text-[#229C62] bg-[#E9F8EE] px-2 py-0.5 rounded-full">
                    Reached
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
