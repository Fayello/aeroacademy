"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useDashboard } from "@/hooks/useDashboard";
import {
  FlaskConical,
  BookOpen,
  Clock,
  Terminal,
  Target,
  ArrowRight,
  Calendar,
  Play,
  ChevronRight,
  TrendingUp,
  Zap,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface ActiveLab {
  id: string;
  labId: string;
  status: string;
  lab: { id: string; title: string; difficulty: number };
  port: number | null;
}

interface EnrolledCourse {
  id: string;
  title: string;
  progress?: number;
  imageUrl?: string | null;
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

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getRoleLabel(): string {
  try {
    const s = localStorage.getItem("onboardingSelections");
    if (s) {
      const parsed = JSON.parse(s);
      const purpose = parsed.purpose || [];
      if (purpose.includes("teach")) return "Instructor";
      if (purpose.includes("compete")) return "Competitor";
      if (purpose.includes("team")) return "Team Lead";
      if (purpose.includes("certify")) return "Certification Seeker";
      if (purpose.includes("learn")) return "Learner";
    }
  } catch {}
  return "Learner";
}

function getFocusLabel(): string {
  try {
    const s = localStorage.getItem("onboardingSelections");
    if (s) {
      const parsed = JSON.parse(s);
      const skills = parsed.skills || [];
      const field = parsed.field || [];
      if (skills.length > 0) {
        return skills[0].replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
      if (field.length > 0) {
        return field[0].replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
    }
  } catch {}
  return "";
}

export default function CommandCenter() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const s = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [activeLabs, setActiveLabs] = useState<ActiveLab[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [competency, setCompetency] = useState<CompetencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const { userMetrics } = useDashboard();

  const xp = userMetrics?.xp || 0;

  useEffect(() => {
    let cancelled = false;

    async function ensureUser(): Promise<string | null> {
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
        if (!cancelled) setLoading(false);
        return;
      }

      fetchApi<ActiveLab[]>("/dashboard/active-labs")
        .then((data) => { if (!cancelled && Array.isArray(data)) setActiveLabs(data); })
        .catch(() => {});

      fetchApi<any>("/courses/enrolled")
        .then((data) => {
          if (!cancelled && Array.isArray(data)) {
            setEnrolledCourses(data.slice(0, 5));
          }
        })
        .catch(() => {});

      fetchApi<CompetencyData>(`/learning-outcomes/competency-profile/${userId}/enhanced`)
        .then((data) => { if (cancelled || !data) return; setCompetency(data); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false); });
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const userName = user?.name || user?.email?.split("@")[0] || "Engineer";
  const firstName = userName.split(" ")[0];
  const domains = competency?.domains || [];
  const topRecs = competency?.recommendations?.slice(0, 3) || [];
  const labsCompleted = competency?.summary?.totalLabsCompleted || 0;
  const outcomesCompleted = competency?.summary?.completedOutcomes || 0;
  const roleLabel = getRoleLabel();
  const focusLabel = getFocusLabel();

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* ─── GREETING + PERSONALIZED ROLE ─── */}
      <div className="animate-fade-in-up">
        <p className="text-lg font-bold text-slate-900">
          {getTimeGreeting()}, {firstName}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-400">Your role:</span>
          <span className="text-xs font-semibold text-[#0F203A] bg-[#E9F8EE] px-2 py-0.5 rounded">{roleLabel}</span>
          {focusLabel && (
            <>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-[#229C62]">Focused: {focusLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* ─── 2 LAUNCHER CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/courses"
          className="angular-card relative overflow-hidden p-5 group hover-lift hover-glow transition-all duration-300 animate-fade-in-up animate-delay-1"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#229C62]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#229C62] to-[#7AD62A] flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-lg shadow-[#229C62]/20">
              <BookOpen size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-0.5 group-hover:text-[#229C62] transition-colors">Academy</h3>
            <p className="text-sm text-slate-500 mb-3">Structured courses from fundamentals to advanced</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#229C62]">
              Start learning <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>

        <Link
          href="/dashboard/labs"
          className="angular-card relative overflow-hidden p-5 group hover-lift hover-glow transition-all duration-300 animate-fade-in-up animate-delay-2"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-lg shadow-violet-500/20">
              <Terminal size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-0.5 group-hover:text-[#229C62] transition-colors">Labs</h3>
            <p className="text-sm text-slate-500 mb-3">Hands-on labs with real Docker environments</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#229C62]">
              Start playing <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>
      </div>

      {/* ─── ACTIVE PROGRESS (labs running + courses enrolled) ─── */}
      {(activeLabs.length > 0 || enrolledCourses.length > 0) && (
        <div className="angular-card bg-white p-5 animate-fade-in-up animate-delay-3">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[#229C62]" />
            <h2 className="text-sm font-semibold text-slate-900">Your Progress</h2>
          </div>
          <div className="space-y-2">
            {activeLabs.slice(0, 2).map((lab) => (
              <Link
                key={lab.id}
                href={`/dashboard/labs/${lab.labId}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#E9F8EE]/50 hover:bg-[#E9F8EE] transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                  <FlaskConical size={16} className="text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate group-hover:text-[#229C62] transition-colors">{lab.lab.title}</p>
                  <p className="text-[11px] text-slate-400">Active lab · Difficulty {lab.lab.difficulty}</p>
                </div>
                <div className="flex items-center gap-1 text-[#229C62]">
                  <Play size={12} fill="currentColor" />
                  <span className="text-xs font-medium">Resume</span>
                </div>
              </Link>
            ))}
            {enrolledCourses.slice(0, 3).map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-[#E9F8EE]/50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#E9F8EE] flex items-center justify-center shrink-0">
                  <BookOpen size={16} className="text-[#229C62]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate group-hover:text-[#229C62] transition-colors">{course.title}</p>
                  {course.progress != null && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#229C62] rounded-full" style={{ width: `${course.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{course.progress}%</span>
                    </div>
                  )}
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-[#229C62] shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── QUICK STATS ROW (compact) ─── */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in-up animate-delay-3">
        <div className="angular-card bg-white p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{labsCompleted}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mt-0.5">Labs Done</p>
        </div>
        <div className="angular-card bg-white p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{outcomesCompleted}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mt-0.5">Skills Mastered</p>
        </div>
        <div className="angular-card bg-white p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{userMetrics?.streak || 0}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mt-0.5">Day Streak</p>
        </div>
      </div>

      {/* ─── ENGINEERING PROFILE (compact, inline) ─── */}
      {domains.length > 0 && (
        <div className="angular-card bg-white p-4 animate-fade-in-up animate-delay-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Your Skills</h2>
            <Link
              href="/dashboard/analytics/competency"
              className="text-xs text-[#229C62] hover:text-[#1a7a4d] font-medium flex items-center gap-1"
            >
              Full profile <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {domains.slice(0, 6).map((d) => (
              <div key={d.domainId} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-[#229C62]" />
                <span className="text-xs font-medium text-slate-700">{d.domainDisplayName || d.domainName}</span>
                <span className="text-[10px] text-slate-400 font-mono">{d.score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── RECOMMENDED (if any) ─── */}
      {topRecs.length > 0 && (
        <div className="angular-card bg-white p-5 animate-fade-in-up animate-delay-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-[#7AD62A]" />
            <h2 className="text-sm font-semibold text-slate-900">Suggested next</h2>
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
