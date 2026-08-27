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
  Terminal,
  Trophy,
  Flame,
  TrendingUp,
  Target,
  Award,
  Check,
  Circle,
  ArrowRight,
  Calendar,
  Sparkles,
  Rocket,
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

function ProgressRing({ progress, size = 80, stroke = 6 }: { progress: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="url(#progressGradient)" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7AD62A" />
          <stop offset="100%" stopColor="#229C62" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function CommandCenter() {
  const [user, setUser] = useState<User | null>(null);
  const [activeLabs, setActiveLabs] = useState<ActiveLab[]>([]);
  const [competency, setCompetency] = useState<CompetencyData | null>(null);
  const [academic, setAcademic] = useState<AcademicData | null>(null);
  const [weeklyItems, setWeeklyItems] = useState<{ title: string; done: boolean }[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<{ title: string; description: string; priority: string; type: string }[]>([]);
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
    // Safety timeout — never spin longer than 16s even if APIs hang
    const safety = setTimeout(() => { if (!cancelled) setLoading(false); }, 16000);
    async function load() {
      try {
        let storedUser = localStorage.getItem("user");
        let parsed: any = null;
        try { parsed = storedUser ? JSON.parse(storedUser) : null; } catch { parsed = null; }
        // Fallback: try to fetch user if not in localStorage
        if (!parsed?.id) {
          try {
            const me = await fetchApi<{ id: string; email: string; name?: string }>("/auth/me");
            if (me?.id) {
              parsed = me;
              localStorage.setItem("user", JSON.stringify(me));
            }
          } catch { /* keep parsed as is */ }
        }
        if (parsed) setUser(parsed);
        const userId = parsed?.id;
        if (!userId) {
          if (!cancelled) setLoading(false);
          return;
        }

        const [labsData, compData, acadData, aiRecs] = await Promise.allSettled([
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
          fetchApi<any>("/ai/recommendations"),
        ]);

        if (!cancelled) {
          if (labsData.status === "fulfilled" && Array.isArray(labsData.value)) setActiveLabs(labsData.value);
          if (compData.status === "fulfilled" && compData.value) setCompetency(compData.value);
          if (acadData.status === "fulfilled" && acadData.value) setAcademic(acadData.value);
          if (aiRecs.status === "fulfilled" && aiRecs.value?.recommendations) {
            setAiRecommendations(aiRecs.value.recommendations);
          }

          const recs = compData.status === "fulfilled" ? (compData.value as any)?.recommendations || [] : [];
          const weekly: { title: string; done: boolean }[] = [];
          if (labsData.status === "fulfilled" && Array.isArray(labsData.value)) {
            for (const lab of (labsData.value as ActiveLab[]).slice(0, 2)) {
              weekly.push({ title: lab.lab.title, done: false });
            }
          }
          for (const rec of (recs as any[]).slice(0, 3)) {
            weekly.push({ title: rec.title, done: false });
          }
          setWeeklyItems(weekly.slice(0, 4));
        }
      } catch {
        // silent
      } finally {
        clearTimeout(safety);
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; clearTimeout(safety); };
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
  const topRecs = aiRecommendations.length > 0
    ? aiRecommendations.map(r => ({ ...r, link: r.type === 'lab' ? '/dashboard/labs' : r.type === 'course' ? '/dashboard/courses' : '/dashboard/assessments' }))
    : competency?.recommendations?.slice(0, 3) || [];
  const nextObjective = activeLabs[0] || topRecs[0] || null;
  const isNewUser = (userMetrics?.xp ?? 0) === 0 && activeLabs.length === 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ─── GREETING ─── */}
      <div className="animate-fade-in-up">
        <p className="text-slate-500 text-sm font-medium">
          {getTimeGreeting()}, <span className="text-slate-900">{firstName}</span>
        </p>
      </div>

      {/* ─── LARGE PRODUCT CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/courses"
          className="angular-card relative overflow-hidden p-6 group hover-lift hover-glow transition-all duration-300 animate-fade-in-up animate-delay-1"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-lg shadow-blue-500/20">
              <BookOpen size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-[#229C62] transition-colors">Academy</h3>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">Structured courses from fundamentals to advanced security operations</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#229C62]">
              Explore courses <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>

        <Link
          href="/dashboard/labs"
          className="angular-card relative overflow-hidden p-6 group hover-lift hover-glow transition-all duration-300 animate-fade-in-up animate-delay-2"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-lg shadow-emerald-500/20">
              <Terminal size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-[#229C62] transition-colors">Labs</h3>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">Hands-on labs with real Docker environments and live sandboxes</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#229C62]">
              Launch a lab <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>

        <Link
          href="/dashboard/leaderboard"
          className="angular-card relative overflow-hidden p-6 group hover-lift hover-glow transition-all duration-300 animate-fade-in-up animate-delay-3"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-lg shadow-amber-500/20">
              <Trophy size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-[#229C62] transition-colors">Compete</h3>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">Leaderboard, challenges, and team competitions</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#229C62]">
              View rankings <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>
      </div>

      {/* ─── DON'T KNOW WHERE TO START? ─── */}
      {isNewUser && (
        <div className="angular-card bg-gradient-to-r from-[#0F203A] to-[#1a3a5c] p-6 text-white animate-fade-in-up animate-delay-2">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#7AD62A]/20 flex items-center justify-center shrink-0">
              <Rocket size={22} className="text-[#7AD62A]" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold mb-1">Don&apos;t know where to start?</h3>
              <p className="text-sm text-white/60 mb-4">
                We recommend starting with a beginner lab to get hands-on experience right away.
              </p>
              <Link
                href="/dashboard/labs"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#229C62] hover:bg-[#1d8a56] text-white text-sm font-semibold transition-colors"
              >
                <Play size={14} />
                Start your first lab
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── NEXT OBJECTIVE (if active) ─── */}
      {!isNewUser && nextObjective && (
        <div className="angular-card bg-gradient-to-br from-[#0F203A] via-[#1a3a5c] to-[#229C62] p-5 sm:p-6 text-white relative overflow-hidden animate-fade-in-up animate-delay-2">
          <div className="absolute inset-0 angular-grid-bg opacity-[0.04] pointer-events-none" />
          <div className="relative z-10">
            <p className="text-xs text-white/50 uppercase tracking-wide font-medium mb-3">Continue where you left off</p>
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
        </div>
      )}

      {/* ─── PROGRESS RING + STATS ─── */}
      {config.showXp && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="angular-card bg-white p-4 hover-lift transition-all duration-300 animate-fade-in-up animate-delay-1 flex flex-col items-center text-center">
            <div className="relative mb-2">
              <ProgressRing progress={progress} size={72} stroke={5} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-slate-900">{level}</span>
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Level</span>
            <p className="text-[10px] text-slate-400 mt-0.5">{xp.toLocaleString()} XP</p>
          </div>

          <div className="angular-card bg-white p-4 hover-lift transition-all duration-300 animate-fade-in-up animate-delay-2 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
              <Award size={20} className="text-amber-600" />
            </div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Season</span>
            <p className="text-sm font-bold text-slate-900 mt-1">{division}</p>
            <p className="text-[10px] text-slate-400">{clearance}</p>
          </div>

          <div className="angular-card bg-white p-4 hover-lift transition-all duration-300 animate-fade-in-up animate-delay-3 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-2">
              <Flame size={20} className="text-orange-500" />
            </div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Streak</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{streak}</p>
            <p className="text-[10px] text-slate-400">day{streak !== 1 ? "s" : ""}</p>
          </div>

          <div className="angular-card bg-white p-4 hover-lift transition-all duration-300 animate-fade-in-up animate-delay-4 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
              <FlaskConical size={20} className="text-blue-600" />
            </div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Labs Done</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {competency?.summary?.totalLabsCompleted || 0}
            </p>
            <p className="text-[10px] text-slate-400">
              {competency?.summary?.completedOutcomes || 0} outcomes
            </p>
          </div>
        </div>
      )}

      {/* ─── THIS WEEK ─── */}
      {weeklyItems.length > 0 && (
        <div className="angular-card bg-white p-5 animate-fade-in-up animate-delay-3">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-[#229C62]" />
            <h2 className="text-sm font-semibold text-slate-900">This Week</h2>
          </div>
          <div className="space-y-2">
            {weeklyItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-[#E9F8EE]/50 transition-colors">
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
        <div className="angular-card bg-white p-5 animate-fade-in-up animate-delay-4">
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
        <div className="angular-card bg-white p-5 animate-fade-in-up animate-delay-5">
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

      {/* ─── RECOMMENDED ─── */}
      {topRecs.length > 0 && (
        <div className="angular-card bg-white p-5 animate-fade-in-up animate-delay-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-[#229C62]" />
            <h2 className="text-sm font-semibold text-slate-900">Recommended for you</h2>
          </div>
          <div className="space-y-2">
            {topRecs.map((rec, i) => (
              <Link
                key={i}
                href={rec.link || "/dashboard/labs"}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-[#E9F8EE]/50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E9F8EE] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
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
                <ArrowRight size={14} className="text-slate-300 group-hover:text-[#229C62] shrink-0 mt-1 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
