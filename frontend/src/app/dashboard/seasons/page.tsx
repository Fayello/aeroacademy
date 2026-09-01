"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApiV2 } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Loader2, Calendar, Zap, Trophy, Clock, Star, Crown } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import toast from "@/lib/toast";

interface BattlePass {
  id: string;
  title: string;
  totalTiers: number;
}

interface Season {
  id: string;
  name: string;
  theme: string;
  xpMultiplier: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  battlePass?: BattlePass;
}

interface LeaderboardEntry {
  position: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  xp: number;
  division: string;
}

function formatDate(dateStr: string, lang: string = "en") {
  return new Date(dateStr).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeRemaining(endDate: string) {
  const now = Date.now();
  const end = new Date(endDate).getTime();
  const diff = end - now;
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h remaining`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m remaining`;
}

function positionStyle(pos: number) {
  if (pos === 1) return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 text-yellow-700";
  if (pos === 2) return "bg-gradient-to-r from-slate-50 to-gray-50 border-white/10 text-slate-600";
  if (pos === 3) return "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300 text-orange-700";
  return "bg-[#0f172a] border-white/10 text-slate-700";
}

function positionBadge(pos: number) {
  if (pos === 1) return <Crown size={16} className="text-yellow-500" />;
  if (pos === 2) return <Trophy size={16} className="text-slate-400" />;
  if (pos === 3) return <Trophy size={16} className="text-orange-500" />;
  return <span className="text-xs font-bold text-slate-400 w-4 text-center">#{pos}</span>;
}

function positionBg(pos: number) {
  if (pos === 1) return "bg-yellow-500";
  if (pos === 2) return "bg-slate-400";
  if (pos === 3) return "bg-orange-500";
  return "bg-slate-300";
}

export default function SeasonsPage() {
  const { lang } = useI18n();
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [active, all] = await Promise.allSettled([
          fetchApiV2<Season>("/seasons/active"),
          fetchApiV2<Season[]>("/seasons"),
        ]);
        if (!cancelled) {
          if (active.status === "fulfilled") setActiveSeason(active.value);
          if (all.status === "fulfilled") setSeasons(all.value);
        }
      } catch {
        if (!cancelled) toast.error("Failed to load seasons");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadLeaderboard() {
      try {
        const data = await fetchApiV2<LeaderboardEntry[]>("/ranking/leaderboard");
        if (!cancelled) setLeaderboard(data.slice(0, 10));
      } catch {
        if (!cancelled) toast.error("Failed to load leaderboard");
      } finally {
        if (!cancelled) setLeaderboardLoading(false);
      }
    }
    loadLeaderboard();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader title="Seasons" description="Track current season progress and competition" />
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title="Seasons" description="Track current season progress and competition" />

      {activeSeason ? (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden">
          <div className="relative bg-gradient-to-r from-[#0F203A] via-[#0F203A] to-[#7AD62A] p-6 sm:p-8">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-40" />
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#7AD62A]/20 flex items-center justify-center">
                      <Zap size={20} className="text-[#7AD62A]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{activeSeason.name}</h2>
                      <p className="text-sm text-slate-300">{activeSeason.theme}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <Badge variant="emerald" className="bg-[#7AD62A]/20 text-[#7AD62A] border-[#7AD62A]/30">
                      <Zap size={12} /> {activeSeason.xpMultiplier}x XP
                    </Badge>
                    <div className="flex items-center gap-1.5 text-sm text-slate-300">
                      <Calendar size={14} className="text-slate-400" />
                      {formatDate(activeSeason.startDate, lang)} — {formatDate(activeSeason.endDate, lang)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Clock size={14} className="text-[#7AD62A]" />
                    <span className="text-sm font-medium text-[#7AD62A]">
                      {timeRemaining(activeSeason.endDate)}
                    </span>
                  </div>
                </div>
                {activeSeason.battlePass && (
                  <Link
                    href="/battle-pass"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20 text-sm font-medium text-white transition-colors shrink-0"
                  >
                    <Star size={16} className="text-[#7AD62A]" />
                    {activeSeason.battlePass.title}
                    <span className="text-xs text-slate-300">({activeSeason.battlePass.totalTiers} tiers)</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-indigo-500" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No active season</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Seasons bring themed challenges and exclusive rewards. The next one is being prepared — check back soon.
          </p>
        </div>
      )}

      {seasons.length > 0 && (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Season History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">Season</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">Dates</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">XP Multiplier</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {seasons.map((season) => (
                    <tr key={season.id} className="border-b border-slate-100 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-medium text-white">{season.name}</p>
                          <p className="text-xs text-slate-500">{season.theme}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          {formatDate(season.startDate, lang)} — {formatDate(season.endDate, lang)}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="emerald">{season.xpMultiplier}x</Badge>
                      </td>
                      <td className="py-3 px-3">
                        {season.isActive ? (
                          <Badge variant="emerald">Active</Badge>
                        ) : (
                          <Badge variant="slate">Ended</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Season Leaderboard</h3>
            <Trophy size={16} className="text-slate-400" />
          </div>
          {leaderboardLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="text-blue-500 animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Trophy size={24} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No leaderboard data yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${positionStyle(entry.position)}`}
                >
                  <div className={`w-8 h-8 rounded-full ${positionBg(entry.position)} flex items-center justify-center shrink-0`}>
                    {positionBadge(entry.position)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{entry.name}</p>
                    <p className="text-xs text-slate-500">{entry.division}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-white">{entry.xp.toLocaleString()} XP</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
