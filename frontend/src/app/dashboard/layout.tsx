"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, Bell, ChevronRight, CheckCheck, Loader2, LogOut, Settings, User as UserIcon } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import LearningCoach from "@/components/ai/LearningCoach";
import PageErrorBoundary from "@/components/PageErrorBoundary";
import { DashboardSocketProvider } from "@/hooks/DashboardSocketContext";
import { DisplayModeProvider } from "@/lib/displayMode";
import { NavigationProvider } from "@/lib/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CurrencySwitcher from "@/components/ui/CurrencySwitcher";
import { initTokenRefresh } from "@/lib/api";
import { logout } from "@/lib/auth";
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

function DashboardHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; avatarUrl?: string } | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { notifications, unread, loading, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
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

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 md:pl-64 relative overflow-hidden">
      <div className="absolute inset-0 angular-grid-bg opacity-[0.02] pointer-events-none" />
      <button
        onClick={onToggleSidebar}
        className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses, labs..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-100 border border-transparent focus:border-[#229C62] focus:bg-white focus:outline-none text-sm text-slate-700 placeholder:text-slate-400 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <CurrencySwitcher />
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#229C62] text-white text-[9px] font-bold flex items-center justify-center">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                  {unread > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#E9F8EE] text-[#0F203A] text-[10px] font-semibold">
                      {unread} new
                    </span>
                  )}
                </div>
                <button
                  onClick={() => void markAllRead()}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#229C62] font-medium"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={20} className="animate-spin text-slate-400" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell size={24} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                        !n.read ? "bg-[#E9F8EE]/40" : ""
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        <NotificationTypeIcon type={n.type} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#229C62] shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 shrink-0 self-center" />
                    </button>
                  ))
                )}
              </div>

              <Link
                href="/dashboard/notifications"
                onClick={() => setNotifOpen(false)}
                className="block text-center px-4 py-3 text-sm font-medium text-[#229C62] hover:bg-[#E9F8EE] border-t border-slate-100"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="User menu"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0F203A] to-[#1a3a5c] flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            )}
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in duration-150">
              <Link
                href="/dashboard/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <UserIcon size={16} className="text-slate-400" />
                Profile
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings size={16} className="text-slate-400" />
                Settings
              </Link>
              <div className="border-t border-slate-100" />
              <button
                onClick={() => { setUserMenuOpen(false); logout(); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
    window.dispatchEvent(new Event("sidebar-toggle"));
  };

  return (
    <DisplayModeProvider>
      <NavigationProvider>
        <DashboardSocketProvider>
          <div className="min-h-screen bg-slate-50 relative">
            <div className="absolute inset-0 dot-grid-bg opacity-[0.015] pointer-events-none" />
            <TokenHandler />
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#229C62] focus:text-white focus:rounded-xl focus:text-sm focus:font-medium"
            >
              Skip to main content
            </a>
            <DashboardHeader onToggleSidebar={toggleSidebar} />
            <Sidebar />
            <main id="main-content" className="pt-14 pb-20 md:pb-0 md:pl-64 min-h-screen" role="main">
              <div className="max-w-6xl mx-auto p-4 md:p-8 w-full">
                <Breadcrumbs />
                <PageErrorBoundary>
                  {children}
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
