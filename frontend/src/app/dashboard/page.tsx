"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardSkeleton } from "@/components/Skeleton";
import CommandCenter from "@/components/dashboard/CommandCenter";
import OnboardingOverlay from "@/components/OnboardingOverlay";

interface User {
  id: string;
  email: string;
  name?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
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

  useEffect(() => {
    if (!hydrated) return;
    try {
      const alreadyOnboarded = localStorage.getItem("onboardingComplete");
      if (!alreadyOnboarded && (userMetrics?.xp ?? 0) === 0) {
        setShowOnboarding(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, [hydrated, userMetrics?.xp]);

  if (!hydrated) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return <DashboardSkeleton />;
  }

  return (
    <div className="animate-in fade-in duration-500">
      {showOnboarding && <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />}
      <CommandCenter />
    </div>
  );
}
