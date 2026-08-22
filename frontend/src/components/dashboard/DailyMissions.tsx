'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Target, Flame, Swords, Trophy, Loader2, CheckCircle2, Lock, ChevronRight } from 'lucide-react';

interface Mission {
  id: string;
  type: string;
  title: string;
  description: string;
  difficulty: string;
  objectiveType: string;
  objectiveTarget: number;
  xpReward: number;
  domain: string | null;
  skill: string | null;
  labId: string | null;
  progress: number;
  completed: boolean;
  claimedAt: string | null;
}

const tierConfig: Record<string, { icon: typeof Target; color: string; bgColor: string; borderColor: string; label: string }> = {
  warmup: {
    icon: Flame,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    label: 'Warmup',
  },
  skill: {
    icon: Swords,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: 'Skill',
  },
  boss: {
    icon: Trophy,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Boss',
  },
};

export default function DailyMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMissions();
  }, []);

  async function fetchMissions() {
    try {
      const data = await fetchApi<any[]>('/challenges/missions');
      setMissions(data);
    } catch (e: any) {
      if (e.message?.includes('unlock') || e.message?.includes('Level')) {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function claimReward(missionId: string) {
    setClaimingId(missionId);
    try {
      await fetchApi(`/challenges/missions/${missionId}/claim`, { method: 'POST' });
      await fetchMissions();
    } catch (e) {
      console.error('Claim failed:', e);
    } finally {
      setClaimingId(null);
    }
  }

  if (loading) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#7AD62A]" />
          <h2 className="text-lg font-semibold text-white">Daily Missions</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-white/40" />
          <h2 className="text-lg font-semibold text-white/60">Daily Missions</h2>
        </div>
        <p className="text-sm text-white/40 text-center py-4">
          Reach Level 2 to unlock daily missions
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#7AD62A]" />
          <h2 className="text-lg font-semibold text-white">Daily Missions</h2>
        </div>
        <span className="text-xs text-white/40">Resets daily</span>
      </div>

      {missions.length === 0 ? (
        <p className="text-sm text-white/40 text-center py-4">No missions available today</p>
      ) : (
        <div className="space-y-3">
          {missions.map((mission) => {
            const config = tierConfig[mission.type] || tierConfig.warmup;
            const Icon = config.icon;
            const pct = Math.min(100, Math.round((mission.progress / mission.objectiveTarget) * 100));

            return (
              <div
                key={mission.id}
                className={`border ${config.borderColor} rounded-lg p-4 ${config.bgColor} transition-all`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`mt-0.5 ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-[10px] text-white/30">•</span>
                        <span className="text-[10px] text-white/40">{mission.xpReward} XP</span>
                      </div>
                      <h3 className="text-sm font-medium text-white mt-1 truncate">{mission.title}</h3>
                      <p className="text-xs text-white/50 mt-0.5">{mission.description}</p>
                    </div>
                  </div>

                  {mission.completed && !mission.claimedAt ? (
                    <button
                      onClick={() => claimReward(mission.id)}
                      disabled={claimingId === mission.id}
                      className="flex-shrink-0 px-3 py-1.5 bg-[#7AD62A] text-[#0F203A] text-xs font-bold rounded-lg hover:bg-[#6bc425] transition-colors disabled:opacity-50"
                    >
                      {claimingId === mission.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        'Claim'
                      )}
                    </button>
                  ) : mission.claimedAt ? (
                    <div className="flex-shrink-0 flex items-center gap-1 text-[#229C62]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-medium">Claimed</span>
                    </div>
                  ) : (
                    <a
                      href={mission.labId ? `/dashboard/labs/${mission.labId}` : '/dashboard/labs'}
                      className="flex-shrink-0 px-3 py-1.5 border border-white/20 text-white/60 text-xs rounded-lg hover:border-white/40 hover:text-white/80 transition-colors flex items-center gap-1"
                    >
                      Go <ChevronRight className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Progress bar */}
                {!mission.claimedAt && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-white/40">
                        {mission.progress}/{mission.objectiveTarget} {mission.objectiveType === 'FLAG_COMPLETIONS' ? 'flags' : 'labs'}
                      </span>
                      <span className="text-[10px] text-white/40">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          mission.completed ? 'bg-[#7AD62A]' : 'bg-white/20'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
