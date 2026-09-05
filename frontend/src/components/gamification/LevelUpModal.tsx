"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, ArrowUp, X } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { getLevel } from "@/lib/levelGating";

export default function LevelUpModal() {
  const { userMetrics } = useDashboard();
  const [show, setShow] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userMetrics) return;
    const currentLevel = getLevel(userMetrics.xp);
    if (prevLevelRef.current !== null && currentLevel > prevLevelRef.current) {
      setNewLevel(currentLevel);
      setShow(true);
      const timer = setTimeout(() => setShow(false), 6000);
      return () => clearTimeout(timer);
    }
    prevLevelRef.current = currentLevel;
  }, [userMetrics]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShow(false)} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="relative overflow-hidden rounded-2xl border border-[#7AD62A]/30 bg-[#0f172a] p-8 text-center shadow-2xl shadow-[#7AD62A]/10">
          {/* Glow effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#7AD62A]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#7AD62A]/5 rounded-full blur-2xl" />

          <button
            onClick={() => setShow(false)}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10"
          >
            <X size={16} />
          </button>

          <div className="relative z-10">
            {/* Animated icon */}
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-[#7AD62A]/10 border border-[#7AD62A]/20 flex items-center justify-center animate-bounce">
              <div className="relative">
                <ArrowUp size={32} className="text-[#7AD62A]" />
                <Sparkles size={16} className="text-[#7AD62A] absolute -top-1 -right-2 animate-pulse" />
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A] mb-2">Level Up!</p>
            <h2 className="text-3xl font-bold text-white mb-2">Level {newLevel}</h2>
            <p className="text-sm text-slate-400">
              You&apos;re climbing the ranks. Keep building practical skills.
            </p>

            {/* Confetti-like dots */}
            <div className="absolute top-8 left-6 w-2 h-2 rounded-full bg-[#7AD62A] animate-ping" />
            <div className="absolute top-12 right-8 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <div className="absolute bottom-12 left-10 w-1 h-1 rounded-full bg-blue-400 animate-bounce" />
            <div className="absolute bottom-8 right-6 w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" style={{ animationDelay: "0.5s" }} />

            <button
              onClick={() => setShow(false)}
              className="mt-6 w-full rounded-lg bg-[#7AD62A] px-4 py-2.5 text-sm font-semibold text-[#0F203A] hover:bg-[#6bc422] transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
