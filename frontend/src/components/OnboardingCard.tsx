"use client";

import { useState, useEffect } from "react";
import { GraduationCap, Microscope, Trophy, ChevronRight, X } from "lucide-react";
import Link from "next/link";

const ONBOARDING_KEY = "aeroacademy_onboarded";

const steps = [
  {
    icon: GraduationCap,
    title: "Start with Fundamentals",
    description: "Begin with the basics — complete lessons to earn XP and unlock advanced content.",
    href: "/dashboard/courses",
    cta: "Browse Courses",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Microscope,
    title: "Try a Lab",
    description: "Get hands-on with sandbox environments. Solve capture-the-flag challenges to level up.",
    href: "/dashboard/labs",
    cta: "Explore Labs",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Trophy,
    title: "Climb the Ranks",
    description: "Earn XP to level up. Higher levels unlock new content, labs, and certifications.",
    href: "/dashboard/leaderboard",
    cta: "View Leaderboard",
    color: "bg-amber-100 text-amber-600",
  },
];

export default function OnboardingCard() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      setVisible(!localStorage.getItem(ONBOARDING_KEY));
    } catch {
      setVisible(false);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="card p-6 relative animate-in fade-in slide-in-from-bottom-2 duration-500">
      <button
        onClick={dismiss}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Dismiss onboarding"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${current.color}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{current.title}</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{current.description}</p>
          <div className="flex items-center gap-3 mt-3">
            <Link
              href={current.href}
              onClick={dismiss}
              className="btn-primary text-xs py-1.5 px-3"
            >
              {current.cta}
              <ChevronRight size={14} />
            </Link>
            {!isLast ? (
              <button
                onClick={() => setStep(step + 1)}
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={dismiss}
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                Got it
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-4">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            aria-label={`Go to step ${i + 1}`}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === step ? "w-6 bg-emerald-500" : "w-2 bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
