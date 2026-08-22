"use client";

import { useState, useEffect } from "react";
import {
  Shield, Trophy, TrendingUp, BookOpen, Microscope, Clock, Lock, Star,
  Award, Flame, Zap, Flag, Target, Crosshair, Crown, Compass, Library,
  Footprints, GraduationCap, MapPin, Building2, Calendar, Users, Brain,
  Flame as FireIcon, Activity, ChevronRight, BarChart3, Medal, Ticket,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useDashboard } from "@/hooks/useDashboard";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import { getLevel, getLevelProgress } from "@/lib/levelGating";
import type { User, Achievement } from "@/types/api";

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

interface UserProfile extends User {
  currentStreak?: number;
  longestStreak?: number;
  lastActivityDate?: string | null;
  timezone?: string;
  organization?: { id: string; name: string; type: string } | null;
  team?: { id: string; name: string; description?: string | null } | null;
  level?: number;
  clearance?: string;
  _count?: {
    achievements: number;
    progress: number;
    labSubmissions: number;
  };
}

interface UserStats {
  totalSessions: number;
  activeSessions: number;
  flagsSolved: number;
  daysActive: number;
}

interface ActivityEvent {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface CourseProgressItem {
  courseId: string;
  title: string;
  total: number;
  completed: number;
  percentage: number;
  enrolledAt: string;
  lastActivityAt: string;
}

interface LearningAnalytics {
  user: { id: string; name: string; xp: number; currentStreak: number; longestStreak: number };
  courseProgress: CourseProgressItem[];
  stats: {
    totalCoursesEnrolled: number;
    totalLessonsCompleted: number;
    totalFlagsCaptured: number;
    currentStreak: number;
    longestStreak: number;
  };
  weeklyActivity: Record<string, number>;
}

interface LearningPathEnrollment {
  learningPathId: string;
  enrolledAt: string;
  completedAt: string | null;
  learningPath: {
    id: string;
    title: string;
    description: string;
    courseCount: number;
  };
}

interface Certificate {
  courseId: string;
  courseName: string;
  eligible: boolean;
  completed: number;
  total: number;
  certificate?: {
    id: string;
    courseName: string;
    userName: string;
    issuedAt: string;
    credentialUrl: string;
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
  BRONZE: "bg-amber-50 border-amber-200",
  SILVER: "bg-slate-50 border-slate-300",
  GOLD: "bg-yellow-50 border-yellow-300",
  PLATINUM: "bg-purple-50 border-purple-300",
};

const DIVISION_INFO: Record<string, { color: string; bg: string; icon: string; next: string; nextAt: number }> = {
  BRONZE:   { color: "text-amber-700", bg: "bg-amber-100", icon: "bronze", next: "SILVER", nextAt: 800 },
  SILVER:   { color: "text-slate-500", bg: "bg-slate-200", icon: "silver", next: "GOLD", nextAt: 1200 },
  GOLD:     { color: "text-amber-600", bg: "bg-amber-100", icon: "gold", next: "PLATINUM", nextAt: 1600 },
  PLATINUM: { color: "text-[#229C62]", bg: "bg-[#E9F8EE]", icon: "platinum", next: "DIAMOND", nextAt: 2000 },
  DIAMOND:  { color: "text-blue-600", bg: "bg-blue-100", icon: "diamond", next: "TITAN", nextAt: 2400 },
  TITAN:    { color: "text-indigo-600", bg: "bg-indigo-100", icon: "titan", next: "", nextAt: Infinity },
};

const LEVEL_UNLOCKS = [
  { level: 3, label: "Beginner Labs", icon: Microscope },
  { level: 4, label: "Intermediate", icon: BookOpen },
  { level: 5, label: "Registry", icon: Shield },
  { level: 7, label: "Advanced", icon: BookOpen },
  { level: 10, label: "Certifications", icon: Trophy },
];

const ACTIVITY_ICONS: Record<string, typeof Flag> = {
  LAB_STARTED: Target,
  LAB_STOPPED: Target,
  FLAG_SOLVED: Flag,
  LESSON_COMPLETED: BookOpen,
  QUIZ_PASSED: Brain,
  COURSE_COMPLETED: GraduationCap,
};

const ACTIVITY_COLORS: Record<string, string> = {
  LAB_STARTED: "bg-blue-100 text-blue-600",
  LAB_STOPPED: "bg-slate-100 text-slate-500",
  FLAG_SOLVED: "bg-[#E9F8EE] text-[#229C62]",
  LESSON_COMPLETED: "bg-purple-100 text-purple-600",
  QUIZ_PASSED: "bg-amber-100 text-amber-600",
  COURSE_COMPLETED: "bg-green-100 text-green-600",
};

function formatActivityType(type: string): string {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [myBadges, setMyBadges] = useState<UserBadge[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [learningPaths, setLearningPaths] = useState<LearningPathEnrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const { userMetrics } = useDashboard();

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;

        const [fullProfile, stats, act, an, paths] = await Promise.allSettled([
          fetchApi<UserProfile>("/auth/me"),
          fetchApi<UserStats>("/dashboard/user-stats"),
          fetchApi<ActivityEvent[]>("/dashboard/activity"),
          fetchApi<LearningAnalytics>("/analytics/learning"),
          fetchApi<LearningPathEnrollment[]>("/learning-paths/my"),
        ]);

        const profile = fullProfile.status === "fulfilled" ? fullProfile.value : parsedUser;
        setUser(profile);
        if (stats.status === "fulfilled") setUserStats(stats.value);
        if (act.status === "fulfilled") setActivity(act.value);
        if (an.status === "fulfilled") setAnalytics(an.value);
        if (paths.status === "fulfilled") setLearningPaths(paths.value);

        if (profile?._count && analytics) {
          const certResults = await Promise.allSettled(
            (analytics.courseProgress || []).map((cp) =>
              fetchApi<Certificate>(`/courses/${cp.courseId}/certificate`)
            )
          );
          setCertificates(
            certResults
              .filter((r): r is PromiseFulfilledResult<Certificate> => r.status === "fulfilled")
              .map((r) => r.value)
              .filter((c) => c.certificate)
          );
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    fetchApi<UserBadge[]>("/badges/my").then(setMyBadges).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#229C62]" />
      </div>
    );
  }

  if (!user) return null;

  const xp = userMetrics?.xp || user.xp || 0;
  const level = userMetrics?.level || getLevel(xp);
  const progress = getLevelProgress(xp);
  const xpInLevel = xp % 1000;
  const division = userMetrics?.division || user.division || "BRONZE";
  const divInfo = DIVISION_INFO[division] || DIVISION_INFO.BRONZE;
  const rank = userMetrics?.rank || user.rank || 1200;
  const streak = userMetrics?.streak || user.currentStreak || 0;
  const longestStreak = user.longestStreak || 0;
  const daysActive = userStats?.daysActive || 0;
  const flagsSolved = userStats?.flagsSolved || user._count?.labSubmissions || 0;
  const coursesEnrolled = analytics?.stats?.totalCoursesEnrolled || 0;
  const lessonsCompleted = analytics?.stats?.totalLessonsCompleted || user._count?.progress || 0;
  const weeklyActivity = analytics?.weeklyActivity || {};

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date();
  const weekDates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    weekDates.push(d.toISOString().split("T")[0]);
  }
  const maxWeekly = Math.max(1, ...weekDates.map((d) => weeklyActivity[d] || 0));

