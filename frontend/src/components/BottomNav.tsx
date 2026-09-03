"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, GraduationCap, FlaskConical, Swords, User, Bell, ShieldCheck, Users, Inbox, Megaphone, Building2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useNavigation } from "@/lib/navigation";
import NotificationBadge from "@/components/ui/NotificationBadge";

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { nav } = useNavigation();

  const adminMode = nav.canAccessAdminView && nav.viewMode === "ADMIN";
  const hasCompete = nav.sections.some(s => s.id === "compete");

  const learnerLinks = [
    { href: "/dashboard", label: t("mobile.home"), icon: Home, show: true },
    { href: "/dashboard/courses", label: t("mobile.learn"), icon: GraduationCap, show: true },
    { href: "/dashboard/labs", label: t("mobile.labs"), icon: FlaskConical, show: true },
    { href: "/dashboard/leaderboard", label: t("mobile.compete"), icon: Swords, show: hasCompete },
    { href: "/dashboard/notifications", label: t("mobile.notifications"), icon: Bell, show: true, isNotifications: true },
    { href: "/dashboard/profile", label: t("mobile.me"), icon: User, show: true },
  ];

  const adminLinks = nav.role === "RECRUITER"
    ? [
        { href: "/dashboard/enterprise", label: "Talent", icon: Building2, show: true },
        { href: "/dashboard/admin/inquiries", label: "Inquiries", icon: Inbox, show: true },
        { href: "/dashboard/admin/community-programs", label: "Programs", icon: Megaphone, show: true },
        { href: "/dashboard/notifications", label: "Alerts", icon: Bell, show: true, isNotifications: true },
      ]
    : [
        { href: "/dashboard/admin", label: "Admin", icon: ShieldCheck, show: true },
        { href: "/dashboard/admin/users", label: "Users", icon: Users, show: true },
        { href: "/dashboard/admin/inquiries", label: "Inquiries", icon: Inbox, show: true },
        { href: "/dashboard/admin/community-programs", label: "Programs", icon: Megaphone, show: true },
        { href: "/dashboard/notifications", label: "Alerts", icon: Bell, show: true, isNotifications: true },
      ];

  const links = (adminMode ? adminLinks : learnerLinks).filter(l => l.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0f1a] border-t border-white/6 md:hidden z-50" aria-label={t("nav.mobile")}>
      <div className="flex justify-around items-center h-16 px-2 safe-area-pb">
        {links.map(({ href, label, icon: Icon, isNotifications }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link prefetch={false}
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? "text-[#7AD62A]" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {isNotifications && <NotificationBadge className="absolute -top-2 -right-3" />}
              </div>
              <span className="text-[10px] mt-1 font-medium">{label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-[#7AD62A] mt-1" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
