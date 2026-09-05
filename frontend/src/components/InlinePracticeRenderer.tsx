"use client";

import { useState, useCallback, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Terminal,
  Flag,
  ListChecks,
  ScrollText,
  Code,
  Send,
  RotateCcw,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import type {
  InlinePracticeProgress,
  InlinePracticeSubmission,
} from "@/types/api";

interface InlinePracticeRendererProps {
  practices: InlinePracticeProgress[];
  onPracticeUpdate?: (practice: InlinePracticeProgress) => void;
  onAllPassed?: () => void;
}

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Terminal; label: string; color: string }
> = {
  COMMAND_ANSWER: {
    icon: Terminal,
    label: "Command Exercise",
    color: "text-[#7AD62A]",
  },
  FLAG_CAPTURE: { icon: Flag, label: "Proof Capture", color: "text-amber-400" },
  CHECKLIST: {
    icon: ListChecks,
    label: "Checklist",
    color: "text-blue-400",
  },
  LOG_ANALYSIS: {
    icon: ScrollText,
    label: "Log Analysis",
    color: "text-purple-400",
  },
  CODE_FIX: { icon: Code, label: "Code Fix", color: "text-cyan-400" },
  SHORT_RESPONSE: {
    icon: ScrollText,
    label: "Short Response",
    color: "text-slate-300",
  },
};

function normalizeDisplayText(value?: string | null) {
  return (value || "").replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
}

