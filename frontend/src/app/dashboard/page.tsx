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
import { BookOpen, Microscope, Video, Calendar, ArrowRight, TrendingUp, Clock, Award } from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [latestProgress, setLatestProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
        const progress = await fetchApi("/progress/latest");
        setLatestProgress(progress);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IntelligenceCard
          latestProgress={latestProgress || userMetrics?.latestProgress}
          courseProgress={userMetrics?.courseProgress || 0}
        />
        <SandboxCard logs={intelligence?.logs || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaderboardPreview leaderboard={leaderboard} />
        <ActivityFeed feed={feed} />
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
