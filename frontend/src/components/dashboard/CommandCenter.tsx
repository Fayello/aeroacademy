"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useDashboard } from "@/hooks/useDashboard";
import { useDisplayMode } from "@/lib/displayMode";
import { getLevel, getLevelProgress } from "@/lib/levelGating";
import {
  Loader2,
  FlaskConical,
  BookOpen,
  Play,
  Clock,
  ChevronRight,
  Flame,
  TrendingUp,
  Target,
  Award,
  Check,
  Circle,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { DomainBar } from "@/components/ui/DomainVisual";

interface User {
  id: string;
  email: string;
  name?: string;
  currentStreak?: number;
  longestStreak?: number;
}

interface ActiveLab {
  id: string;
  labId: string;
  status: string;
  lab: { id: string; title: string; difficulty: number };
  port: number | null;
}

interface CompetencyData {
  summary: {
    totalOutcomes: number;
    completedOutcomes: number;
    fadingCount: number;
    totalLabsCompleted: number;
  };
  domains: {
    domainId: string;
    domainName: string;
    domainDisplayName: string;
    score: number;
  }[];
  recommendations: {
    type: string;
    title: string;
    description: string;
    link?: string;
    priority: string;
  }[];
}

interface AcademicData {
  cohortName: string;
  nextDeadline?: { title: string; dueDate: string; type: string };
  courses: { id: string; title: string; weight: number }[];
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function CommandCenter() {
  const [user, setUser] = useState<User | null>(null);
  const [activeLabs, setActiveLabs] = useState<ActiveLab[]>([]);
  const [competency, setCompetency] = useState<CompetencyData | null>(null);
  const [academic, setAcademic] = useState<AcademicData | null>(null);
  const [weeklyItems, setWeeklyItems] = useState<{ title: string; done: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const { config } = useDisplayMode();
  const { userMetrics } = useDashboard();

  const xp = userMetrics?.xp || 0;
  const level = getLevel(xp);
  const progress = getLevelProgress(xp);
  const streak = userMetrics?.streak || 0;
  const division = userMetrics?.division || "Bronze";
  const clearance = userMetrics?.clearance || "Level 1";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));

        const userId = JSON.parse(storedUser || "{}").id;
        if (!userId) return;

        const [labsData, compData, acadData] = await Promise.allSettled([
          fetchApi<ActiveLab[]>("/dashboard/active-labs"),
          fetchApi<CompetencyData>(`/learning-outcomes/competency-profile/${userId}/enhanced`),
          fetchApi<any>("/academic/my-courses").then((courses) => {
            if (!courses || courses.length === 0) return null;
            const cohortName = courses[0]?.cohortName || "My Cohort";
            return {
              cohortName,
              courses: courses.map((c: any) => ({ id: c.id, title: c.title, weight: c.weight })),
            };
          }),
        ]);

        if (!cancelled) {
          if (labsData.status === "fulfilled") setActiveLabs(labsData.value);
          if (compData.status === "fulfilled") setCompetency(compData.value);
          if (acadData.status === "fulfilled" && acadData.value) setAcademic(acadData.value);

          // Build weekly items from labs + recommendations
          const recs = compData.status === "fulfilled" ? compData.value?.recommendations || [] : [];
          const weekly: { title: string; done: boolean }[] = [];

          // Active labs count as "in progress" items
          if (labsData.status === "fulfilled") {
            for (const lab of labsData.value.slice(0, 2)) {
              weekly.push({ title: lab.lab.title, done: false });
            }
          }

          // Top recommendations as "to do" items
          for (const rec of recs.slice(0, 3)) {
            weekly.push({ title: rec.title, done: false });
          }

          setWeeklyItems(weekly.slice(0, 4));
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#229C62]" size={32} />
      </div>
    );
  }

  const userName = user?.name || user?.email?.split("@")[0] || "Engineer";
  const firstName = userName.split(" ")[0];
  const domains = competency?.domains || [];
  const topRecs = competency?.recommendations?.slice(0, 3) || [];
  const nextObjective = activeLabs[0] || topRecs[0] || null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ─── GREETING + NEXT OBJECTIVE ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F203A] via-[#1a3a5c] to-[#229C62] p-8 text-white">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#7AD62A] blur-3xl" />
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative z-10">
          <p className="text-white/60 text-sm font-medium tracking-wider uppercase">
            {getTimeGreeting()}, {firstName}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            What&apos;s your next move?
          </h1>

          {/* Next Objective */}
          {nextObjective && (
            <div className="mt-5 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <p className="text-xs text-white/50 uppercase tracking-wide font-medium mb-2">Your next objective</p>
              {activeLabs[0] ? (
                <Link
                  href={`/dashboard/labs/${activeLabs[0].labId}`}
                  className="group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#229C62] flex items-center justify-center">
                      <FlaskConical size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-[#7AD62A] transition-colors">
                        {activeLabs[0].lab.title}
                      </p>
                      <p className="text-xs text-white/50">
                        Active lab · Difficulty {activeLabs[0].lab.difficulty}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[#7AD62A]">
                    <span className="text-sm font-medium">Continue</span>
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ) : topRecs[0] ? (
                <Link
                  href={topRecs[0].link || "/dashboard/labs"}
                  className="group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Target size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-[#7AD62A] transition-colors">
                        {topRecs[0].title}
                      </p>
                      <p className="text-xs text-white/50">{topRecs[0].description}</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-white/50 group-hover:text-[#7AD62A] group-hover:translate-x-0.5 transition-all" />
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* ─── PROGRESS SUMMARY ─── */}
      {config.showXp && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#E9F8EE] flex items-center justify-center">
                <TrendingUp size={14} className="text-[#229C62]" />
              </div>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Level</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{level}</div>
            <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7AD62A] to-[#229C62] rounded-full transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{xp.toLocaleString()} XP</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <Award size={14} className="text-amber-600" />
              </div>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Season</span>
            </div>
            <div className="text-lg font-bold text-slate-900 truncate">{division}</div>
            <p className="text-[10px] text-slate-400 mt-1">{clearance}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                <Flame size={14} className="text-orange-500" />
              </div>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Streak</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{streak}</div>
            <p className="text-[10px] text-slate-400 mt-1">day{streak !== 1 ? "s" : ""}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <FlaskConical size={14} className="text-blue-600" />
              </div>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Labs Done</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {competency?.summary?.totalLabsCompleted || 0}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {competency?.summary?.completedOutcomes || 0} outcomes
            </p>
          </div>
        </div>
      )}

      {/* ─── THIS WEEK ─── */}
      {weeklyItems.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-[#229C62]" />
            <h2 className="text-sm font-semibold text-slate-900">This Week</h2>
          </div>
          <div className="space-y-2">
            {weeklyItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                {item.done ? (
                  <div className="w-5 h-5 rounded-full bg-[#229C62] flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                ) : (
                  <Circle size={18} className="text-slate-300" />
                )}
                <span className={`text-sm ${item.done ? "text-slate-400 line-through" : "text-slate-700"}`}>
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ENGINEERING PROFILE ─── */}
      {domains.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Engineering Profile</h2>
            <Link
              href="/dashboard/analytics/competency"
              className="text-xs text-[#229C62] hover:text-[#1a7a4d] font-medium flex items-center gap-1"
            >
              Full profile <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {domains.slice(0, 4).map((d) => (
              <DomainBar key={d.domainId} domain={d.domainName} score={d.score} />
            ))}
          </div>
        </div>
      )}

      {/* ─── ACADEMIC (if enrolled) ─── */}
      {academic && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Academic</h2>
            <Link href="/dashboard/academics" className="text-xs text-[#229C62] hover:underline font-medium">
              View grades
            </Link>
          </div>
          <Link
            href="/dashboard/academics"
            className="block p-3 rounded-lg bg-slate-50 hover:bg-[#E9F8EE]/50 transition-colors"
          >
            <p className="text-sm font-medium text-slate-900">{academic.cohortName}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {academic.courses.length} course{academic.courses.length !== 1 ? "s" : ""} assigned
            </p>
          </Link>
        </div>
      )}

      {/* ─── NEXT STEPS ─── */}
      {topRecs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-[#229C62]" />
            <h2 className="text-sm font-semibold text-slate-900">Recommended</h2>
          </div>
          <div className="space-y-2">
            {topRecs.map((rec, i) => (
              <Link
                key={i}
                href={rec.link || "/dashboard/labs"}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-[#E9F8EE]/50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E9F8EE] flex items-center justify-center shrink-0 mt-0.5">
                  {rec.type === "LAB" && <FlaskConical size={14} className="text-[#229C62]" />}
                  {rec.type === "OUTCOME" && <BookOpen size={14} className="text-violet-500" />}
                  {rec.type === "ASSESSMENT" && <Target size={14} className="text-blue-500" />}
                  {rec.type === "MAINTAIN" && <Clock size={14} className="text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 group-hover:text-[#229C62] transition-colors">
                    {rec.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{rec.description}</p>
                </div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-[#229C62] shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── QUICK ACCESS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/dashboard/labs"
          className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-[#229C62]/30 hover:bg-[#E9F8EE]/30 transition-all"
        >
          <FlaskConical size={20} className="text-[#229C62] mb-2" />
          <p className="text-sm font-semibold text-slate-900">Labs</p>
          <p className="text-xs text-slate-500">Hands-on practice</p>
        </Link>
        <Link
          href="/dashboard/courses"
          className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all"
        >
          <BookOpen size={20} className="text-blue-500 mb-2" />
          <p className="text-sm font-semibold text-slate-900">Courses</p>
          <p className="text-xs text-slate-500">Structured learning</p>
        </Link>
        <Link
          href="/dashboard/compete"
          className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all"
        >
          <Target size={20} className="text-amber-500 mb-2" />
          <p className="text-sm font-semibold text-slate-900">Compete</p>
          <p className="text-xs text-slate-500">Challenge yourself</p>
        </Link>
        <Link
          href="/dashboard/analytics/competency"
          className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all"
        >
          <TrendingUp size={20} className="text-purple-500 mb-2" />
          <p className="text-sm font-semibold text-slate-900">Skills</p>
          <p className="text-xs text-slate-500">Your profile</p>
        </Link>
      </div>
    </div>
  );
}
