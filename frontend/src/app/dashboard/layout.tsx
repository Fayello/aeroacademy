"use client";

import { useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import LearningCoach from "@/components/ai/LearningCoach";
import PageErrorBoundary from "@/components/PageErrorBoundary";
import { DashboardSocketProvider } from "@/hooks/DashboardSocketContext";
import { DisplayModeProvider } from "@/lib/displayMode";
import { NavigationProvider } from "@/lib/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { initTokenRefresh } from "@/lib/api";

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DisplayModeProvider>
      <NavigationProvider>
        <DashboardSocketProvider>
          <div className="min-h-screen bg-slate-50">
            <TokenHandler />
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#229C62] focus:text-white focus:rounded-xl focus:text-sm focus:font-medium"
            >
              Skip to main content
            </a>
            <Sidebar />
            <NotificationBell />
            <main id="main-content" className="pb-20 md:pb-0 md:pl-64 min-h-screen" role="main">
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
