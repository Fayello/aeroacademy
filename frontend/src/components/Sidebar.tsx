"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  GraduationCap,
  FlaskConical,
  Swords,
  Users,
  User,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Shield,
  Award,
  Flame,
  Settings,
  ClipboardCheck,
  Route,
  BarChart3,
  ScrollText,
  Target,
  BookOpen,
  Bell,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { fetchApi } from "@/lib/api";
import ThemeToggle from "@/components/ui/ThemeToggle";
import NotificationBadge from "@/components/ui/NotificationBadge";
import { useState, useEffect, useCallback, useMemo } from "react";
import { getLevel, getLevelProgress } from "@/lib/levelGating";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import { useNavigation, type NavItem, type NavSection } from "@/lib/navigation";

const ICON_MAP: Record<string, typeof Home> = {
  Home,
  GraduationCap,
  FlaskConical,
  Swords,
  Users,
  User,
  Shield,
  Award,
  ClipboardCheck,
  Route,
  BarChart3,
  ScrollText,
  Target,
  BookOpen,
};

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [division, setDivision] = useState("Bronze");
  const [collapsed, setCollapsed] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "true");
  }, []);
  const { t } = useI18n();
  const { nav, loading } = useNavigation();

  const level = getLevel(xp);
  const progress = getLevelProgress(xp);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) setUserRole(JSON.parse(stored).role || "STUDENT");
        else setUserRole("STUDENT");
        setXp(parseInt(localStorage.getItem("xp") || "0", 10));
        setDivision(localStorage.getItem("division") || "Bronze");
      } catch {
        setUserRole("STUDENT");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    try {
      setXp(parseInt(localStorage.getItem("xp") || "0", 10));
      setDivision(localStorage.getItem("division") || "Bronze");
    } catch {}
  }, [pathname]);

  useEffect(() => {
    fetchApi<{ currentStreak: number }>("/dashboard/streak")
      .then((data) => setStreak(data.currentStreak || 0))
      .catch(() => {});
  }, []);

  // Build sections from navigation context
  const sections = useMemo(() => {
    return nav.sections;
  }, [nav]);

  useEffect(() => {
    for (const section of sections) {
      if (section.items) {
        const isActive = section.items.some(
          (item) => pathname === item.href || pathname.startsWith(item.href + "/")
        );
        if (isActive) {
          setExpandedSection(section.id);
          return;
        }
      }
    }
    if (pathname === "/dashboard") {
      setExpandedSection(null);
    }
  }, [pathname, sections]);

  const toggleSection = useCallback((id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const handleToggle = () => {
      setCollapsed(localStorage.getItem("sidebar-collapsed") === "true");
    };
    window.addEventListener("sidebar-toggle", handleToggle);
    return () => window.removeEventListener("sidebar-toggle", handleToggle);
  }, []);

  const isAdmin = userRole === "ADMIN" || userRole === "RECRUITER";

  if (loading) {
    return (
    <aside className={`fixed left-0 top-12 bottom-0 bg-white border-r border-slate-200 hidden md:flex flex-col z-50 transition-all duration-300 overflow-hidden ${collapsed ? "w-16" : "w-60"}`} aria-label="Main navigation">
      <div className="absolute inset-0 angular-grid-bg opacity-[0.03] pointer-events-none" />
      <div className="absolute inset-0 scanline-overlay pointer-events-none" />
        <div className="p-5 flex items-center gap-3">
          <img src="/logo-icon.svg" alt="XpertClass" className="w-8 h-8 shrink-0" />
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold tracking-tight">
                <span className="text-[#0F203A]">Xpert</span>
                <span className="text-[#229C62]">Class</span>
              </h1>
            </div>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#229C62] border-t-transparent rounded-full animate-spin" />
        </div>
      </aside>
    );
  }

  const divisionLabel = division || "Bronze";
  const seasonWeek = 14;

  return (
      <aside className={`fixed left-0 top-14 bottom-0 bg-white border-r border-slate-200 hidden md:flex flex-col z-50 transition-all duration-300 overflow-hidden ${collapsed ? "w-16" : "w-60"}`} aria-label="Main navigation">
        <div className="absolute inset-0 angular-grid-bg opacity-[0.03] pointer-events-none" />
      {/* Logo */}
      <div className={`flex items-center gap-3 ${collapsed ? "p-3 justify-center" : "p-5"}`}>
        <img src="/logo-icon.svg" alt="XpertClass" className="w-8 h-8 shrink-0" />
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold tracking-tight">
              <span className="text-[#0F203A]">Xpert</span>
              <span className="text-[#229C62]">Class</span>
            </h1>
            {nav.experience !== "INDIVIDUAL" && (
              <span className="text-[9px] font-semibold text-[#229C62] bg-[#E9F8EE] px-1.5 py-0.5 rounded uppercase tracking-wider">
                {nav.experience === "UNIVERSITY" ? "University" : nav.experience === "CORPORATE" ? "Enterprise" : nav.experience === "INSTRUCTOR" ? "Instructor" : nav.experience}
              </span>
            )}
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="px-3"><div className="h-px bg-slate-100" /></div>

      {/* ─── PROGRESS CARD (always visible at top) ─── */}
      {!collapsed ? (
        <div className="mx-3 mt-3 p-3.5 rounded-xl bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#1a3a5c] text-white relative overflow-hidden">
          <div className="absolute inset-0 dot-grid-bg opacity-[0.06] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Award size={14} className="text-[#7AD62A]" />
                <span className="text-xs font-bold text-white">Beginner Lv{level}</span>
              </div>
              <span className="text-[10px] font-mono text-white/40">{xp.toLocaleString()} XP</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-[#7AD62A] to-[#229C62] rounded-full transition-all duration-500"
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
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-medium">{divisionLabel}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-1.5 mt-2 p-2 rounded-xl bg-gradient-to-br from-[#0F203A] to-[#1a3a5c] flex items-center justify-center" title={`Level ${level} — ${xp.toLocaleString()} XP — ${divisionLabel}`}>
          <Award size={16} className="text-[#7AD62A]" />
        </div>
      )}

      {/* Alerts */}
      {!collapsed && nav.alerts.length > 0 && (
        <div className="px-3 pt-3 space-y-1">
          {nav.alerts.slice(0, 1).map((alert, i) => {
            const AlertIcon = alert.type === "EXAM_AVAILABLE" ? ClipboardCheck : Users;
            return (
              <Link
                key={i}
                href={alert.href || "#"}
                className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <AlertIcon size={12} className="text-amber-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-amber-800 truncate">{alert.title}</p>
                  <p className="text-[9px] text-amber-600 truncate">{alert.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto min-h-0">
        {sections.map((section) => {
          // Dashboard is a single link, not expandable
          if (section.id === "dashboard") {
            const item = section.items[0];
            const Icon = ICON_MAP[item.icon] || Home;
            const isActive = pathname === item.href;

            return (
              <Link
                key={section.id}
                href={item.href}
                title={collapsed ? section.label : undefined}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#E9F8EE] text-[#0F203A]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon size={16} className={isActive ? "text-[#229C62]" : "text-slate-400"} />
                {!collapsed && <span className="truncate">{section.label}</span>}
              </Link>
            );
          }

          // Section with items
          const firstItem = section.items[0];
          const Icon = ICON_MAP[firstItem?.icon] || Target;
          const isActive = section.items.some(
            (item) => pathname === item.href || pathname.startsWith(item.href + "/")
          );
          const isExpanded = expandedSection === section.id;

          // Single-item sections render as direct links
          if (section.items.length === 1) {
            const item = section.items[0];
            const ItemIcon = ICON_MAP[item.icon] || Target;
            return (
              <Link
                key={section.id}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#E9F8EE] text-[#0F203A]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <ItemIcon size={16} className={isActive ? "text-[#229C62]" : "text-slate-400"} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          }

          return (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                title={collapsed ? section.label : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#E9F8EE] text-[#0F203A]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon size={16} className={isActive ? "text-[#229C62]" : "text-slate-400"} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{section.label}</span>
                    {section.items.length > 1 && (
                      <ChevronDown
                        size={12}
                        className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    )}
                  </>
                )}
              </button>

              {!collapsed && section.items.length > 1 && isExpanded && (
                <div className="ml-4 mt-0.5 mb-1 space-y-0.5 border-l border-slate-100 pl-3">
                  {section.items.map((item) => {
                    const ItemIcon = ICON_MAP[item.icon] || Target;
                    const isItemActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                          isItemActive
                            ? "bg-[#E9F8EE] text-[#0F203A]"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                      >
                        <ItemIcon size={12} className={isItemActive ? "text-[#229C62]" : "text-slate-400"} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Admin */}
        {isAdmin && (
          <>
            {!collapsed && (
              <div className="pt-2 mt-2 border-t border-slate-100">
                <p className="px-3 mb-1 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Admin</p>
              </div>
            )}
            <Link
              href="/dashboard/admin"
              title={collapsed ? "Admin Panel" : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith("/dashboard/admin")
                  ? "bg-[#E9F8EE] text-[#0F203A]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Shield size={16} className={pathname.startsWith("/dashboard/admin") ? "text-[#229C62]" : "text-slate-400"} />
              {!collapsed && "Admin Panel"}
            </Link>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className={`px-3 pb-3 shrink-0 space-y-1.5 ${collapsed ? "px-2" : ""}`}>
        <Link
          href="/dashboard/notifications"
          title={collapsed ? "Notifications" : undefined}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/dashboard/notifications"
              ? "bg-[#E9F8EE] text-[#0F203A]"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          } ${collapsed ? "justify-center px-2" : ""}`}
        >
          <Bell size={16} className={pathname === "/dashboard/notifications" ? "text-[#229C62]" : "text-slate-400"} />
          {!collapsed && (
            <>
              <span className="flex-1">Notifications</span>
              <NotificationBadge />
            </>
          )}
          {collapsed && <NotificationBadge className="absolute -top-1 -right-1" />}
        </Link>
        <Link
          href="/dashboard/profile"
          title={collapsed ? "Profile" : undefined}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/dashboard/profile" || pathname.startsWith("/dashboard/profile/")
              ? "bg-[#E9F8EE] text-[#0F203A]"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          } ${collapsed ? "justify-center px-2" : ""}`}
        >
          <User size={16} className={pathname.startsWith("/dashboard/profile") ? "text-[#229C62]" : "text-slate-400"} />
          {!collapsed && "Profile"}
        </Link>
        <Link
          href="/dashboard/settings"
          title={collapsed ? "Settings" : undefined}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/dashboard/settings"
              ? "bg-[#E9F8EE] text-[#0F203A]"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          } ${collapsed ? "justify-center px-2" : ""}`}
        >
          <Settings size={16} className={pathname === "/dashboard/settings" ? "text-[#229C62]" : "text-slate-400"} />
          {!collapsed && "Settings"}
        </Link>
        <div className={`flex items-center justify-between px-1 ${collapsed ? "flex-col gap-1" : ""}`}>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <button
          onClick={logout}
          title={collapsed ? "Log out" : undefined}
          className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors ${collapsed ? "justify-center px-2" : ""}`}
        >
          <LogOut size={14} />
          {!collapsed && "Log out"}
        </button>
      </div>
    </aside>
  );
}
