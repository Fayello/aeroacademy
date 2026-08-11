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
  Microscope,
  Video,
  ArrowRight,
  TrendingUp,
  Clock,
  Award,
  Play,
  ExternalLink,
  Loader2,
  Rocket,
  Target,
  Zap,
  FlaskConical,
  Flag,
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

  function formatActivityType(type: string): { label: string; color: string; icon: typeof Play } {
    switch (type) {
      case "LAB_STARTED":
        return { label: "Lab Started", color: "bg-blue-500", icon: Rocket };
      case "LAB_STOPPED":
        return { label: "Lab Stopped", color: "bg-orange-500", icon: FlaskConical };
      case "FLAG_SOLVED":
        return { label: "Flag Captured", color: "bg-emerald-500", icon: Flag };
      case "LESSON_COMPLETED":
        return { label: "Lesson Done", color: "bg-violet-500", icon: BookOpen };
      case "QUIZ_PASSED":
        return { label: "Quiz Passed", color: "bg-amber-500", icon: Target };
      default:
        return { label: type, color: "bg-slate-400", icon: Zap };
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Award size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{greeting}</h1>
              <p className="text-emerald-100 text-sm">Continue your learning journey</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <TrendingUp size={16} className="text-emerald-200" />
              <span className="text-sm font-medium">{userMetrics?.xp || 0} XP Earned</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <Clock size={16} className="text-emerald-200" />
              <span className="text-sm font-medium">Rank #{userMetrics?.rank || 1200}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <Award size={16} className="text-emerald-200" />
              <span className="text-sm font-medium">{userMetrics?.division || "BRONZE"}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <Flag size={16} className="text-emerald-200" />
              <span className="text-sm font-medium">{userStats?.flagsSolved || 0} Flags</span>
            </div>
          </div>
        </div>
      </div>

      <OnboardingCard />

      <StatsGrid
        xp={userMetrics?.xp || 0}
        rank={userMetrics?.rank || 1200}
        division={userMetrics?.division || "BRONZE"}
        clearance={userMetrics?.clearance || "STUDENT_L1"}
        loading={loading}
      />

      {/* Active Labs Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <FlaskConical size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Active Labs</h3>
              <p className="text-xs text-slate-500">Your running lab instances</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {userStats?.activeSessions || 0} active
            </div>
            <Link href="/dashboard/labs" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {activeLabsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="text-emerald-600 animate-spin" />
          </div>
        ) : activeLabs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FlaskConical size={24} className="text-slate-300 mb-2" />
            <p className="text-sm text-slate-500 mb-1">No active labs</p>
            <p className="text-xs text-slate-400 mb-4">Start a lab to begin hands-on practice</p>
            <Link href="/dashboard/labs" className="btn-primary text-xs py-1.5 px-3">
              Browse Labs <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeLabs.map((instance) => (
              <Link
                key={instance.id}
                href={`/dashboard/labs/${instance.labId}`}
                className="group flex items-start gap-3 p-4 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors">
                  <FlaskConical size={16} className="text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {instance.lab.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">
                      Difficulty: {instance.lab.difficulty}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-xs text-emerald-600 font-medium">Running</span>
                  </div>
                  {instance.port && (
                    <p className="text-xs text-slate-400 mt-1">Port {instance.port}</p>
                  )}
                </div>
                <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors shrink-0 mt-0.5" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Continue Learning Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Play size={16} className="text-emerald-600" fill="currentColor" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Continue Learning</h3>
              <p className="text-xs text-slate-500">Pick up where you left off</p>
            </div>
          </div>
          <Link href="/dashboard/courses" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {coursesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="text-emerald-600 animate-spin" />
          </div>
        ) : coursesInProgress.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <BookOpen size={24} className="text-slate-300 mb-2" />
            <p className="text-sm text-slate-500 mb-1">No courses in progress</p>
            <p className="text-xs text-slate-400 mb-4">Start a course to track your progress</p>
            <Link href="/dashboard/courses" className="btn-primary text-xs py-1.5 px-3">
              Browse Courses <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {coursesInProgress.slice(0, 6).map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className="group p-4 rounded-lg border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all duration-200"
              >
                <p className="text-sm font-medium text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                  {course.title}
                </p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {course.description}
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{course.progress?.completed || 0} of {course.progress?.total || 0} lessons</span>
                    <span className="font-medium text-emerald-600">{course.progress?.percentage || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${course.progress?.percentage || 0}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IntelligenceCard
          latestProgress={latestProgress || userMetrics?.latestProgress}
          courseProgress={userMetrics?.courseProgress || 0}
        />
        <SandboxCard logs={intelligence?.logs || []} />
      </div>

      {/* Lab Activity Feed */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
              <Zap size={16} className="text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Lab Activity</h3>
              <p className="text-xs text-slate-500">Your recent lab sessions</p>
            </div>
          </div>
        </div>

        {labActivityLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="text-emerald-600 animate-spin" />
          </div>
        ) : labActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Zap size={24} className="text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No lab activity yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {labActivity.map((event) => {
              const { color, icon: Icon } = formatActivityType(event.type);
              return (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 leading-snug">{formatActivityMessage(event)}</p>
                    <span className="text-xs text-slate-400">
                      {new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <Icon size={14} className="text-slate-300 shrink-0 mt-0.5" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaderboardPreview leaderboard={leaderboard} />
        <ActivityFeed feed={feed} />
      </div>

      {/* Global Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock size={16} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-500">Global platform activity</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        {globalActivityLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="text-emerald-600 animate-spin" />
          </div>
        ) : globalActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Clock size={24} className="text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {globalActivity.map((event) => {
              const { color } = formatActivityType(event.type);
              return (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 leading-snug">
                      {event.user?.name || event.user?.email.split("@")[0] || "Someone"}{" "}
                      {formatActivityMessage(event).toLowerCase()}
                    </p>
                    <span className="text-xs text-slate-400">
                      {new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/courses" className="group relative overflow-hidden rounded-xl bg-white border border-slate-200 p-6 hover:shadow-lg hover:border-emerald-300 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-300">
                <BookOpen size={20} className="text-emerald-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Courses</h3>
                <p className="text-sm text-slate-500">Continue learning</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link href="/dashboard/labs" className="group relative overflow-hidden rounded-xl bg-white border border-slate-200 p-6 hover:shadow-lg hover:border-emerald-300 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-600 transition-colors duration-300">
                <Microscope size={20} className="text-violet-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors">Labs</h3>
                <p className="text-sm text-slate-500">Hands-on practice</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link href="/dashboard/master-classes" className="group relative overflow-hidden rounded-xl bg-white border border-slate-200 p-6 hover:shadow-lg hover:border-emerald-300 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-600 transition-colors duration-300">
                <Video size={20} className="text-amber-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">Master Classes</h3>
                <p className="text-sm text-slate-500">Live sessions</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>
    </div>
  );
}
