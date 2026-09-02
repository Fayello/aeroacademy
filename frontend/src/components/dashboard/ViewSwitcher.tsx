"use client";

import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, Shield } from "lucide-react";
import { useNavigation, type ViewMode } from "@/lib/navigation";

type ViewSwitcherProps = {
  compact?: boolean;
};

export default function ViewSwitcher({ compact = false }: ViewSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { nav, setViewMode } = useNavigation();

  const isPrivilegedUser = nav.canAccessAdminView;

  if (!isPrivilegedUser) return null;

  function getTargetPath(mode: ViewMode) {
    const onAdminRoute = pathname.startsWith("/dashboard/admin");
    const onRecruitmentRoute = pathname.startsWith("/dashboard/enterprise");
    const adminHomePath = nav.adminHomePath || "/dashboard/admin";

    if (mode === "ADMIN") {
      if (onAdminRoute || onRecruitmentRoute) return pathname;
      return adminHomePath;
    }

    return onAdminRoute || onRecruitmentRoute ? "/dashboard" : pathname;
  }

  function handleSwitch(mode: ViewMode) {
    if (nav.viewMode === mode) return;
    setViewMode(mode);
    const target = getTargetPath(mode);
    if (target !== pathname) {
      router.push(target);
    }
  }

  const adminActive =
    nav.viewMode === "ADMIN"
      ? "border border-[#7AD62A]/30 bg-[#7AD62A] text-[#0a0f1a] shadow-sm shadow-[#7AD62A]/20"
      : "text-slate-400 hover:text-slate-200";
  const learnerActive =
    nav.viewMode === "LEARNER"
      ? "border border-blue-400/30 bg-blue-400/15 text-blue-100 shadow-sm shadow-blue-500/10"
      : "text-slate-400 hover:text-slate-200";

  if (compact) {
    return (
      <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5">
        <button
          type="button"
          onClick={() => handleSwitch("ADMIN")}
          aria-pressed={nav.viewMode === "ADMIN"}
          className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-all ${adminActive}`}
        >
          <Shield size={11} />
          <span>{nav.role === "RECRUITER" ? "Recruiting" : "Admin"}</span>
        </button>
        <button
          type="button"
          onClick={() => handleSwitch("LEARNER")}
          aria-pressed={nav.viewMode === "LEARNER"}
          className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-all ${learnerActive}`}
        >
          <GraduationCap size={11} />
          <span>Learner</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-1.5">
      <div className="mb-2 flex items-center justify-between px-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">View</p>
        <p className="text-[10px] text-slate-500">
          {nav.viewMode === "ADMIN"
            ? nav.role === "RECRUITER"
              ? "Talent and outreach"
              : "Operations and control"
            : "Learning and progress"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => handleSwitch("ADMIN")}
          aria-pressed={nav.viewMode === "ADMIN"}
          className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
            nav.viewMode === "ADMIN"
              ? "border-[#7AD62A]/25 bg-[#7AD62A]/10 text-white"
              : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield size={14} className={nav.viewMode === "ADMIN" ? "text-[#7AD62A]" : "text-slate-500"} />
            <span className="text-sm font-semibold">{nav.role === "RECRUITER" ? "Recruiting" : "Admin"}</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-inherit/80">
            {nav.role === "RECRUITER"
              ? "Review talent, community intake, and institutional pipeline work."
              : "Run platform operations and admin workflows."}
          </p>
        </button>
        <button
          type="button"
          onClick={() => handleSwitch("LEARNER")}
          aria-pressed={nav.viewMode === "LEARNER"}
          className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
            nav.viewMode === "LEARNER"
              ? "border-blue-400/25 bg-blue-400/10 text-white"
              : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <GraduationCap size={14} className={nav.viewMode === "LEARNER" ? "text-blue-300" : "text-slate-500"} />
            <span className="text-sm font-semibold">Learner</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-inherit/80">
            Return to training, labs, and certification progress.
          </p>
        </button>
      </div>
    </div>
  );
}
