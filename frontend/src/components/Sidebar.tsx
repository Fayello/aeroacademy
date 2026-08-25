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
  Shield,
  Award,
  Settings,
  ClipboardCheck,
  Route,
  BarChart3,
  ScrollText,
  Target,
  BookOpen,
} from "lucide-react";
import { logout } from "@/lib/auth";
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
      } catch {
        setUserRole("STUDENT");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    try {
      setXp(parseInt(localStorage.getItem("xp") || "0", 10));
    } catch {}
  }, [pathname]);

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

  const isAdmin = userRole === "ADMIN" || userRole === "RECRUITER";

  if (loading) {
    return (
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-slate-200 hidden md:flex flex-col z-50" aria-label="Main navigation">
        <div className="p-5 flex items-center gap-3">
          <img src="/logo-icon.svg" alt="XpertClass" className="w-8 h-8" />
          <div>
            <h1 className="text-sm font-bold tracking-tight">
              <span className="text-[#0F203A]">Xpert</span>
              <span className="text-[#229C62]">Class</span>
            </h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#229C62] border-t-transparent rounded-full animate-spin" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-slate-200 hidden md:flex flex-col z-50" aria-label="Main navigation">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3">
        <img src="/logo-icon.svg" alt="XpertClass" className="w-8 h-8" />
        <div>
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
      </div>

      <div className="px-3"><div className="h-px bg-slate-100" /></div>

      {/* Alerts */}
      {nav.alerts.length > 0 && (
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
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#E9F8EE] text-[#0F203A]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={16} className={isActive ? "text-[#229C62]" : "text-slate-400"} />
                <span className="truncate">{section.label}</span>
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
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#E9F8EE] text-[#0F203A]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <ItemIcon size={16} className={isActive ? "text-[#229C62]" : "text-slate-400"} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          }

          return (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#E9F8EE] text-[#0F203A]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={16} className={isActive ? "text-[#229C62]" : "text-slate-400"} />
                <span className="flex-1 text-left truncate">{section.label}</span>
                {section.items.length > 1 && (
                  <ChevronDown
                    size={12}
                    className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {section.items.length > 1 && isExpanded && (
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
            <div className="pt-2 mt-2 border-t border-slate-100">
              <p className="px-3 mb-1 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Admin</p>
            </div>
            <Link
              href="/dashboard/admin"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith("/dashboard/admin")
                  ? "bg-[#E9F8EE] text-[#0F203A]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Shield size={16} className={pathname.startsWith("/dashboard/admin") ? "text-[#229C62]" : "text-slate-400"} />
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      {/* Progress Footer */}
      <div className="px-3 pb-2 shrink-0">
        <div className="p-3 rounded-xl bg-gradient-to-br from-[#0F203A] to-[#1a3a5c] text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Level {level}</span>
            <span className="text-[10px] font-mono text-white/40">{xp.toLocaleString()} XP</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7AD62A] to-[#229C62] rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="px-3 pb-3 shrink-0 space-y-1.5">
        <Link
          href="/dashboard/profile"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/dashboard/profile" || pathname.startsWith("/dashboard/profile/")
              ? "bg-[#E9F8EE] text-[#0F203A]"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <User size={16} className={pathname.startsWith("/dashboard/profile") ? "text-[#229C62]" : "text-slate-400"} />
          Profile
        </Link>
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/dashboard/settings"
              ? "bg-[#E9F8EE] text-[#0F203A]"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Settings size={16} className={pathname === "/dashboard/settings" ? "text-[#229C62]" : "text-slate-400"} />
          Settings
        </Link>
        <div className="flex items-center px-1">
          <LanguageSwitcher />
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={14} />
          Log out
        </button>
      </div>
    </aside>
  );
}
