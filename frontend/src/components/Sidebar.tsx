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
  Lock,
  ChevronDown,
  Shield,
  Briefcase,
  Award,
  ClipboardCheck,
  Route,
  BarChart3,
  ScrollText,
  Target,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { useState, useEffect, useCallback } from "react";
import { getLevel, getSidebarItemLock } from "@/lib/levelGating";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import ThemeToggle from "@/components/ThemeToggle";

interface BucketItem {
  href: string;
  tKey: string;
  icon: typeof Home;
}

interface Bucket {
  key: string;
  tKey: string;
  icon: typeof Home;
  href: string;
  items?: BucketItem[];
  roles?: string[];
}

const BUCKETS: Bucket[] = [
  {
    key: "home",
    tKey: "bucket.home",
    icon: Home,
    href: "/dashboard",
  },
  {
    key: "learn",
    tKey: "bucket.learn",
    icon: GraduationCap,
    href: "/dashboard/courses",
    items: [
      { href: "/dashboard/courses", tKey: "bucket.courses", icon: GraduationCap },
      { href: "/dashboard/learning-paths", tKey: "bucket.paths", icon: Route },
      { href: "/dashboard/training", tKey: "bucket.masterclasses", icon: Award },
      { href: "/dashboard/analytics/competency", tKey: "bucket.assessments", icon: ClipboardCheck },
      { href: "/dashboard/curricula", tKey: "bucket.curricula", icon: ScrollText },
      { href: "/dashboard/cohorts", tKey: "bucket.cohorts", icon: Users },
      { href: "/dashboard/exams", tKey: "bucket.exams", icon: ClipboardCheck },
    ],
  },
  {
    key: "labs",
    tKey: "bucket.labs",
    icon: FlaskConical,
    href: "/dashboard/labs",
  },
  {
    key: "compete",
    tKey: "bucket.compete",
    icon: Swords,
    href: "/dashboard/leaderboard",
    items: [
      { href: "/dashboard/ranking", tKey: "bucket.ranked", icon: Shield },
      { href: "/dashboard/challenges", tKey: "bucket.challenges", icon: Target },
      { href: "/dashboard/seasons", tKey: "bucket.seasons", icon: ScrollText },
      { href: "/dashboard/leaderboard", tKey: "bucket.leaderboards", icon: Award },
      { href: "/dashboard/battle-pass", tKey: "bucket.rewards", icon: Award },
      { href: "/dashboard/boss-missions", tKey: "bucket.boss-missions", icon: Swords },
      { href: "/dashboard/my-missions", tKey: "bucket.missions", icon: Target },
    ],
  },
  {
    key: "community",
    tKey: "bucket.community",
    icon: Users,
    href: "/dashboard/teams",
    items: [
      { href: "/dashboard/teams", tKey: "bucket.teams", icon: Users },
      { href: "/dashboard/events", tKey: "bucket.events", icon: ScrollText },
    ],
  },
  {
    key: "profile",
    tKey: "bucket.profile",
    icon: User,
    href: "/dashboard/profile",
    items: [
      { href: "/dashboard/profile", tKey: "bucket.overview", icon: User },
      { href: "/dashboard/genome", tKey: "bucket.skills", icon: Target },
      { href: "/dashboard/competency", tKey: "bucket.competency", icon: BarChart3 },
      { href: "/dashboard/certifications", tKey: "bucket.certifications", icon: Award },
      { href: "/dashboard/analytics", tKey: "bucket.achievements", icon: Award },
    ],
  },
];

