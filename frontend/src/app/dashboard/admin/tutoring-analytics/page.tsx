"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import {
  GraduationCap,
  Loader2,
  ArrowLeft,
  MessageCircle,
  HelpCircle,
  Lightbulb,
  Brain,
  BarChart3,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";

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

const TYPE_ICONS: Record<string, any> = {
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
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const data = await fetchApi("/ai/tutor/analytics");
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load tutoring analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#229C62]" size={32} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        No tutoring data yet
      </div>
    );
  }

  const maxHourly = Math.max(...analytics.hourlyDistribution.map((h) => h.count), 1);

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Hero */}
      <div className="py-16 px-4" style={{ background: "#0F203A" }}>
        <div className="max-w-6xl mx-auto">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-1.5 text-sm mb-4 transition-colors"
            style={{ color: "#7AD62A" }}
          >
            <ArrowLeft size={14} />
            Admin Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(122,214,42,0.15)" }}
            >
              <GraduationCap size={24} style={{ color: "#7AD62A" }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Tutoring Analytics
              </h1>
              <p className="text-slate-400">
                AI tutoring interaction insights
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Interactions",
              value: analytics.totalInteractions,
              icon: MessageCircle,
              color: "#229C62",
            },
            {
              label: "Unique Students",
              value: analytics.uniqueUsers,
              icon: Users,
              color: "#0F203A",
            },
            {
              label: "Avg Per Student",
              value: analytics.avgInteractionsPerUser,
              icon: TrendingUp,
              color: "#7AD62A",
            },
            {
              label: "Lab Assists",
              value: analytics.labAssistCount,
              icon: HelpCircle,
              color: "#F59E0B",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-slate-100"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={16} style={{ color: stat.color }} />
                <span className="text-xs text-slate-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interaction Types */}
          <div className="bg-white rounded-xl p-6 border border-slate-100">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-[#229C62]" />
              Interaction Types
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const Icon = TYPE_ICONS[type] || MessageCircle;
                  const color = TYPE_COLORS[type] || "#94a3b8";
                  const pct = Math.round(
                    (count / analytics.totalInteractions) * 100
                  );
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon size={14} style={{ color }} />
                          <span className="text-sm capitalize">{type.replace("_", " ")}</span>
                        </div>
                        <span className="text-sm font-medium" style={{ color }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Teaching Methods */}
          <div className="bg-white rounded-xl p-6 border border-slate-100">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Brain size={16} className="text-purple-500" />
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
                  const pct = Math.round(
                    (count / analytics.totalInteractions) * 100
                  );
                  return (
                    <div key={method}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm capitalize">{method}</span>
                        <span className="text-sm font-medium" style={{ color }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Top Concepts */}
          <div className="bg-white rounded-xl p-6 border border-slate-100">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-500" />
              Top Concepts Discussed
            </h3>
            {analytics.topConcepts.length === 0 ? (
              <p className="text-sm text-slate-400">No concepts tracked yet</p>
            ) : (
              <div className="space-y-2">
                {analytics.topConcepts.slice(0, 8).map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0"
                  >
                    <span className="text-sm">{c.concept}</span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {c.count}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity by Hour */}
          <div className="bg-white rounded-xl p-6 border border-slate-100">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              Activity by Hour (UTC)
            </h3>
            <div className="flex items-end gap-1 h-32">
              {analytics.hourlyDistribution.map((h) => (
                <div
                  key={h.hour}
                  className="flex-1 rounded-t transition-all min-w-[4px]"
                  style={{
                    height: `${(h.count / maxHourly) * 100}%`,
                    background:
                      h.count > 0 ? "#229C62" : "#e2e8f0",
                    minHeight: h.count > 0 ? "4px" : "1px",
                  }}
                  title={`${h.hour}:00 — ${h.count} interactions`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-400">0:00</span>
              <span className="text-[10px] text-slate-400">12:00</span>
              <span className="text-[10px] text-slate-400">23:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
