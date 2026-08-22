"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useDashboard } from "@/hooks/useDashboard";
import StatsGrid from "@/components/dashboard/StatsGrid";
import LeaderboardPreview from "@/components/dashboard/LeaderboardPreview";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { DashboardSkeleton } from "@/components/Skeleton";
import {
  BookOpen,
  ArrowRight,
  Clock,
  Play,
  Loader2,
  Rocket,
  Zap,
  FlaskConical,
  Flag,
  Target,
  Circle,
  Flame,
  Lock,
  Star,
  ChevronRight,
} from "lucide-react";
import { getLevel, getLevelProgress, getNextLabUnlock } from "@/lib/levelGating";
import DailyMissions from "@/components/dashboard/DailyMissions";

interface User {
  id: string;
  email: string;
  name?: string;
  currentStreak?: number;
  longestStreak?: number;
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
  progress?: { total: number; completed: number; started: number; percentage: number };
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          const me = await fetchApi<{ id: string; email: string; name?: string }>("/auth/me");
          if (!cancelled && me) {
            localStorage.setItem("user", JSON.stringify(me));
            setUser(me);
          }
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    loadUser();
    return () => { cancelled = true; };
  }, []);

  const [activeLabs, setActiveLabs] = useState<ActiveLabInstance[]>([]);
  const [activeLabsLoading, setActiveLabsLoading] = useState(true);

  const [labActivity, setLabActivity] = useState<ActivityEvent[]>([]);
  const [labActivityLoading, setLabActivityLoading] = useState(true);

  const [userStats, setUserStats] = useState<UserLabStats | null>(null);

  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [globalActivity, setGlobalActivity] = useState<GlobalActivityEvent[]>([]);
  const [globalActivityLoading, setGlobalActivityLoading] = useState(true);

  const [beginnerLabs, setBeginnerLabs] = useState<any[]>([]);
  const [beginnerLabsLoading, setBeginnerLabsLoading] = useState(true);

  const { userMetrics, feed, leaderboard } = useDashboard();

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [
          labs,
          activity,
          stats,
          coursesData,
          globalActivityData,
          allLabs,
        ] = await Promise.allSettled([
          fetchApi("/dashboard/active-labs"),
          fetchApi("/dashboard/activity"),
          fetchApi("/dashboard/user-stats"),
          fetchApi("/courses"),
          fetchApi("/dashboard/global-activity"),
          fetchApi("/labs"),
        ]);

        if (labs.status === "fulfilled" && !cancelled) setActiveLabs(labs.value as ActiveLabInstance[]);
        if (activity.status === "fulfilled" && !cancelled) setLabActivity(activity.value as ActivityEvent[]);
        if (stats.status === "fulfilled" && !cancelled) setUserStats(stats.value as UserLabStats);
        if (globalActivityData.status === "fulfilled" && !cancelled) setGlobalActivity(globalActivityData.value as GlobalActivityEvent[]);

        if (allLabs.status === "fulfilled" && !cancelled) {
          const xp = userMetrics?.xp || parseInt(localStorage.getItem("xp") || "0");
          const lvl = getLevel(xp);
          const labList = allLabs.value as any[];
          const beginner = labList.filter((l: any) => {
            const diff = l.difficulty || 1200;
            return diff <= 1100 || lvl >= 4;
          }).slice(0, 4);
          setBeginnerLabs(beginner);
        }

        if (coursesData.status === "fulfilled" && !cancelled) {
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
        if (!cancelled) {
          setActiveLabsLoading(false);
          setLabActivityLoading(false);
          setCoursesLoading(false);
          setGlobalActivityLoading(false);
          setBeginnerLabsLoading(false);
        }
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (userMetrics?.xp != null) {
      localStorage.setItem("xp", String(userMetrics.xp));
    }
  }, [userMetrics?.xp]);

  if (!hydrated) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return <DashboardSkeleton />;
  }

  const greeting = `Welcome back, ${user.name || user.email.split("@")[0]}`;

  const coursesInProgress = courses.filter((c) => c.progress && (c.progress.completed > 0 || c.progress.started > 0));

  function formatActivityType(type: string): { label: string; color: string; icon: typeof Play; dotColor: string } {
    switch (type) {
      case "LAB_STARTED":
        return { label: "Lab Started", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Rocket, dotColor: "bg-blue-400" };
      case "LAB_STOPPED":
        return { label: "Lab Stopped", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: FlaskConical, dotColor: "bg-orange-400" };
      case "FLAG_SOLVED":
        return { label: "Flag Captured", color: "bg-[#229C62]/20 text-[#229C62]/60 border-[#229C62]/30", icon: Flag, dotColor: "bg-[#229C62]/60" };
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
      "bg-blue-600", "bg-violet-600", "bg-[#229C62]", "bg-amber-600",
      "bg-rose-600", "bg-cyan-600", "bg-indigo-600", "bg-pink-600",
    ];
    return colors[hash % colors.length];
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{greeting}</h1>
        </div>
        {user.currentStreak != null && user.currentStreak > 0 && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full px-4 py-2 self-start">
            <Flame size={18} className="text-orange-500" />
            <div className="text-right">
              <p className="text-sm font-bold text-amber-700">{user.currentStreak} day streak</p>
              {user.longestStreak != null && user.longestStreak > user.currentStreak && (
                <p className="text-[10px] text-amber-500">Best: {user.longestStreak} days</p>
              )}
            </div>
          </div>
        )}
      </div>

      <StatsGrid
        xp={userMetrics?.xp || 0}
        rank={userMetrics?.rank || 1200}
        division={userMetrics?.division || "BRONZE"}
        clearance={userMetrics?.clearance || "STUDENT_L1"}
      />

      {/* XP Progress + Next Unlock */}
      {(() => {
        const xp = userMetrics?.xp || 0;
        const level = getLevel(xp);
        const progress = getLevelProgress(xp);
        const nextUnlock = getNextLabUnlock(level);

        return (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E9F8EE] flex items-center justify-center">
                  <Star size={16} className="text-[#229C62]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Level {level}</p>
                  <p className="text-[11px] text-slate-500">{xp} total XP</p>
                </div>
              </div>
              {nextUnlock && (
                <div className="text-right">
                  <p className="text-[11px] text-slate-500">Next lab unlock</p>
                  <p className="text-sm font-semibold text-[#229C62]">Level {nextUnlock.requiredLevel}</p>
                </div>
              )}
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#229C62] to-[#229C62] rounded-full transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            {nextUnlock && (
              <p className="text-[11px] text-slate-400 mt-1.5">
                {nextUnlock.xpNeeded} XP to unlock Level {nextUnlock.requiredLevel} labs
              </p>
            )}
          </div>
        );
      })()}

      {/* Daily Missions */}
      <DailyMissions />

      {/* Start Here — Beginner Labs */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Start Here</h3>
              <span className="text-[10px] font-medium text-[#0F203A] bg-[#E9F8EE] px-2 py-0.5 rounded-full">Beginner</span>
            </div>
            <Link
              href="/dashboard/labs"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {beginnerLabsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-blue-500 animate-spin" />
            </div>
          ) : beginnerLabs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FlaskConical size={24} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 mb-1">No beginner labs available yet</p>
              <p className="text-xs text-slate-400 mb-4">Complete lessons to unlock more labs</p>
              <Link
                href="/dashboard/courses"
                className="text-xs py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Start a Course <ArrowRight size={14} className="inline ml-1" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {beginnerLabs.map((lab: any) => (
                <Link
                  key={lab.id}
                  href={`/dashboard/labs/${lab.id}`}
                  className="group p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-[#229C62]/30 hover:bg-[#E9F8EE]/50 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#E9F8EE] border border-[#229C62]/20 flex items-center justify-center shrink-0 group-hover:bg-[#229C62]/30 transition-colors">
                      <FlaskConical size={16} className="text-[#229C62]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate group-hover:text-[#0F203A] transition-colors">
                        {lab.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium text-[#0F203A] bg-[#E9F8EE] px-1.5 py-0.5 rounded">
                          {lab.difficulty <= 900 ? "EASY" : lab.difficulty <= 1100 ? "BEGINNER" : "INTERMEDIATE"}
                        </span>
                        {lab.estimatedMinutes && (
                          <span className="text-[10px] text-slate-400">~{lab.estimatedMinutes}m</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-[#229C62] font-medium group-hover:underline flex items-center gap-1">
                      Launch lab <ChevronRight size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Labs */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Active Labs</h3>
            <div className="flex items-center gap-3">
              {userStats?.activeSessions ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                  <Circle size={6} className="fill-slate-500 text-slate-500 animate-pulse" />
                  {userStats.activeSessions} online
                </div>
              ) : (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">0 active</span>
              )}
              <Link
                href="/dashboard/labs"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {activeLabsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-blue-500 animate-spin" />
            </div>
          ) : activeLabs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FlaskConical size={24} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 mb-1">No active labs</p>
              <p className="text-xs text-slate-400 mb-4">Start a lab to begin hands-on practice</p>
              <Link
                href="/dashboard/labs"
                className="text-xs py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
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
                  className="group relative p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <FlaskConical size={16} className="text-blue-600" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-slate-500 border-2 border-white animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {instance.lab.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          LVL {instance.lab.difficulty}
                        </span>
                        {instance.port && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            :{instance.port}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md group-hover:bg-blue-100 transition-all">
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

      {/* Courses in Progress */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Courses in Progress</h3>
            <Link
              href="/dashboard/courses"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {coursesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-blue-500 animate-spin" />
            </div>
          ) : coursesInProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BookOpen size={24} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 mb-1">No courses in progress</p>
              <p className="text-xs text-slate-400 mb-4">Start a course to track your progress</p>
              <Link
                href="/dashboard/courses"
                className="text-xs py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
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
                    className="group relative rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 overflow-hidden transition-all duration-200"
                  >
                    <div className="h-20 bg-gradient-to-br from-blue-50 via-violet-50 to-white relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                      <div className="absolute bottom-2 left-3 right-3">
                        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {course.title}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 pt-0 flex items-center gap-3">
                      <div className="relative shrink-0">
                        <svg width="44" height="44" viewBox="0 0 44 44" className="rotate-[-90deg]">
                          <circle cx="22" cy="22" r={radius} fill="none" stroke="rgb(226 232 240)" strokeWidth="3" />
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
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-600">
                          {pct}%
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500">
                          {course.progress?.completed || 0} / {course.progress?.total || 0} lessons
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{course.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lab Activity */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Lab Activity</h3>
          </div>

          {labActivityLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-blue-500 animate-spin" />
            </div>
          ) : labActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Zap size={24} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No lab activity yet</p>
            </div>
          ) : (
            <div className="relative max-h-[320px] overflow-y-auto pr-1">
              <div className="absolute left-[18px] top-0 bottom-0 w-px bg-slate-200" />
              <div className="space-y-1">
                {labActivity.map((event) => {
                  const { dotColor, icon: Icon } = formatActivityType(event.type);
                  return (
                    <div key={event.id} className="relative flex items-start gap-3 py-2.5 group">
                      <div className="relative z-10 shrink-0 mt-1">
                        <div className={`w-3 h-3 rounded-full ${dotColor} ring-2 ring-white`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-700 leading-snug group-hover:text-slate-900 transition-colors">
                            {formatActivityMessage(event)}
                          </p>
                          <Icon size={12} className="text-slate-400 shrink-0" />
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
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

      {/* Global Activity */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Global Activity</h3>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
              <Circle size={6} className="fill-slate-500 text-slate-500 animate-pulse" />
              Live
            </span>
          </div>

          {globalActivityLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-blue-500 animate-spin" />
            </div>
          ) : globalActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Clock size={24} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No recent activity</p>
            </div>
          ) : (
            <div className="relative max-h-[320px] overflow-y-auto pr-1">
              <div className="absolute left-[18px] top-0 bottom-0 w-px bg-slate-200" />
              <div className="space-y-1">
                {globalActivity.map((event) => {
                  const { dotColor } = formatActivityType(event.type);
                  const userName = event.user?.name || event.user?.email.split("@")[0] || "Someone";
                  return (
                    <div key={event.id} className="relative flex items-start gap-3 py-2.5 group">
                      <div className="relative z-10 shrink-0 mt-1">
                        <div className={`w-3 h-3 rounded-full ${dotColor} ring-2 ring-white`} />
                      </div>
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
                        <p className="text-sm text-slate-700 leading-snug group-hover:text-slate-900 transition-colors">
                          <span className="font-medium text-slate-900">{userName}</span>{" "}
                          {formatActivityMessage(event).toLowerCase()}
                        </p>
                        <span className="text-[11px] text-slate-400 font-mono">
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

    </div>
  );
}
