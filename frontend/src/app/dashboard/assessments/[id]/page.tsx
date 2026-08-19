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
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
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
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={14} /> Back to Assessments
        </Link>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div
            className={`p-6 text-white text-center ${
              passed
                ? "bg-gradient-to-r from-[#229C62] to-[#229C62]"
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
              <p className="text-4xl font-bold text-slate-900">{result.percentage}%</p>
              <p className="text-sm text-slate-500 mt-1">
                {result.score} / {result.maxScore} correct
              </p>
            </div>

            {Object.keys(result.categoryScores).length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Category Breakdown</h2>
                <div className="space-y-2">
                  {Object.entries(result.categoryScores).map(([cat, scores]) => {
                    const pct = Math.round((scores.correct / scores.total) * 100);
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="text-xs text-slate-600 w-28 truncate">{cat}</span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 80 ? "bg-[#229C62]" : pct >= 50 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-10 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {result.recommendations.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Recommended Courses</h2>
                <div className="space-y-2">
                  {result.recommendations.map((rec) => (
                    <Link
                      key={rec.courseId}
                      href={`/dashboard/courses/${rec.courseId}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <BookOpen size={16} className="text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{rec.title}</p>
                        <p className="text-[11px] text-slate-500">{rec.reason}</p>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setCurrentQ(0);
                  setShowReview(false);
                }}
                className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Retake
              </button>
              <button
                onClick={() => setShowReview(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
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
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={14} /> Back to Assessments
        </Link>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h1 className="text-lg font-bold text-slate-900 mb-1">{assessment.title} — Review</h1>
          <p className="text-xs text-slate-500 mb-5">Review your answers</p>

          <div className="space-y-6">
            {assessment.questions.map((q, i) => {
              const userAns = answers[q.id];
              const isCorrect = userAns === q.correctAnswer;
              return (
                <div key={q.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-3">
                    {isCorrect ? (
                      <CheckCircle2 size={16} className="text-[#229C62] mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-900">
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
                      let style = "bg-slate-50 text-slate-600 border-slate-200";
                      if (isCorrectOpt) style = "bg-[#E9F8EE] text-[#0F203A] border-[#229C62]/20";
                      else if (isUser && !isCorrect) style = "bg-red-50 text-red-700 border-red-200";

                      return (
                        <div key={opt.key} className={`text-xs p-2 rounded border ${style}`}>
                          <span className="font-medium mr-1">{opt.key}.</span> {opt.text}
                          {isCorrectOpt && <CheckCircle2 size={12} className="inline ml-1 text-[#229C62]" />}
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
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link
        href="/dashboard/assessments"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={14} /> Back to Assessments
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-sm font-semibold text-slate-900">{assessment.title}</h1>
          <span className="text-[11px] text-slate-500">
            {currentQ + 1} / {assessment.questions.length}
          </span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-5">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="mb-4">
          <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{q.category}</span>
        </div>

        <p className="text-sm font-medium text-slate-900 mb-4">{q.text}</p>

        <div className="space-y-2 mb-6">
          {q.options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleAnswer(q.id, opt.key)}
              className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                answers[q.id] === opt.key
                  ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="font-medium mr-2">{opt.key}.</span>
              {opt.text}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQ((prev) => Math.max(0, prev - 1))}
            disabled={currentQ === 0}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={14} /> Previous
          </button>

          {currentQ < assessment.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ((prev) => prev + 1)}
              className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1 text-xs bg-[#229C62] hover:bg-[#0F203A] text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {submitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-[10px] text-slate-400">{answered} of {assessment.questions.length} answered</p>
        </div>
      </div>
    </div>
  );
}
