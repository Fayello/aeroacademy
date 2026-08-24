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
} from "lucide-react";

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
        <Loader2 size={24} className="animate-spin text-[#229C62]" />
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap size={28} className="text-[#229C62]" />
          Curricula
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Academic programs and course structures
        </p>
      </div>

      {/* Curriculum Cards */}
      {curricula.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <GraduationCap size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm">No curricula found</p>
        </div>
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
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E9F8EE] flex items-center justify-center">
                    <GraduationCap size={24} className="text-[#229C62]" />
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-400 group-hover:text-[#229C62] transition-colors mt-1"
                  />
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-1">
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
                    <Layers size={12} className="text-[#229C62]" />
                    {curr.modules.length} modules
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <BookOpen size={12} className="text-[#229C62]" />
                    {totalCredits} credits
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Users size={12} className="text-[#229C62]" />
                    {curr._count.cohorts} cohorts
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
