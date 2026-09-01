"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  FileText,
  Clock,
  Target,
  Users,
  Loader2,
  Award,
  BarChart3,
  Play,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

interface Assessment {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  maxScore: number;
  passingScore: number;
  maxAttempts: number;
  isProctored: boolean;
  domain: { name: string } | null;
  scenarios: { id: string; title: string; description: string; maxScore: number }[];
  outcomes: { outcome: { code: string; title: string }; weight: number }[];
  _count: { attempts: number };
}

interface Attempt {
  attemptId: string;
  student: { id: string; name: string; email: string };
  score: number;
  letterGrade: string;
  completedAt: string;
  duration: number;
}

interface GradeReport {
  attemptId: string;
  student: { id: string; name: string; email: string };
  exam: { id: string; title: string; domain: string | null };
  date: string;
  duration: number;
  timeLimit: number;
  scores: {
    correctness: number;
    methodology: number;
    timeEfficiency: number;
    independence: number;
    finalState: number;
  };
  overallGrade: number;
  letterGrade: string;
  outcomeBreakdown: { outcomeId: string; code: string; title: string; domain: string; score: number }[];
}

function gradeTone(score: number) {
  if (score >= 90) return "bg-[#7AD62A]/10 text-[#7AD62A]";
  if (score >= 70) return "bg-blue-500/10 text-blue-300";
  if (score >= 60) return "bg-amber-500/10 text-amber-300";
  return "bg-red-500/10 text-red-300";
}

