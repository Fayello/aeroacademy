"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useDashboard } from "@/hooks/useDashboard";
import StatsGrid from "@/components/dashboard/StatsGrid";
import IntelligenceCard from "@/components/dashboard/IntelligenceCard";
import SandboxCard from "@/components/dashboard/SandboxCard";
import LeaderboardPreview from "@/components/dashboard/LeaderboardPreview";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import OnboardingCard from "@/components/OnboardingCard";
import { DashboardSkeleton } from "@/components/Skeleton";
import {
  BookOpen,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Award,
  Play,
  Loader2,
  Rocket,
  Target,
  Zap,
  FlaskConical,
  Flag,
  Shield,
  Satellite,
  Radar,
  Terminal,
  Circle,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface ActiveLabInstance {
  id: string;
  userId: string;
  labId: string;
  containerId: string | null;
  port: number | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  lab: {
    id: string;
    title: string;
    difficulty: number;
    imageUrl: string | null;
    dockerImage: string;
  };
}

interface ActivityEvent {
  id: string;
  userId: string;
  type: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface GlobalActivityEvent extends ActivityEvent {
  user: { id: string; name: string | null; email: string } | null;
}

interface UserLabStats {
  totalSessions: number;
  activeSessions: number;
  flagsSolved: number;
}

interface CourseWithProgress {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  estimatedHours: number | null;
  sections: { lessons: { id: string }[] }[];
  progress?: { total: number; completed: number; percentage: number };
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [latestProgress, setLatestProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeLabs, setActiveLabs] = useState<ActiveLabInstance[]>([]);
  const [activeLabsLoading, setActiveLabsLoading] = useState(true);

  const [labActivity, setLabActivity] = useState<ActivityEvent[]>([]);
  const [labActivityLoading, setLabActivityLoading] = useState(true);

  const [userStats, setUserStats] = useState<UserLabStats | null>(null);
  const [userStatsLoading, setUserStatsLoading] = useState(true);

  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [globalActivity, setGlobalActivity] = useState<GlobalActivityEvent[]>([]);
  const [globalActivityLoading, setGlobalActivityLoading] = useState(true);

  const { intelligence, userMetrics, feed, leaderboard } = useDashboard();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch {
      setUser(null);
    }

    async function loadData() {
      try {
        const [
          progress,
          labs,
          activity,
          stats,
          coursesData,
          globalActivityData,
        ] = await Promise.allSettled([
          fetchApi("/progress/latest"),
          fetchApi("/dashboard/active-labs"),
          fetchApi("/dashboard/activity"),
          fetchApi("/dashboard/user-stats"),
          fetchApi("/courses"),
          fetchApi("/dashboard/global-activity"),
        ]);

        if (progress.status === "fulfilled") setLatestProgress(progress.value);
        if (labs.status === "fulfilled") setActiveLabs(labs.value as ActiveLabInstance[]);
        if (activity.status === "fulfilled") setLabActivity(activity.value as ActivityEvent[]);
        if (stats.status === "fulfilled") setUserStats(stats.value as UserLabStats);
        if (globalActivityData.status === "fulfilled") setGlobalActivity(globalActivityData.value as GlobalActivityEvent[]);

        if (coursesData.status === "fulfilled") {
          const courseList = coursesData.value as CourseWithProgress[];
          const enriched = await Promise.allSettled(
            courseList.map(async (course) => {
              try {
                const progressData = await fetchApi(`/progress/course/${course.id}`);
                return { ...course, progress: progressData };
              } catch {
                return course;
              }
            })
          );
          setCourses(
            enriched
              .filter((r): r is PromiseFulfilledResult<CourseWithProgress> => r.status === "fulfilled")
              .map((r) => r.value)
          );
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
        setActiveLabsLoading(false);
        setLabActivityLoading(false);
        setUserStatsLoading(false);
        setCoursesLoading(false);
        setGlobalActivityLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (userMetrics?.xp != null) {
      localStorage.setItem("xp", String(userMetrics.xp));
    }
  }, [userMetrics?.xp]);

  if (!user) {
    return <DashboardSkeleton />;
  }

  const greeting = `Welcome back, ${user.name || user.email.split("@")[0]}`;

  const coursesInProgress = courses.filter((c) => c.progress && c.progress.completed > 0);

  function formatActivityType(type: string): { label: string; color: string; icon: typeof Play; dotColor: string } {
    switch (type) {
      case "LAB_STARTED":
        return { label: "Lab Started", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Rocket, dotColor: "bg-blue-400" };
      case "LAB_STOPPED":
        return { label: "Lab Stopped", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: FlaskConical, dotColor: "bg-orange-400" };
      case "FLAG_SOLVED":
        return { label: "Flag Captured", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Flag, dotColor: "bg-emerald-400" };
      case "LESSON_COMPLETED":
        return { label: "Lesson Done", color: "bg-violet-500/20 text-violet-400 border-violet-500/30", icon: BookOpen, dotColor: "bg-violet-400" };
      case "QUIZ_PASSED":
        return { label: "Quiz Passed", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Target, dotColor: "bg-amber-400" };
      default:
        return { label: type, color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: Zap, dotColor: "bg-slate-400" };
    }
  }

  function formatActivityMessage(event: ActivityEvent | GlobalActivityEvent): string {
    const meta = event.metadata as Record<string, string> | null;
    switch (event.type) {
      case "LAB_STARTED":
        return `Started lab: ${meta?.labTitle || "Unknown"}`;
      case "LAB_STOPPED":
        return `Stopped lab: ${meta?.labTitle || "Unknown"}`;
      case "FLAG_SOLVED":
        return `Captured flag: ${meta?.flagTitle || "Unknown"}`;
      case "LESSON_COMPLETED":
        return `Completed lesson: ${meta?.lessonTitle || "Unknown"}`;
      case "QUIZ_PASSED":
        return `Passed quiz in: ${meta?.courseTitle || "Unknown"}`;
      case "COURSE_COMPLETED":
        return `Completed course: ${meta?.courseTitle || "Unknown"}`;
      default:
        return `${event.type.replace(/_/g, " ").toLowerCase()}`;
    }
  }

  function getInitials(name: string | null | undefined, email: string): string {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  }

  function getAvatarColor(name: string | null | undefined, email: string): string {
    const hash = (name || email).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      "bg-blue-600", "bg-violet-600", "bg-emerald-600", "bg-amber-600",
      "bg-rose-600", "bg-cyan-600", "bg-indigo-600", "bg-pink-600",
    ];
    return colors[hash % colors.length];
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Minimal Welcome Header */}
      <div className="relative">
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{greeting}</h1>
          <div className="h-px flex-1 bg-gradient-to-r from-blue-500/40 to-transparent" />
        </div>
        <p className="text-sm text-slate-500 mt-1">Mission Control &mdash; Aerospace Academy</p>
      </div>

      {/* Compact Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "XP Earned",
            value: userMetrics?.xp || 0,
            icon: Zap,
            gradient: "from-blue-500/10 to-blue-600/5 border-blue-500/20",
            iconColor: "text-blue-400",
            trend: "+12%",
            up: true,
          },
          {
            label: "Global Rank",
            value: `#${userMetrics?.rank || 1200}`,
            icon: Target,
            gradient: "from-violet-500/10 to-violet-600/5 border-violet-500/20",
            iconColor: "text-violet-400",
            trend: "+3",
            up: true,
          },
          {
            label: "Division",
            value: userMetrics?.division || "BRONZE",
            icon: Award,
            gradient: "from-amber-500/10 to-amber-600/5 border-amber-500/20",
            iconColor: "text-amber-400",
            trend: "",
            up: true,
          },
          {
            label: "Flags Captured",
            value: userStats?.flagsSolved || 0,
            icon: Flag,
            gradient: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20",
            iconColor: "text-emerald-400",
            trend: "",
            up: true,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`relative group rounded-lg border bg-gradient-to-br ${stat.gradient} p-4 hover:scale-[1.02] transition-all duration-200 cursor-default`}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={14} className={stat.iconColor} />
              {stat.trend && (
                <span className={`text-[10px] font-medium flex items-center gap-0.5 ${stat.up ? "text-emerald-400" : "text-red-400"}`}>
                  {stat.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {stat.trend}
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-slate-100">{stat.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <OnboardingCard />

      <StatsGrid
        xp={userMetrics?.xp || 0}
        rank={userMetrics?.rank || 1200}
        division={userMetrics?.division || "BRONZE"}
        clearance={userMetrics?.clearance || "STUDENT_L1"}
        loading={loading}
      />

      {/* Active Labs - Terminal Aesthetic */}
      <div className="relative rounded-xl border border-slate-700/50 bg-[#0c0e14] overflow-hidden">
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Terminal size={16} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Active Labs</h3>
                <p className="text-xs text-slate-500">Running lab instances</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {userStats?.activeSessions ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                  <Circle size={6} className="fill-emerald-400 text-emerald-400 animate-pulse" />
                  {userStats.activeSessions} online
                </div>
              ) : (
                <span className="text-xs text-slate-600 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">0 active</span>
              )}
              <Link
                href="/dashboard/labs"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {activeLabsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-blue-400 animate-spin" />
            </div>
          ) : activeLabs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FlaskConical size={24} className="text-slate-700 mb-2" />
              <p className="text-sm text-slate-500 mb-1">No active labs</p>
              <p className="text-xs text-slate-600 mb-4">Start a lab to begin hands-on practice</p>
              <Link
                href="/dashboard/labs"
                className="text-xs py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                Browse Labs <ArrowRight size={14} className="inline ml-1" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeLabs.map((instance) => (
                <Link
                  key={instance.id}
                  href={`/dashboard/labs/${instance.labId}`}
                  className="group relative p-4 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-blue-500/30 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <FlaskConical size={16} className="text-blue-400" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0c0e14] animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate group-hover:text-blue-300 transition-colors">
                        {instance.lab.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50">
                          LVL {instance.lab.difficulty}
                        </span>
                        {instance.port && (
                          <span className="text-[11px] text-slate-600 font-mono">
                            :{instance.port}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Launch Button */}
                  <div className="mt-3 flex justify-end">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md group-hover:bg-blue-500/20 group-hover:border-blue-500/30 transition-all group-hover:shadow-[0_0_12px_rgba(59,130,246,0.15)]">
                      <Rocket size={10} />
                      Launch
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Continue Learning - Course Cards with Gradient Overlays */}
      <div className="relative rounded-xl border border-slate-700/50 bg-[#0c0e14] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Play size={16} className="text-blue-400" fill="currentColor" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Continue Learning</h3>
                <p className="text-xs text-slate-500">Pick up where you left off</p>
              </div>
            </div>
            <Link
              href="/dashboard/courses"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {coursesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-blue-400 animate-spin" />
            </div>
          ) : coursesInProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BookOpen size={24} className="text-slate-700 mb-2" />
              <p className="text-sm text-slate-500 mb-1">No courses in progress</p>
              <p className="text-xs text-slate-600 mb-4">Start a course to track your progress</p>
              <Link
                href="/dashboard/courses"
                className="text-xs py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                Browse Courses <ArrowRight size={14} className="inline ml-1" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {coursesInProgress.slice(0, 6).map((course) => {
                const pct = course.progress?.percentage || 0;
                const radius = 18;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (pct / 100) * circumference;

                return (
                  <Link
                    key={course.id}
                    href={`/dashboard/courses/${course.id}`}
                    className="group relative rounded-lg bg-slate-900/80 border border-slate-800 hover:border-blue-500/30 overflow-hidden transition-all duration-200"
                  >
                    {/* Gradient thumbnail header */}
                    <div className="h-20 bg-gradient-to-br from-blue-600/20 via-violet-600/10 to-transparent relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14] to-transparent" />
                      <div className="absolute bottom-2 left-3 right-3">
                        <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-blue-300 transition-colors">
                          {course.title}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 pt-0 flex items-center gap-3">
                      {/* Progress Ring */}
                      <div className="relative shrink-0">
                        <svg width="44" height="44" viewBox="0 0 44 44" className="rotate-[-90deg]">
                          <circle
                            cx="22"
                            cy="22"
                            r={radius}
                            fill="none"
                            stroke="rgba(59,130,246,0.1)"
                            strokeWidth="3"
                          />
                          <circle
                            cx="22"
                            cy="22"
                            r={radius}
                            fill="none"
                            stroke="rgb(59,130,246)"
                            strokeWidth="3"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className="transition-all duration-500"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-400">
                          {pct}%
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500">
                          {course.progress?.completed || 0} / {course.progress?.total || 0} lessons
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{course.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IntelligenceCard
          latestProgress={latestProgress || userMetrics?.latestProgress}
          courseProgress={userMetrics?.courseProgress || 0}
        />
        <SandboxCard logs={intelligence?.logs || []} />
      </div>

      {/* Lab Activity Feed - Timeline Style */}
      <div className="relative rounded-xl border border-slate-700/50 bg-[#0c0e14] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Zap size={16} className="text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Lab Activity</h3>
                <p className="text-xs text-slate-500">Your recent lab sessions</p>
              </div>
            </div>
          </div>

          {labActivityLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-blue-400 animate-spin" />
            </div>
          ) : labActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Zap size={24} className="text-slate-700 mb-2" />
              <p className="text-sm text-slate-500">No lab activity yet</p>
            </div>
          ) : (
            <div className="relative max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <div className="absolute left-[18px] top-0 bottom-0 w-px bg-slate-800" />
              <div className="space-y-1">
                {labActivity.map((event) => {
                  const { dotColor, icon: Icon } = formatActivityType(event.type);
                  return (
                    <div key={event.id} className="relative flex items-start gap-3 py-2.5 group">
                      {/* Timeline dot */}
                      <div className="relative z-10 shrink-0 mt-1">
                        <div className={`w-3 h-3 rounded-full ${dotColor} ring-2 ring-[#0c0e14]`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-300 leading-snug group-hover:text-slate-200 transition-colors">
                            {formatActivityMessage(event)}
                          </p>
                          <Icon size={12} className="text-slate-600 shrink-0" />
                        </div>
                        <span className="text-[11px] text-slate-600 font-mono">
                          {new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaderboardPreview leaderboard={leaderboard} />
        <ActivityFeed feed={feed} />
      </div>

      {/* Global Recent Activity - Timeline */}
      <div className="relative rounded-xl border border-slate-700/50 bg-[#0c0e14] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Radar size={16} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Global Activity</h3>
                <p className="text-xs text-slate-500">Platform-wide activity feed</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
              <Circle size={6} className="fill-emerald-400 text-emerald-400 animate-pulse" />
              Live
            </span>
          </div>

          {globalActivityLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-blue-400 animate-spin" />
            </div>
          ) : globalActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Clock size={24} className="text-slate-700 mb-2" />
              <p className="text-sm text-slate-500">No recent activity</p>
            </div>
          ) : (
            <div className="relative max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <div className="absolute left-[18px] top-0 bottom-0 w-px bg-slate-800" />
              <div className="space-y-1">
                {globalActivity.map((event) => {
                  const { dotColor } = formatActivityType(event.type);
                  const userName = event.user?.name || event.user?.email.split("@")[0] || "Someone";
                  return (
                    <div key={event.id} className="relative flex items-start gap-3 py-2.5 group">
                      {/* Timeline dot */}
                      <div className="relative z-10 shrink-0 mt-1">
                        <div className={`w-3 h-3 rounded-full ${dotColor} ring-2 ring-[#0c0e14]`} />
                      </div>
                      {/* Avatar */}
                      <div className="relative z-10 shrink-0 mt-0.5">
                        <div
                          className={`w-6 h-6 rounded-full ${getAvatarColor(event.user?.name, event.user?.email || "")} flex items-center justify-center`}
                        >
                          <span className="text-[9px] font-bold text-white">
                            {getInitials(event.user?.name, event.user?.email || "")}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 leading-snug group-hover:text-slate-200 transition-colors">
                          <span className="font-medium text-slate-200">{userName}</span>{" "}
                          {formatActivityMessage(event).toLowerCase()}
                        </p>
                        <span className="text-[11px] text-slate-600 font-mono">
                          {new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Access - Glassmorphism Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/courses"
          className="group relative rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-800 p-6 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.08)]"
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Radar size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 group-hover:text-blue-300 transition-colors">Courses</h3>
                <p className="text-sm text-slate-500">Continue learning</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link
          href="/dashboard/labs"
          className="group relative rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-800 p-6 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)]"
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <Satellite size={20} className="text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 group-hover:text-violet-300 transition-colors">Labs</h3>
                <p className="text-sm text-slate-500">Hands-on practice</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link
          href="/dashboard/master-classes"
          className="group relative rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-800 p-6 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]"
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Shield size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">Master Classes</h3>
                <p className="text-sm text-slate-500">Live sessions</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>
    </div>
  );
}
