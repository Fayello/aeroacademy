"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { Trophy, Loader2, CheckCircle, TrendingUp, Lock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import Badge from "@/components/ui/Badge";
import { DIVISION_COLORS } from "@/lib/constants";
import { getLevel, getLevelProgress } from "@/lib/levelGating";
import type { LeaderboardEntry, LeagueStats } from "@/types/api";
import PageHeader from "@/components/ui/PageHeader";

export default function LeaderboardPage() {
  const { socket, leaderboard: contextLeaderboard, userMetrics, isConnected } = useDashboard();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeLeague, setActiveLeague] = useState<"GLOBAL" | "REGIONAL" | "UNIVERSITY">("GLOBAL");
  const [filter, setFilter] = useState("");
  const [leagueStats, setLeagueStats] = useState<LeagueStats>({ regional: [], university: [], season: null });
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    try {
      const user = localStorage.getItem("user");
      setCurrentUserId(user ? JSON.parse(user).id ?? null : null);
    } catch {
      setCurrentUserId(null);
    }
  }, []);

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
        title="Leaderboard"
        description="Global rankings and competition"
      />

      <div className="flex gap-2">
        {(["GLOBAL", "REGIONAL", "UNIVERSITY"] as const).map((league) => (
          <button
            key={league}
            onClick={() => setActiveLeague(league)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeLeague === league ? "bg-slate-800 text-white border border-slate-800" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {league}
          </button>
        ))}
      </div>

      {/* Filters */}
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

      {/* Season stats */}
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

      {/* Progress to next tier */}
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

      {/* Leaderboard list */}
      <div className="space-y-3">
        {filteredOperators.length > 0 ? filteredOperators.map((op, idx) => (
          <div
            key={op.id}
            className={`bg-white rounded-xl border p-5 flex items-center gap-4 transition-all hover:shadow-md ${
              op.id === currentUserId ? "border-slate-400 bg-slate-50 shadow-md" :
              idx < 3 ? "border-slate-200 bg-slate-50" : "border-slate-200"
            }`}
          >
            {/* Rank */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              idx === 0 ? "bg-slate-100 text-slate-700" : 
              idx === 1 ? "bg-slate-100 text-slate-500" : 
              idx === 2 ? "bg-slate-100 text-slate-600" : 
              "bg-slate-50 text-slate-400"
            }`}>
              {idx < 3 ? <Trophy size={18} /> : idx + 1}
            </div>

            {/* Avatar */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
              idx === 0 ? "bg-slate-800 text-white" :
              idx === 1 ? "bg-slate-600 text-white" :
              idx === 2 ? "bg-slate-500 text-white" :
              "bg-slate-100 text-slate-600"
            }`}>
              {op.username?.[0]?.toUpperCase() || op.name?.[0] || '?'}
            </div>

            {/* Info */}
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
                {op.organization?.name || "Independent"} • {op.city || "Unknown"}
              </p>
              {op.username && (
                <p className="text-xs text-slate-400 mt-0.5">@{op.username}</p>
              )}
            </div>

            {/* Score */}
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{op.rank || 1200}</p>
              <p className="text-xs text-slate-400">{op.xp.toLocaleString()} XP</p>
            </div>
          </div>
        )        ) : (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
            <Trophy size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No results found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