const ADMIN_ITEMS: BucketItem[] = [
  { href: "/dashboard/admin", tKey: "nav.admin", icon: Shield },
  { href: "/dashboard/admin/challenges", tKey: "nav.admin-challenges", icon: Target },
  { href: "/dashboard/admin/badges", tKey: "nav.admin-badges", icon: Award },
  { href: "/dashboard/admin/assessments", tKey: "nav.admin-assessments", icon: ClipboardCheck },
  { href: "/dashboard/admin/learning-paths", tKey: "nav.admin-learning-paths", icon: Route },
  { href: "/dashboard/admin/teams", tKey: "nav.admin-teams", icon: Users },
  { href: "/dashboard/admin/analytics", tKey: "analytics", icon: BarChart3 },
  { href: "/dashboard/admin/audit", tKey: "audit", icon: ScrollText },
  { href: "/dashboard/enterprise", tKey: "nav.enterprise", icon: Briefcase },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [level, setLevel] = useState(1);
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null);
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

  // Auto-expand the active bucket
  useEffect(() => {
    for (const bucket of BUCKETS) {
      if (bucket.items) {
        const isActive = bucket.items.some(
          (item) => pathname === item.href || pathname.startsWith(item.href + "/")
        );
        if (isActive) {
          setExpandedBucket(bucket.key);
          return;
        }
      }
    }
    // If on main dashboard, collapse all
    if (pathname === "/dashboard") {
      setExpandedBucket(null);
    }
  }, [pathname]);

  const toggleBucket = useCallback((key: string) => {
    setExpandedBucket((prev) => (prev === key ? null : key));
  }, []);

  const isBucketActive = (bucket: Bucket): boolean => {
    if (pathname === bucket.href) return true;
    if (bucket.items) {
      return bucket.items.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + "/")
      );
    }
    return pathname.startsWith(bucket.href + "/");
  };

  const filteredBuckets = userRole === null ? [] : BUCKETS;
  const isAdmin = userRole === "ADMIN" || userRole === "RECRUITER";

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <img src="/logo-icon.svg" alt="XpertClass" className="w-9 h-9" />
        <div>
          <h1 className="text-base font-semibold tracking-tight">
            <span className="text-[#0F203A]">Xpert</span>
            <span className="text-[#229C62]">Class</span>
          </h1>
          <p className="text-[11px] text-slate-400">{t("app.tagline")}</p>
        </div>
      </div>

      <div className="px-3">
        <div className="h-px bg-slate-100" />
      </div>

      {/* Main Navigation — 6 Buckets */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0" role="navigation" aria-label={t("nav.main")}>
        {filteredBuckets.map((bucket) => {
          const Icon = bucket.icon;
          const isActive = isBucketActive(bucket);
          const isExpanded = expandedBucket === bucket.key;
          const hasItems = bucket.items && bucket.items.length > 0;
          const gate = getSidebarItemLock(bucket.href, level);
          const isLocked = gate.locked;
          const label = t(bucket.tKey);

          return (
            <div key={bucket.key}>
              {/* Bucket Header */}
              {hasItems ? (
                <button
                  onClick={() => !isLocked && toggleBucket(bucket.key)}
                  disabled={isLocked}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isLocked
                      ? "text-slate-400 cursor-not-allowed opacity-60"
                      : isActive
                      ? "bg-[#E9F8EE] text-[#0F203A]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    size={18}
                    className={isActive && !isLocked ? "text-[#229C62]" : "text-slate-400"}
                  />
                  <span className="flex-1 text-left">{label}</span>
                  {isLocked ? (
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Lock size={10} />
                      Lv.{gate.requiredLevel}
                    </span>
                  ) : (
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>
              ) : (
                <Link
                  href={isLocked ? "#" : bucket.href}
                  aria-current={isActive ? "page" : undefined}
                  title={isLocked ? gate.reason : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isLocked
                      ? "text-slate-400 cursor-not-allowed opacity-60"
                      : isActive
                      ? "bg-[#E9F8EE] text-[#0F203A]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  onClick={(e) => {
                    if (isLocked) e.preventDefault();
                  }}
                >
                  <Icon
                    size={18}
                    className={isActive && !isLocked ? "text-[#229C62]" : "text-slate-400"}
                  />
                  <span className="flex-1">{label}</span>
                  {isLocked && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Lock size={10} />
                      Lv.{gate.requiredLevel}
                    </span>
                  )}
                </Link>
              )}

              {/* Sub-items */}
              {hasItems && isExpanded && !isLocked && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-100 pl-3">
                  {bucket.items!.map((item) => {
                    const ItemIcon = item.icon;
                    const isItemActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    const itemLabel = t(item.tKey);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isItemActive ? "page" : undefined}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                          isItemActive
                            ? "bg-[#E9F8EE] text-[#0F203A]"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                      >
                        <ItemIcon
                          size={14}
                          className={isItemActive ? "text-[#229C62]" : "text-slate-400"}
                        />
                        {itemLabel}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="pt-3 mt-3 border-t border-slate-100">
              <p className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Admin
              </p>
            </div>
            {ADMIN_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const label = t(item.tKey);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-[#E9F8EE] text-[#0F203A]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  <Icon
                    size={16}
                    className={isActive ? "text-[#229C62]" : "text-slate-400"}
                  />
                  {label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
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
