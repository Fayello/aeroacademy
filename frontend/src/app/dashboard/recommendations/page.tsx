"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import {
  BookOpen,
  Compass,
  FlaskConical,
  Loader2,
  Save,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import {
  getExperienceLabel,
  getFocusLabelFromOnboarding,
  getInterestTokensFromOnboarding,
  readOnboardingSelections,
} from "@/lib/onboarding";
import type { DashboardRecommendations, UserPreference } from "@/types/api";

const DIFFICULTY_OPTIONS = [
  { value: "LOW", label: "Foundation first" },
  { value: "MEDIUM", label: "Balanced progression" },
  { value: "HIGH", label: "More challenging" },
];

export default function RecommendationsPage() {
  const [data, setData] = useState<DashboardRecommendations | null>(null);
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [interestDraft, setInterestDraft] = useState("");
  const [weakSkillDraft, setWeakSkillDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const onboarding = readOnboardingSelections();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [recommendationResult, preferenceResult] = await Promise.all([
          fetchApi<DashboardRecommendations>("/dashboard/recommendations"),
          fetchApi<UserPreference | null>("/dashboard/preferences"),
        ]);
        if (cancelled) return;
        setData(recommendationResult);
        setPreferences(
          preferenceResult || {
            interests: [],
            weakSkills: [],
            preferredDifficulty: "MEDIUM",
            notificationsEnabled: true,
            weeklyDigestEnabled: true,
            displayMode: "SYSTEM",
            onboardingCompleted: false,
            onboardingSelections: {},
          },
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const focusLabel = getFocusLabelFromOnboarding(onboarding);
  const focusTokens = useMemo(() => getInterestTokensFromOnboarding(onboarding).slice(0, 6), [onboarding]);
  const visibleInterests = preferences?.interests || [];
  const visibleWeakSkills = preferences?.weakSkills || [];

  function addDraftValue(type: "interests" | "weakSkills", value: string) {
    const normalized = value.trim();
    if (!normalized) return;
    setPreferences((current) => {
      if (!current) return current;
      const existing = type === "interests" ? current.interests : current.weakSkills;
      if (existing.some((item) => item.toLowerCase() === normalized.toLowerCase())) return current;
      return {
        ...current,
        [type]: [...existing, normalized],
      };
    });
    if (type === "interests") setInterestDraft("");
    else setWeakSkillDraft("");
  }

  function removeValue(type: "interests" | "weakSkills", value: string) {
    setPreferences((current) => {
      if (!current) return current;
      return {
        ...current,
        [type]: current[type].filter((item) => item !== value),
      };
    });
  }

  async function savePreferences() {
    if (!preferences) return;
    setSaving(true);
    try {
      const saved = await fetchApi<UserPreference>("/dashboard/preferences", {
        method: "POST",
        body: JSON.stringify({
          interests: preferences.interests,
          weakSkills: preferences.weakSkills,
          preferredDifficulty: preferences.preferredDifficulty || "MEDIUM",
          notificationsEnabled: preferences.notificationsEnabled,
          weeklyDigestEnabled: preferences.weeklyDigestEnabled,
        }),
      });
      setPreferences((current) =>
        current
          ? {
              ...current,
              interests: saved.interests,
              weakSkills: saved.weakSkills,
              preferredDifficulty: saved.preferredDifficulty,
              notificationsEnabled: saved.notificationsEnabled,
              weeklyDigestEnabled: saved.weeklyDigestEnabled,
            }
          : saved,
      );
      const refreshed = await fetchApi<DashboardRecommendations>("/dashboard/recommendations");
      setData(refreshed);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-[#7AD62A]" />
      </div>
    );
  }

  if (!data || !preferences) return null;

  const sourceLabel = data.source === "ai" ? "AI-guided" : "Adaptive fallback";
  const insightCards = [
    {
      label: "Primary focus",
      value: focusLabel || "General pathway",
      detail: data.insights?.focusAreas?.slice(0, 2).join(" + ") || "Built from onboarding, progress, and current momentum.",
    },
    {
      label: "Difficulty preference",
      value: DIFFICULTY_OPTIONS.find((option) => option.value === preferences.preferredDifficulty)?.label || "Balanced progression",
      detail: "This changes how strongly the journey favors faster wins versus harder material.",
    },
    {
      label: "Current stage",
      value: getExperienceLabel(onboarding) || `Level ${data.insights?.level || 1}`,
      detail: `${data.insights?.streak || 0}-day streak and recent activity also influence the order.`,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[#7AD62A]/10 p-3">
          <Compass size={24} className="text-[#7AD62A]" />
        </div>
        <PageHeader title="Your Journey" description="See why this path is being recommended and refine it when needed" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#193553] p-6">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">{sourceLabel}</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Your next steps are being shaped on purpose</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              {data.insights?.journeySummary || "Your path is built from onboarding, skill gaps, recent activity, and declared interests."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                ...focusTokens,
                ...visibleInterests,
              ]
                .filter((value, index, array) => value && array.indexOf(value) === index)
                .slice(0, 8)
                .map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-200">
                    {item}
                  </span>
                ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#7AD62A]/20 bg-[#0b1627]/80 p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#7AD62A]" />
              <p className="text-sm font-semibold text-white">What is influencing this journey</p>
            </div>
            <div className="mt-4 space-y-3">
              {[
                "Your onboarding selections and declared interests.",
                "Current progress, streak, and recent lessons.",
                "Weak domains and preferred difficulty.",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {insightCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
            <p className="mt-2 text-sm font-semibold text-white">{card.value}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
          <div className="flex items-center gap-2">
            <WandSparkles size={16} className="text-[#7AD62A]" />
            <h2 className="text-sm font-semibold text-white">Refine this journey</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Adjust the signals if the current path is too broad, too easy, or missing a focus area you care about.
          </p>

          <div className="mt-5 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Interests to prioritize</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {visibleInterests.length > 0 ? visibleInterests.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => removeValue("interests", item)}
                    className="rounded-full border border-[#7AD62A]/20 bg-[#7AD62A]/10 px-3 py-1 text-xs text-[#7AD62A]"
                  >
                    {item} ×
                  </button>
                )) : <span className="text-sm text-slate-500">No extra interests added yet.</span>}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={interestDraft}
                  onChange={(event) => setInterestDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addDraftValue("interests", interestDraft);
                    }
                  }}
                  placeholder="Add an interest like DevSecOps"
                  className="input-field flex-1"
                />
                <button type="button" onClick={() => addDraftValue("interests", interestDraft)} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/5">
                  Add
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Areas you want reinforced</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {visibleWeakSkills.length > 0 ? visibleWeakSkills.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => removeValue("weakSkills", item)}
                    className="rounded-full border border-amber-200 bg-amber-500/10 px-3 py-1 text-xs text-amber-300"
                  >
                    {item} ×
                  </button>
                )) : <span className="text-sm text-slate-500">No reinforcement areas added yet.</span>}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={weakSkillDraft}
                  onChange={(event) => setWeakSkillDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addDraftValue("weakSkills", weakSkillDraft);
                    }
                  }}
                  placeholder="Add a weak area like networking"
                  className="input-field flex-1"
                />
                <button type="button" onClick={() => addDraftValue("weakSkills", weakSkillDraft)} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/5">
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Difficulty</label>
              <select
                value={preferences.preferredDifficulty || "MEDIUM"}
                onChange={(event) => setPreferences({ ...preferences, preferredDifficulty: event.target.value })}
                className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-[#7AD62A]/40 focus:outline-none"
              >
                {DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#0f172a]">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => void savePreferences()}
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7AD62A] px-4 py-3 text-sm font-semibold text-[#0F203A] hover:bg-[#6bc422] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save and refresh journey
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <RecommendationSection
            title="Recommended paths"
            icon={BookOpen}
            items={(data.learningPaths || []).map((path) => ({
              id: path.id,
              href: `/dashboard/learning-paths/${path.id}`,
              title: path.title,
              description: path.description,
              meta: path.careerRole || "Career pathway",
            }))}
          />
          <RecommendationSection
            title="Suggested courses"
            icon={BookOpen}
            items={(data.courses || []).map((course) => ({
              id: course.id,
              href: `/dashboard/courses/${course.id}`,
              title: course.title,
              description: course.description,
              meta: "Structured training",
            }))}
          />
          <RecommendationSection
            title="Suggested labs"
            icon={FlaskConical}
            items={(data.labs || []).map((lab) => ({
              id: lab.id,
              href: `/dashboard/labs/${lab.id}`,
              title: lab.title,
              description: lab.description,
              meta: `Difficulty ${lab.difficulty}`,
            }))}
          />
        </div>
      </div>

      {(data.similarUsers || []).length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#7AD62A]" />
            <h2 className="text-sm font-semibold text-white">Learners with similar momentum</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(data.similarUsers || []).map((user) => (
              <div key={user.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">{user.username || user.name || "Learner"}</p>
                <p className="mt-1 text-xs text-slate-400">{user.xp.toLocaleString()} XP</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationSection({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof BookOpen;
  items: Array<{ id: string; href: string; title: string; description: string; meta: string }>;
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-[#7AD62A]" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-[#7AD62A]/20 hover:bg-[#7AD62A]/[0.04]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <span className="text-[11px] uppercase tracking-wide text-[#7AD62A]">{item.meta}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
