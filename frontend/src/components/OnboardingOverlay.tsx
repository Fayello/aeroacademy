"use client";

import { useState, useEffect } from "react";
import { Rocket, Microscope, Target, CheckCircle, ChevronRight, X } from "lucide-react";
import Link from "next/link";

const ONBOARDING_KEY = "onboardingComplete";

const steps = [
  {
    icon: Rocket,
    emoji: "\uD83D\uDE80",
    title: "Welcome to XpertClass!",
    description:
      "Your journey into hands-on cybersecurity starts here. We combine structured courses with real, interactive lab environments to make you job-ready.",
    href: null,
    cta: null,
  },
  {
    icon: Microscope,
    emoji: "\uD83D\uDD2C",
    title: "90% Hands-On Labs",
    description:
      "Learn by doing. Each lab spins up a live sandbox where you solve real challenges, capture flags, and build skills that transfer directly to the field.",
    href: null,
    cta: null,
  },
  {
    icon: Target,
    emoji: "\uD83C\uDFAF",
    title: "Daily Missions & XP",
    description:
      "Stay consistent with daily missions that reward XP. Level up to unlock harder labs, new certifications, and climb the leaderboard.",
    href: null,
    cta: null,
  },
  {
    icon: CheckCircle,
    emoji: "\u2705",
    title: "You\u2019re Ready!",
    description: "Everything is set up. Jump into your first beginner lab and start earning XP right away.",
    href: "/dashboard/labs",
    cta: "Start First Lab",
  },
];

interface OnboardingOverlayProps {
  onComplete: () => void;
}

export default function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  const finish = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      // localStorage unavailable
    }
    setClosing(true);
    setTimeout(onComplete, 300);
  };

  const next = () => {
    if (isLast) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-300 ${
        closing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-md bg-[#0F203A] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Close / Skip */}
        <button
          onClick={finish}
          className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white transition-colors"
          aria-label="Skip onboarding"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="p-8 pt-10 text-center">
          {/* Emoji */}
          <div className="text-5xl mb-5 select-none">{current.emoji}</div>

          {/* Icon badge */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-4">
            <Icon size={24} className="text-white" />
          </div>

          <h2 className="text-xl font-bold text-white mb-3">{current.title}</h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">{current.description}</p>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 pb-5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-[#7AD62A]" : "w-2 bg-white/20 hover:bg-white/30"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button
            onClick={finish}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Skip
          </button>

          {current.href && current.cta ? (
            <Link
              href={current.href}
              onClick={finish}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7AD62A] hover:bg-[#1d8a56] text-white text-sm font-semibold transition-colors"
            >
              {current.cta}
              <ChevronRight size={16} />
            </Link>
          ) : (
            <button
              onClick={next}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7AD62A] hover:bg-[#1d8a56] text-white text-sm font-semibold transition-colors"
            >
              {isLast ? "Get Started" : "Next"}
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
