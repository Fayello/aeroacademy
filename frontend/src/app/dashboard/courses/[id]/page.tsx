"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Play,
  BookOpen,
  Clock,
  Loader2,
  Lock,
  CheckCircle2,
  Layers,
  Award,
  Target,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { getLevel, getCourseLock } from "@/lib/levelGating";
import type { Course, Section, Lesson } from "@/types/api";

interface Enrollment {
  userId: string;
  courseId: string;
  enrolledAt: string;
  lastActivityAt: string;
}

interface CourseProgress {
  total: number;
  completed: number;
  started: number;
  percentage: number;
}

export default function CourseBriefingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");
  const [level, setLevel] = useState(1);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      setLevel(getLevel(parseInt(localStorage.getItem("xp") || "0", 10)));
    } catch {
      setLevel(1);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadCourse() {
      try {
        const [courseData, progressData, enrollmentData] = await Promise.all([
          fetchApi(`/courses/${id}`) as Promise<Course>,
          fetchApi(`/progress/course/${id}`).catch(() => null),
          fetchApi(`/courses/${id}/enrollment`).catch(() => null),
        ]);
        if (!cancelled) {
          setCourse(courseData);
          setProgress(progressData);
          setEnrollment(enrollmentData);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCourse();
    return () => { cancelled = true; };
  }, [id]);

  const handleStartCourse = useCallback(async () => {
    setEnrolling(true);
    try {
      await fetchApi(`/courses/${id}/enroll`, { method: "POST" });
      if (course?.sections?.[0]?.lessons?.[0]) {
        router.push(`/dashboard/courses/lessons/${course.sections[0].lessons[0].id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start course");
    } finally {
      setEnrolling(false);
    }
  }, [id, course, router]);

  const handleResumeCourse = useCallback(() => {
    if (course?.sections) {
      for (const section of course.sections) {
        for (const lesson of section.lessons) {
          router.push(`/dashboard/courses/lessons/${lesson.id}`);
          return;
        }
      }
    }
  }, [course, router]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }
  if (error) return <div role="alert" className="text-red-600 p-4">{error}</div>;
  if (!course) return null;

  const isEnrolled = !!enrollment;
  const hasProgress = progress && progress.completed > 0;
  const totalLessons = course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;
  const estimatedMinutes = totalLessons * 12;

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
            {estimatedMinutes > 0 && (
              <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <Clock size={14} />
                ~{Math.ceil(estimatedMinutes / 60)}h estimated
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <Layers size={14} />
              {course.sections?.length || 0} modules
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <BookOpen size={14} />
              {totalLessons} lessons
            </span>
          </div>
        </div>
      </div>

      {/* What You'll Learn */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Target size={18} className="text-emerald-600" />
          What you&apos;ll learn
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {course.sections?.map((section: Section) => (
            <div key={section.id} className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
              <span className="text-sm text-slate-700">{section.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modules */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Course Modules</h2>
          {course.sections.map((section: Section) => {
            const gate = getCourseLock(section.title, level);
            const isLocked = gate.locked;
            const isExpanded = expandedSections.has(section.id) || isEnrolled;

            return (
              <div key={section.id} className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${isLocked ? "opacity-60" : "hover:shadow-md"} transition-all duration-300`}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-left"
                >
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
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{section.lessons.length} lessons</span>
                    <ChevronRight size={16} className={`text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-slate-100">
                    {section.lessons.map((lesson: Lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between px-6 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isLocked ? "bg-slate-100" : "bg-slate-100"
                          }`}>
                            {isLocked ? (
                              <Lock size={12} className="text-slate-400" />
                            ) : (
                              <Play size={12} className="text-slate-400" fill="currentColor" />
                            )}
                          </div>
                          <span className={`text-sm ${isLocked ? "text-slate-400" : "text-slate-700"}`}>{lesson.title}</span>
                        </div>
                        <span className="text-xs text-slate-400">~12 min</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-24">
            {isEnrolled ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle2 size={24} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Course Progress</h3>
                <p className="text-sm text-slate-500 mb-6">Continue where you left off.</p>

                <div className="space-y-3 mb-6">
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

                {progress && progress.percentage === 100 ? (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Award size={16} className="text-emerald-600" />
                      <p className="text-sm font-medium text-emerald-800">Course Completed!</p>
                    </div>
                    <p className="text-xs text-emerald-600">You have earned your certification.</p>
                  </div>
                ) : (
                  <button
                    onClick={handleResumeCourse}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={16} />
                    Resume Course
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                  <Rocket size={24} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to start?</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Begin your learning journey with this course. You&apos;ll earn XP for each lesson completed.
                </p>

                <div className="space-y-2 mb-6 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>{totalLessons} lessons with hands-on exercises</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>Earn XP and climb the leaderboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>Certificate upon completion</span>
                  </div>
                </div>

                <button
                  onClick={handleStartCourse}
                  disabled={enrolling}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {enrolling ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Rocket size={16} />
                  )}
                  {enrolling ? "Starting..." : "Start Now"}
                </button>
                <p className="text-xs text-slate-400 text-center mt-3">
                  We&apos;ll send you a welcome email with your learning roadmap
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
