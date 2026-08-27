"use client";

import { useState, useEffect } from "react";
import {
  Shield, Trophy, TrendingUp, BookOpen, Award, Flame, Zap, Star,
  Flag, Target, Crosshair, Crown, Compass, Library, Footprints,
  GraduationCap, MapPin, Building2, Calendar, Users, ArrowLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import { getLevel, getLevelProgress } from "@/lib/levelGating";
import type { User } from "@/types/api";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  xpReward: number;
}

interface UserBadge {
  badgeId: string;
  earnedAt: string;
  badge: Badge;
}

interface PublicProfile extends User {
  currentStreak?: number;
  longestStreak?: number;
  lastActivityDate?: string | null;
  organization?: { id: string; name: string; type: string } | null;
  team?: { id: string; name: string; description?: string | null } | null;
  avatarUrl?: string | null;
  clearance?: string;
  pinnedBadges?: string[];
  _count?: {
    achievements: number;
    progress: number;
    labSubmissions: number;
  };
}

const badgeIconMap: Record<string, typeof Trophy> = {
  Footprints, BookOpen, GraduationCap, Award, Crown,
  Flag, Target, Crosshair, Trophy,
  Compass, Library,
  Flame, Zap,
  Star, Shield,
};

const badgeTierColors: Record<string, string> = {
  BRONZE: "from-amber-600 to-amber-700",
  SILVER: "from-slate-400 to-slate-600",
  GOLD: "from-yellow-400 to-yellow-600",
  PLATINUM: "from-purple-500 to-purple-700",
};

const badgeTierBg: Record<string, string> = {
  BRONZE: "bg-amber-500/10 border-amber-200",
  SILVER: "bg-white/5 border-white/10",
  GOLD: "bg-yellow-50 border-yellow-300",
  PLATINUM: "bg-purple-50 border-purple-300",
};

