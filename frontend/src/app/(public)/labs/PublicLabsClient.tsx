"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type PublicLab = {
  id: string;
  title: string;
  description: string;
};

export default function PublicLabsClient({ labs }: { labs: PublicLab[] }) {
  const { t } = useI18n();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-white tracking-tight">{t("public.labs.title")}</h1>
      <p className="text-slate-400 mt-3 max-w-2xl">{t("public.labs.description")}</p>
      {labs.length === 0 ? (
        <div className="mt-10 p-8 rounded-2xl border border-white/10 bg-[#0f172a] text-slate-400">
          {t("public.labs.empty")} <Link href="/dashboard/labs" className="text-[#7AD62A] hover:underline">{t("public.courses.goDashboard")}</Link>.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {labs.map((lab) => (
            <Link key={lab.id} href={`/labs/${lab.id}`} className="group rounded-2xl border border-white/10 bg-[#0f172a] p-6 hover:border-[#7AD62A]/30 hover:shadow-lg transition-all">
              <h3 className="font-semibold text-white group-hover:text-[#7AD62A] transition-colors">{lab.title}</h3>
              <p className="text-sm text-slate-500 mt-2 line-clamp-2">{lab.description}</p>
              <span className="inline-flex mt-4 text-sm font-medium text-[#7AD62A]">{t("public.labs.viewLab")} →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
