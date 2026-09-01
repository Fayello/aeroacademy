"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Brain,
  Clock,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Loader2,
  MessageCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import EmptyState from "@/components/ui/EmptyState";

interface TutoringAnalytics {
  totalInteractions: number;
  byType: Record<string, number>;
  byMethod: Record<string, number>;
  topConcepts: Array<{ concept: string; count: number }>;
  avgInteractionsPerUser: number;
  uniqueUsers: number;
  labAssistCount: number;
  socraticCount: number;
  hourlyDistribution: Array<{ hour: number; count: number }>;
}

const TYPE_ICONS: Record<string, typeof MessageCircle> = {
  chat: MessageCircle,
  lab_assist: HelpCircle,
  hint: Lightbulb,
  socratic: Brain,
};

const TYPE_COLORS: Record<string, string> = {
  chat: "#229C62",
  lab_assist: "#7AD62A",
  hint: "#F59E0B",
  socratic: "#8B5CF6",
};

export default function TutoringDashboard() {
  const [analytics, setAnalytics] = useState<TutoringAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchApi("/ai/tutor/analytics")
      .then((data) => {
        if (!cancelled) setAnalytics(data);
      })
      .catch((err) => {
        console.error("Failed to load tutoring analytics:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-[#7AD62A]" size={32} />
      </div>
    );
  }

  if (!analytics) {
    return <EmptyState icon={GraduationCap} title="No tutoring data yet" description="" />;
  }

  const maxHourly = Math.max(...analytics.hourlyDistribution.map((item) => item.count), 1);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 lg:px-6">
        <div className="angular-card overflow-hidden border border-white/10 bg-gradient-to-br from-[#0F203A] via-slate-900 to-[#16315c] p-6 sm:p-8">
          <Link href="/dashboard/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#7AD62A] transition-colors">
            <ArrowLeft size={14} />
            Return to admin operations
          </Link>
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7AD62A]/10">
                <GraduationCap size={24} className="text-[#7AD62A]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Tutoring Analytics</h1>
                <p className="text-slate-300">
                  Review how AI tutoring is supporting learners, where help demand concentrates, and whether guidance methods align with course outcomes.
                </p>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Watch For</p>
                <p className="mt-2 font-medium text-white">Concepts or support types that spike repeatedly across the same learning pathway.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Interpret Carefully</p>
                <p className="mt-2 font-medium text-white">High tutoring volume can reflect good learner engagement or unclear instructional design.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Operational Use</p>
                <p className="mt-2 font-medium text-white">Use method mix and lab-assist demand to tune content, instructor support, and knowledge checks.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard label="Total Interactions" value={analytics.totalInteractions} icon={MessageCircle} color="#229C62" />
          <StatsCard label="Unique Students" value={analytics.uniqueUsers} icon={Users} color="#ffffff" />
          <StatsCard label="Avg Per Student" value={analytics.avgInteractionsPerUser} icon={TrendingUp} color="#7AD62A" />
          <StatsCard label="Lab Assists" value={analytics.labAssistCount} icon={HelpCircle} color="#F59E0B" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <BarChart3 size={16} className="text-[#7AD62A]" />
              Interaction Types
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const Icon = TYPE_ICONS[type] || MessageCircle;
                  const color = TYPE_COLORS[type] || "#94a3b8";
                  const pct = analytics.totalInteractions > 0 ? Math.round((count / analytics.totalInteractions) * 100) : 0;
                  return <UsageBar key={type} label={type.replace("_", " ")} count={count} pct={pct} color={color} icon={<Icon size={14} style={{ color }} />} />;
                })}
            </div>
          </div>

          <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Brain size={16} className="text-violet-400" />
              Teaching Methods
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.byMethod)
                .sort(([, a], [, b]) => b - a)
                .map(([method, count]) => {
                  const methodColors: Record<string, string> = {
                    socratic: "#8B5CF6",
                    direct: "#229C62",
                    hint: "#F59E0B",
                    encouragement: "#3B82F6",
                  };
                  const color = methodColors[method] || "#94a3b8";
                  const pct = analytics.totalInteractions > 0 ? Math.round((count / analytics.totalInteractions) * 100) : 0;
                  return <UsageBar key={method} label={method} count={count} pct={pct} color={color} />;
                })}
            </div>
          </div>

          <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Lightbulb size={16} className="text-amber-400" />
              Top Concepts Discussed
            </h3>
            {analytics.topConcepts.length === 0 ? (
              <p className="text-sm text-slate-400">No concepts tracked yet.</p>
            ) : (
              <div className="space-y-2">
                {analytics.topConcepts.slice(0, 8).map((concept, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-white/10 py-2 last:border-0">
                    <span className="text-sm text-white">{concept.concept}</span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-300">{concept.count}x</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="angular-card border border-white/10 bg-[#0f172a] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Clock size={16} className="text-blue-400" />
              Activity by Hour (UTC)
            </h3>
            <div className="flex h-32 items-end gap-1">
              {analytics.hourlyDistribution.map((item) => (
                <div
                  key={item.hour}
                  className="min-w-[4px] flex-1 rounded-t transition-all"
                  style={{
                    height: `${(item.count / maxHourly) * 100}%`,
                    background: item.count > 0 ? "#229C62" : "#334155",
                    minHeight: item.count > 0 ? "4px" : "1px",
                  }}
                  title={`${item.hour}:00 - ${item.count} interactions`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-400">
              <span>0:00</span>
              <span>12:00</span>
              <span>23:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: typeof MessageCircle;
  color: string;
}) {
  return (
    <div className="angular-card border border-white/10 bg-[#0f172a] p-5">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={16} style={{ color }} />
        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function UsageBar({
  label,
  count,
  pct,
  color,
  icon,
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
  icon?: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm capitalize text-white">{label}</span>
        </div>
        <span className="text-sm font-medium" style={{ color }}>
          {count} ({pct}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
