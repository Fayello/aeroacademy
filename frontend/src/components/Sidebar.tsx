"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  GraduationCap,
  FlaskConical,
  Swords,
  User,
  LogOut,
  Shield,
  ShieldCheck,
  Award,
  Flame,
  Settings,
  Bell,
  Route,
  Target,
  BookOpen,
  Activity,
  Building2,
  ClipboardCheck,
  Inbox,
  Lock,
  Megaphone,
  ScrollText,
  ShieldAlert,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { fetchApi } from "@/lib/api";
import ThemeToggle from "@/components/ui/ThemeToggle";
import NotificationBadge from "@/components/ui/NotificationBadge";
import { useState, useEffect, useMemo } from "react";
import { getLevel, getLevelProgress } from "@/lib/levelGating";
import { LanguageSwitcher } from "@/lib/i18n";
import { useNavigation } from "@/lib/navigation";

const ICON_MAP: Record<string, typeof Home> = {
  Home,
  GraduationCap,
  FlaskConical,
  Swords,
  User,
  Shield,
  ShieldCheck,
  Award,
  Route,
  Target,
  BookOpen,
  Activity,
  Building2,
  ClipboardCheck,
  Inbox,
  Lock,
  Megaphone,
  ScrollText,
  ShieldAlert,
  TrendingUp,
  Trophy,
  Settings,
  Users,
};

