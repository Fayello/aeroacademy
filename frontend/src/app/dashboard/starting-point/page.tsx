"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { getDifficultyStyle, getProgressStatus } from "@/lib/labs";
import { Rocket, Star, CheckCircle, Clock, Lock, ArrowRight, Shield, FileCheck } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import type { Lab } from "@/types/api";

interface StartingLab {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  estimatedMinutes?: number | null;
  order: number;
  completed: boolean;
  inProgress: boolean;
  available: boolean;
}

interface ActiveLabInstance {
  labId?: string | null;
  lab?: { id: string } | null;
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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [allLabs, activeLabs] = await Promise.all([
          fetchApi<Lab[]>("/labs?take=200"),
          fetchApi<ActiveLabInstance[]>("/dashboard/active-labs").catch(() => []),
        ]);
        const activeLabIds = new Set(
          (activeLabs || [])
            .map((item) => item.labId || item.lab?.id)
            .filter((value): value is string => !!value),
        );
        const curatedMatches = CURATED_BEGINNER_LABS
          .map((title) =>
            allLabs.find((lab) => lab.title.toLowerCase().includes(title.toLowerCase())),
          )
          .filter((lab, index, array): lab is Lab => !!lab && array.findIndex((item) => item?.id === lab.id) === index);
        const extraLabs = allLabs
          .filter((lab) => {
            const title = lab.title.toLowerCase();
            return (
              lab.difficulty < 600 &&
              !curatedMatches.some((match) => match.id === lab.id) &&
              !CURATED_BEGINNER_LABS.some((curated) => title.includes(curated.toLowerCase()))
            );
          })
          .sort((a, b) => a.difficulty - b.difficulty)
          .slice(0, Math.max(0, 6 - curatedMatches.length));
        const chosenLabs = [...curatedMatches, ...extraLabs];
        const beginnerLabs: StartingLab[] = [];
        chosenLabs.forEach((lab, idx) => {
          const progressStatus = getProgressStatus(lab.flags);
          beginnerLabs.push({
            id: lab.id,
            title: lab.title,
            description: lab.description,
            difficulty: lab.difficulty,
            estimatedMinutes: null,
            order: idx + 1,
            completed: progressStatus === "COMPLETED",
            inProgress: progressStatus === "IN_PROGRESS" || activeLabIds.has(lab.id),
            available: true,
          });
        });

        if (!cancelled) {
          setLabs(beginnerLabs);
        }
      } catch {
        // Use fallback curated list only for messaging; do not create broken routes.
        const fallback = CURATED_BEGINNER_LABS.map((title, idx) => ({
          id: `fallback-${idx}`,
          title,
          description: "A beginner-friendly lab to get you started.",
          difficulty: 200 + idx * 100,
          estimatedMinutes: null as number | null,
          order: idx + 1,
          completed: false,
          inProgress: false,
          available: false,
        }));
        if (!cancelled) {
          setLabs(fallback);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const completedCount = labs.filter((l) => l.completed).length;
  const pct = labs.length > 0 ? Math.round((completedCount / labs.length) * 100) : 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Your Learning Path" description="Building your skills step by step" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="angular-card bg-[#0f172a] p-6 animate-pulse">
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
        title="Foundation Path"
        description="Follow this guided sequence to build your first practical proof and move toward certification readiness"
        action={
          <Link
            href="/dashboard/labs"
            className="text-sm text-slate-500 hover:text-[#7AD62A] transition-colors"
          >
            Browse all labs →
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="angular-card bg-[#0f172a] border border-white/10 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Guided Certification Start</p>
          <h2 className="text-xl font-bold text-white mt-2">One disciplined path to your first credible outcome</h2>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            This sequence is designed to reduce confusion: start with fundamentals, complete the labs in order, then progress into assessments and certificate-eligible pathways.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            {[
              { title: "Learn", text: "Build the base", icon: Rocket },
              { title: "Practice", text: "Complete guided labs", icon: Shield },
              { title: "Qualify", text: "Prepare for assessments", icon: FileCheck },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <item.icon size={16} className="text-[#7AD62A] mb-2" />
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-slate-400 mt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="angular-card bg-[#0f172a] border border-[#7AD62A]/20 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Outcome</p>
          <h3 className="text-lg font-bold text-white mt-2">What this path unlocks</h3>
          <div className="space-y-3 mt-4">
            {[
              "Confidence with the platform and its hands-on environments",
              "Evidence of practical engagement for future exam readiness",
              "A clean bridge into structured course and certification pathways",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle size={14} className="text-[#7AD62A] shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress card */}
      <div className="angular-card text-white p-6 overflow-hidden relative" style={{ backgroundColor: "#0F203A" }}>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7AD62A]/20 flex items-center justify-center">
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
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#7AD62A]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>

      {/* Lab list */}
      <div className="space-y-3">
        {labs.map((lab, idx) => {
          const diff = getDifficultyInfo(lab.difficulty);
          const isCompleted = lab.completed;
          const isCurrent = lab.inProgress || (!isCompleted && (idx === 0 || labs[idx - 1]?.completed));
          const isLocked = !lab.available || (!isCompleted && !isCurrent);
          const cardClassName = `block angular-card border transition-all duration-300 hover-lift ${
            isLocked
              ? "border-white/10 bg-white/[0.03] opacity-80"
              : isCompleted
              ? "border-[#7AD62A]/20 bg-[#7AD62A]/10/30"
              : "border-white/10 bg-[#0f172a] hover:border-white/10"
          }`;

          const cardContent = (
            <>
              <div className={`h-0.5 w-full ${diff.bar} opacity-40`} />
              <div className="p-5 flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                    isCompleted
                      ? "bg-[#7AD62A] text-white"
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
                  <h3 className={`text-sm font-medium ${isLocked ? "text-slate-400" : "text-white"}`}>
                    {lab.title}
                  </h3>
                  <p className={`text-xs line-clamp-2 ${isLocked ? "text-slate-400" : "text-slate-500"}`}>
                    {lab.description}
                  </p>
                  {!lab.available && (
                    <p className="mt-1 text-[11px] text-amber-300">
                      This starter recommendation is waiting for a live lab match. Browse the catalog to choose the closest available exercise.
                    </p>
                  )}
                </div>

                {lab.available && !isLocked && (
                  <ArrowRight size={16} className="text-slate-300 shrink-0" />
                )}
              </div>
            </>
          );

          return (
            lab.available ? (
              <Link key={lab.id} href={`/dashboard/labs/${lab.id}`} className={cardClassName}>
                {cardContent}
              </Link>
            ) : (
              <div key={lab.id} className={cardClassName}>
                {cardContent}
              </div>
            )
          );
        })}
      </div>

      {/* Encouragement */}
      {labs.length > 0 && completedCount === labs.length && (
        <div className="angular-card bg-[#7AD62A]/10 border border-[#7AD62A]/20 p-6 text-center">
          <Star size={32} className="mx-auto mb-3 text-[#7AD62A] fill-[#7AD62A]" />
          <h3 className="text-lg font-bold text-[#0F203A] mb-1">Path Complete!</h3>
          <p className="text-sm text-slate-600 mb-4">
            You&apos;ve completed the beginner path. Ready for more advanced challenges?
          </p>
          <Link
            href="/dashboard/labs"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#7AD62A] hover:bg-[#1d8a56] text-white text-sm font-medium transition-colors"
          >
            Explore All Labs
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
