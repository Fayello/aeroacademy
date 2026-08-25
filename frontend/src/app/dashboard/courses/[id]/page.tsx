"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Play,
  BookOpen,
  Clock,
  Loader2,
  Lock,
  CheckCircle2,
  Layers,
  Award,
  Target,
  Rocket,
  Star,
  Send,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { getLevel, getCourseLock } from "@/lib/levelGating";
import type { Course, Section, Lesson } from "@/types/api";

interface Enrollment {
  userId: string;
  courseId: string;
  enrolledAt: string;
  lastActivityAt: string;
}

interface CourseProgress {
  total: number;
  completed: number;
  started: number;
  percentage: number;
}

interface ReviewUser {
  id: string;
  name: string | null;
  email: string;
  division: string;
}

interface CourseReview {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: ReviewUser;
}

interface ReviewStats {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

interface ReviewsData {
  reviews: CourseReview[];
  stats: ReviewStats;
}

export default function CourseBriefingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");
  const [level, setLevel] = useState(1);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "lessons" | "labs" | "progress">("overview");

  useEffect(() => {
    try {
      setLevel(getLevel(parseInt(localStorage.getItem("xp") || "0", 10)));
    } catch {
      setLevel(1);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadCourse() {
      try {
        const [courseData, progressData, enrollmentData, reviewsResult] = await Promise.all([
          fetchApi(`/courses/${id}`) as Promise<Course & { reviewStats?: { average: number; total: number } }>,
          fetchApi(`/progress/course/${id}`).catch(() => null),
          fetchApi(`/courses/${id}/enrollment`).catch(() => null),
          fetchApi(`/courses/${id}/reviews`).catch(() => null),
        ]);
        if (!cancelled) {
          setCourse(courseData);
          setProgress(progressData);
          setEnrollment(enrollmentData);
          if (reviewsResult) {
            setReviewsData(reviewsResult as ReviewsData);
            const existing = (reviewsResult as ReviewsData).reviews?.find(
              (r: CourseReview) => r.userId === (enrollmentData as Enrollment | null)?.userId,
            );
            if (existing) {
              setMyRating(existing.rating);
              setMyComment(existing.comment || "");
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load course");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCourse();
    return () => { cancelled = true; };
  }, [id]);

  const handleStartCourse = useCallback(async () => {
    setEnrolling(true);
    try {
      await fetchApi(`/courses/${id}/enroll`, { method: "POST" });
      if (course?.sections?.[0]?.lessons?.[0]) {
        router.push(`/dashboard/courses/lessons/${course.sections[0].lessons[0].id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start course");
    } finally {
      setEnrolling(false);
    }
  }, [id, course, router]);

  const handleResumeCourse = useCallback(() => {
    if (course?.sections) {
      for (const section of course.sections) {
        for (const lesson of section.lessons) {
          router.push(`/dashboard/courses/lessons/${lesson.id}`);
          return;
        }
      }
    }
  }, [course, router]);

  const handleSubmitReview = useCallback(async () => {
    if (myRating < 1) return;
    setSubmittingReview(true);
    try {
      await fetchApi(`/courses/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: myRating, comment: myComment || undefined }),
      });
      const updated = await fetchApi(`/courses/${id}/reviews`) as ReviewsData;
      setReviewsData(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  }, [id, myRating, myComment]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#229C62]" size={32} />
      </div>
    );
  }
  if (error) return <div role="alert" className="text-red-600 p-4">{error}</div>;
  if (!course) return null;

  const isEnrolled = !!enrollment;
  const hasProgress = progress && progress.completed > 0;
  const totalLessons = course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;
  const estimatedMinutes = totalLessons * 12;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#229C62] via-[#0F203A] to-teal-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors mb-4"
          >
            <ChevronLeft size={16} />
            All courses
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{course.title}</h1>
          <p className="text-white/80 leading-relaxed max-w-2xl mb-6">{course.description}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            {estimatedMinutes > 0 && (
              <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <Clock size={14} />
                ~{Math.ceil(estimatedMinutes / 60)}h estimated
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <Layers size={14} />
              {course.sections?.length || 0} modules
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <BookOpen size={14} />
              {totalLessons} lessons
            </span>
          </div>
        </div>
      </div>

      {/* Contextual Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {[
          { key: "overview" as const, label: "Overview" },
          { key: "lessons" as const, label: "Lessons" },
          { key: "progress" as const, label: "Progress" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* What You'll Learn */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Target size={18} className="text-[#229C62]" />
              What you&apos;ll learn
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {course.sections?.map((section: Section) => (
                <div key={section.id} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#229C62] mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-700">{section.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          {reviewsData && reviewsData.stats.total > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Star size={18} className="text-amber-500" />
            Student Reviews
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats */}
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900">{reviewsData.stats.average.toFixed(1)}</div>
              <div className="flex items-center justify-center gap-0.5 my-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} className={s <= Math.round(reviewsData.stats.average) ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                ))}
              </div>
              <p className="text-sm text-slate-500">{reviewsData.stats.total} review{reviewsData.stats.total !== 1 ? "s" : ""}</p>
            </div>
            {/* Distribution */}
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviewsData.stats.distribution[star] || 0;
                const pct = reviewsData.stats.total > 0 ? (count / reviewsData.stats.total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-slate-500 text-right">{star}</span>
                    <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-xs text-slate-400">{count}</span>
                  </div>
                );
              })}
            </div>
            {/* Write Review */}
            {isEnrolled && (
              <div className="border-l border-slate-100 pl-6">
                <p className="text-sm font-medium text-slate-700 mb-3">Write a review</p>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setMyRating(s)}
                    >
                      <Star
                        size={20}
                        className={`transition-colors ${
                          s <= (hoverRating || myRating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200 hover:text-amber-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  placeholder="Share your experience (optional)"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62]"
                  rows={3}
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={myRating < 1 || submittingReview}
                  className="mt-2 px-4 py-2 bg-[#229C62] hover:bg-[#0F203A] disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  {submittingReview ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {myRating > 0 && reviewsData.reviews.some((r) => r.userId === enrollment?.userId) ? "Update" : "Submit"}
                </button>
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          <div className="mt-6 space-y-4">
            {reviewsData.reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#E9F8EE] flex items-center justify-center text-sm font-semibold text-[#0F203A]">
                    {(review.user.name || review.user.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{review.user.name || review.user.email.split("@")[0]}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={10} className={s <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-slate-600 ml-11">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discussions Link */}
      {isEnrolled && (
        <Link
          href={`/dashboard/courses/${course.id}/discussions`}
          className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <MessageSquare size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Course Discussions</h3>
              <p className="text-xs text-slate-500">Ask questions, share tips, and help other students</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
        </Link>
      )}
        </>
      )}

      {/* Lessons Tab */}
      {activeTab === "lessons" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Course Modules</h2>
          {course.sections.map((section: Section) => {
            const gate = getCourseLock(section.title, level);
            const isLocked = gate.locked;
            const isExpanded = expandedSections.has(section.id) || isEnrolled;

            return (
              <div key={section.id} className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${isLocked ? "opacity-60" : "hover:shadow-md"} transition-all duration-300`}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      isLocked
                        ? "text-slate-500 bg-slate-100"
                        : "text-[#229C62] bg-[#E9F8EE]"
                    }`}>
                      Module {section.order}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                    {isLocked && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Lock size={10} />
                        Lv.{gate.requiredLevel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{section.lessons.length} lessons</span>
                    <ChevronRight size={16} className={`text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-slate-100">
                    {section.lessons.map((lesson: Lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between px-6 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isLocked ? "bg-slate-100" : "bg-slate-100"
                          }`}>
                            {isLocked ? (
                              <Lock size={12} className="text-slate-400" />
                            ) : (
                              <Play size={12} className="text-slate-400" fill="currentColor" />
                            )}
                          </div>
                          <span className={`text-sm ${isLocked ? "text-slate-400" : "text-slate-700"}`}>{lesson.title}</span>
                        </div>
                        <span className="text-xs text-slate-400">~12 min</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === "progress" && (
        <div className="max-w-md">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {isEnrolled ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-[#E9F8EE] flex items-center justify-center mb-4">
                  <CheckCircle2 size={24} className="text-[#229C62]" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Course Progress</h3>
                <p className="text-sm text-slate-500 mb-6">Continue where you left off.</p>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-semibold text-slate-900">{progress?.percentage || 0}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#229C62] to-[#229C62] rounded-full transition-all duration-500" style={{ width: `${progress?.percentage || 0}%` }} />
                  </div>
                  {progress && (
                    <p className="text-xs text-slate-500">{progress.completed} of {progress.total} lessons completed</p>
                  )}
                </div>

                {progress && progress.percentage === 100 ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-[#E9F8EE] rounded-xl border border-[#229C62]/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Award size={16} className="text-[#229C62]" />
                        <p className="text-sm font-medium text-[#0F203A]">Course Completed!</p>
                      </div>
                      <p className="text-xs text-[#229C62]">You have earned your certification.</p>
                    </div>
                    <Link
                      href={"/dashboard/courses/" + course.id + "/certificate"}
                      className="w-full py-2.5 px-4 bg-[#229C62] hover:bg-[#0F203A] text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Award size={14} />
                      View Certificate
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleResumeCourse}
                    className="w-full py-3 px-4 bg-[#229C62] hover:bg-[#0F203A] text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={16} />
                    Resume Course
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-[#E9F8EE] flex items-center justify-center mb-4">
                  <Rocket size={24} className="text-[#229C62]" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to start?</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Begin your learning journey with this course. You&apos;ll earn XP for each lesson completed.
                </p>

                <div className="space-y-2 mb-6 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#229C62]" />
                    <span>{totalLessons} lessons with hands-on exercises</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#229C62]" />
                    <span>Earn XP and climb the leaderboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#229C62]" />
                    <span>Certificate upon completion</span>
                  </div>
                </div>

                <button
                  onClick={handleStartCourse}
                  disabled={enrolling}
                  className="w-full py-3 px-4 bg-[#229C62] hover:bg-[#0F203A] disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {enrolling ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Rocket size={16} />
                  )}
                  {enrolling ? "Starting..." : "Start Now"}
                </button>
                <p className="text-xs text-slate-400 text-center mt-3">
                  We&apos;ll send you a welcome email with your learning roadmap
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
