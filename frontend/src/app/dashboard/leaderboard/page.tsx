"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { Trophy, Loader2, CheckCircle, TrendingUp, Lock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import { DIVISION_COLORS } from "@/lib/constants";
import { getLevel, getLevelProgress } from "@/lib/levelGating";
import type { LeaderboardEntry, LeagueStats } from "@/types/api";

export default function LeaderboardPage() {
  const { socket, userMetrics } = useDashboard();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId] = useState<string | null>(() => {
    try {
      if (typeof window === "undefined") return null;
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user).id ?? null : null;
    } catch {
      return null;
    }
  });
  const [activeLeague, setActiveLeague] = useState<"GLOBAL" | "REGIONAL" | "UNIVERSITY">("GLOBAL");
  const [filter, setFilter] = useState("");
  const [leagueStats, setLeagueStats] = useState<LeagueStats>({ regional: [], university: [], season: null });
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const data = await fetchApi("/dashboard/leagues");
        setLeagueStats(data);
        if (data.regional?.length > 0) setSelectedCity(data.regional[0].name);
      } catch {
        toast.error("Failed to load league data");
      }
    };
    fetchLeagues();

    if (!socket) return;
    socket.on("leaderboard_update", (data: LeaderboardEntry[]) => { setLeaderboard(data); setLoading(false); });
    return () => { socket.off("leaderboard_update"); };
  }, [socket]);

  const filteredOperators = useMemo(() => {
    return leaderboard
      .filter((op) => (op.name || op.email || "").toLowerCase().includes(filter.toLowerCase()))
      .filter((op) => {
        if (activeLeague === "GLOBAL") return true;
        if (activeLeague === "REGIONAL") return op.city === selectedCity;
        if (activeLeague === "UNIVERSITY") return op.organization?.type === "UNIVERSITY";
        return true;
      });
  }, [leaderboard, filter, activeLeague, selectedCity]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-slate-400" size={32} />
        <p className="text-sm text-slate-500">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
      </div>

      <div className="flex gap-2">
        {(["GLOBAL", "REGIONAL", "UNIVERSITY"] as const).map((league) => (
          <button
            key={league}
            onClick={() => setActiveLeague(league)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeLeague === league ? "bg-orange-100 text-orange-700 border border-orange-200" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
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
          className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
        />
        {activeLeague === "REGIONAL" && (
          <div className="flex gap-2 flex-wrap">
            {leagueStats.regional.map((city) => (
              <button
                key={city.name}
                onClick={() => setSelectedCity(city.name)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCity === city.name ? "bg-orange-100 text-orange-700 border border-orange-200" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
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
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp size={22} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Level {currentLevel} — {userMetrics.division}</p>
                <p className="text-sm text-slate-500">{xpNeeded} XP to Level {currentLevel + 1}</p>
              </div>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
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
              op.id === currentUserId ? "border-emerald-300 bg-emerald-50/50 shadow-md" :
              idx < 3 ? "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50" : "border-slate-200"
            }`}
          >
            {/* Rank */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              idx === 0 ? "bg-amber-100 text-amber-600" : 
              idx === 1 ? "bg-slate-100 text-slate-500" : 
              idx === 2 ? "bg-orange-100 text-orange-600" : 
              "bg-slate-50 text-slate-400"
            }`}>
              {idx < 3 ? <Trophy size={18} /> : idx + 1}
            </div>

            {/* Avatar */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
              idx === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" :
              idx === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white" :
              idx === 2 ? "bg-gradient-to-br from-orange-400 to-red-500 text-white" :
              "bg-slate-100 text-slate-600"
            }`}>
              {op.name?.[0] || '?'}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-slate-900 truncate">{op.name}</p>
                <Badge variant={DIVISION_COLORS[op.division] ? undefined : "slate"} className={DIVISION_COLORS[op.division] || ""}>
                  {op.division}
                </Badge>
                {op.xp > 2500 && (
                  <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-0.5">
                    <CheckCircle size={10} /> Top talent
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {op.organization?.name || "Independent"} • {op.city || "Unknown"}
              </p>
            </div>

            {/* Score */}
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{op.rank || 1200}</p>
              <p className="text-xs text-slate-400">{op.xp.toLocaleString()} XP</p>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Trophy size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No results found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
