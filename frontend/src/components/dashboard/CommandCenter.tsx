"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useDashboard } from "@/hooks/useDashboard";
import {
  FlaskConical,
  BookOpen,
  Rocket,
  Terminal,
  Target,
  ArrowRight,
  Play,
  ChevronRight,
  TrendingUp,
  Zap,
  Pencil,
  Clock,
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
  const isNewUser = !loading && userMetrics !== null && xp === 0 && activeLabs.length === 0 && enrolledCourses.length === 0;

  const primaryPurpose = purpose[0] || "other";
  const purposeTitle: Record<string, string> = {
    learn: "Ready to start learning?",
    train: "Ready to level up?",
    teach: "Ready to create courses?",
    compete: "Ready to compete?",
    certify: "Ready to earn certifications?",
    team: "Ready to train your team?",
    connect: "Ready to connect?",
    jobs: "Ready to explore opportunities?",
    other: "Welcome to XpertClass",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ─── GREETING HERO ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#1a3a5c] p-6 lg:p-8 animate-fade-in-up">
        <div className="absolute inset-0 dot-grid-bg opacity-[0.04] pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#7AD62A]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-sm text-white/50 mb-1">{getTimeGreeting()}</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              {firstName}
            </h1>
            <p className="text-sm text-white/60">
              <span className="text-[#7AD62A] font-semibold">{roleLabel}</span>
              {focusLabel && (
                <> · {focusLabel}{fieldCount > 1 ? ` +${fieldCount - 1}` : ""}</>
              )}
              <button
                onClick={() => {
                  localStorage.removeItem("onboardingComplete");
                  window.location.href = "/onboarding";
                }}
                className="inline-flex items-center gap-1 ml-2 text-white/30 hover:text-[#7AD62A] transition-colors"
                title="Change selections"
              >
                <Pencil size={11} />
              </button>
            </p>
          </div>
          <Link
            href="/dashboard/profile"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-slate-200 transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>

      {/* ─── PERSONALIZED JOURNEY (based on onboarding purpose) ─── */}
      {isNewUser && purpose.length > 0 && (
        <div className="angular-card bg-[#0f172a] border border-white/6 p-5 animate-fade-in-up animate-delay-1">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center shrink-0">
              <Zap size={20} className="text-[#7AD62A]" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-white mb-1">
                {purposeTitle[primaryPurpose] || "Welcome to XpertClass"}
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                {field.length > 0
                  ? `Based on your interest in ${field[0].replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}, we recommend starting with:`
                  : "Here's your recommended first step:"}
              </p>
              <div className="flex flex-wrap gap-2">
                {primaryPurpose === "learn" && (
                  <Link href="/dashboard/courses" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] text-sm font-semibold transition-colors">
                    <BookOpen size={14} /> Browse Courses
                  </Link>
                )}
                {primaryPurpose === "teach" && (
                  <Link href="/dashboard/admin/courses" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] text-sm font-semibold transition-colors">
                    <BookOpen size={14} /> Create a Course
                  </Link>
                )}
                {primaryPurpose === "compete" && (
                  <Link href="/dashboard/leaderboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] text-sm font-semibold transition-colors">
                    <TrendingUp size={14} /> View Leaderboard
                  </Link>
                )}
                {primaryPurpose === "certify" && (
                  <Link href="/dashboard/certifications" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] text-sm font-semibold transition-colors">
                    <Target size={14} /> View Certifications
                  </Link>
                )}
                {primaryPurpose === "team" && (
                  <Link href="/dashboard/teams" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] text-sm font-semibold transition-colors">
                    <FlaskConical size={14} /> Create a Team
                  </Link>
                )}
                <Link href="/dashboard/labs" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors border border-white/10">
                  <Terminal size={14} /> Try a Lab
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── BEGINNER PATH CTA ─── */}
      {!loading && userMetrics !== null && xp === 0 && (
        <Link
          href="/dashboard/starting-point"
          className="angular-card border border-dashed border-[#7AD62A]/30 bg-[#7AD62A]/5 p-4 flex items-center gap-4 hover:border-[#7AD62A]/60 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center shrink-0 group-hover:bg-[#7AD62A]/20 transition-colors">
            <Rocket size={18} className="text-[#7AD62A]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white group-hover:text-[#7AD62A] transition-colors">Not sure where to begin?</h3>
            <p className="text-xs text-slate-400">Try our guided beginner path — labs ordered by difficulty</p>
          </div>
          <span className="text-xs text-[#7AD62A] font-medium shrink-0">Begin →</span>
        </Link>
      )}

      {/* ─── 2 LAUNCHER CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/courses"
          className="angular-card relative overflow-hidden p-6 group hover-lift transition-all duration-300 animate-fade-in-up animate-delay-1"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#7AD62A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-500">
            <svg viewBox="0 0 120 120" className="w-full h-full">
              <rect x="20" y="30" width="80" height="60" rx="8" fill="#7AD62A" />
              <rect x="30" y="40" width="60" height="8" rx="2" fill="#fff" />
              <rect x="30" y="55" width="40" height="6" rx="2" fill="#fff" />
              <rect x="30" y="68" width="50" height="6" rx="2" fill="#fff" />
              <circle cx="85" cy="35" r="12" fill="#fff" fillOpacity="0.3" />
            </svg>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-semibold text-[#7AD62A] uppercase tracking-wider mb-1">XpertClass Academy</p>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#7AD62A] transition-colors">
              Learn and get certified
            </h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Structured learning paths with 50+ lessons and industry certifications.
            </p>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] text-sm font-semibold transition-colors">
              Start learning <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>

        <Link
          href="/dashboard/labs"
          className="angular-card relative overflow-hidden p-6 group hover-lift transition-all duration-300 animate-fade-in-up animate-delay-2"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-500">
            <svg viewBox="0 0 120 120" className="w-full h-full">
              <rect x="15" y="25" width="90" height="70" rx="8" fill="#7c3aed" />
              <rect x="25" y="35" width="35" height="25" rx="4" fill="#a78bfa" />
              <rect x="65" y="35" width="30" height="10" rx="2" fill="#a78bfa" />
              <rect x="65" y="50" width="30" height="10" rx="2" fill="#a78bfa" />
              <rect x="25" y="65" width="70" height="8" rx="2" fill="#a78bfa" />
            </svg>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-1">XpertClass Labs</p>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#7AD62A] transition-colors">
              Practice with hands-on Labs
            </h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Real-world environments with Docker sandboxes. New labs weekly.
            </p>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors">
              Start playing <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>
      </div>

      {/* ─── SECONDARY ROWS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in-up animate-delay-2">
        <Link
          href="/dashboard/leaderboard"
          className="angular-card bg-[#0f172a] flex items-center gap-4 p-4 group hover:bg-white/[0.03] transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white group-hover:text-[#7AD62A] transition-colors">Leaderboard</p>
            <p className="text-xs text-slate-400">Compete and climb the rankings</p>
          </div>
          <ChevronRight size={16} className="text-slate-600 group-hover:text-[#7AD62A] shrink-0" />
        </Link>

        <Link
          href="/dashboard/teams"
          className="angular-card bg-[#0f172a] flex items-center gap-4 p-4 group hover:bg-white/[0.03] transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <Users size={18} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white group-hover:text-[#7AD62A] transition-colors">Teams</p>
            <p className="text-xs text-slate-400">Collaborate with peers and compete together</p>
          </div>
          <ChevronRight size={16} className="text-slate-600 group-hover:text-[#7AD62A] shrink-0" />
        </Link>
      </div>

      {/* ─── ACTIVE PROGRESS ─── */}
      {(activeLabs.length > 0 || enrolledCourses.length > 0) && (
        <div className="angular-card bg-[#0f172a] border border-white/6 p-5 animate-fade-in-up animate-delay-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#7AD62A]/10 flex items-center justify-center">
              <TrendingUp size={14} className="text-[#7AD62A]" />
            </div>
            <h2 className="text-sm font-semibold text-white">Your Progress</h2>
          </div>
          <div className="space-y-2">
            {activeLabs.slice(0, 2).map((lab) => (
              <Link
                key={lab.id}
                href={`/dashboard/labs/${lab.labId}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-[#7AD62A]/5 border border-white/4 hover:border-[#7AD62A]/20 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                  <FlaskConical size={16} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-[#7AD62A] transition-colors">{lab.lab.title}</p>
                  <p className="text-[11px] text-slate-500">Active lab · Difficulty {lab.lab.difficulty}</p>
                </div>
                <div className="flex items-center gap-1 text-[#7AD62A]">
                  <Play size={12} fill="currentColor" />
                  <span className="text-xs font-medium">Resume</span>
                </div>
              </Link>
            ))}
            {enrolledCourses.slice(0, 3).map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-[#7AD62A]/5 border border-white/4 hover:border-[#7AD62A]/20 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#7AD62A]/10 flex items-center justify-center shrink-0">
                  <BookOpen size={16} className="text-[#7AD62A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-[#7AD62A] transition-colors">{course.title}</p>
                  {course.progress != null && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#7AD62A] to-[#6bc422] rounded-full" style={{ width: `${course.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">{course.progress}%</span>
                    </div>
                  )}
                </div>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-[#7AD62A] shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── STATS ROW ─── */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in-up animate-delay-3">
        <div className="angular-card bg-[#0f172a] border border-white/6 p-4 text-center group hover:bg-white/[0.03] transition-colors">
          <div className="w-8 h-8 rounded-lg bg-[#7AD62A]/10 flex items-center justify-center mx-auto mb-2">
            <FlaskConical size={16} className="text-[#7AD62A]" />
          </div>
          <p className="text-xl font-bold text-white">{labsCompleted}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mt-0.5">Labs Done</p>
        </div>
        <div className="angular-card bg-[#0f172a] border border-white/6 p-4 text-center group hover:bg-white/[0.03] transition-colors">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mx-auto mb-2">
            <Award size={16} className="text-violet-400" />
          </div>
          <p className="text-xl font-bold text-white">{outcomesCompleted}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mt-0.5">Skills Mastered</p>
        </div>
        <div className="angular-card bg-[#0f172a] border border-white/6 p-4 text-center group hover:bg-white/[0.03] transition-colors">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
            <Zap size={16} className="text-amber-400" />
          </div>
          <p className="text-xl font-bold text-white">{userMetrics?.streak || 0}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mt-0.5">Day Streak</p>
        </div>
      </div>

      {/* ─── SKILLS ─── */}
      {domains.length > 0 && domains.some((d) => d.score > 0) && (
        <div className="angular-card bg-[#0f172a] border border-white/6 p-5 animate-fade-in-up animate-delay-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Your Skills</h2>
            <Link
              href="/dashboard/analytics/competency"
              className="text-xs text-[#7AD62A] hover:text-[#6bc422] font-medium flex items-center gap-1"
            >
              Full profile <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {domains.filter((d) => d.score > 0).slice(0, 6).map((d) => (
              <div key={d.domainId} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/4">
                <div className="w-2 h-2 rounded-full bg-[#7AD62A] shrink-0" />
                <span className="text-xs font-medium text-slate-200 truncate">{d.domainDisplayName || d.domainName}</span>
                <span className="text-[10px] text-[#7AD62A] font-mono ml-auto">{d.score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── RECOMMENDED ─── */}
      {topRecs.length > 0 && (
        <div className="angular-card bg-[#0f172a] border border-white/6 p-5 animate-fade-in-up animate-delay-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#7AD62A]/10 flex items-center justify-center">
              <Zap size={14} className="text-[#7AD62A]" />
            </div>
            <h2 className="text-sm font-semibold text-white">Suggested next</h2>
          </div>
          <div className="space-y-2">
            {topRecs.map((rec, i) => (
              <Link
                key={i}
                href={rec.link || "/dashboard/labs"}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-[#7AD62A]/5 border border-white/4 hover:border-[#7AD62A]/20 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#7AD62A]/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                  {rec.type === "LAB" && <FlaskConical size={14} className="text-[#7AD62A]" />}
                  {rec.type === "OUTCOME" && <BookOpen size={14} className="text-violet-400" />}
                  {rec.type === "ASSESSMENT" && <Target size={14} className="text-blue-400" />}
                  {rec.type === "MAINTAIN" && <Clock size={14} className="text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white group-hover:text-[#7AD62A] transition-colors">
                    {rec.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{rec.description}</p>
                </div>
                <ArrowRight size={14} className="text-slate-600 group-hover:text-[#7AD62A] shrink-0 mt-1 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
