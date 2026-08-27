"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardSkeleton } from "@/components/Skeleton";
import CommandCenter from "@/components/dashboard/CommandCenter";

interface User {
  id: string;
  email: string;
  name?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const s = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [hydrated, setHydrated] = useState(() => {
    try {
      return typeof window !== "undefined" && !!localStorage.getItem("user");
    } catch { return false; }
  });
  const { userMetrics } = useDashboard();

  useEffect(() => {
    if (hydrated) return;
    let cancelled = false;
    async function loadUser() {
      try {
        const me = await fetchApi<{ id: string; email: string; name?: string }>("/auth/me");
        if (!cancelled && me) {
          localStorage.setItem("user", JSON.stringify(me));
          setUser(me);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    loadUser();
    return () => { cancelled = true; };
  }, [hydrated]);

  useEffect(() => {
    if (userMetrics?.xp != null) {
      localStorage.setItem("xp", String(userMetrics.xp));
    }
  }, [userMetrics?.xp]);

  if (!hydrated) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return <DashboardSkeleton />;
  }

  return (
    <div className="animate-in fade-in duration-500">
      <CommandCenter />
    </div>
  );
}
