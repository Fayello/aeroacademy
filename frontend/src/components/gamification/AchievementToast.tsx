"use client";

import { useEffect, useState } from "react";
import { Trophy, Star, Sparkles, X } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";

const RARITY_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  COMMON: { bg: "bg-slate-500/10", border: "border-slate-400/30", text: "text-slate-300", glow: "" },
  UNCOMMON: { bg: "bg-emerald-500/10", border: "border-emerald-400/30", text: "text-emerald-400", glow: "shadow-emerald-500/20" },
  RARE: { bg: "bg-blue-500/10", border: "border-blue-400/30", text: "text-blue-400", glow: "shadow-blue-500/20" },
  EPIC: { bg: "bg-violet-500/10", border: "border-violet-400/30", text: "text-violet-400", glow: "shadow-violet-500/20" },
  LEGENDARY: { bg: "bg-amber-500/10", border: "border-amber-400/30", text: "text-amber-400", glow: "shadow-amber-500/30" },
};

export default function AchievementToast() {
  const { lastAchievement } = useDashboard();
  const [visible, setVisible] = useState(false);
  const [achievement, setAchievement] = useState(lastAchievement);

  useEffect(() => {
    if (lastAchievement) {
      setAchievement(lastAchievement);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [lastAchievement]);

  if (!visible || !achievement) return null;

  const rarity = RARITY_STYLES[achievement.category] || RARITY_STYLES.COMMON;
  const iconMap: Record<string, typeof Trophy> = {
    MILESTONE: Star,
    MASTERY: Trophy,
    STREAK: Sparkles,
    CHALLENGE: Trophy,
    SOCIAL: Star,
  };
  const Icon = iconMap[achievement.category] || Trophy;

  return (
    <div className="fixed top-20 right-4 z-[100] animate-slide-in-right">
      <div
        className={`relative flex items-start gap-3 rounded-xl border ${rarity.border} ${rarity.bg} p-4 pr-10 shadow-2xl backdrop-blur-xl max-w-sm ${rarity.glow ? `shadow-lg ${rarity.glow}` : ""}`}
        style={{ background: "rgba(15, 23, 42, 0.95)" }}
      >
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>

        <div className={`w-10 h-10 rounded-xl ${rarity.bg} flex items-center justify-center shrink-0`}>
          <Icon size={20} className={rarity.text} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">Achievement Unlocked</p>
          <p className="text-sm font-bold text-white leading-tight">{achievement.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{achievement.description}</p>
          <p className={`text-xs font-semibold mt-1.5 ${rarity.text}`}>+{achievement.xpReward} XP</p>
        </div>

        <div className="absolute -top-1 -right-1 w-4 h-4">
          <div className="w-full h-full bg-[#7AD62A] rounded-full animate-ping opacity-30" />
          <div className="absolute inset-0 w-full h-full bg-[#7AD62A] rounded-full" />
        </div>
      </div>
    </div>
  );
}
