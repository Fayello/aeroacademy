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
  Users,
  FileText,
  Activity,
  ExternalLink,
  ArrowRight,
  AlertCircle,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { getLevel, getCourseLock } from "@/lib/levelGating";
import toast from "@/lib/toast";
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

type TabKey = "overview" | "lessons" | "reviews" | "walkthroughs" | "activity" | "progress";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: Target },
  { key: "lessons", label: "Lessons", icon: BookOpen },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "progress", label: "Progress", icon: CheckCircle2 },
];

const DIFFICULTY_MAP: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "Fundamentals", color: "text-emerald-300", bg: "bg-[#7AD62A]/20" },
  2: { label: "Beginner", color: "text-blue-300", bg: "bg-blue-500/20" },
  3: { label: "Intermediate", color: "text-amber-300", bg: "bg-amber-500/20" },
  4: { label: "Advanced", color: "text-orange-300", bg: "bg-orange-500/20" },
  5: { label: "Expert", color: "text-rose-300", bg: "bg-rose-500/20" },
};

export default function CourseBriefingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<(Course & { reviewStats?: { average: number; total: number }; _count?: any }) | null>(null);
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
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [relatedCourses, setRelatedCourses] = useState<any[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);

  const toggleFavorite = async () => {
    if (!id) return;
    try {
      const res = await fetchApi(`/courses/${id}/favorite`, { method: "POST" }) as { favorited: boolean };
      setIsFavorited(res.favorited);
    } catch {
      toast.error("Failed to update favorite");
    }
  };

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
        const [courseData, progressData, enrollmentData, reviewsResult, favoritesResult] = await Promise.all([
          fetchApi<any>(`/courses/${id}`),
          fetchApi(`/progress/course/${id}`).catch(() => null),
          fetchApi(`/courses/${id}/enrollment`).catch(() => null),
          fetchApi(`/courses/${id}/reviews`).catch(() => null),
          fetchApi<string[]>("/courses/my-favorites").catch(() => []),
        ]);
        if (!cancelled) {
          setCourse(courseData);
          setProgress(progressData);
          setEnrollment(enrollmentData);
          setIsFavorited((favoritesResult as string[]).includes(id as string));
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
          // Load related courses (same category, exclude current)
          try {
            const allCourses = await fetchApi<any[]>("/courses");
            const related = allCourses
              .filter((c: any) => c.id !== id && c.category === courseData.category)
              .slice(0, 3);
            if (!cancelled) setRelatedCourses(related);
          } catch {}
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
      const lastId = localStorage.getItem(`lastViewedLesson:${id}`);
      if (lastId) {
        router.push(`/dashboard/courses/lessons/${lastId}`);
        return;
      }
      for (const section of course.sections) {
        for (const lesson of section.lessons) {
          router.push(`/dashboard/courses/lessons/${lesson.id}`);
          return;
        }
      }
    }
  }, [course, id, router]);

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
        <Loader2 className="animate-spin text-[#7AD62A]" size={32} />
      </div>
    );
  }
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <AlertCircle size={40} className="text-red-400 mb-3" />
      <p className="text-white font-medium mb-1">Something went wrong</p>
      <p className="text-sm text-slate-500 mb-4">{error}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#7AD62A] hover:bg-[#1d8a56] text-white rounded-lg text-sm font-medium transition-colors">Try again</button>
    </div>
  );
  if (!course) return null;

  const isEnrolled = !!enrollment;
  const hasProgress = progress && progress.completed > 0;
  const totalLessons = course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;
  const estimatedMinutes = totalLessons * 12;
  const diff = DIFFICULTY_MAP[Math.min(Math.max(Math.ceil((course.difficulty || 1) / 2), 1), 5)];
  const avgRating = course.reviewStats?.average || 0;
  const totalReviews = course.reviewStats?.total || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Hero Header */}
          <div className="relative overflow-hidden angular-card p-6 sm:p-8 text-white border border-white/[0.06] shadow-lg shadow-black/20" style={{ background: "linear-gradient(135deg, #0F203A, #1a3a5c, #7AD62A)" }}>
            <div className="absolute inset-0 angular-grid-bg opacity-[0.04] pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7AD62A]/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
            <div className="relative z-10">
              <Link
                href="/dashboard/courses"
                className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors mb-4"
              >
                <ChevronLeft size={16} />
                All courses
              </Link>

              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{course.title}</h1>
                  <p className="text-white/70 leading-relaxed max-w-2xl">{course.description}</p>
                </div>
              </div>

              {/* Meta badges */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Difficulty */}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${diff.bg} ${diff.color}`}>
                  {diff.label}
                </span>

                {/* Rating */}
                {totalReviews > 0 && (
                  <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="font-medium">{avgRating.toFixed(1)}</span>
                    <span className="text-white/50">({totalReviews})</span>
                  </span>
                )}

                {/* XP reward */}
                <span className="flex items-center gap-1.5 bg-[#7AD62A]/20 text-[#7AD62A] rounded-full px-2.5 py-1 text-xs font-bold">
                  <Award size={12} />
                  +{totalLessons * 25} XP
                </span>

                <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs">
                  <Clock size={12} />
                  ~{Math.ceil(estimatedMinutes / 60)}h
                </span>

                <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs">
                  <Layers size={12} />
                  {course.sections?.length || 0} modules
                </span>

                <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs">
                  <BookOpen size={12} />
                  {totalLessons} lessons
                </span>

                <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs">
                  <Users size={12} />
                  {course._count?.enrollments || 0} enrolled
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-[#7AD62A] text-[#7AD62A]"
                    : "border-transparent text-slate-500 hover:text-slate-200 hover:border-white/10"
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
                {tab.key === "reviews" && totalReviews > 0 && (
                  <span className="text-[10px] bg-white/5 text-slate-400 px-1.5 py-0.5 rounded-full">
                    {totalReviews}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="angular-card border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target size={18} className="text-[#7AD62A]" />
                  What you&apos;ll learn
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.sections?.map((section: Section) => (
                    <div key={section.id} className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-[#7AD62A] mt-0.5 shrink-0" />
                      <span className="text-sm text-slate-300">{section.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discussions */}
              {isEnrolled && (
                <Link
                  href={`/dashboard/courses/${course.id}/discussions`}
                  className="angular-card border-white/10 p-4 flex items-center justify-between hover-lift transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <MessageSquare size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Course Discussions</h3>
                      <p className="text-xs text-slate-500">Ask questions, share tips, and help other students</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                </Link>
              )}
            </div>
          )}

          {/* Lessons Tab */}
          {activeTab === "lessons" && (
            <div className="space-y-4">
              {course.sections.map((section: Section) => {
                const gate = getCourseLock(section.title, level);
                const isLocked = gate.locked;
                const isExpanded = expandedSections.has(section.id) || isEnrolled;

                return (
                  <div key={section.id} className={`angular-card border-white/10 overflow-hidden ${isLocked ? "opacity-60" : "hover-lift"} transition-all duration-300`}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isLocked ? "text-slate-500 bg-white/5" : "text-[#7AD62A] bg-[#7AD62A]/10"}`}>
                          Module {section.order}
                        </span>
                        <h3 className="text-sm font-semibold text-white">{section.title}</h3>
                        {isLocked && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
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
                      <div className="divide-y divide-white/10">
                        {section.lessons.map((lesson: Lesson) => (
                          isLocked ? (
                            <div key={lesson.id} className="flex items-center justify-between px-6 py-3 opacity-60">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                  <Lock size={12} className="text-slate-400" />
                                </div>
                                <span className="text-sm text-slate-400">{lesson.title}</span>
                              </div>
                              <span className="text-xs text-slate-400">~12 min</span>
                            </div>
                          ) : (
                            <Link
                              key={lesson.id}
                              href={`/dashboard/courses/lessons/${lesson.id}`}
                              className="flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#7AD62A]/10 flex items-center justify-center">
                                  <Play size={12} className="text-[#7AD62A]" fill="currentColor" />
                                </div>
                                <span className="text-sm text-slate-300">{lesson.title}</span>
                              </div>
                              <span className="text-xs text-slate-400">~12 min</span>
                            </Link>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              {reviewsData && reviewsData.stats.total > 0 ? (
                <>
                  <div className="angular-card border-white/10 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white">{reviewsData.stats.average.toFixed(1)}</div>
                        <div className="flex items-center justify-center gap-0.5 my-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={16} className={s <= Math.round(reviewsData.stats.average) ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                          ))}
                        </div>
                        <p className="text-sm text-slate-500">{reviewsData.stats.total} review{reviewsData.stats.total !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = reviewsData.stats.distribution[star] || 0;
                          const pct = reviewsData.stats.total > 0 ? (count / reviewsData.stats.total) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-sm">
                              <span className="w-3 text-slate-500 text-right">{star}</span>
                              <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-6 text-right text-xs text-slate-400">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                      {isEnrolled && (
                          <div className="border-l border-white/10 pl-6">
                           <p className="text-sm font-medium text-slate-300 mb-3">Write a review</p>
                          <div className="flex items-center gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setMyRating(s)}>
                                <Star size={20} className={`transition-colors ${s <= (hoverRating || myRating) ? "text-amber-400 fill-amber-400" : "text-slate-200 hover:text-amber-200"}`} />
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={myComment}
                            onChange={(e) => setMyComment(e.target.value)}
                            placeholder="Share your experience (optional)"
                            className="w-full px-3 py-2 text-sm border border-white/10 bg-[#0f172a] text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]"
                            rows={3}
                          />
                          <button
                            onClick={handleSubmitReview}
                            disabled={myRating < 1 || submittingReview}
                            className="mt-2 px-4 py-2 bg-[#7AD62A] hover:bg-[#6bc422] disabled:opacity-50 text-[#0F203A] rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                          >
                            {submittingReview ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            {myRating > 0 && reviewsData.reviews.some((r) => r.userId === enrollment?.userId) ? "Update" : "Submit"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {reviewsData.reviews.slice(0, 10).map((review) => (
                      <div key={review.id} className="angular-card border-white/10 p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-[#7AD62A]/10 flex items-center justify-center text-sm font-semibold text-[#0F203A]">
                            {(review.user.name || review.user.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{review.user.name || review.user.email.split("@")[0]}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} size={10} className={s <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                                ))}
                              </div>
                              <span className="text-[10px] text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-slate-300 ml-11">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="angular-card border-white/10 py-12 text-center">
                  <Star size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm text-slate-500">No reviews yet. Be the first to review this course.</p>
                </div>
              )}
            </div>
          )}

          {/* Progress Tab */}
          {activeTab === "progress" && (
            <div className="max-w-md">
              <div className="angular-card border-white/10 p-6">
                {isEnrolled ? (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center mb-4">
                      <CheckCircle2 size={24} className="text-[#7AD62A]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Course Progress</h3>
                    <p className="text-sm text-slate-500 mb-6">Continue where you left off.</p>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Progress</span>
                        <span className="font-semibold text-white">{progress?.percentage || 0}%</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#7AD62A] to-[#7AD62A] rounded-full transition-all duration-500" style={{ width: `${progress?.percentage || 0}%` }} />
                      </div>
                      {progress && (
                        <p className="text-xs text-slate-500">{progress.completed} of {progress.total} lessons completed</p>
                      )}
                    </div>

                    {progress && progress.percentage === 100 ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-[#7AD62A]/10 rounded-xl border border-[#7AD62A]/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Award size={16} className="text-[#7AD62A]" />
                            <p className="text-sm font-medium text-[#0F203A]">Course Completed!</p>
                          </div>
                          <p className="text-xs text-[#7AD62A]">You have earned your certification.</p>
                        </div>
                        <Link
                          href={"/dashboard/courses/" + course.id + "/certificate"}
                          className="w-full py-2.5 px-4 bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <Award size={14} />
                          View Certificate
                        </Link>
                      </div>
                    ) : (
                      <button
                        onClick={handleResumeCourse}
                        className="w-full py-3 px-4 bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Play size={16} />
                        Continue Course
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center mb-4">
                      <Rocket size={24} className="text-[#7AD62A]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Ready to start?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                      Begin your learning journey with this course. You&apos;ll earn XP for each lesson completed.
                    </p>

                    <div className="space-y-2 mb-6 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-[#7AD62A]" />
                        <span>{totalLessons} lessons with hands-on exercises</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-[#7AD62A]" />
                        <span>Earn XP and climb the leaderboard</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-[#7AD62A]" />
                        <span>Certificate upon completion</span>
                      </div>
                    </div>

                    <button
                      onClick={handleStartCourse}
                      disabled={enrolling}
                      className="w-full py-3 px-4 bg-[#7AD62A] hover:bg-[#6bc422] disabled:opacity-50 text-[#0F203A] rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {enrolling ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                      {enrolling ? "Starting..." : "Start Now"}
                    </button>
                    <button
                      onClick={toggleFavorite}
                      className="w-full mt-2 py-2 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-medium transition-colors flex items-center justify-center gap-2 text-slate-400"
                    >
                      <Heart size={16} className={isFavorited ? "text-red-500 fill-red-500" : ""} />
                      {isFavorited ? "Favorited" : "Favorite"}
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

        <div className="hidden lg:block w-72 shrink-0 space-y-4">
          {/* Quick Start CTA */}
          <div className="angular-card border-white/10 p-5">
            {isEnrolled ? (
              <button
                onClick={handleResumeCourse}
                className="w-full py-3 px-4 bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Play size={16} />
                Continue Course
              </button>
            ) : (
              <button
                onClick={handleStartCourse}
                disabled={enrolling}
                className="w-full py-3 px-4 bg-[#7AD62A] hover:bg-[#6bc422] disabled:opacity-50 text-[#0F203A] rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                {enrolling ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                {enrolling ? "Starting..." : "Start Now"}
              </button>
            )}
            {/* Favorite toggle */}
            <button
              onClick={toggleFavorite}
              className="w-full mt-3 py-2 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-medium transition-colors flex items-center justify-center gap-2 text-slate-400"
            >
              <Heart size={16} className={isFavorited ? "text-red-500 fill-red-500" : ""} />
              {isFavorited ? "Favorited" : "Favorite"}
            </button>
          </div>

          {/* Progress ring (if enrolled) */}
          {isEnrolled && progress && (
            <div className="angular-card border-white/10 p-5 text-center">
              <div className="relative inline-block mb-3">
                <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                   <circle cx="40" cy="40" r="34" fill="none" stroke="#7AD62A" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - (progress.percentage || 0) / 100)}
                    className="transition-all duration-500" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{progress.percentage || 0}%</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">{progress.completed} of {progress.total} lessons</p>
            </div>
          )}

          {/* Related Courses */}
          {relatedCourses.length > 0 && (
            <div className="angular-card border-white/10 p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Related Courses</h3>
              <div className="space-y-3">
                {relatedCourses.map((rc) => (
                  <Link
                    key={rc.id}
                    href={`/dashboard/courses/${rc.id}`}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <BookOpen size={14} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white line-clamp-2 group-hover:text-[#7AD62A] transition-colors">
                        {rc.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {rc.reviewStats?.average > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                            <Star size={8} className="text-amber-400 fill-amber-400" />
                            {rc.reviewStats.average.toFixed(1)}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">{rc._count?.enrollments || 0} enrolled</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