export default function Sidebar() {
  const pathname = usePathname();
  const [xp, setXp] = useState(0);
  const [division, setDivision] = useState("Bronze");
  const [collapsed, setCollapsed] = useState(false);
  const [streak, setStreak] = useState(0);
  const { nav, loading } = useNavigation();

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("sidebar-collapsed") === "true");
      setXp(parseInt(localStorage.getItem("xp") || "0", 10));
      setDivision(localStorage.getItem("division") || "Bronze");
    } catch {}
    fetchApi<{ streak: { currentStreak: number } }>("/dashboard/home")
      .then((data) => setStreak(data?.streak?.currentStreak || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      setXp(parseInt(localStorage.getItem("xp") || "0", 10));
      setDivision(localStorage.getItem("division") || "Bronze");
    } catch {}
  }, [pathname]);

  const level = getLevel(xp);
  const progress = getLevelProgress(xp);

  const sections = useMemo(() => nav.sections, [nav]);

  const canAccessAdminView = nav.canAccessAdminView;
  const adminMode = canAccessAdminView && nav.viewMode === "ADMIN";
  const adminHomePath = nav.adminHomePath || "/dashboard/admin";
  const adminWorkspaceLabel = nav.adminViewLabel || "Admin Workspace";

  if (loading) {
    return (
      <aside className={`fixed left-0 top-12 bottom-0 bg-[#0a0f1a] border-r border-white/6 hidden md:flex flex-col z-50 transition-all duration-300 overflow-hidden ${collapsed ? "w-16" : "w-60"}`} aria-label="Main navigation">
        <div className="absolute inset-0 angular-grid-bg opacity-[0.03] pointer-events-none" />
        <div className="absolute inset-0 scanline-overlay pointer-events-none" />
        <div className="p-5 flex items-center gap-3">
          <Image src="/logo-icon.svg" alt="XpertClass" width={32} height={32} className="w-8 h-8 shrink-0" />
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold tracking-tight">
                <span className="text-white">Xpert</span>
                <span className="text-[#7AD62A]">Class</span>
              </h1>
            </div>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#7AD62A] border-t-transparent rounded-full animate-spin" />
        </div>
      </aside>
    );
  }

  return (
    <aside className={`fixed left-0 top-12 bottom-0 bg-[#0a0f1a] border-r border-white/6 hidden md:flex flex-col z-50 transition-all duration-300 overflow-hidden ${collapsed ? "w-16" : "w-60"}`} aria-label="Main navigation">
      <div className="absolute inset-0 angular-grid-bg opacity-[0.03] pointer-events-none" />

      {/* Logo */}
      <div className={`flex items-center gap-3 ${collapsed ? "p-3 justify-center" : "p-5"}`}>
        <Image src="/logo-icon.svg" alt="XpertClass" width={32} height={32} className="w-8 h-8 shrink-0" />
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold tracking-tight">
              <span className="text-white">Xpert</span>
              <span className="text-[#7AD62A]">Class</span>
            </h1>
            {nav.experience !== "INDIVIDUAL" && (
              <span className="text-[9px] font-semibold text-[#7AD62A] bg-[#7AD62A]/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {nav.experience === "UNIVERSITY" ? "University" : nav.experience === "CORPORATE" ? "Enterprise" : nav.experience === "INSTRUCTOR" ? "Instructor" : nav.experience}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="px-3"><div className="h-px bg-white/6" /></div>

      {/* Progress Card */}
      {!collapsed && !adminMode && (
        <div className="mx-3 mt-3 p-3.5 rounded-xl bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#1a3a5c] text-white relative overflow-hidden">
          <div className="absolute inset-0 dot-grid-bg opacity-[0.06] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Award size={14} className="text-[#7AD62A]" />
                <span className="text-xs font-bold text-white">{level < 4 ? "Beginner" : level < 7 ? "Intermediate" : level < 10 ? "Advanced" : "Expert"} Lv{level}</span>
              </div>
              <span className="text-[10px] font-mono text-white/40">{xp.toLocaleString()} XP</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-[#7AD62A] to-[#7AD62A] rounded-full transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 text-white/50">
                <Shield size={10} className="text-[#7AD62A]" />
                <span>Season 1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-white/60">
                  <Flame size={10} className="text-orange-400" />
                  {streak}d
                </span>
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-medium">{division}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin progress card (collapsed or admin mode) */}
      {!collapsed && adminMode && (
        <div className="mx-3 mt-3 rounded-xl border border-[#7AD62A]/20 bg-[#7AD62A]/10 p-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#7AD62A]" />
            <span className="text-xs font-bold text-white">{adminWorkspaceLabel}</span>
          </div>
        </div>
      )}

      {(collapsed) && (
        <div className="mx-1.5 mt-2 p-2 rounded-xl bg-gradient-to-br from-[#0F203A] to-[#1a3a5c] flex items-center justify-center" title={`Level ${level}: ${xp.toLocaleString()} XP`}>
          <Award size={16} className="text-[#7AD62A]" />
        </div>
      )}

      {/* Main Nav — Flat list, no accordions */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto min-h-0">
        {sections.map((section) => {
          // Single-item sections render as a direct link
          if (section.items.length === 1) {
            const item = section.items[0];
            const Icon = ICON_MAP[item.icon] || Home;
            const isActive = pathname === item.href;

            return (
              <Link prefetch={false}
                key={section.id}
                href={item.href}
                title={collapsed ? section.label : undefined}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7AD62A]/30 ${
                  isActive
                    ? "bg-[#7AD62A]/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon size={16} className={isActive ? "text-[#7AD62A]" : "text-slate-500"} />
                {!collapsed && <span className="truncate">{section.label}</span>}
              </Link>
            );
          }

          // Multi-item section: show section header, then items flat
          const firstItem = section.items[0];
          const Icon = ICON_MAP[firstItem?.icon] || Target;
          const isActive = section.items.some(
            (item) => pathname === item.href || pathname.startsWith(item.href + "/")
          );

          if (collapsed) {
            // Collapsed: just show the first item as the section icon
            const item = section.items[0];
            const ItemIcon = ICON_MAP[item.icon] || Target;
            return (
              <Link prefetch={false}
                key={section.id}
                href={item.href}
                title={section.label}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7AD62A]/30 ${
                  isActive
                    ? "bg-[#7AD62A]/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <ItemIcon size={16} className={isActive ? "text-[#7AD62A]" : "text-slate-500"} />
              </Link>
            );
          }

          // Expanded: show section label + flat items
          return (
            <div key={section.id} className="mb-1">
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {section.label}
              </p>
              {section.items.map((item) => {
                const ItemIcon = ICON_MAP[item.icon] || Target;
                const isItemActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link prefetch={false}
                    key={item.href}
                    href={item.href}
                    aria-current={isItemActive ? "page" : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7AD62A]/30 ${
                      isItemActive
                        ? "bg-[#7AD62A]/10 text-white"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <ItemIcon size={16} className={isItemActive ? "text-[#7AD62A]" : "text-slate-500"} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}

        {/* Admin quick link (only when in learner view) */}
        {canAccessAdminView && nav.viewMode === "LEARNER" && (
          <>
            {!collapsed && (
              <div className="pt-2 mt-2 border-t border-white/6">
                <p className="px-3 mb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {nav.role === "RECRUITER" ? "Recruiting" : "Admin"}
                </p>
              </div>
            )}
            <Link prefetch={false}
              href={adminHomePath}
              title={collapsed ? adminWorkspaceLabel : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7AD62A]/30 text-slate-300 hover:bg-white/5 hover:text-white ${collapsed ? "justify-center" : ""}`}
            >
              <Shield size={16} className="text-slate-500" />
              {!collapsed && adminWorkspaceLabel}
            </Link>
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div className={`px-3 pb-3 shrink-0 space-y-0.5 ${collapsed ? "px-2" : ""}`}>
        <div className={`flex items-center ${collapsed ? "flex-col gap-0.5" : "gap-1"}`}>
          <Link prefetch={false}
            href="/dashboard/notifications"
            title={collapsed ? "Notifications" : undefined}
            aria-current={pathname === "/dashboard/notifications" ? "page" : undefined}
            className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7AD62A]/30 ${
              pathname === "/dashboard/notifications"
                ? "bg-[#7AD62A]/10 text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            } ${collapsed ? "justify-center px-2" : "flex-1"}`}
          >
            <Bell size={16} className={pathname === "/dashboard/notifications" ? "text-[#7AD62A]" : "text-slate-500"} />
            {!collapsed && <span className="flex-1">Notifications</span>}
            {!collapsed && <NotificationBadge />}
            {collapsed && <NotificationBadge className="absolute -top-1 -right-1" />}
          </Link>
          <Link prefetch={false}
            href="/dashboard/settings"
            title={collapsed ? "Settings" : undefined}
            aria-current={pathname === "/dashboard/settings" ? "page" : undefined}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7AD62A]/30 ${
              pathname === "/dashboard/settings"
                ? "bg-[#7AD62A]/10 text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            } ${collapsed ? "justify-center px-2" : "flex-1"}`}
          >
            <Settings size={16} className={pathname === "/dashboard/settings" ? "text-[#7AD62A]" : "text-slate-500"} />
            {!collapsed && <span className="flex-1">Settings</span>}
          </Link>
        </div>
        <div className={`flex items-center justify-between px-1 ${collapsed ? "flex-col gap-1" : ""}`}>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <button
          onClick={logout}
          title={collapsed ? "Log out" : undefined}
          className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 ${collapsed ? "justify-center px-2" : ""}`}
        >
          <LogOut size={14} />
          {!collapsed && "Log out"}
        </button>
      </div>
    </aside>
  );
}
