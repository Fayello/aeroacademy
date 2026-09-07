"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  Award,
  Trophy,
  Star,
  Shield,
  Crown,
  Flame,
  Zap,
  BookOpen,
  Flag,
  Target,
  Compass,
  Library,
  Footprints,
  GraduationCap,
  Crosshair,
  AlertTriangle,
} from "lucide-react";
import { DashboardEmptyState, DashboardErrorState, DashboardLoadingState, StatusPill } from "@/components/dashboard/DashboardStates";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  xpReward: number;
  _count: { users: number };
}

interface UserBadge {
  badgeId: string;
  earnedAt: string;
  badge: Badge;
}

const iconMap: Record<string, typeof Trophy> = {
  Footprints, BookOpen, GraduationCap, Award, Crown,
  Flag, Target, Crosshair, Trophy,
  Compass, Library,
  Flame, Zap,
  Star, Shield,
};

const tierColors: Record<string, string> = {
  BRONZE: "bg-amber-500/10 border-amber-400/25",
  SILVER: "bg-white/[0.06] border-slate-300/20",
  GOLD: "bg-yellow-500/10 border-yellow-400/25",
  PLATINUM: "bg-purple-500/10 border-purple-400/25",
};

const tierBg: Record<string, string> = {
  BRONZE: "from-amber-500 to-amber-600",
  SILVER: "from-slate-400 to-slate-500",
  GOLD: "from-yellow-400 to-yellow-500",
  PLATINUM: "from-purple-500 to-purple-600",
};

export default function BadgesPage() {
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [myBadges, setMyBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [earnedError, setEarnedError] = useState("");
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError("");
      setEarnedError("");
      const [badges, earned] = await Promise.allSettled([
        fetchApi<Badge[]>("/badges"),
        fetchApi<UserBadge[]>("/badges/my"),
      ]);
      if (badges.status === "fulfilled") {
        setAllBadges(Array.isArray(badges.value) ? badges.value : []);
      } else {
        setError(badges.reason instanceof Error ? badges.reason.message : "Failed to load badge catalog");
      }
      if (earned.status === "fulfilled") {
        setMyBadges(Array.isArray(earned.value) ? earned.value : []);
      } else {
        setEarnedError(earned.reason instanceof Error ? earned.reason.message : "Your earned badges could not be loaded.");
      }
    } finally {
      setLoading(false);
    }
  }

  const earnedIds = new Set(myBadges.map((b) => b.badgeId));

  const filteredBadges =
    filter === "earned"
      ? allBadges.filter((b) => earnedIds.has(b.id))
      : filter === "locked"
      ? allBadges.filter((b) => !earnedIds.has(b.id))
      : allBadges;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Badges</h1>
          <p className="text-sm text-slate-400 mt-1">Loading credential milestones</p>
        </div>
        <DashboardLoadingState title="Loading badge catalog" rows={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Badges</h1>
          <p className="text-sm text-slate-400 mt-1">Credential milestones and rewards</p>
        </div>
        <DashboardErrorState description={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Badges</h1>
        <p className="text-sm text-slate-400 mt-1">
          {myBadges.length} of {allBadges.length} earned
        </p>
      </div>

      {earnedError && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle size={16} />
          <span>{earnedError} Showing the badge catalog without earned progress.</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["all", "earned", "locked"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? "bg-[#7AD62A] text-[#0F203A]"
                : "border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/8"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filteredBadges.length === 0 ? (
        <DashboardEmptyState
          icon={Award}
          title="No badges in this view"
          description={filter === "earned" ? "You have not earned a badge yet. Complete labs, lessons, and streak goals to unlock your first milestone." : "The badge catalog is empty for this filter."}
          tone="accent"
        />
      ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredBadges.map((badge) => {
          const earned = earnedIds.has(badge.id);
          const Icon = iconMap[badge.icon] || Award;

          return (
            <div
              key={badge.id}
              className={`angular-card border p-4 text-center transition-all ${
                earned
                  ? tierColors[badge.tier] || tierColors.BRONZE
                  : "bg-white/[0.03] border-white/10 opacity-70"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-gradient-to-br ${
                  earned ? tierBg[badge.tier] || tierBg.BRONZE : "from-slate-300 to-slate-400"
                }`}
              >
                <Icon size={20} className="text-white" />
              </div>
              <p className="text-xs font-semibold text-white">{badge.name}</p>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{badge.description}</p>
              {badge.xpReward > 0 && (
                <p className="text-[10px] font-bold text-amber-300 mt-2">+{badge.xpReward} XP</p>
              )}
              {earned && (
                <div className="mt-2"><StatusPill tone="success">Earned</StatusPill></div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
