"use client";

import { useEffect, useState } from "react";
import { fetchApiV2 } from "@/lib/api";
import { Loader2, Crown, Lock, CheckCircle2, Star, Zap } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import toast from "@/lib/toast";

interface BattlePassTier {
  id: string;
  tierNumber: number;
  title: string;
  xpRequired: number;
  rewards: any;
  isPremium: boolean;
}

interface BattlePassData {
  id: string;
  title: string;
  totalTiers: number;
  isActive: boolean;
  season: { id: string; name: string; startDate: string; endDate: string } | null;
  tiers: BattlePassTier[];
}

interface ProgressTier {
  tierNumber: number;
  title: string;
  xpRequired: number;
  rewards: any;
  isPremium: boolean;
  unlocked: boolean;
  currentXp: number;
}

interface BattlePassProgress {
  battlePassId: string;
  title: string;
  season: { id: string; name: string } | null;
  totalXpEarned: number;
  currentTier: number;
  totalTiers: number;
  tiers: ProgressTier[];
}

interface LeaderboardEntry {
  position: number;
  userId: string;
  totalXp: number;
  tiersUnlocked: number;
}

type TabType = "tiers" | "leaderboard";

export default function BattlePassPage() {
  const [activeTab, setActiveTab] = useState<TabType>("tiers");
  const [battlePass, setBattlePass] = useState<BattlePassData | null>(null);
  const [progress, setProgress] = useState<BattlePassProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserId(parsed.id);
      } catch {
        setUserId(null);
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [bp, prog, lb] = await Promise.allSettled([
          fetchApiV2<BattlePassData>("/battle-pass"),
          fetchApiV2<BattlePassProgress>(`/battle-pass/progress/${userId}`),
          fetchApiV2<LeaderboardEntry[]>("/battle-pass/leaderboard"),
        ]);
        if (!cancelled) {
          if (bp.status === "fulfilled") setBattlePass(bp.value);
          if (prog.status === "fulfilled") setProgress(prog.value);
          if (lb.status === "fulfilled") setLeaderboard(lb.value);
        }
      } catch {
        if (!cancelled) toast.error("Failed to load battle pass");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  function getTierStatus(tier: ProgressTier): "unlocked" | "current" | "locked" {
    if (tier.unlocked) return "unlocked";
    if (progress && tier.tierNumber === progress.currentTier + 1) return "current";
    return "locked";
  }

  function getXpProgress(tier: ProgressTier): number {
    if (tier.unlocked) return 100;
    if (tier.tierNumber === (progress?.currentTier ?? 0) + 1 && progress) {
      const remaining = tier.xpRequired;
      if (remaining <= 0) return 100;
      return Math.min(100, Math.round((tier.currentXp / remaining) * 100));
    }
    return 0;
  }

  function getPositionStyle(position: number): { bg: string; text: string; icon?: string } {
    if (position === 1) return { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: "text-amber-500" };
    if (position === 2) return { bg: "bg-slate-50 border-slate-300", text: "text-slate-600", icon: "text-slate-400" };
    if (position === 3) return { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", icon: "text-orange-500" };
    return { bg: "bg-white border-slate-200", text: "text-slate-700" };
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Battle Pass" description="Progress through tiers and earn exclusive rewards" />
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!battlePass) {
    return (
      <div className="space-y-6">
        <PageHeader title="Battle Pass" description="Progress through tiers and earn exclusive rewards" />
        <EmptyState
          icon={Crown}
          title="No Battle Pass Available"
          description="There is no active battle pass season right now. Check back later!"
        />
      </div>
    );
  }

  const tiers = progress?.tiers ?? battlePass.tiers.map((t) => ({
    ...t,
    unlocked: false,
    currentXp: 0,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title="Battle Pass" description="Progress through tiers and earn exclusive rewards" />

      {battlePass.season && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Crown size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{battlePass.title}</h2>
                <p className="text-xs text-slate-500">{battlePass.season.name}</p>
              </div>
            </div>
            <Badge variant={battlePass.isActive ? "emerald" : "slate"}>
              {battlePass.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("tiers")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "tiers"
              ? "bg-slate-800 text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          Tiers
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "leaderboard"
              ? "bg-slate-800 text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          Leaderboard
        </button>
      </div>

      {activeTab === "tiers" && (
        <div className="space-y-6">
          {progress && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-[#229C62]" />
                  <span className="text-sm font-semibold text-slate-900">
                    Tier {progress.currentTier} / {progress.totalTiers}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{progress.totalXpEarned.toLocaleString()} XP earned</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#229C62] to-[#7AD62A] rounded-full transition-all duration-500"
                  style={{ width: `${progress.totalTiers > 0 ? (progress.currentTier / progress.totalTiers) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {tiers.map((tier) => {
                const status = getTierStatus(tier);
                const xpProgress = getXpProgress(tier);
                const isLocked = status === "locked";
                const isCurrent = status === "current";
                const isUnlocked = status === "unlocked";

                return (
                  <div
                    key={tier.tierNumber}
                    className={`relative w-40 flex-shrink-0 rounded-xl border p-4 transition-all duration-200 ${
                      isCurrent
                        ? "bg-white border-[#229C62] shadow-md ring-2 ring-[#229C62]/20"
                        : isUnlocked
                        ? "bg-white border-[#229C62]/30"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    } ${tier.isPremium && !isLocked ? "border-t-4 border-t-amber-400" : ""}`}
                  >
                    {tier.isPremium && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
                        <Crown size={12} className="text-white" />
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-lg font-bold ${isLocked ? "text-slate-400" : "text-slate-900"}`}>
                        {tier.tierNumber}
                      </span>
                      {isUnlocked && <CheckCircle2 size={18} className="text-[#229C62]" />}
                      {isCurrent && <Zap size={18} className="text-[#229C62]" />}
                      {isLocked && <Lock size={16} className="text-slate-400" />}
                    </div>

                    <p className={`text-xs font-medium mb-1 truncate ${isLocked ? "text-slate-400" : "text-slate-700"}`}>
                      {tier.title}
                    </p>

                    <p className={`text-[11px] mb-3 ${isLocked ? "text-slate-400" : "text-slate-500"}`}>
                      {tier.xpRequired.toLocaleString()} XP
                    </p>

                    {isCurrent && (
                      <div className="mb-3">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#229C62] rounded-full transition-all duration-300"
                            style={{ width: `${xpProgress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-[#229C62] mt-1">{xpProgress}% complete</p>
                      </div>
                    )}

                    {tier.rewards && (
                      <div className={`text-[11px] ${isLocked ? "text-slate-400" : "text-slate-600"}`}>
                        {typeof tier.rewards === "string"
                          ? tier.rewards
                          : Array.isArray(tier.rewards)
                          ? `${tier.rewards.length} reward${tier.rewards.length !== 1 ? "s" : ""}`
                          : "Reward"}
                      </div>
                    )}

                    {tier.isPremium && (
                      <Badge variant="amber" className="mt-2 text-[10px]">
                        Premium
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {tiers.length === 0 && (
            <EmptyState
              icon={Crown}
              title="No Tiers Available"
              description="This battle pass has no tiers configured yet."
            />
          )}
        </div>
      )}

      {activeTab === "leaderboard" && (
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No Leaderboard Data"
              description="No one has earned XP in this battle pass yet."
            />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                        Position
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                        User
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                        XP
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                        Tiers
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.map((entry) => {
                      const style = getPositionStyle(entry.position);
                      return (
                        <tr
                          key={entry.userId}
                          className={`transition-colors ${style.bg} ${
                            entry.position <= 3 ? "font-medium" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${style.text}`}>
                                {entry.position === 1 && "🥇 "}
                                {entry.position === 2 && "🥈 "}
                                {entry.position === 3 && "🥉 "}
                                #{entry.position}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-900 font-medium">{entry.userId}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-slate-700 font-mono">{entry.totalXp.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-slate-700">{entry.tiersUnlocked}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
