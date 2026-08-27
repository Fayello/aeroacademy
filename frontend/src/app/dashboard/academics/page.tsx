"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import {
  BookOpen,
  ChevronRight,
  Loader2,
  GraduationCap,
  Trophy,
  TrendingUp,
  Award,
} from "lucide-react";

interface AcademicCourse {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  cohortId: string;
  cohortName: string;
  weight: number;
  isRequired: boolean;
}

interface GPATranscript {
  cohortId: string;
  cohortName: string;
  curriculum: string;
  degree: string;
  semester: string | null;
  year: number;
  finalGrade: number;
  gpaPoints: number;
}

interface GPAData {
  userId: string;
  cumulativeGPA: number;
  totalCredits: number;
  transcript: GPATranscript[];
}

interface GradeSummary {
  cohortId: string;
  categories: { category: string; weight: number; average: number | null }[];
  finalGrade: number;
  totalWeight: number;
}

function getLetterGrade(gpa: number): string {
  if (gpa >= 3.7) return "A";
  if (gpa >= 3.3) return "B+";
  if (gpa >= 3.0) return "B";
  if (gpa >= 2.7) return "B-";
  if (gpa >= 2.3) return "C+";
  if (gpa >= 2.0) return "C";
  if (gpa >= 1.7) return "C-";
  if (gpa >= 1.0) return "D";
  return "F";
}

function getGradeColor(grade: number): string {
  if (grade >= 90) return "text-[#7AD62A] bg-emerald-50";
  if (grade >= 80) return "text-blue-400 bg-blue-500/10";
  if (grade >= 70) return "text-amber-600 bg-amber-500/10";
  return "text-red-600 bg-red-500/10";
}

export default function AcademicsPage() {
  const [courses, setCourses] = useState<AcademicCourse[]>([]);
  const [gpa, setGpa] = useState<GPAData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [coursesData, gpaData] = await Promise.all([
          fetchApi<AcademicCourse[]>("/academic/my-courses"),
          fetchApi<GPAData>("/gradebook/my-gpa"),
        ]);
        if (!cancelled) {
          setCourses(coursesData);
          setGpa(gpaData);
        }
      } catch {
        // Empty state is fine — student may not be enrolled
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[#0f172a] rounded-xl border border-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const enrolledCohorts = courses.reduce((acc, c) => {
    if (!acc.find((x) => x.cohortId === c.cohortId)) {
      acc.push({ cohortId: c.cohortId, cohortName: c.cohortName, courses: courses.filter((x) => x.cohortId === c.cohortId) });
    }
    return acc;
  }, [] as Array<{ cohortId: string; cohortName: string; courses: AcademicCourse[] }>);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <PageHeader title="My Academics" description="Your enrolled courses, grades, and academic progress" />

      {/* GPA Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#7AD62A]/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-[#7AD62A]" />
            </div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cumulative GPA</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {gpa?.cumulativeGPA?.toFixed(2) ?? "—"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {gpa?.totalCredits ?? 0} cohort{gpa?.totalCredits !== 1 ? "s" : ""} completed
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Award size={20} className="text-blue-400" />
            </div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Letter Grade</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {gpa?.cumulativeGPA ? getLetterGrade(gpa.cumulativeGPA) : "—"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Based on weighted category averages
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <GraduationCap size={20} className="text-amber-600" />
            </div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Enrolled Cohorts</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {enrolledCohorts.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Active academic cohorts
          </div>
        </div>
      </div>

      {/* Enrolled Cohorts */}
      {enrolledCohorts.length === 0 ? (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#7AD62A]/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-[#7AD62A]" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No enrolled courses</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven&apos;t been enrolled in any academic cohorts yet. Ask your instructor to add you to a cohort.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {enrolledCohorts.map((cohort) => (
            <Link
              key={cohort.cohortId}
              href={`/dashboard/academics/${cohort.cohortId}`}
              className="block bg-[#0f172a] rounded-xl border border-white/10 p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-[#7AD62A] transition-colors">
                    {cohort.cohortName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {cohort.courses.length} course{cohort.courses.length !== 1 ? "s" : ""} assigned
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-400 group-hover:text-[#7AD62A] transition-colors mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cohort.courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#7AD62A]/10 flex items-center justify-center shrink-0">
                      <GraduationCap size={16} className="text-[#7AD62A]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{course.title}</div>
                      <div className="text-xs text-slate-500">
                        {course.isRequired ? "Required" : "Elective"} · {Math.round(course.weight * 100)}% weight
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Transcript */}
      {gpa && gpa.transcript.length > 0 && (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Trophy size={20} className="text-[#7AD62A]" />
            Transcript
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Cohort</th>
                  <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Curriculum</th>
                  <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Semester</th>
                  <th className="text-right py-2 text-xs font-medium text-slate-500 uppercase">Grade</th>
                  <th className="text-right py-2 text-xs font-medium text-slate-500 uppercase">GPA</th>
                </tr>
              </thead>
              <tbody>
                {gpa.transcript.map((row) => (
                  <tr key={row.cohortId} className="border-b border-white/10 last:border-0">
                    <td className="py-3 font-medium text-white">{row.cohortName}</td>
                    <td className="py-3 text-slate-400">{row.curriculum}</td>
                    <td className="py-3 text-slate-400">
                      {row.semester ? `${row.semester} ` : ""}{row.year}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getGradeColor(row.finalGrade)}`}>
                        {row.finalGrade}%
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-white">{row.gpaPoints.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
