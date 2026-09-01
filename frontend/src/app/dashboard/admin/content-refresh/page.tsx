"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import EmptyState from "@/components/ui/EmptyState";

interface ContentRelevanceScore {
  id: string;
  type: "lab" | "course";
  title: string;
  relevanceScore: number;
  freshnessScore: number;
  overallScore: number;
  issues: string[];
  suggestions: string[];
  lastUpdated: string;
  daysSinceUpdate: number;
}

interface ContentFreshnessReport {
  totalLabs: number;
  totalCourses: number;
  staleLabs: number;
  staleCourses: number;
  outdatedLabs: number;
  outdatedCourses: number;
  avgLabRelevance: number;
  avgCourseRelevance: number;
  avgLabFreshness: number;
  avgCourseFreshness: number;
  labsNeedingRefresh: Array<{
    id: string;
    title: string;
    score: number;
    daysSinceUpdate: number;
  }>;
  coursesNeedingRefresh: Array<{
    id: string;
    title: string;
    score: number;
    daysSinceUpdate: number;
  }>;
  domainBreakdown: Array<{
    domain: string;
    avgRelevance: number;
    count: number;
  }>;
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 80) {
    return <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">{score} Good</span>;
  }
  if (score >= 60) {
    return <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">{score} Fair</span>;
  }
  return <span className="rounded-full border border-red-400/20 bg-red-500/10 px-2 py-0.5 text-xs text-red-300">{score} Needs work</span>;
}

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min((score / max) * 100, 100);
  const color = score >= 80 ? "#229C62" : score >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function ScoreCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  icon: typeof AlertTriangle;
}) {
  return (
    <div className="angular-card border border-white/10 bg-[#0f172a] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} style={{ color }} />
        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</span>
      </div>
      <p className="text-3xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-300">{sub}</p>
    </div>
  );
}

