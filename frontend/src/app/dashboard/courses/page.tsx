"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import { BookOpen, ChevronRight, GraduationCap, Clock, Layers, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { CourseCardSkeleton } from "@/components/Skeleton";
import { getLevel, getCourseLock } from "@/lib/levelGating";

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    try {
      const xp = parseInt(localStorage.getItem("xp") || "0", 10);
      setLevel(getLevel(xp));
    } catch {}

    async function loadCourses() {
      try {
        const data = await fetchApi("/courses");
        setCourses(data);
      } catch {
        toast.error("Failed to load courses");
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 text-white">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold">Courses</h1>
            <p className="text-emerald-100 text-sm">Loading...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((id) => <CourseCardSkeleton key={id} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BookOpen size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Courses</h1>
              <p className="text-emerald-100 text-sm">Browse available training modules</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No courses available</h3>
          <p className="text-sm text-slate-500">Courses will appear here once they are published.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any, index: number) => {
            const firstSectionTitle = course.sections?.[0]?.title || "";
            const gate = getCourseLock(firstSectionTitle, level);
            const isLocked = gate.locked;
            const sectionCount = course._count?.sections || course.sections?.length || 0;
            const lessonCount = course.sections?.reduce((acc: number, s: any) => acc + (s._count?.lessons || s.lessons?.length || 0), 0) || 0;

            const gradients = [
              "from-emerald-500 to-teal-600",
              "from-blue-500 to-indigo-600",
              "from-violet-500 to-purple-600",
              "from-orange-500 to-red-600",
            ];
            const gradient = gradients[index % gradients.length];

            return isLocked ? (
              <div
                key={course.id}
                className="relative overflow-hidden bg-white rounded-xl border border-slate-200 opacity-60 cursor-not-allowed"
                role="button"
                aria-disabled="true"
                aria-label={`${course.title} — locked, requires level ${gate.requiredLevel}`}
              >
                {/* Cover image / placeholder */}
                <div className="relative h-40 overflow-hidden">
                  {course.imageUrl ? (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <GraduationCap size={40} className="text-white/80" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800/70 text-white backdrop-blur-sm">
                      <Lock size={10} className="inline mr-1" />
                      Lv.{gate.requiredLevel}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-base font-semibold mb-2 text-slate-500 line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{gate.reason}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Layers size={12} />
                      {sectionCount} modules
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={12} />
                      {lessonCount} lessons
                    </span>
                    {course.estimatedHours && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {course.estimatedHours}h
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center text-sm font-medium text-slate-400">Locked</div>
                </div>
              </div>
            ) : (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className="group relative overflow-hidden bg-white rounded-xl border border-slate-200 hover:shadow-lg hover:border-emerald-300 transition-all duration-300"
              >
                {/* Cover image / placeholder */}
                <div className="relative h-40 overflow-hidden">
                  {course.imageUrl ? (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`}>
                      <GraduationCap size={40} className="text-white/80" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-600/80 text-white backdrop-blur-sm">
                      {sectionCount} modules
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-base font-semibold mb-2 text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                    {course.description || "A comprehensive course on product security."}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Layers size={12} />
                      {sectionCount} modules
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={12} />
                      {lessonCount} lessons
                    </span>
                    {course.estimatedHours && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {course.estimatedHours}h
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                    Start course
                    <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
