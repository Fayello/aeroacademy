"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  Award,
  Loader2,
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
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

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
  BRONZE: "bg-amber-50 border-amber-200 text-amber-700",
  SILVER: "bg-slate-50 border-slate-200 text-slate-700",
  GOLD: "bg-yellow-50 border-yellow-200 text-yellow-700",
  PLATINUM: "bg-purple-50 border-purple-200 text-purple-700",
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
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const [badges, earned] = await Promise.all([
        fetchApi<Badge[]>("/badges"),
        fetchApi<UserBadge[]>("/badges/my"),
      ]);
      setAllBadges(badges);
      setMyBadges(earned);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load badges");
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
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle size={32} className="text-red-400 mb-3" />
        <p className="text-sm text-slate-600 mb-3">{error}</p>
        <button onClick={load} className="px-4 py-2 text-sm font-medium text-[#229C62] hover:bg-[#E9F8EE] rounded-lg transition-colors">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Badges</h1>
        <p className="text-sm text-slate-500 mt-1">
          {myBadges.length} of {allBadges.length} earned
        </p>
      </div>

      <div className="flex gap-2">
        {(["all", "earned", "locked"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredBadges.map((badge) => {
          const earned = earnedIds.has(badge.id);
          const Icon = iconMap[badge.icon] || Award;

          return (
            <div
              key={badge.id}
              className={`rounded-xl border p-4 text-center transition-all ${
                earned
                  ? tierColors[badge.tier] || tierColors.BRONZE
                  : "bg-slate-50 border-slate-200 opacity-50"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-gradient-to-br ${
                  earned ? tierBg[badge.tier] || tierBg.BRONZE : "from-slate-300 to-slate-400"
                }`}
              >
                <Icon size={20} className="text-white" />
              </div>
              <p className="text-xs font-semibold text-slate-900">{badge.name}</p>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{badge.description}</p>
              {badge.xpReward > 0 && (
                <p className="text-[10px] font-bold text-amber-600 mt-2">+{badge.xpReward} XP</p>
              )}
              {earned && (
                <span className="inline-block mt-2 text-[9px] font-medium text-[#229C62] bg-[#E9F8EE] px-2 py-0.5 rounded-full">
                  Earned
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
