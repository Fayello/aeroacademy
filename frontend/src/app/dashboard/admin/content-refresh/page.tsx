"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import {
  RefreshCw,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Sparkles,
  ArrowRight,
} from "lucide-react";
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
  if (score >= 80)
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        {score} Good
      </span>
    );
  if (score >= 60)
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        {score} Fair
      </span>
    );
  return (
    <span className="px-2 py-0.5 text-xs rounded-full bg-red-50 text-red-700 border border-red-200">
      {score} Needs Work
    </span>
  );
}

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min((score / max) * 100, 100);
  const color =
    score >= 80 ? "#229C62" : score >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: color }}
      />
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
  const [tab, setTab] = useState<"overview" | "labs" | "courses" | "domains">(
    "overview"
  );

  useEffect(() => {
    fetchReport();
  }, []);

  async function fetchReport() {
    try {
      const data = await fetchApi("/ai/content-refresh/report");
      setReport(data);
    } catch (err) {
      console.error("Failed to load report:", err);
    } finally {
      setLoading(false);
    }
  }

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#229C62]" size={32} />
      </div>
    );
  }

  if (!report) {
    return (
      <EmptyState icon={RefreshCw} title="No content data available" description="" />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Hero */}
      <div className="py-16 px-4" style={{ background: "#0F203A" }}>
        <div className="max-w-6xl mx-auto">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-1.5 text-sm mb-4 transition-colors"
            style={{ color: "#7AD62A" }}
          >
            <ArrowLeft size={14} />
            Admin Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(122,214,42,0.15)" }}
              >
                <RefreshCw size={24} style={{ color: "#7AD62A" }} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Content Refresh
                </h1>
                <p className="text-slate-400">
                  AI-powered content relevance & freshness monitoring
                </p>
              </div>
            </div>
            <button
              onClick={scoreAll}
              disabled={scoring}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: "#229C62", color: "white" }}
            >
              {scoring ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {scoring ? "Scoring..." : "AI Score All"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-lg p-1 border border-slate-200 w-fit">
          {[
            { key: "overview", label: "Overview" },
            { key: "labs", label: "Labs" },
            { key: "courses", label: "Courses" },
            { key: "domains", label: "Domains" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as Any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t.key
                  ? "bg-[#229C62] text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Labs",
                  value: report.totalLabs,
                  sub: `${report.staleLabs} stale`,
                  icon: AlertTriangle,
                  color:
                    report.staleLabs > 0 ? "#F59E0B" : "#229C62",
                },
                {
                  label: "Total Courses",
                  value: report.totalCourses,
                  sub: `${report.staleCourses} stale`,
                  icon: AlertTriangle,
                  color:
                    report.staleCourses > 0 ? "#F59E0B" : "#229C62",
                },
                {
                  label: "Avg Lab Relevance",
                  value: `${report.avgLabRelevance}%`,
                  sub: `${report.outdatedLabs} outdated`,
                  icon: TrendingUp,
                  color:
                    report.avgLabRelevance >= 70 ? "#229C62" : "#EF4444",
                },
                {
                  label: "Avg Course Relevance",
                  value: `${report.avgCourseRelevance}%`,
                  sub: `${report.outdatedCourses} outdated`,
                  icon: TrendingUp,
                  color:
                    report.avgCourseRelevance >= 70
                      ? "#229C62"
                      : "#EF4444",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="angular-card bg-white p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon size={16} style={{ color: stat.color }} />
                    <span className="text-xs text-slate-500">
                      {stat.label}
                    </span>
                  </div>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Freshness gauges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="angular-card bg-white p-6">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-blue-500" />
                  Lab Freshness
                </h3>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke={
                          report.avgLabFreshness >= 70
                            ? "#229C62"
                            : "#F59E0B"
                        }
                        strokeWidth="3"
                        strokeDasharray={`${report.avgLabFreshness} 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                      {report.avgLabFreshness}%
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>
                      {report.staleLabs} of {report.totalLabs} labs are stale
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      (&gt;90 days since last update)
                    </p>
                  </div>
                </div>
              </div>

              <div className="angular-card bg-white p-6">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-blue-500" />
                  Course Freshness
                </h3>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke={
                          report.avgCourseFreshness >= 70
                            ? "#229C62"
                            : "#F59E0B"
                        }
                        strokeWidth="3"
                        strokeDasharray={`${report.avgCourseFreshness} 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                      {report.avgCourseFreshness}%
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>
                      {report.staleCourses} of {report.totalCourses} courses
                      are stale
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      (&gt;90 days since last update)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Needs refresh */}
            {(report.labsNeedingRefresh.length > 0 ||
              report.coursesNeedingRefresh.length > 0) && (
              <div className="angular-card bg-white p-6">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  Content Needing Refresh
                </h3>
                <div className="space-y-2">
                  {report.labsNeedingRefresh.map((lab) => (
                    <div
                      key={lab.id}
                      className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                          Lab
                        </span>
                        <span className="text-sm">{lab.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <ScoreBadge score={lab.score} />
                        <span className="text-xs text-slate-400">
                          {lab.daysSinceUpdate}d ago
                        </span>
                      </div>
                    </div>
                  ))}
                  {report.coursesNeedingRefresh.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
                          Course
                        </span>
                        <span className="text-sm">{course.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <ScoreBadge score={course.score} />
                        <span className="text-xs text-slate-400">
                          {course.daysSinceUpdate}d ago
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Labs tab */}
        {tab === "labs" && allScores && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">
              Lab Relevance Scores ({allScores.labs.length})
            </h3>
            {allScores.labs
              .sort((a, b) => a.overallScore - b.overallScore)
              .map((lab) => (
                <LabScoreCard key={lab.id} score={lab} />
              ))}
          </div>
        )}

        {/* Courses tab */}
        {tab === "courses" && allScores && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">
              Course Relevance Scores ({allScores.courses.length})
            </h3>
            {allScores.courses
              .sort((a, b) => a.overallScore - b.overallScore)
              .map((course) => (
                <CourseScoreCard key={course.id} score={course} />
              ))}
          </div>
        )}

        {/* Domains tab */}
        {tab === "domains" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Domain Relevance Breakdown</h3>
            {report.domainBreakdown.length === 0 ? (
              <p className="text-sm text-slate-400">
                No domain data available
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.domainBreakdown.map((d) => (
                  <div
                    key={d.domain}
                    className="angular-card bg-white p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{d.domain}</span>
                      <ScoreBadge score={d.avgRelevance} />
                    </div>
                    <ScoreBar score={d.avgRelevance} />
                    <p className="text-xs text-slate-400 mt-1">
                      {d.count} lab(s)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!allScores && (tab === "labs" || tab === "courses") && (
          <div className="text-center py-12">
            <Sparkles size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 mb-3">
              Click &quot;AI Score All&quot; to analyze content relevance
            </p>
            <button
              onClick={scoreAll}
              disabled={scoring}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ background: "#229C62" }}
            >
              {scoring ? "Scoring..." : "Score All Content"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LabScoreCard({ score }: { score: ContentRelevanceScore }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="angular-card bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
            Lab
          </span>
          <span className="font-medium text-sm text-left">{score.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={score.overallScore} />
          <ArrowRight
            size={14}
            className={`text-slate-400 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-xs text-slate-500">Relevance</span>
              <ScoreBar score={score.relevanceScore} />
              <span className="text-xs font-medium">{score.relevanceScore}%</span>
            </div>
            <div>
              <span className="text-xs text-slate-500">Freshness</span>
              <ScoreBar score={score.freshnessScore} />
              <span className="text-xs font-medium">{score.freshnessScore}%</span>
            </div>
            <div>
              <span className="text-xs text-slate-500">Overall</span>
              <ScoreBar score={score.overallScore} />
              <span className="text-xs font-medium">{score.overallScore}%</span>
            </div>
          </div>
          {score.issues.length > 0 && (
            <div>
              <span className="text-xs font-medium text-slate-600 block mb-1">
                Issues
              </span>
              <ul className="space-y-1">
                {score.issues.map((issue, i) => (
                  <li
                    key={i}
                    className="text-xs text-red-600 flex items-start gap-1"
                  >
                    <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {score.suggestions.length > 0 && (
            <div>
              <span className="text-xs font-medium text-slate-600 block mb-1">
                Suggestions
              </span>
              <ul className="space-y-1">
                {score.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="text-xs text-emerald-600 flex items-start gap-1"
                  >
                    <CheckCircle size={10} className="mt-0.5 flex-shrink-0" />
                    {s}
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

function CourseScoreCard({ score }: { score: ContentRelevanceScore }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="angular-card bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
            Course
          </span>
          <span className="font-medium text-sm text-left">{score.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={score.overallScore} />
          <ArrowRight
            size={14}
            className={`text-slate-400 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-xs text-slate-500">Relevance</span>
              <ScoreBar score={score.relevanceScore} />
              <span className="text-xs font-medium">{score.relevanceScore}%</span>
            </div>
            <div>
              <span className="text-xs text-slate-500">Freshness</span>
              <ScoreBar score={score.freshnessScore} />
              <span className="text-xs font-medium">{score.freshnessScore}%</span>
            </div>
            <div>
              <span className="text-xs text-slate-500">Overall</span>
              <ScoreBar score={score.overallScore} />
              <span className="text-xs font-medium">{score.overallScore}%</span>
            </div>
          </div>
          {score.issues.length > 0 && (
            <div>
              <span className="text-xs font-medium text-slate-600 block mb-1">
                Issues
              </span>
              <ul className="space-y-1">
                {score.issues.map((issue, i) => (
                  <li
                    key={i}
                    className="text-xs text-red-600 flex items-start gap-1"
                  >
                    <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {score.suggestions.length > 0 && (
            <div>
              <span className="text-xs font-medium text-slate-600 block mb-1">
                Suggestions
              </span>
              <ul className="space-y-1">
                {score.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="text-xs text-emerald-600 flex items-start gap-1"
                  >
                    <CheckCircle size={10} className="mt-0.5 flex-shrink-0" />
                    {s}
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

type Any = any;