export default function ContentRefreshDashboard() {
  const [report, setReport] = useState<ContentFreshnessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [allScores, setAllScores] = useState<{
    labs: ContentRelevanceScore[];
    courses: ContentRelevanceScore[];
  } | null>(null);
  const [tab, setTab] = useState<"overview" | "labs" | "courses" | "domains">("overview");

  useEffect(() => {
    let cancelled = false;

    fetchApi("/ai/content-refresh/report")
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((err) => {
        console.error("Failed to load report:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function scoreAll() {
    setScoring(true);
    try {
      const data = await fetchApi("/ai/content-refresh/score-all");
      setAllScores(data);
    } catch (err) {
      console.error("Failed to score content:", err);
    } finally {
      setScoring(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-[#7AD62A]" size={32} />
      </div>
    );
  }

  if (!report) {
    return <EmptyState icon={RefreshCw} title="No content data available" description="" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 lg:px-6">
        <div className="angular-card overflow-hidden border border-white/10 bg-gradient-to-br from-[#0F203A] via-slate-900 to-[#16315c] p-6 sm:p-8">
          <Link href="/dashboard/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#7AD62A] transition-colors">
            <ArrowLeft size={14} />
            Return to admin operations
          </Link>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7AD62A]/10">
                  <RefreshCw size={24} className="text-[#7AD62A]" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Content Refresh Command</h1>
                  <p className="text-slate-300">
                    Monitor curriculum freshness, prioritize review queues, and keep certification pathways aligned with current practice.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Review Standard</p>
                  <p className="mt-2 font-medium text-white">Refresh learning assets before they exceed 90 days without a verified update.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Operator Goal</p>
                  <p className="mt-2 font-medium text-white">Protect relevance, exam alignment, and practical accuracy across labs and courses.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Next Action</p>
                  <p className="mt-2 font-medium text-white">Run AI scoring after major curriculum edits and resolve the lowest overall scores first.</p>
                </div>
              </div>
            </div>
            <button
              onClick={scoreAll}
              disabled={scoring}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#229C62] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1c7c4e] disabled:opacity-50"
            >
              {scoring ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {scoring ? "Scoring content..." : "Run AI scoring"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-[#0f172a] p-1.5">
          {[
            { key: "overview", label: "Overview" },
            { key: "labs", label: "Labs" },
            { key: "courses", label: "Courses" },
            { key: "domains", label: "Domains" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key as typeof tab)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                tab === item.key ? "bg-[#7AD62A] text-[#0F203A]" : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ScoreCard label="Total Labs" value={report.totalLabs} sub={`${report.staleLabs} stale`} icon={AlertTriangle} color={report.staleLabs > 0 ? "#F59E0B" : "#229C62"} />
              <ScoreCard label="Total Courses" value={report.totalCourses} sub={`${report.staleCourses} stale`} icon={AlertTriangle} color={report.staleCourses > 0 ? "#F59E0B" : "#229C62"} />
              <ScoreCard label="Avg Lab Relevance" value={`${report.avgLabRelevance}%`} sub={`${report.outdatedLabs} outdated`} icon={TrendingUp} color={report.avgLabRelevance >= 70 ? "#229C62" : "#EF4444"} />
              <ScoreCard label="Avg Course Relevance" value={`${report.avgCourseRelevance}%`} sub={`${report.outdatedCourses} outdated`} icon={TrendingUp} color={report.avgCourseRelevance >= 70 ? "#229C62" : "#EF4444"} />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FreshnessPanel title="Lab Freshness" score={report.avgLabFreshness} stale={report.staleLabs} total={report.totalLabs} />
              <FreshnessPanel title="Course Freshness" score={report.avgCourseFreshness} stale={report.staleCourses} total={report.totalCourses} />
            </div>

            {(report.labsNeedingRefresh.length > 0 || report.coursesNeedingRefresh.length > 0) && (
              <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <AlertTriangle size={16} className="text-amber-500" />
                  Content Needing Refresh
                </h3>
                <div className="space-y-2">
                  {report.labsNeedingRefresh.map((lab) => (
                    <QueueRow key={lab.id} type="Lab" title={lab.title} score={lab.score} daysSinceUpdate={lab.daysSinceUpdate} />
                  ))}
                  {report.coursesNeedingRefresh.map((course) => (
                    <QueueRow key={course.id} type="Course" title={course.title} score={course.score} daysSinceUpdate={course.daysSinceUpdate} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "labs" && allScores && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Lab Relevance Scores ({allScores.labs.length})</h3>
            {allScores.labs.sort((a, b) => a.overallScore - b.overallScore).map((lab) => (
              <ContentScoreCard key={lab.id} score={lab} label="Lab" accent="text-blue-300 bg-blue-500/10" />
            ))}
          </div>
        )}

        {tab === "courses" && allScores && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Course Relevance Scores ({allScores.courses.length})</h3>
            {allScores.courses.sort((a, b) => a.overallScore - b.overallScore).map((course) => (
              <ContentScoreCard key={course.id} score={course} label="Course" accent="text-violet-300 bg-violet-500/10" />
            ))}
          </div>
        )}

        {tab === "domains" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Domain Relevance Breakdown</h3>
            {report.domainBreakdown.length === 0 ? (
              <p className="text-sm text-slate-400">No domain data available</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {report.domainBreakdown.map((domain) => (
                  <div key={domain.domain} className="angular-card border border-white/10 bg-[#0f172a] p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-white">{domain.domain}</span>
                      <ScoreBadge score={domain.avgRelevance} />
                    </div>
                    <ScoreBar score={domain.avgRelevance} />
                    <p className="mt-2 text-xs text-slate-400">{domain.count} lab(s)</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!allScores && (tab === "labs" || tab === "courses") && (
          <div className="py-12 text-center">
            <Sparkles size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="mb-3 text-sm text-slate-400">Run AI scoring to analyze content relevance and populate the review queue.</p>
            <button
              onClick={scoreAll}
              disabled={scoring}
              className="rounded-lg bg-[#229C62] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {scoring ? "Scoring..." : "Score All Content"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FreshnessPanel({
  title,
  score,
  stale,
  total,
}: {
  title: string;
  score: number;
  stale: number;
  total: number;
}) {
  return (
    <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Clock size={16} className="text-blue-400" />
        {title}
      </h3>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#334155" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke={score >= 70 ? "#229C62" : "#F59E0B"}
              strokeWidth="3"
              strokeDasharray={`${score} 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">{score}%</span>
        </div>
        <div className="text-sm text-slate-200">
          <p>
            {stale} of {total} items are stale
          </p>
          <p className="mt-1 text-xs text-slate-400">Assets older than 90 days should enter formal review.</p>
        </div>
      </div>
    </div>
  );
}

function QueueRow({
  type,
  title,
  score,
  daysSinceUpdate,
}: {
  type: "Lab" | "Course";
  title: string;
  score: number;
  daysSinceUpdate: number;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-white/10 py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-xs ${type === "Lab" ? "bg-blue-500/10 text-blue-300" : "bg-violet-500/10 text-violet-300"}`}>
          {type}
        </span>
        <span className="text-sm text-white">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <ScoreBadge score={score} />
        <span className="text-xs text-slate-400">{daysSinceUpdate}d ago</span>
      </div>
    </div>
  );
}

function ContentScoreCard({
  score,
  label,
  accent,
}: {
  score: ContentRelevanceScore;
  label: string;
  accent: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="angular-card overflow-hidden border border-white/10 bg-[#0f172a]">
      <button
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <span className={`rounded px-1.5 py-0.5 text-xs ${accent}`}>{label}</span>
          <span className="text-sm font-medium text-white">{score.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={score.overallScore} />
          <ArrowRight size={14} className={`text-slate-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>
      {expanded && (
        <div className="space-y-3 border-t border-white/10 px-4 pb-4 pt-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ScoreDetail label="Relevance" score={score.relevanceScore} />
            <ScoreDetail label="Freshness" score={score.freshnessScore} />
            <ScoreDetail label="Overall" score={score.overallScore} />
          </div>
          {score.issues.length > 0 && (
            <div>
              <span className="mb-1 block text-xs font-medium text-slate-300">Issues</span>
              <ul className="space-y-1">
                {score.issues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-1 text-xs text-red-300">
                    <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {score.suggestions.length > 0 && (
            <div>
              <span className="mb-1 block text-xs font-medium text-slate-300">Suggestions</span>
              <ul className="space-y-1">
                {score.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-1 text-xs text-[#7AD62A]">
                    <CheckCircle size={10} className="mt-0.5 flex-shrink-0" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreDetail({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <span className="text-xs text-slate-400">{label}</span>
      <ScoreBar score={score} />
      <span className="text-xs font-medium text-white">{score}%</span>
    </div>
  );
}
