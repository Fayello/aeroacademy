"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import {
  ArrowLeft,
  GraduationCap,
  TrendingUp,
  BarChart3,
  ClipboardCheck,
  FileCheck,
  School2,
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
  if (grade >= 90) return "text-[#7AD62A] bg-emerald-50";
  if (grade >= 80) return "text-blue-400 bg-blue-500/10";
  if (grade >= 70) return "text-amber-600 bg-amber-500/10";
  return "text-red-600 bg-red-500/10";
}

function getGradeBarColor(grade: number): string {
  if (grade >= 90) return "bg-[#7AD62A]";
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
    return () => {
      cancelled = true;
    };
  }, [cohortId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
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

  const totalEntries = grades?.categories.reduce((count, category) => count + category.entries.length, 0) ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link
        href="/dashboard/academics"
        className="text-sm text-slate-500 hover:text-[#7AD62A] flex items-center gap-1 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Academics
      </Link>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#193553] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center">
              <GraduationCap size={28} className="text-[#7AD62A]" />
            </div>
            <div>
              <PageHeader title="My Grades" description={`${grades?.categories.length ?? 0} grade categories`} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:min-w-[28rem]">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Overall grade</p>
              <div className="mt-2 text-3xl font-bold text-white">{grades?.finalGrade ?? 0}%</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Weighted categories</p>
              <div className="mt-2 text-3xl font-bold text-white">{grades?.categories.length ?? 0}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Entries posted</p>
              <div className="mt-2 text-3xl font-bold text-white">{totalEntries}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2">
              <School2 size={15} className="text-[#7AD62A]" />
              <p className="text-sm font-semibold text-white">Institutional view</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">This record shows how your assessed work contributes to an official cohort outcome.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={15} className="text-[#7AD62A]" />
              <p className="text-sm font-semibold text-white">Grading coverage</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">Category weighting and entry-level scores make the final grade easier to audit and trust.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2">
              <FileCheck size={15} className="text-[#7AD62A]" />
              <p className="text-sm font-semibold text-white">What to do next</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">Review weaker categories first, then confirm whether all expected graded entries have been posted.</p>
          </div>
        </div>

        <div className="mt-5 h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getGradeBarColor(grades?.finalGrade ?? 0)}`}
            style={{ width: `${Math.min(grades?.finalGrade ?? 0, 100)}%` }}
          />
        </div>
      </div>

      {grades && grades.categories.length > 0 ? (
        <div className="space-y-4">
          {grades.categories.map((category) => (
            <div key={category.category} className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <BarChart3 size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{category.category}</h3>
                    <p className="text-xs text-slate-500">{Math.round(category.weight * 100)}% of final grade</p>
                  </div>
                </div>
                {category.average !== null ? (
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${getGradeColor(category.average)}`}>
                    {category.average}%
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">No grades yet</span>
                )}
              </div>

              {category.average !== null && (
                <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all ${getGradeBarColor(category.average)}`}
                    style={{ width: `${Math.min(category.average, 100)}%` }}
                  />
                </div>
              )}

              {category.entries.length > 0 ? (
                <div className="space-y-2">
                  {category.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-3 rounded-lg bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="text-sm font-medium text-white">{entry.title}</div>
                        {entry.comment && <div className="text-xs text-slate-500 mt-0.5">{entry.comment}</div>}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-sm font-semibold ${getGradeColor(entry.percentage)}`}>
                            {entry.score}/{entry.maxScore}
                          </span>
                          <span className="text-xs text-slate-500">({entry.percentage}%)</span>
                        </div>
                        {entry.gradedAt && (
                          <p className="mt-1 text-xs text-slate-500">Posted {new Date(entry.gradedAt).toLocaleDateString()}</p>
                        )}
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
