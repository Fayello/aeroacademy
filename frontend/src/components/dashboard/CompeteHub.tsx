"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useDashboard } from "@/hooks/useDashboard";
import { useNavigation } from "@/lib/navigation";
import { getLevel } from "@/lib/levelGating";
import {
  Loader2,
  Swords,
  Trophy,
  Target,
  Shield,
  Award,
  ScrollText,
  BarChart3,
  Flame,
  ChevronRight,
  Clock,
  Lock,
  Play,
} from "lucide-react";

interface ActiveSeason {
  id: string;
  name: string;
  theme: string;
  startDate: string;
  endDate: string;
}

interface ActiveBossMission {
  id: string;
  title: string;
  difficulty: number;
  domain: string;
}

interface BattlePassProgress {
  seasonId: string;
  currentTier: number;
  totalTiers: number;
  xpEarned: number;
  xpToNext: number;
}

interface ChallengeStats {
  active: number;
  completed: number;
  total: number;
}

interface CompeteMode {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
  color: string;
  bgColor: string;
  href: string;
  requiredLevel: number;
  status: "active" | "available" | "locked";
  detail?: string;
}

function getGreetingTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export default function CompeteHub() {
  const [activeSeason, setActiveSeason] = useState<ActiveSeason | null>(null);
  const [activeBoss, setActiveBoss] = useState<ActiveBossMission | null>(null);
  const [battlePass, setBattlePass] = useState<BattlePassProgress | null>(null);
  const [challengeStats, setChallengeStats] = useState<ChallengeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { userMetrics } = useDashboard();
  const { nav } = useNavigation();

  const xp = userMetrics?.xp || 0;
  const level = getLevel(xp);
  const rank = userMetrics?.rank || "Unranked";
  const streak = userMetrics?.streak || 0;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [season, boss, bp, challenges] = await Promise.allSettled([
          fetchApi<ActiveSeason>("/seasons/active"),
          fetchApi<ActiveBossMission>("/boss-missions/active"),
          fetchApi<BattlePassProgress>("/battle-pass"),
          fetchApi<any[]>("/challenges"),
        ]);

        if (!cancelled) {
          if (season.status === "fulfilled" && season.value) setActiveSeason(season.value);
          if (boss.status === "fulfilled" && boss.value) setActiveBoss(boss.value);
          if (bp.status === "fulfilled" && bp.value) setBattlePass(bp.value);
          if (challenges.status === "fulfilled" && Array.isArray(challenges.value)) {
            const all = challenges.value;
            setChallengeStats({
              active: all.filter((c: any) => c.status === "ACTIVE" || c.status === "AVAILABLE").length,
              completed: all.filter((c: any) => c.status === "COMPLETED").length,
              total: all.length,
            });
          }
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const modes: CompeteMode[] = [
    {
      id: "challenges",
      title: "Challenges",
      description: "Daily, weekly, and monthly missions to test your skills",
      icon: Target,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      href: "/dashboard/challenges",
      requiredLevel: 3,
      status: level >= 3 ? "available" : "locked",
      detail: challengeStats ? `${challengeStats.active} active · ${challengeStats.completed} completed` : undefined,
    },
    {
      id: "ranking",
      title: "Ranked",
      description: "Compete in ranked matches to climb the division ladder",
      icon: Shield,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/dashboard/ranking",
      requiredLevel: 5,
      status: level >= 5 ? "available" : "locked",
      detail: rank !== "Unranked" ? `Current rank: ${rank}` : undefined,
    },
    {
      id: "capability",
      title: "Capability Ranking",
      description: "Compare your capability score against peers",
      icon: BarChart3,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      href: "/dashboard/capability-ranking",
      requiredLevel: 5,
      status: level >= 5 ? "available" : "locked",
    },
    {
      id: "seasons",
      title: "Seasons",
      description: "Compete in seasonal competitions for exclusive rewards",
      icon: ScrollText,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      href: "/dashboard/seasons",
      requiredLevel: 7,
      status: level >= 7 ? (activeSeason ? "active" : "available") : "locked",
      detail: activeSeason ? activeSeason.name : undefined,
    },
    {
      id: "bosses",
      title: "Boss Missions",
      description: "Epic multi-stage challenges against advanced scenarios",
      icon: Swords,
      color: "text-red-600",
      bgColor: "bg-red-50",
      href: "/dashboard/boss-missions",
      requiredLevel: 10,
      status: level >= 10 ? (activeBoss ? "active" : "available") : "locked",
      detail: activeBoss ? activeBoss.title : undefined,
    },
    {
      id: "battlepass",
      title: "Battle Pass",
      description: "Progress through tiers to unlock exclusive rewards",
      icon: Award,
      color: "text-[#229C62]",
      bgColor: "bg-[#E9F8EE]",
      href: "/dashboard/battle-pass",
      requiredLevel: 10,
      status: level >= 10 ? (battlePass ? "active" : "available") : "locked",
      detail: battlePass ? `Tier ${battlePass.currentTier}/${battlePass.totalTiers}` : undefined,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gradient-to-br from-[#0F203A] to-[#229C62] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F203A] via-[#1a3a5c] to-[#229C62] p-8 text-white">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#7AD62A] blur-3xl" />
        </div>
        <div className="relative z-10">
          <p className="text-white/60 text-sm font-medium tracking-wider uppercase">
            Good {getGreetingTime()}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Compete</h1>
          <p className="text-white/70 text-sm mt-2 max-w-lg">
            Challenge yourself. Climb the ranks. Earn your place among the best.
          </p>

          {/* Quick Stats Row */}
          <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Flame size={16} className="text-[#7AD62A]" />
              </div>
              <div>
                <p className="text-xs text-white/50">Streak</p>
                <p className="text-sm font-semibold">{streak} day{streak !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Shield size={16} className="text-blue-300" />
              </div>
              <div>
                <p className="text-xs text-white/50">Rank</p>
                <p className="text-sm font-semibold">{rank}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Trophy size={16} className="text-amber-300" />
              </div>
              <div>
                <p className="text-xs text-white/50">Level</p>
                <p className="text-sm font-semibold">{level}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Competitions Banner */}
      {(activeSeason || activeBoss || battlePass) && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#229C62] animate-pulse" />
            <h2 className="text-sm font-semibold text-slate-900">Active Now</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeSeason && (
              <Link
                href="/dashboard/seasons"
                className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors group"
              >
                <ScrollText size={20} className="text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900 group-hover:text-emerald-700">{activeSeason.name}</p>
                  <p className="text-xs text-slate-500">Season active</p>
                </div>
              </Link>
            )}
            {activeBoss && (
              <Link
                href="/dashboard/boss-missions"
                className="flex items-center gap-3 p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors group"
              >
                <Swords size={20} className="text-red-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900 group-hover:text-red-700">{activeBoss.title}</p>
                  <p className="text-xs text-slate-500">Boss active</p>
                </div>
              </Link>
            )}
            {battlePass && (
              <Link
                href="/dashboard/battle-pass"
                className="flex items-center gap-3 p-3 rounded-lg bg-[#E9F8EE] hover:bg-[#d4f2e2] transition-colors group"
              >
                <Award size={20} className="text-[#229C62]" />
                <div>
                  <p className="text-sm font-medium text-slate-900 group-hover:text-[#1a7a4d]">
                    Tier {battlePass.currentTier}/{battlePass.totalTiers}
                  </p>
                  <p className="text-xs text-slate-500">Battle Pass</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Compete Modes Grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Competition Modes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isLocked = mode.status === "locked";
            const isActive = mode.status === "active";

            return (
              <Link
                key={mode.id}
                href={isLocked ? "#" : mode.href}
                className={`relative group bg-white rounded-xl border p-5 transition-all ${
                  isLocked
                    ? "border-slate-200 opacity-60 cursor-not-allowed"
                    : "border-slate-200 hover:shadow-md hover:border-[#229C62]/30"
                }`}
              >
                {isActive && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#229C62] text-white text-[10px] font-semibold uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Live
                    </span>
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl ${mode.bgColor} flex items-center justify-center mb-3`}>
                  {isLocked ? (
                    <Lock size={20} className="text-slate-400" />
                  ) : (
                    <Icon size={20} className={mode.color} />
                  )}
                </div>

                <h3 className="text-sm font-semibold text-slate-900 mb-1">{mode.title}</h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">{mode.description}</p>

                {isLocked ? (
                  <p className="text-xs text-slate-400 font-medium">
                    Unlocks at Level {mode.requiredLevel}
                  </p>
                ) : (
                  <div className="flex items-center justify-between">
                    {mode.detail ? (
                      <span className="text-xs text-slate-600">{mode.detail}</span>
                    ) : (
                      <span className="text-xs text-slate-400">Ready</span>
                    )}
                    <ChevronRight
                      size={14}
                      className="text-slate-400 group-hover:text-[#229C62] group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Leaderboards Quick Link */}
      <Link
        href="/dashboard/leaderboard"
        className="block bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-[#229C62]/30 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Trophy size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#229C62] transition-colors">
                Global Leaderboards
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                See how you rank against all players worldwide
              </p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-400 group-hover:text-[#229C62] group-hover:translate-x-0.5 transition-all"
          />
        </div>
      </Link>

      {/* My Missions Quick Link */}
      <Link
        href="/dashboard/my-missions"
        className="block bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-[#229C62]/30 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#229C62] to-[#0F203A] flex items-center justify-center">
              <Play size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#229C62] transition-colors">
                My Missions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Track your personal mission progress
              </p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-400 group-hover:text-[#229C62] group-hover:translate-x-0.5 transition-all"
          />
        </div>
      </Link>
    </div>
  );
}
