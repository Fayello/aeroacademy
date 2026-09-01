"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import {
  ClipboardCheck,
  ChevronRight,
  Loader2,
  Users,
  GraduationCap,
  School2,
  FileCheck,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

interface TeachingCohort {
  id: string;
  name: string;
  semester: string | null;
  year: number;
  curriculum: { name: string; degree: string } | null;
  _count: { members: number };
}

function getCurriculumHealthLabel(count: number) {
  if (count >= 4) return "Multi-cohort active";
  if (count >= 1) return "Teaching in progress";
  return "Awaiting assignments";
}

export default function GradebookIndexPage() {
  const [cohorts, setCohorts] = useState<TeachingCohort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchApi<TeachingCohort[]>("/cohorts");
        if (!cancelled) setCohorts(data);
      } catch {
        // empty state
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
        <Loader2 size={24} className="animate-spin text-[#7AD62A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title="Gradebook" description="Select a cohort to view or enter grades" />

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#1b3657] p-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Instructor Workflow</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Move from cohort delivery to defensible grading</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Use the gradebook to manage assessment categories, record results, and maintain a transparent academic trail for each cohort.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2">
                <School2 size={15} className="text-[#7AD62A]" />
                <p className="text-sm font-semibold text-white">Cohorts available</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{cohorts.length}</p>
              <p className="mt-1 text-xs text-slate-400">{getCurriculumHealthLabel(cohorts.length)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2">
                <FileCheck size={15} className="text-[#7AD62A]" />
                <p className="text-sm font-semibold text-white">Why it matters</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">Clear grading structure strengthens student trust and institutional credibility.</p>
            </div>
          </div>
        </div>
      </div>

      {cohorts.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No cohorts to grade"
          description="You don't have any teaching assignments yet. Create a cohort in the Curriculum section to get started."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cohorts.map((cohort) => (
            <Link
              key={cohort.id}
              href={`/dashboard/gradebook/${cohort.id}`}
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

              <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                {cohort.curriculum && (
                  <span className="flex items-center gap-1">
                    <GraduationCap size={12} />
                    {cohort.curriculum.name}
                  </span>
                )}
                <span>{cohort.semester} {cohort.year}</span>
              </div>

              <div className="text-xs text-slate-600">
                <span className="font-semibold text-[#7AD62A]">{cohort._count.members}</span> students
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
