"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  BookOpen,
  Flag,
  Flame,
  Award,
  Calendar,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";

interface CourseProgress {
  courseId: string;
  title: string;
  total: number;
  completed: number;
  percentage: number;
  enrolledAt: string;
  lastActivityAt: string;
}

interface LearningData {
  user: {
    id: string;
    name: string;
    xp: number;
    currentStreak: number;
    longestStreak: number;
    createdAt: string;
  };
  courseProgress: CourseProgress[];
  stats: {
    totalCoursesEnrolled: number;
    totalLessonsCompleted: number;
    totalFlagsCaptured: number;
    currentStreak: number;
    longestStreak: number;
    daysActive: number;
  };
  weeklyActivity: Record<string, number>;
}

export default function StudentAnalyticsPage() {
  const [data, setData] = useState<LearningData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<LearningData>("/analytics/learning")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0f172a] p-12 text-center">
        <BarChart3 size={32} className="text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Unable to load analytics</p>
      </div>
    );
  }

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekDays: { label: string; count: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - dayOfWeek + i);
    const key = d.toISOString().split("T")[0];
    weekDays.push({ label: days[i], count: data.weeklyActivity[key] || 0 });
  }
  const maxActivity = Math.max(1, ...weekDays.map((d) => d.count));

  const completedCourses = data.courseProgress.filter((c) => c.percentage === 100);
  const inProgressCourses = data.courseProgress.filter((c) => c.percentage < 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title="Learning Analytics" description="Your progress and activity overview" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="angular-card bg-[#0f172a] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <BookOpen size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{data.stats.totalLessonsCompleted}</p>
              <p className="text-[11px] text-slate-500">Lessons Done</p>
            </div>
          </div>
        </div>
        <div className="angular-card bg-[#0f172a] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center">
              <Flag size={18} className="text-[#7AD62A]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{data.stats.totalFlagsCaptured}</p>
              <p className="text-[11px] text-slate-500">Flags Captured</p>
            </div>
          </div>
        </div>
        <div className="angular-card bg-[#0f172a] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Flame size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{data.stats.currentStreak}</p>
              <p className="text-[11px] text-slate-500">Day Streak</p>
            </div>
          </div>
        </div>
        <div className="angular-card bg-[#0f172a] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Award size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{data.stats.totalCoursesEnrolled}</p>
              <p className="text-[11px] text-slate-500">Courses Enrolled</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="angular-card bg-[#0f172a] p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" /> Weekly Activity
          </h2>
          <div className="flex items-end gap-2 h-32">
            {weekDays.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: "100px" }}>
                  <div
                    className="w-full max-w-[28px] bg-blue-500 rounded-t-md transition-all"
                    style={{ height: `${d.count > 0 ? Math.max(8, (d.count / maxActivity) * 100) : 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{d.label}</span>
                {d.count > 0 && <span className="text-[9px] font-medium text-slate-600">{d.count}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="angular-card bg-[#0f172a] p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#7AD62A]" /> Streak History
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Current Streak</span>
              <span className="text-lg font-bold text-amber-600">{data.stats.currentStreak} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Longest Streak</span>
              <span className="text-lg font-bold text-[#7AD62A]">{data.stats.longestStreak} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total XP</span>
              <span className="text-lg font-bold text-blue-600">{data.user.xp.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Member Since</span>
              <span className="text-sm font-medium text-slate-700">
                {new Date(data.user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Days Active</span>
              <span className="text-sm font-medium text-slate-700">{data.stats.daysActive || 1} days</span>
            </div>
          </div>
        </div>
      </div>

      {completedCourses.length > 0 && (
        <div className="angular-card bg-[#0f172a] p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Completed Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completedCourses.map((c) => (
              <Link
                key={c.courseId}
                href={"/dashboard/courses/" + c.courseId}
                className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 hover:shadow-sm transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-[#7AD62A]/10 flex items-center justify-center">
                  <Award size={14} className="text-[#7AD62A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.title}</p>
                  <p className="text-[11px] text-[#7AD62A]">{c.completed}/{c.total} lessons</p>
                </div>
                <ArrowRight size={14} className="text-[#7AD62A] flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {inProgressCourses.length > 0 && (
        <div className="angular-card bg-[#0f172a] p-6">
          <h2 className="text-sm font-semibold text-white mb-4">In Progress</h2>
          <div className="space-y-3">
            {inProgressCourses.map((c) => (
              <Link
                key={c.courseId}
                href={"/dashboard/courses/" + c.courseId}
                className="flex items-center gap-4 p-3 rounded-lg border border-white/10 hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{c.title}</p>
                  <p className="text-[11px] text-slate-500">{c.completed}/{c.total} lessons completed</p>
                </div>
                <div className="w-24">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: c.percentage + "%" }} />
                  </div>
                  <p className="text-[10px] text-slate-400 text-right mt-1">{c.percentage}%</p>
                </div>
                <ArrowRight size={14} className="text-slate-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {data.courseProgress.length === 0 && (
        <div className="angular-card bg-[#0f172a] p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-blue-600" />
          </div>
          <h2 className="text-sm font-semibold text-white mb-1">Your journey starts here</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">Enroll in a course to start tracking your progress across domains.</p>
          <Link href="/dashboard/courses" className="btn-primary text-xs inline-flex items-center gap-1.5">
            <BookOpen size={14} /> Browse Courses
          </Link>
        </div>
      )}
    </div>
  );
}
