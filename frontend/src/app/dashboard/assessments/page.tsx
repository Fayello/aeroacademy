"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import {
  ClipboardCheck,
  Loader2,
  ChevronRight,
  BookOpen,
  ShieldCheck,
  FileCheck,
  Target,
} from "lucide-react";

interface Assessment {
  id: string;
  title: string;
  description: string;
  category: string;
}

interface AssessmentResult {
  id: string;
  score: number;
  maxScore: number;
  assessment: { title: string; category: string };
  createdAt: string;
  recommendedPath: unknown;
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [a, r] = await Promise.all([
          fetchApi<Assessment[]>("/assessments"),
          fetchApi<AssessmentResult[]>("/assessments/my-results"),
        ]);
        setAssessments(a);
        setResults(r);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title="Readiness Assessments" description="Measure current capability, identify gaps, and route learners into the right training path" />

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-4">
        <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Assessment Purpose</p>
          <h2 className="text-xl font-bold text-white mt-2">Use assessments to place learners accurately before higher-stakes certification work</h2>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            These assessments are designed to identify readiness, not just reward recall. Results help learners understand where to train next and give instructors a cleaner starting point.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            {[
              { title: "Baseline", text: "Measure starting capability", icon: Target },
              { title: "Guidance", text: "Map results to next training steps", icon: BookOpen },
              { title: "Evidence", text: "Keep a record of prior attempts", icon: FileCheck },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <item.icon size={16} className="text-[#7AD62A] mb-2" />
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-slate-400 mt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="angular-card border border-[#7AD62A]/20 bg-[#0f172a] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Standards</p>
          <div className="space-y-3 mt-4">
            {[
              "Assessments should inform the learner’s next move, not confuse it.",
              "Results remain visible so progress can be compared over time.",
              "Course recommendations should become more relevant after each attempt.",
              "Use assessments before advanced labs or certification-prep sequences when possible.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <ShieldCheck size={14} className="text-[#7AD62A] shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {assessments.length === 0 ? (
        <div className="angular-card border border-white/10 bg-[#0f172a] p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck size={28} className="text-purple-600" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No assessments available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Skill assessments are being prepared. Complete some labs first to unlock personalized evaluations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessments.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/assessments/${a.id}`}
              className="angular-card border border-white/10 bg-[#0f172a] p-5 hover:border-blue-300 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 border border-blue-200 p-2 rounded-lg">
                    <ClipboardCheck size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-600 transition-colors">
                      {a.title}
                    </h3>
                    <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {a.category}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <p className="text-xs text-slate-500 mt-3 line-clamp-2">{a.description}</p>
            </Link>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Assessment Record</h2>
          <div className="angular-card border border-white/10 bg-[#0f172a] overflow-hidden">
            <div className="divide-y divide-slate-100">
              {results.map((r) => {
                const pct = Math.round((r.score / r.maxScore) * 100);
                return (
                  <div key={r.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{r.assessment.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })} · {r.score}/{r.maxScore}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pct >= 80 ? "bg-[#7AD62A]" : pct >= 50 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-300">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
