'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Layers, Star, Loader2, Lock } from 'lucide-react';

interface SkillItem {
  name: string;
  displayName: string;
  xp: number;
  level: number;
}

interface SkillDomain {
  domain: string;
  domainDisplayName: string;
  skills: SkillItem[];
}

const domainIcons: Record<string, string> = {
  SYSTEMS: '🖥️',
  NETWORKING: '🌐',
  DEVOPS: '⚙️',
  DATABASES: '🗃️',
  SECURITY: '🔒',
  QA: '🧪',
};

const domainColors: Record<string, string> = {
  SYSTEMS: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  NETWORKING: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  DEVOPS: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
  DATABASES: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
  SECURITY: 'from-red-500/20 to-red-600/10 border-red-500/30',
  QA: 'from-green-500/20 to-green-600/10 border-green-500/30',
};

export default function SkillProfile({ userId }: { userId?: string }) {
  const [skills, setSkills] = useState<SkillDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(true);

  useEffect(() => {
    fetchSkills();
  }, []);

  async function fetchSkills() {
    try {
      const data = await fetchApi<any>('/challenges/skills');
      setUnlocked(data.unlocked !== false);
      setSkills(data.skills || []);
    } catch {
      setUnlocked(true);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-[#7AD62A]" />
          <h2 className="text-lg font-semibold text-white">Skill Profile</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-white/40" />
          <h2 className="text-lg font-semibold text-white/60">Skill Profile</h2>
        </div>
        <p className="text-sm text-white/40 text-center py-4">
          Complete labs to unlock your skill profile
        </p>
      </div>
    );
  }

  const totalXp = skills.reduce((sum, d) => sum + d.skills.reduce((s, sk) => s + sk.xp, 0), 0);

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#7AD62A]" />
          <h2 className="text-lg font-semibold text-white">Skill Profile</h2>
        </div>
        <span className="text-xs text-white/40">{totalXp} total XP</span>
      </div>

      {skills.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
            <Layers size={20} className="text-white/40" />
          </div>
          <p className="text-sm text-white/60 font-medium">No skills unlocked yet</p>
          <p className="text-xs text-white/40 mt-1">Complete labs to start building your skill profile</p>
        </div>
      ) : (
        <div className="space-y-4">
          {skills.map((domain) => (
            <div
              key={domain.domain}
              className={`bg-gradient-to-br ${domainColors[domain.domain] || 'from-white/10 to-white/5 border-white/20'} border rounded-lg p-4`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{domainIcons[domain.domain] || '📌'}</span>
                <h3 className="text-sm font-semibold text-white">{domain.domainDisplayName}</h3>
              </div>

              <div className="space-y-2">
                {domain.skills.map((skill) => {
                  const skillXpPct = Math.min(100, Math.round((skill.xp % 500) / 5));
                  return (
                    <div key={skill.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/70">{skill.displayName}</span>
                          {skill.level > 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-medium">
                              Lvl {skill.level}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-white/40">{skill.xp} XP</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-white/20 transition-all duration-500"
                          style={{ width: `${skillXpPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
