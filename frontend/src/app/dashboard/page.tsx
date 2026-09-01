"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardSkeleton } from "@/components/Skeleton";
import CommandCenter from "@/components/dashboard/CommandCenter";
import { syncOnboardingFromProfile } from "@/lib/onboarding";
import type { UserPreference } from "@/types/api";

interface User {
  id: string;
  email: string;
  name?: string;
  preference?: UserPreference | null;
}

export default function DashboardPage() {
  const router = useRouter();
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
        const me = await fetchApi<User>("/auth/me");
        if (!cancelled && me) {
          syncOnboardingFromProfile(me);
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

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  if (!hydrated) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="animate-in fade-in duration-500">
      <CommandCenter />
    </div>
  );
}
