'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import {
  Target, Flame, Swords, Trophy, Loader2, CheckCircle2,
  Lock, ChevronRight, Calendar, Zap, Crown,
} from 'lucide-react';

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
  endAt: string;
}

function timeRemaining(endAt: string): string {
  const now = new Date();
  const end = new Date(endAt);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 7) return `${days}d left`;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

const tierConfig: Record<string, { icon: typeof Target; color: string; bgColor: string; borderColor: string; label: string; accent: string }> = {
  warmup: { icon: Flame, color: 'text-orange-400', bgColor: 'bg-orange-500/8', borderColor: 'border-orange-500/20', label: 'Warmup', accent: 'bg-orange-500' },
  skill: { icon: Swords, color: 'text-blue-400', bgColor: 'bg-blue-500/8', borderColor: 'border-blue-500/20', label: 'Skill', accent: 'bg-blue-500' },
  boss: { icon: Trophy, color: 'text-red-400', bgColor: 'bg-red-500/8', borderColor: 'border-red-500/20', label: 'Boss', accent: 'bg-red-500' },
  weekly: { icon: Calendar, color: 'text-purple-400', bgColor: 'bg-purple-500/8', borderColor: 'border-purple-500/20', label: 'Weekly', accent: 'bg-purple-500' },
  monthly: { icon: Crown, color: 'text-yellow-400', bgColor: 'bg-yellow-500/8', borderColor: 'border-yellow-500/20', label: 'Monthly', accent: 'bg-yellow-500' },
};

const sections = [
  { key: 'daily', title: "Today's Missions", icon: Zap, types: ['warmup', 'skill', 'boss'], headerColor: 'text-white' },
  { key: 'weekly', title: 'Weekly Challenge', icon: Calendar, types: ['weekly'], headerColor: 'text-purple-400' },
  { key: 'monthly', title: 'Monthly Boss', icon: Crown, types: ['monthly'], headerColor: 'text-yellow-400' },
];

function MissionCard({ mission, onClaim, claimingId }: { mission: Mission; onClaim: (id: string) => void; claimingId: string | null }) {
  const config = tierConfig[mission.type] || tierConfig.warmup;
  const Icon = config.icon;
  const pct = Math.min(100, Math.round((mission.progress / mission.objectiveTarget) * 100));
  const isLongTerm = mission.type === 'weekly' || mission.type === 'monthly';

  return (
    <div className={`border ${config.borderColor} rounded-lg p-3 sm:p-4 ${config.bgColor} transition-all hover:border-opacity-50`}>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className={`mt-0.5 ${config.color} flex-shrink-0`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                {config.label}
              </span>
              <span className="text-[10px] text-white/20">{'\u2022'}</span>
              <span className="text-[10px] font-semibold text-[#7AD62A]">{mission.xpReward} XP</span>
              {isLongTerm && (
                <>
                  <span className="text-[10px] text-white/20 hidden sm:inline">{'\u2022'}</span>
                  <span className={`text-[10px] flex items-center gap-0.5 ${config.color} hidden sm:inline`}>
                    {timeRemaining(mission.endAt)}
                  </span>
                </>
              )}
            </div>
            <h3 className="text-sm font-medium text-white mt-1 line-clamp-1">{mission.title}</h3>
            <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{mission.description}</p>
          </div>
        </div>

        {mission.completed && !mission.claimedAt ? (
          <button
            onClick={() => onClaim(mission.id)}
            disabled={claimingId === mission.id}
            className="flex-shrink-0 px-3 py-1.5 bg-[#7AD62A] text-[#0F203A] text-xs font-bold rounded-lg hover:bg-[#6bc425] transition-colors disabled:opacity-50"
          >
            {claimingId === mission.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Claim'}
          </button>
        ) : mission.claimedAt ? (
          <div className="flex-shrink-0 flex items-center gap-1 text-[#229C62]">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] font-medium hidden sm:inline">Claimed</span>
          </div>
        ) : (
          <a
            href={mission.labId ? `/dashboard/labs/${mission.labId}` : '/dashboard/labs'}
            className="flex-shrink-0 px-3 py-1.5 border border-white/15 text-white/50 text-xs rounded-lg hover:border-white/30 hover:text-white/70 transition-colors flex items-center gap-1"
          >
            Go <ChevronRight className="w-3 h-3" />
          </a>
        )}
      </div>

      {!mission.claimedAt && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/35">
              {mission.progress}/{mission.objectiveTarget} {mission.objectiveType === 'FLAG_COMPLETIONS' ? 'flags' : 'labs'}
            </span>
            <span className="text-[10px] text-white/35">{pct}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${mission.completed ? 'bg-[#7AD62A]' : config.accent + '/60'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function DailyMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchMissions(); }, []);

  async function fetchMissions() {
    try {
      const data = await fetchApi<any[]>('/challenges/missions');
      setMissions(data);
    } catch (e: any) {
      if (e.message?.includes('unlock') || e.message?.includes('Level')) setError(e.message);
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
          <h2 className="text-lg font-semibold text-white">Missions</h2>
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
          <h2 className="text-lg font-semibold text-white/60">Missions</h2>
        </div>
        <p className="text-sm text-white/40 text-center py-4">{error}</p>
      </div>
    );
  }

  const totalXP = missions.reduce((sum, m) => sum + (m.claimedAt ? m.xpReward : 0), 0);
  const completedCount = missions.filter(m => m.claimedAt).length;

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#7AD62A]" />
          <h2 className="text-lg font-semibold text-white">Missions</h2>
        </div>
        {missions.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span>{completedCount}/{missions.length} done</span>
            {totalXP > 0 && <span className="text-[#7AD62A] font-semibold">+{totalXP} XP</span>}
          </div>
        )}
      </div>

      {missions.length === 0 ? (
        <p className="text-sm text-white/40 text-center py-4">No missions available</p>
      ) : (
        <div className="space-y-5">
          {sections.map((section) => {
            const sectionMissions = missions.filter(m => section.types.includes(m.type));
            if (sectionMissions.length === 0) return null;
            const SectionIcon = section.icon;

            return (
              <div key={section.key}>
                <div className="flex items-center gap-2 mb-2.5">
                  <SectionIcon className={`w-3.5 h-3.5 ${section.headerColor}`} />
                  <h3 className={`text-xs font-semibold uppercase tracking-wider ${section.headerColor}`}>
                    {section.title}
                  </h3>
                  {section.key === 'daily' && (
                    <span className="text-[10px] text-white/25 ml-auto">Resets at midnight</span>
                  )}
                  {section.key !== 'daily' && sectionMissions[0] && (
                    <span className="text-[10px] text-white/25 ml-auto">{timeRemaining(sectionMissions[0].endAt)}</span>
                  )}
                </div>
                <div className="space-y-2">
                  {sectionMissions.map((mission) => (
                    <MissionCard key={mission.id} mission={mission} onClaim={claimReward} claimingId={claimingId} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
