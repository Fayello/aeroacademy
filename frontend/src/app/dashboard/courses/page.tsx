"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Clock,
  Layers,
  Lock,
  Search,
  Star,
  LayoutGrid,
  List,
  Users,
  Award,
  Heart,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import toast from "@/lib/toast";
import { getLevel, getCourseLock } from "@/lib/levelGating";
import type { Course, Section } from "@/types/api";

const CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
  aerodynamics: { label: "Aerodynamics", color: "text-sky-600", bg: "bg-sky-50 border-sky-200" },
  structures: { label: "Structures", color: "text-amber-600", bg: "bg-amber-500/10 border-amber-200" },
  propulsion: { label: "Propulsion", color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
  avionics: { label: "Avionics", color: "text-[#7AD62A]", bg: "bg-[#7AD62A]/10 border-[#7AD62A]/20" },
  controls: { label: "Controls", color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
  composites: { label: "Composites", color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-200" },
  cybersecurity: { label: "Cybersecurity", color: "text-[#7AD62A]", bg: "bg-emerald-50 border-emerald-200" },
  cloud: { label: "Cloud", color: "text-blue-600", bg: "bg-blue-500/10 border-blue-200" },
  devops: { label: "DevOps", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  networking: { label: "Networking", color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
  forensics: { label: "Forensics", color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  web: { label: "Web Security", color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
  default: { label: "Core", color: "text-blue-600", bg: "bg-blue-500/10 border-blue-200" },
};

const DIFFICULTY_MAP: Record<number, { label: string; dots: number; color: string }> = {
  1: { label: "Fundamentals", dots: 1, color: "text-[#7AD62A]" },
  2: { label: "Beginner", dots: 2, color: "text-blue-600" },
  3: { label: "Intermediate", dots: 3, color: "text-amber-600" },
  4: { label: "Advanced", dots: 4, color: "text-orange-600" },
  5: { label: "Expert", dots: 5, color: "text-rose-600" },
};

type TabFilter = "all" | "in-progress" | "completed";

const TABS: { id: TabFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in-progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

function getCategoryStyle(category?: string) {
  if (!category) return CATEGORIES.default;
  const key = category.toLowerCase();
  return CATEGORIES[key] || CATEGORIES.default;
}

function getDifficulty(level: number) {
  const mapped = Math.min(Math.max(Math.ceil(level / 2), 1), 5);
  return DIFFICULTY_MAP[mapped];
}

function StarRating({ rating }: { rating: number }) {
  const display = Math.round(rating * 10) / 10;
  return (
    <span className="flex items-center gap-1 text-xs">
      <Star size={12} className="text-amber-400 fill-amber-400" />
      <span className="font-medium text-slate-700">{display > 0 ? display.toFixed(1) : "–"}</span>
    </span>
  );
}

function ShimmerSkeleton() {
  return (
    <div className="relative overflow-hidden angular-card bg-[#0f172a]">
      <div className="h-40 bg-white/10">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-white/10" />
          <div className="h-5 w-20 rounded-full bg-white/10" />
        </div>
        <div className="h-5 w-3/4 bg-white/10 rounded" />
        <div className="h-3 w-full bg-white/10 rounded" />
        <div className="h-3 w-1/2 bg-white/10 rounded" />
        <div className="flex gap-3 pt-1">
          <div className="h-3 w-16 bg-white/10 rounded" />
          <div className="h-3 w-14 bg-white/10 rounded" />
          <div className="h-3 w-12 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course, index, isLocked, isEnrolled, sectionCount, lessonCount, categoryStyle, difficulty, gate, isFavorited, onToggleFavorite }: {
  course: Course & { averageRating?: number; _count?: any };
  index: number;
  isLocked: boolean;
  isEnrolled: boolean;
  sectionCount: number;
  lessonCount: number;
  categoryStyle: any;
  difficulty: any;
  gate: any;
  isFavorited: boolean;
  onToggleFavorite: (courseId: string, e: React.MouseEvent) => void;
}) {
  const cardContent = (
    <>
      {/* Cover */}
      <div className="relative h-40 overflow-hidden bg-[#0f172a] border-b border-white/10">
        {course.imageUrl ? (
          <Image
            src={course.imageUrl}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
            className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <GraduationCap size={40} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded border ${categoryStyle.bg} ${categoryStyle.color}`}>
              {categoryStyle.label}
            </span>
            {index < 2 && (
              <span className="text-[10px] font-semibold px-2 py-1 bg-amber-100 text-amber-700 border border-amber-200"
                style={{ clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)" }}>
                Staff Pick
              </span>
            )}
          </div>
          <button
            onClick={(e) => onToggleFavorite(course.id, e)}
            className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-white/10 hover:bg-[#0f172a] transition-colors"
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={14} className={isFavorited ? "text-red-500 fill-red-500" : "text-slate-400"} />
          </button>
          {isLocked && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded bg-white/90 text-slate-600 border border-white/10 backdrop-blur-sm">
              <Lock size={10} />
              Lv.{gate.requiredLevel}
            </span>
          )}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* Body */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className={`text-base font-semibold line-clamp-2 mb-1 ${isLocked ? "text-slate-400" : "text-white group-hover:text-slate-200 transition-colors"}`}>
            {course.title}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {course.description || "Comprehensive training module."}
          </p>
        </div>

        {/* Difficulty */}
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium uppercase tracking-wider ${difficulty.color}`}>
            {difficulty.label}
          </span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((dot) => (
              <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot <= difficulty.dots ? "bg-slate-800" : "bg-slate-300"}`} />
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <StarRating rating={course.averageRating || 0} />
          <span>·</span>
          <span className="flex items-center gap-1">
            <Users size={11} className="text-slate-400" />
            {course._count?.enrollments || 0}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Layers size={11} className="text-slate-400" />
            {sectionCount} modules
          </span>
          {course.estimatedHours && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock size={11} className="text-slate-400" />
                {course.estimatedHours}h
              </span>
            </>
          )}
        </div>

        {/* Action */}
        <div className={`pt-2 border-t flex items-center justify-between text-sm font-medium ${isLocked ? "border-white/10 text-slate-400" : "border-white/10 text-slate-600 group-hover:text-white"}`}>
          <span>{isLocked ? "Locked" : isEnrolled ? "Resume" : "Begin training"}</span>
          {!isLocked && <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />}
        </div>
      </div>
    </>
  );

  const baseClasses = "group relative overflow-hidden angular-card bg-[#0f172a] transition-all duration-300";

  if (isLocked) {
    return (
      <div className={`${baseClasses} opacity-50 cursor-not-allowed`} aria-disabled="true">
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={`/dashboard/courses/${course.id}`} className={`${baseClasses} hover:border-white/10 hover:shadow-md`}>
      {cardContent}
    </Link>
  );
}

function CourseRow({ course, index, isLocked, isEnrolled, sectionCount, lessonCount, categoryStyle, difficulty, gate, isFavorited, onToggleFavorite }: {
  course: Course & { averageRating?: number; _count?: any };
  index: number;
  isLocked: boolean;
  isEnrolled: boolean;
  sectionCount: number;
  lessonCount: number;
  categoryStyle: any;
  difficulty: any;
  gate: any;
  isFavorited: boolean;
  onToggleFavorite: (courseId: string, e: React.MouseEvent) => void;
}) {
  const inner = (
    <div className={`group flex items-center gap-4 px-4 py-3 bg-[#0f172a] border-b border-slate-100 hover:bg-white/5 transition-colors ${isLocked ? "opacity-50" : ""}`}>
      {/* Rank */}
      <span className="text-xs text-slate-400 w-6 text-center shrink-0">{index + 1}</span>

      {/* Title + category */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isLocked ? "text-slate-400" : "text-white"} truncate`}>
            {course.title}
          </span>
          {index < 2 && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded shrink-0">
              Staff Pick
            </span>
          )}
          {isLocked && <Lock size={10} className="text-slate-400 shrink-0" />}
        </div>
        <span className={`text-[10px] font-medium ${categoryStyle.color}`}>{categoryStyle.label}</span>
      </div>

      {/* Difficulty */}
      <div className="hidden sm:flex items-center gap-1.5 w-28 shrink-0">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((dot) => (
            <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot <= difficulty.dots ? "bg-slate-800" : "bg-slate-300"}`} />
          ))}
        </div>
        <span className="text-[10px] text-slate-500">{difficulty.label}</span>
      </div>

      {/* Rating */}
      <div className="hidden md:block w-16 shrink-0">
        <StarRating rating={course.averageRating || 0} />
      </div>

      {/* Enrolled */}
      <div className="hidden md:block w-16 text-xs text-slate-500 shrink-0">
        {course._count?.enrollments || 0}
      </div>

      {/* Modules */}
      <div className="hidden lg:block w-20 text-xs text-slate-500 shrink-0">
        {sectionCount} modules
      </div>

      {/* Action */}
      <div className="w-24 shrink-0 text-right flex items-center justify-end gap-2">
        <button
          onClick={(e) => onToggleFavorite(course.id, e)}
          className="p-1 rounded-md hover:bg-white/5 transition-colors"
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={14} className={isFavorited ? "text-red-500 fill-red-500" : "text-slate-400"} />
        </button>
        <span className={`text-xs font-medium ${isLocked ? "text-slate-400" : "text-[#7AD62A] group-hover:text-[#1a7a4d]"}`}>
          {isLocked ? "Locked" : isEnrolled ? "Resume" : "Start"}
        </span>
      </div>
    </div>
  );

  if (isLocked) return inner;
  return (
    <Link href={`/dashboard/courses/${course.id}`} className="block">
      {inner}
    </Link>
  );
}

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<(Course & { averageRating?: number; _count?: any })[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, { enrolledAt: string; lastActivityAt: string }>>({});
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = async (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetchApi(`/courses/${courseId}/favorite`, { method: "POST" }) as { favorited: boolean };
      setFavorites((prev) => {
        const next = new Set(prev);
        if (res.favorited) next.add(courseId);
        else next.delete(courseId);
        return next;
      });
    } catch {
      toast.error("Failed to update favorite");
    }
  };

  useEffect(() => {
    try {
      setLevel(getLevel(parseInt(localStorage.getItem("xp") || "0", 10)));
    } catch {
      setLevel(1);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    fetchApi("/courses/my-favorites")
      .then((ids) => setFavorites(new Set(ids as string[])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadCourses() {
      try {
        const [data, enrollmentsData] = await Promise.all([
          fetchApi<any[]>("/courses"),
          fetchApi("/courses/my-enrollments").catch(() => []),
        ]);
        if (!cancelled) {
          setCourses(data);
          const enrollMap: Record<string, { enrolledAt: string; lastActivityAt: string }> = {};
          if (Array.isArray(enrollmentsData)) {
            for (const e of enrollmentsData) {
              enrollMap[e.courseId] = { enrolledAt: e.enrolledAt, lastActivityAt: e.lastActivityAt };
            }
          }
          setEnrollments(enrollMap);
        }
      } catch {
        if (!cancelled) toast.error("Failed to load courses");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCourses();
    return () => { cancelled = true; };
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      !searchQuery ||
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || course.category?.toLowerCase() === selectedCategory.toLowerCase();
    const courseDifficulty = getDifficulty(course.difficulty || 1).dots;
    const matchesDifficulty = !selectedDifficulty || courseDifficulty === selectedDifficulty;

    const isEnrolled = !!enrollments[course.id];
    if (activeTab === "in-progress" && !isEnrolled) return false;
    if (activeTab === "completed" && !(course.progress === 100)) return false;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const activeCategories = Array.from(
    new Set(courses.map((c) => c.category).filter(Boolean))
  ) as string[];

  const tabCounts = {
    all: courses.length,
    "in-progress": courses.filter((c) => !!enrollments[c.id]).length,
    completed: courses.filter((c) => c.progress === 100).length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-60 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="h-10 w-full max-w-md bg-white/10 rounded-lg animate-pulse" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-7 w-20 bg-white/10 rounded-full animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((id) => <ShimmerSkeleton key={id} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Courses"
        description={`${courses.length} course${courses.length !== 1 ? "s" : ""} available`}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-[#7AD62A] text-[#7AD62A]"
                : "border-transparent text-slate-500 hover:text-slate-200 hover:border-white/10"
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id ? "bg-[#7AD62A]/10 text-[#7AD62A]" : "bg-slate-100 text-slate-500"
            }`}>
              {tabCounts[tab.id]}
            </span>
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/10 text-slate-700" : "text-slate-400 hover:text-slate-300"}`}
            aria-label="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-white/10 text-slate-700" : "text-slate-400 hover:text-slate-300"}`}
            aria-label="Table view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#0f172a] border border-white/10 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
              !selectedCategory
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-slate-100 text-slate-500 border-white/10 hover:border-white/10"
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
                    : "bg-slate-100 text-slate-500 border-white/10 hover:border-white/10"
                }`}
              >
                {style.label}
              </button>
            );
          })}
        </div>

        {courses.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDifficulty(null)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                !selectedDifficulty
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-slate-100 text-slate-500 border-white/10 hover:border-white/10"
              }`}
            >
              All levels
            </button>
            {Object.entries(DIFFICULTY_MAP).map(([key, d]) => (
              <button
                key={key}
                onClick={() => setSelectedDifficulty(selectedDifficulty === d.dots ? null : d.dots)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                  selectedDifficulty === d.dots
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-slate-100 text-slate-500 border-white/10 hover:border-white/10"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {filteredCourses.length === 0 ? (
        <div className="angular-card bg-[#0f172a] py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-blue-600" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">
            {searchQuery || selectedCategory || selectedDifficulty || activeTab !== "all"
              ? "No courses match your filters"
              : "No courses published yet"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedCategory || selectedDifficulty || activeTab !== "all"
              ? "Try adjusting your search or clearing filters."
              : "Courses will appear here once published by an administrator."}
          </p>
          {(searchQuery || selectedCategory || selectedDifficulty || activeTab !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
                setSelectedDifficulty(null);
                setActiveTab("all");
              }}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => {
            const firstSectionTitle = course.sections?.[0]?.title || "";
            const gate = getCourseLock(firstSectionTitle, level);
            const isLocked = gate.locked;
            const isEnrolled = !!enrollments[course.id];
            const sectionCount = course._count?.sections || course.sections?.length || 0;
            const lessonCount =
              course.sections?.reduce(
                (acc: number, s: Section) => acc + (s._count?.lessons || s.lessons?.length || 0),
                0
              ) || 0;
            const categoryStyle = getCategoryStyle(course.category);
            const difficulty = getDifficulty(course.difficulty || 1);

            return (
              <CourseCard
                key={course.id}
                course={course}
                index={index}
                isLocked={isLocked}
                isEnrolled={isEnrolled}
                sectionCount={sectionCount}
                lessonCount={lessonCount}
                categoryStyle={categoryStyle}
                difficulty={difficulty}
                gate={gate}
                isFavorited={favorites.has(course.id)}
                onToggleFavorite={toggleFavorite}
              />
            );
          })}
        </div>
      ) : (
        <div className="angular-card overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-4 px-4 py-2.5 bg-white/5 border-b border-white/10 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <span className="w-6 text-center shrink-0">#</span>
            <span className="flex-1">Course</span>
            <span className="hidden sm:block w-28 shrink-0">Difficulty</span>
            <span className="hidden md:block w-16 shrink-0">Rating</span>
            <span className="hidden md:block w-16 shrink-0">Enrolled</span>
            <span className="hidden lg:block w-20 shrink-0">Modules</span>
            <span className="w-24 shrink-0 text-right">Action</span>
          </div>
          {filteredCourses.map((course, index) => {
            const firstSectionTitle = course.sections?.[0]?.title || "";
            const gate = getCourseLock(firstSectionTitle, level);
            const isLocked = gate.locked;
            const isEnrolled = !!enrollments[course.id];
            const sectionCount = course._count?.sections || course.sections?.length || 0;
            const lessonCount =
              course.sections?.reduce(
                (acc: number, s: Section) => acc + (s._count?.lessons || s.lessons?.length || 0),
                0
              ) || 0;
            const categoryStyle = getCategoryStyle(course.category);
            const difficulty = getDifficulty(course.difficulty || 1);

            return (
              <CourseRow
                key={course.id}
                course={course}
                index={index}
                isLocked={isLocked}
                isEnrolled={isEnrolled}
                sectionCount={sectionCount}
                lessonCount={lessonCount}
                categoryStyle={categoryStyle}
                difficulty={difficulty}
                gate={gate}
                isFavorited={favorites.has(course.id)}
                onToggleFavorite={toggleFavorite}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