  const enrolledCourses = (analytics?.courseProgress || []).filter((cp) => cp.total > 0);
  const completedPaths = learningPaths.filter((lp) => lp.completedAt);
  const activePaths = learningPaths.filter((lp) => !lp.completedAt);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Profile Header */}
      <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200 p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#E9F8EE] to-transparent rounded-bl-full opacity-60" />
        <div className="flex flex-col sm:flex-row items-start gap-5 relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#229C62] to-[#7AD62A] flex items-center justify-center shrink-0 ring-4 ring-white shadow-lg">
            <span className="text-2xl font-bold text-white">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{user.name || user.email.split("@")[0]}</h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${divInfo.bg} ${divInfo.color}`}>
                <Shield size={12} />
                {division}
              </span>
              {user.clearance && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  <Medal size={12} />
                  {user.clearance.replace("_", " ")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500 flex-wrap">
              {user.username && (
                <span className="flex items-center gap-1 text-[#229C62] font-medium">@{user.username}</span>
              )}
              <span>{user.email}</span>
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
                    <span className="flex items-center gap-1 text-[#229C62] font-medium"><Users size={12} />{user.team.name}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                const url = `${window.location.origin}/dashboard/profile/${user.id}`;
                navigator.clipboard.writeText(url);
                toast.success("Profile link copied!");
              }}
              className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2 px-3 rounded-lg text-sm transition-all flex items-center gap-1.5"
              title="Copy profile link"
            >
              <ExternalLink size={14} />
              Share
            </button>
            <Link href="/dashboard/profile/edit" className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2 px-4 rounded-lg text-sm transition-all">
              Edit profile
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total XP", value: xp.toLocaleString(), icon: TrendingUp, color: "text-[#229C62]", bg: "bg-[#E9F8EE]" },
          { label: "Current Streak", value: `${streak} day${streak !== 1 ? "s" : ""}`, icon: Flame, color: "text-orange-500", bg: "bg-orange-50", sub: longestStreak > 0 ? `Best: ${longestStreak}` : undefined },
          { label: "Flags Solved", value: String(flagsSolved), icon: Flag, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Days Active", value: String(daysActive), icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
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
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#E9F8EE] flex items-center justify-center">
              <TrendingUp size={22} className="text-[#229C62]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Level {level}</h2>
              <p className="text-sm text-slate-500">{xp.toLocaleString()} total XP</p>
            </div>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-[#229C62] to-[#7AD62A] rounded-full transition-all duration-500"
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

      {/* Weekly Activity */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <BarChart3 size={18} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Weekly Activity</h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Flame size={12} className="text-orange-500" />
            {streak > 0 ? `${streak} day streak` : "Start a streak today"}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const count = weeklyActivity[date] || 0;
            const height = count > 0 ? Math.max(20, (count / maxWeekly) * 100) : 4;
            return (
              <div key={date} className="flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: 80 }}>
                  <div
                    className={`w-full max-w-[32px] rounded-t-md transition-all duration-300 ${
                      count > 0 ? "bg-gradient-to-t from-[#229C62] to-[#7AD62A]" : "bg-slate-100"
                    }`}
                    style={{ height: `${height}%` }}
                    title={`${count} lesson${count !== 1 ? "s" : ""}`}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{weekDays[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Learning Progress */}
      {enrolledCourses.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <BookOpen size={18} className="text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Course Progress</h2>
            </div>
            <span className="text-xs text-slate-500">{coursesEnrolled} enrolled</span>
          </div>
          <div className="space-y-3">
            {enrolledCourses.slice(0, 6).map((cp) => (
              <div key={cp.courseId} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{cp.title}</span>
                  <span className="text-xs font-medium text-slate-500">{cp.completed}/{cp.total} lessons ({cp.percentage}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#229C62] to-[#7AD62A] rounded-full transition-all duration-500"
                    style={{ width: `${cp.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {enrolledCourses.length > 6 && (
            <Link href="/dashboard/courses" className="mt-3 text-xs text-[#229C62] hover:text-[#1a7a4d] font-medium flex items-center gap-1">
              View all {enrolledCourses.length} courses <ChevronRight size={14} />
            </Link>
          )}
        </div>
      )}

      {/* Learning Paths */}
      {(activePaths.length > 0 || completedPaths.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Compass size={18} className="text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Learning Paths</h2>
            </div>
            <Link href="/dashboard/learning-paths" className="text-xs text-[#229C62] hover:text-[#1a7a4d] font-medium">
              Browse Paths
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activePaths.slice(0, 4).map((lp) => (
              <Link
                key={lp.learningPathId}
                href={`/dashboard/learning-paths/${lp.learningPathId}`}
                className="p-4 rounded-xl border border-slate-200 hover:border-[#229C62]/30 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#229C62] transition-colors">{lp.learningPath.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{lp.learningPath.courseCount} courses</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">In Progress</span>
                </div>
              </Link>
            ))}
            {completedPaths.slice(0, 2).map((lp) => (
              <Link
                key={lp.learningPathId}
                href={`/dashboard/learning-paths/${lp.learningPathId}`}
                className="p-4 rounded-xl border border-[#229C62]/20 bg-[#E9F8EE]/30 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#229C62] transition-colors">{lp.learningPath.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{lp.learningPath.courseCount} courses</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#229C62]/10 text-[#229C62] text-[10px] font-semibold">Completed</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
                    ? "bg-[#E9F8EE] border-[#229C62]/20 hover:shadow-md"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${
                  unlocked ? "bg-[#E9F8EE]" : "bg-slate-100"
                }`}>
                  {unlocked ? (
                    <Icon size={18} className="text-[#229C62]" />
                  ) : (
                    <Lock size={18} className="text-slate-400" />
                  )}
                </div>
                <p className="text-xs font-medium text-slate-700">{label}</p>
                <p className={`text-[10px] mt-1 ${unlocked ? "text-[#229C62]" : "text-slate-400"}`}>
                  {unlocked ? "Unlocked" : `Lv.${reqLevel}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Certifications */}
      {certificates.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Ticket size={18} className="text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Certifications</h2>
            </div>
            <Link href="/dashboard/certifications" className="text-xs text-[#229C62] hover:text-[#1a7a4d] font-medium">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {certificates.map((cert) => (
              <div key={cert.courseId} className="p-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap size={18} className="text-amber-600" />
                  <span className="text-sm font-semibold text-slate-900">{cert.courseName}</span>
                </div>
                <p className="text-xs text-slate-500">Issued {cert.certificate?.issuedAt ? new Date(cert.certificate.issuedAt).toLocaleDateString() : ""}</p>
                {cert.certificate?.credentialUrl && (
                  <a href={cert.certificate.credentialUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-[#229C62] hover:text-[#1a7a4d] font-medium">
                    View Credential <ExternalLink size={11} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges Earned */}
      {myBadges.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Award size={18} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Badges</h2>
                <p className="text-xs text-slate-500">{myBadges.length} earned</p>
              </div>
            </div>
            <Link href="/dashboard/badges" className="text-xs text-[#229C62] hover:text-[#1a7a4d] font-medium flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {myBadges.slice(0, 10).map((ub) => {
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
                  <p className="text-[11px] font-semibold text-slate-900 truncate">{ub.badge.name}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{new Date(ub.earnedAt).toLocaleDateString()}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Star size={18} className="text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Achievements</h2>
                <p className="text-xs text-slate-500">{userMetrics?.achievements?.length || user._count?.achievements || 0} unlocked</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {userMetrics?.achievements && userMetrics.achievements.length > 0 ? (
              userMetrics.achievements.slice(0, 8).map((ach: Achievement) => (
                <div key={ach.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-amber-500" fill="currentColor" />
                    <p className="text-sm font-medium text-slate-900">{ach.title?.replaceAll("_", " ")}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{ach.description}</p>
                  {ach.unlockedAt && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      <Clock size={10} className="inline mr-1" />
                      {new Date(ach.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Star size={32} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-500">No achievements yet</p>
                <p className="text-xs text-slate-400 mt-1">Complete labs and courses to earn achievements</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Activity size={18} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
                <p className="text-xs text-slate-500">{daysActive} days active</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {activity.length > 0 ? (
              activity.slice(0, 8).map((evt) => {
                const Icon = ACTIVITY_ICONS[evt.type] || Flag;
                const colorClass = ACTIVITY_COLORS[evt.type] || "bg-slate-100 text-slate-500";
                const meta = evt.metadata as Record<string, unknown>;
                return (
                  <div key={evt.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center shrink-0`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">
                        {formatActivityType(evt.type)}
                        {typeof meta.lessonTitle === "string" && <span className="font-medium"> {meta.lessonTitle.substring(0, 40)}</span>}
                        {typeof meta.labTitle === "string" && <span className="font-medium"> {meta.labTitle.substring(0, 40)}</span>}
                        {typeof meta.flagName === "string" && <span className="text-[#229C62] font-medium"> &quot;{meta.flagName.substring(0, 30)}&quot;</span>}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(evt.createdAt).toLocaleDateString()} {new Date(evt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Activity size={32} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-500">No activity yet</p>
                <p className="text-xs text-slate-400 mt-1">Start a lab or course to see your activity here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
