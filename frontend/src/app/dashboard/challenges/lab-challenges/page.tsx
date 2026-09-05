"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import {
  Swords, Loader2, Plus, Check, X, Clock, Trophy, Zap,
  ChevronRight, User, FlaskConical, Search,
} from "lucide-react";

interface Challenge {
  id: string;
  challengerId: string;
  opponentId: string;
  status: string;
  challengerTime: number | null;
  opponentTime: number | null;
  winnerId: string | null;
  createdAt: string;
  expiresAt: string;
  challenger: { id: string; name: string; username?: string; xp: number };
  opponent: { id: string; name: string; username?: string; xp: number };
  lab: { id: string; title: string; difficulty: number };
}

interface LeaderboardEntry {
  id: string;
  name: string;
  username?: string;
  division: string;
  xp: number;
  rank: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/10" },
  ACCEPTED: { label: "Active", color: "text-[#7AD62A]", bg: "bg-[#7AD62A]/10" },
  COMPLETED: { label: "Completed", color: "text-blue-400", bg: "bg-blue-500/10" },
  DECLINED: { label: "Declined", color: "text-red-400", bg: "bg-red-500/10" },
  EXPIRED: { label: "Expired", color: "text-slate-400", bg: "bg-slate-500/10" },
};

export default function LabChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<string>("");
  const [selectedLab, setSelectedLab] = useState<string>("");
  const [search, setSearch] = useState("");
  const [labs, setLabs] = useState<{ id: string; title: string; difficulty: number }[]>([]);
  const [sending, setSending] = useState(false);

  const myId = typeof window !== "undefined" ? (() => { try { return JSON.parse(localStorage.getItem("user") || "{}").id; } catch { return ""; } })() : "";

  useEffect(() => {
    Promise.all([
      fetchApi<Challenge[]>("/challenges/lab-challenges/mine"),
      fetchApi<LeaderboardEntry[]>("/dashboard/leaderboard?limit=30"),
      fetchApi<{ id: string; title: string; difficulty: number }[]>("/labs"),
    ]).then(([c, l, labData]) => {
      setChallenges(c || []);
      setLeaderboard(l || []);
      setLabs(labData || []);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredOpponents = leaderboard.filter(
    (e) => e.id !== myId && (e.name.toLowerCase().includes(search.toLowerCase()) || e.username?.toLowerCase().includes(search.toLowerCase()))
  );

  const pendingReceived = challenges.filter((c) => c.opponentId === myId && c.status === "PENDING");
  const active = challenges.filter((c) => (c.challengerId === myId || c.opponentId === myId) && c.status === "ACCEPTED");
  const completed = challenges.filter((c) => (c.challengerId === myId || c.opponentId === myId) && c.status === "COMPLETED");

  async function handleSend() {
    if (!selectedOpponent || !selectedLab) return;
    setSending(true);
    try {
      const res = await fetchApi<Challenge>("/challenges/lab-challenges", {
        method: "POST",
        body: JSON.stringify({ opponentId: selectedOpponent, labId: selectedLab }),
      });
      setChallenges((prev) => [res, ...prev]);
      setShowNew(false);
      setSelectedOpponent("");
      setSelectedLab("");
      setSearch("");
    } catch {}
    setSending(false);
  }

  async function handleAccept(id: string) {
    try {
      const res = await fetchApi<Challenge>(`/challenges/lab-challenges/${id}/accept`, { method: "POST" });
      setChallenges((prev) => prev.map((c) => c.id === id ? res : c));
    } catch {}
  }

  async function handleDecline(id: string) {
    try {
      await fetchApi(`/challenges/lab-challenges/${id}/decline`, { method: "POST" });
      setChallenges((prev) => prev.map((c) => c.id === id ? { ...c, status: "DECLINED" } : c));
    } catch {}
  }

  async function handleComplete(id: string) {
    try {
      const res = await fetchApi<Challenge>(`/challenges/lab-challenges/${id}/complete`, { method: "POST" });
      setChallenges((prev) => prev.map((c) => c.id === id ? res : c));
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="text-[#7AD62A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Lab Challenges"
        description="Challenge another engineer to complete a lab faster. Who finishes first?"
        action={
          <button
            onClick={() => setShowNew(!showNew)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#7AD62A] text-[#0F203A] text-sm font-semibold rounded-lg hover:bg-[#6bc422] transition-colors"
          >
            <Plus size={16} /> New Challenge
          </button>
        }
      />

      {/* New challenge form */}
      {showNew && (
        <div className="angular-card bg-[#0f172a] border border-[#7AD62A]/20 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Send a Challenge</h3>

          {/* Opponent search */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Choose opponent</label>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7AD62A]/50"
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {filteredOpponents.slice(0, 8).map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelectedOpponent(e.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all ${
                    selectedOpponent === e.id ? "bg-[#7AD62A]/10 border border-[#7AD62A]/30" : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white">
                    {e.username?.[0]?.toUpperCase() || e.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{e.username || e.name}</p>
                    <p className="text-[10px] text-slate-400">{e.xp.toLocaleString()} XP</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Lab selection */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Choose lab</label>
            <select
              value={selectedLab}
              onChange={(e) => setSelectedLab(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#7AD62A]/50"
            >
              <option value="">Select a lab...</option>
              {labs.map((lab) => (
                <option key={lab.id} value={lab.id}>{lab.title} (Difficulty {lab.difficulty})</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSend}
              disabled={!selectedOpponent || !selectedLab || sending}
              className="px-4 py-2 bg-[#7AD62A] text-[#0F203A] text-sm font-semibold rounded-lg hover:bg-[#6bc422] transition-colors disabled:opacity-50"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : "Send Challenge"}
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="px-4 py-2 border border-white/10 text-slate-300 text-sm rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pending received */}
      {pendingReceived.length > 0 && (
        <div className="angular-card bg-[#0f172a] border border-white/6 p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Clock size={14} className="text-amber-400" /> Incoming Challenges ({pendingReceived.length})
          </h3>
          <div className="space-y-2">
            {pendingReceived.map((c) => (
              <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl border border-white/4 bg-white/[0.02]">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-xs font-bold text-amber-400">
                  {c.challenger.username?.[0]?.toUpperCase() || c.challenger.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    <span className="font-medium">{c.challenger.username || c.challenger.name}</span>
                    {" "}challenged you on{" "}
                    <span className="font-medium">{c.lab.title}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">Expires {new Date(c.expiresAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(c.id)} className="px-3 py-1.5 bg-[#7AD62A] text-[#0F203A] text-xs font-semibold rounded-lg hover:bg-[#6bc422]">
                    <Check size={12} className="inline mr-1" /> Accept
                  </button>
                  <button onClick={() => handleDecline(c.id)} className="px-3 py-1.5 border border-white/10 text-slate-300 text-xs rounded-lg hover:bg-white/5">
                    <X size={12} className="inline mr-1" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active challenges */}
      <div className="angular-card bg-[#0f172a] border border-white/6 p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Swords size={14} className="text-[#7AD62A]" /> Active Challenges ({active.length})
        </h3>
        {active.length > 0 ? (
          <div className="space-y-2">
            {active.map((c) => {
              const amChallenger = c.challengerId === myId;
              const opponent = amChallenger ? c.opponent : c.challenger;
              const myTime = amChallenger ? c.challengerTime : c.opponentTime;
              const theirTime = amChallenger ? c.opponentTime : c.challengerTime;

              return (
                <div key={c.id} className="p-4 rounded-xl border border-[#7AD62A]/20 bg-[#7AD62A]/[0.03]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <FlaskConical size={16} className="text-[#7AD62A]" />
                      <div>
                        <p className="text-sm font-medium text-white">{c.lab.title}</p>
                        <p className="text-[11px] text-slate-400">vs {opponent.username || opponent.name}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#7AD62A]/10 text-[#7AD62A]">{STATUS_CONFIG[c.status]?.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                      <p className="text-[10px] text-slate-500 uppercase">Your Time</p>
                      <p className="text-lg font-bold text-white font-mono">{myTime !== null ? formatTime(myTime) : "—"}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                      <p className="text-[10px] text-slate-500 uppercase">Their Time</p>
                      <p className="text-lg font-bold text-white font-mono">{theirTime !== null ? formatTime(theirTime) : "—"}</p>
                    </div>
                  </div>
                  {myTime === null && (
                    <Link
                      href={`/dashboard/labs/${c.lab.id}`}
                      className="block w-full text-center px-4 py-2 bg-[#7AD62A] text-[#0F203A] text-sm font-semibold rounded-lg hover:bg-[#6bc422] transition-colors"
                    >
                      Start Lab <ChevronRight size={14} className="inline ml-1" />
                    </Link>
                  )}
                  {myTime !== null && theirTime === null && (
                    <p className="text-xs text-slate-400 text-center">Waiting for opponent to finish...</p>
                  )}
                  {myTime !== null && theirTime !== null && (
                    <button
                      onClick={() => handleComplete(c.id)}
                      className="w-full px-4 py-2 border border-[#7AD62A]/30 text-[#7AD62A] text-sm font-semibold rounded-lg hover:bg-[#7AD62A]/10 transition-colors"
                    >
                      Finalize Results
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Swords size={24} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No active challenges</p>
            <p className="text-xs text-slate-600 mt-1">Send a challenge to get started</p>
          </div>
        )}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div className="angular-card bg-[#0f172a] border border-white/6 p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Trophy size={14} className="text-amber-400" /> Completed ({completed.length})
          </h3>
          <div className="space-y-2">
            {completed.slice(0, 10).map((c) => {
              const amChallenger = c.challengerId === myId;
              const opponent = amChallenger ? c.opponent : c.challenger;
              const myTime = amChallenger ? c.challengerTime : c.opponentTime;
              const theirTime = amChallenger ? c.opponentTime : c.challengerTime;
              const won = c.winnerId === myId;

              return (
                <div key={c.id} className={`flex items-center gap-4 p-3 rounded-xl border ${won ? "border-[#7AD62A]/20 bg-[#7AD62A]/[0.03]" : "border-white/4 bg-white/[0.02]"}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${won ? "bg-[#7AD62A]/10 text-[#7AD62A]" : "bg-white/10 text-slate-400"}`}>
                    {won ? <Trophy size={14} /> : <X size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      vs <span className="font-medium">{opponent.username || opponent.name}</span>
                      {" "}on <span className="font-medium">{c.lab.title}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      You: {myTime !== null ? formatTime(myTime) : "—"} · Them: {theirTime !== null ? formatTime(theirTime) : "—"}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${won ? "bg-[#7AD62A]/10 text-[#7AD62A]" : "bg-white/5 text-slate-400"}`}>
                    {won ? "Won" : "Lost"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
