'use client';

import { useState, useCallback, useEffect, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  Sparkles, Trophy, BookOpen, Plus, RotateCcw, ChevronDown, ChevronUp,
  Search, X, Star, Zap, Award, Info, Lock, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { SKILLS, FUSIONS, CATEGORIES, getFusionRarity, RARITY_TIERS } from './data';
import type { Skill, Fusion, SkillCategory, RarityTier } from './data';
import type * as THREE from 'three';

const Arena3D = dynamic(() => import('./Arena3D'), { ssr: false });

interface DiscoveredFusion extends Fusion {
  discoveredAt: number;
  skillAData: Skill;
  skillBData: Skill;
}

interface JournalEntry {
  fusion: DiscoveredFusion;
  note: string;
}

interface CustomSkill {
  id: string;
  name: string;
  category: SkillCategory;
  color: string;
  icon: string;
  isCustom: true;
}

const POINTS_PER_FUSION: Record<RarityTier, number> = {
  common: 50,
  uncommon: 100,
  rare: 200,
  epic: 400,
  legendary: 800,
};

function getPointsForFusion(fusion: Fusion): number {
  return POINTS_PER_FUSION[getFusionRarity(fusion)];
}

export default function SkillFusionLab() {
  const [arenaSkills, setArenaSkills] = useState<Skill[]>([]);
  const [discovered, setDiscovered] = useState<DiscoveredFusion[]>([]);
  const [activeFilter, setActiveFilter] = useState<SkillCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showJournal, setShowJournal] = useState(false);
  const [showCustomSkill, setShowCustomSkill] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [journalNotes, setJournalNotes] = useState<Record<string, string>>({});
  const [selectedFusion, setSelectedFusion] = useState<DiscoveredFusion | null>(null);
  const [animatingFusion, setAnimatingFusion] = useState<DiscoveredFusion | null>(null);
  const [customSkillName, setCustomSkillName] = useState('');
  const [customSkillCategory, setCustomSkillCategory] = useState<SkillCategory>('tech');
  const [customSkills, setCustomSkills] = useState<CustomSkill[]>([]);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('skill-fusion-discovered');
      if (saved) setDiscovered(JSON.parse(saved));
      const notes = localStorage.getItem('skill-fusion-notes');
      if (notes) setJournalNotes(JSON.parse(notes));
      const customs = localStorage.getItem('skill-fusion-customs');
      if (customs) setCustomSkills(JSON.parse(customs));
    } catch {}
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('skill-fusion-discovered', JSON.stringify(discovered));
  }, [discovered]);
  useEffect(() => {
    localStorage.setItem('skill-fusion-notes', JSON.stringify(journalNotes));
  }, [journalNotes]);
  useEffect(() => {
    localStorage.setItem('skill-fusion-customs', JSON.stringify(customSkills));
  }, [customSkills]);

  const allSkills = useMemo(() => [...SKILLS, ...customSkills], [customSkills]);

  const totalPoints = useMemo(
    () => discovered.reduce((sum, d) => sum + getPointsForFusion(d), 0),
    [discovered],
  );

  const discoveredCount = discovered.length;
  const totalFusions = FUSIONS.length;
  const progressPercent = (discoveredCount / totalFusions) * 100;

  const latestFusion = discovered.length > 0 ? discovered[discovered.length - 1] : null;

  const categoryStats = useMemo(() => {
    const stats: Record<SkillCategory, { discovered: number; total: number }> = {
      tech: { discovered: 0, total: 0 },
      science: { discovered: 0, total: 0 },
      finance: { discovered: 0, total: 0 },
      creative: { discovered: 0, total: 0 },
      business: { discovered: 0, total: 0 },
    };
    for (const f of FUSIONS) {
      const rarity = getFusionRarity(f);
      stats[f.category].total += POINTS_PER_FUSION[rarity];
    }
    for (const d of discovered) {
      stats[d.category].discovered += getPointsForFusion(d);
    }
    return stats;
  }, [discovered]);

  const filteredSkills = useMemo(() => {
    let skills = allSkills;
    if (activeFilter !== 'all') {
      skills = skills.filter((s) => s.category === activeFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      skills = skills.filter((s) => s.name.toLowerCase().includes(q));
    }
    return skills;
  }, [allSkills, activeFilter, searchQuery]);

  const addToArena = useCallback(
    (skill: Skill) => {
      if (arenaSkills.find((s) => s.id === skill.id)) return;
      if (arenaSkills.length >= 2) {
        setArenaSkills([skill]);
      } else {
        setArenaSkills((prev) => [...prev, skill]);
      }
    },
    [arenaSkills],
  );

  const removeFromArena = useCallback((skillId: string) => {
    setArenaSkills((prev) => prev.filter((s) => s.id !== skillId));
  }, []);

  const handleArenaSelect = useCallback(
    (skillId: string) => {
      const inArena = arenaSkills.some((s) => s.id === skillId);
      if (inArena) {
        removeFromArena(skillId);
      } else {
        addToArena(allSkills.find((s) => s.id === skillId)!);
      }
    },
    [arenaSkills, allSkills, addToArena, removeFromArena],
  );

  const handleSkillMove = useCallback((_skillId: string, _position: any) => {}, []);

  const tryFusion = useCallback(() => {
    if (arenaSkills.length !== 2) return;
    const [a, b] = arenaSkills;
    const fusion = FUSIONS.find(
      (f) =>
        (f.skillA === a.id && f.skillB === b.id) ||
        (f.skillA === b.id && f.skillB === a.id),
    );
    if (!fusion) return;
    if (discovered.find((d) => d.name === fusion.name)) {
      setSelectedFusion({
        ...fusion,
        discoveredAt: Date.now(),
        skillAData: a,
        skillBData: b,
      });
      return;
    }
    const newDiscovered: DiscoveredFusion = {
      ...fusion,
      discoveredAt: Date.now(),
      skillAData: a,
      skillBData: b,
    };
    setAnimatingFusion(newDiscovered);
    setTimeout(() => {
      setDiscovered((prev) => [...prev, newDiscovered]);
      setAnimatingFusion(null);
      setSelectedFusion(newDiscovered);
      setArenaSkills([]);
    }, 1500);
  }, [arenaSkills, discovered]);

  const addCustomSkill = useCallback(() => {
    if (!customSkillName.trim()) return;
    const newSkill: CustomSkill = {
      id: `custom_${Date.now()}`,
      name: customSkillName.trim(),
      category: customSkillCategory,
      color: CATEGORIES[customSkillCategory].color,
      icon: '✨',
      isCustom: true,
    };
    setCustomSkills((prev) => [...prev, newSkill]);
    setCustomSkillName('');
    setShowCustomSkill(false);
  }, [customSkillName, customSkillCategory]);

  const handleReset = useCallback(() => {
    setDiscovered([]);
    setJournalNotes({});
    setCustomSkills([]);
    setArenaSkills([]);
    setSelectedFusion(null);
    localStorage.removeItem('skill-fusion-discovered');
    localStorage.removeItem('skill-fusion-notes');
    localStorage.removeItem('skill-fusion-customs');
  }, []);

  const mostRecentRarity = latestFusion ? RARITY_TIERS[getFusionRarity(latestFusion)] : null;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Header */}
      <div className="text-center pt-8 pb-6 px-4">
        <div className="inline-flex items-center gap-2 bg-[#7AD62A]/10 border border-[#7AD62A]/30 rounded-full px-4 py-1.5 mb-4">
          <Sparkles className="w-4 h-4 text-[#7AD62A]" />
          <span className="text-sm font-medium text-[#7AD62A]">Skill Fusion Lab</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          Discover{' '}
          <span className="text-[#7AD62A]">{totalFusions}</span>{' '}
          real specializations
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
          Combine two skills to discover a real, existing career field. Each fusion explains
          what the field is, what professionals do, and why it matters. Build your own
          learning map.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <div className="flex flex-wrap items-center gap-3 justify-center">
          {/* Points */}
          <div className="flex items-center gap-2 bg-[#0f172a] border border-white/10 rounded-xl px-4 py-2">
            <Trophy className="w-4 h-4 text-[#7AD62A]" />
            <span className="text-sm font-bold text-[#7AD62A]">{totalPoints.toLocaleString()}</span>
            <span className="text-xs text-gray-500">pts</span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 bg-[#0f172a] border border-white/10 rounded-xl px-4 py-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white">{discoveredCount}</span>
            <span className="text-xs text-gray-500">/ {totalFusions}</span>
            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden ml-1">
              <div
                className="h-full bg-[#7AD62A] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Latest fusion badge */}
          {latestFusion && mostRecentRarity && (
            <div
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 border"
              style={{
                backgroundColor: mostRecentRarity.color + '15',
                borderColor: mostRecentRarity.color + '40',
              }}
            >
              <Star className="w-3.5 h-3.5" style={{ color: mostRecentRarity.color }} />
              <span className="text-xs font-bold" style={{ color: mostRecentRarity.color }}>
                {mostRecentRarity.label}
              </span>
              <span className="text-xs text-gray-400">{latestFusion.name}</span>
            </div>
          )}

          {/* Journal */}
          <button
            onClick={() => setShowJournal(!showJournal)}
            className="flex items-center gap-1.5 bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Journal
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* Custom Skill */}
          <button
            onClick={() => setShowCustomSkill(true)}
            className="flex items-center gap-1.5 bg-[#7AD62A]/10 border border-[#7AD62A]/30 rounded-xl px-3 py-2 text-sm text-[#7AD62A] hover:bg-[#7AD62A]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Custom Skill
          </button>

          {/* Admin */}
          <div className="relative">
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className="flex items-center gap-1.5 bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Admin
              <ChevronDown className="w-3 h-3" />
            </button>
            {showAdmin && (
              <div className="absolute right-0 top-full mt-2 bg-[#0f172a] border border-white/10 rounded-xl p-3 shadow-xl z-50 w-48">
                <div className="text-xs text-gray-500 mb-2">Admin Panel</div>
                <button
                  onClick={handleReset}
                  className="w-full text-left text-sm text-red-400 hover:text-red-300 px-2 py-1.5 rounded-lg hover:bg-red-500/10 flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Progress
                </button>
                <div className="text-[10px] text-gray-600 mt-2 px-2">
                  {discovered.length} fusions discovered
                </div>
              </div>
            )}
          </div>

          {/* Reset icon */}
          <button
            onClick={handleReset}
            className="p-2 text-gray-600 hover:text-gray-400 transition-colors"
            title="Reset progress"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Progress */}
      <div className="max-w-5xl mx-auto px-4 mb-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {(Object.keys(CATEGORIES) as SkillCategory[]).map((cat) => {
            const stats = categoryStats[cat];
            const pct = stats.total > 0 ? (stats.discovered / stats.total) * 100 : 0;
            return (
              <div
                key={cat}
                className="flex items-center gap-2 bg-[#0f172a] border border-white/10 rounded-lg px-3 py-1.5"
              >
                <span className="text-xs font-medium text-gray-400">{CATEGORIES[cat].label}</span>
                <span className="text-xs font-bold" style={{ color: CATEGORIES[cat].color }}>
                  {stats.discovered}
                </span>
                <span className="text-xs text-gray-600">/ {stats.total}</span>
                <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: CATEGORIES[cat].color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skill Filter Tabs */}
      <div className="max-w-5xl mx-auto px-4 mb-3">
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-[#7AD62A] text-[#0a0f1a]'
                : 'bg-[#0f172a] text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            All ({allSkills.length})
          </button>
          {(Object.keys(CATEGORIES) as SkillCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === cat
                  ? 'text-[#0a0f1a]'
                  : 'bg-[#0f172a] text-gray-400 hover:text-white border border-white/10'
              }`}
              style={
                activeFilter === cat
                  ? { backgroundColor: CATEGORIES[cat].color }
                  : undefined
              }
            >
              {CATEGORIES[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Skill Tags */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <div className="flex gap-2 flex-wrap justify-center">
          {filteredSkills.map((skill) => {
            const inArena = arenaSkills.some((s) => s.id === skill.id);
            return (
              <button
                key={skill.id}
                onClick={() => (inArena ? removeFromArena(skill.id) : addToArena(skill))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  inArena
                    ? 'ring-2 ring-white/30 scale-105'
                    : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: skill.color + (inArena ? '40' : '20'),
                  borderColor: skill.color + (inArena ? '80' : '40'),
                  color: skill.color,
                }}
              >
                {inArena && <CheckCircle2 className="w-3.5 h-3.5" />}
                {!inArena && <Plus className="w-3.5 h-3.5" />}
                {skill.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Arena */}
      <div className="max-w-5xl mx-auto px-4 mb-8">
        <div className="bg-[#0f172a] border border-white/10 rounded-2xl min-h-[350px] lg:min-h-[450px] relative overflow-hidden">
          {/* 3D Arena */}
          {arenaSkills.length > 0 && !animatingFusion && (
            <div className="absolute inset-0 z-10">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-600 text-sm">Loading 3D arena...</div>
                </div>
              }>
                <Arena3D
                  arenaSkills={arenaSkills}
                  onSkillMove={handleSkillMove}
                  onSelect={(id) => removeFromArena(id)}
                  selectedId={null}
                  isFusing={false}
                />
              </Suspense>
            </div>
          )}

          {/* Empty state */}
          {arenaSkills.length === 0 && !animatingFusion && (
            <div className="flex flex-col items-center justify-center h-[350px] lg:h-[450px] text-center relative z-10">
              <Plus className="w-8 h-8 text-gray-700 mb-2" />
              <p className="text-gray-500 text-sm">Click any skill above to add it to the arena</p>
              <p className="text-gray-600 text-xs mt-1">Then drag two together to discover a real specialization</p>
            </div>
          )}

          {/* Fusion animation overlay */}
          {animatingFusion && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0a0f1a]/80 backdrop-blur-sm">
              <div className="text-center animate-pulse">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 animate-bounce"
                    style={{
                      backgroundColor: animatingFusion.skillAData.color + '30',
                      borderColor: animatingFusion.skillAData.color,
                    }}
                  >
                    {animatingFusion.skillAData.icon}
                  </div>
                  <div className="text-3xl text-[#7AD62A] font-bold">+</div>
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 animate-bounce"
                    style={{
                      backgroundColor: animatingFusion.skillBData.color + '30',
                      borderColor: animatingFusion.skillBData.color,
                    }}
                  >
                    {animatingFusion.skillBData.icon}
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-2">FUSING...</div>
                <div
                  className="text-lg font-bold"
                  style={{ color: RARITY_TIERS[getFusionRarity(animatingFusion)].color }}
                >
                  {animatingFusion.name}
                </div>
              </div>
            </div>
          )}

          {/* Fusion button */}
          {arenaSkills.length === 2 && !animatingFusion && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={tryFusion}
                className="flex items-center gap-2 bg-[#7AD62A] text-[#0a0f1a] px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#8ce63a] transition-colors shadow-lg shadow-[#7AD62A]/20"
              >
                <Zap className="w-4 h-4" />
                Fuse Skills
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selected Fusion Detail */}
      {selectedFusion && !animatingFusion && (
        <div className="max-w-5xl mx-auto px-4 mb-8">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 relative">
            <button
              onClick={() => setSelectedFusion(null)}
              className="absolute top-4 right-4 text-gray-600 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="px-3 py-1 rounded-full text-xs font-bold border"
                style={{
                  backgroundColor: RARITY_TIERS[getFusionRarity(selectedFusion)].color + '20',
                  borderColor: RARITY_TIERS[getFusionRarity(selectedFusion)].color + '50',
                  color: RARITY_TIERS[getFusionRarity(selectedFusion)].color,
                }}
              >
                {RARITY_TIERS[getFusionRarity(selectedFusion)].label}
              </div>
              <h3 className="text-xl font-bold text-white">{selectedFusion.name}</h3>
              <div className="flex items-center gap-1 text-[#7AD62A] text-sm">
                <Trophy className="w-3.5 h-3.5" />
                {getPointsForFusion(selectedFusion)} pts
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-4">{selectedFusion.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-[#0a0f1a] rounded-xl p-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">What Professionals Do</h4>
                <p className="text-sm text-gray-300">{selectedFusion.whatTheyDo}</p>
              </div>
              <div className="bg-[#0a0f1a] rounded-xl p-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Why It Matters</h4>
                <p className="text-sm text-gray-300">{selectedFusion.whyItMatters}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span style={{ color: selectedFusion.skillAData.color }}>
                {selectedFusion.skillAData.icon} {selectedFusion.skillAData.name}
              </span>
              <span>+</span>
              <span style={{ color: selectedFusion.skillBData.color }}>
                {selectedFusion.skillBData.icon} {selectedFusion.skillBData.name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Journal Drawer */}
      {showJournal && (
        <div className="max-w-5xl mx-auto px-4 mb-8">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#7AD62A]" />
                Discovery Journal
              </h3>
              <button
                onClick={() => setShowJournal(false)}
                className="text-gray-600 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {discovered.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No discoveries yet. Combine two skills in the arena to start your journal.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {[...discovered].reverse().map((d, i) => (
                  <div
                    key={`${d.name}-${i}`}
                    className="bg-[#0a0f1a] rounded-xl p-4 border border-white/5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{
                          backgroundColor: RARITY_TIERS[getFusionRarity(d)].color + '20',
                          color: RARITY_TIERS[getFusionRarity(d)].color,
                        }}
                      >
                        {RARITY_TIERS[getFusionRarity(d)].label}
                      </div>
                      <span className="text-sm font-bold text-white">{d.name}</span>
                      <span className="text-[10px] text-gray-600 ml-auto">
                        {new Date(d.discoveredAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{d.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-600">
                      <span style={{ color: d.skillAData.color }}>
                        {d.skillAData.icon} {d.skillAData.name}
                      </span>
                      <span>+</span>
                      <span style={{ color: d.skillBData.color }}>
                        {d.skillBData.icon} {d.skillBData.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Skill Modal */}
      {showCustomSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Create Custom Skill</h3>
              <button
                onClick={() => setShowCustomSkill(false)}
                className="text-gray-600 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Skill Name</label>
                <input
                  type="text"
                  value={customSkillName}
                  onChange={(e) => setCustomSkillName(e.target.value)}
                  placeholder="e.g. Robotics, Blockchain, FinTech..."
                  className="w-full bg-[#0a0f1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7AD62A]/50"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Category</label>
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(CATEGORIES) as SkillCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCustomSkillCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        customSkillCategory === cat
                          ? 'text-[#0a0f1a]'
                          : 'bg-[#0a0f1a] text-gray-400 border-white/10'
                      }`}
                      style={
                        customSkillCategory === cat
                          ? { backgroundColor: CATEGORIES[cat].color, borderColor: CATEGORIES[cat].color }
                          : undefined
                      }
                    >
                      {CATEGORIES[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={addCustomSkill}
                disabled={!customSkillName.trim()}
                className="w-full bg-[#7AD62A] text-[#0a0f1a] py-2.5 rounded-xl font-bold text-sm hover:bg-[#8ce63a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Create Skill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fusion grid — discovered specializations */}
      {discovered.length > 0 && !showJournal && (
        <div className="max-w-5xl mx-auto px-4 pb-8">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Discovered Specializations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...discovered].reverse().map((d, i) => {
              const rarity = RARITY_TIERS[getFusionRarity(d)];
              return (
                <button
                  key={`${d.name}-${i}`}
                  onClick={() => setSelectedFusion(d)}
                  className="bg-[#0f172a] border border-white/10 rounded-xl p-4 text-left hover:border-white/20 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{ backgroundColor: rarity.color + '20', color: rarity.color }}
                    >
                      {rarity.label}
                    </div>
                    <span className="text-xs text-gray-600 ml-auto">
                      +{getPointsForFusion(d)} pts
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white group-hover:text-[#7AD62A] transition-colors mb-1">
                    {d.name}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{d.description}</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-600">
                    <span style={{ color: d.skillAData.color }}>
                      {d.skillAData.icon} {d.skillAData.name}
                    </span>
                    <span>+</span>
                    <span style={{ color: d.skillBData.color }}>
                      {d.skillBData.icon} {d.skillBData.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
