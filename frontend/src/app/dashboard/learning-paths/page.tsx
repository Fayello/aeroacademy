"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import {
  Route,
  BookOpen,
  Clock,
  Users,
  ChevronRight,
  Loader2,
  GraduationCap,
  Lock,
  CheckCircle2,
  Search,
  X,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  estimatedHours: number | null;
}

interface LearningPathCourse {
  id: string;
  order: number;
  courseId: string;
  course: Course;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  difficulty: string;
  courseCount: number;
  enrollmentCount: number;
  totalEstimatedHours: number;
  courses: LearningPathCourse[];
  createdAt: string;
}

const difficultyColors: Record<string, string> = {
  BEGINNER: "bg-[#E9F8EE] text-[#0F203A]",
  INTERMEDIATE: "bg-amber-100 text-amber-700",
  ADVANCED: "bg-red-100 text-red-700",
  EXPERT: "bg-purple-100 text-purple-700",
};

export default function LearningPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchApi("/learning-paths")
      .then((data) => setPaths(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#229C62]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Route size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Learning Paths</h1>
              <p className="text-violet-200 text-sm">Structured curricula to master technical skills</p>
            </div>
          </div>
        </div>
      </div>

      {paths.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Route size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No learning paths yet</h3>
          <p className="text-sm text-slate-500">Learning paths will appear here once an admin creates them.</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search learning paths..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all bg-white"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {paths.filter((p) => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <Search size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-500">No paths match &ldquo;{searchQuery}&rdquo;</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {paths
                .filter((p) => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((path) => (
            <Link
              key={path.id}
              href={`/dashboard/learning-paths/${path.id}`}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-violet-300 transition-all group"
            >
              <div className="h-3 bg-gradient-to-r from-violet-500 to-indigo-500" />
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-violet-600 transition-colors">
                    {path.title}
                  </h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${difficultyColors[path.difficulty] || difficultyColors.BEGINNER}`}>
                    {path.difficulty}
                  </span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{path.description}</p>

                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <GraduationCap size={12} />
                    {path.courseCount} courses
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    ~{path.totalEstimatedHours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {path.enrollmentCount} enrolled
                  </span>
                </div>

                {path.courses.length > 0 && (
                  <div className="space-y-2">
                    {path.courses.slice(0, 3).map((lpc, i) => (
                      <div key={lpc.id} className="flex items-center gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-slate-700 truncate">{lpc.course.title}</span>
                      </div>
                    ))}
                    {path.courses.length > 3 && (
                      <p className="text-xs text-slate-400 ml-7">+{path.courses.length - 3} more</p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-violet-600 font-medium group-hover:underline">
                    View path details
                  </span>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-violet-600 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
          )}
        </>
      )}
    </div>
  );
}
