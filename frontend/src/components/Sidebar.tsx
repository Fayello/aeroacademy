"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Microscope, LogOut, Shield, User, Trophy, Award, Briefcase, Lock, Target, ClipboardCheck, Route, Users, BarChart3, ScrollText } from "lucide-react";
import { logout } from "@/lib/auth";
import { useState, useEffect } from "react";
import { getLevel, getSidebarItemLock } from "@/lib/levelGating";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import ThemeToggle from "@/components/ThemeToggle";

interface NavLink {
  href: string;
  tKey: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
}

const links: NavLink[] = [
  { href: "/dashboard", tKey: "dashboard", icon: LayoutDashboard },
  { href: "/dashboard/courses", tKey: "courses", icon: GraduationCap },
  { href: "/dashboard/labs", tKey: "labs", icon: Microscope },
  { href: "/dashboard/leaderboard", tKey: "leaderboard", icon: Trophy },
  { href: "/dashboard/teams", tKey: "my-teams", icon: Users },
  { href: "/dashboard/challenges", tKey: "challenges", icon: Target },
  { href: "/dashboard/profile", tKey: "profile", icon: User },
  { href: "/dashboard/enterprise", tKey: "enterprise", icon: Briefcase, roles: ["ADMIN", "RECRUITER"] },
  { href: "/dashboard/admin", tKey: "admin", icon: Award, roles: ["ADMIN"] },
  { href: "/dashboard/admin/challenges", tKey: "admin-challenges", icon: Target, roles: ["ADMIN"] },
  { href: "/dashboard/admin/badges", tKey: "admin-badges", icon: Award, roles: ["ADMIN"] },
  { href: "/dashboard/admin/assessments", tKey: "admin-assessments", icon: ClipboardCheck, roles: ["ADMIN"] },
  { href: "/dashboard/admin/learning-paths", tKey: "admin-learning-paths", icon: Route, roles: ["ADMIN"] },
  { href: "/dashboard/admin/teams", tKey: "admin-teams", icon: Users, roles: ["ADMIN"] },
  { href: "/dashboard/admin/analytics", tKey: "analytics", icon: BarChart3, roles: ["ADMIN"] },
  { href: "/dashboard/admin/audit", tKey: "audit", icon: ScrollText, roles: ["ADMIN"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [level, setLevel] = useState(1);
  const { t } = useI18n();

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) setUserRole(JSON.parse(stored).role || "STUDENT");
        else setUserRole("STUDENT");
        const xp = parseInt(localStorage.getItem("xp") || "0", 10);
        setLevel(getLevel(xp));
      } catch {
        setUserRole("STUDENT");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const filteredLinks = userRole === null ? [] : links.filter(link => !link.roles || link.roles.includes(userRole));

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <img src="/logo-icon.svg" alt="XpertClass" className="w-9 h-9" />
        <div>
          <h1 className="text-base font-semibold tracking-tight">
            <span className="text-[#0F203A]">Xpert</span><span className="text-[#229C62]">Class</span>
          </h1>
          <p className="text-[11px] text-slate-400">{t("app.tagline")}</p>
        </div>
      </div>

      <div className="px-3">
        <div className="h-px bg-slate-100" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0" role="navigation" aria-label={t("nav.main")}>
        {filteredLinks.map(({ href, tKey, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          const gate = getSidebarItemLock(href, level);
          const isLocked = gate.locked;
          const label = t(`nav.${tKey}`);

          return (
            <Link
              key={href}
              href={isLocked ? "#" : href}
              aria-current={isActive ? "page" : undefined}
              title={isLocked ? gate.reason : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isLocked
                  ? "text-slate-400 cursor-not-allowed opacity-60"
                  : isActive
                    ? "bg-[#E9F8EE] text-[#0F203A]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              onClick={(e) => { if (isLocked) e.preventDefault(); }}
            >
              <Icon size={18} className={isActive && !isLocked ? "text-[#229C62]" : "text-slate-400"} />
              <span className="flex-1">{label}</span>
              {isLocked && (
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Lock size={10} />
                  Lv.{gate.requiredLevel}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 shrink-0 space-y-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <button
          onClick={logout}
          aria-label={t("common.logout")}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
        >
          <LogOut size={18} />
          {t("common.logout")}
        </button>
      </div>
    </aside>
  );
}
