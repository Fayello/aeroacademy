"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import {
  FileText,
  ChevronRight,
  Loader2,
  Clock,
  Users,
  Target,
  Play,
} from "lucide-react";

interface Assessment {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  maxScore: number;
  isActive: boolean;
  createdAt: string;
  domain: { name: string } | null;
  scenarios: { id: string }[];
  outcomes: { outcome: { code: string; title: string } }[];
  _count: { attempts: number };
}

export default function ExamsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const url = domainFilter ? `/assessments?domainId=${domainFilter}` : "/assessments";
        const data = await fetchApi(url);
        if (!cancelled) setAssessments(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [domainFilter]);

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
          <FileText size={28} className="text-[#229C62]" />
          Practical Exams
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Controlled assessments with auto-grading and grade reports
        </p>
      </div>

      {/* Domain Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setDomainFilter("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            domainFilter === ""
              ? "bg-[#229C62] text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All
        </button>
        {["SYSTEMS", "NETWORKING", "DEVOPS", "DATABASES", "SECURITY", "QA"].map((d) => (
          <button
            key={d}
            onClick={() => setDomainFilter(d === domainFilter ? "" : d)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              domainFilter === d
                ? "bg-[#229C62] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Assessment Cards */}
      {assessments.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm">No assessments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessments.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/exams/${a.id}`}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#E9F8EE] flex items-center justify-center">
                  <FileText size={24} className="text-[#229C62]" />
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-400 group-hover:text-[#229C62] transition-colors mt-1"
                />
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-1">{a.title}</h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{a.description}</p>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                {a.domain && (
                  <span className="px-2 py-0.5 bg-[#E9F8EE] text-[#0F203A] rounded-full">
                    {a.domain.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {a.timeLimit} min
                </span>
                <span className="flex items-center gap-1">
                  <Target size={12} />
                  {a.scenarios.length} scenarios
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {a._count.attempts} attempt{a._count.attempts !== 1 ? "s" : ""}
                </span>
                <span className="text-xs font-medium text-[#229C62] flex items-center gap-1">
                  <Play size={10} fill="currentColor" />
                  Start
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
