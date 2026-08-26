"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import {
  ClipboardCheck,
  Loader2,
  ChevronRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  XCircle,
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
      <PageHeader title="Skill Assessments" description="Evaluate your skills and get personalized recommendations" />

      {assessments.length === 0 ? (
        <div className="angular-card border border-slate-200 bg-white p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck size={28} className="text-purple-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">No assessments available</h3>
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
              className="angular-card border border-slate-200 bg-white p-5 hover:border-blue-300 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg">
                    <ClipboardCheck size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
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
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Past Results</h2>
          <div className="angular-card border border-slate-200 bg-white overflow-hidden">
            <div className="divide-y divide-slate-100">
              {results.map((r) => {
                const pct = Math.round((r.score / r.maxScore) * 100);
                return (
                  <div key={r.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{r.assessment.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString()} · {r.score}/{r.maxScore}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pct >= 80 ? "bg-[#229C62]" : pct >= 50 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{pct}%</span>
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
