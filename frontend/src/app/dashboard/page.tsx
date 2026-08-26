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
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const { userMetrics } = useDashboard();

  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          const me = await fetchApi<{ id: string; email: string; name?: string }>("/auth/me");
          if (!cancelled && me) {
            localStorage.setItem("user", JSON.stringify(me));
            setUser(me);
          }
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    loadUser();
    return () => { cancelled = true; };
  }, []);

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
