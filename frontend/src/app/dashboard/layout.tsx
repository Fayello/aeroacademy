"use client";

import { Suspense, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import PageErrorBoundary from "@/components/PageErrorBoundary";

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function TokenHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;

    const state = params.get("state");
    const savedState = sessionStorage.getItem("oauth_state");
    if (state && savedState && state !== savedState) {
      window.location.href = "/login?error=invalid_state";
      return;
    }
    sessionStorage.removeItem("oauth_state");

    const payload = decodeJwtPayload(token);
    if (!payload) {
      window.location.href = "/login";
      return;
    }

    localStorage.setItem("token", token);

    const refreshToken = params.get("refresh_token");
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);

    localStorage.setItem(
      "user",
      JSON.stringify({ id: payload.sub, email: payload.email, role: payload.role })
    );

    document.cookie = `token=${token}; path=/; max-age=604800; samesite=lax`;

    window.location.replace("/dashboard");
  }, []);

  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <TokenHandler />
      <Sidebar />
      <main className="pb-20 md:pb-0 md:pl-64 min-h-screen">
        <div className="max-w-6xl mx-auto p-4 md:p-8 w-full">
          <PageErrorBoundary>
            {children}
          </PageErrorBoundary>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
