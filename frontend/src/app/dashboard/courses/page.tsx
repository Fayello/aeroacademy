"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Clock,
  Layers,
  Lock,
  Search,
  Rocket,
  Shield,
  Zap,
  Cpu,
} from "lucide-react";
import toast from "react-hot-toast";
import { getLevel, getCourseLock } from "@/lib/levelGating";

const CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
  aerodynamics: { label: "Aerodynamics", color: "text-sky-400", bg: "bg-sky-500/15 border-sky-500/30" },
  structures: { label: "Structures", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" },
  propulsion: { label: "Propulsion", color: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/30" },
  avionics: { label: "Avionics", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  controls: { label: "Controls", color: "text-violet-400", bg: "bg-violet-500/15 border-violet-500/30" },
  composites: { label: "Composites", color: "text-cyan-400", bg: "bg-cyan-500/15 border-cyan-500/30" },
  default: { label: "Core", color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30" },
};

const DIFFICULTY_MAP: Record<number, { label: string; dots: number }> = {
  1: { label: "Fundamentals", dots: 1 },
  2: { label: "Beginner", dots: 2 },
  3: { label: "Intermediate", dots: 3 },
  4: { label: "Advanced", dots: 4 },
  5: { label: "Expert", dots: 5 },
};

function getCategoryStyle(category?: string) {
  if (!category) return CATEGORIES.default;
  const key = category.toLowerCase();
  return CATEGORIES[key] || CATEGORIES.default;
}

function getDifficulty(level: number) {
  const mapped = Math.min(Math.max(Math.ceil(level / 2), 1), 5);
  return DIFFICULTY_MAP[mapped];
}

function ShimmerSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-800 border border-slate-700/50">
      <div className="h-40 bg-slate-700/50">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-slate-700/50" />
          <div className="h-5 w-20 rounded-full bg-slate-700/50" />
        </div>
        <div className="h-5 w-3/4 bg-slate-700/50 rounded" />
        <div className="h-3 w-full bg-slate-700/50 rounded" />
        <div className="h-3 w-1/2 bg-slate-700/50 rounded" />
        <div className="flex gap-3 pt-1">
          <div className="h-3 w-16 bg-slate-700/50 rounded" />
          <div className="h-3 w-14 bg-slate-700/50 rounded" />
          <div className="h-3 w-12 bg-slate-700/50 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  const filteredCourses = courses.filter((course: any) => {
    const matchesSearch =
      !searchQuery ||
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || course.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const activeCategories = Array.from(
    new Set(courses.map((c: any) => c.category).filter(Boolean))
  ) as string[];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />
            <div className="h-6 w-10 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="h-10 w-full max-w-md bg-slate-200 rounded-lg animate-pulse" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 w-20 bg-slate-200 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((id) => (
            <ShimmerSkeleton key={id} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Courses</h1>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 tabular-nums">
            {courses.length}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-800 border border-slate-700/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
          />
        </div>

        {/* Category Filter */}
        {activeCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                !selectedCategory
                  ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                  : "bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-slate-600"
              }`}
            >
              All
            </button>
            {activeCategories.map((cat) => {
              const style = getCategoryStyle(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    selectedCategory === cat
                      ? `${style.bg} ${style.color}`
                      : "bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-slate-600"
                  }`}
                >
                  {style.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="relative overflow-hidden rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />
          <div className="relative flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-slate-700/50 border border-slate-600/50 flex items-center justify-center">
                <Rocket size={32} className="text-blue-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center">
                <Cpu size={12} className="text-slate-400" />
              </div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center">
                <Shield size={12} className="text-slate-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              {searchQuery || selectedCategory ? "No matching courses" : "No courses available"}
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mb-6">
              {searchQuery || selectedCategory
                ? "Try adjusting your search or filter criteria."
                : "Training modules will appear here once published by your administrator."}
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                className="px-4 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/15 transition-all"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course: any) => {
            const firstSectionTitle = course.sections?.[0]?.title || "";
            const gate = getCourseLock(firstSectionTitle, level);
            const isLocked = gate.locked;
            const sectionCount =
              course._count?.sections || course.sections?.length || 0;
            const lessonCount =
              course.sections?.reduce(
                (acc: number, s: any) => acc + (s._count?.lessons || s.lessons?.length || 0),
                0
              ) || 0;

            const categoryStyle = getCategoryStyle(course.category);
            const difficulty = getDifficulty(course.difficulty || 1);

            const cardContent = (
              <>
                {/* Card Top - Cover */}
                <div className="relative h-40 overflow-hidden bg-slate-800 border-b border-slate-700/50">
                  {course.imageUrl ? (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                      <GraduationCap
                        size={40}
                        className="text-blue-400/40 group-hover:text-blue-400/60 transition-colors"
                      />
                    </div>
                  )}

                  {/* Circuit pattern overlay */}
                  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded border ${categoryStyle.bg} ${categoryStyle.color}`}
                    >
                      {categoryStyle.label}
                    </span>
                    {isLocked && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded bg-slate-900/80 text-slate-300 border border-slate-600/50 backdrop-blur-sm">
                        <Lock size={10} />
                        Lv.{gate.requiredLevel}
                      </span>
                    )}
                  </div>

                  {/* Bottom gradient */}
                  <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-slate-900 to-transparent" />
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  {/* Title + Description */}
                  <div>
                    <h3
                      className={`text-base font-semibold line-clamp-2 mb-1.5 ${
                        isLocked
                          ? "text-slate-500"
                          : "text-slate-100 group-hover:text-blue-400 transition-colors"
                      }`}
                    >
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                      {course.description || "Comprehensive training module."}
                    </p>
                  </div>

                  {/* Difficulty Indicator */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      {difficulty.label}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((dot) => (
                        <div
                          key={dot}
                          className={`w-1.5 h-1.5 rounded-full ${
                            dot <= difficulty.dots
                              ? "bg-blue-400"
                              : "bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Layers size={12} className="text-slate-500" />
                      {sectionCount} modules
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={12} className="text-slate-500" />
                      {lessonCount} lessons
                    </span>
                    {course.estimatedHours && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-500" />
                        {course.estimatedHours}h est.
                      </span>
                    )}
                  </div>

                  {/* Action */}
                  <div
                    className={`pt-2 border-t flex items-center justify-between text-sm font-medium ${
                      isLocked
                        ? "border-slate-700/50 text-slate-500"
                        : "border-slate-700/50 text-blue-400 group-hover:text-blue-300"
                    }`}
                  >
                    <span>{isLocked ? "Locked" : "Begin training"}</span>
                    {!isLocked && (
                      <ChevronRight
                        size={14}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    )}
                  </div>
                </div>
              </>
            );

            const baseClasses =
              "group relative overflow-hidden rounded-xl bg-slate-900 border border-slate-700/50 transition-all duration-300";

            if (isLocked) {
              return (
                <div
                  key={course.id}
                  className={`${baseClasses} opacity-50 cursor-not-allowed`}
                  role="button"
                  aria-disabled="true"
                  aria-label={`${course.title} — locked, requires level ${gate.requiredLevel}`}
                >
                  {cardContent}
                </div>
              );
            }

            return (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className={`${baseClasses} hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.08)]`}
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
