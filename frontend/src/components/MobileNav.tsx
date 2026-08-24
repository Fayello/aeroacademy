"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, GraduationCap, FlaskConical, Swords, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const MOBILE_NAV = [
  { href: "/dashboard", tKey: "mobile.home", icon: Home },
  { href: "/dashboard/courses", tKey: "mobile.learn", icon: GraduationCap },
  { href: "/dashboard/labs", tKey: "mobile.labs", icon: FlaskConical },
  { href: "/dashboard/leaderboard", tKey: "mobile.compete", icon: Swords },
  { href: "/dashboard/profile", tKey: "mobile.me", icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around py-2 px-1">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-0 ${
                isActive
                  ? "text-[#229C62]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${isActive ? "text-[#229C62]" : ""}`}>
                {t(item.tKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
