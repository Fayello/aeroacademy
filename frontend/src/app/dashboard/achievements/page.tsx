"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  Trophy, Loader2, Target, Crosshair, Shield, TrendingUp,
  Flame, Calendar, Users, MessageSquare, BookOpen, GraduationCap,
  Zap, Crown, CheckCircle, Lock, ChevronRight,
} from "lucide-react";

interface AchievementProgress {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  xpReward: number;
  requirementType: string;
  requirementTarget: number;
  chainParentId: string | null;
  chainOrder: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  target: number;
  percentage: number;
}

const iconMap: Record<string, typeof Trophy> = {
  Target, Crosshair, Shield, TrendingUp, Flame, Calendar, Users,
  MessageSquare, BookOpen, GraduationCap, Zap, Crown, CheckCircle,
};

const rarityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  COMMON: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", glow: "" },
  UNCOMMON: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600", glow: "shadow-emerald-100" },
  RARE: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", glow: "shadow-blue-100" },
  EPIC: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600", glow: "shadow-purple-100" },
  LEGENDARY: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-600", glow: "shadow-amber-200" },
};

const categoryIcons: Record<string, typeof Trophy> = {
  MILESTONE: Target,
  MASTERY: TrendingUp,
  STREAK: Flame,
  CHALLENGE: Zap,
  SOCIAL: Users,
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<AchievementProgress[]>("/dashboard/achievements");
        setAchievements(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const unlocked = achievements.filter((a) => a.unlocked);
  const totalXp = unlocked.reduce((sum, a) => sum + a.xpReward, 0);
  const categories = [...new Set(achievements.map((a) => a.category))];

  const filtered = achievements
    .filter((a) => {
      if (filter === "unlocked") return a.unlocked;
      if (filter === "locked") return !a.unlocked;
      return true;
    })
    .filter((a) => categoryFilter === "all" || a.category === categoryFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-[#229C62] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#E9F8EE] p-3 rounded-xl">
            <Trophy size={24} className="text-[#229C62]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Achievements</h1>
            <p className="text-sm text-slate-500">
              {unlocked.length} of {achievements.length} unlocked
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{unlocked.length}</p>
            <p className="text-xs text-slate-500">Unlocked</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{totalXp.toLocaleString()}</p>
            <p className="text-xs text-slate-500">XP Earned</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#229C62]">
              {achievements.length > 0 ? Math.round((unlocked.length / achievements.length) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-500">Complete</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "unlocked", "locked"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="w-px bg-slate-200 mx-1" />
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            categoryFilter === "all"
              ? "bg-[#229C62] text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All Types
        </button>
        {categories.map((cat) => {
          const CatIcon = categoryIcons[cat] || Trophy;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                categoryFilter === cat
                  ? "bg-[#229C62] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <CatIcon size={12} />
              {cat}
            </button>
          );
        })}
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((ach) => {
          const Icon = iconMap[ach.icon] || Trophy;
          const rarity = rarityColors[ach.rarity] || rarityColors.COMMON;

          return (
            <div
              key={ach.id}
              className={`rounded-xl border p-4 transition-all ${
                ach.unlocked
                  ? `${rarity.bg} ${rarity.border} border ${rarity.glow}`
                  : "bg-slate-50 border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    ach.unlocked
                      ? "bg-gradient-to-br from-[#229C62] to-[#7AD62A]"
                      : "bg-slate-200"
                  }`}
                >
                  {ach.unlocked ? (
                    <Icon size={18} className="text-white" />
                  ) : (
                    <Lock size={18} className="text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{ach.title}</h3>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${rarity.bg} ${rarity.text} border ${rarity.border}`}>
                      {ach.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ach.description}</p>
                </div>
              </div>

              {/* Progress bar */}
              {!ach.unlocked && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400">
                      {ach.progress}/{ach.target}
                    </span>
                    <span className="text-[10px] text-slate-400">{ach.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#229C62] rounded-full transition-all duration-500"
                      style={{ width: `${ach.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* XP reward */}
              <div className="flex items-center justify-between mt-2">
                {ach.xpReward > 0 && (
                  <span className="text-[10px] font-bold text-amber-600">+{ach.xpReward} XP</span>
                )}
                {ach.unlocked && ach.unlockedAt && (
                  <span className="text-[10px] text-slate-400">
                    {new Date(ach.unlockedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