const DIVISION_INFO: Record<string, { color: string; bg: string; next: string; nextAt: number }> = {
  BRONZE:   { color: "text-amber-700", bg: "bg-amber-100", next: "SILVER", nextAt: 800 },
  SILVER:   { color: "text-slate-500", bg: "bg-slate-200", next: "GOLD", nextAt: 1200 },
  GOLD:     { color: "text-amber-600", bg: "bg-amber-100", next: "PLATINUM", nextAt: 1600 },
  PLATINUM: { color: "text-[#7AD62A]", bg: "bg-[#7AD62A]/10", next: "DIAMOND", nextAt: 2000 },
  DIAMOND:  { color: "text-blue-600", bg: "bg-blue-100", next: "TITAN", nextAt: 2400 },
  TITAN:    { color: "text-indigo-600", bg: "bg-indigo-100", next: "", nextAt: Infinity },
};

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<PublicProfile | null>(null);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        const [profile, badges, myBadges] = await Promise.allSettled([
          fetchApi<PublicProfile>(`/auth/users/${userId}/profile`),
          fetchApi<Badge[]>("/badges"),
          fetchApi<UserBadge[]>(`/badges/user/${userId}`),
        ]);

        if (profile.status === "fulfilled" && profile.value) {
          setUser(profile.value);
        } else {
          setNotFound(true);
          return;
        }

        if (badges.status === "fulfilled") setAllBadges(badges.value || []);
        if (myBadges.status === "fulfilled") setUserBadges(myBadges.value || []);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7AD62A]" />
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
          <Users size={32} className="text-slate-300" />
        </div>
        <h1 className="text-xl font-semibold text-white">User not found</h1>
        <p className="text-sm text-slate-500">This user profile does not exist or has been removed.</p>
        <Link
          href="/dashboard/leaderboard"
          className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#7AD62A] hover:text-[#1a7a4d] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Leaderboard
        </Link>
      </div>
    );
  }

  const xp = user.xp || 0;
  const level = getLevel(xp);
  const progress = getLevelProgress(xp);
  const xpInLevel = xp % 1000;
  const division = user.division || "BRONZE";
  const divInfo = DIVISION_INFO[division] || DIVISION_INFO.BRONZE;
  const rank = user.rank || 1200;
  const streak = user.currentStreak || 0;
  const longestStreak = user.longestStreak || 0;
  const achievementsCount = user._count?.achievements || 0;
  const lessonsCompleted = user._count?.progress || 0;

  const pinnedBadgeIds = new Set(user.pinnedBadges || []);
  const pinnedBadgeList = userBadges.filter((ub) => pinnedBadgeIds.has(ub.badgeId));
  const displayBadges = pinnedBadgeList.length > 0
    ? pinnedBadgeList
    : userBadges.filter((ub) => allBadges.some((b) => b.id === ub.badgeId));

  const getAvatarContent = () => {
    if (user.avatarUrl) {
      return (
        <img
          src={user.avatarUrl}
          alt={user.name || "User"}
          className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-lg"
        />
      );
    }
    return (
      <span className="text-2xl font-bold text-white">
        {(user.name || user.email).charAt(0).toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back Button */}
      <Link
        href="/dashboard/leaderboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#7AD62A] transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Leaderboard
      </Link>

      {/* Profile Header */}
      <div className="relative overflow-hidden bg-[#0f172a] rounded-xl border border-white/10 p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#E9F8EE] to-transparent rounded-bl-full opacity-60" />
        <div className="flex flex-col sm:flex-row items-start gap-5 relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7AD62A] to-[#7AD62A] flex items-center justify-center shrink-0 ring-4 ring-white shadow-lg overflow-hidden">
            {getAvatarContent()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">
                {user.name || user.email.split("@")[0]}
              </h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${divInfo.bg} ${divInfo.color}`}>
                <Shield size={12} />
                {division}
              </span>
              {user.clearance && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  {user.clearance.replace("_", " ")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500 flex-wrap">
              {user.username && (
                <span className="flex items-center gap-1 text-[#7AD62A] font-medium">@{user.username}</span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">{user.role}</span>
            </div>
            {(user.bio || user.city || user.organization || user.team) && (
              <div className="mt-3 space-y-1">
                {user.bio && <p className="text-sm text-slate-600">{user.bio}</p>}
                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                  {user.city && (
                    <span className="flex items-center gap-1"><MapPin size={12} />{user.city}</span>
                  )}
                  {user.organization && (
                    <span className="flex items-center gap-1"><Building2 size={12} />{user.organization.name}</span>
                  )}
                  {user.team && (
                    <span className="flex items-center gap-1 text-[#7AD62A] font-medium"><Users size={12} />{user.team.name}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total XP", value: xp.toLocaleString(), icon: TrendingUp, color: "text-[#7AD62A]", bg: "bg-[#7AD62A]/10" },
          {
            label: "Current Streak",
            value: `${streak} day${streak !== 1 ? "s" : ""}`,
            icon: Flame,
            color: "text-orange-500",
            bg: "bg-orange-50",
            sub: longestStreak > 0 ? `Best: ${longestStreak}` : undefined,
          },
          { label: "Badges", value: String(userBadges.length), icon: Award, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Achievements", value: String(achievementsCount), icon: Star, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#0f172a] rounded-xl border border-white/10 p-4 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
                {stat.sub && <p className="text-[10px] text-slate-400">{stat.sub}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Level & Division */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Level Progress */}
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center">
              <TrendingUp size={22} className="text-[#7AD62A]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Level {level}</h2>
              <p className="text-sm text-slate-500">{xp.toLocaleString()} total XP</p>
            </div>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-[#7AD62A] to-[#7AD62A] rounded-full transition-all duration-500"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{xpInLevel.toLocaleString()} / 1,000 XP in this level</span>
            <span className="font-medium text-white">{Math.round(progress * 100)}%</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {(1000 - xpInLevel).toLocaleString()} XP to Level {level + 1}
          </p>
        </div>

        {/* Division */}
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6 hover:shadow-md transition-all duration-300">
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
                <span className="font-medium text-white">{divInfo.next}</span>
              </div>
            </>
          )}
          {!divInfo.next && (
            <p className="text-xs text-slate-400">Maximum division reached</p>
          )}
        </div>
      </div>

      {/* Streaks */}
      <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Flame size={18} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Activity Streaks</h2>
            <p className="text-xs text-slate-500">Consistency is key</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#7AD62A]/10/40 border border-[#7AD62A]/10">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={16} className="text-[#7AD62A]" />
              <span className="text-sm font-medium text-slate-700">Current Streak</span>
            </div>
            <p className="text-2xl font-bold text-[#7AD62A]">{streak}</p>
            <p className="text-xs text-slate-400 mt-0.5">day{streak !== 1 ? "s" : ""}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={16} className="text-amber-500" />
              <span className="text-sm font-medium text-slate-700">Longest Streak</span>
            </div>
            <p className="text-2xl font-bold text-white">{longestStreak}</p>
            <p className="text-xs text-slate-400 mt-0.5">day{longestStreak !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Lessons Completed */}
      <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <BookOpen size={18} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Lessons Completed</h2>
            <p className="text-sm text-slate-500">{lessonsCompleted} lesson{lessonsCompleted !== 1 ? "s" : ""} finished</p>
          </div>
        </div>
      </div>

      {/* Pinned Badges */}
      {displayBadges.length > 0 && (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Award size={18} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {pinnedBadgeList.length > 0 ? "Pinned Badges" : "Badges"}
                </h2>
                <p className="text-xs text-slate-500">{userBadges.length} earned</p>
              </div>
            </div>
            <Link
              href="/dashboard/badges"
              className="text-xs text-[#7AD62A] hover:text-[#1a7a4d] font-medium flex items-center gap-1"
            >
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {displayBadges.slice(0, 10).map((ub) => {
              const BIcon = badgeIconMap[ub.badge.icon] || Award;
              const tierColor = badgeTierColors[ub.badge.tier] || badgeTierColors.BRONZE;
              const tierBg = badgeTierBg[ub.badge.tier] || badgeTierBg.BRONZE;
              return (
                <Link
                  key={ub.badgeId}
                  href={`/dashboard/badges/${ub.badgeId}`}
                  className={`text-center p-3 rounded-xl ${tierBg} border hover:shadow-md transition-all group`}
                >
                  <div
                    className={`w-11 h-11 rounded-full mx-auto mb-2 flex items-center justify-center bg-gradient-to-br ${tierColor} shadow-sm`}
                  >
                    <BIcon size={18} className="text-white" />
                  </div>
                  <p className="text-[11px] font-semibold text-white truncate">{ub.badge.name}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {new Date(ub.earnedAt).toLocaleDateString()}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