export default function InlinePracticeRenderer({
  practices,
  onPracticeUpdate,
  onAllPassed,
}: InlinePracticeRendererProps) {
  const [localPractices, setLocalPractices] =
    useState<InlinePracticeProgress[]>(practices);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<
    Record<string, InlinePracticeSubmission>
  >({});
  const [expandedHints, setExpandedHints] = useState<
    Record<string, boolean>
  >({});
  const [checklistStates, setChecklistStates] = useState<
    Record<string, Record<number, boolean>>
  >({});

  useEffect(() => {
    setLocalPractices(practices);
    setAnswers({});
    setResults({});
    setExpandedHints({});
    setChecklistStates({});
  }, [practices]);

  const allPassed = localPractices.every((p) => p.passed);
  const passedCount = localPractices.filter((p) => p.passed).length;

  const checkAllPassed = useCallback(
    (updated: InlinePracticeProgress[]) => {
      if (updated.every((p) => p.passed)) {
        onAllPassed?.();
      }
    },
    [onAllPassed],
  );

  const handleSubmit = async (
    practice: InlinePracticeProgress,
    overrideAnswer?: string,
  ) => {
    const answer = overrideAnswer ?? answers[practice.id];
    if (!answer?.trim()) {
      toast.error("Enter an answer before submitting.");
      return;
    }

    if (
      practice.maxAttempts > 0 &&
      practice.attemptCount >= practice.maxAttempts &&
      !practice.passed
    ) {
      toast.error("Maximum attempts reached.");
      return;
    }

    setSubmitting((prev) => ({ ...prev, [practice.id]: true }));
    try {
      const result = await fetchApi<InlinePracticeSubmission>(
        `/progress/inline-practice/${practice.id}/submit`,
        {
          method: "POST",
          body: JSON.stringify({ answer: answer.trim() }),
        },
      );

      setResults((prev) => ({ ...prev, [practice.id]: result }));
      setLocalPractices((prev) => {
        let updatedPractice: InlinePracticeProgress | null = null;
        const updated = prev.map((p) =>
          p.id === practice.id
            ? (updatedPractice = {
                ...p,
                passed: p.passed || result.isCorrect,
                attemptCount: p.attemptCount + 1,
                latestSubmission: result,
              })
            : p,
        );
        if (updatedPractice) {
          onPracticeUpdate?.(updatedPractice);
        }
        checkAllPassed(updated);
        return updated;
      });

      if (result.isCorrect) {
        toast.success(
          `Correct! +${result.xpAwarded || 0} XP`,
        );
        setAnswers((prev) => ({ ...prev, [practice.id]: "" }));
      } else {
        toast.error(result.feedback || "Incorrect. Try again.");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Submission failed.",
      );
    } finally {
      setSubmitting((prev) => ({ ...prev, [practice.id]: false }));
    }
  };

  const handleChecklistSubmit = async (practice: InlinePracticeProgress) => {
    const state = checklistStates[practice.id] || {};
    const allChecked = Object.values(state).every(Boolean);
    if (!allChecked) {
      toast.error("Complete all checklist items before submitting.");
      return;
    }
    const checklistAnswer = "CHECKLIST_COMPLETE";
    setAnswers((prev) => ({ ...prev, [practice.id]: checklistAnswer }));
    await handleSubmit(practice, checklistAnswer);
  };

  const toggleChecklistItem = (practiceId: string, index: number) => {
    setChecklistStates((prev) => ({
      ...prev,
      [practiceId]: {
        ...prev[practiceId],
        [index]: !prev[practiceId]?.[index],
      },
    }));
  };

  const resetPractice = (practiceId: string) => {
    setResults((prev) => {
      const next = { ...prev };
      delete next[practiceId];
      return next;
    });
    setAnswers((prev) => ({ ...prev, [practiceId]: "" }));
  };

  if (!practices.length) return null;

  return (
    <div className="mt-12 pt-8 border-t border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">
            Hands-on Practice
          </p>
          <h3 className="text-lg font-semibold text-white mt-2">
            Apply what you just learned
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Progress
            </p>
            <p className="text-sm font-bold text-white">
              {passedCount}/{localPractices.length}
            </p>
          </div>
          {allPassed && (
            <div className="flex items-center gap-1.5 rounded-xl bg-[#7AD62A]/10 border border-[#7AD62A]/20 px-4 py-2">
              <CheckCircle size={16} className="text-[#7AD62A]" />
              <span className="text-sm font-medium text-[#7AD62A]">
                All passed
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {localPractices.map((practice, idx) => {
          const config =
            TYPE_CONFIG[practice.type] || TYPE_CONFIG.COMMAND_ANSWER;
          const Icon = config.icon;
          const result = results[practice.id] || practice.latestSubmission;
          const isPassed = practice.passed;
          const isSubmitting = submitting[practice.id];
          const showHints = expandedHints[practice.id];
          const attemptsLeft =
            practice.maxAttempts > 0
              ? practice.maxAttempts - practice.attemptCount
              : Infinity;
          const maxReached =
            !isPassed &&
            practice.maxAttempts > 0 &&
            practice.attemptCount >= practice.maxAttempts;

          return (
            <div
              key={practice.id}
              className={`rounded-xl border p-6 transition-all ${
                isPassed
                  ? "bg-[#7AD62A]/5 border-[#7AD62A]/20"
                  : "bg-white/[0.03] border-white/10"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isPassed
                        ? "bg-[#7AD62A]/20"
                        : "bg-white/5"
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle size={18} className="text-[#7AD62A]" />
                    ) : (
                      <Icon size={18} className={config.color} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      Exercise {idx + 1} &middot; {config.label}
                      {practice.xpReward > 0 && (
                        <span className="ml-2 text-[#7AD62A]">
                          +{practice.xpReward} XP
                        </span>
                      )}
                    </p>
                    <h4 className="text-white font-medium mt-0.5">
                      {practice.title}
                    </h4>
                  </div>
                </div>
                {practice.maxAttempts > 0 && (
                  <span
                    className={`text-xs whitespace-nowrap ${
                      isPassed
                        ? "text-[#7AD62A]"
                        : maxReached
                          ? "text-red-300"
                          : "text-slate-500"
                    }`}
                  >
                    {isPassed
                      ? "Passed"
                      : maxReached
                        ? "Attempts used"
                        : `${Math.max(0, attemptsLeft)} attempts left`}
                  </span>
                )}
              </div>

              <div className="bg-slate-950/50 rounded-lg p-4 mb-4 border border-white/5">
                <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {normalizeDisplayText(practice.prompt)}
                </p>
                {practice.instructions && (
                  <p className="text-slate-500 text-xs mt-3 border-t border-white/5 pt-3">
                    {normalizeDisplayText(practice.instructions)}
                  </p>
                )}
              </div>

              {practice.type === "CHECKLIST" ? (
                <ChecklistExercise
                  practice={practice}
                  checklistStates={checklistStates}
                  toggleItem={toggleChecklistItem}
                  onSubmit={handleChecklistSubmit}
                  isSubmitting={isSubmitting}
                  isPassed={isPassed}
                />
              ) : (
                <TextInputExercise
                  practice={practice}
                  answers={answers}
                  setAnswers={setAnswers}
                  onSubmit={handleSubmit}
                  onReset={resetPractice}
                  isSubmitting={isSubmitting}
                  isPassed={isPassed}
                  maxReached={maxReached}
                  result={result}
                />
              )}

              {practice.hints.length > 0 && !isPassed && (
                <div className="mt-4">
                  <button
                    onClick={() =>
                      setExpandedHints((prev) => ({
                        ...prev,
                        [practice.id]: !prev[practice.id],
                      }))
                    }
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-amber-400 transition-colors"
                  >
                    <Lightbulb size={14} />
                    {showHints ? "Hide hints" : "Need a hint?"}
                    {showHints ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                  {showHints && (
                    <div className="mt-3 space-y-2">
                      {practice.hints.map((hint, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs text-slate-400 bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2"
                        >
                          <Lightbulb
                            size={12}
                            className="text-amber-400 mt-0.5 shrink-0"
                          />
                          {normalizeDisplayText(hint)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {result && !isPassed && (
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <RotateCcw size={12} />
                  Attempt {result.attemptNumber} &middot;{" "}
                  {result.feedback || "Incorrect"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TextInputExercise({
  practice,
  answers,
  setAnswers,
  onSubmit,
  onReset,
  isSubmitting,
  isPassed,
  maxReached,
  result,
}: {
  practice: InlinePracticeProgress;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSubmit: (p: InlinePracticeProgress) => void;
  onReset: (id: string) => void;
  isSubmitting: boolean;
  isPassed: boolean;
  maxReached: boolean;
  result?: InlinePracticeSubmission;
}) {
  const value = answers[practice.id] || "";

  if (isPassed) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#7AD62A] bg-[#7AD62A]/5 rounded-lg px-4 py-3 border border-[#7AD62A]/10">
        <CheckCircle size={16} />
        <span>Practice passed</span>
        {(result?.feedback || practice.latestSubmission?.feedback) && (
          <span className="text-slate-400 ml-2">
            &middot; {result?.feedback || practice.latestSubmission?.feedback}
          </span>
        )}
      </div>
    );
  }

  if (maxReached) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/5 rounded-lg px-4 py-3 border border-red-500/10">
        <XCircle size={16} />
        <span>Attempts used. Review the lesson before retry is available.</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) =>
            setAnswers((prev) => ({
              ...prev,
              [practice.id]: e.target.value,
            }))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isSubmitting) {
              onSubmit(practice);
            }
          }}
          placeholder={
            practice.type === "FLAG_CAPTURE"
              ? "Enter the flag or captured value..."
              : "Type your answer..."
          }
          disabled={isSubmitting || isPassed || maxReached}
          className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#7AD62A]/50 focus:ring-1 focus:ring-[#7AD62A]/30 transition-all disabled:opacity-50 font-mono"
        />
        <button
          onClick={() => onSubmit(practice)}
          disabled={isSubmitting || isPassed || maxReached || !value.trim()}
          className="btn-primary flex items-center gap-2 disabled:opacity-40"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Send size={16} />
          )}
          Submit
        </button>
      </div>

      {result && !isPassed && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-400 bg-red-500/5 rounded-lg px-4 py-2 border border-red-500/10">
          <XCircle size={16} />
          <span>{result.feedback || "Incorrect answer"}</span>
          {practice.validationMode !== "MANUAL" && (
            <button
              onClick={() => onReset(practice.id)}
              className="ml-auto text-xs text-slate-500 hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ChecklistExercise({
  practice,
  checklistStates,
  toggleItem,
  onSubmit,
  isSubmitting,
  isPassed,
}: {
  practice: InlinePracticeProgress;
  checklistStates: Record<string, Record<number, boolean>>;
  toggleItem: (practiceId: string, index: number) => void;
  onSubmit: (p: InlinePracticeProgress) => void;
  isSubmitting: boolean;
  isPassed: boolean;
}) {
  const items = practice.prompt
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const state = checklistStates[practice.id] || {};
  const allChecked = items.length > 0 && items.every((_, i) => state[i]);

  if (isPassed) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#7AD62A] bg-[#7AD62A]/5 rounded-lg px-4 py-3 border border-[#7AD62A]/10">
        <CheckCircle size={16} />
        <span>All items completed</span>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2 mb-4">
        {items.map((item, i) => (
          <label
            key={i}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              state[i]
                ? "bg-[#7AD62A]/10 border-[#7AD62A]/30"
                : "bg-white/[0.02] border-white/10 hover:border-white/20"
            }`}
          >
            <input
              type="checkbox"
              checked={!!state[i]}
              onChange={() => toggleItem(practice.id, i)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#7AD62A] focus:ring-[#7AD62A]/30"
            />
            <span
              className={`text-sm ${
                state[i] ? "text-[#7AD62A]" : "text-slate-300"
              }`}
            >
              {item}
            </span>
          </label>
        ))}
      </div>
      <button
        onClick={() => onSubmit(practice)}
        disabled={isSubmitting || !allChecked}
        className="btn-primary flex items-center gap-2 disabled:opacity-40"
      >
        {isSubmitting ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <Send size={16} />
        )}
        Confirm completion
      </button>
    </div>
  );
}
