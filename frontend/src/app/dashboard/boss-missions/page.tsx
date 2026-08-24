"use client";

import { useEffect, useState } from "react";
import { fetchApiV2 } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import toast from "@/lib/toast";
import {
  Loader2,
  Swords,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  Zap,
  AlertTriangle,
} from "lucide-react";

interface BossMission {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  maxAttempts: number;
  xpReward: number;
  labId: string;
  prerequisiteLabIds: string[];
  startsAt: string | null;
  expiresAt: string | null;
}

interface BossAttempt {
  id: string;
  bossId: string;
  userId: string;
  score: number;
  maxScore: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

interface BossDetail {
  boss: BossMission;
  attempts: BossAttempt[];
  attemptsRemaining: number;
  completed: boolean;
}

interface LeaderboardEntry {
  position: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  score: number;
  maxScore: number;
  completedAt: string | null;
}

const difficultyConfig: Record<string, { label: string; className: string }> = {
  EASY: { label: "EASY", className: "bg-green-100 text-green-700" },
  MEDIUM: { label: "MEDIUM", className: "bg-yellow-100 text-yellow-700" },
  HARD: { label: "HARD", className: "bg-orange-100 text-orange-700" },
  BOSS: { label: "BOSS", className: "bg-red-100 text-red-700" },
};

function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function BossMissionsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [bosses, setBosses] = useState<BossMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoss, setSelectedBoss] = useState<BossDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserId(parsed.id);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchApiV2<BossMission[]>("/boss-missions/active");
        if (!cancelled) setBosses(data);
      } catch {
        if (!cancelled) toast.error("Failed to load boss missions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const openDetail = async (bossId: string) => {
    setDetailLoading(true);
    setSelectedBoss(null);
    setLeaderboard([]);
    try {
      const detail = await fetchApiV2<BossDetail>(`/boss-missions/${bossId}/attempts/${userId}`);
      setSelectedBoss(detail);
    } catch {
      toast.error("Failed to load boss details");
    } finally {
      setDetailLoading(false);
    }
    setLeaderboardLoading(true);
    try {
      const lb = await fetchApiV2<LeaderboardEntry[]>(`/boss-missions/${bossId}/leaderboard`);
      setLeaderboard(lb);
    } catch {
      // leaderboard optional
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Boss Missions" description="Challenge yourself against powerful boss labs" />
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (bosses.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Boss Missions" description="Challenge yourself against powerful boss labs" />
        <EmptyState
          icon={Swords}
          title="No active boss missions"
          description="Check back later for new boss challenges"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title="Boss Missions" description="Challenge yourself against powerful boss labs" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bosses.map((boss) => {
          const diff = difficultyConfig[boss.difficulty] || difficultyConfig.EASY;
          const expired = isExpired(boss.expiresAt);
          return (
            <div
              key={boss.id}
              className={`relative bg-white rounded-xl border border-slate-200 p-5 transition-all duration-200 hover:border-slate-300 ${expired ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{boss.title}</h3>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${diff.className}`}>
                      {diff.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{boss.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5">
                  <Zap size={14} className="text-[#229C62]" />
                  <span className="text-xs font-semibold text-slate-700">{boss.xpReward} XP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield size={14} className="text-blue-500" />
                  <span className="text-xs text-slate-600">{boss.maxAttempts} attempts</span>
                </div>
                {boss.expiresAt && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className={expired ? "text-red-400" : "text-amber-500"} />
                    <span className={`text-xs ${expired ? "text-red-500 font-medium" : "text-slate-600"}`}>
                      {expired ? "Expired" : formatCountdown(boss.expiresAt)}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => openDetail(boss.id)}
                disabled={expired}
                className={`w-full py-2 px-4 rounded-lg text-xs font-medium transition-colors ${
                  expired
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-[#0F203A] text-white hover:bg-[#0F203A]/90"
                }`}
              >
                {expired ? "Expired" : "View Mission"}
              </button>
            </div>
          );
        })}
      </div>

      {(selectedBoss || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBoss(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-xl border border-slate-200 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={20} className="text-blue-500 animate-spin" />
              </div>
            ) : selectedBoss && (
              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-semibold text-slate-900">{selectedBoss.boss.title}</h2>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${(difficultyConfig[selectedBoss.boss.difficulty] || difficultyConfig.EASY).className}`}>
                        {(difficultyConfig[selectedBoss.boss.difficulty] || difficultyConfig.EASY).label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{selectedBoss.boss.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedBoss(null)}
                    className="shrink-0 ml-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <XCircle size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#E9F8EE] rounded-lg p-3 text-center">
                    <Zap size={16} className="text-[#229C62] mx-auto mb-1" />
                    <p className="text-sm font-bold text-slate-900">{selectedBoss.boss.xpReward}</p>
                    <p className="text-[10px] text-slate-500">XP Reward</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <Shield size={16} className="text-blue-500 mx-auto mb-1" />
                    <p className="text-sm font-bold text-slate-900">{selectedBoss.attemptsRemaining}</p>
                    <p className="text-[10px] text-slate-500">Attempts Left</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <Trophy size={16} className="text-amber-500 mx-auto mb-1" />
                    <p className="text-sm font-bold text-slate-900">{selectedBoss.attempts.length}</p>
                    <p className="text-[10px] text-slate-500">Total Attempts</p>
                  </div>
                </div>

                {selectedBoss.completed && (
                  <div className="flex items-center gap-2 bg-[#E9F8EE] border border-[#229C62]/20 rounded-lg px-4 py-3">
                    <CheckCircle2 size={18} className="text-[#229C62] shrink-0" />
                    <span className="text-sm font-medium text-[#0F203A]">Mission completed! Well done.</span>
                  </div>
                )}

                {selectedBoss.attemptsRemaining <= 0 && !selectedBoss.completed && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                    <span className="text-sm font-medium text-amber-700">No attempts remaining</span>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-semibold text-slate-900 mb-2">Your Attempts</h4>
                  {selectedBoss.attempts.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No attempts yet</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedBoss.attempts.map((attempt) => (
                        <div key={attempt.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            {attempt.status === "COMPLETED" ? (
                              <CheckCircle2 size={14} className="text-[#229C62]" />
                            ) : (
                              <XCircle size={14} className="text-red-400" />
                            )}
                            <span className="text-xs text-slate-600">
                              {attempt.score}/{attempt.maxScore}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] font-medium ${attempt.status === "COMPLETED" ? "text-[#229C62]" : "text-slate-400"}`}>
                              {attempt.status}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {new Date(attempt.startedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-900 mb-2">Leaderboard</h4>
                  {leaderboardLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 size={16} className="text-blue-500 animate-spin" />
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No leaderboard entries yet</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {leaderboard.map((entry) => (
                        <div key={entry.userId} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                          <span className={`text-xs font-bold w-5 text-center ${entry.position <= 3 ? "text-amber-500" : "text-slate-400"}`}>
                            {entry.position}
                          </span>
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {entry.avatarUrl ? (
                              <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[9px] font-bold text-slate-500">
                                {entry.name?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 truncate">{entry.name}</p>
                          </div>
                          <span className="text-xs font-semibold text-slate-600">
                            {entry.score}/{entry.maxScore}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
