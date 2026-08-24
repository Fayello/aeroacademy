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
  Bell,
  Info,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import { useNavigation, type NavItem } from "@/lib/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const ICON_MAP: Record<string, typeof Home> = {
  Home,
  GraduationCap,
  FlaskConical,
  Swords,
  Users,
  User,
  Shield,
  Briefcase,
  Award,
  ClipboardCheck,
  Route,
  BarChart3,
  ScrollText,
  Target,
  Bell,
  Info,
};

interface BucketDef {
  key: string;
  tKey: string;
  icon: typeof Home;
  href: string;
  items?: NavItem[];
}

const ADMIN_ITEMS: NavItem[] = [
  { href: "/dashboard/admin", tKey: "nav.admin", icon: "Shield", label: "Admin" },
  { href: "/dashboard/admin/challenges", tKey: "nav.admin-challenges", icon: "Target", label: "Challenges" },
  { href: "/dashboard/admin/badges", tKey: "nav.admin-badges", icon: "Award", label: "Badges" },
  { href: "/dashboard/admin/assessments", tKey: "nav.admin-assessments", icon: "ClipboardCheck", label: "Assessments" },
  { href: "/dashboard/admin/learning-paths", tKey: "nav.admin-learning-paths", icon: "Route", label: "Learning Paths" },
  { href: "/dashboard/admin/teams", tKey: "nav.admin-teams", icon: "Users", label: "Teams" },
  { href: "/dashboard/admin/analytics", tKey: "analytics", icon: "BarChart3", label: "Analytics" },
  { href: "/dashboard/admin/audit", tKey: "audit", icon: "ScrollText", label: "Audit" },
  { href: "/dashboard/enterprise", tKey: "nav.enterprise", icon: "Briefcase", label: "Enterprise" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null);
  const { t } = useI18n();
  const { nav, loading } = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) setUserRole(JSON.parse(stored).role || "STUDENT");
        else setUserRole("STUDENT");
      } catch {
        setUserRole("STUDENT");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const buckets: BucketDef[] = useMemo(() => {
    const b: BucketDef[] = [
      { key: "home", tKey: "bucket.home", icon: Home, href: "/dashboard" },
    ];

    if (nav.learnItems.length > 0) {
      b.push({
        key: "learn",
        tKey: "bucket.learn",
        icon: GraduationCap,
        href: "/dashboard/courses",
        items: nav.learnItems,
      });
    }

    b.push({ key: "labs", tKey: "bucket.labs", icon: FlaskConical, href: "/dashboard/labs" });

    if (nav.showCompete && nav.competeItems.length > 0) {
      b.push({
        key: "compete",
        tKey: "bucket.compete",
        icon: Swords,
        href: "/dashboard/leaderboard",
        items: nav.competeItems,
      });
    }

    if (nav.showCommunity && nav.communityItems.length > 0) {
      b.push({
        key: "community",
        tKey: "bucket.community",
        icon: Users,
        href: "/dashboard/teams",
        items: nav.communityItems,
      });
    }

    b.push({
      key: "profile",
      tKey: "bucket.profile",
      icon: User,
      href: "/dashboard/profile",
      items: nav.profileItems,
    });

    return b;
  }, [nav]);

  useEffect(() => {
    for (const bucket of buckets) {
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
    if (pathname === "/dashboard") {
      setExpandedBucket(null);
    }
  }, [pathname, buckets]);

  const toggleBucket = useCallback((key: string) => {
    setExpandedBucket((prev) => (prev === key ? null : key));
  }, []);

  const isBucketActive = (bucket: BucketDef): boolean => {
    if (pathname === bucket.href) return true;
    if (bucket.items) {
      return bucket.items.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + "/")
      );
    }
    return pathname.startsWith(bucket.href + "/");
  };

  const isAdmin = userRole === "ADMIN" || userRole === "RECRUITER";

  if (loading) {
    return (
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-50">
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
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#229C62] border-t-transparent rounded-full animate-spin" />
        </div>
      </aside>
    );
  }

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

      {/* Experience Badge */}
      {nav.experience !== "INDIVIDUAL" && (
        <div className="px-4 pb-2">
          <span className="text-[10px] font-semibold text-[#229C62] bg-[#E9F8EE] px-2 py-0.5 rounded-full uppercase tracking-wider">
            {nav.experience === "UNIVERSITY" ? "University" : nav.experience === "CORPORATE" ? "Enterprise" : nav.experience === "INSTRUCTOR" ? "Instructor" : nav.experience}
          </span>
        </div>
      )}

      <div className="px-3">
        <div className="h-px bg-slate-100" />
      </div>

      {/* Alerts */}
      {nav.alerts.length > 0 && (
        <div className="px-3 pt-3 space-y-1.5">
          {nav.alerts.slice(0, 2).map((alert, i) => {
            const AlertIcon = alert.type === "EXAM_AVAILABLE" ? ClipboardCheck : Users;
            return (
              <Link
                key={i}
                href={alert.href || "#"}
                className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <AlertIcon size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-amber-800 truncate">{alert.title}</p>
                  <p className="text-[10px] text-amber-600 truncate">{alert.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0" role="navigation" aria-label={t("nav.main")}>
        {buckets.map((bucket) => {
          const Icon = bucket.icon;
          const isActive = isBucketActive(bucket);
          const isExpanded = expandedBucket === bucket.key;
          const hasItems = bucket.items && bucket.items.length > 0;
          const label = t(bucket.tKey);

          return (
            <div key={bucket.key}>
              {hasItems ? (
                <button
                  onClick={() => toggleBucket(bucket.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-[#E9F8EE] text-[#0F203A]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    size={18}
                    className={isActive ? "text-[#229C62]" : "text-slate-400"}
                  />
                  <span className="flex-1 text-left">{label}</span>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
              ) : (
                <Link
                  href={bucket.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-[#E9F8EE] text-[#0F203A]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    size={18}
                    className={isActive ? "text-[#229C62]" : "text-slate-400"}
                  />
                  <span className="flex-1">{label}</span>
                </Link>
              )}

              {hasItems && isExpanded && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-100 pl-3">
                  {bucket.items!.map((item) => {
                    const ItemIcon = ICON_MAP[item.icon] || Target;
                    const isItemActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href));

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
                        {item.label}
                        {item.badge && (
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-auto">
                            {item.badge}
                          </span>
                        )}
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
              const Icon = ICON_MAP[item.icon] || Shield;
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
