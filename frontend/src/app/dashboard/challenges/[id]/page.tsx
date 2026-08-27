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
  CheckCircle2,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

interface ChallengeDetail {
  id: string;
  title: string;
  description: string;
  type: string;
  objectiveType: string;
  objectiveTarget: number;
  xpReward: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  difficulty: string;
  domain: { id: string; name: string } | null;
  skill: { id: string; name: string } | null;
  userChallenges: Array<{
    id: string;
    progress: number;
    completed: boolean;
    user: { id: string; name: string; xp: number };
  }>;
}

interface LeaderboardEntry {
  progress: number;
  completed: boolean;
  user?: { id: string; name: string; xp: number };
}

const objectiveIcons: Record<string, typeof Trophy> = {
  FLAG_COMPLETIONS: Flag,
  LAB_COMPLETIONS: Target,
  LESSON_COMPLETIONS: BookOpen,
};

const objectiveLabels: Record<string, string> = {
  FLAG_COMPLETIONS: "flags completed",
  LAB_COMPLETIONS: "labs completed",
  LESSON_COMPLETIONS: "lessons completed",
};

const difficultyColors: Record<string, string> = {
  EASY: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HARD: "bg-red-100 text-red-700",
  BOSS: "bg-purple-100 text-purple-700",
};

export default function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0f172a] p-12 text-center">
        <Trophy size={32} className="text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Challenge not found</p>
        <Link href="/dashboard/challenges" className="text-xs text-blue-600 hover:text-blue-700 mt-3 inline-block">
          Back to Challenges
        </Link>
      </div>
    );
  }

  const ObjectiveIcon = objectiveIcons[challenge.objectiveType] || Target;
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(challenge.endAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link
        href="/dashboard/challenges"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200"
      >
        <ArrowLeft size={14} /> Back to Challenges
      </Link>

      <div className="rounded-xl border border-white/10 bg-[#0f172a] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-white/20 p-2.5 rounded-lg shrink-0">
                <ObjectiveIcon size={24} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold truncate">{challenge.title}</h1>
                <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {challenge.type === "TEAM" ? "Team" : "Individual"}
                  </span>
                  {challenge.difficulty && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[challenge.difficulty] || "bg-slate-100 text-slate-600"}`}>
                      {challenge.difficulty}
                    </span>
                  )}
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
              <div className="text-right shrink-0">
                <span className="text-2xl font-bold">+{challenge.xpReward}</span>
                <p className="text-xs text-blue-200">XP Reward</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-white mb-2">About</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{challenge.description}</p>
          </div>

          {(challenge.domain || challenge.skill) && (
            <div className="flex items-center gap-2 flex-wrap">
              {challenge.domain && (
                <span className="text-xs bg-blue-500/10 text-blue-700 px-2 py-0.5 rounded-full">
                  {challenge.domain.name}
                </span>
              )}
              {challenge.skill && (
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                  {challenge.skill.name}
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <Target size={18} className="text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{challenge.objectiveTarget}</p>
              <p className="text-[11px] text-slate-500">{objectiveLabels[challenge.objectiveType]}</p>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <Users size={18} className="text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{challenge.userChallenges.length}</p>
              <p className="text-[11px] text-slate-500">Participants</p>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <Trophy size={18} className="text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">
                {challenge.userChallenges.filter((uc) => uc.completed).length}
              </p>
              <p className="text-[11px] text-slate-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0f172a] overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Medal size={16} className="text-amber-500" /> Leaderboard
          </h2>
        </div>
        {leaderboard.length === 0 ? (
          <EmptyState icon={Users} title="No participants yet" description="" />
        ) : (
          <div className="divide-y divide-slate-100">
            {leaderboard.map((entry, i) => {
              const name = entry.user?.name || "Unknown";
              const pct = Math.min(100, Math.round((entry.progress / challenge.objectiveTarget) * 100));
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
                <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                  <div className="w-6 flex justify-center">{rankIcon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            entry.completed ? "bg-[#7AD62A]" : "bg-blue-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {entry.progress}/{challenge.objectiveTarget}
                      </span>
                    </div>
                  </div>
                  {entry.completed && (
                    <CheckCircle2 size={16} className="text-[#7AD62A] flex-shrink-0" />
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
