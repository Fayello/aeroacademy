"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import {
  Route,
  BookOpen,
  Clock,
  Users,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Circle,
  Rocket,
  Award,
} from "lucide-react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  estimatedHours: number | null;
  _count?: { enrollments: number; reviews: number };
  sections?: { lessons: { id: string }[] }[];
}

interface LearningPathCourse {
  id: string;
  order: number;
  courseId: string;
  course: Course;
}

interface CourseProgress {
  completed: number;
  total: number;
  percentage: number;
}

interface LearningPathDetail {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  difficulty: string;
  courses: LearningPathCourse[];
  enrollment: { id: string } | null;
  courseProgress: Record<string, CourseProgress>;
  overallProgress: number;
  courseCount: number;
  _count: { enrollments: number };
}

const difficultyColors: Record<string, string> = {
  BEGINNER: "bg-emerald-100 text-emerald-700",
  INTERMEDIATE: "bg-amber-100 text-amber-700",
  ADVANCED: "bg-red-100 text-red-700",
  EXPERT: "bg-purple-100 text-purple-700",
};

export default function LearningPathDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [path, setPath] = useState<LearningPathDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchApi(`/learning-paths/${id}`)
      .then((data) => setPath(data as LearningPathDetail))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = useCallback(async () => {
    setEnrolling(true);
    try {
      await fetchApi(`/learning-paths/${id}/enroll`, { method: "POST" });
      const updated = await fetchApi(`/learning-paths/${id}`) as LearningPathDetail;
      setPath(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll");
    } finally {
      setEnrolling(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-violet-600" size={32} />
      </div>
    );
  }
  if (error) return <div className="text-red-600 p-4">{error}</div>;
  if (!path) return null;

  const isEnrolled = !!path.enrollment;
  const totalHours = path.courses.reduce((acc, c) => acc + (c.course.estimatedHours || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <Link href="/dashboard/learning-paths" className="inline-flex items-center gap-1 text-sm text-violet-200 hover:text-white transition-colors mb-4">
            <ChevronLeft size={16} />
            All learning paths
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{path.title}</h1>
          <p className="text-violet-100 leading-relaxed max-w-2xl mb-4">{path.description}</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className={`px-3 py-1 rounded-lg ${difficultyColors[path.difficulty] || difficultyColors.BEGINNER} text-xs font-semibold`}>
              {path.difficulty}
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <BookOpen size={14} />
              {path.courseCount} courses
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <Clock size={14} />
              ~{totalHours}h total
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <Users size={14} />
              {path._count.enrollments} enrolled
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      {isEnrolled && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Award size={18} className="text-violet-600" />
              Your Progress
            </h2>
            <span className="text-sm font-bold text-violet-600">{path.overallProgress}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${path.overallProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {path.courses.filter((c) => {
              const p = path.courseProgress[c.course.id];
              return p && p.percentage === 100;
            }).length} of {path.courseCount} courses completed
          </p>
        </div>
      )}

      {/* Enroll CTA */}
      {!isEnrolled && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Ready to start this path?</h3>
            <p className="text-sm text-slate-500">You&apos;ll be guided through {path.courseCount} courses in sequence.</p>
          </div>
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
          >
            {enrolling ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
            {enrolling ? "Enrolling..." : "Enroll in Path"}
          </button>
        </div>
      )}

      {/* Courses */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Courses in this path</h2>
        {path.courses.map((lpc, i) => {
          const progress = path.courseProgress[lpc.course.id];
          const completed = progress && progress.percentage === 100;
          const started = progress && progress.completed > 0;

          return (
            <div
              key={lpc.id}
              className={`bg-white rounded-xl border p-5 transition-all ${
                completed
                  ? "border-emerald-200 bg-emerald-50/30"
                  : "border-slate-200 hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  completed
                    ? "bg-emerald-100"
                    : started
                      ? "bg-violet-100"
                      : "bg-slate-100"
                }`}>
                  {completed ? (
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  ) : (
                    <span className={`text-sm font-bold ${started ? "text-violet-600" : "text-slate-400"}`}>
                      {i + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">{lpc.course.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-1">{lpc.course.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    {lpc.course.estimatedHours && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        ~{lpc.course.estimatedHours}h
                      </span>
                    )}
                    {lpc.course.sections && (
                      <span>{lpc.course.sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)} lessons</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {progress && (
                    <div className="mb-2">
                      <span className="text-sm font-bold text-slate-900">{progress.percentage}%</span>
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1">
                        <div
                          className={`h-full rounded-full ${completed ? "bg-emerald-500" : "bg-violet-500"}`}
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <Link
                    href={`/dashboard/courses/${lpc.course.id}`}
                    className="text-xs font-medium text-violet-600 hover:underline"
                  >
                    {completed ? "Review" : started ? "Continue" : "Start"} →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
