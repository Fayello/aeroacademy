"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ContextualNavProps {
  backHref: string;
  backLabel: string;
  title: string;
  tabs: Array<{
    href: string;
    label: string;
    active?: boolean;
  }>;
}

export default function ContextualNav({
  backHref,
  backLabel,
  title,
  tabs,
}: ContextualNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <div className="mb-6">
      {/* Back link */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 mb-3 transition-colors"
      >
        <ArrowLeft size={14} />
        {backLabel}
      </Link>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-3">
        {title}
      </h1>

      {/* Tab navigation */}
      {tabs.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-[#E9F8EE] text-[#0F203A]"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
