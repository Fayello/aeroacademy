"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Award, User, Trophy, MoreHorizontal, Lock } from "lucide-react";
import { logout } from "@/lib/auth";
import { useState, useRef, useEffect } from "react";
import { getLevel, getSidebarItemLock } from "@/lib/levelGating";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";

const links = [
  { href: "/dashboard", tKey: "home", icon: LayoutDashboard },
  { href: "/dashboard/courses", tKey: "courses", icon: GraduationCap },
  { href: "/dashboard/leaderboard", tKey: "ranks", icon: Trophy },
  { href: "/dashboard/certifications", tKey: "certs", icon: Award },
  { href: "/dashboard/profile", tKey: "profile", icon: User },
];

const moreLinks = [
  { href: "/dashboard/labs", tKey: "labs" },
  { href: "/dashboard/learning-paths", tKey: "learning-paths" },
  { href: "/dashboard/master-classes", tKey: "master-classes" },
  { href: "/dashboard/training", tKey: "training" },
  { href: "/dashboard/registry", tKey: "registry" },
  { href: "/dashboard/teams", tKey: "my-teams" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const [level, setLevel] = useState(() => {
    try {
      if (typeof window === "undefined") return 1;
      return getLevel(parseInt(localStorage.getItem("xp") || "0", 10));
    } catch {
      return 1;
    }
  });

  useEffect(() => {
    try {
      const xp = parseInt(localStorage.getItem("xp") || "0", 10);
      setLevel(getLevel(xp));
    } catch {}
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-50" aria-label={t("nav.mobile")}>
      <div className="flex justify-around items-center h-16 px-2 safe-area-pb">
        {links.map(({ href, tKey, icon: Icon }) => {
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
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isLocked ? "text-slate-300" : isActive ? "text-[#229C62]" : "text-slate-400 hover:text-slate-600"
              }`}
              onClick={(e) => { if (isLocked) e.preventDefault(); }}
            >
              <div className="relative">
                <Icon size={20} />
                {isLocked && <Lock size={8} className="absolute -top-1 -right-1 text-slate-400" />}
              </div>
              <span className="text-[10px] mt-1 font-medium">{label}</span>
            </Link>
          );
        })}
        <div ref={moreRef} className="relative">
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            aria-label={t("common.moreOptions")}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              moreOpen ? "text-[#229C62]" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] mt-1 font-medium">{t("common.more")}</span>
          </button>
          {moreOpen && (
            <div className="absolute bottom-full right-0 mb-2 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px]">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <LanguageSwitcher />
              </div>
              {moreLinks.map(({ href, tKey }) => {
                const gate = getSidebarItemLock(href, level);
                const isLocked = gate.locked;
                const label = t(`nav.${tKey}`);
                return isLocked ? (
                  <span
                    key={href}
                    className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                  >
                    {label}
                    <span className="text-[10px] flex items-center gap-1"><Lock size={10} />Lv.{gate.requiredLevel}</span>
                  </span>
                ) : (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {label}
                  </Link>
                );
              })}
              <button
                onClick={() => { setMoreOpen(false); logout(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-slate-100"
              >
                {t("common.logoutShort")}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
