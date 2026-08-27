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
  Play,
  ChevronRight,
  TrendingUp,
  Zap,
  Pencil,
  Award,
  Users,
  Building2,
  GraduationCap,
  Briefcase,
  Lightbulb,
  Sparkles,
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

function getOnboardingData() {
  try {
    const s = localStorage.getItem("onboardingSelections");
    if (s) return JSON.parse(s);
  } catch {}
  return null;
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

function getFieldCount(): number {
  try {
    const s = localStorage.getItem("onboardingSelections");
    if (s) {
      const parsed = JSON.parse(s);
      return (parsed.field || []).length;
    }
  } catch {}
  return 0;
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
  const onboarding = getOnboardingData();
  const purpose = onboarding?.purpose || [];
  const field = onboarding?.field || [];
  const fieldCount = getFieldCount();
  const isNewUser = xp === 0 && activeLabs.length === 0 && enrolledCourses.length === 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* ─── GREETING + PERSONALIZED ROLE ─── */}
      <div className="flex items-start justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Welcome, {firstName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your current role is:{" "}
            <span className="text-[#229C62] font-semibold">{roleLabel}</span>
            {focusLabel && (
              <>
                , Focused on:{" "}
                <span className="text-[#229C62] font-semibold">
                  {focusLabel}{fieldCount > 1 ? ` +${fieldCount - 1}` : ""}
                </span>
              </>
            )}
            <button
              onClick={() => {
                localStorage.removeItem("onboardingComplete");
                window.location.href = "/onboarding";
              }}
              className="inline-flex items-center gap-1 ml-1 text-slate-400 hover:text-[#229C62] transition-colors"
              title="Change selections"
            >
              <Pencil size={12} />
            </button>
          </p>
        </div>
        <Link
          href="/dashboard/profile"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors"
        >
          View Profile
        </Link>
      </div>

      {/* ─── PERSONALIZED JOURNEY (based on onboarding purpose) ─── */}
      {isNewUser && purpose.length > 0 && (
        <div className="angular-card bg-gradient-to-r from-[#0F203A] to-[#1a3a5c] p-6 text-white animate-fade-in-up animate-delay-1">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#7AD62A]/20 flex items-center justify-center shrink-0">
              <Zap size={22} className="text-[#7AD62A]" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold mb-1">
                {purpose.includes("learn") && "Ready to start learning?"}
                {purpose.includes("train") && "Ready to level up?"}
                {purpose.includes("teach") && "Ready to create courses?"}
                {purpose.includes("compete") && "Ready to compete?"}
                {purpose.includes("certify") && "Ready to earn certifications?"}
                {purpose.includes("team") && "Ready to train your team?"}
                {purpose.includes("connect") && "Ready to connect?"}
                {purpose.includes("jobs") && "Ready to explore opportunities?"}
                {purpose.includes("other") && "Welcome to XpertClass"}
                {!purpose.some((p: string) => ["learn","train","teach","compete","certify","team","connect","jobs","other"].includes(p)) && "Welcome to XpertClass"}
              </h3>
              <p className="text-sm text-white/60 mb-4">
                {field.length > 0
                  ? `Based on your interest in ${field[0].replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}, we recommend starting with:`
                  : "Here's your recommended first step:"}
              </p>
              <div className="flex flex-wrap gap-2">
                {purpose.includes("learn") && (
                  <Link href="/dashboard/courses" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#229C62] hover:bg-[#1d8a56] text-white text-sm font-semibold transition-colors">
                    <BookOpen size={14} /> Browse Courses
                  </Link>
                )}
                {purpose.includes("teach") && (
                  <Link href="/dashboard/admin/courses" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#229C62] hover:bg-[#1d8a56] text-white text-sm font-semibold transition-colors">
                    <BookOpen size={14} /> Create a Course
                  </Link>
                )}
                {purpose.includes("compete") && (
                  <Link href="/dashboard/leaderboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#229C62] hover:bg-[#1d8a56] text-white text-sm font-semibold transition-colors">
                    <TrendingUp size={14} /> View Leaderboard
                  </Link>
                )}
                {purpose.includes("certify") && (
                  <Link href="/dashboard/certifications" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#229C62] hover:bg-[#1d8a56] text-white text-sm font-semibold transition-colors">
                    <Target size={14} /> View Certifications
                  </Link>
                )}
                {purpose.includes("team") && (
                  <Link href="/dashboard/teams" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#229C62] hover:bg-[#1d8a56] text-white text-sm font-semibold transition-colors">
                    <FlaskConical size={14} /> Create a Team
                  </Link>
                )}
                <Link href="/dashboard/labs" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors">
                  <Terminal size={14} /> Try a Lab
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2 LAUNCHER CARDS (HTB-style with descriptions) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/courses"
          className="angular-card relative overflow-hidden p-6 group hover-lift hover-glow transition-all duration-300 animate-fade-in-up animate-delay-1"
        >
          {/* Decorative illustration area */}
          <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500">
            <svg viewBox="0 0 120 120" className="w-full h-full">
              <rect x="20" y="30" width="80" height="60" rx="8" fill="#229C62" />
              <rect x="30" y="40" width="60" height="8" rx="2" fill="#7AD62A" />
              <rect x="30" y="55" width="40" height="6" rx="2" fill="#7AD62A" />
              <rect x="30" y="68" width="50" height="6" rx="2" fill="#7AD62A" />
              <circle cx="85" cy="35" r="12" fill="#7AD62A" />
              <path d="M81 35 L85 30 L89 35 Z" fill="#fff" />
            </svg>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-semibold text-[#229C62] uppercase tracking-wider mb-1">XpertClass Academy</p>
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#229C62] transition-colors">
              Learn and get certified
            </h3>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Begin or advance your tech journey with structured learning paths and earn industry certifications to prove your expertise.
            </p>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#229C62] hover:bg-[#1d8a56] text-white text-sm font-semibold transition-colors group-hover:shadow-lg group-hover:shadow-[#229C62]/20">
              Start learning <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>

        <Link
          href="/dashboard/labs"
          className="angular-card relative overflow-hidden p-6 group hover-lift hover-glow transition-all duration-300 animate-fade-in-up animate-delay-2"
        >
          {/* Decorative illustration area */}
          <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500">
            <svg viewBox="0 0 120 120" className="w-full h-full">
              <rect x="15" y="25" width="90" height="70" rx="8" fill="#7c3aed" />
              <rect x="25" y="35" width="35" height="25" rx="4" fill="#a78bfa" />
              <rect x="65" y="35" width="30" height="10" rx="2" fill="#a78bfa" />
              <rect x="65" y="50" width="30" height="10" rx="2" fill="#a78bfa" />
              <rect x="25" y="65" width="70" height="8" rx="2" fill="#a78bfa" />
              <circle cx="90" cy="30" r="10" fill="#f472b6" />
              <path d="M86 30 L90 25 L94 30 Z" fill="#fff" />
            </svg>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-1">XpertClass Labs</p>
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#229C62] transition-colors">
              Practice with hands-on Labs
            </h3>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Access labs simulating real-world environments, misconfigurations, and incidents. With new content released weekly!
            </p>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors group-hover:shadow-lg group-hover:shadow-violet-500/20">
              Start playing <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>
      </div>

      {/* ─── SECONDARY PRODUCT ROWS ─── */}
      <div className="space-y-2 animate-fade-in-up animate-delay-2">
        <Link
          href="/dashboard/leaderboard"
          className="angular-card bg-white flex items-center gap-4 p-4 group hover:bg-[#E9F8EE]/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900 group-hover:text-[#229C62] transition-colors">Leaderboard</p>
            <p className="text-xs text-slate-500">Compete and climb the rankings</p>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-[#229C62] shrink-0" />
        </Link>

        <Link
          href="/dashboard/teams"
          className="angular-card bg-white flex items-center gap-4 p-4 group hover:bg-[#E9F8EE]/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Users size={18} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900 group-hover:text-[#229C62] transition-colors">Teams</p>
            <p className="text-xs text-slate-500">Collaborate with peers and compete together</p>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-[#229C62] shrink-0" />
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

      {/* ─── QUICK STATS ROW ─── */}
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

      {/* ─── ENGINEERING PROFILE (compact) ─── */}
      {domains.length > 0 && domains.some((d) => d.score > 0) && (
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
            {domains.filter((d) => d.score > 0).slice(0, 6).map((d) => (
              <div key={d.domainId} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-[#229C62]" />
                <span className="text-xs font-medium text-slate-700">{d.domainDisplayName || d.domainName}</span>
                <span className="text-[10px] text-slate-400 font-mono">{d.score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── RECOMMENDED ─── */}
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
