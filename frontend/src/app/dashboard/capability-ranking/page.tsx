"use client";

import { useEffect, useState } from "react";
import { fetchApiV2, fetchApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  Loader2, Shield, Trophy, Target, Star, BarChart3, Clock, Zap,
  Award, TrendingUp,
} from "lucide-react";
import { useDisplayMode } from "@/lib/displayMode";

interface CapabilityEntry {
  position: number;
  userId: string;
  user: { id: string; name: string; avatarUrl: string | null };
  capabilityScore: number;
  tier: string;
  breakdown: {
    technicalPerformance: number;
    difficulty: number;
    consistency: number;
    problemSolving: number;
  };
  xp: number;
}

interface MyCapability {
  capabilityScore: number;
  tier: string;
  breakdown: {
    technicalPerformance: number;
    difficulty: number;
    consistency: number;
    problemSolving: number;
  };
  details: {
    assessmentsCompleted: number;
    avgAssessmentScore: number;
    labsCompleted: number;
    flagsSolved: number;
    bossMissionsCompleted: number;
    activeDaysLast30: number;
    independenceRate: number;
  };
}

const TIER_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  EXPERT: { text: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  ADVANCED: { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  INTERMEDIATE: { text: "text-[#229C62]", bg: "bg-[#E9F8EE]", border: "border-[#229C62]/30" },
  DEVELOPING: { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  NOVICE: { text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
  UNRANKED: { text: "text-slate-400", bg: "bg-slate-50", border: "border-slate-200" },
};

export default function CapabilityRankingPage() {
  const { t } = useI18n();
  const { config } = useDisplayMode();
  const [leaderboard, setLeaderboard] = useState<CapabilityEntry[]>([]);
  const [myCap, setMyCap] = useState<MyCapability | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user.id) return;

        const [lb, cap] = await Promise.allSettled([
          fetchApiV2<CapabilityEntry[]>("/domain-ranking/capability-leaderboard?limit=50"),
          fetchApiV2<MyCapability>(`/domain-ranking/capability/${user.id}`),
        ]);

        if (!cancelled) {
          if (lb.status === "fulfilled") setLeaderboard(lb.value);
          if (cap.status === "fulfilled") setMyCap(cap.value);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (!config.showRanks) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Shield size={48} className="text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Rankings not available</h2>
        <p className="text-sm text-slate-500">Switch to Competitive mode to see rankings</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#229C62]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F203A] via-[#229C62] to-[#7AD62A] p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">Capability Ranking</h1>
          <p className="text-white/80 text-sm mt-1">Based on demonstrated skills, not games played</p>
        </div>
      </div>

      {/* My Score */}
      {myCap && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Your Capability Score</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${TIER_COLORS[myCap.tier]?.text} ${TIER_COLORS[myCap.tier]?.bg} ${TIER_COLORS[myCap.tier]?.border} border`}>
              {myCap.tier}
            </span>
          </div>

          <div className="flex items-center gap-6 mb-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-[#229C62]">{myCap.capabilityScore}</p>
              <p className="text-xs text-slate-500 mt-1">Capability Score</p>
            </div>
            <div className="flex-1 grid grid-cols-4 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">{myCap.breakdown.technicalPerformance}</p>
                <p className="text-[10px] text-slate-500">Technical</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-lg font-bold text-purple-600">{myCap.breakdown.difficulty}</p>
                <p className="text-[10px] text-slate-500">Difficulty</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-lg font-bold text-amber-600">{myCap.breakdown.consistency}</p>
                <p className="text-[10px] text-slate-500">Consistency</p>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <p className="text-lg font-bold text-emerald-600">{myCap.breakdown.problemSolving}</p>
                <p className="text-[10px] text-slate-500">Problem Solving</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Target size={14} className="text-blue-500" />
              <span>{myCap.details.assessmentsCompleted} assessments</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Zap size={14} className="text-[#229C62]" />
              <span>{myCap.details.labsCompleted} labs</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Award size={14} className="text-purple-500" />
              <span>{myCap.details.flagsSolved} flags</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Clock size={14} className="text-amber-500" />
              <span>{myCap.details.activeDaysLast30}/30 active days</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Capability Leaderboard</h2>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-10 text-center">
            <BarChart3 size={32} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No capability data yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaderboard.map((entry) => {
              const tierStyle = TIER_COLORS[entry.tier] || TIER_COLORS.UNRANKED;
              return (
                <div key={entry.userId} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="w-8 text-center">
                    {entry.position <= 3 ? (
                      <span className="text-lg">
                        {entry.position === 1 ? "🥇" : entry.position === 2 ? "🥈" : "🥉"}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-slate-500">#{entry.position}</span>
                    )}
                  </div>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#229C62] to-[#7AD62A] flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-white">
                      {(entry.user.name || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{entry.user.name}</p>
                    <span className={`text-[10px] font-semibold ${tierStyle.text} ${tierStyle.bg} px-1.5 py-0.5 rounded`}>
                      {entry.tier}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-[#229C62]">{entry.capabilityScore}</p>
                    <p className="text-[10px] text-slate-400">capability</p>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500 w-48">
                    <span className="text-blue-600">{entry.breakdown.technicalPerformance}</span>
                    <span className="text-purple-600">{entry.breakdown.difficulty}</span>
                    <span className="text-amber-600">{entry.breakdown.consistency}</span>
                    <span className="text-emerald-600">{entry.breakdown.problemSolving}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
