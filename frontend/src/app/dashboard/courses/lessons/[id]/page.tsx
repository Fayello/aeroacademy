"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, Microscope, Award, ArrowLeft, ArrowRight } from "lucide-react";
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

interface SectionWithLessons {
  id: string;
  title: string;
  order: number;
  lessons: { id: string; title: string; order: number }[];
}

interface CourseProgress {
  total: number;
  completed: number;
  percentage: number;
}

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
  const [sections, setSections] = useState<SectionWithLessons[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
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

          // Load course sections and progress
          const courseId = (data as any)?.section?.courseId;
          if (courseId) {
            const [sectionsData, progressData] = await Promise.allSettled([
              fetchApi<SectionWithLessons[]>(`/courses/${courseId}/sections`),
              fetchApi<CourseProgress>(`/progress/course/${courseId}`).catch(() => null),
            ]);
            if (!cancelled) {
              if (sectionsData.status === "fulfilled") setSections(sectionsData.value);
              if (progressData.status === "fulfilled" && progressData.value) setCourseProgress(progressData.value);
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load lesson");
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
          setCourseProgress((prev) => prev ? { ...prev, completed: prev.completed + 1, percentage: Math.min(100, ((prev.completed + 1) / prev.total) * 100) } : prev);
          toast.success("Lesson completed! +10 XP earned");
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

  // Find current lesson position and prev/next
  const findLessonNav = () => {
    if (!lesson || !sections.length) return { prev: null, next: null, sectionIndex: 0, lessonIndex: 0, totalSections: 0 };
    let sectionIdx = 0;
    let lessonIdx = 0;
    let flatIdx = 0;
    let currentFlatIdx = 0;
    const allLessons: { id: string; title: string; sectionTitle: string }[] = [];

    for (const section of sections) {
      for (const l of section.lessons) {
        allLessons.push({ id: l.id, title: l.title, sectionTitle: section.title });
        if (l.id === id) {
          currentFlatIdx = flatIdx;
          sectionIdx = sections.indexOf(section);
          lessonIdx = section.lessons.indexOf(l);
        }
        flatIdx++;
      }
    }

    return {
      prev: currentFlatIdx > 0 ? allLessons[currentFlatIdx - 1] : null,
      next: currentFlatIdx < allLessons.length - 1 ? allLessons[currentFlatIdx + 1] : null,
      sectionIndex: sectionIdx,
      lessonIndex: lessonIdx,
      totalSections: sections.length,
      totalLessons: allLessons.length,
      currentLessonNumber: currentFlatIdx + 1,
    };
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

  const nav = findLessonNav();
  const currentSection = sections[nav.sectionIndex];

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F203A] via-[#1a3a5c] to-[#229C62] p-6 sm:p-8 text-white mb-6">
        <div className="absolute inset-0 angular-grid-bg opacity-[0.04] pointer-events-none" />
        <div className="relative z-10">
          <Link
            href={`/dashboard/courses/${lesson.section?.courseId || ""}`}
            className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors mb-4"
          >
            <ChevronLeft size={16} />
            Back to course
          </Link>

          {/* Section counter + Progress bar */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-medium px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-full">
              Section {nav.sectionIndex + 1} / {nav.totalSections || "?"}
            </span>
            <span className="text-xs text-white/50">
              Lesson {nav.currentLessonNumber} of {nav.totalLessons || "?"}
            </span>
            {courseProgress && (
              <div className="flex items-center gap-2 ml-auto">
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7AD62A] rounded-full transition-all duration-500"
                    style={{ width: `${courseProgress.percentage || 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/50">{courseProgress.percentage || 0}%</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-full">{lesson.section?.title}</span>
                <span className="text-xs text-white/60">~{Math.max(1, Math.ceil((lesson.content?.split(/\s+/).length || 200) / 200))} min read</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{lesson.title}</h1>
            </div>
            <button
              onClick={handleMarkComplete}
              disabled={saving || completed}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 ${
                completed
                  ? "bg-[#7AD62A] text-[#0F203A]"
                  : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
              } disabled:opacity-50`}
            >
              <CheckCircle size={16} />
              {completed ? "Completed" : "Mark complete"}
              {!completed && (
                <span className="flex items-center gap-1 text-[#7AD62A] font-bold text-xs">
                  <Award size={12} />
                  +10 XP
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Video Player */}
          {lesson.videoUrl && (
            <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative shadow-lg">
              <ReactPlayer
                url={lesson.videoUrl}
                width="100%"
                height="100%"
                playing={playing}
                controls
                onEnded={handleVideoEnded}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
            </div>
          )}

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
                        <code className="bg-slate-100 text-[#0F203A] px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
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
                            className="text-xs text-slate-400 hover:text-[#229C62] transition-colors"
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
                                  ? "bg-[#E9F8EE] border-[#229C62]/30 text-[#0F203A]"
                                  : wasSelectedAndCorrect
                                  ? "bg-[#E9F8EE] border-[#229C62]/30 text-[#0F203A]"
                                  : wasSelectedAndWrong
                                  ? "bg-red-50 border-red-300 text-red-800"
                                  : quizSubmitted
                                  ? "bg-white border-slate-200 text-slate-400 cursor-default"
                                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                              }`}
                              disabled={quizSubmitted}
                            >
                              <span>{answer.text}</span>
                              {wasSelectedAndCorrect && <CheckCircle size={16} className="text-[#229C62]" />}
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
                  <div className={`mt-6 p-6 rounded-xl border ${quizCorrect ? "bg-[#E9F8EE] border-[#229C62]/20" : "bg-red-50 border-red-200"}`}>
                    <p className={`font-medium ${quizCorrect ? "text-[#0F203A]" : "text-red-800"}`}>
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

          {/* Prev / Next Navigation */}
          <div className="flex items-center justify-between gap-4">
            {nav.prev ? (
              <Link
                href={`/dashboard/courses/lessons/${nav.prev.id}`}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-[#229C62] hover:bg-[#E9F8EE]/30 transition-all group flex-1 min-w-0"
              >
                <ArrowLeft size={16} className="text-slate-400 group-hover:text-[#229C62] shrink-0 transition-colors" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Previous</p>
                  <p className="text-sm font-medium text-slate-900 truncate">{nav.prev.title}</p>
                </div>
              </Link>
            ) : <div className="flex-1" />}

            {nav.next ? (
              <Link
                href={`/dashboard/courses/lessons/${nav.next.id}`}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-[#229C62] hover:bg-[#E9F8EE]/30 transition-all group flex-1 min-w-0 text-right justify-end"
              >
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Next</p>
                  <p className="text-sm font-medium text-slate-900 truncate">{nav.next.title}</p>
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-[#229C62] shrink-0 transition-colors" />
              </Link>
            ) : (
              <Link
                href={`/dashboard/courses/${lesson.section?.courseId || ""}`}
                className="flex items-center gap-3 p-4 rounded-xl border border-[#229C62]/30 bg-[#E9F8EE] hover:bg-[#229C62] hover:text-white transition-all group flex-1 min-w-0 text-right justify-end"
              >
                <div className="min-w-0">
                  <p className="text-[10px] text-[#229C62]/70 uppercase tracking-wide group-hover:text-white/70">Done!</p>
                  <p className="text-sm font-medium text-[#0F203A] group-hover:text-white">Back to course</p>
                </div>
                <ChevronRight size={16} className="text-[#229C62] group-hover:text-white shrink-0 transition-colors" />
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {lesson.labId && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
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

          {/* Section lessons list */}
          {currentSection && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">{currentSection.title}</h3>
              <div className="space-y-1">
                {currentSection.lessons.map((l, i) => (
                  <Link
                    key={l.id}
                    href={`/dashboard/courses/lessons/${l.id}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      l.id === id
                        ? "bg-[#E9F8EE] text-[#0F203A] font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 bg-slate-100 text-slate-500">
                      {l.id === id ? <CheckCircle size={12} className="text-[#229C62]" /> : i + 1}
                    </span>
                    <span className="truncate">{l.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Lesson Info</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Section</span>
                <span className="font-medium text-slate-900">{lesson.section?.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className={`font-medium ${completed ? "text-[#229C62]" : "text-slate-500"}`}>
                  {completed ? "Completed" : "In progress"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>XP Reward</span>
                <span className="font-medium text-[#229C62]">+10 XP</span>
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
