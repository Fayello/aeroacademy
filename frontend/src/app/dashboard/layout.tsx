"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, Bell, ChevronRight, CheckCheck, Loader2, LogOut, Settings, User as UserIcon, Zap } from "lucide-react";
import BottomNav from "@/components/BottomNav";
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
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyOnboarding() {
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
  }, [router]);

  if (!checked) {
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
  const [user] = useState<{ name?: string; avatarUrl?: string } | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [shortcutKey] = useState(() => {
    if (typeof navigator === "undefined") return "Ctrl";
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? "⌘" : "Ctrl";
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [xp] = useState(() => {
    try {
      return parseInt(localStorage.getItem("xp") || "0", 10);
    } catch {
      return 0;
    }
  });
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const { notifications, unread, loading, markRead, markAllRead } = useNotifications();

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

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 bg-[#0a0f1a] border-b border-white/6 flex items-center gap-2 px-3 md:pl-64 relative overflow-hidden">
      <div className="absolute inset-0 angular-grid-bg opacity-[0.02] pointer-events-none" />
      <button
        onClick={onToggleSidebar}
        className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Search with Ctrl+/ hint */}
      <div className="flex-1 max-w-lg mx-auto">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search course catalog..."
            aria-label="Search course catalog"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchValue.trim()) {
                router.push(`/dashboard/courses?q=${encodeURIComponent(searchValue.trim())}`);
                setSearchValue("");
                searchRef.current?.blur();
              }
            }}
            className="w-full h-8 pl-8 pr-14 rounded-lg bg-white/5 border border-transparent focus:border-[#7AD62A] focus:bg-white/8 focus:outline-none text-sm text-slate-200 placeholder:text-slate-500 transition-colors"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white/5 border border-white/10 rounded shadow-sm">{shortcutKey}</kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white/5 border border-white/10 rounded shadow-sm">/</kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* XP Counter */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#7AD62A]/10 border border-[#7AD62A]/20">
          <Zap size={12} className="text-[#7AD62A]" />
          <span className="text-xs font-bold text-white">{xp.toLocaleString()}</span>
          <span className="text-[10px] text-[#7AD62A] font-medium">Lv{level}</span>
        </div>

        {/* Edit Profile CTA */}
        <Link
          href="/dashboard/profile/edit"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] text-xs font-bold transition-colors shadow-sm shadow-[#7AD62A]/20"
        >
          Edit Profile
        </Link>

        <CurrencySwitcher />

        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#7AD62A] text-[#0F203A] text-[8px] font-bold flex items-center justify-center">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0f172a] border border-white/10 rounded-xl shadow-lg overflow-hidden animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
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
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-[#7AD62A] font-medium"
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

              <Link
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
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition-colors"
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
              <Link
                href="/dashboard/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 transition-colors"
              >
                <UserIcon size={16} className="text-slate-400" />
                Profile
              </Link>
              <Link
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
    </header>
  );
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
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#7AD62A] focus:text-[#0F203A] focus:rounded-xl focus:text-sm focus:font-medium"
            >
              Skip to main content
            </a>
            <DashboardHeader onToggleSidebar={toggleSidebar} />
            <Sidebar />
            <main id="main-content" className="pt-12 pb-20 md:pb-0 md:pl-64 min-h-screen" role="main">
              <div className="max-w-6xl mx-auto p-4 md:p-8 w-full">
                <Breadcrumbs />
                <PageErrorBoundary>
                  <OnboardingGuard>{children}</OnboardingGuard>
                </PageErrorBoundary>
              </div>
            </main>
            <BottomNav />
            <LearningCoach />
          </div>
        </DashboardSocketProvider>
      </NavigationProvider>
    </DisplayModeProvider>
  );
}
