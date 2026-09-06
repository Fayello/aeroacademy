"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Loader2, Crown, Lock, CheckCircle2, Star, Zap, Gift, Shield, Trophy, Sparkles, Medal, Award } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import toast from "@/lib/toast";

interface BattlePassTier {
  id: string;
  tierNumber: number;
  title: string;
  xpRequired: number;
  rewards: unknown;
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
  rewards: unknown;
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

const REWARD_ICONS: Record<string, typeof Trophy> = {
  xp: Zap, badge: Shield, avatar: Star, title: Crown, skin: Sparkles, default: Gift,
};

function getRewardIcon(reward: unknown): typeof Trophy {
  if (typeof reward === "string") {
    const lower = reward.toLowerCase();
    if (lower.includes("xp")) return Zap;
    if (lower.includes("badge")) return Shield;
    if (lower.includes("avatar")) return Star;
    if (lower.includes("title") || lower.includes("name")) return Crown;
  }
  if (reward && typeof reward === "object" && "type" in reward) {
    const r = reward as { type: string };
    return REWARD_ICONS[r.type.toLowerCase()] || Gift;
  }
  return Gift;
}

export default function BattlePassPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>("tiers");
  const [battlePass, setBattlePass] = useState<BattlePassData | null>(null);
  const [progress, setProgress] = useState<BattlePassProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userId] = useState<string | null>(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (!stored) return null;
      const parsed = JSON.parse(stored) as { id?: string };
      return parsed.id || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => Boolean(userId));

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [bp, prog, lb] = await Promise.allSettled([
          fetchApi<BattlePassData>("/battle-pass/active"),
          fetchApi<BattlePassProgress>(`/battle-pass/progress/${userId}`),
          fetchApi<LeaderboardEntry[]>("/battle-pass/leaderboard"),
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
    if (position === 1) return { bg: "bg-amber-500/10 border-amber-200", text: "text-amber-400", icon: "text-amber-500" };
    if (position === 2) return { bg: "bg-white/5 border-white/10", text: "text-slate-400", icon: "text-slate-400" };
    if (position === 3) return { bg: "bg-orange-50 border-orange-200", text: "text-orange-400", icon: "text-orange-500" };
    return { bg: "bg-[#0f172a] border-white/10", text: "text-slate-300" };
  }

  function getPlacementMeta(position: number) {
    if (position === 1) return { label: "1st", icon: Trophy, iconClass: "text-amber-400" };
    if (position === 2) return { label: "2nd", icon: Medal, iconClass: "text-slate-300" };
    if (position === 3) return { label: "3rd", icon: Award, iconClass: "text-orange-400" };
    return { label: `#${position}`, icon: null as null | typeof Trophy, iconClass: "text-slate-400" };
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("nav.battle-pass")} description="Progress through tiers and earn exclusive rewards" />
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!battlePass) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("nav.battle-pass")} description="Progress through tiers and earn exclusive rewards" />
        <div className="bg-[#0f172a] rounded-xl border border-white/10 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
            <Crown size={28} className="text-purple-500" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No battle pass active</h3>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-slate-300">
            Battle passes bring tiered rewards and exclusive content. The next one is being prepared — check back soon.
          </p>
        </div>
      </div>
    );
  }

  const tiers = progress?.tiers ?? battlePass.tiers.map((t) => ({
    ...t,
    unlocked: false,
    currentXp: 0,
  }));

  const unlockedCount = tiers.filter((t) => t.unlocked).length;
  const nextTier = tiers.find((t) => !t.unlocked);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title={t("nav.battle-pass")} description="Progress through tiers and earn exclusive rewards" />

      {battlePass.season && (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Crown size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">{battlePass.title}</h2>
                <p className="text-xs text-slate-500">{battlePass.season.name}</p>
              </div>
            </div>
            <Badge variant={battlePass.isActive ? "emerald" : "slate"}>
              {battlePass.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      )}

      {progress && (
        <div className="bg-gradient-to-r from-[#0F203A] to-[#1a3a5c] rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Star size={22} className="text-[#7AD62A]" />
              </div>
              <div>
                <p className="text-lg font-bold">Tier {progress.currentTier} / {progress.totalTiers}</p>
                <p className="text-xs text-white/50">{progress.totalXpEarned.toLocaleString()} XP earned</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#7AD62A]">{unlockedCount}</p>
              <p className="text-[10px] text-white/50">unlocked</p>
            </div>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7AD62A] to-[#7AD62A] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress.totalTiers > 0 ? (progress.currentTier / progress.totalTiers) * 100 : 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-white/50">
            <span>Tier {progress.currentTier}</span>
            <span>Tier {progress.totalTiers}</span>
          </div>
          {nextTier && (
            <div className="mt-4 flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <Gift size={14} className="text-[#7AD62A]" />
              <span className="text-xs text-white/70">
                Next reward: <span className="font-semibold text-white">{nextTier.title}</span>
                {nextTier.isPremium && <span className="ml-1 text-amber-400">(Premium)</span>}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("tiers")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "tiers"
              ? "bg-slate-800 text-white"
              : "bg-white/5 text-slate-300 hover:bg-white/10"
          }`}
        >
          Tiers
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "leaderboard"
              ? "bg-slate-800 text-white"
              : "bg-white/5 text-slate-300 hover:bg-white/10"
          }`}
        >
          Leaderboard
        </button>
      </div>

      {activeTab === "tiers" && (
        <div className="space-y-6">
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {tiers.map((tier) => {
                const status = getTierStatus(tier);
                const xpProgress = getXpProgress(tier);
                const isLocked = status === "locked";
                const isCurrent = status === "current";
                const isUnlocked = status === "unlocked";
                const RewardIcon = getRewardIcon(tier.rewards);

                return (
                  <div
                    key={tier.tierNumber}
                    className={`relative w-44 flex-shrink-0 rounded-xl border p-4 transition-all duration-300 ${
                      isCurrent
                        ? "bg-[#0f172a] border-[#7AD62A] shadow-lg ring-2 ring-[#7AD62A]/20 scale-105"
                        : isUnlocked
                        ? "bg-[#0f172a] border-[#7AD62A]/30"
                        : "bg-white/5 border-white/10 opacity-60 hover:opacity-80"
                    } ${tier.isPremium && !isLocked ? "border-t-4 border-t-amber-400" : ""}`}
                  >
                    {tier.isPremium && (
                      <div className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                        <Crown size={13} className="text-white" />
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xl font-bold ${isLocked ? "text-slate-400" : "text-white"}`}>
                        {tier.tierNumber}
                      </span>
                      {isUnlocked && (
                        <div className="w-7 h-7 rounded-full bg-[#7AD62A] flex items-center justify-center">
                          <CheckCircle2 size={16} className="text-white" />
                        </div>
                      )}
                      {isCurrent && (
                        <div className="w-7 h-7 rounded-full bg-[#7AD62A] flex items-center justify-center animate-pulse">
                          <Zap size={16} className="text-white" />
                        </div>
                      )}
                      {isLocked && <Lock size={16} className="text-slate-400" />}
                    </div>

                    <p className={`text-xs font-semibold mb-1 ${isLocked ? "text-slate-400" : "text-slate-300"}`}>
                      {tier.title}
                    </p>

                    <p className={`text-[11px] mb-3 ${isLocked ? "text-slate-400" : "text-slate-500"}`}>
                      {tier.xpRequired.toLocaleString()} XP
                    </p>

                    {isCurrent && (
                      <div className="mb-3">
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#7AD62A] to-[#7AD62A] rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${xpProgress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-[#7AD62A] mt-1 font-medium">{xpProgress}% complete</p>
                      </div>
                    )}

                    {tier.rewards != null && (
                      <div className={`flex items-center gap-2 p-2 rounded-lg ${isLocked ? "bg-white/5" : "bg-[#7AD62A]/10/50"}`}>
                        <RewardIcon size={14} className={isLocked ? "text-slate-400" : "text-[#7AD62A]"} />
                        <span className={`text-[11px] font-medium ${isLocked ? "text-slate-400" : "text-slate-400"}`}>
                          {typeof tier.rewards === "string"
                            ? tier.rewards
                            : Array.isArray(tier.rewards)
                            ? `${tier.rewards.length} reward${tier.rewards.length !== 1 ? "s" : ""}`
                            : "Reward"}
                        </span>
                      </div>
                    )}

                    {tier.isPremium && (
                      <div className="mt-2 flex items-center gap-1">
                        <Sparkles size={10} className="text-amber-500" />
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-200">
                          Premium
                        </span>
                      </div>
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
            <div className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Position</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Candidate</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">XP</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Tiers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {leaderboard.map((entry) => {
                      const style = getPositionStyle(entry.position);
                      const placement = getPlacementMeta(entry.position);
                      const isCurrentUser = entry.userId === userId;
                      const displayName = isCurrentUser ? "You" : `Learner ${entry.userId.slice(0, 8)}`;
                      return (
                        <tr
                          key={entry.userId}
                          className={`transition-colors ${style.bg} ${
                            entry.position <= 3 ? "font-medium" : "hover:bg-white/5"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className={`flex items-center gap-2 text-sm font-bold ${style.text}`}>
                              {placement.icon ? <placement.icon size={14} className={placement.iconClass} /> : null}
                              <span>{placement.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <span className="text-sm font-medium text-white">{displayName}</span>
                              <p className="text-[11px] text-slate-400">{isCurrentUser ? "Current season record" : "Verified learner record"}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-slate-300 font-mono">{entry.totalXp.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-slate-300">{entry.tiersUnlocked}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3 border-t border-white/10 p-4 sm:hidden">
                {leaderboard.map((entry) => {
                  const style = getPositionStyle(entry.position);
                  const placement = getPlacementMeta(entry.position);
                  const isCurrentUser = entry.userId === userId;
                  const displayName = isCurrentUser ? "You" : `Learner ${entry.userId.slice(0, 8)}`;
                  return (
                    <div key={`mobile-${entry.userId}`} className={`rounded-xl border p-4 ${style.bg}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className={`flex items-center gap-2 text-sm font-semibold ${style.text}`}>
                            {placement.icon ? <placement.icon size={14} className={placement.iconClass} /> : null}
                            <span>{placement.label}</span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-white">{displayName}</p>
                          <p className="text-[11px] text-slate-400">{isCurrentUser ? "Current season record" : "Verified learner record"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-200">{entry.totalXp.toLocaleString()} XP</p>
                          <p className="text-[11px] text-slate-400">{entry.tiersUnlocked} tier{entry.tiersUnlocked !== 1 ? "s" : ""} unlocked</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
