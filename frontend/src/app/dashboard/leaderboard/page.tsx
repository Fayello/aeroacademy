"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { Trophy, Loader2, CheckCircle, TrendingUp, Lock, Crown, Shield, Target, Server, Database, Bug, Code, Network, Users } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { fetchApi, fetchApiV2 } from "@/lib/api";
import toast from "@/lib/toast";
import Badge from "@/components/ui/Badge";
import { DIVISION_COLORS } from "@/lib/constants";
import { getLevel, getLevelProgress } from "@/lib/levelGating";
import { useI18n } from "@/lib/i18n";
import type { LeaderboardEntry, LeagueStats } from "@/types/api";
import PageHeader from "@/components/ui/PageHeader";

interface GlobalRankProfile {
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
  level: number;
  domainRanks: { domain: string; domainId: string; rating: number; division: string; divisionTier: number }[];
}

const DOMAIN_ICONS: Record<string, typeof Shield> = {
  SECURITY: Bug, NETWORKING: Network, SYSTEMS: Server, DATABASES: Database, DEVOPS: Code, QA: Target,
};

function romanTier(tier: number): string {
  return ["IV", "III", "II", "I"][tier - 1] || "IV";
}

export default function LeaderboardPage() {
  const { t } = useI18n();
  const { socket, leaderboard: contextLeaderboard, userMetrics, isConnected } = useDashboard();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeLeague, setActiveLeague] = useState<"GLOBAL" | "REGIONAL" | "UNIVERSITY" | "TEAMS">("GLOBAL");
  const [filter, setFilter] = useState("");
  const [leagueStats, setLeagueStats] = useState<LeagueStats>({ regional: [], university: [], season: null });
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<"all" | "month" | "week">("all");
  const [domainFilter, setDomainFilter] = useState<"all" | "SECURITY" | "NETWORKING" | "DEVOPS" | "DATABASES" | "SYSTEMS" | "QA">("all");
  const [globalProfile, setGlobalProfile] = useState<GlobalRankProfile | null>(null);
  const [teamLeaderboard, setTeamLeaderboard] = useState<any[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  useEffect(() => {
    try {
      const user = localStorage.getItem("user");
      setCurrentUserId(user ? JSON.parse(user).id ?? null : null);
    } catch {
      setCurrentUserId(null);
    }
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchApiV2<GlobalRankProfile>(`/domain-ranking/profile/${currentUserId}`);
        if (!cancelled) setGlobalProfile(data);
      } catch {
        // silent - non-critical
      }
    }
    load();
    return () => { cancelled = true; };
  }, [currentUserId]);

  useEffect(() => {
    let cancelled = false;
    const fetchLeagues = async () => {
      try {
        const data = await fetchApi("/dashboard/leagues");
        if (!cancelled) {
          setLeagueStats(data);
          if (data.regional?.length > 0) setSelectedCity(data.regional[0].name);
        }
      } catch {
        if (!cancelled) toast.error("Failed to load league data");
      }
    };
    fetchLeagues();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (contextLeaderboard.length > 0) {
      setLeaderboard(contextLeaderboard);
      setLoading(false);
    } else if (isConnected) {
      setLoading(false);
    }
  }, [contextLeaderboard, isConnected]);

  useEffect(() => {
    if (!socket) return;
    const handleLeaderboard = (data: LeaderboardEntry[]) => { setLeaderboard(data); setLoading(false); };
    socket.on("leaderboard_update", handleLeaderboard);
    return () => { socket.off("leaderboard_update", handleLeaderboard); };
  }, [socket]);

  useEffect(() => {
    if (activeLeague !== "TEAMS") return;
    let cancelled = false;
    const fetchTeams = async () => {
      setTeamsLoading(true);
      try {
        const data = await fetchApi<any[]>("/dashboard/team-leaderboard");
        if (!cancelled) setTeamLeaderboard(data);
      } catch {
        // silent
      } finally {
        if (!cancelled) setTeamsLoading(false);
      }
    };
    fetchTeams();
    return () => { cancelled = true; };
  }, [activeLeague]);

  useEffect(() => {
    let cancelled = false;
    const fetchFiltered = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (timeFilter !== "all") params.set("time", timeFilter);
        if (domainFilter !== "all") params.set("domain", domainFilter);
        params.set("limit", "50");
        const qs = params.toString();
        const data = await fetchApi<LeaderboardEntry[]>(`/dashboard/leaderboard${qs ? `?${qs}` : ""}`);
        if (!cancelled) {
          setLeaderboard(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    fetchFiltered();
    return () => { cancelled = true; };
  }, [timeFilter, domainFilter]);

  const filteredOperators = useMemo(() => {
    return leaderboard
      .filter((op) => (op.name || op.username || op.email || "").toLowerCase().includes(filter.toLowerCase()))
      .filter((op) => {
        if (activeLeague === "GLOBAL") return true;
        if (activeLeague === "REGIONAL") return op.city === selectedCity;
        if (activeLeague === "UNIVERSITY") return op.organization?.type === "UNIVERSITY";
        return true;
      });
  }, [leaderboard, filter, activeLeague, selectedCity]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-28 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-10 w-full max-w-xs bg-slate-200 rounded-lg animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((id) => (
            <div key={id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
              <div className="w-12 h-12 bg-slate-200 rounded-xl animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-48 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="text-right space-y-1">
                <div className="h-6 w-12 bg-slate-200 rounded animate-pulse ml-auto" />
                <div className="h-3 w-16 bg-slate-200 rounded animate-pulse ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("nav.leaderboard")}
        description="Global rankings and competition"
      />

      {globalProfile?.globalRank && (
        <div className="bg-gradient-to-r from-[#0F203A] via-[#0F203A] to-[#229C62] rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Crown size={22} className="text-[#7AD62A]" />
            </div>
            <div>
              <p className="text-xs text-slate-300">Your Global Technology Rank</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{globalProfile.globalRank.rating.toLocaleString()}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-white/10 border border-white/20">
                  {globalProfile.globalRank.division} {romanTier(globalProfile.globalRank.divisionTier)}
                </span>
              </div>
            </div>
            <div className="ml-auto flex gap-4 text-sm">
              <div className="text-center">
                <p className="text-white font-semibold">{globalProfile.globalRank.domainCount}/6</p>
                <p className="text-[10px] text-slate-400">Domains</p>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">{globalProfile.globalRank.winRate}%</p>
                <p className="text-[10px] text-slate-400">Win Rate</p>
              </div>
            </div>
          </div>
          {globalProfile.domainRanks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {globalProfile.domainRanks.map((dr) => {
                const DomainIcon = DOMAIN_ICONS[dr.domain] || Shield;
                return (
                  <div key={dr.domainId} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-xs">
                    <DomainIcon size={10} className="text-white/60" />
                    <span className="text-white/80">{dr.domain}</span>
                    <span className="text-white font-semibold">{dr.rating}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {(["GLOBAL", "REGIONAL", "UNIVERSITY", "TEAMS"] as const).map((league) => (
          <button
            key={league}
            onClick={() => setActiveLeague(league)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeLeague === league ? "bg-slate-800 text-white border border-slate-800" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {league === "TEAMS" && <Users size={14} className="inline mr-1.5 -mt-0.5" />}
            {league}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {([
            { key: "all" as const, label: "All Time" },
            { key: "month" as const, label: "This Month" },
            { key: "week" as const, label: "This Week" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeFilter(key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                timeFilter === key
                  ? "bg-[#229C62] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value as typeof domainFilter)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62] transition-all"
        >
          <option value="all">All Domains</option>
          <option value="SECURITY">Security</option>
          <option value="NETWORKING">Networking</option>
          <option value="DEVOPS">DevOps</option>
          <option value="DATABASES">Databases</option>
          <option value="SYSTEMS">Systems</option>
          <option value="QA">QA</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 transition-all"
        />
        {activeLeague === "REGIONAL" && (
          <div className="flex gap-2 flex-wrap">
            {leagueStats.regional.map((city) => (
              <button
                key={city.name}
                onClick={() => setSelectedCity(city.name)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCity === city.name ? "bg-slate-800 text-white border border-slate-800" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {leagueStats.season && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Current Season</p>
            <p className="text-sm font-semibold text-slate-900">{leagueStats.season.name}</p>
          </div>
          <p className="text-sm text-slate-500">
            Ends {new Date(leagueStats.season.endDate).toLocaleDateString()}
          </p>
        </div>
      )}

      {userMetrics && (() => {
        const currentLevel = getLevel(userMetrics.xp || 0);
        const progress = getLevelProgress(userMetrics.xp || 0);
        const xpInLevel = (userMetrics.xp || 0) % 1000;
        const xpNeeded = 1000 - xpInLevel;

        const nextUnlock = [
          { level: 3, label: "Labs" },
          { level: 4, label: "Intermediate content" },
          { level: 5, label: "Registry" },
          { level: 7, label: "Advanced content" },
          { level: 10, label: "Certifications" },
        ].find((u) => u.level > currentLevel);

        return (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <TrendingUp size={22} className="text-slate-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Level {currentLevel} — {userMetrics.division}</p>
                <p className="text-sm text-slate-500">{xpNeeded} XP to Level {currentLevel + 1}</p>
              </div>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-slate-800 rounded-full transition-all duration-500"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{xpInLevel.toLocaleString()} / 1,000 XP</span>
              <span className="font-medium text-slate-900">{Math.round(progress * 100)}%</span>
            </div>
            {nextUnlock && (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3">
                <Lock size={14} className="text-slate-400" />
                <span>Reach <span className="font-semibold text-slate-900">Level {nextUnlock.level}</span> to unlock {nextUnlock.label}</span>
              </div>
            )}
          </div>
        );
      })()}

      {activeLeague === "TEAMS" ? (
        <div className="space-y-3">
          {teamsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((id) => (
                <div key={id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
                  <div className="w-12 h-12 bg-slate-200 rounded-xl animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-slate-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : teamLeaderboard.length > 0 ? teamLeaderboard.map((team, idx) => (
            <div
              key={team.id}
              className={`bg-white rounded-xl border p-5 flex items-center gap-4 transition-all hover:shadow-md ${
                idx < 3 ? "border-slate-200 bg-slate-50" : "border-slate-200"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                idx === 0 ? "bg-slate-100 text-slate-700" :
                idx === 1 ? "bg-slate-100 text-slate-500" :
                idx === 2 ? "bg-slate-100 text-slate-600" :
                "bg-slate-50 text-slate-400"
              }`}>
                {idx < 3 ? <Trophy size={18} /> : idx + 1}
              </div>

              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                idx === 0 ? "bg-[#229C62] text-white" :
                idx === 1 ? "bg-[#229C62]/80 text-white" :
                idx === 2 ? "bg-[#229C62]/60 text-white" :
                "bg-[#E9F8EE] text-[#229C62]"
              }`}>
                <Users size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-slate-900 truncate">{team.name}</p>
                  {team.visibility === "PRIVATE" && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">Private</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {team.memberCount} members {team.avgXp != null ? `\u2022 ${(team.avgXp as number).toLocaleString()} avg XP` : ""}
                </p>
                {team.owner && (
                  <p className="text-xs text-slate-400 mt-0.5">Led by {team.owner.username || team.owner.name}</p>
                )}
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{(team.totalXp as number || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-400">Total XP</p>
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#E9F8EE] flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-[#229C62]" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">No teams yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create or join a team to appear on the team leaderboard.
              </p>
            </div>
          )}
        </div>
      ) : (
      <div className="space-y-3">
        {filteredOperators.length > 0 ? filteredOperators.map((op, idx) => (
          <div
            key={op.id}
            className={`bg-white rounded-xl border p-5 flex items-center gap-4 transition-all hover:shadow-md ${
              op.id === currentUserId ? "border-slate-400 bg-slate-50 shadow-md" :
              idx < 3 ? "border-slate-200 bg-slate-50" : "border-slate-200"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              idx === 0 ? "bg-slate-100 text-slate-700" :
              idx === 1 ? "bg-slate-100 text-slate-500" :
              idx === 2 ? "bg-slate-100 text-slate-600" :
              "bg-slate-50 text-slate-400"
            }`}>
              {idx < 3 ? <Trophy size={18} /> : idx + 1}
            </div>

            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
              idx === 0 ? "bg-slate-800 text-white" :
              idx === 1 ? "bg-slate-600 text-white" :
              idx === 2 ? "bg-slate-500 text-white" :
              "bg-slate-100 text-slate-600"
            }`}>
              {op.username?.[0]?.toUpperCase() || op.name?.[0] || '?'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-slate-900 truncate">{op.username || op.name}</p>
                <Badge variant={(DIVISION_COLORS[op.division] as "emerald" | "blue" | "amber" | "red" | "slate") || "slate"}>
                  {op.division}
                </Badge>
                {op.xp > 2500 && (
                  <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-0.5">
                    <CheckCircle size={10} /> Top talent
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {op.organization?.name || "Independent"} \u2022 {op.city || "Unknown"}
              </p>
              {op.username && (
                <p className="text-xs text-slate-400 mt-0.5">@{op.username}</p>
              )}
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{op.rank || 1200}</p>
              <p className="text-xs text-slate-400">{op.xp.toLocaleString()} XP</p>
            </div>
          </div>
        )        ) : (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Trophy size={28} className="text-amber-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No rankings yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Complete ranked activities to appear on the leaderboard. Your first attempts will establish your position.
            </p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
