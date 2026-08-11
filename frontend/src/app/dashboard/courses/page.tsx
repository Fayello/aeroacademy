"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import { BookOpen, ChevronRight, Loader2, Lock, Layers } from "lucide-react";
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
          {courses.map((course: any) => {
            const firstSectionTitle = course.sections?.[0]?.title || "";
            const gate = getCourseLock(firstSectionTitle, level);
            const isLocked = gate.locked;

            return isLocked ? (
              <div
                key={course.id}
                className="relative overflow-hidden bg-white rounded-xl border border-slate-200 p-6 opacity-60 cursor-not-allowed"
                role="button"
                aria-disabled="true"
                aria-label={`${course.title} — locked, requires level ${gate.requiredLevel}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Lock size={18} className="text-slate-400" />
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                    <Lock size={10} className="inline mr-1" />
                    Lv.{gate.requiredLevel}
                  </span>
                </div>
                <h3 className="text-base font-semibold mb-2 text-slate-500 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{gate.reason}</p>
                <div className="mt-4 flex items-center text-sm font-medium text-slate-400">Locked</div>
              </div>
            ) : (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className="group relative overflow-hidden bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-emerald-300 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-300">
                    <BookOpen size={18} className="text-emerald-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                    {course._count?.sections || 0} modules
                  </span>
                </div>
                <h3 className="text-base font-semibold mb-2 text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                  {course.description || "A comprehensive course on product security."}
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Layers size={12} />
                    {course._count?.sections || 0} modules
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                  Start course
                  <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
