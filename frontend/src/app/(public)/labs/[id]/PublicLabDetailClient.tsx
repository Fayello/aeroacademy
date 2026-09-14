"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export type PublicLabDetail = {
  id: string;
  title: string;
  description: string;
  briefing?: string | null;
  difficulty: number;
  imageUrl?: string | null;
  dockerImage?: string;
  tasks?: string[] | null;
};

export default function PublicLabDetailClient({
  id,
  lab,
  jsonLd,
}: {
  id: string;
  lab: PublicLabDetail | null;
  jsonLd?: Record<string, unknown>;
}) {
  const { t } = useI18n();

  if (!lab) {
    return (
      <div className="min-h-[60vh] max-w-3xl mx-auto px-6 py-16">
        <nav className="text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-[#7AD62A]">{t("public.lab.home")}</Link>
          <span className="mx-2">/</span>
          <Link href="/labs" className="hover:text-[#7AD62A]">{t("public.nav.labs")}</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-400">{id.slice(0, 8)}…</span>
        </nav>
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-8">
          <span className="inline-flex px-3 py-1 rounded-full bg-blue-500/10 border border-blue-200 text-blue-700 text-xs font-semibold">{t("public.lab.badge")}</span>
          <h1 className="text-3xl font-bold text-white mt-4">{t("public.lab.fallbackTitle")}</h1>
          <p className="text-slate-400 mt-3 leading-relaxed">{t("public.lab.fallbackDescription")}</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href={`/dashboard/labs/${id}`} className="inline-flex items-center gap-2 px-6 py-3 bg-[#7AD62A] text-white rounded-xl font-semibold hover:bg-[#1e8a56] transition-colors">
              {t("public.lab.launchDashboard")}
            </Link>
            <Link href="/labs" className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 text-slate-300 rounded-xl font-medium hover:bg-white/5 transition-colors">
              {t("public.lab.browse")}
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
        <Link href="/" className="hover:text-[#7AD62A]">{t("public.lab.home")}</Link>
        <span className="mx-2">/</span>
        <Link href="/labs" className="hover:text-[#7AD62A]">{t("public.nav.labs")}</Link>
        <span className="mx-2">/</span>
        <span className="text-white">{lab.title}</span>
      </nav>

      {lab.imageUrl && (
        <div className="rounded-2xl overflow-hidden border border-white/10 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lab.imageUrl} alt={lab.title} className="w-full h-64 object-cover" />
        </div>
      )}

      <h1 className="text-4xl font-bold text-white tracking-tight">{lab.title}</h1>
      <p className="text-lg text-slate-400 mt-4 leading-relaxed">{lab.description}</p>
      {lab.briefing && <div className="prose prose-invert max-w-none mt-6 text-slate-300 whitespace-pre-wrap">{lab.briefing}</div>}

      {lab.tasks && lab.tasks.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-white mb-4">{t("public.lab.tasks")}</h2>
          <ul className="space-y-2">
            {lab.tasks.map((task, index) => (
              <li key={index} className="flex gap-3 p-3 rounded-xl border border-white/10 bg-[#0f172a] text-slate-300 text-sm">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#7AD62A]/15 text-[#7AD62A] flex items-center justify-center text-xs font-bold">{index + 1}</span>
                {task}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-10">
        <Link href={`/dashboard/labs/${lab.id}`} className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#7AD62A] text-white rounded-xl font-semibold hover:bg-[#1e8a56] transition-colors">
          {t("public.lab.deploy")}
        </Link>
        <Link href="/register" className="inline-flex items-center gap-2 px-7 py-3 border border-white/10 text-slate-300 rounded-xl font-medium hover:bg-white/5 transition-colors">
          {t("public.lab.freeAccount")}
        </Link>
      </div>
    </div>
  );
}
