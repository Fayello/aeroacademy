"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  GraduationCap,
  TrendingUp,
  BarChart3,
} from "lucide-react";

interface GradeEntry {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  comment: string | null;
  gradedAt: string | null;
}

interface CategoryGrade {
  category: string;
  weight: number;
  average: number | null;
  entries: GradeEntry[];
}

interface StudentGrades {
  cohortId: string;
  categories: CategoryGrade[];
  finalGrade: number;
  totalWeight: number;
}

function getGradeColor(grade: number): string {
  if (grade >= 90) return "text-emerald-600 bg-emerald-50";
  if (grade >= 80) return "text-blue-600 bg-blue-500/10";
  if (grade >= 70) return "text-amber-600 bg-amber-500/10";
  return "text-red-600 bg-red-500/10";
}

function getGradeBarColor(grade: number): string {
  if (grade >= 90) return "bg-emerald-500";
  if (grade >= 80) return "bg-blue-500";
  if (grade >= 70) return "bg-amber-500";
  return "bg-red-500";
}

export default function CohortDetailPage() {
  const params = useParams();
  const cohortId = params.id as string;
  const [grades, setGrades] = useState<StudentGrades | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchApi<StudentGrades>(`/gradebook/cohorts/${cohortId}/my-grades`);
        if (!cancelled) setGrades(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load grades");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [cohortId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-24 bg-[#0f172a] rounded-xl border border-white/10 animate-pulse" />
        <div className="h-64 bg-[#0f172a] rounded-xl border border-white/10 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/academics" className="text-sm text-slate-500 hover:text-[#7AD62A] flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Academics
        </Link>
        <div className="text-center py-20 text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back Link */}
      <Link
        href="/dashboard/academics"
        className="text-sm text-slate-500 hover:text-[#7AD62A] flex items-center gap-1 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Academics
      </Link>

      {/* Final Grade Card */}
      <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center">
              <GraduationCap size={28} className="text-[#7AD62A]" />
            </div>
            <div>
              <PageHeader title="My Grades" description={`${grades?.categories.length ?? 0} grade categories`} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-white">
              {grades?.finalGrade ?? 0}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Overall Grade</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-4 h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getGradeBarColor(grades?.finalGrade ?? 0)}`}
            style={{ width: `${Math.min(grades?.finalGrade ?? 0, 100)}%` }}
          />
        </div>
      </div>

      {/* Category Breakdown */}
      {grades && grades.categories.length > 0 ? (
        <div className="space-y-4">
          {grades.categories.map((cat) => (
            <div key={cat.category} className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <BarChart3 size={16} className="text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{cat.category}</h3>
                    <p className="text-xs text-slate-500">{Math.round(cat.weight * 100)}% of final grade</p>
                  </div>
                </div>
                {cat.average !== null ? (
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${getGradeColor(cat.average)}`}>
                    {cat.average}%
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">No grades yet</span>
                )}
              </div>

              {cat.average !== null && (
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all ${getGradeBarColor(cat.average)}`}
                    style={{ width: `${Math.min(cat.average, 100)}%` }}
                  />
                </div>
              )}

              {/* Individual Entries */}
              {cat.entries.length > 0 ? (
                <div className="space-y-2">
                  {cat.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                    >
                      <div>
                        <div className="text-sm font-medium text-white">{entry.title}</div>
                        {entry.comment && (
                          <div className="text-xs text-slate-500 mt-0.5">{entry.comment}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-semibold ${getGradeColor(entry.percentage)}`}>
                          {entry.score}/{entry.maxScore}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">
                          ({entry.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-2">No entries in this category</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#7AD62A]/10 flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={28} className="text-[#7AD62A]" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No grades posted yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your instructor hasn&apos;t posted any grades for this cohort yet. Check back later.
          </p>
        </div>
      )}
    </div>
  );
}
