"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import {
  Trophy,
  Target,
  Flag,
  BookOpen,
  Flame,
  Loader2,
  ChevronRight,
  Zap,
  Swords,
  Calendar,
  Crown,
  Users,
} from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  objectiveType: string;
  objectiveTarget: number;
  xpReward: number;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
  domain?: { name: string; displayName: string };
  skill?: { name: string; displayName: string };
  _count: { userChallenges: number };
}

const objectiveIcons: Record<string, typeof Trophy> = {
  FLAG_COMPLETIONS: Flag,
  LAB_COMPLETIONS: Target,
  LESSON_COMPLETIONS: BookOpen,
};

const objectiveLabels: Record<string, string> = {
  FLAG_COMPLETIONS: "flags completed",
  LAB_COMPLETIONS: "labs completed",
  LESSON_COMPLETIONS: "lessons completed",
};

const difficultyConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  EASY: { label: "Easy", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  MEDIUM: { label: "Medium", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  HARD: { label: "Hard", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  BOSS: { label: "Boss", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
};

const typeConfig: Record<string, { label: string; icon: typeof Trophy; color: string; bg: string; border: string }> = {
  DAILY_WARMUP: { label: "Warmup", icon: Flame, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  DAILY_SKILL: { label: "Skill", icon: Target, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  DAILY_BOSS: { label: "Boss", icon: Swords, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  WEEKLY: { label: "Weekly", icon: Calendar, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
  MONTHLY: { label: "Monthly", icon: Crown, color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  SEASONAL: { label: "Seasonal", icon: Zap, color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200" },
  TEAM_WEEKLY: { label: "Team", icon: Users, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
};

function timeRemaining(endAt: string): string {
  const now = new Date();
  const end = new Date(endAt);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 7) return `${days}d left`;
  if (days > 0) return `${days}d ${hours}h left`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m left`;
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "daily" | "weekly" | "monthly" | "seasonal" | "team">("all");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<Challenge[]>("/challenges");
        setChallenges(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredChallenges = challenges.filter((c) => {
    if (filter === "all") return true;
    if (filter === "daily") return c.type.startsWith("DAILY_");
    if (filter === "weekly") return c.type === "WEEKLY";
    if (filter === "monthly") return c.type === "MONTHLY";
    if (filter === "seasonal") return c.type === "SEASONAL";
    if (filter === "team") return c.type === "TEAM_WEEKLY";
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Missions</h1>
          <p className="text-sm text-slate-500 mt-1">Complete challenges to earn XP and level up</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "daily", "weekly", "monthly", "seasonal", "team"] as const).map((f) => (
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
      </div>

      {filteredChallenges.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Trophy size={28} className="text-amber-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">No missions in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            New challenges are added regularly. Try a different category or check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredChallenges.map((challenge) => {
            const ObjIcon = objectiveIcons[challenge.objectiveType] || Target;
            const diff = difficultyConfig[challenge.difficulty] || difficultyConfig.MEDIUM;
            const type = typeConfig[challenge.type] || typeConfig.DAILY_SKILL;
            const TypeIcon = type.icon;
            const daysLeft = challenge.endAt
              ? Math.max(0, Math.ceil((new Date(challenge.endAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
              : null;

            return (
              <Link
                key={challenge.id}
                href={`/dashboard/challenges/${challenge.id}`}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-blue-300 hover:shadow-md transition-all block"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`${type.bg} ${type.border} border p-2 rounded-lg`}>
                        <TypeIcon size={18} className={type.color} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{challenge.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[11px] font-medium ${diff.color} ${diff.bg} ${diff.border} border px-2 py-0.5 rounded-full`}>
                            {diff.label}
                          </span>
                          <span className={`text-[11px] font-medium ${type.color} ${type.bg} ${type.border} border px-2 py-0.5 rounded-full`}>
                            {type.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    {challenge.xpReward > 0 && (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                        +{challenge.xpReward} XP
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{challenge.description}</p>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {challenge.domain && (
                      <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                        {challenge.domain.displayName}
                      </span>
                    )}
                    {challenge.skill && (
                      <span className="text-[11px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                        {challenge.skill.displayName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <ObjIcon size={12} />
                      {challenge.objectiveTarget} {objectiveLabels[challenge.objectiveType]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap size={12} />
                      {challenge._count.userChallenges} joined
                    </span>
                    {daysLeft !== null && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {daysLeft}d left
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                  <span className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    View Details <ChevronRight size={12} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
