"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  FlaskConical,
  Swords,
  Users,
  User,
  LogOut,
  ChevronDown,
  Shield,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { useState, useEffect, useCallback, useMemo } from "react";
import { getLevel, getLevelProgress } from "@/lib/levelGating";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import { useNavigation, type NavItem } from "@/lib/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const ICON_MAP: Record<string, typeof Home> = {
  Home, BookOpen, FlaskConical, Swords, Users, User, Shield,
  Route: BookOpen, GraduationCap: BookOpen, Award: Shield,
  ClipboardCheck: Shield, ScrollText: BookOpen, Target: Shield, BarChart3: Shield,
};

interface World {
  key: string;
  label: string;
  icon: typeof Home;
  href: string;
  items?: NavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [expandedWorld, setExpandedWorld] = useState<string | null>(null);
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
      } catch { setUserRole("STUDENT"); }
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    try { setXp(parseInt(localStorage.getItem("xp") || "0", 10)); } catch {}
  }, [pathname]);

  const worlds = useMemo(() => {
    const isAdmin = userRole === "ADMIN" || userRole === "RECRUITER";
    const isInstructor = nav.experience === "INSTRUCTOR";
    const w: World[] = [];

    if (isAdmin) {
      w.push(
        { key: "dashboard", label: "Command Center", icon: Home, href: "/dashboard" },
        { key: "platform", label: "Platform", icon: Shield, href: "/dashboard/admin" },
      );
      return w;
    }

    if (isInstructor) {
      w.push(
        { key: "dashboard", label: "Command Center", icon: Home, href: "/dashboard" },
        { key: "learn", label: "Teach", icon: BookOpen, href: "/dashboard/curricula", items: nav.learnItems },
        { key: "practice", label: "Practice", icon: FlaskConical, href: "/dashboard/labs", items: nav.practiceItems },
      );
      return w;
    }

    w.push({ key: "dashboard", label: "Command Center", icon: Home, href: "/dashboard" });

    if (nav.learnItems.length > 0) {
      w.push({ key: "learn", label: "Learn", icon: BookOpen, href: "/dashboard/courses", items: nav.learnItems });
    }
    if (nav.practiceItems.length > 0) {
      w.push({ key: "practice", label: "Practice", icon: FlaskConical, href: "/dashboard/labs", items: nav.practiceItems });
    }
    if (nav.showCompete && nav.competeItems.length > 0) {
      w.push({ key: "compete", label: "Compete", icon: Swords, href: "/dashboard/leaderboard", items: nav.competeItems });
    }
    if (nav.showCommunity && nav.communityItems.length > 0) {
      w.push({ key: "community", label: "Community", icon: Users, href: "/dashboard/teams", items: nav.communityItems });
    }
    return w;
  }, [nav, userRole]);

  useEffect(() => {
    for (const world of worlds) {
      if (world.items) {
        const isActive = world.items.some(
          (item) => pathname === item.href || pathname.startsWith(item.href + "/")
        );
        if (isActive) { setExpandedWorld(world.key); return; }
      }
    }
    if (pathname === "/dashboard") setExpandedWorld(null);
  }, [pathname, worlds]);

  const toggleWorld = useCallback((key: string) => {
    setExpandedWorld((prev) => (prev === key ? null : key));
  }, []);

  if (loading) {
    return (
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-slate-200 hidden md:flex flex-col z-50">
        <div className="p-5 flex items-center gap-3">
          <img src="/logo-icon.svg" alt="XpertClass" className="w-8 h-8" />
          <h1 className="text-sm font-bold tracking-tight"><span className="text-[#0F203A]">Xpert</span><span className="text-[#229C62]">Class</span></h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#229C62] border-t-transparent rounded-full animate-spin" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-slate-200 hidden md:flex flex-col z-50">
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
          {nav.alerts.slice(0, 1).map((alert, i) => (
            <Link key={i} href={alert.href || "#"} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-amber-800 truncate">{alert.title}</p>
                <p className="text-[9px] text-amber-600 truncate">{alert.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Main Nav — 5 Worlds */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto min-h-0">
        {worlds.map((world) => {
          const Icon = world.icon;
          const isActive = pathname === world.href || (world.items?.some(
            (item) => pathname === item.href || pathname.startsWith(item.href + "/")
          ) ?? false);
          const isExpanded = expandedWorld === world.key;
          const hasItems = world.items && world.items.length > 0;

          return (
            <div key={world.key}>
              {hasItems ? (
                <button onClick={() => toggleWorld(world.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-[#E9F8EE] text-[#0F203A]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                  <Icon size={16} className={isActive ? "text-[#229C62]" : "text-slate-400"} />
                  <span className="flex-1 text-left">{world.label}</span>
                  <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <Link href={world.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-[#E9F8EE] text-[#0F203A]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                  <Icon size={16} className={isActive ? "text-[#229C62]" : "text-slate-400"} />
                  <span className="flex-1">{world.label}</span>
                </Link>
              )}
              {hasItems && isExpanded && (
                <div className="ml-4 mt-0.5 mb-1 space-y-0.5 border-l border-slate-100 pl-3">
                  {world.items!.map((item) => {
                    const ItemIcon = ICON_MAP[item.icon] || Shield;
                    const isItemActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                      <Link key={item.href} href={item.href}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] font-medium transition-colors ${isItemActive ? "bg-[#E9F8EE] text-[#0F203A]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}>
                        <ItemIcon size={12} className={isItemActive ? "text-[#229C62]" : "text-slate-400"} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Progress Footer */}
      <div className="px-3 pb-2 shrink-0">
        <div className="p-3 rounded-xl bg-gradient-to-br from-[#0F203A] to-[#1a3a5c] text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Level {level}</span>
            <span className="text-[10px] font-mono text-white/40">{xp.toLocaleString()} XP</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#7AD62A] to-[#229C62] rounded-full transition-all duration-500" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="px-3 pb-3 shrink-0 space-y-1.5">
        <Link href="/dashboard/profile"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === "/dashboard/profile" || pathname.startsWith("/dashboard/profile/") ? "bg-[#E9F8EE] text-[#0F203A]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
          <User size={16} className={pathname.startsWith("/dashboard/profile") ? "text-[#229C62]" : "text-slate-400"} />
          Profile
        </Link>
        <div className="flex items-center justify-between px-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <button onClick={logout} className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut size={14} />
          Log out
        </button>
      </div>
    </aside>
  );
}
