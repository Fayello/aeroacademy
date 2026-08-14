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
  Cpu,
} from "lucide-react";
import toast from "react-hot-toast";
import { getLevel, getCourseLock } from "@/lib/levelGating";
import type { Course, Section } from "@/types/api";

const CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
  aerodynamics: { label: "Aerodynamics", color: "text-sky-600", bg: "bg-sky-50 border-sky-200" },
  structures: { label: "Structures", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  propulsion: { label: "Propulsion", color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
  avionics: { label: "Avionics", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  controls: { label: "Controls", color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
  composites: { label: "Composites", color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-200" },
  default: { label: "Core", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
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
    <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200">
      <div className="h-40 bg-slate-200">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-slate-200" />
          <div className="h-5 w-20 rounded-full bg-slate-200" />
        </div>
        <div className="h-5 w-3/4 bg-slate-200 rounded" />
        <div className="h-3 w-full bg-slate-200 rounded" />
        <div className="h-3 w-1/2 bg-slate-200 rounded" />
        <div className="flex gap-3 pt-1">
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="h-3 w-14 bg-slate-200 rounded" />
          <div className="h-3 w-12 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);

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

  const filteredCourses = courses.filter((course: Course) => {
    const matchesSearch =
      !searchQuery ||
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || course.category?.toLowerCase() === selectedCategory.toLowerCase();
    const courseDifficulty = getDifficulty(course.difficulty || 1).dots;
    const matchesDifficulty = !selectedDifficulty || courseDifficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const activeCategories = Array.from(
    new Set(courses.map((c: Course) => c.category).filter(Boolean))
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Courses</h1>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 tabular-nums">
            {courses.length}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
          />
        </div>

        {/* Category Filter */}
        {activeCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                !selectedCategory
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300"
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
                      : "bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {style.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Difficulty Filter */}
        {courses.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Difficulty
            </span>
            <button
              onClick={() => setSelectedDifficulty(null)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                !selectedDifficulty
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
            >
              All levels
            </button>
            {Object.entries(DIFFICULTY_MAP).map(([key, d]) => (
              <button
                key={key}
                onClick={() =>
                  setSelectedDifficulty(selectedDifficulty === d.dots ? null : d.dots)
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                  selectedDifficulty === d.dots
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="relative overflow-hidden rounded-xl bg-slate-50 border border-slate-200">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />
          <div className="relative flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-slate-200 border border-slate-300 flex items-center justify-center">
                <Rocket size={32} className="text-blue-500" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                <Cpu size={12} className="text-slate-400" />
              </div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                <Shield size={12} className="text-slate-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {searchQuery || selectedCategory || selectedDifficulty
                ? "No matching courses"
                : "No courses available"}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              {searchQuery || selectedCategory || selectedDifficulty
                ? "Try adjusting your search or filter criteria."
                : "Training modules will appear here once published by your administrator."}
            </p>
            {(searchQuery || selectedCategory || selectedDifficulty) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                  setSelectedDifficulty(null);
                }}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course: Course) => {
            const firstSectionTitle = course.sections?.[0]?.title || "";
            const gate = getCourseLock(firstSectionTitle, level);
            const isLocked = gate.locked;
            const sectionCount =
              course._count?.sections || course.sections?.length || 0;
            const lessonCount =
              course.sections?.reduce(
                (acc: number, s: Section) => acc + (s._count?.lessons || s.lessons?.length || 0),
                0
              ) || 0;

            const categoryStyle = getCategoryStyle(course.category);
            const difficulty = getDifficulty(course.difficulty || 1);

            const cardContent = (
              <>
                {/* Card Top - Cover */}
                <div className="relative h-40 overflow-hidden bg-white border-b border-slate-200">
                  {course.imageUrl ? (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <GraduationCap
                        size={40}
                        className="text-blue-300 group-hover:text-blue-500 transition-colors"
                      />
                    </div>
                  )}

                    {/* Top badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded border ${categoryStyle.bg} ${categoryStyle.color}`}
                    >
                      {categoryStyle.label}
                    </span>
                    {isLocked && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded bg-white/90 text-slate-600 border border-slate-200 backdrop-blur-sm">
                        <Lock size={10} />
                        Lv.{gate.requiredLevel}
                      </span>
                    )}
                  </div>

                  {/* Bottom gradient */}
                  <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white to-transparent" />
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  {/* Title + Description */}
                  <div>
                    <h3
                      className={`text-base font-semibold line-clamp-2 mb-1.5 ${
                        isLocked
                          ? "text-slate-400"
                          : "text-slate-900 group-hover:text-blue-600 transition-colors"
                      }`}
                    >
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {course.description || "Comprehensive training module."}
                    </p>
                  </div>

                  {/* Difficulty Indicator */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      {difficulty.label}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((dot) => (
                        <div
                          key={dot}
                          className={`w-1.5 h-1.5 rounded-full ${
                            dot <= difficulty.dots
                              ? "bg-blue-500"
                              : "bg-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Layers size={12} className="text-slate-400" />
                      {sectionCount} modules
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={12} className="text-slate-400" />
                      {lessonCount} lessons
                    </span>
                    {course.estimatedHours && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        {course.estimatedHours}h est.
                      </span>
                    )}
                  </div>

                  {/* Action */}
                  <div
                    className={`pt-2 border-t flex items-center justify-between text-sm font-medium ${
                      isLocked
                        ? "border-slate-200 text-slate-400"
                        : "border-slate-200 text-blue-600 group-hover:text-blue-500"
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
              "group relative overflow-hidden rounded-xl bg-white border border-slate-200 transition-all duration-300";

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
                className={`${baseClasses} hover:border-blue-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.08)]`}
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
