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
  History,
  Shield,
} from "lucide-react";

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
          fetchApi(`/assessments/${id}`),
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
      await fetchApi(`/assessments/${id}/start`, { method: "POST" });
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
        <Loader2 size={24} className="animate-spin text-[#229C62]" />
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
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#229C62] transition-colors mb-3"
        >
          <ChevronLeft size={16} />
          All exams
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText size={28} className="text-[#229C62]" />
              {assessment.title}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{assessment.description}</p>
          </div>
          <button
            onClick={handleStart}
            disabled={starting}
            className="px-4 py-2 bg-[#229C62] hover:bg-[#0F203A] disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            {starting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
            {starting ? "Starting..." : "Start Exam"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <Clock size={18} className="mx-auto mb-1 text-[#229C62]" />
          <div className="text-xl font-bold text-slate-900">{assessment.timeLimit}m</div>
          <div className="text-xs text-slate-500">Time Limit</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <Target size={18} className="mx-auto mb-1 text-[#229C62]" />
          <div className="text-xl font-bold text-slate-900">{assessment.scenarios.length}</div>
          <div className="text-xs text-slate-500">Scenarios</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <Award size={18} className="mx-auto mb-1 text-[#229C62]" />
          <div className="text-xl font-bold text-slate-900">{assessment.passingScore}%</div>
          <div className="text-xs text-slate-500">Passing Score</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <Users size={18} className="mx-auto mb-1 text-[#229C62]" />
          <div className="text-xl font-bold text-slate-900">{stats?.totalAttempts ?? 0}</div>
          <div className="text-xs text-slate-500">Attempts</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <BarChart3 size={18} className="mx-auto mb-1 text-[#229C62]" />
          <div className="text-xl font-bold text-slate-900">{stats?.avgScore ?? 0}%</div>
          <div className="text-xs text-slate-500">Avg Score</div>
        </div>
      </div>

      {/* Proctoring Banner */}
      {assessment.isProctored && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Shield size={20} className="text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Proctored Exam</p>
            <p className="text-xs text-amber-600">
              This exam is monitored. Max {assessment.maxAttempts} attempt{assessment.maxAttempts !== 1 ? "s" : ""} allowed.
              Time limit: {assessment.timeLimit} minutes. Passing score: {assessment.passingScore}%.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
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
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Learning Outcomes */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Learning Outcomes</h3>
            <div className="space-y-2">
              {assessment.outcomes.map((o) => (
                <div key={o.outcome.code} className="flex items-center gap-2 text-sm">
                  <span className="text-[#229C62] font-mono text-xs">{o.outcome.code}</span>
                  <span className="text-slate-700">{o.outcome.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scenarios */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Scenarios</h3>
            <div className="space-y-3">
              {assessment.scenarios.map((s, i) => (
                <div key={s.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">
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
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {attempts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No attempts yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Student</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Score</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Grade</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Duration</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((a) => (
                  <tr key={a.attemptId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="text-sm font-medium text-slate-900">
                        {a.student.name || a.student.email.split("@")[0]}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="text-sm font-semibold text-slate-900">{a.score}%</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          a.score >= 90
                            ? "bg-[#E9F8EE] text-[#229C62]"
                            : a.score >= 70
                            ? "bg-blue-50 text-blue-600"
                            : a.score >= 60
                            ? "bg-amber-50 text-amber-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
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
                        className="text-xs text-[#229C62] hover:underline font-medium"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Grade Report Tab */}
      {activeTab === "report" && selectedReport && (
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Practical Examination Report</h2>
            <p className="text-sm text-slate-500">{selectedReport.exam.title}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            <div>
              <div className="text-xs text-slate-500 uppercase mb-1">Student</div>
              <div className="text-sm font-medium text-slate-900">
                {selectedReport.student.name || selectedReport.student.email}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase mb-1">Date</div>
              <div className="text-sm font-medium text-slate-900">
                {new Date(selectedReport.date).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase mb-1">Duration</div>
              <div className="text-sm font-medium text-slate-900">
                {selectedReport.duration} min (limit: {selectedReport.timeLimit})
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Scoring</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(selectedReport.scores).map(([key, value]) => (
                <div key={key} className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="text-lg font-bold text-slate-900">{value}%</div>
                  <div className="text-xs text-slate-500 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center p-4 bg-[#E9F8EE] rounded-xl">
              <div className="text-3xl font-bold text-[#0F203A]">
                {selectedReport.overallGrade}% ({selectedReport.letterGrade})
              </div>
              <div className="text-sm text-[#229C62] mt-1">Overall Grade</div>
            </div>
          </div>

          {/* Outcome Breakdown */}
          {selectedReport.outcomeBreakdown.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Learning Outcomes</h3>
              <div className="space-y-2">
                {selectedReport.outcomeBreakdown.map((o) => (
                  <div key={o.outcomeId} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#229C62]">{o.code}</span>
                      <span className="text-sm text-slate-700">{o.title}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">{o.score}%</span>
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
