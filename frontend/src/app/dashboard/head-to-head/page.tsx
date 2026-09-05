"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useDashboard } from "@/hooks/useDashboard";
import PageHeader from "@/components/ui/PageHeader";
import {
  Swords, Loader2, Search, Trophy, Zap, Shield, Flame, Target,
  Award, ChevronRight, User,
} from "lucide-react";
import { DIVISION_TEXT_COLORS } from "@/lib/constants";

interface H2HUser {
  id: string;
  name: string;
  username?: string;
  xp: number;
  rank: number;
  division: string;
  currentStreak: number;
  longestStreak: number;
  level: number;
  flagsCaptured: number;
  labsCompleted: number;
  achievementsCount: number;
}

interface H2HResult {
  user1: H2HUser;
  user2: H2HUser;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  username?: string;
  division: string;
  xp: number;
  rank: number;
}

function StatBar({ label, val1, val2, icon: Icon, higherIsBetter = true }: { label: string; val1: number; val2: number; icon: typeof Trophy; higherIsBetter?: boolean }) {
  const total = val1 + val2 || 1;
  const pct1 = (val1 / total) * 100;
  const winner = val1 === val2 ? 0 : higherIsBetter ? (val1 > val2 ? 1 : 2) : (val1 < val2 ? 1 : 2);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-mono font-bold ${winner === 1 ? "text-[#7AD62A]" : "text-white"}`}>{val1.toLocaleString()}</span>
        <span className="flex items-center gap-1 text-slate-400"><Icon size={12} /> {label}</span>
        <span className={`font-mono font-bold ${winner === 2 ? "text-[#7AD62A]" : "text-white"}`}>{val2.toLocaleString()}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/10">
        <div className={`transition-all duration-500 ${winner === 1 ? "bg-[#7AD62A]" : "bg-white/20"}`} style={{ width: `${pct1}%` }} />
        <div className={`transition-all duration-500 ${winner === 2 ? "bg-[#7AD62A]" : "bg-white/20"}`} style={{ width: `${100 - pct1}%` }} />
      </div>
    </div>
  );
}

export default function HeadToHeadPage() {
  const { userMetrics, leaderboard } = useDashboard();
  const [result, setResult] = useState<H2HResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");

  const myId = typeof window !== "undefined" ? (() => { try { return JSON.parse(localStorage.getItem("user") || "{}").id; } catch { return ""; } })() : "";

  const filteredLeaderboard = leaderboard.filter((e) =>
    e.id !== myId && (e.name.toLowerCase().includes(search.toLowerCase()) || e.username?.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    if (!selectedId || !myId) return;
    setLoading(true);
    fetchApi<H2HResult>(`/dashboard/head-to-head/${myId}/${selectedId}`)
      .then((data) => { if (data) setResult(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedId, myId]);

  const total1 = result ? result.user1.flagsCaptured + result.user1.labsCompleted + result.user1.achievementsCount : 0;
  const total2 = result ? result.user2.flagsCaptured + result.user2.labsCompleted + result.user2.achievementsCount : 0;
  const winner = result ? (total1 > total2 ? 1 : total2 > total1 ? 2 : 0) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Head-to-Head"
        description="Compare yourself side-by-side with any other engineer on the platform."
      />

      {!result && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
          {/* Search panel */}
          <div className="angular-card bg-[#0f172a] border border-white/6 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Search size={16} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-white">Choose an opponent</h2>
            </div>
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7AD62A]/50"
              />
            </div>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {filteredLeaderboard.slice(0, 10).map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${
                    selectedId === entry.id
                      ? "bg-[#7AD62A]/10 border border-[#7AD62A]/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                    {entry.username?.[0]?.toUpperCase() || entry.name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{entry.username || entry.name}</p>
                    <p className={`text-[10px] font-medium ${DIVISION_TEXT_COLORS[entry.division] || "text-slate-500"}`}>{entry.division}</p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{entry.xp.toLocaleString()} XP</span>
                </button>
              ))}
              {filteredLeaderboard.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No users found</p>
              )}
            </div>
          </div>

          {/* Comparison panel */}
          <div className="angular-card bg-[#0f172a] border border-white/6 p-5 flex items-center justify-center">
            {selectedId ? (
              <div className="text-center">
                <Swords size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-sm text-slate-400 mb-4">Ready to compare</p>
                <button
                  onClick={() => setSelectedId(selectedId)}
                  className="px-6 py-2.5 bg-[#7AD62A] text-[#0F203A] text-sm font-semibold rounded-lg hover:bg-[#6bc422] transition-colors"
                >
                  Start Comparison
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Swords size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-sm text-slate-400">Select an opponent to compare</p>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="angular-card bg-[#0f172a] border border-white/6 p-12 flex items-center justify-center">
          <Loader2 size={24} className="text-[#7AD62A] animate-spin" />
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {/* Result header */}
          <div className="angular-card bg-[#0f172a] border border-white/6 p-6">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              {/* User 1 */}
              <div className="text-right">
                <div className="flex items-center justify-end gap-3">
                  <div>
                    <p className="text-lg font-bold text-white">{result.user1.username || result.user1.name}</p>
                    <p className={`text-xs font-medium ${DIVISION_TEXT_COLORS[result.user1.division] || "text-slate-500"}`}>{result.user1.division} · Level {result.user1.level}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold text-white">
                    {(result.user1.username || result.user1.name)[0]?.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* VS */}
              <div className="flex flex-col items-center">
                {winner === 1 && <span className="text-[10px] text-[#7AD62A] font-bold uppercase mb-1">Winner</span>}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${winner === 1 ? "bg-[#7AD62A]/10 border border-[#7AD62A]/30" : "bg-white/5 border border-white/10"}`}>
                  <Swords size={24} className={winner === 1 ? "text-[#7AD62A]" : "text-slate-400"} />
                </div>
                {winner === 0 && <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Tied</span>}
              </div>

              {/* User 2 */}
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold text-white">
                    {(result.user2.username || result.user2.name)[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{result.user2.username || result.user2.name}</p>
                    <p className={`text-xs font-medium ${DIVISION_TEXT_COLORS[result.user2.division] || "text-slate-500"}`}>{result.user2.division} · Level {result.user2.level}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats comparison */}
          <div className="angular-card bg-[#0f172a] border border-white/6 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white mb-4">Stats Comparison</h3>
            <StatBar label="Total XP" val1={result.user1.xp} val2={result.user2.xp} icon={Zap} />
            <StatBar label="Rating (ELO)" val1={result.user1.rank} val2={result.user2.rank} icon={Target} />
            <StatBar label="Flags Captured" val1={result.user1.flagsCaptured} val2={result.user2.flagsCaptured} icon={Shield} />
            <StatBar label="Labs Completed" val1={result.user1.labsCompleted} val2={result.user2.labsCompleted} icon={Trophy} />
            <StatBar label="Achievements" val1={result.user1.achievementsCount} val2={result.user2.achievementsCount} icon={Award} />
            <StatBar label="Current Streak" val1={result.user1.currentStreak} val2={result.user2.currentStreak} icon={Flame} />
            <StatBar label="Longest Streak" val1={result.user1.longestStreak} val2={result.user2.longestStreak} icon={Flame} />
          </div>

          {/* Action */}
          <div className="flex justify-center">
            <button
              onClick={() => { setResult(null); setSelectedId(""); }}
              className="px-6 py-2.5 border border-white/10 text-slate-300 text-sm rounded-lg hover:bg-white/5 transition-colors"
            >
              Compare another user
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
