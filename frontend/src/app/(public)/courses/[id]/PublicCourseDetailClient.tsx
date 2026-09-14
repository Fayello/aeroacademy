"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export type PublicCourseDetail = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  category?: string;
  difficulty?: number;
  estimatedHours?: number | null;
  sections?: { id: string; title: string; lessons?: unknown[] }[];
};

export default function PublicCourseDetailClient({
  id,
  course,
  jsonLd,
}: {
  id: string;
  course: PublicCourseDetail | null;
  jsonLd?: Record<string, unknown>;
}) {
  const { t } = useI18n();

  if (!course) {
    return (
      <div className="min-h-[60vh] max-w-3xl mx-auto px-6 py-16">
        <nav className="text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-[#7AD62A]">{t("public.course.home")}</Link>
          <span className="mx-2">/</span>
          <Link href="/courses" className="hover:text-[#7AD62A]">{t("public.nav.courses")}</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-400">{id.slice(0, 8)}…</span>
        </nav>
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-8">
          <span className="inline-flex px-3 py-1 rounded-full bg-[#7AD62A]/10 border border-[#7AD62A]/20 text-[#7AD62A] text-xs font-semibold">{t("public.course.badge")}</span>
          <h1 className="text-3xl font-bold text-white mt-4">{t("public.course.fallbackTitle")}</h1>
          <p className="text-slate-400 mt-3 leading-relaxed">{t("public.course.fallbackDescription")}</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href={`/dashboard/courses/${id}`} className="inline-flex items-center gap-2 px-6 py-3 bg-[#7AD62A] text-white rounded-xl font-semibold hover:bg-[#1e8a56] transition-colors">
              {t("public.course.viewDashboard")}
            </Link>
            <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 text-slate-300 rounded-xl font-medium hover:bg-white/5 transition-colors">
              {t("public.course.browse")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <nav className="text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-[#7AD62A]">{t("public.course.home")}</Link>
        <span className="mx-2">/</span>
        <Link href="/courses" className="hover:text-[#7AD62A]">{t("public.nav.courses")}</Link>
        <span className="mx-2">/</span>
        <span className="text-white">{course.title}</span>
      </nav>

      {course.imageUrl && (
        <div className="rounded-2xl overflow-hidden border border-white/10 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={course.imageUrl} alt={course.title} className="w-full h-64 object-cover" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {course.category && <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-200 text-blue-700 text-xs font-semibold">{course.category}</span>}
        {course.difficulty != null && <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-200 text-amber-700 text-xs font-medium">{t("public.course.level", { level: course.difficulty })}</span>}
        {course.estimatedHours != null && <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs">{course.estimatedHours}h</span>}
      </div>

      <h1 className="text-4xl font-bold text-white tracking-tight">{course.title}</h1>
      <p className="text-lg text-slate-400 mt-4 leading-relaxed">{course.description}</p>

      {course.sections && course.sections.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-white mb-4">{t("public.course.curriculum")}</h2>
          <ul className="space-y-3">
            {course.sections.map((section) => {
              const lessonCount = section.lessons?.length ?? 0;
              return (
                <li key={section.id} className="p-4 rounded-xl border border-white/10 bg-[#0f172a]">
                  <div className="font-medium text-white">{section.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{t("public.course.lessonCount", { count: lessonCount, plural: lessonCount === 1 ? "" : "s" })}</div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-10">
        <Link href={`/dashboard/courses/${course.id}`} className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#7AD62A] text-white rounded-xl font-semibold hover:bg-[#1e8a56] transition-colors">
          {t("public.course.start")}
        </Link>
        <Link href="/register" className="inline-flex items-center gap-2 px-7 py-3 border border-white/10 text-slate-300 rounded-xl font-medium hover:bg-white/5 transition-colors">
          {t("public.course.freeAccount")}
        </Link>
      </div>
    </div>
  );
}
