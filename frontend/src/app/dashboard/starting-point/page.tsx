"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { getDifficultyStyle } from "@/lib/labs";
import { Rocket, Star, CheckCircle, Clock, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";

interface StartingLab {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  estimatedMinutes?: number | null;
  order: number;
  completed: boolean;
  inProgress: boolean;
}

const CURATED_BEGINNER_LABS = [
  "First Steps in Linux",
  "Network Basics Lab",
  "Web Fundamentals",
  "Database Essentials",
  "Command Line Basics",
  "Intro to Cybersecurity",
  "Cloud Computing 101",
];

function getDifficultyInfo(d: number) {
  const s = getDifficultyStyle(d);
  return { label: s.label, color: s.color, bar: s.bar, dot: s.dot, bg: s.dot.replace("bg-", "bg-") + "/10" };
}

export default function StartingPointPage() {
  const [labs, setLabs] = useState<StartingLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const allLabs = await fetchApi("/labs");
        const beginnerLabs: StartingLab[] = [];

        CURATED_BEGINNER_LABS.forEach((title, idx) => {
          const found = allLabs.find(
            (l: { title: string }) => l.title.toLowerCase().includes(title.toLowerCase())
          );
          beginnerLabs.push({
            id: found?.id || `placeholder-${idx}`,
            title: found?.title || title,
            description: found?.description || "A beginner-friendly lab to get you started.",
            difficulty: found?.difficulty || 200 + idx * 100,
            estimatedMinutes: found?.estimatedMinutes || null,
            order: idx + 1,
            completed: false,
            inProgress: false,
          });
        });

        // Also add any low-difficulty labs not in the curated list
        const extraLabs = allLabs
          .filter((l: { difficulty: number; title: string }) =>
            l.difficulty < 600 &&
            !CURATED_BEGINNER_LABS.some((c) => l.title.toLowerCase().includes(c.toLowerCase()))
          )
          .slice(0, 5)
          .map((l: { id: string; title: string; description: string; difficulty: number; estimatedMinutes?: number | null }, idx: number) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            difficulty: l.difficulty,
            estimatedMinutes: l.estimatedMinutes,
            order: CURATED_BEGINNER_LABS.length + idx + 1,
            completed: false,
            inProgress: false,
          }));

        const all = [...beginnerLabs, ...extraLabs];
        setLabs(all);
        setProgress(0);
      } catch {
        // Use fallback curated list
        const fallback = CURATED_BEGINNER_LABS.map((title, idx) => ({
          id: `fallback-${idx}`,
          title,
          description: "A beginner-friendly lab to get you started.",
          difficulty: 200 + idx * 100,
          estimatedMinutes: null as number | null,
          order: idx + 1,
          completed: false,
          inProgress: false,
        }));
        setLabs(fallback);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completedCount = labs.filter((l) => l.completed).length;
  const pct = labs.length > 0 ? Math.round((completedCount / labs.length) * 100) : 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Your Learning Path" description="Building your skills step by step" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="angular-card bg-white p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Your Learning Path"
        description="Follow this guided sequence of beginner labs to build your skills step by step"
        action={
          <Link
            href="/dashboard/labs"
            className="text-sm text-slate-500 hover:text-[#229C62] transition-colors"
          >
            Browse all labs →
          </Link>
        }
      />

      {/* Progress card */}
      <div className="angular-card text-white p-6 overflow-hidden relative" style={{ backgroundColor: "#0F203A" }}>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#229C62]/20 flex items-center justify-center">
                <Rocket size={20} className="text-[#7AD62A]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Your Progress</h2>
                <p className="text-xs text-white/60">{completedCount} of {labs.length} labs completed</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-[#7AD62A]">{pct}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#7AD62A] rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#229C62]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>

      {/* Lab list */}
      <div className="space-y-3">
        {labs.map((lab, idx) => {
          const diff = getDifficultyInfo(lab.difficulty);
          const isCompleted = lab.completed;
          const isCurrent = lab.inProgress || (!isCompleted && (idx === 0 || labs[idx - 1]?.completed));
          const isLocked = !isCompleted && !isCurrent;

          return (
            <Link
              key={lab.id}
              href={`/dashboard/labs/${lab.id}`}
              className={`block angular-card border transition-all duration-300 hover-lift ${
                isLocked
                  ? "border-slate-100 bg-white/50 opacity-60"
                  : isCompleted
                  ? "border-[#229C62]/20 bg-[#E9F8EE]/30"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className={`h-0.5 w-full ${diff.bar} opacity-40`} />
              <div className="p-5 flex items-center gap-4">
                {/* Step number / status */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                    isCompleted
                      ? "bg-[#229C62] text-white"
                      : isCurrent
                      ? "bg-[#0F203A] text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle size={20} />
                  ) : isLocked ? (
                    <Lock size={16} />
                  ) : (
                    lab.order
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-mono tracking-wider ${diff.color}`}>
                      {diff.label}
                    </span>
                    {lab.estimatedMinutes && (
                      <>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={10} />
                          {lab.estimatedMinutes} min
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className={`text-sm font-medium ${isLocked ? "text-slate-400" : "text-slate-900"}`}>
                    {lab.title}
                  </h3>
                  <p className={`text-xs line-clamp-1 ${isLocked ? "text-slate-300" : "text-slate-500"}`}>
                    {lab.description}
                  </p>
                </div>

                {/* Arrow */}
                {!isLocked && (
                  <ArrowRight size={16} className="text-slate-300 shrink-0" />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Encouragement */}
      {labs.length > 0 && completedCount === labs.length && (
        <div className="angular-card bg-[#E9F8EE] border border-[#229C62]/20 p-6 text-center">
          <Star size={32} className="mx-auto mb-3 text-[#229C62] fill-[#229C62]" />
          <h3 className="text-lg font-bold text-[#0F203A] mb-1">Path Complete!</h3>
          <p className="text-sm text-slate-600 mb-4">
            You&apos;ve completed the beginner path. Ready for more advanced challenges?
          </p>
          <Link
            href="/dashboard/labs"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#229C62] hover:bg-[#1d8a56] text-white text-sm font-medium transition-colors"
          >
            Explore All Labs
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
