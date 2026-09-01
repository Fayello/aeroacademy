"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import {
  Users,
  ChevronRight,
  Loader2,
  GraduationCap,
  Calendar,
  AlertTriangle,
  ClipboardCheck,
  School2,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

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
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchApi("/cohorts");
      if (!cancelledRef.current) setCohorts(data);
    } catch (err) {
      if (!cancelledRef.current) setError(err instanceof Error ? err.message : "Failed to load cohorts");
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);
    return () => {
      cancelledRef.current = true;
      window.clearTimeout(timeoutId);
    };
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#7AD62A]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle size={32} className="text-red-400 mb-3" />
        <p className="text-sm text-slate-600 mb-3">{error}</p>
        <button onClick={load} className="px-4 py-2 text-sm font-medium text-[#7AD62A] hover:bg-[#7AD62A]/10 rounded-lg transition-colors">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Cohorts"
        description="View the grouped learning environments that connect students, curricula, and governed evaluation"
      />

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#1b3657] p-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">University Delivery</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Track cohorts as teaching, grading, and readiness units</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Cohorts should feel like governed academic delivery groups, not just student lists. Use them to review enrollment load, curriculum fit, and practical readiness.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2">
                <School2 size={15} className="text-[#7AD62A]" />
                <p className="text-sm font-semibold text-white">Cohorts listed</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{cohorts.length}</p>
              <p className="mt-1 text-xs text-slate-400">Active teaching groups currently visible</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={15} className="text-[#7AD62A]" />
                <p className="text-sm font-semibold text-white">What to review</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">Check membership load, curriculum alignment, and whether each cohort is ready for deeper record review.</p>
            </div>
          </div>
        </div>
      </div>

      {cohorts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No cohorts yet"
          description="Cohorts appear when an instructor or administrator creates a governed academic group for teaching and record tracking."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cohorts.map((cohort) => (
            <Link
              key={cohort.id}
              href={`/dashboard/cohorts/${cohort.id}`}
              className="bg-[#0f172a] rounded-xl border border-white/10 p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center">
                  <Users size={24} className="text-[#7AD62A]" />
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-400 group-hover:text-[#7AD62A] transition-colors mt-1"
                />
              </div>

              <h3 className="text-lg font-semibold text-white mb-1">{cohort.name}</h3>

              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <GraduationCap size={12} />
                  {cohort.curriculum.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {cohort.semester} {cohort.year}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="text-slate-300">
                  <span className="font-semibold text-[#7AD62A]">{cohort._count.members}</span>
                  /{cohort.maxStudents} students
                </span>
                <span className="text-slate-400">{cohort.curriculum.degree}</span>
              </div>

              <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#7AD62A] rounded-full transition-all"
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
