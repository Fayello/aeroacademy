"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import {
  ArrowRight,
  FlaskConical,
  Target,
  Clock,
  AlertTriangle,
  Loader2,
  Zap,
  BookOpen,
} from "lucide-react";

interface NextStep {
  type: "OUTCOME" | "ASSESSMENT" | "LAB" | "MAINTAIN";
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  domainId: string;
  link?: string;
}

interface DashboardData {
  recommendations: NextStep[];
  summary: {
    totalOutcomes: number;
    completedOutcomes: number;
    fadingCount: number;
    totalLabsCompleted: number;
    totalAssessmentsCompleted: number;
  };
}

const TYPE_CONFIG = {
  MAINTAIN: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
  LAB: { icon: FlaskConical, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" },
  OUTCOME: { icon: BookOpen, color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-200" },
  ASSESSMENT: { icon: Target, color: "text-[#229C62]", bg: "bg-[#E9F8EE]", border: "border-[#229C62]/30" },
};

export default function NextSteps() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user.id) return;
        const result = await fetchApi<DashboardData>(
          `/learning-outcomes/competency-profile/${user.id}/enhanced`
        );
        if (!cancelled) setData(result);
      } catch {
        // silent fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-[#229C62]" />
          <h3 className="text-sm font-semibold text-slate-900">What should I do right now?</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 size={18} className="text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!data || data.recommendations.length === 0) return null;

  const topRecs = data.recommendations.slice(0, 3);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-[#229C62]" />
          <h3 className="text-sm font-semibold text-slate-900">What should I do right now?</h3>
        </div>
        <Link
          href="/dashboard/competency"
          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          Full profile <ArrowRight size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {topRecs.map((rec, i) => {
          const config = TYPE_CONFIG[rec.type];
          const Icon = config.icon;

          const content = (
            <div className={`p-3 rounded-lg border ${config.bg} ${config.border} transition-all hover:shadow-sm`}>
              <div className="flex items-start gap-2.5">
                <div className="shrink-0 mt-0.5">
                  <Icon size={14} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 line-clamp-1">{rec.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{rec.description}</p>
                </div>
              </div>
            </div>
          );

          if (rec.link) {
            return (
              <Link key={i} href={rec.link} className="block">
                {content}
              </Link>
            );
          }
          return <div key={i}>{content}</div>;
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-500">
        <span>{data.summary.completedOutcomes}/{data.summary.totalOutcomes} outcomes</span>
        <span className="text-slate-300">|</span>
        <span>{data.summary.totalLabsCompleted} labs done</span>
        {data.summary.fadingCount > 0 && (
          <>
            <span className="text-slate-300">|</span>
            <span className="text-amber-500 flex items-center gap-1">
              <AlertTriangle size={10} />
              {data.summary.fadingCount} fading
            </span>
          </>
        )}
      </div>
    </div>
  );
}
