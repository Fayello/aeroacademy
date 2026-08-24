"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, GraduationCap, FlaskConical, Swords, User, Lock } from "lucide-react";
import { logout } from "@/lib/auth";
import { useState, useEffect } from "react";
import { getLevel, getSidebarItemLock } from "@/lib/levelGating";
import { useI18n } from "@/lib/i18n";

const links = [
  { href: "/dashboard", tKey: "mobile.home", icon: Home },
  { href: "/dashboard/courses", tKey: "mobile.learn", icon: GraduationCap },
  { href: "/dashboard/labs", tKey: "mobile.labs", icon: FlaskConical },
  { href: "/dashboard/leaderboard", tKey: "mobile.compete", icon: Swords },
  { href: "/dashboard/profile", tKey: "mobile.me", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-50" aria-label={t("nav.mobile")}>
      <div className="flex justify-around items-center h-16 px-2 safe-area-pb">
        {links.map(({ href, tKey, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          const gate = getSidebarItemLock(href, level);
          const isLocked = gate.locked;
          const label = t(tKey);
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
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {isLocked && <Lock size={8} className="absolute -top-1 -right-1 text-slate-400" />}
              </div>
              <span className="text-[10px] mt-1 font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
