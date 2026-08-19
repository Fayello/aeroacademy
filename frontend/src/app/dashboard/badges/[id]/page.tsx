"use client";

import { useEffect, useState, use } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import {
  Award,
  Loader2,
  ArrowLeft,
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
  Users,
  CheckCircle2,
  Lock,
  Sparkles,
} from "lucide-react";

interface BadgeDetail {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  xpReward: number;
  requirement: string;
  _count: { users: number };
}

interface UserBadge {
  badgeId: string;
  earnedAt: string;
  badge: BadgeDetail;
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

const categoryLabels: Record<string, string> = {
  MILESTONE: "Milestone",
  SKILL: "Skill",
  ENGAGEMENT: "Engagement",
  STREAK: "Streak",
  LEVEL: "Level",
};

const requirementLabels: Record<string, string> = {
  complete_1_lesson: "Complete your first lesson",
  complete_5_lessons: "Complete 5 lessons",
  complete_10_lessons: "Complete 10 lessons",
  complete_25_lessons: "Complete 25 lessons",
  complete_50_lessons: "Complete 50 lessons",
  capture_1_flag: "Capture your first flag",
  capture_5_flags: "Capture 5 flags",
  capture_10_flags: "Capture 10 flags",
  capture_25_flags: "Capture 25 flags",
  enroll_3_courses: "Enroll in 3 courses",
  enroll_5_courses: "Enroll in 5 courses",
  streak_7_days: "Maintain a 7-day streak",
  streak_30_days: "Maintain a 30-day streak",
  level_5: "Reach Level 5",
  level_10: "Reach Level 10",
};

export default function BadgeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [allBadges, setAllBadges] = useState<BadgeDetail[]>([]);
  const [myBadges, setMyBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [badges, earned] = await Promise.all([
          fetchApi<BadgeDetail[]>("/badges"),
          fetchApi<UserBadge[]>("/badges/my"),
        ]);
        setAllBadges(badges);
        setMyBadges(earned);
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
        <Loader2 size={20} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  const badge = allBadges.find((b) => b.id === id);
  if (!badge) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <Award size={32} className="text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Badge not found</p>
        <Link href="/dashboard/badges" className="text-xs text-blue-600 hover:text-blue-700 mt-3 inline-block">
          Back to Badges
        </Link>
      </div>
    );
  }

  const earned = myBadges.some((b) => b.badgeId === id);
  const earnedBadge = myBadges.find((b) => b.badgeId === id);
  const Icon = iconMap[badge.icon] || Award;
  const relatedBadges = allBadges
    .filter((b) => b.category === badge.category && b.id !== badge.id)
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link
        href="/dashboard/badges"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={14} /> Back to Badges
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className={`bg-gradient-to-r ${earned ? tierBg[badge.tier] || tierBg.BRONZE : "from-slate-400 to-slate-500"} p-8 text-white text-center`}>
          <div className="w-20 h-20 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center">
            <Icon size={36} />
          </div>
          <h1 className="text-2xl font-bold">{badge.name}</h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
              {categoryLabels[badge.category] || badge.category}
            </span>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
              {badge.tier}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-center">
            <p className="text-sm text-slate-600 leading-relaxed">{badge.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <Sparkles size={18} className="text-amber-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900">{badge.xpReward}</p>
              <p className="text-[11px] text-slate-500">XP Reward</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <Users size={18} className="text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900">{badge._count.users}</p>
              <p className="text-[11px] text-slate-500">Earned By</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <Target size={18} className="text-[#229C62] mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900">{badge.tier}</p>
              <p className="text-[11px] text-slate-500">Tier</p>
            </div>
          </div>

          {earned ? (
            <div className="flex items-center gap-2 text-[#229C62] text-sm bg-[#E9F8EE] p-3 rounded-lg">
              <CheckCircle2 size={16} />
              <span className="font-medium">Badge Earned</span>
              {earnedBadge && (
                <span className="text-[11px] text-[#229C62] ml-auto">
                  {new Date(earnedBadge.earnedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-50 p-3 rounded-lg">
              <Lock size={16} />
              <span className="font-medium">Not Yet Earned</span>
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Requirement</h2>
            <p className="text-sm text-slate-600">
              {requirementLabels[badge.requirement] || badge.requirement}
            </p>
          </div>

          {relatedBadges.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Related Badges</h2>
              <div className="grid grid-cols-3 gap-3">
                {relatedBadges.map((rb) => {
                  const rbEarned = myBadges.some((b) => b.badgeId === rb.id);
                  const RbIcon = iconMap[rb.icon] || Award;
                  return (
                    <Link
                      key={rb.id}
                      href={`/dashboard/badges/${rb.id}`}
                      className={`rounded-lg border p-3 text-center transition-all hover:shadow-sm ${
                        rbEarned
                          ? tierColors[rb.tier] || tierColors.BRONZE
                          : "bg-slate-50 border-slate-200 opacity-60"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-gradient-to-br ${
                          rbEarned ? tierBg[rb.tier] || tierBg.BRONZE : "from-slate-300 to-slate-400"
                        }`}
                      >
                        <RbIcon size={16} className="text-white" />
                      </div>
                      <p className="text-[10px] font-semibold text-slate-900 truncate">{rb.name}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
