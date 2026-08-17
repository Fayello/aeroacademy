"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle, Loader2, Microscope } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
type ReactPlayerComponent = React.ComponentType<{
  url?: string;
  width?: string | number;
  height?: string | number;
  playing?: boolean;
  controls?: boolean;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
}>;
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as unknown as ReactPlayerComponent;
import toast from "@/lib/toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Modal from "@/components/Modal";
import type { Lesson, QuizQuestion, QuizAnswer, QuizSubmissionResult } from "@/types/api";

export default function LessonPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResult | null>(null);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "warning" | "danger" | "success";
    onConfirm?: () => void;
    confirmText?: string;
  }>({ isOpen: false, title: "", message: "", type: "info" });

  useEffect(() => {
    let cancelled = false;
    async function loadLesson() {
      try {
        const data = await fetchApi(`/courses/lessons/${id}`);
        if (!cancelled) {
          setLesson(data as Lesson);
          fetchApi("/progress/start", {
            method: "POST",
            body: JSON.stringify({ lessonId: id }),
          }).catch(() => {});
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadLesson();
    return () => { cancelled = true; };
  }, [id]);

  const handleMarkComplete = async () => {
    setModalConfig({
      isOpen: true,
      title: "Mark as complete",
      message: "This will record your progress. You can still review the material afterward.",
      type: "success",
      confirmText: "Mark complete",
      onConfirm: async () => {
        setSaving(true);
        try {
          await fetchApi("/progress/complete", {
            method: "POST",
            body: JSON.stringify({ lessonId: id }),
          });
          setCompleted(true);
          toast.success("Lesson completed!");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed to record progress.");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleVideoEnded = () => {
    if (!completed) handleMarkComplete();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }
  if (error) return <div role="alert" className="text-red-600 p-4">{error}</div>;
  if (!lesson) return null;

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 text-white mb-6">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <Link
            href={`/dashboard/courses/${lesson.section?.courseId || ""}`}
            className="inline-flex items-center gap-1 text-sm text-emerald-200 hover:text-white transition-colors mb-4"
          >
            <ChevronLeft size={16} />
            Back to course
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full">{lesson.section?.title}</span>
                <span className="text-xs text-emerald-200">~{Math.max(1, Math.ceil((lesson.content?.split(/\s+/).length || 200) / 200))} min read</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{lesson.title}</h1>
            </div>
            <button
              onClick={handleMarkComplete}
              disabled={saving || completed}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                completed
                  ? "bg-white text-emerald-600"
                  : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
              } disabled:opacity-50`}
            >
              <CheckCircle size={16} />
              {completed ? "Completed" : "Mark as complete"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Video Player */}
          <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative shadow-lg">
            <ReactPlayer
              url={lesson.videoUrl || undefined}
              width="100%"
              height="100%"
              playing={playing}
              controls
              onEnded={handleVideoEnded}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
          </div>

          {/* Lesson Content */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">{lesson.title}</h1>

            <div className="prose prose-slate max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  pre: ({ children }) => <pre className="bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-x-auto">{children}</pre>,
                  code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => {
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline = !match;
                    if (isInline) {
                      return (
                        <code className="bg-slate-100 text-emerald-700 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <div className="my-6 rounded-lg overflow-hidden border border-slate-200">
                        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
                          <span className="text-xs font-medium text-slate-500">{match[1]}</span>
                          <button
                            onClick={() => { navigator.clipboard.writeText(String(children).replace(/\n$/, "")); toast.success("Copied!"); }}
                            className="text-xs text-slate-400 hover:text-emerald-600 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                        <pre className="p-4 overflow-x-auto bg-slate-950">
                          <code className="text-slate-300 font-mono text-sm">{children}</code>
                        </pre>
                      </div>
                    );
                  },
                }}
              >
                {lesson.content || "No content available for this lesson."}
              </ReactMarkdown>
            </div>

            {/* Quiz Section */}
            {lesson.quiz && (
              <div className="mt-12 pt-8 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Knowledge Check</h3>
                <div className="space-y-8">
                  {lesson.quiz.questions.map((question: QuizQuestion, qIdx: number) => (
                    <div key={question.id} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                      <p className="text-sm font-medium text-slate-900 mb-4">
                        <span className="text-slate-400 mr-2">{qIdx + 1}.</span>
                        {question.text}
                      </p>
                      <div className="space-y-2">
                        {question.answers.map((answer: QuizAnswer) => {
                          const isSelected = quizAnswer[question.id] === answer.id;
                          const result = submissionResult?.details?.find((d) => d.questionId === question.id);
                          const wasSelectedAndWrong = isSelected && quizSubmitted && result && !result.isCorrect;
                          const wasSelectedAndCorrect = isSelected && quizSubmitted && result && result.isCorrect;

                          return (
                            <button
                              key={answer.id}
                              onClick={() => !quizSubmitted && setQuizAnswer((prev) => ({ ...prev, [question.id]: answer.id }))}
                              className={`w-full p-3 rounded-lg border text-left text-sm font-medium transition-all flex items-center justify-between ${
                                isSelected && !quizSubmitted
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                  : wasSelectedAndCorrect
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                  : wasSelectedAndWrong
                                  ? "bg-red-50 border-red-300 text-red-800"
                                  : quizSubmitted
                                  ? "bg-white border-slate-200 text-slate-400 cursor-default"
                                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                              }`}
                              disabled={quizSubmitted}
                            >
                              <span>{answer.text}</span>
                              {wasSelectedAndCorrect && <CheckCircle size={16} className="text-emerald-600" />}
                              {wasSelectedAndWrong && <span className="text-red-500 text-xs font-medium">Incorrect</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {!quizSubmitted ? (
                  <button
                    onClick={async () => {
                      if (!lesson.quiz) return;
                      if (Object.keys(quizAnswer).length < (lesson.quiz.questions?.length || 0)) {
                        toast.error("Please answer all questions.");
                        return;
                      }
                      setSaving(true);
                      try {
                        const result = await fetchApi(`/quiz/submit/${lesson.quiz.id}`, {
                          method: "POST",
                          body: JSON.stringify({ answers: quizAnswer }),
                        }) as QuizSubmissionResult;
                        setSubmissionResult(result);
                        setQuizSubmitted(true);
                        setQuizCorrect(result.passed);
                        toast[result.passed ? "success" : "error"](`Score: ${result.score}%`);
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Submission failed.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="btn-primary w-full mt-6"
                  >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : null}
                    Submit answers
                  </button>
                ) : (
                  <div className={`mt-6 p-6 rounded-xl border ${quizCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                    <p className={`font-medium ${quizCorrect ? "text-emerald-800" : "text-red-800"}`}>
                      {quizCorrect ? "Great work! You passed." : "Review the corrections above and try again."}
                    </p>
                    <button
                      onClick={() => { setQuizSubmitted(false); setQuizAnswer({}); setSubmissionResult(null); }}
                      className="btn-secondary mt-4 text-sm"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {lesson.labId && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 border-blue-200 bg-blue-50/50">
              <div className="flex items-center gap-2 text-blue-700 mb-3">
                <Microscope size={18} />
                <h3 className="text-sm font-semibold">Practice Lab</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Apply what you learned in a hands-on sandbox environment.
              </p>
              <button
                onClick={() => router.push(`/dashboard/labs/${lesson.labId}`)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                Open Lab
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Lesson Info</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Section</span>
                <span className="font-medium text-slate-900">{lesson.section?.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className={`font-medium ${completed ? "text-emerald-600" : "text-slate-500"}`}>
                  {completed ? "Completed" : "In progress"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
      />
    </div>
  );
}
