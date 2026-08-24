"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useDashboard } from "@/hooks/useDashboard";
import { useDisplayMode } from "@/lib/displayMode";
import { useNavigation } from "@/lib/navigation";
import {
  getLevel,
  getLevelProgress,
  getNextLabUnlock,
} from "@/lib/levelGating";
import {
  ArrowRight,
  FlaskConical,
  Loader2,
  Rocket,
  Target,
  BookOpen,
  Play,
  Clock,
  ChevronRight,
  Zap,
  TrendingUp,
  ClipboardCheck,
} from "lucide-react";
import { DomainBar, DomainMotif } from "@/components/ui/DomainVisual";

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
  lab: { id: string; title: string; difficulty: number; dockerImage: string };
  port: number | null;
  createdAt: string;
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

interface CohortInfo {
  cohortId: string;
  cohortName: string;
  curriculumName: string | null;
  role: string;
}

interface ExamInfo {
  assessmentId: string;
  title: string;
  status: string;
  score: number | null;
  maxScore: number;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getGreetingSubtext(xp: number): string {
  if (xp === 0) return "Your engineering journey begins now.";
  if (xp < 1000) return "Building your foundation.";
  if (xp < 5000) return "Your skills are taking shape.";
  if (xp < 10000) return "Solid engineering progress.";
  if (xp < 25000) return "Advanced capability demonstrated.";
  return "Expert-level engineering mastery.";
}

export default function CommandCenter() {
  const [user, setUser] = useState<User | null>(null);
  const [activeLabs, setActiveLabs] = useState<ActiveLab[]>([]);
  const [competency, setCompetency] = useState<CompetencyData | null>(null);
  const [cohorts, setCohorts] = useState<CohortInfo[]>([]);
  const [exams, setExams] = useState<ExamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { config } = useDisplayMode();
  const { nav } = useNavigation();
  const { userMetrics } = useDashboard();

  const xp = userMetrics?.xp || 0;
  const level = getLevel(xp);
  const progress = getLevelProgress(xp);
  const nextUnlock = getNextLabUnlock(level);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));

        const userId = JSON.parse(storedUser || "{}").id;
        if (!userId) return;

        const [labsData, compData, cohortsData, examsData] = await Promise.allSettled([
          fetchApi<ActiveLab[]>("/dashboard/active-labs"),
          fetchApi<CompetencyData>(`/learning-outcomes/competency-profile/${userId}/enhanced`),
          fetchApi<CohortInfo[]>("/navigation/context").then(ctx => {
            // Extract cohort info from navigation alerts
            const cohortAlerts = (ctx as any).alerts?.filter((a: any) => a.type === "COHORT_ACTIVE") || [];
            return cohortAlerts.map((a: any) => ({
              cohortId: a.href?.split("/").pop() || "",
              cohortName: a.title,
              curriculumName: a.description?.replace("Curriculum: ", "") || null,
              role: "STUDENT",
            }));
          }),
          fetchApi<ExamInfo[]>("/navigation/context").then(ctx => {
            // Extract exam info from navigation alerts
            const examAlerts = (ctx as any).alerts?.filter((a: any) => a.type === "EXAM_AVAILABLE") || [];
            return examAlerts.map((a: any) => ({
              assessmentId: a.href?.split("/").pop() || "",
              title: a.title,
              status: "AVAILABLE",
              score: null,
              maxScore: 100,
            }));
          }),
        ]);

        if (!cancelled) {
          if (labsData.status === "fulfilled") setActiveLabs(labsData.value);
          if (compData.status === "fulfilled") setCompetency(compData.value);
          if (cohortsData.status === "fulfilled") setCohorts(cohortsData.value);
          if (examsData.status === "fulfilled") setExams(examsData.value);
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
  const topRecs = competency?.recommendations?.slice(0, 3) || [];
  const domains = competency?.domains || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ─── COMMAND CENTER HEADER ─── */}
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
            {getTimeGreeting()}, {userName.split(" ")[0]}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            {getGreetingSubtext(xp)}
          </h1>

          {/* Level + XP Progress */}
          {config.showXp && (
            <div className="mt-6 flex items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <span className="text-2xl font-bold">{String(level).padStart(2, "0")}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-white/80">Level {level}</span>
                  <span className="text-sm font-mono text-white/60">
                    {xp.toLocaleString()} / {((level) * 1000).toLocaleString()} XP
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7AD62A] to-[#229C62] rounded-full transition-all duration-500"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                {nextUnlock && (
                  <p className="text-xs text-white/50 mt-1.5">
                    Next unlock: Level {nextUnlock.requiredLevel} labs
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── ACTIVE LAB ─── */}
      {activeLabs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#229C62] animate-pulse" />
              <h2 className="text-sm font-semibold text-slate-900">Active Lab</h2>
            </div>
          </div>
          <div className="p-5">
            {activeLabs.slice(0, 1).map((lab) => (
              <Link
                key={lab.id}
                href={`/dashboard/labs/${lab.labId}`}
                className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#E9F8EE] to-white border border-[#229C62]/20 hover:border-[#229C62]/40 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#229C62] flex items-center justify-center">
                    <FlaskConical size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-[#229C62] transition-colors">
                      {lab.lab.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-500">
                        Difficulty {lab.lab.difficulty}
                      </span>
                      {lab.port && (
                        <span className="text-[11px] text-slate-400 font-mono">:{lab.port}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#229C62]">
                  <span className="text-sm font-medium group-hover:underline">Continue</span>
                  <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── COHORT (only if enrolled) ─── */}
      {cohorts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">My Cohort</h2>
            <Link href="/dashboard/cohorts" className="text-xs text-[#229C62] hover:underline font-medium">
              View all
            </Link>
          </div>
          {cohorts.map((c) => (
            <Link
              key={c.cohortId}
              href={`/dashboard/cohorts/${c.cohortId}`}
              className="block p-3 rounded-lg bg-slate-50 hover:bg-[#E9F8EE]/50 transition-colors"
            >
              <p className="text-sm font-medium text-slate-900">{c.cohortName}</p>
              {c.curriculumName && (
                <p className="text-xs text-slate-500 mt-0.5">{c.curriculumName}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* ─── EXAMS (only if enrolled) ─── */}
      {exams.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">My Exams</h2>
            <Link href="/dashboard/exams" className="text-xs text-[#229C62] hover:underline font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {exams.map((exam) => (
              <Link
                key={exam.assessmentId}
                href={`/dashboard/exams/${exam.assessmentId}`}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-[#E9F8EE]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <ClipboardCheck size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{exam.title}</p>
                    <p className="text-[11px] text-slate-500">{exam.status === "AVAILABLE" ? "Ready to start" : exam.status}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>
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
              href="/dashboard/competency"
              className="text-xs text-[#229C62] hover:text-[#1a7a4d] font-medium flex items-center gap-1"
            >
              Full profile <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {domains.slice(0, 6).map((d) => (
              <DomainBar key={d.domainId} domain={d.domainName} score={d.score} />
            ))}
          </div>
        </div>
      )}

      {/* ─── NEXT STEPS ─── */}
      {topRecs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-[#229C62]" />
            <h2 className="text-sm font-semibold text-slate-900">What to do next</h2>
          </div>
          <div className="space-y-2">
            {topRecs.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-[#E9F8EE]/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E9F8EE] flex items-center justify-center shrink-0 mt-0.5">
                  {rec.type === "LAB" && <FlaskConical size={14} className="text-[#229C62]" />}
                  {rec.type === "OUTCOME" && <BookOpen size={14} className="text-violet-500" />}
                  {rec.type === "ASSESSMENT" && <Target size={14} className="text-blue-500" />}
                  {rec.type === "MAINTAIN" && <Clock size={14} className="text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{rec.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{rec.description}</p>
                </div>
                {rec.link && (
                  <Link href={rec.link} className="text-xs text-[#229C62] hover:underline shrink-0">
                    Go
                  </Link>
                )}
              </div>
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
          href="/dashboard/genome"
          className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all"
        >
          <TrendingUp size={20} className="text-purple-500 mb-2" />
          <p className="text-sm font-semibold text-slate-900">Skills</p>
          <p className="text-xs text-slate-500">Your genome</p>
        </Link>
        <Link
          href="/dashboard/challenges"
          className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all"
        >
          <Target size={20} className="text-amber-500 mb-2" />
          <p className="text-sm font-semibold text-slate-900">Challenges</p>
          <p className="text-xs text-slate-500">Test yourself</p>
        </Link>
      </div>
    </div>
  );
}
