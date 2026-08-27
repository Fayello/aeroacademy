"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useDashboard } from "@/hooks/useDashboard";
import { useNavigation } from "@/lib/navigation";
import {
  FlaskConical,
  BookOpen,
  Clock,
  ChevronRight,
  Terminal,
  Trophy,
  Target,
  Award,
  Check,
  Circle,
  ArrowRight,
  Calendar,
  Sparkles,
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
  const [user, setUser] = useState<User | null>(() => {
    try {
      const s = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [activeLabs, setActiveLabs] = useState<ActiveLab[]>([]);
  const [competency, setCompetency] = useState<CompetencyData | null>(null);
  const [academic, setAcademic] = useState<AcademicData | null>(null);
  const [weeklyItems, setWeeklyItems] = useState<{ title: string; done: boolean }[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<{ title: string; description: string; priority: string; type: string }[]>([]);
  const [labsLoading, setLabsLoading] = useState(true);
  const [compLoading, setCompLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);
  const { userMetrics } = useDashboard();
  const { nav } = useNavigation();

  const xp = userMetrics?.xp || 0;

  useEffect(() => {
    let cancelled = false;

    async function ensureUser(): Promise<string | null> {
      // user already set from localStorage initializer; fallback to /auth/me if missing
      let parsed: any = null;
      try {
        const s = localStorage.getItem("user");
        parsed = s ? JSON.parse(s) : null;
      } catch { parsed = null; }
      if (parsed?.id) {
        if (!cancelled) setUser(parsed);
        return parsed.id as string;
      }
      try {
        const me = await fetchApi<{ id: string; email: string; name?: string }>("/auth/me");
        if (me?.id) {
          localStorage.setItem("user", JSON.stringify(me));
          if (!cancelled) setUser(me as any);
          return me.id;
        }
      } catch { /* ignore */ }
      return null;
    }

    async function load() {
      const userId = await ensureUser();
      if (!userId) {
        if (!cancelled) { setLabsLoading(false); setCompLoading(false); setAiLoading(false); }
        return;
      }

      // Fire each request independently so the fastest renders first.
      // Active labs — usually fast (<200ms)
      fetchApi<ActiveLab[]>("/dashboard/active-labs")
        .then((data) => { if (!cancelled && Array.isArray(data)) setActiveLabs(data); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLabsLoading(false); });

      // Academic — fast
      fetchApi<any>("/academic/my-courses")
        .then((courses) => {
          if (!courses || courses.length === 0) return;
          const cohortName = courses[0]?.cohortName || "My Cohort";
          if (!cancelled) setAcademic({ cohortName, courses: courses.map((c: any) => ({ id: c.id, title: c.title, weight: c.weight })) });
        })
        .catch(() => {});

      // Competency — heavy (DB heavy). Derive weekly items after it resolves.
      fetchApi<CompetencyData>(`/learning-outcomes/competency-profile/${userId}/enhanced`)
        .then((data) => {
          if (cancelled || !data) return;
          setCompetency(data);
          const recs = (data as any)?.recommendations || [];
          const weekly: { title: string; done: boolean }[] = [];
          // Labs may not have arrived yet — include recs only
          for (const rec of (recs as any[]).slice(0, 3)) weekly.push({ title: rec.title, done: false });
          if (weekly.length) setWeeklyItems((prev) => (prev.length === 0 ? weekly.slice(0, 4) : prev));
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setCompLoading(false); });

      // AI recommendations — slowest (Ollama, 2-8s). Don't block anything.
      fetchApi<any>("/ai/recommendations")
        .then((data) => { if (!cancelled && data?.recommendations) setAiRecommendations(data.recommendations); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setAiLoading(false); });
    }

    load();

    // Enrich weekly items once activeLabs arrive (even if competency already set)
    // This is handled by a separate effect below watching activeLabs + competency

    return () => { cancelled = true; };
  }, []);

  // Merge weekly items when both labs and competency are available
  useEffect(() => {
    if (activeLabs.length === 0 && !competency?.recommendations?.length) return;
    const recs = competency?.recommendations || [];
    const weekly: { title: string; done: boolean }[] = [];
    for (const lab of activeLabs.slice(0, 2)) weekly.push({ title: lab.lab.title, done: false });
    for (const rec of recs.slice(0, 3)) weekly.push({ title: rec.title, done: false });
    if (weekly.length) setWeeklyItems(weekly.slice(0, 4));
  }, [activeLabs, competency]);

  const userName = user?.name || user?.email?.split("@")[0] || "Engineer";
  const firstName = userName.split(" ")[0];
  const domains = competency?.domains || [];
  const topRecs = aiRecommendations.length > 0
    ? aiRecommendations.map(r => ({ ...r, link: r.type === 'lab' ? '/dashboard/labs' : r.type === 'course' ? '/dashboard/courses' : '/dashboard/assessments' }))
    : competency?.recommendations?.slice(0, 3) || [];
  const isNewUser = !labsLoading && !compLoading && (userMetrics?.xp ?? 0) === 0 && activeLabs.length === 0;

  // Derive focus from onboarding selections
  const focusFromStorage = (() => {
    try {
      const s = localStorage.getItem("onboardingSelections");
      if (s) {
        const parsed = JSON.parse(s);
        const skills = parsed.skills || [];
        const roles = parsed.role || "";
        if (skills.length > 0) return skills[0].replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        if (roles) return roles;
      }
    } catch {}
    return "Cybersecurity";
  })();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ─── GREETING + ROLE LINE ─── */}
      <div className="animate-fade-in-up">
        <p className="text-slate-500 text-sm font-medium">
          {getTimeGreeting()}, <span className="text-slate-900">{firstName}</span>
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-400">Your role:</span>
          <span className="text-xs font-semibold text-[#0F203A] bg-[#E9F8EE] px-2 py-0.5 rounded">{nav.role || "Learner"}</span>
          <span className="text-xs text-slate-400">Focused:</span>
          <span className="text-xs font-semibold text-[#229C62]">{focusFromStorage}</span>
          <button className="text-[10px] text-slate-400 hover:text-[#229C62] transition-colors" title="Edit focus">
            ✎
          </button>
        </div>
      </div>

      {/* ─── 2 LARGE PRODUCT CARDS (Launcher) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/courses"
          className="angular-card relative overflow-hidden p-6 group hover-lift hover-glow transition-all duration-300 animate-fade-in-up animate-delay-1"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#229C62]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#7AD62A]/5 rounded-full translate-y-1/2 -translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#229C62] to-[#7AD62A] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-lg shadow-[#229C62]/20">
              <BookOpen size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-[#229C62] transition-colors">Academy</h3>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">Structured courses from fundamentals to advanced security operations</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#229C62]">
              Start learning <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>

        <Link
          href="/dashboard/labs"
          className="angular-card relative overflow-hidden p-6 group hover-lift hover-glow transition-all duration-300 animate-fade-in-up animate-delay-2"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/5 rounded-full translate-y-1/2 -translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-lg shadow-violet-500/20">
              <Terminal size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-[#229C62] transition-colors">Labs</h3>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">Hands-on labs with real Docker environments and live sandboxes</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#229C62]">
              Start playing <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>
      </div>

      {/* ─── QUICK ACCESS ROWS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up animate-delay-3">
        <Link
          href="/dashboard/master-classes"
          className="angular-card bg-white p-4 hover-lift transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FlaskConical size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-[#229C62] transition-colors">Master Classes</p>
              <p className="text-[10px] text-slate-400">Expert-led sessions</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/leaderboard"
          className="angular-card bg-white p-4 hover-lift transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-[#229C62] transition-colors">Compete</p>
              <p className="text-[10px] text-slate-400">Leaderboards & CTFs</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/certifications"
          className="angular-card bg-white p-4 hover-lift transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9F8EE] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award size={18} className="text-[#229C62]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-[#229C62] transition-colors">Certifications</p>
              <p className="text-[10px] text-slate-400">Earn credentials</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/training"
          className="angular-card bg-white p-4 hover-lift transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-[#229C62] transition-colors">Training</p>
              <p className="text-[10px] text-slate-400">1-on-1 coaching</p>
            </div>
          </div>
        </Link>
      </div>

      {/* ─── NEXT OBJECTIVE (if active lab) ─── */}
      {!isNewUser && activeLabs[0] && (
        <div className="angular-card bg-gradient-to-br from-[#0F203A] via-[#1a3a5c] to-[#229C62] p-5 sm:p-6 text-white relative overflow-hidden animate-fade-in-up animate-delay-2">
          <div className="absolute inset-0 angular-grid-bg opacity-[0.04] pointer-events-none" />
          <div className="relative z-10">
            <p className="text-xs text-white/50 uppercase tracking-wide font-medium mb-3">Continue where you left off</p>
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
          </div>
        </div>
      )}

      {/* ─── THIS WEEK ─── */}
      {compLoading && weeklyItems.length === 0 ? (
        <div className="angular-card bg-white p-5 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
          </div>
          <div className="space-y-2">
            {[1,2,3].map((i) => (
              <div key={i} className="h-10 bg-slate-50 rounded-lg" />
            ))}
          </div>
        </div>
      ) : weeklyItems.length > 0 ? (
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
      ) : null}

      {/* ─── ENGINEERING PROFILE ─── */}
      {compLoading ? (
        <div className="angular-card bg-white p-5 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-28 bg-slate-100 rounded" />
            <div className="h-3 w-16 bg-slate-100 rounded" />
          </div>
          <div className="space-y-2.5">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-6 bg-slate-50 rounded" />
            ))}
          </div>
        </div>
      ) : domains.length > 0 ? (
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
      ) : null}

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
      {(aiLoading || compLoading) && topRecs.length === 0 ? (
        <div className="angular-card bg-white p-5 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 bg-slate-100 rounded" />
            <div className="h-4 w-36 bg-slate-100 rounded" />
          </div>
          <div className="space-y-2">
            {[1,2,3].map((i) => (
              <div key={i} className="h-14 bg-slate-50 rounded-lg" />
            ))}
          </div>
        </div>
      ) : topRecs.length > 0 ? (
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
      ) : null}
    </div>
  );
}
