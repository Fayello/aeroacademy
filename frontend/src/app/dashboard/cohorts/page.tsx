"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import {
  Users,
  ChevronRight,
  Loader2,
  GraduationCap,
  Calendar,
} from "lucide-react";

interface Cohort {
  id: string;
  name: string;
  semester: string;
  year: number;
  maxStudents: number;
  curriculum: { name: string; degree: string };
  _count: { members: number };
}

export default function CohortsPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchApi("/cohorts");
        if (!cancelled) setCohorts(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#229C62]" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-red-500 text-sm">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users size={28} className="text-[#229C62]" />
          Cohorts
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Student groups and professor dashboards
        </p>
      </div>

      {cohorts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#E9F8EE] flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-[#229C62]" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">No cohorts yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Cohorts group students for structured learning paths. Ask your instructor to enroll you in one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cohorts.map((cohort) => (
            <Link
              key={cohort.id}
              href={`/dashboard/cohorts/${cohort.id}`}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#E9F8EE] flex items-center justify-center">
                  <Users size={24} className="text-[#229C62]" />
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-400 group-hover:text-[#229C62] transition-colors mt-1"
                />
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-1">{cohort.name}</h3>

              <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                <span className="flex items-center gap-1">
                  <GraduationCap size={12} />
                  {cohort.curriculum.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {cohort.semester} {cohort.year}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-600">
                  <span className="font-semibold text-[#229C62]">{cohort._count.members}</span>
                  /{cohort.maxStudents} students
                </span>
                <span className="text-slate-500">{cohort.curriculum.degree}</span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#229C62] rounded-full transition-all"
                  style={{
                    width: `${(cohort._count.members / cohort.maxStudents) * 100}%`,
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
