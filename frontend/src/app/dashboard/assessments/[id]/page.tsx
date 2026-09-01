"use client";

import { useEffect, useState, use } from "react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import Link from "next/link";
import {
  ClipboardCheck,
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  BookOpen,
  AlertTriangle,
  Trophy,
  ShieldCheck,
  Clock3,
  FileCheck,
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  category: string;
}

interface AssessmentDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: Question[];
}

interface SubmitResult {
  score: number;
  maxScore: number;
  percentage: number;
  categoryScores: Record<string, { correct: number; total: number }>;
  recommendations: Array<{ courseId: string; title: string; reason: string }>;
}

export default function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<AssessmentDetail>(`/assessments/${id}`);
        setAssessment(data);
      } catch {
        toast.error("Failed to load assessment");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const goToQuestion = (index: number) => {
    setCurrentQ(Math.max(0, Math.min(index, (assessment?.questions.length || 1) - 1)));
  };

  const handleSubmit = async () => {
    if (!assessment) return;
    const unanswered = assessment.questions.filter((q) => !answers[q.id]).length;
    if (unanswered > 0) {
      toast.error(`You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchApi<SubmitResult>(`/assessments/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
      setResult(res);
      toast.success(`Score: ${res.percentage}%`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0f172a] p-12 text-center">
        <ClipboardCheck size={32} className="text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Assessment not found</p>
        <Link href="/dashboard/assessments" className="text-xs text-blue-600 hover:text-blue-700 mt-3 inline-block">
          Back to Assessments
        </Link>
      </div>
    );
  }

  if (result) {
    const passed = result.percentage >= 70;
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Link
          href="/dashboard/assessments"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200"
        >
          <ArrowLeft size={14} /> Back to Assessments
        </Link>

        <div className="rounded-xl border border-white/10 bg-[#0f172a] overflow-hidden">
          <div
            className={`p-6 text-white text-center ${
              passed
                ? "bg-gradient-to-r from-[#7AD62A] to-[#7AD62A]"
                : "bg-gradient-to-r from-amber-500 to-amber-600"
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 mx-auto mb-3 flex items-center justify-center">
              {passed ? <Trophy size={32} /> : <AlertTriangle size={32} />}
            </div>
            <h1 className="text-2xl font-bold">
              {passed ? "Great Job!" : "Keep Learning!"}
            </h1>
            <p className="text-sm mt-1 opacity-90">
              {passed
                ? "You passed the assessment. Well done!"
                : "You didn't pass this time. Review the topics and try again."}
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div className="text-center">
              <p className="text-4xl font-bold text-white">{result.percentage}%</p>
              <p className="text-sm text-slate-400 mt-1">
                {result.score} / {result.maxScore} correct
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  title: "Outcome",
                  text: passed ? "Ready to progress into stronger training or exams." : "More guided training is recommended before higher-stakes evaluation.",
                  icon: FileCheck,
                },
                {
                  title: "Interpretation",
                  text: "Treat this result as a placement signal, not your final professional ceiling.",
                  icon: ShieldCheck,
                },
                {
                  title: "Next move",
                  text: result.recommendations.length > 0 ? "Follow the recommended learning path below." : "Return to training and strengthen weak categories.",
                  icon: BookOpen,
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <item.icon size={16} className="text-[#7AD62A] mb-2" />
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            {Object.keys(result.categoryScores).length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-white mb-3">Competency Breakdown</h2>
                <div className="space-y-2">
                  {Object.entries(result.categoryScores).map(([cat, scores]) => {
                    const pct = Math.round((scores.correct / scores.total) * 100);
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="text-xs text-slate-300 w-28 truncate">{cat}</span>
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 80 ? "bg-[#7AD62A]" : pct >= 50 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-300 w-10 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {result.recommendations.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-white mb-3">Recommended Courses</h2>
                <div className="space-y-2">
                  {result.recommendations.map((rec) => (
                    <Link
                      key={rec.courseId}
                      href={`/dashboard/courses/${rec.courseId}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-[#7AD62A]/30 hover:bg-[#7AD62A]/5 transition-all"
                    >
                      <BookOpen size={16} className="text-[#7AD62A] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{rec.title}</p>
                        <p className="text-[11px] text-slate-500">{rec.reason}</p>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setCurrentQ(0);
                  setShowReview(false);
                }}
                className="flex-1 border border-white/10 text-slate-700 hover:bg-white/5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Retake
              </button>
              <button
                onClick={() => setShowReview(true)}
                className="flex-1 bg-[#0F203A] hover:bg-[#17345f] text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Review Answers
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showReview) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Link
          href="/dashboard/assessments"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200"
        >
          <ArrowLeft size={14} /> Back to Assessments
        </Link>

        <div className="rounded-xl border border-white/10 bg-[#0f172a] p-5">
          <h1 className="text-lg font-bold text-white mb-1">{assessment.title} — Review</h1>
          <p className="text-xs text-slate-500 mb-5">Review your answers and compare them against the expected response</p>

          <div className="space-y-6">
            {assessment.questions.map((q, i) => {
              const userAns = answers[q.id];
              const isCorrect = userAns === q.correctAnswer;
              return (
                <div key={q.id} className="border border-white/10 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-3">
                    {isCorrect ? (
                      <CheckCircle2 size={16} className="text-[#7AD62A] mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">
                        <span className="text-slate-400 mr-1">{i + 1}.</span>
                        {q.text}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{q.category}</p>
                    </div>
                  </div>
                  <div className="ml-6 space-y-1.5">
                    {q.options.map((opt) => {
                      const isUser = userAns === opt.key;
                      const isCorrectOpt = opt.key === q.correctAnswer;
                      let style = "bg-white/5 text-slate-300 border-white/10";
                      if (isCorrectOpt) style = "bg-[#7AD62A]/10 text-[#7AD62A] border-[#7AD62A]/20";
                      else if (isUser && !isCorrect) style = "bg-red-500/10 text-red-300 border-red-500/20";

                      return (
                        <div key={opt.key} className={`text-xs p-2 rounded border ${style}`}>
                          <span className="font-medium mr-1">{opt.key}.</span> {opt.text}
                          {isCorrectOpt && <CheckCircle2 size={12} className="inline ml-1 text-[#7AD62A]" />}
                          {isUser && !isCorrect && <XCircle size={12} className="inline ml-1 text-red-500" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setShowReview(false)}
            className="mt-6 w-full bg-[#0F203A] hover:bg-[#17345f] text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  const q = assessment.questions[currentQ];
  const progress = Math.round(((currentQ + 1) / assessment.questions.length) * 100);
  const answered = Object.keys(answers).length;
  const unanswered = assessment.questions.length - answered;
  const currentAnswer = answers[q.id];
  const coverageLabel = unanswered === 0 ? "Ready to submit" : `${unanswered} unanswered`;
  const assessmentStage = answered === 0
    ? "Attempt not started"
    : unanswered === 0
      ? "Submission ready"
      : "Attempt in progress";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link
        href="/dashboard/assessments"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200"
      >
        <ArrowLeft size={14} /> Back to Assessments
      </Link>

      <div className="rounded-xl border border-white/10 bg-[#0f172a] p-5">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4 mb-5">
          <div>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-sm font-semibold text-white">{assessment.title}</h1>
              <span className="text-[11px] text-slate-500">
                {currentQ + 1} / {assessment.questions.length}
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-[#7AD62A] rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] text-slate-400">{answered} of {assessment.questions.length} answered</p>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-300">
                {assessmentStage}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Candidate Guidance</p>
            <div className="space-y-2 mt-3">
              {[
                { icon: ShieldCheck, text: "Answer independently and avoid guess-heavy rushing." },
                { icon: Clock3, text: "Focus on consistency across categories, not just quick completion." },
                { icon: FileCheck, text: "This result is used to recommend the right next training path." },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2">
                  <item.icon size={14} className="text-[#7AD62A] shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[0.78fr_0.22fr] gap-5">
          <div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 mb-5">
              {[
                { title: "Coverage", text: coverageLabel, icon: FileCheck },
                { title: "Current category", text: q.category, icon: ClipboardCheck },
                { title: "Recording intent", text: "Used for pathway placement and readiness", icon: ShieldCheck },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <item.icon size={15} className="text-[#7AD62A] mb-2" />
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{item.title}</p>
                  <p className="text-sm font-semibold text-white mt-1">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <span className="text-[10px] text-[#7AD62A] bg-[#7AD62A]/10 px-2 py-0.5 rounded-full">{q.category}</span>
            </div>

            <p className="text-sm font-medium text-white mb-4">{q.text}</p>

            <div className="space-y-2 mb-6">
              {q.options.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleAnswer(q.id, opt.key)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                    answers[q.id] === opt.key
                      ? "border-[#7AD62A]/30 bg-[#7AD62A]/10 text-[#7AD62A] font-medium"
                      : "border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <span className="font-medium mr-2">{opt.key}.</span>
                  {opt.text}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-6">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Submission standard</p>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Complete every question, review your selections, and submit only when the attempt reflects your actual current level.
              </p>
              {!currentAnswer && (
                <p className="text-xs text-amber-300 mt-2">
                  Select an answer for this question before moving on.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => setCurrentQ((prev) => Math.max(0, prev - 1))}
                disabled={currentQ === 0}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={14} /> Previous
              </button>

              {currentQ < assessment.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQ((prev) => prev + 1)}
                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-[#0F203A] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#17345f] sm:w-auto"
                >
                  Next <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || unanswered > 0}
                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-[#7AD62A] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#0F203A] disabled:opacity-50 sm:w-auto"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {submitting ? "Submitting..." : unanswered > 0 ? "Complete all answers" : "Submit attempt"}
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 h-fit">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Question Map</p>
            <p className="text-xs text-slate-400 mt-2">Review coverage before you commit this result.</p>
            <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {assessment.questions.map((question, index) => {
                const isActive = index === currentQ;
                const isAnswered = Boolean(answers[question.id]);
                return (
                  <button
                    key={question.id}
                    onClick={() => goToQuestion(index)}
                    className={`h-10 rounded-lg border text-xs font-semibold transition-colors ${
                      isActive
                        ? "border-[#7AD62A] bg-[#7AD62A]/15 text-[#7AD62A]"
                        : isAnswered
                          ? "border-white/10 bg-white/[0.04] text-slate-200"
                          : "border-white/10 bg-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2 mt-4 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded border border-[#7AD62A] bg-[#7AD62A]/15" />
                Current question
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded border border-white/10 bg-white/[0.04]" />
                Answered
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded border border-white/10 bg-transparent" />
                Unanswered
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
