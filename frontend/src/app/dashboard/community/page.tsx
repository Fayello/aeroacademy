"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useDashboard } from "@/hooks/useDashboard";
import PageHeader from "@/components/ui/PageHeader";
import {
  Users, Trophy, FlaskConical, MessageSquare, ChevronRight, Loader2,
  Shield, Zap, Crown, Target, Activity, Flame, Swords,
} from "lucide-react";
import { DIVISION_TEXT_COLORS } from "@/lib/constants";

interface Team {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  totalXp: number;
  avatarUrl?: string;
  primaryColor?: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  username?: string;
  division: string;
  xp: number;
  rank: number;
}

interface FeedItem {
  type: string;
  message: string;
  points?: number;
  timestamp: string;
}

interface TeamSeeker {
  id: string;
  name: string;
  username?: string;
  xp: number;
  division: string;
  rank: number;
  currentStreak: number;
  avatarUrl?: string;
  city?: string;
}

const DIVISION_ORDER = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "TITAN", "GRANDMASTER"];

export default function CommunityPage() {
  const { userMetrics, feed, leaderboard } = useDashboard();
  const [teams, setTeams] = useState<Team[]>([]);
  const [seekers, setSeekers] = useState<TeamSeeker[]>([]);
  const [mySeeking, setMySeeking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const myId = typeof window !== "undefined" ? (() => { try { return JSON.parse(localStorage.getItem("user") || "{}").id; } catch { return ""; } })() : "";

  useEffect(() => {
    Promise.all([
      fetchApi<Team[]>("/teams"),
      fetchApi<TeamSeeker[]>("/dashboard/team-seekers"),
    ]).then(([teamData, seekerData]) => {
      setTeams(teamData?.slice(0, 6) || []);
      setSeekers(seekerData || []);
      const me = (seekerData || []) as TeamSeeker[];
      if (me.some((s) => s.id === myId)) setMySeeking(true);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [myId]);

  async function toggleSeeking() {
    setToggling(true);
    try {
      const res = await fetchApi<{ seekingTeam: boolean }>("/dashboard/seeking-team", { method: "POST" });
      setMySeeking(res.seekingTeam);
      if (res.seekingTeam) {
        fetchApi<TeamSeeker[]>("/dashboard/team-seekers").then((d) => setSeekers(d || []));
      }
    } catch {}
    setToggling(false);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Community"
        description="Connect with fellow engineers, join teams, and compete together."
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/dashboard/leaderboard" className="angular-card bg-[#0f172a] border border-white/6 p-4 hover:border-[#7AD62A]/20 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Trophy size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{userMetrics?.rank || 1200}</p>
              <p className="text-[10px] text-slate-500 uppercase">Your Rating</p>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/ranking" className="angular-card bg-[#0f172a] border border-white/6 p-4 hover:border-blue-500/20 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{userMetrics?.division || "BRONZE"}</p>
              <p className="text-[10px] text-slate-500 uppercase">Division</p>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/teams" className="angular-card bg-[#0f172a] border border-white/6 p-4 hover:border-violet-500/20 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <Users size={18} className="text-violet-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{teams.length}</p>
              <p className="text-[10px] text-slate-500 uppercase">Teams</p>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/labs" className="angular-card bg-[#0f172a] border border-white/6 p-4 hover:border-[#7AD62A]/20 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center shrink-0">
              <FlaskConical size={18} className="text-[#7AD62A]" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{userMetrics?.xp?.toLocaleString() || "0"}</p>
              <p className="text-[10px] text-slate-500 uppercase">Total XP</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity feed */}
        <div className="angular-card bg-[#0f172a] border border-white/6 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#7AD62A]" />
              <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
            </div>
            {feed.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-[#7AD62A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7AD62A] animate-pulse" />
                Live
              </span>
            )}
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {feed.length > 0 ? feed.slice(0, 8).map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  item.type === "ACHIEVEMENT_UNLOCKED" ? "bg-amber-400" :
                  item.type === "FLAG_CAPTURED" ? "bg-blue-400" :
                  "bg-[#7AD62A]/60"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 leading-snug">{item.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {item.points && (
                      <span className="text-xs font-medium text-[#7AD62A]">+{item.points} XP</span>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <Activity size={24} className="text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No activity yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Top performers */}
        <div className="angular-card bg-[#0f172a] border border-white/6 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Top Performers</h2>
            </div>
            <Link href="/dashboard/leaderboard" className="text-xs text-[#7AD62A] hover:text-[#6bc422] font-medium flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((op, idx) => (
              <div key={op.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors">
                <span className="text-xs font-medium text-slate-400 w-5 text-center">{idx + 1}</span>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white">
                  {op.username?.[0]?.toUpperCase() || op.name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{op.username || op.name}</p>
                  <p className={`text-xs font-medium ${DIVISION_TEXT_COLORS[op.division] || "text-slate-500"}`}>{op.division}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{op.xp.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500">XP</p>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="text-center py-8">
                <Trophy size={24} className="text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No leaderboard data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teams directory */}
      <div className="angular-card bg-[#0f172a] border border-white/6 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Teams</h2>
          </div>
          <Link href="/dashboard/teams" className="text-xs text-[#7AD62A] hover:text-[#6bc422] font-medium flex items-center gap-1">
            Browse all <ChevronRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="text-slate-500 animate-spin" />
          </div>
        ) : teams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/dashboard/teams`}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/4 bg-white/[0.02] hover:bg-white/[0.04] hover:border-violet-500/20 transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm"
                  style={{ backgroundColor: team.primaryColor || "#7AD62A" }}
                >
                  {team.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-violet-400 transition-colors">{team.name}</p>
                  <p className="text-[11px] text-slate-400">{team.memberCount ?? 0} members · {(team.totalXp ?? 0).toLocaleString()} XP</p>
                </div>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-violet-400 shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users size={24} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 mb-2">No teams yet</p>
            <Link href="/dashboard/teams" className="text-xs text-[#7AD62A] hover:text-[#6bc422] font-medium">
              Create or join a team
            </Link>
          </div>
        )}
      </div>

      {/* Find Teammates */}
      <div className="angular-card bg-[#0f172a] border border-white/6 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#7AD62A]" />
            <h2 className="text-sm font-semibold text-white">Find Teammates</h2>
          </div>
          <button
            onClick={toggleSeeking}
            disabled={toggling}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mySeeking
                ? "bg-[#7AD62A] text-[#0F203A] hover:bg-[#6bc422]"
                : "border border-[#7AD62A]/30 text-[#7AD62A] hover:bg-[#7AD62A]/10"
            }`}
          >
            {mySeeking ? "Seeking ✓" : "I'm Looking for a Team"}
          </button>
        </div>

        {seekers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {seekers.filter((s) => s.id !== myId).slice(0, 9).map((seeker) => {
              const myDivIdx = DIVISION_ORDER.indexOf(userMetrics?.division || "BRONZE");
              const theirDivIdx = DIVISION_ORDER.indexOf(seeker.division);
              const skillMatch = Math.abs(myDivIdx - theirDivIdx) <= 1;
              const levelDiff = Math.abs((userMetrics?.xp || 0) - seeker.xp);

              return (
                <div key={seeker.id} className={`p-3 rounded-xl border transition-all ${
                  skillMatch ? "border-[#7AD62A]/30 bg-[#7AD62A]/[0.03]" : "border-white/4 bg-white/[0.02]"
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {seeker.username?.[0]?.toUpperCase() || seeker.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{seeker.username || seeker.name}</p>
                      <p className={`text-[10px] font-medium ${
                        theirDivIdx >= myDivIdx ? "text-[#7AD62A]" : "text-slate-400"
                      }`}>{seeker.division} · {seeker.xp.toLocaleString()} XP</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    {skillMatch && (
                      <span className="px-1.5 py-0.5 rounded bg-[#7AD62A]/10 text-[#7AD62A] font-medium">Good Match</span>
                    )}
                    {seeker.currentStreak > 0 && (
                      <span className="flex items-center gap-0.5"><Flame size={9} className="text-orange-400" /> {seeker.currentStreak}d</span>
                    )}
                    {seeker.city && <span>{seeker.city}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users size={24} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 mb-1">No one is looking for a team right now</p>
            <p className="text-xs text-slate-600">Be the first — click the button above</p>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Link href="/dashboard/teams" className="angular-card bg-[#0f172a] border border-white/6 p-4 hover:border-violet-500/20 transition-all group flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <Users size={18} className="text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white group-hover:text-violet-400 transition-colors">Teams</p>
            <p className="text-[11px] text-slate-400">Create or join a team</p>
          </div>
          <ChevronRight size={14} className="text-slate-600 group-hover:text-violet-400" />
        </Link>
        <Link href="/dashboard/head-to-head" className="angular-card bg-[#0f172a] border border-white/6 p-4 hover:border-[#7AD62A]/20 transition-all group flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center shrink-0">
            <Swords size={18} className="text-[#7AD62A]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white group-hover:text-[#7AD62A] transition-colors">Head-to-Head</p>
            <p className="text-[11px] text-slate-400">Compare with others</p>
          </div>
          <ChevronRight size={14} className="text-slate-600 group-hover:text-[#7AD62A]" />
        </Link>
        <Link href="/dashboard/leaderboard" className="angular-card bg-[#0f172a] border border-white/6 p-4 hover:border-amber-500/20 transition-all group flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Trophy size={18} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">Leaderboard</p>
            <p className="text-[11px] text-slate-400">See global rankings</p>
          </div>
          <ChevronRight size={14} className="text-slate-600 group-hover:text-amber-400" />
        </Link>
        <Link href="/dashboard/ranking" className="angular-card bg-[#0f172a] border border-white/6 p-4 hover:border-blue-500/20 transition-all group flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Target size={18} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">Your Ranking</p>
            <p className="text-[11px] text-slate-400">Division and rating</p>
          </div>
          <ChevronRight size={14} className="text-slate-600 group-hover:text-blue-400" />
        </Link>
      </div>
    </div>
  );
}
