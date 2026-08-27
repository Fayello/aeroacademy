"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Layers,
  Users,
  Award,
  Loader2,
  Clock,
  Target,
  Beaker,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

interface Outcome {
  id: string;
  code: string;
  title: string;
  domain: { name: string };
}

interface Lab {
  id: string;
  title: string;
}

interface Module {
  id: string;
  name: string;
  code: string;
  credits: number;
  theoryHours: number;
  practicalHours: number;
  outcomes: { outcome: Outcome; weight: number }[];
  labs: { lab: Lab }[];
}

interface Cohort {
  id: string;
  name: string;
  semester: string;
  year: number;
  members: { id: string }[];
}

interface Curriculum {
  id: string;
  name: string;
  description: string;
  institution: string;
  degree: string;
  year: number;
  modules: Module[];
  cohorts: Cohort[];
}

export default function CurriculumDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "modules" | "cohorts">("overview");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchApi(`/curricula/${id}`);
        if (!cancelled) setCurriculum(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#229C62]" />
      </div>
    );
  }

  if (error || !curriculum) {
    return (
      <div className="text-center py-20 text-red-500 text-sm">{error || "Not found"}</div>
    );
  }

  const totalCredits = curriculum.modules.reduce((s, m) => s + m.credits, 0);
  const totalTheory = curriculum.modules.reduce((s, m) => s + m.theoryHours, 0);
  const totalPractical = curriculum.modules.reduce((s, m) => s + m.practicalHours, 0);
  const totalOutcomes = new Set(
    curriculum.modules.flatMap((m) => m.outcomes.map((o) => o.outcome.id))
  ).size;
  const totalLabs = new Set(
    curriculum.modules.flatMap((m) => m.labs.map((l) => l.lab.id))
  ).size;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-white" style={{ background: "linear-gradient(135deg, #0F203A, #229C62, #0d9488)" }}>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <Link
            href="/dashboard/curricula"
            className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors mb-4"
          >
            <ChevronLeft size={16} />
            All curricula
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{curriculum.name}</h1>
          <p className="text-white/80 leading-relaxed max-w-2xl mb-4">{curriculum.description}</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <GraduationCap size={14} />
              {curriculum.degree}
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <Award size={14} />
              {curriculum.institution}
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <Clock size={14} />
              {curriculum.year}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Modules", value: curriculum.modules.length, icon: Layers },
          { label: "Credits", value: totalCredits, icon: BookOpen },
          { label: "Outcomes", value: totalOutcomes, icon: Target },
          { label: "Labs", value: totalLabs, icon: Beaker },
          { label: "Cohorts", value: curriculum.cohorts.length, icon: Users },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <stat.icon size={18} className="mx-auto mb-1 text-[#229C62]" />
            <div className="text-xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {[
          { key: "overview" as const, label: "Overview" },
          { key: "modules" as const, label: "Modules" },
          { key: "cohorts" as const, label: "Cohorts" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Time Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Time Allocation</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">Theory Hours</div>
                <div className="text-2xl font-bold text-slate-900">{totalTheory}h</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Practical Hours</div>
                <div className="text-2xl font-bold text-[#229C62]">{totalPractical}h</div>
              </div>
            </div>
            <div className="mt-4 h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-slate-400 rounded-l-full"
                style={{ width: `${(totalTheory / (totalTheory + totalPractical)) * 100}%` }}
              />
              <div
                className="h-full bg-[#229C62] rounded-r-full"
                style={{ width: `${(totalPractical / (totalTheory + totalPractical)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Theory {Math.round((totalTheory / (totalTheory + totalPractical)) * 100)}%</span>
              <span>Practical {Math.round((totalPractical / (totalTheory + totalPractical)) * 100)}%</span>
            </div>
          </div>

          {/* Learning Outcomes Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Learning Outcomes by Domain</h2>
            <div className="space-y-3">
              {Object.entries(
                curriculum.modules.flatMap((m) =>
                  m.outcomes.map((o) => ({
                    domain: o.outcome.domain.name,
                    code: o.outcome.code,
                    title: o.outcome.title,
                  }))
                ).reduce((acc, o) => {
                  if (!acc[o.domain]) acc[o.domain] = [];
                  acc[o.domain].push(o);
                  return acc;
                }, {} as Record<string, { domain: string; code: string; title: string }[]>)
              ).map(([domain, outcomes]) => (
                <div key={domain}>
                  <div className="text-sm font-medium text-slate-700 mb-2">{domain}</div>
                  <div className="flex flex-wrap gap-2">
                    {outcomes.map((o) => (
                      <span
                        key={o.code}
                        className="px-2 py-1 bg-[#E9F8EE] text-[#0F203A] text-xs rounded-lg"
                        title={o.title}
                      >
                        {o.code}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modules Tab */}
      {activeTab === "modules" && (
        <div className="space-y-4">
          {curriculum.modules.map((mod) => (
            <div key={mod.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full text-[#229C62] bg-[#E9F8EE]">
                      {mod.code}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">{mod.name}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{mod.credits} credits</span>
                    <span>{mod.theoryHours}h theory</span>
                    <span>{mod.practicalHours}h practical</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Outcomes */}
                  <div>
                    <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Outcomes</h4>
                    <div className="space-y-1.5">
                      {mod.outcomes.map((o) => (
                        <div key={o.outcome.id} className="flex items-center gap-2 text-sm">
                          <span className="text-[#229C62] font-mono text-xs">{o.outcome.code}</span>
                          <span className="text-slate-700">{o.outcome.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Labs */}
                  <div>
                    <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Labs</h4>
                    <div className="space-y-1.5">
                      {mod.labs.length === 0 ? (
                        <EmptyState icon={Beaker} title="No labs mapped yet" description="" />
                      ) : (
                        mod.labs.map((l) => (
                          <div key={l.lab.id} className="flex items-center gap-2 text-sm">
                            <Beaker size={12} className="text-[#229C62]" />
                            <span className="text-slate-700">{l.lab.title}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cohorts Tab */}
      {activeTab === "cohorts" && (
        <div className="space-y-4">
          {curriculum.cohorts.length === 0 ? (
            <EmptyState icon={Users} title="No cohorts yet" description="" />
          ) : (
            curriculum.cohorts.map((cohort) => (
              <Link
                key={cohort.id}
                href={`/dashboard/cohorts/${cohort.id}`}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E9F8EE] flex items-center justify-center">
                    <Users size={20} className="text-[#229C62]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{cohort.name}</h3>
                    <p className="text-xs text-slate-500">
                      {cohort.semester} {cohort.year} — {cohort.members.length} students
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-[#229C62] transition-colors" />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
