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
  Shield,
  FileCheck,
} from "lucide-react";
import {
  clearOnboardingState,
  getExperienceLabel,
  getFieldCountFromOnboarding,
  getFocusLabelFromOnboarding,
  getInterestTokensFromOnboarding,
  getPrimaryRecommendation,
  getRoleLabelFromOnboarding,
  reorderItemsByIds,
  getSecondaryRecommendation,
  readOnboardingSelections,
  scoreTextAgainstOnboarding,
  syncOnboardingFromProfile,
} from "@/lib/onboarding";
import type { DashboardRecommendations, UserPreference } from "@/types/api";

interface User {
  id: string;
  email: string;
  name?: string;
  preference?: UserPreference | null;
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

function getPrimaryDashboardAction(args: {
  isNewUser: boolean;
  activeLabs: ActiveLab[];
  enrolledCourses: EnrolledCourse[];
  topRecs: CompetencyData["recommendations"];
  primaryRecommendation: ReturnType<typeof getPrimaryRecommendation>;
}) {
  const { isNewUser, activeLabs, enrolledCourses, topRecs, primaryRecommendation } = args;

  if (activeLabs.length > 0) {
    const lab = activeLabs[0];
    return {
      eyebrow: "Resume Practical Work",
      title: lab.lab.title,
      description: "Return to your active lab and keep building practical evidence toward readiness.",
      href: `/dashboard/labs/${lab.labId}`,
      cta: "Resume active lab",
      icon: FlaskConical,
      meta: `Difficulty ${lab.lab.difficulty}`,
    };
  }

  const inProgressCourse = enrolledCourses.find((course) => (course.progress ?? 0) > 0 && (course.progress ?? 0) < 100);
  if (inProgressCourse) {
    return {
      eyebrow: "Continue Training",
      title: inProgressCourse.title,
      description: "Keep your current course moving so your training record stays coherent and measurable.",
      href: `/dashboard/courses/${inProgressCourse.id}`,
      cta: "Continue course",
      icon: BookOpen,
      meta: `${inProgressCourse.progress ?? 0}% complete`,
    };
  }

  if (topRecs.length > 0 && topRecs[0]?.link) {
    const rec = topRecs[0];
    return {
      eyebrow: "Recommended Next Step",
      title: rec.title,
      description: rec.description,
      href: rec.link || "/dashboard/labs",
      cta: "Open recommendation",
      icon: rec.type === "LAB" ? FlaskConical : rec.type === "ASSESSMENT" ? Target : BookOpen,
      meta: rec.priority,
    };
  }

  if (isNewUser) {
    return {
      eyebrow: "Guided Start",
      title: primaryRecommendation.title,
      description: primaryRecommendation.description,
      href: primaryRecommendation.href,
      cta: primaryRecommendation.cta,
      icon: Rocket,
      meta: "First milestone",
    };
  }

  return {
    eyebrow: "Certification Path",
    title: "Review your next measurable milestone",
    description: "Choose one focused next step in training, labs, or assessment instead of spreading effort across too many surfaces.",
    href: "/dashboard/certifications",
    cta: "Review certification path",
    icon: FileCheck,
    meta: "Progress planning",
  };
}

function getReadinessBand(score: number) {
  if (score >= 80) {
    return {
      label: "Assessment-ready",
      description: "Your record shows enough momentum to prepare for a formal assessment attempt.",
    };
  }

  if (score >= 55) {
    return {
      label: "Building readiness",
      description: "You have meaningful progress. Stay focused on one training path and practical evidence.",
    };
  }

  return {
    label: "Foundation stage",
    description: "Start with one guided track and build a measurable record before branching out.",
  };
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const s = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [activeLabs, setActiveLabs] = useState<ActiveLab[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [competency, setCompetency] = useState<CompetencyData | null>(null);
  const [recommendations, setRecommendations] = useState<DashboardRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const { userMetrics } = useDashboard();

  const xp = userMetrics?.xp || 0;

  useEffect(() => {
    let cancelled = false;

    async function ensureUser(): Promise<string | null> {
      let parsed: User | null = null;
      try {
        const s = localStorage.getItem("user");
        parsed = s ? (JSON.parse(s) as User) : null;
      } catch { parsed = null; }
      if (parsed?.id) {
        if (!cancelled) setUser(parsed);
        return parsed.id;
      }
      try {
        const me = await fetchApi<User>("/auth/me");
        if (me?.id) {
          syncOnboardingFromProfile(me);
          localStorage.setItem("user", JSON.stringify(me));
          if (!cancelled) setUser(me);
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

      fetchApi<EnrolledCourse[]>("/courses/enrolled")
        .then((data) => {
          if (!cancelled && Array.isArray(data)) {
            setEnrolledCourses(data.slice(0, 5));
          }
        })
        .catch(() => {});

      fetchApi<DashboardRecommendations>("/dashboard/recommendations?limit=6")
        .then((data) => {
          if (!cancelled && data) {
            setRecommendations(data);
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
  const onboarding = readOnboardingSelections();
  const roleLabel = getRoleLabelFromOnboarding(onboarding);
  const focusLabel = getFocusLabelFromOnboarding(onboarding);
  const focusTokens = getInterestTokensFromOnboarding(onboarding);
  const experienceLabel = getExperienceLabel(onboarding);
  const journeySummary = recommendations?.insights?.journeySummary;
  const personalizationMode = recommendations?.insights?.personalizationMode || recommendations?.source || "rules";
  const purpose = onboarding?.purpose || [];
  const fieldCount = getFieldCountFromOnboarding(onboarding);
  const isNewUser = !loading && userMetrics !== null && xp === 0 && activeLabs.length === 0 && enrolledCourses.length === 0;
  const primaryRecommendation = getPrimaryRecommendation(onboarding);
  const secondaryRecommendation = getSecondaryRecommendation(onboarding);
  const certificationReadiness = Math.min(
    100,
    (xp > 0 ? 25 : 0) +
      (enrolledCourses.length > 0 ? 20 : 0) +
      (activeLabs.length > 0 || labsCompleted > 0 ? 25 : 0) +
      (outcomesCompleted > 0 ? 20 : 0) +
      (topRecs.length > 0 ? 10 : 0),
  );
  const readinessBand = getReadinessBand(certificationReadiness);
  const pathwaySteps = [
    {
      label: "Training",
      value: enrolledCourses.some((course) => (course.progress ?? 0) > 0) ? "In progress" : "Not started",
      detail: enrolledCourses.length > 0
        ? `${enrolledCourses.length} active course${enrolledCourses.length > 1 ? "s" : ""}`
        : "Begin one structured pathway",
      complete: enrolledCourses.some((course) => (course.progress ?? 0) > 0),
      href: "/dashboard/courses",
      icon: BookOpen,
    },
    {
      label: "Practical evidence",
      value: activeLabs.length > 0 || labsCompleted > 0 ? "In progress" : "Not started",
      detail: activeLabs.length > 0
        ? `${activeLabs.length} active lab${activeLabs.length > 1 ? "s" : ""}`
        : labsCompleted > 0
          ? `${labsCompleted} lab${labsCompleted > 1 ? "s" : ""} completed`
          : "Capture practical proof through labs",
      complete: activeLabs.length > 0 || labsCompleted > 0,
      href: "/dashboard/labs",
      icon: FlaskConical,
    },
    {
      label: "Assessment",
      value: certificationReadiness >= 70 ? "In reach" : "Pending",
      detail: certificationReadiness >= 70
        ? "You are close to controlled evaluation readiness"
        : "Strengthen training consistency before attempting",
      complete: certificationReadiness >= 70,
      href: "/dashboard/exams",
      icon: Shield,
    },
  ];
  const completedPathwaySteps = pathwaySteps.filter((step) => step.complete).length;
  const journeyGuide = isNewUser
    ? {
        eyebrow: "Your first route",
        title: "Complete one guided path before branching out",
        description: "Start with the recommended course or lab, build practical evidence, then progress into assessments when your readiness record is stronger.",
      }
    : certificationReadiness >= 70
      ? {
          eyebrow: "Your strongest next move",
          title: "Turn momentum into a measurable result",
          description: "You have enough training proof to focus on practical exams, certificate progress, and controlled evaluation instead of collecting more random activity.",
        }
      : {
          eyebrow: "Stay on one path",
          title: "Consistency matters more than trying everything",
          description: "Keep your current course or lab moving until your record shows stronger readiness for assessments and credential progress.",
        };

  const primaryPurpose = purpose[0] || "other";
  const recommendedOpenCourse = recommendations?.courses?.[0] || null;
  const personalizedCourse = reorderItemsByIds(
    enrolledCourses.slice(),
    recommendations?.courses?.map((course) => course.id) || [],
  )
    .sort((a, b) => {
      const scoreA = scoreTextAgainstOnboarding(`${a.title}`, onboarding);
      const scoreB = scoreTextAgainstOnboarding(`${b.title}`, onboarding);
      return scoreB - scoreA;
    })[0] || null;
  const interestSummary = focusTokens
    .filter((token) => token.length > 3)
    .slice(0, 4)
    .map((token) => token.replace(/\b\w/g, (char) => char.toUpperCase()));
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
  const primaryAction = getPrimaryDashboardAction({
    isNewUser,
    activeLabs,
    enrolledCourses,
    topRecs,
    primaryRecommendation,
  });
  const supportingActions = [
    { href: "/dashboard/courses", title: "Course pathways", text: "Structured training toward readiness", icon: BookOpen },
    { href: "/dashboard/labs", title: "Hands-on labs", text: "Practical work and skill evidence", icon: FlaskConical },
    { href: "/dashboard/exams", title: "Practical exams", text: "Controlled assessments and reports", icon: Target },
    { href: "/dashboard/readiness-transcript", title: "Readiness transcript", text: "A recruiter-readable proof record", icon: FileCheck },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ─── GREETING HERO ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#1a3a5c] p-5 sm:p-6 lg:p-8 animate-fade-in-up border border-white/[0.06] shadow-lg shadow-black/20">
        <div className="absolute inset-0 dot-grid-bg opacity-[0.04] pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#7AD62A]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#7AD62A]/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A] mb-2">Dashboard</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Welcome, {firstName}</h1>
            <p className="text-sm text-white/50 mb-2">{getTimeGreeting()}</p>
            <p className="text-sm text-white/60 leading-relaxed">
              <span className="text-[#7AD62A] font-semibold">{roleLabel}</span>
              {focusLabel && (
                <> · {focusLabel}{fieldCount > 1 ? ` +${fieldCount - 1}` : ""}</>
              )}
              {experienceLabel && <> · {experienceLabel}</>}
              <button
                onClick={() => {
                  clearOnboardingState();
                  window.location.href = "/onboarding";
                }}
                className="inline-flex items-center gap-1 ml-2 text-white/30 hover:text-[#7AD62A] transition-colors"
                title="Change selections"
              >
                <Pencil size={11} />
              </button>
            </p>
            {interestSummary.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {interestSummary.map((token) => (
                  <span key={token} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-200">
                    {token}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/dashboard/profile"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-all hover:border-white/20 hover:bg-white/10 backdrop-blur-sm sm:w-auto"
          >
            View Profile
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_0.55fr] gap-4">
        <div className="angular-card bg-[#0f172a] border border-white/10 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">{primaryAction.eyebrow}</p>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">{primaryAction.title}</h2>
              <p className="text-sm text-slate-300 mt-3 max-w-2xl leading-relaxed">{primaryAction.description}</p>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-[#7AD62A]/10 items-center justify-center shrink-0">
              <primaryAction.icon size={22} className="text-[#7AD62A]" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 mt-5">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Right now</p>
              <p className="text-sm font-semibold text-white mt-2">{primaryAction.cta}</p>
              <p className="text-xs text-slate-400 mt-1">{primaryAction.meta}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Why it matters</p>
              <p className="text-sm font-semibold text-white mt-2">{readinessBand.label}</p>
              <p className="text-xs text-slate-400 mt-1">{readinessBand.description}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Personalization signal</p>
              <p className="text-sm font-semibold text-white mt-2">
                {focusLabel ? `Optimized for ${focusLabel}` : `${completedPathwaySteps}/3 pathway stages active`}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {journeySummary ||
                  (focusLabel
                    ? "Labs, courses, and guided starts are being reshaped around your selected interests."
                    : "Training, practical evidence, and assessment readiness.")}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href={primaryAction.href} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#7AD62A] px-4 py-2 text-sm font-semibold text-[#0F203A] transition-colors hover:bg-[#6bc422] sm:w-auto">
              {primaryAction.cta}
              <ArrowRight size={14} />
            </Link>
            {(recommendedOpenCourse || personalizedCourse) && (
              <Link href={`/dashboard/courses/${(recommendedOpenCourse || personalizedCourse)?.id}`} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 sm:w-auto">
                {recommendedOpenCourse ? "AI-ranked course" : "Recommended course"}
                <BookOpen size={14} />
              </Link>
            )}
            <Link href="/dashboard/recommendations" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 sm:w-auto">
              Adjust journey
              <Pencil size={14} />
            </Link>
            <span className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200 sm:w-auto">
              <Clock size={13} className="text-[#7AD62A]" />
              {personalizationMode === "ai" ? `AI-guided · ${primaryAction.meta}` : primaryAction.meta}
            </span>
          </div>
        </div>

        <div className="angular-card bg-[#0f172a] border border-[#7AD62A]/20 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Certification Pathway</p>
              <h2 className="text-lg font-bold text-white mt-2">{readinessBand.label}</h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                {readinessBand.description}
              </p>
            </div>
            <div className="rounded-2xl bg-[#7AD62A]/10 px-4 py-3 text-center shrink-0">
              <div className="text-2xl font-bold text-[#7AD62A]">{certificationReadiness}%</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Readiness</div>
            </div>
          </div>
          <div className="mt-5 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#7AD62A] to-[#6bc422]" style={{ width: `${certificationReadiness}%` }} />
          </div>
          <div className="space-y-3 mt-5">
            {pathwaySteps.map((step) => (
              <Link
                key={step.label}
                href={step.href}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#7AD62A]/25 hover:bg-[#7AD62A]/[0.04] transition-colors"
              >
                <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg ${step.complete ? "bg-[#7AD62A]/15" : "bg-white/[0.06]"}`}>
                  <step.icon size={16} className={step.complete ? "text-[#7AD62A]" : "text-slate-400"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{step.label}</p>
                    <span className={`text-[11px] uppercase tracking-wide ${step.complete ? "text-[#7AD62A]" : "text-slate-500"}`}>
                      {step.value}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.detail}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/dashboard/certifications" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#7AD62A] px-4 py-2 text-sm font-semibold text-[#0F203A] transition-colors hover:bg-[#6bc422] sm:w-auto">
              <FileCheck size={14} />
              Review Certification Path
            </Link>
            <Link href="/dashboard/exams" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 sm:w-auto">
              Practical Exams
            </Link>
          </div>
        </div>
      </div>

      <div className="angular-card bg-[#0f172a] border border-white/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">{journeyGuide.eyebrow}</p>
            <h2 className="mt-2 text-xl font-bold text-white">{journeyGuide.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {journeySummary || journeyGuide.description}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[24rem]">
            {pathwaySteps.map((step, index) => (
              <div key={step.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Step {index + 1}</p>
                <p className="mt-2 text-sm font-semibold text-white">{step.label}</p>
                <p className="mt-1 text-xs text-slate-400">{step.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── PERSONALIZED JOURNEY (based on onboarding purpose) ─── */}
      {isNewUser && purpose.length > 0 && (
        <div className="angular-card bg-[#0f172a] border border-white/6 p-5 animate-fade-in-up animate-delay-1 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#7AD62A]/30 to-transparent" />
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center shrink-0">
              <Zap size={20} className="text-[#7AD62A]" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-white mb-1">
                {purposeTitle[primaryPurpose] || "Welcome to XpertClass"}
              </h3>
              <p className="text-sm text-slate-300 mb-4">
                {primaryRecommendation.description}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link href={primaryRecommendation.href} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#7AD62A] px-4 py-2 text-sm font-semibold text-[#0F203A] transition-colors hover:bg-[#6bc422] sm:w-auto">
                  <Rocket size={14} /> {primaryRecommendation.cta}
                </Link>
                <Link href={secondaryRecommendation.href} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto">
                  <Terminal size={14} /> {secondaryRecommendation.cta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {supportingActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="angular-card bg-[#0f172a] border border-white/10 p-5 group hover:bg-white/[0.03] hover:border-[#7AD62A]/20 transition-all"
          >
            <action.icon size={18} className="text-[#7AD62A] mb-3" />
            <h3 className="text-sm font-semibold text-white group-hover:text-[#7AD62A] transition-colors">{action.title}</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{action.text}</p>
            <span className="inline-flex items-center gap-1 text-xs text-[#7AD62A] font-medium mt-4">
              Open
              <ChevronRight size={12} />
            </span>
          </Link>
        ))}
      </div>

      {/* ─── SECONDARY ROWS ─── */}
      {!isNewUser && (
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
      )}

      {/* ─── ACTIVE PROGRESS ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in-up animate-delay-3">
        <div className="angular-card bg-[#0f172a] border border-white/6 p-4 text-center group hover:bg-white/[0.03] hover:border-[#7AD62A]/20 transition-all duration-300">
          <div className="w-8 h-8 rounded-lg bg-[#7AD62A]/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-[#7AD62A]/20 transition-colors">
            <FlaskConical size={16} className="text-[#7AD62A]" />
          </div>
          <p className="text-xl font-bold text-white">{labsCompleted}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mt-0.5">Labs Done</p>
        </div>
        <div className="angular-card bg-[#0f172a] border border-white/6 p-4 text-center group hover:bg-white/[0.03] hover:border-violet-400/20 transition-all duration-300">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-violet-500/20 transition-colors">
            <Award size={16} className="text-violet-400" />
          </div>
          <p className="text-xl font-bold text-white">{outcomesCompleted}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mt-0.5">Skills Mastered</p>
        </div>
        <div className="angular-card bg-[#0f172a] border border-white/6 p-4 text-center group hover:bg-white/[0.03] hover:border-amber-400/20 transition-all duration-300">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-amber-500/20 transition-colors">
            <Zap size={16} className="text-amber-400" />
          </div>
          <p className="text-xl font-bold text-white">{userMetrics?.streak || 0}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mt-0.5">Day Streak</p>
        </div>
        </div>

        {(activeLabs.length > 0 || enrolledCourses.length > 0) && (
          <div className="angular-card bg-[#0f172a] border border-white/6 p-5 animate-fade-in-up animate-delay-3">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#7AD62A]/10 flex items-center justify-center">
                  <TrendingUp size={14} className="text-[#7AD62A]" />
                </div>
                <h2 className="text-sm font-semibold text-white">Current Record</h2>
              </div>
              <span className="text-[10px] uppercase tracking-wide text-slate-500">
                {activeLabs.length + enrolledCourses.length} active item{activeLabs.length + enrolledCourses.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2">
              {activeLabs.slice(0, 1).map((lab) => (
                <Link
                  key={lab.id}
                  href={`/dashboard/labs/${lab.labId}`}
                  className="flex items-center gap-3 rounded-xl border border-white/4 bg-white/[0.03] p-3 transition-all group hover:border-[#7AD62A]/20 hover:bg-[#7AD62A]/5"
                >
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <FlaskConical size={16} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-[#7AD62A] transition-colors">{lab.lab.title}</p>
                    <p className="text-[11px] text-slate-400">Active lab · Difficulty {lab.lab.difficulty}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-[#7AD62A]">
                    <Play size={12} fill="currentColor" />
                    <span className="text-xs font-medium">Resume</span>
                  </div>
                </Link>
              ))}
              {enrolledCourses.slice(0, 2).map((course) => (
                <Link
                  key={course.id}
                  href={`/dashboard/courses/${course.id}`}
                  className="flex items-center gap-3 rounded-xl border border-white/4 bg-white/[0.03] p-3 transition-all group hover:border-[#7AD62A]/20 hover:bg-[#7AD62A]/5"
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
                        <span className="text-[10px] text-slate-400 font-medium">{course.progress}%</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-[#7AD62A] shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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

      {topRecs.length > 0 && (
        <div className="angular-card bg-[#0f172a] border border-white/6 p-5 animate-fade-in-up animate-delay-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#7AD62A]/10 flex items-center justify-center">
              <Zap size={14} className="text-[#7AD62A]" />
            </div>
            <h2 className="text-sm font-semibold text-white">Secondary suggestions</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Only use these if your primary next step is blocked. The strongest progress still comes from staying on one path.
          </p>
          <div className="space-y-2">
            {topRecs.slice(0, 2).map((rec, i) => (
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
