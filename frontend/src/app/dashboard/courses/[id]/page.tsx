"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useParams } from "next/navigation";
import { ChevronRight, ChevronLeft, Play, BookOpen, Clock, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { getLevel, getCourseLock } from "@/lib/levelGating";

export default function CourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<{ total: number; completed: number; percentage: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [level, setLevel] = useState(1);

  useEffect(() => {
    try {
      const xp = parseInt(localStorage.getItem("xp") || "0", 10);
      setLevel(getLevel(xp));
    } catch {}

    async function loadCourse() {
      try {
        const [courseData, progressData] = await Promise.all([
          fetchApi(`/courses/${id}`),
          fetchApi(`/progress/course/${id}`).catch(() => null),
        ]);
        setCourse(courseData);
        setProgress(progressData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }
  if (error) return <div role="alert" className="text-red-600 p-4">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="space-y-4">
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft size={16} />
          All courses
        </Link>

        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">{course.title}</h1>
          <p className="text-slate-500 mt-2 leading-relaxed max-w-2xl">{course.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
          {course.duration && (
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              {course.duration}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <BookOpen size={14} className="text-slate-400" />
            {course.sections?.length || 0} modules
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Modules</h2>
          {course.sections.map((section: any) => {
            const gate = getCourseLock(section.title, level);
            const isLocked = gate.locked;

            return (
              <div key={section.id} className={`card overflow-hidden ${isLocked ? "opacity-60" : ""}`}>
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      isLocked
                        ? "text-slate-500 bg-slate-100 border-slate-200"
                        : "text-emerald-600 bg-emerald-50 border-emerald-200"
                    }`}>
                      Module {section.order}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                    {isLocked && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Lock size={10} />
                        Lv.{gate.requiredLevel}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">{section.lessons.length} lessons</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {section.lessons.map((lesson: any) => (
                    <Link
                      key={lesson.id}
                      href={isLocked ? "#" : `/dashboard/courses/lessons/${lesson.id}`}
                      className={`flex items-center justify-between px-6 py-4 transition-colors group ${
                        isLocked ? "cursor-not-allowed" : "hover:bg-slate-50"
                      }`}
                      onClick={(e) => { if (isLocked) e.preventDefault(); }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isLocked ? "bg-slate-100" : "bg-slate-100 group-hover:bg-emerald-100"
                        }`}>
                          {isLocked ? (
                            <Lock size={14} className="text-slate-400" />
                          ) : (
                            <Play size={14} className="text-slate-400 group-hover:text-emerald-600" fill="currentColor" />
                          )}
                        </div>
                        <span className={`text-sm font-medium ${
                          isLocked ? "text-slate-400" : "text-slate-700 group-hover:text-slate-900"
                        }`}>{lesson.title}</span>
                      </div>
                      {isLocked ? null : (
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Course Progress</h3>
            <p className="text-sm text-slate-500 mb-4">
              Complete all modules to earn your certification.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progress</span>
                <span>{progress?.percentage || 0}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress?.percentage || 0}%` }} />
              </div>
              {progress && (
                <p className="text-xs text-slate-400">{progress.completed} of {progress.total} lessons completed</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
