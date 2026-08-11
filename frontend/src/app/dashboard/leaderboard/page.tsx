"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { Trophy, Shield, Loader2, User, CheckCircle, TrendingUp, Lock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import toast from "react-hot-toast";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { DIVISION_COLORS } from "@/lib/constants";
import { getLevel, getLevelProgress } from "@/lib/levelGating";

export default function LeaderboardPage() {
  const { socket, userMetrics } = useDashboard();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeLeague, setActiveLeague] = useState<"GLOBAL" | "REGIONAL" | "UNIVERSITY">("GLOBAL");
  const [filter, setFilter] = useState("");
  const [leagueStats, setLeagueStats] = useState<{ regional: any[]; university: any[]; season?: any }>({ regional: [], university: [] });
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    try {
      const user = localStorage.getItem("user");
      if (user) setCurrentUserId(JSON.parse(user).id);
    } catch { /* ignore */ }

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
    socket.on("leaderboard_update", (data: any[]) => { setLeaderboard(data); setLoading(false); });
    return () => { socket.off("leaderboard_update"); };
  }, [socket]);

  const filteredOperators = useMemo(() => {
    return leaderboard
      .filter((op) => (op.name || op.email).toLowerCase().includes(filter.toLowerCase()))
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Leaderboard" description="See how you rank against other learners." />
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(["GLOBAL", "REGIONAL", "UNIVERSITY"] as const).map((league) => (
            <button
              key={league}
              onClick={() => setActiveLeague(league)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeLeague === league ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {league}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-field max-w-xs"
        />
        {activeLeague === "REGIONAL" && (
          <div className="flex gap-1.5 flex-wrap">
            {leagueStats.regional.map((city) => (
              <button
                key={city.name}
                onClick={() => setSelectedCity(city.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCity === city.name ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Current Season</p>
            <p className="text-sm font-medium text-slate-900">{leagueStats.season.name}</p>
          </div>
          <p className="text-xs text-slate-500">
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
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Level {currentLevel} — {userMetrics.division}</p>
                <p className="text-xs text-slate-500">{xpNeeded} XP to Level {currentLevel + 1}</p>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{xpInLevel.toLocaleString()} / 1,000 XP</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            {nextUnlock && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                <Lock size={12} className="text-slate-400" />
                <span>Reach <span className="font-semibold text-slate-700">Level {nextUnlock.level}</span> to unlock {nextUnlock.label}</span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Leaderboard list */}
      <div className="space-y-2">
        {filteredOperators.length > 0 ? filteredOperators.map((op, idx) => (
          <div
            key={op.id}
            className={`card p-4 flex items-center gap-4 ${
              op.id === currentUserId ? "border-emerald-300 bg-emerald-50/50" :
              idx < 3 ? "border-amber-200 bg-amber-50/30" : ""
            }`}
          >
            <span className={`w-8 text-center font-semibold ${idx === 0 ? "text-amber-600" : idx === 1 ? "text-slate-500" : idx === 2 ? "text-amber-700" : "text-slate-400"}`}>
              {idx < 3 ? <Trophy size={16} className="inline" /> : idx + 1}
            </span>

            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
              {op.name?.[0] || '?'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-900 truncate">{op.name}</p>
                <Badge variant={(DIVISION_COLORS[op.division] ? undefined : "slate") as any} className={DIVISION_COLORS[op.division] || ""}>
                  {op.division}
                </Badge>
                {op.xp > 2500 && (
                  <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-0.5">
                    <CheckCircle size={8} /> Top talent
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {op.organization?.name || "Independent"} • {op.city || "Unknown"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-semibold text-slate-900">{op.rank || 1200}</p>
              <p className="text-[10px] text-slate-400">{op.xp.toLocaleString()} XP</p>
            </div>
          </div>
        )) : (
          <div className="card p-12 text-center text-sm text-slate-500">No results found.</div>
        )}
      </div>
    </div>
  );
}
