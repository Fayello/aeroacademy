"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useParams } from "next/navigation";
import { ChevronRight, ChevronLeft, Play, BookOpen, Clock, Loader2, Lock, CheckCircle2, Layers } from "lucide-react";
import Link from "next/link";
import { getLevel, getCourseLock } from "@/lib/levelGating";
import type { Course, Section, Lesson } from "@/types/api";

export default function CourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
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
          fetchApi(`/courses/${id}`) as Promise<Course>,
          fetchApi(`/progress/course/${id}`).catch(() => null),
        ]);
        setCourse(courseData);
        setProgress(progressData);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }
  if (error) return <div role="alert" className="text-red-600 p-4">{error}</div>;
  if (!course) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center gap-1 text-sm text-emerald-200 hover:text-white transition-colors mb-4"
          >
            <ChevronLeft size={16} />
            All courses
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{course.title}</h1>
          <p className="text-emerald-100 leading-relaxed max-w-2xl mb-6">{course.description}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            {course.duration && (
              <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <Clock size={14} />
                {course.duration}
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <Layers size={14} />
              {course.sections?.length || 0} modules
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <BookOpen size={14} />
              {progress?.total || 0} lessons
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modules */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Course Modules</h2>
          {course.sections.map((section: Section) => {
            const gate = getCourseLock(section.title, level);
            const isLocked = gate.locked;

            return (
              <div key={section.id} className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${isLocked ? "opacity-60" : "hover:shadow-md"} transition-all duration-300`}>
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      isLocked
                        ? "text-slate-500 bg-slate-100"
                        : "text-emerald-600 bg-emerald-100"
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
                  {section.lessons.map((lesson: Lesson) => (
                    <Link
                      key={lesson.id}
                      href={isLocked ? "#" : `/dashboard/courses/lessons/${lesson.id}`}
                      className={`flex items-center justify-between px-6 py-4 transition-all group ${
                        isLocked ? "cursor-not-allowed" : "hover:bg-emerald-50/50"
                      }`}
                      onClick={(e) => { if (isLocked) e.preventDefault(); }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          isLocked ? "bg-slate-100" : "bg-slate-100 group-hover:bg-emerald-600"
                        }`}>
                          {isLocked ? (
                            <Lock size={14} className="text-slate-400" />
                          ) : (
                            <Play size={14} className="text-slate-400 group-hover:text-white transition-colors" fill="currentColor" />
                          )}
                        </div>
                        <span className={`text-sm font-medium ${
                          isLocked ? "text-slate-400" : "text-slate-700 group-hover:text-emerald-700"
                        }`}>{lesson.title}</span>
                      </div>
                      {isLocked ? null : (
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-24">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Course Progress</h3>
            <p className="text-sm text-slate-500 mb-6">
              Complete all modules to earn your certification.
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Progress</span>
                <span className="font-semibold text-slate-900">{progress?.percentage || 0}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500" style={{ width: `${progress?.percentage || 0}%` }} />
              </div>
              {progress && (
                <p className="text-xs text-slate-500">{progress.completed} of {progress.total} lessons completed</p>
              )}
            </div>

            {progress && progress.percentage === 100 && (
              <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-sm font-medium text-emerald-800">Course Completed!</p>
                <p className="text-xs text-emerald-600 mt-1">You have earned your certification.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
