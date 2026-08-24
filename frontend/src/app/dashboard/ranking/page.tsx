"use client";

import { useEffect, useState } from "react";
import { fetchApiV2 } from "@/lib/api";
import { Loader2, Shield, Trophy, TrendingUp, Crown, Target, Clock, ChevronDown, Star, Swords, Server, Database, Bug, Code, Network } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import toast from "@/lib/toast";

interface DomainRank {
  domain: string;
  domainId: string;
  rating: number;
  division: string;
  divisionTier: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  isProvisional: boolean;
  placementMatchesLeft: number;
  careerHighRating: number;
  careerHighDivision: string;
}

interface SeasonHistoryEntry {
  seasonNumber: number;
  seasonName: string;
  finalRating: number;
  finalDivision: string;
  finalTier: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
}

interface RankedProfile {
  user: { id: string; name: string; avatarUrl: string | null; xp: number };
  level: number;
  activeSeason: { id: string; name: string; seasonNumber: number } | null;
  globalRank: {
    rating: number;
    division: string;
    divisionTier: number;
    gamesPlayed: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
    domainCount: number;
  };
  domainRanks: DomainRank[];
  seasonHistory: SeasonHistoryEntry[];
  stats: { bossMissionsCompleted: number; labsCompleted: number };
}

interface TierDef {
  name: string;
  min: number;
  max: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

const DIVISION_TIERS: TierDef[] = [
  { name: "BRONZE", min: 0, max: 1499, color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200", icon: "🥉" },
  { name: "SILVER", min: 1500, max: 2999, color: "text-slate-600", bgColor: "bg-slate-50", borderColor: "border-slate-300", icon: "🥈" },
  { name: "GOLD", min: 3000, max: 4999, color: "text-yellow-700", bgColor: "bg-yellow-50", borderColor: "border-yellow-300", icon: "🥇" },
  { name: "PLATINUM", min: 5000, max: 7499, color: "text-cyan-700", bgColor: "bg-cyan-50", borderColor: "border-cyan-300", icon: "💎" },
  { name: "DIAMOND", min: 7500, max: 10999, color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-300", icon: "💠" },
  { name: "MASTER", min: 11000, max: 14999, color: "text-purple-700", bgColor: "bg-purple-50", borderColor: "border-purple-300", icon: "👑" },
  { name: "GRANDMASTER", min: 15000, max: 999999, color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-300", icon: "🏆" },
];

const DOMAIN_ICONS: Record<string, typeof Shield> = {
  SECURITY: Bug,
  NETWORKING: Network,
  SYSTEMS: Server,
  DATABASES: Database,
  DEVOPS: Code,
  QA: Target,
};

const DOMAIN_COLORS: Record<string, string> = {
  SECURITY: "from-red-500 to-rose-600",
  NETWORKING: "from-blue-500 to-indigo-600",
  SYSTEMS: "from-slate-600 to-gray-700",
  DATABASES: "from-emerald-500 to-green-600",
  DEVOPS: "from-orange-500 to-amber-600",
  QA: "from-purple-500 to-violet-600",
};

function romanTier(tier: number): string {
  const numerals = ["IV", "III", "II", "I"];
  return numerals[tier - 1] || "IV";
}

function getTierDef(division: string): TierDef {
  return DIVISION_TIERS.find((t) => t.name === division) || DIVISION_TIERS[0];
}

function DivisionBadge({ division, tier, size = "md" }: { division: string; tier: number; size?: "sm" | "md" | "lg" }) {
  const tierDef = getTierDef(division);
  const sizeClasses = size === "lg" ? "px-3 py-1.5 text-sm" : size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${tierDef.bgColor} ${tierDef.borderColor} ${tierDef.color} ${sizeClasses}`}>
      <span>{tierDef.icon}</span>
      {division} {romanTier(tier)}
    </span>
  );
}

function RatingProgress({ rating, division }: { rating: number; division: string }) {
  const tierDef = getTierDef(division);
  const progress = Math.min(((rating - tierDef.min) / (tierDef.max - tierDef.min)) * 100, 100);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
        <span>{tierDef.min.toLocaleString()}</span>
        <span className="font-medium text-slate-700">{rating.toLocaleString()}</span>
        <span>{tierDef.max.toLocaleString()}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${tierDef.bgColor.replace("bg-", "from-")} to-current`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default function RankingPage() {
  const [profile, setProfile] = useState<RankedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const stored = localStorage.getItem("user");
        const userId = stored ? JSON.parse(stored).id : null;
        if (!userId) {
          toast.error("Please log in to view your ranking profile");
          return;
        }
        const data = await fetchApiV2<RankedProfile>(`/domain-ranking/profile/${userId}`);
        if (!cancelled) setProfile(data);
      } catch (err: any) {
        if (!cancelled) toast.error(err?.message || "Failed to load ranking profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedDomain) return;
    let cancelled = false;
    async function load() {
      setLbLoading(true);
      try {
        const data = await fetchApiV2<any[]>(`/domain-ranking/domain/${selectedDomain}/leaderboard`);
        if (!cancelled) setLeaderboard(data.slice(0, 20));
      } catch {
        if (!cancelled) toast.error("Failed to load domain leaderboard");
      } finally {
        if (!cancelled) setLbLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedDomain]);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader title="Domain Ranking" description="Your competitive ranking across skill domains" />
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="text-[#229C62] animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader title="Domain Ranking" description="Your competitive ranking across skill domains" />
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Shield size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No ranking data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title="Domain Ranking" description="Your competitive ranking across skill domains" />

      {profile.globalRank ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="relative bg-gradient-to-r from-[#0F203A] via-[#0F203A] to-[#229C62] p-6 sm:p-8">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-40" />
            <div className="relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shrink-0">
                  <Crown size={28} className="text-[#7AD62A]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-1">{profile.user.name}</h2>
                  <p className="text-xs text-slate-300 mb-2">Global Technology Rank</p>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <DivisionBadge division={profile.globalRank.division} tier={profile.globalRank.divisionTier} size="lg" />
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20">
                      Technology Level {profile.level}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Global Rating</p>
                      <p className="text-white font-semibold text-lg">{profile.globalRank.rating.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Domains Ranked</p>
                      <p className="text-white font-semibold">{profile.globalRank.domainCount}/6</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Total Games</p>
                      <p className="text-white font-semibold">{profile.globalRank.gamesPlayed}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Win Rate</p>
                      <p className="text-white font-semibold">{profile.globalRank.winRate}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <Shield size={28} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 mb-1">No overall rank yet</p>
          <p className="text-xs text-slate-400">Complete ranked activities to establish your rating</p>
        </div>
      )}

      {profile.domainRanks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Domain Divisions</h3>
            <div className="flex flex-wrap gap-2">
              {profile.domainRanks.map((rank) => {
                const DomainIcon = DOMAIN_ICONS[rank.domain] || Shield;
                return (
                  <div key={rank.domainId} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                    <DomainIcon size={12} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-700">{rank.domain}</span>
                    <DivisionBadge division={rank.division} tier={rank.divisionTier} size="sm" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {profile.domainRanks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Domain Ratings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {profile.domainRanks.map((rank) => {
                const DomainIcon = DOMAIN_ICONS[rank.domain] || Shield;
                const gradientClass = DOMAIN_COLORS[rank.domain] || "from-slate-500 to-gray-600";
                return (
                  <div
                    key={rank.domainId}
                    className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                      selectedDomain === rank.domainId
                        ? "border-[#229C62] ring-1 ring-[#229C62]/30 bg-[#E9F8EE]/30"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    onClick={() => setSelectedDomain(selectedDomain === rank.domainId ? null : rank.domainId)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
                        <DomainIcon size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm">{rank.domain}</p>
                        <DivisionBadge division={rank.division} tier={rank.divisionTier} size="sm" />
                      </div>
                      {rank.isProvisional && (
                        <span className="text-[10px] text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-full">PROV</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-slate-900">{rank.rating.toLocaleString()}</span>
                        {rank.careerHighRating > rank.rating && (
                          <span className="text-xs text-slate-400">Best: {rank.careerHighRating.toLocaleString()}</span>
                        )}
                      </div>
                      <RatingProgress rating={rank.rating} division={rank.division} />
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{rank.gamesPlayed} games</span>
                        <span className="text-emerald-600">{rank.wins}W</span>
                        <span className="text-red-500">{rank.losses}L</span>
                        {!rank.isProvisional && rank.placementMatchesLeft > 0 && (
                          <span className="text-yellow-600">{rank.placementMatchesLeft} placement left</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedDomain && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                {profile.domainRanks.find((r) => r.domainId === selectedDomain)?.domain} Leaderboard
              </h3>
              <Trophy size={16} className="text-slate-400" />
            </div>
            {lbLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="text-[#229C62] animate-spin" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Trophy size={24} className="text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">No leaderboard data for this domain</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, idx) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      entry.userId === profile.user.id
                        ? "bg-[#E9F8EE]/50 border-[#229C62]/30"
                        : "bg-white border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                      idx === 0 ? "bg-yellow-500 text-white" : idx === 1 ? "bg-slate-400 text-white" : idx === 2 ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {idx < 3 ? (idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉") : `#${idx + 1}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate text-sm">{entry.name || "Anonymous"}</p>
                      <DivisionBadge division={entry.division} tier={entry.divisionTier} size="sm" />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-slate-900">{entry.rating.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{entry.gamesPlayed} games</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {profile.seasonHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Season History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">Season</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">Division</th>
                    <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">Rating</th>
                    <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">Record</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.seasonHistory.map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-900">S{s.seasonNumber}</p>
                        <p className="text-xs text-slate-500">{s.seasonName}</p>
                      </td>
                      <td className="py-3 px-3">
                        <DivisionBadge division={s.finalDivision} tier={s.finalTier} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-900">{s.finalRating.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        <span className="text-emerald-600">{s.wins}W</span> / <span className="text-red-500">{s.losses}L</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{profile.level}</p>
            <p className="text-xs text-slate-500">Technology Level</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{profile.globalRank.rating.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Global Rating</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-700">{profile.globalRank.totalWins}</p>
            <p className="text-xs text-slate-500">Total Wins</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{profile.globalRank.totalLosses}</p>
            <p className="text-xs text-slate-500">Total Losses</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{profile.stats.labsCompleted}</p>
            <p className="text-xs text-slate-500">Labs Completed</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{profile.stats.bossMissionsCompleted}</p>
            <p className="text-xs text-slate-500">Boss Missions</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{profile.globalRank.domainCount}</p>
            <p className="text-xs text-slate-500">Active Domains</p>
          </div>
        </div>
      </div>
    </div>
  );
}
