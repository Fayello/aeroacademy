"use client";

import { useEffect, useState } from "react";
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
  ChevronRight,
  Plus,
  Calendar,
  Zap,
} from "lucide-react";

interface Challenge {
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
  _count: { participants: number; teamParticipants: number };
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

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<Challenge[]>("/challenges");
        setChallenges(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleJoin = async (challengeId: string) => {
    setJoining(challengeId);
    try {
      await fetchApi(`/challenges/${challengeId}/join`, { method: "POST" });
      toast.success("Joined challenge!");
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId
            ? { ...c, _count: { ...c._count, participants: c._count.participants + 1 } }
            : c
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to join";
      toast.error(msg);
    } finally {
      setJoining(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Challenges</h1>
          <p className="text-sm text-slate-500 mt-1">Compete and earn rewards</p>
        </div>
      </div>

      {challenges.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Trophy size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No active challenges right now</p>
          <p className="text-xs text-slate-400 mt-1">Check back later for new competitions</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((challenge) => {
            const GoalIcon = goalIcons[challenge.goalType] || Target;
            const daysLeft = Math.max(
              0,
              Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            );

            return (
              <div
                key={challenge.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-blue-300 transition-all"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg">
                        <GoalIcon size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{challenge.title}</h3>
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {challenge.type === "TEAM" ? "Team" : "Individual"}
                        </span>
                      </div>
                    </div>
                    {challenge.xpReward > 0 && (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                        +{challenge.xpReward} XP
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{challenge.description}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Target size={12} />
                      {challenge.goalCount} {goalLabels[challenge.goalType]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {challenge._count.participants + challenge._count.teamParticipants} joined
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {daysLeft}d left
                    </span>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  <Link
                    href={`/dashboard/challenges/${challenge.id}`}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    View Details <ChevronRight size={12} />
                  </Link>
                  <button
                    onClick={() => handleJoin(challenge.id)}
                    disabled={joining === challenge.id}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 transition-colors"
                  >
                    {joining === challenge.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      "Join"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
