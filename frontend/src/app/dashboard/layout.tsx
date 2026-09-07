"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, Bell, ChevronRight, CheckCheck, Loader2, LogOut, Settings, User as UserIcon, Zap } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import Sidebar from "@/components/Sidebar";
import LearningCoach from "@/components/ai/LearningCoach";
import PageErrorBoundary from "@/components/PageErrorBoundary";
import { DashboardSocketProvider } from "@/hooks/DashboardSocketContext";
import { DisplayModeProvider } from "@/lib/displayMode";
import { NavigationProvider } from "@/lib/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CurrencySwitcher from "@/components/ui/CurrencySwitcher";
import { fetchApi, initTokenRefresh } from "@/lib/api";
import { logout } from "@/lib/auth";
import { hasCompletedOnboarding, syncOnboardingFromProfile } from "@/lib/onboarding";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationTypeIcon } from "@/components/NotificationTypeIcon";
import { timeAgo } from "@/lib/format";
import { useNavigation } from "@/lib/navigation";
import { GraduationCap, Shield } from "lucide-react";
import ViewSwitcher from "@/components/dashboard/ViewSwitcher";
import type { NotificationItem } from "@/types/api";

function TokenHandler() {
  useEffect(() => {
    initTokenRefresh();

    const params = new URLSearchParams(window.location.search);
    if (params.has("token") || params.has("refresh_token")) {
      params.delete("token");
      params.delete("refresh_token");
      const cleanQuery = params.toString();
      window.history.replaceState(
        null,
        "",
        cleanQuery ? `/dashboard?${cleanQuery}` : "/dashboard",
      );
    }
  }, []);

  return null;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { nav, loading: navLoading } = useNavigation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyOnboarding() {
      if (navLoading) return;

      const onPrivilegedRoute =
        pathname.startsWith("/dashboard/admin") ||
        pathname.startsWith("/dashboard/enterprise");
      const shouldBypassOnboarding =
        (onPrivilegedRoute && nav.canAccessAdminView) ||
        (nav.canAccessAdminView && nav.viewMode === "ADMIN");

      if (shouldBypassOnboarding) {
        if (!cancelled) setChecked(true);
        return;
      }

      if (hasCompletedOnboarding()) {
        setChecked(true);
        return;
      }

      try {
        const profile = await fetchApi<{ preference?: { onboardingCompleted?: boolean; onboardingSelections?: unknown } | null }>("/auth/me");
        syncOnboardingFromProfile(profile);
        if (!cancelled && hasCompletedOnboarding()) {
          setChecked(true);
          return;
        }
      } catch {
        // If profile hydration fails, continue to onboarding where auth handling can recover.
      }

      if (!cancelled) {
        router.replace("/onboarding");
      }
    }

    verifyOnboarding();
    return () => { cancelled = true; };
  }, [nav.canAccessAdminView, nav.viewMode, navLoading, pathname, router]);

  if (navLoading || !checked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#7AD62A]" size={28} />
      </div>
    );
  }
  return <>{children}</>;
}

function DashboardHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const router = useRouter();
  const { nav } = useNavigation();
  const [user, setUser] = useState<{ name?: string; avatarUrl?: string } | null>(null);
  const [shortcutKey, setShortcutKey] = useState("Ctrl");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [xp, setXp] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const { notifications, unread, loading, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    try {
      setXp(parseInt(localStorage.getItem("xp") || "0", 10));
    } catch {}
    if (typeof navigator !== "undefined") {
      setShortcutKey(/Mac|iPhone|iPad|iPod/.test(navigator.platform) ? "⌘" : "Ctrl");
    }
  }, []);

  // Ctrl+/ keyboard shortcut for search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleNotifClick = (n: NotificationItem) => {
    if (!n.read) void markRead(n.id);
    setNotifOpen(false);
    if (n.link) router.push(n.link);
  };

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const level = Math.floor(xp / 1000) + 1;
  const isPrivilegedUser = nav.canAccessAdminView;
  const viewLabel =
    nav.viewMode === "ADMIN"
      ? nav.adminViewLabel || "Admin View"
      : "Learner View";
  const viewHint =
    nav.viewMode === "ADMIN"
      ? nav.role === "RECRUITER"
        ? "Talent pipeline and institutional outreach"
        : "Operations and control"
      : "Courses, labs, and personal progress";
  const ViewIcon = nav.viewMode === "ADMIN" ? Shield : GraduationCap;
  const viewAccent =
    nav.viewMode === "ADMIN"
      ? "border-[#7AD62A]/20 bg-[#7AD62A]/10 text-[#7AD62A]"
      : "border-blue-400/20 bg-blue-400/10 text-blue-300";
  const searchPlaceholder =
    nav.viewMode === "ADMIN"
      ? nav.role === "RECRUITER"
        ? "Search talent pipeline..."
        : "Search admin workspace..."
      : "Search courses...";
  const searchAriaLabel =
    nav.viewMode === "ADMIN"
      ? nav.role === "RECRUITER"
        ? "Search talent pipeline"
        : "Search admin workspace"
      : "Search course catalog";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/6 bg-[#0a0f1a] px-3 py-2 md:h-12 md:px-3 md:pl-64 md:py-0 relative overflow-hidden safe-area-pt">
      <div className="absolute inset-0 angular-grid-bg opacity-[0.02] pointer-events-none" />
      <div className="relative flex flex-col gap-2.5 md:flex-row md:items-center md:gap-2">
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7AD62A]/10 border border-[#7AD62A]/20">
              <Zap size={14} className="text-[#7AD62A]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Dashboard</p>
              <p className="truncate text-xs text-slate-400">{viewHint}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isPrivilegedUser && (
              <div className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 ${viewAccent}`}>
                <ViewIcon size={11} />
                <span className="text-[10px] font-semibold">{viewLabel}</span>
              </div>
            )}
            <div className="hidden sm:block md:hidden">
              <ViewSwitcher compact />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-[#7AD62A]/20 bg-[#7AD62A]/10 px-2 py-1">
              <Zap size={11} className="text-[#7AD62A]" />
              <span className="text-[10px] font-bold text-white">{xp.toLocaleString()}</span>
              <span className="text-[9px] font-medium text-[#7AD62A]">Lv{level}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>

        {/* Search with Ctrl+/ hint */}
        <div className="flex-1 max-w-none md:max-w-lg md:mx-auto">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchRef}
              type="text"
              placeholder={searchPlaceholder}
              aria-label={searchAriaLabel}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchValue.trim()) {
                  if (nav.viewMode === "ADMIN" && nav.role === "RECRUITER") {
                    router.push(`/dashboard/enterprise?search=${encodeURIComponent(searchValue.trim())}`);
                  } else if (nav.viewMode === "ADMIN") {
                    router.push(nav.adminHomePath || "/dashboard/admin");
                  } else {
                    router.push(`/dashboard/courses?q=${encodeURIComponent(searchValue.trim())}`);
                  }
                  setSearchValue("");
                  searchRef.current?.blur();
                }
              }}
              className="w-full h-9 md:h-8 pl-8 pr-4 md:pr-14 rounded-lg bg-white/5 border border-transparent focus:border-[#7AD62A] focus:bg-white/8 focus:outline-none text-sm text-slate-200 placeholder:text-slate-500 transition-colors"
            />
            <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 pointer-events-none md:flex">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white/5 border border-white/10 rounded shadow-sm">{shortcutKey}</kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white/5 border border-white/10 rounded shadow-sm">/</kbd>
            </div>
          </div>
          <p className="mt-1 px-1 text-[10px] text-slate-500 md:hidden">
            {nav.viewMode === "ADMIN"
              ? nav.role === "RECRUITER"
                ? "Search recruiting workspaces and press Enter to open the talent view."
                : "Search the admin workspace and press Enter to open the control surface."
              : "Search courses and press Enter to open the catalog results."}
          </p>
        </div>

        <div className="flex items-center justify-end gap-1.5 md:justify-start">
        {/* XP Counter */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#7AD62A]/10 border border-[#7AD62A]/20">
          <Zap size={12} className="text-[#7AD62A]" />
          <span className="text-xs font-bold text-white">{xp.toLocaleString()}</span>
          <span className="text-[10px] text-[#7AD62A] font-medium">Lv{level}</span>
        </div>

        <div className="hidden md:block">
          <ViewSwitcher compact />
        </div>

        {isPrivilegedUser && (
          <div className={`hidden lg:inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${viewAccent}`}>
            <ViewIcon size={12} />
            <span className="text-xs font-semibold">{viewLabel}</span>
          </div>
        )}

        {/* Edit Profile CTA */}
        <Link prefetch={false}
          href="/dashboard/profile/edit"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] text-xs font-bold transition-colors shadow-sm shadow-[#7AD62A]/20"
        >
          Edit Profile
        </Link>

        <div className="hidden sm:block">
          <CurrencySwitcher />
        </div>

        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
            className="relative flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 sm:h-8 sm:min-w-0 sm:border-0 sm:bg-transparent sm:px-0"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#7AD62A] text-[#0F203A] text-[8px] font-bold flex items-center justify-center">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-1rem))] sm:w-96 bg-[#0f172a] border border-white/10 rounded-xl shadow-lg overflow-hidden animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/6">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  {unread > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#7AD62A]/10 text-[#7AD62A] text-[10px] font-semibold">
                      {unread} new
                    </span>
                  )}
                </div>
                <button
                  onClick={() => void markAllRead()}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#7AD62A] font-medium"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={20} className="animate-spin text-slate-500" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell size={24} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-sm text-slate-400">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-white/5 transition-colors border-b border-white/4 last:border-0 ${
                        !n.read ? "bg-[#7AD62A]/5" : ""
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        <NotificationTypeIcon type={n.type} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-200 truncate">
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7AD62A] shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-slate-600 shrink-0 self-center" />
                    </button>
                  ))
                )}
              </div>

              <Link prefetch={false}
                href="/dashboard/notifications"
                onClick={() => setNotifOpen(false)}
                className="block text-center px-4 py-3 text-sm font-medium text-[#7AD62A] hover:bg-[#7AD62A]/10 border-t border-white/6"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 transition-colors hover:bg-white/5 sm:border-0 sm:bg-transparent sm:px-1"
            aria-label="User menu"
          >
            {user?.avatarUrl ? (
              <Image src={user.avatarUrl} alt="" width={28} height={28} unoptimized className="w-7 h-7 rounded-full object-cover border border-white/10" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0F203A] to-[#1a3a5c] flex items-center justify-center text-white text-[10px] font-bold border border-white/10">
                {initials}
              </div>
            )}
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#0f172a] border border-white/10 rounded-xl shadow-lg overflow-hidden animate-in fade-in duration-150">
              <Link prefetch={false}
                href="/dashboard/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 transition-colors"
              >
                <UserIcon size={16} className="text-slate-400" />
                Profile
              </Link>
              <Link prefetch={false}
                href="/dashboard/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 transition-colors"
              >
                <Settings size={16} className="text-slate-400" />
                Settings
              </Link>
              <div className="border-t border-white/6" />
              <button
                onClick={() => { setUserMenuOpen(false); logout(); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </header>
  );
}

function DashboardModeBanner() {
  const pathname = usePathname();
  const { nav } = useNavigation();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try { setDismissed(localStorage.getItem("dashboard-banner-dismissed") === "true"); } catch {}
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem("dashboard-banner-dismissed", "true"); } catch {}
  };

  const isPrivilegedUser = nav.canAccessAdminView;

  if (!isPrivilegedUser) return null;
  if (dismissed && nav.viewMode !== "ADMIN") return null;

  const adminMode = nav.viewMode === "ADMIN";
  const Icon = adminMode ? Shield : GraduationCap;
  const accentClasses = adminMode
    ? "border-[#7AD62A]/20 bg-gradient-to-r from-[#7AD62A]/12 via-[#7AD62A]/6 to-transparent"
    : "border-blue-400/20 bg-gradient-to-r from-blue-400/12 via-blue-400/6 to-transparent";
  const iconClasses = adminMode
    ? "border-[#7AD62A]/20 bg-[#7AD62A]/12 text-[#7AD62A]"
    : "border-blue-400/20 bg-blue-400/12 text-blue-300";
  const badgeClasses = adminMode
    ? "border-[#7AD62A]/20 bg-[#7AD62A]/12 text-[#7AD62A]"
    : "border-blue-400/20 bg-blue-400/12 text-blue-200";
  const title = adminMode
    ? `${nav.adminViewLabel || "Admin Workspace"} active`
    : "Learner View active";
  const description = adminMode
    ? nav.role === "RECRUITER"
      ? "You are in the recruiting workspace. Navigation now prioritizes talent discovery, inquiries, and community pipeline work."
      : "You are in platform operations. Links, breadcrumbs, and actions are now admin-scoped."
    : "You are in learner space. Courses, labs, and personal progress are prioritized here.";
  const destinationHref = adminMode ? "/dashboard" : nav.adminHomePath || "/dashboard/admin";
  const destinationLabel = adminMode ? "Go to learner workspace" : `Open ${nav.adminViewLabel || "admin workspace"}`;
  const inAdminWorkspace =
    pathname.startsWith("/dashboard/admin") || pathname.startsWith("/dashboard/enterprise");
  const routeHint = inAdminWorkspace
    ? `Current route: ${nav.adminViewLabel || "admin workspace"}`
    : "Current route: learner workspace";

  return (
    <div className={`mb-4 flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:px-5 ${accentClasses}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconClasses}`}>
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white">{title}</p>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${badgeClasses}`}>
                {adminMode ? (nav.role === "RECRUITER" ? "Recruiting" : "Admin") : "Learner"}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-300">{description}</p>
          </div>
        </div>

        <Link prefetch={false}
          href={destinationHref}
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-100 transition-colors hover:bg-white/8"
        >
          {destinationLabel}
        </Link>
        {!adminMode && (
          <button onClick={dismiss} className="text-[11px] text-slate-400 hover:text-white transition-colors ml-2 shrink-0">
            Dismiss
          </button>
        )}
      </div>

      <p className="text-[11px] font-medium text-slate-400">{routeHint}</p>
    </div>
  );
}

function DashboardRoleGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { nav, loading } = useNavigation();

  useEffect(() => {
    if (loading) return;

    const onDashboardRoot = pathname === "/dashboard";
    const onPrivilegedRoute =
      pathname.startsWith("/dashboard/admin") ||
      pathname.startsWith("/dashboard/enterprise");
    const canStayOnPrivilegedRoute = nav.adminRoutePrefixes.some((prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

    if (onPrivilegedRoute && !nav.canAccessAdminView) {
      router.replace("/dashboard");
      return;
    }

    if (onPrivilegedRoute && !canStayOnPrivilegedRoute) {
      router.replace(nav.adminHomePath || "/dashboard");
      return;
    }

    if (onDashboardRoot && nav.viewMode === "ADMIN" && nav.adminHomePath) {
      router.replace(nav.adminHomePath);
    }
  }, [loading, nav.adminHomePath, nav.adminRoutePrefixes, nav.canAccessAdminView, nav.viewMode, pathname, router]);

  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const toggleSidebar = () => {
    const next = localStorage.getItem("sidebar-collapsed") !== "true";
    localStorage.setItem("sidebar-collapsed", String(next));
    window.dispatchEvent(new Event("sidebar-toggle"));
  };

  return (
    <DisplayModeProvider>
      <NavigationProvider>
        <DashboardSocketProvider>
          <div className="min-h-screen bg-[#0a0f1a] relative">
            <div className="absolute inset-0 dot-grid-bg opacity-[0.015] pointer-events-none" />
            <TokenHandler />
            <DashboardRoleGuard />
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#7AD62A] focus:text-[#0F203A] focus:rounded-xl focus:text-sm focus:font-medium"
            >
              Skip to main content
            </a>
            <DashboardHeader onToggleSidebar={toggleSidebar} />
            <Sidebar />
            <main id="main-content" className="pt-32 pb-20 sm:pt-28 md:pt-12 md:pb-0 md:pl-64 min-h-screen safe-area-pb" role="main">
              <div className="max-w-6xl mx-auto p-4 md:p-8 w-full">
                <DashboardModeBanner />
                <div className="hidden md:block">
                  <Breadcrumbs />
                </div>
                <PageErrorBoundary>
                  <OnboardingGuard>{children}</OnboardingGuard>
                </PageErrorBoundary>
              </div>
            </main>
            <BottomNav />
            <PwaInstallBanner />
            <LearningCoach />
          </div>
        </DashboardSocketProvider>
      </NavigationProvider>
    </DisplayModeProvider>
  );
}