export default function ExamDetailPage() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [stats, setStats] = useState<{ totalAttempts: number; avgScore: number; passRate: number } | null>(null);
  const [selectedReport, setSelectedReport] = useState<GradeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "attempts" | "report">("overview");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [a, at, st] = await Promise.all([
          fetchApi(`/practical-assessments/${id}`),
          fetchApi(`/exams/${id}/attempts`).catch(() => []),
          fetchApi(`/exams/${id}/stats`).catch(() => null),
        ]);
        if (!cancelled) {
          setAssessment(a);
          setAttempts(at);
          setStats(st);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleStart = async () => {
    setStarting(true);
    try {
      await fetchApi(`/practical-assessments/${id}/start`, { method: "POST" });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setStarting(false);
    }
  };

  const loadReport = async (attemptId: string) => {
    try {
      const report = await fetchApi(`/exams/attempts/${attemptId}/report`);
      setSelectedReport(report);
      setActiveTab("report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#7AD62A]" />
      </div>
    );
  }

  if (error || !assessment) {
    return <div className="text-center py-20 text-red-500 text-sm">{error || "Not found"}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/exams"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#7AD62A] transition-colors mb-3"
        >
          <ChevronLeft size={16} />
          All exams
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-start gap-2 text-2xl font-bold text-white">
              <FileText size={28} className="text-[#7AD62A]" />
              <span>{assessment.title}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">{assessment.description}</p>
          </div>
          <button
            onClick={handleStart}
            disabled={starting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#7AD62A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0F203A] disabled:opacity-50 sm:w-auto"
          >
            {starting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
            {starting ? "Starting..." : "Start Exam"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4 text-center">
          <Clock size={18} className="mx-auto mb-1 text-[#7AD62A]" />
          <div className="text-xl font-bold text-white">{assessment.timeLimit}m</div>
          <div className="text-xs text-slate-500">Time Limit</div>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4 text-center">
          <Target size={18} className="mx-auto mb-1 text-[#7AD62A]" />
          <div className="text-xl font-bold text-white">{assessment.scenarios.length}</div>
          <div className="text-xs text-slate-500">Scenarios</div>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4 text-center">
          <Award size={18} className="mx-auto mb-1 text-[#7AD62A]" />
          <div className="text-xl font-bold text-white">{assessment.passingScore}%</div>
          <div className="text-xs text-slate-500">Passing Score</div>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4 text-center">
          <Users size={18} className="mx-auto mb-1 text-[#7AD62A]" />
          <div className="text-xl font-bold text-white">{stats?.totalAttempts ?? 0}</div>
          <div className="text-xs text-slate-500">Attempts</div>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4 text-center">
          <BarChart3 size={18} className="mx-auto mb-1 text-[#7AD62A]" />
          <div className="text-xl font-bold text-white">{stats?.avgScore ?? 0}%</div>
          <div className="text-xs text-slate-500">Avg Score</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-4">
        <div className="angular-card bg-[#0f172a] border border-white/10 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Assessment Integrity</p>
          <h2 className="text-xl font-bold text-white mt-2">A controlled assessment tied to credential evidence</h2>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            Your performance here becomes part of the record behind certificate eligibility and employer trust. Review the rules before you begin and treat this attempt as an auditable outcome.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            {[
              { title: "Defined threshold", text: `${assessment.passingScore}% required to pass`, icon: Target },
              { title: "Attempt control", text: `${assessment.maxAttempts} allowed attempt${assessment.maxAttempts !== 1 ? "s" : ""}`, icon: ClipboardCheck },
              { title: "Verification value", text: "Reports contribute to readiness evidence", icon: FileCheck },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <item.icon size={16} className="text-[#7AD62A] mb-2" />
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-slate-400 mt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="angular-card bg-[#0f172a] border border-[#7AD62A]/20 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Candidate Checklist</p>
          <div className="space-y-3 mt-4">
            {[
              "Review the scenario scope and expected outcomes before starting.",
              `Reserve up to ${assessment.timeLimit} uninterrupted minutes for this attempt.`,
              assessment.isProctored ? "Stay within proctoring rules and approved materials only." : "Work independently and document your reasoning clearly.",
              "Use this attempt only when you are ready to create a meaningful result on record.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 size={14} className="text-[#7AD62A] shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="angular-card bg-[#0f172a] border border-white/10 p-5 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Assessment Rules</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            {[
              `Passing score: ${assessment.passingScore}%`,
              `Attempt limit: ${assessment.maxAttempts}`,
              assessment.isProctored ? "Proctoring enabled" : "Unproctored practical",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="angular-card bg-[#0f172a] border border-[#7AD62A]/20 p-5">
          <div className="flex items-center gap-2">
            <FileCheck size={16} className="text-[#7AD62A]" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Why it matters</p>
          </div>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            This exam contributes to the evidence layer behind your future credential. Serious assessments improve issuer trust and employer confidence.
          </p>
        </div>
      </div>

      {/* Proctoring Banner */}
      {assessment.isProctored && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-500/10 p-4 sm:flex-row sm:items-center">
          <AlertTriangle size={20} className="text-amber-300 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-200">Proctored Exam</p>
            <p className="text-xs text-amber-100/80">
              This exam is monitored. Max {assessment.maxAttempts} attempt{assessment.maxAttempts !== 1 ? "s" : ""} allowed.
              Time limit: {assessment.timeLimit} minutes. Passing score: {assessment.passingScore}%.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
        {[
          { key: "overview" as const, label: "Overview" },
          { key: "attempts" as const, label: "Attempts" },
          ...(selectedReport ? [{ key: "report" as const, label: "Grade Report" }] : []),
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[#0a0f1a] text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Learning Outcomes */}
          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
            <h3 className="text-sm font-semibold text-white mb-3">Learning Outcomes</h3>
            <div className="space-y-2">
              {assessment.outcomes.map((o) => (
                <div key={o.outcome.code} className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[#7AD62A] font-mono text-xs">{o.outcome.code}</span>
                    <span className="text-slate-300">{o.outcome.title}</span>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{o.weight}% weight</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scenarios */}
          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
            <h3 className="text-sm font-semibold text-white mb-3">Scenarios</h3>
            <div className="space-y-3">
              {assessment.scenarios.map((s, i) => (
                <div key={s.id} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium text-white">
                      {i + 1}. {s.title}
                    </span>
                    <span className="text-xs text-slate-500">{s.maxScore} pts</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Attempts Tab */}
      {activeTab === "attempts" && (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden">
          {attempts.length === 0 ? (
            <EmptyState icon={FileText} title="No attempts yet" description="When you complete an exam attempt, the score report and evidence summary will appear here." />
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Student</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Score</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Grade</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Duration</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {attempts.map((a) => (
                      <tr key={a.attemptId} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-3">
                          <div className="text-sm font-medium text-white">
                            {a.student.name || a.student.email.split("@")[0]}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className="text-sm font-semibold text-white">{a.score}%</span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${gradeTone(a.score)}`}>
                            {a.letterGrade}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center text-sm text-slate-500">
                          {a.duration}m
                        </td>
                        <td className="px-6 py-3 text-center text-xs text-slate-500">
                          {new Date(a.completedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <button
                            onClick={() => loadReport(a.attemptId)}
                            className="text-xs text-[#7AD62A] hover:underline font-medium"
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 md:hidden">
                {attempts.map((a) => (
                  <div key={a.attemptId} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{a.student.name || a.student.email.split("@")[0]}</p>
                        <p className="text-xs text-slate-500 mt-1">{new Date(a.completedAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${gradeTone(a.score)}`}>
                        {a.letterGrade}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="rounded-lg border border-white/10 bg-[#0f172a] p-3 text-center">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Score</p>
                        <p className="text-sm font-semibold text-white mt-1">{a.score}%</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-[#0f172a] p-3 text-center">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Duration</p>
                        <p className="text-sm font-semibold text-white mt-1">{a.duration}m</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-[#0f172a] p-3 text-center">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Report</p>
                        <button
                          onClick={() => loadReport(a.attemptId)}
                          className="mt-1 text-sm font-semibold text-[#7AD62A]"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Grade Report Tab */}
      {activeTab === "report" && selectedReport && (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-5 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white mb-1">Practical Examination Report</h2>
            <p className="text-sm text-slate-500">{selectedReport.exam.title}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Result</p>
              <p className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-sm font-bold ${gradeTone(selectedReport.overallGrade)}`}>
                {selectedReport.overallGrade >= assessment.passingScore ? "Passed" : "Not passed"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Passing score</p>
              <p className="text-lg font-bold text-white mt-2">{assessment.passingScore}%</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Credential impact</p>
              <p className="text-sm text-slate-300 mt-2">This report strengthens the evidence used for credential decisions.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            <div>
              <div className="text-xs text-slate-500 uppercase mb-1">Student</div>
              <div className="text-sm font-medium text-white">
                {selectedReport.student.name || selectedReport.student.email}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase mb-1">Date</div>
              <div className="text-sm font-medium text-white">
                {new Date(selectedReport.date).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase mb-1">Duration</div>
              <div className="text-sm font-medium text-white">
                {selectedReport.duration} min (limit: {selectedReport.timeLimit})
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-white mb-3">Scoring</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(selectedReport.scores).map(([key, value]) => (
                <div key={key} className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-white">{value}%</div>
                  <div className="text-xs text-slate-500 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center p-4 bg-[#7AD62A]/10 rounded-xl">
              <div className="text-3xl font-bold text-[#0F203A]">
                {selectedReport.overallGrade}% ({selectedReport.letterGrade})
              </div>
              <div className="text-sm text-[#7AD62A] mt-1">Overall Grade</div>
            </div>
          </div>

          {/* Outcome Breakdown */}
          {selectedReport.outcomeBreakdown.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Learning Outcomes</h3>
              <div className="space-y-2">
                {selectedReport.outcomeBreakdown.map((o) => (
                  <div key={o.outcomeId} className="flex flex-col gap-2 rounded-lg bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#7AD62A]">{o.code}</span>
                      <span className="text-sm text-slate-300">{o.title}</span>
                    </div>
                    <span className="text-sm font-medium text-white">{o.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
