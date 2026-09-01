"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  ChevronRight,
  Loader2,
  Building2,
  Clock,
  Layers,
  FileCheck,
  ClipboardCheck,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

interface CurriculumModule {
  id: string;
  name: string;
  code: string;
  credits: number;
  theoryHours: number;
  practicalHours: number;
  outcomes: { id: string }[];
  labs: { id: string }[];
}

interface Curriculum {
  id: string;
  name: string;
  description: string;
  institution: string;
  degree: string;
  year: number;
  isActive: boolean;
  createdAt: string;
  modules: CurriculumModule[];
  _count: { cohorts: number };
}

export default function CurriculaPage() {
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchApi("/curricula");
        if (!cancelled) setCurricula(data);
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
        <Loader2 size={24} className="animate-spin text-[#7AD62A]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500 text-sm">{error}</div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader title="Curricula" description="Academic programs and course structures" />

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#1b3657] p-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Program Architecture</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Design learning structure that institutions can defend</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Curricula connect modules, outcomes, labs, and cohorts into one academic system. That structure is what makes the certification and university story credible.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={15} className="text-[#7AD62A]" />
                <p className="text-sm font-semibold text-white">Curricula listed</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{curricula.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2">
                <FileCheck size={15} className="text-[#7AD62A]" />
                <p className="text-sm font-semibold text-white">What to review</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">Check whether modules, outcomes, labs, and cohorts align into a coherent academic route.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Cards */}
      {curricula.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No curricula found"
          description="Curricula will appear here once an admin creates them."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {curricula.map((curr) => {
            const totalCredits = curr.modules.reduce((s, m) => s + m.credits, 0);
            const totalOutcomes = new Set(
              curr.modules.flatMap((m) => m.outcomes.map((o) => o.id))
            ).size;
            const totalLabs = new Set(
              curr.modules.flatMap((m) => m.labs.map((l) => l.id))
            ).size;

            return (
              <Link
                key={curr.id}
                href={`/dashboard/curricula/${curr.id}`}
                className="bg-[#0f172a] rounded-xl border border-white/10 p-6 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center">
                    <GraduationCap size={24} className="text-[#7AD62A]" />
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-400 group-hover:text-[#7AD62A] transition-colors mt-1"
                  />
                </div>

                <h3 className="text-lg font-semibold text-white mb-1">
                  {curr.name}
                </h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                  {curr.description}
                </p>

                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Building2 size={12} />
                    {curr.institution}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award size={12} />
                    {curr.degree}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {curr.year}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Layers size={12} className="text-[#7AD62A]" />
                    {curr.modules.length} modules
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <BookOpen size={12} className="text-[#7AD62A]" />
                    {totalCredits} credits
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Users size={12} className="text-[#7AD62A]" />
                    {curr._count.cohorts} cohorts
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <ClipboardCheck size={12} className="text-[#7AD62A]" />
                    {totalOutcomes} outcomes
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <FileCheck size={12} className="text-[#7AD62A]" />
                    {totalLabs} labs
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
