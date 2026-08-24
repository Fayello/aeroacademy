"use client";

import { useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import PageErrorBoundary from "@/components/PageErrorBoundary";
import { DashboardSocketProvider } from "@/hooks/DashboardSocketContext";
import { DisplayModeProvider } from "@/lib/displayMode";
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
      <DashboardSocketProvider>
        <div className="min-h-screen bg-slate-50">
          <TokenHandler />
          <Sidebar />
          <NotificationBell />
          <main className="pb-20 md:pb-0 md:pl-64 min-h-screen">
            <div className="max-w-6xl mx-auto p-4 md:p-8 w-full">
              <PageErrorBoundary>
                {children}
              </PageErrorBoundary>
            </div>
          </main>
          <BottomNav />
        </div>
      </DashboardSocketProvider>
    </DisplayModeProvider>
  );
}
