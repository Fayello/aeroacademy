"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Shield,
  AlertTriangle,
} from "lucide-react";

interface Assessment {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  maxScore: number;
  passingScore: number;
  maxAttempts: number;
  isProctored: boolean;
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
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const url = domainFilter ? `/practical-assessments?domainId=${domainFilter}` : "/practical-assessments";
      const data = await fetchApi(url);
      if (!cancelledRef.current) setAssessments(data);
    } catch (err) {
      if (!cancelledRef.current) setError(err instanceof Error ? err.message : "Failed to load assessments");
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [domainFilter]);

  useEffect(() => {
    cancelledRef.current = false;
    load();
    return () => { cancelledRef.current = true; };
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
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText size={28} className="text-[#7AD62A]" />
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
              ? "bg-[#7AD62A] text-white"
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
                ? "bg-[#7AD62A] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Assessment Cards */}
      {assessments.length === 0 ? (
        <div className="angular-card bg-[#0f172a] py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-amber-600" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No exams assigned</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Practical exams will appear here once your instructor assigns them. Keep completing labs to be ready.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessments.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/exams/${a.id}`}
              className="angular-card bg-[#0f172a] p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center">
                  <FileText size={24} className="text-[#7AD62A]" />
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-400 group-hover:text-[#7AD62A] transition-colors mt-1"
                />
              </div>

              <h3 className="text-lg font-semibold text-white mb-1">{a.title}</h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{a.description}</p>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                {a.domain && (
                  <span className="px-2 py-0.5 bg-[#7AD62A]/10 text-[#0F203A] rounded-full">
                    {a.domain.name}
                  </span>
                )}
                {a.isProctored && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 rounded-full flex items-center gap-1">
                    <Shield size={10} />
                    Proctored
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
                <span className="text-xs font-medium text-[#7AD62A] flex items-center gap-1">
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
