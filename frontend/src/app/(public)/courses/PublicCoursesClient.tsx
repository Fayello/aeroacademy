"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type PublicCourse = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
};

export default function PublicCoursesClient({ courses }: { courses: PublicCourse[] }) {
  const { t } = useI18n();
  const benefits = [
    t("public.courses.benefitLessons"),
    t("public.courses.benefitAssessment"),
    t("public.courses.benefitCertificates"),
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">{t("public.courses.catalog")}</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-3">{t("public.courses.title")}</h1>
        <p className="text-slate-400 mt-3 max-w-2xl leading-relaxed">{t("public.courses.description")}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {benefits.map((item) => (
          <div key={item} className="p-5 rounded-2xl border border-white/10 bg-[#0f172a] text-sm text-slate-300">
            {item}
          </div>
        ))}
      </div>
      {courses.length === 0 ? (
        <div className="mt-10 p-8 rounded-2xl border border-white/10 bg-[#0f172a] text-slate-400">
          {t("public.courses.empty")} <Link href="/dashboard/courses" className="text-[#7AD62A] hover:underline">{t("public.courses.goDashboard")}</Link> {t("public.courses.or")} <Link href="/register" className="text-[#7AD62A] hover:underline">{t("public.courses.createAccount")}</Link>.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-10">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`} className="group rounded-2xl border border-white/10 bg-[#0f172a] p-5 sm:p-6 hover:border-[#7AD62A]/30 hover:shadow-lg transition-all">
              <h3 className="font-semibold text-white group-hover:text-[#7AD62A] transition-colors">{course.title}</h3>
              <p className="text-sm text-slate-500 mt-2 line-clamp-2">{course.description}</p>
              <span className="inline-flex mt-4 text-sm font-medium text-[#7AD62A]">{t("public.courses.viewCourse")} →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
