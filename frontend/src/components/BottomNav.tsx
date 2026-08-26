"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, GraduationCap, FlaskConical, Swords, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useNavigation } from "@/lib/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { nav } = useNavigation();

  const hasCompete = nav.sections.some(s => s.id === "compete");

  const links = [
    { href: "/dashboard", tKey: "mobile.home", icon: Home, show: true },
    { href: "/dashboard/courses", tKey: "mobile.learn", icon: GraduationCap, show: true },
    { href: "/dashboard/labs", tKey: "mobile.labs", icon: FlaskConical, show: true },
    { href: "/dashboard/leaderboard", tKey: "mobile.compete", icon: Swords, show: hasCompete },
    { href: "/dashboard/profile", tKey: "mobile.me", icon: User, show: true },
  ].filter(l => l.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-50" aria-label={t("nav.mobile")}>
      <div className="flex justify-around items-center h-16 px-2 safe-area-pb">
        {links.map(({ href, tKey, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          const label = t(tKey);
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? "text-[#229C62]" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium">{label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-[#229C62] mt-1" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
