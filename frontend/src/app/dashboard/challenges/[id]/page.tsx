"use client";

import { useEffect, useState, use } from "react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import Link from "next/link";
import {
  Trophy,
  Target,
  Flag,
  BookOpen,
  Flame,
  Users,
  Loader2,
  Clock,
  ArrowLeft,
  Crown,
  Medal,
  Award,
  Zap,
  CheckCircle2,
} from "lucide-react";

interface ChallengeDetail {
  id: string;
  title: string;
  description: string;
  type: string;
  goalType: string;
  goalCount: number;
  xpReward: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  participants: Array<{
    id: string;
    progress: number;
    completed: boolean;
    user: { id: string; name: string; email: string; xp: number };
  }>;
  teamParticipants: Array<{
    id: string;
    progress: number;
    completed: boolean;
    team: { id: string; name: string };
  }>;
}

interface LeaderboardEntry {
  progress: number;
  completed: boolean;
  user?: { id: string; name: string; email: string; xp: number };
  team?: { id: string; name: string };
}

const goalIcons: Record<string, typeof Trophy> = {
  LESSONS_COMPLETED: BookOpen,
  FLAGS_CAPTURED: Flag,
  XP_EARNED: Zap,
  STREAK_DAYS: Flame,
};

const goalLabels: Record<string, string> = {
  LESSONS_COMPLETED: "lessons completed",
  FLAGS_CAPTURED: "flags captured",
  XP_EARNED: "XP earned",
  STREAK_DAYS: "day streak",
};

export default function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [c, lb] = await Promise.all([
          fetchApi<ChallengeDetail>(`/challenges/${id}`),
          fetchApi<LeaderboardEntry[]>(`/challenges/${id}/leaderboard`),
        ]);
        setChallenge(c);
        setLeaderboard(lb);
      } catch {
        toast.error("Failed to load challenge");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await fetchApi(`/challenges/${id}/join`, { method: "POST" });
      toast.success("Joined challenge!");
      setChallenge((prev) =>
        prev
          ? {
              ...prev,
              participants: [
                ...prev.participants,
                { id: "me", progress: 0, completed: false, user: { id: "me", name: "You", email: "", xp: 0 } },
              ],
            }
          : prev
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to join";
      toast.error(msg);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <Trophy size={32} className="text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Challenge not found</p>
        <Link href="/dashboard/challenges" className="text-xs text-blue-600 hover:text-blue-700 mt-3 inline-block">
          Back to Challenges
        </Link>
      </div>
    );
  }

  const GoalIcon = goalIcons[challenge.goalType] || Target;
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  const isParticipant = challenge.participants.some((p) => p.user.id === "me" || p.id === "me");
  const totalParticipants = challenge.participants.length + challenge.teamParticipants.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link
        href="/dashboard/challenges"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={14} /> Back to Challenges
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-lg">
                <GoalIcon size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold">{challenge.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {challenge.type === "TEAM" ? "Team" : "Individual"}
                  </span>
                  {daysLeft > 0 ? (
                    <span className="text-xs flex items-center gap-1">
                      <Clock size={12} /> {daysLeft} days left
                    </span>
                  ) : (
                    <span className="text-xs bg-red-500/30 px-2 py-0.5 rounded-full">Ended</span>
                  )}
                </div>
              </div>
            </div>
            {challenge.xpReward > 0 && (
              <div className="text-right">
                <span className="text-2xl font-bold">+{challenge.xpReward}</span>
                <p className="text-xs text-blue-200">XP Reward</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-2">About</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{challenge.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <Target size={18} className="text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900">{challenge.goalCount}</p>
              <p className="text-[11px] text-slate-500">{goalLabels[challenge.goalType]}</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <Users size={18} className="text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900">{totalParticipants}</p>
              <p className="text-[11px] text-slate-500">Participants</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <Trophy size={18} className="text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900">
                {challenge.participants.filter((p) => p.completed).length + challenge.teamParticipants.filter((p) => p.completed).length}
              </p>
              <p className="text-[11px] text-slate-500">Completed</p>
            </div>
          </div>

          {!isParticipant && challenge.isActive && daysLeft > 0 && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {joining ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {joining ? "Joining..." : "Join Challenge"}
            </button>
          )}
          {isParticipant && (
            <div className="flex items-center gap-2 text-[#229C62] text-sm bg-[#E9F8EE] p-3 rounded-lg">
              <CheckCircle2 size={16} />
              <span className="font-medium">You&apos;re participating in this challenge</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Medal size={16} className="text-amber-500" /> Leaderboard
          </h2>
        </div>
        {leaderboard.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={24} className="text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No participants yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaderboard.map((entry, i) => {
              const name = entry.user?.name || entry.team?.name || "Unknown";
              const pct = Math.min(100, Math.round((entry.progress / challenge.goalCount) * 100));
              const rankIcon =
                i === 0 ? (
                  <Crown size={16} className="text-yellow-500" />
                ) : i === 1 ? (
                  <Medal size={16} className="text-slate-400" />
                ) : i === 2 ? (
                  <Award size={16} className="text-amber-600" />
                ) : (
                  <span className="text-xs text-slate-400 w-4 text-center">{i + 1}</span>
                );

              return (
                <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div className="w-6 flex justify-center">{rankIcon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            entry.completed ? "bg-[#229C62]" : "bg-blue-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {entry.progress}/{challenge.goalCount}
                      </span>
                    </div>
                  </div>
                  {entry.completed && (
                    <CheckCircle2 size={16} className="text-[#229C62] flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
