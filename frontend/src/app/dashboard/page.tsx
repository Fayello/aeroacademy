"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardSkeleton } from "@/components/Skeleton";
import Dashboard from "@/components/dashboard/Dashboard";
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
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useDashboard();

  useEffect(() => {
    try {
      const s = localStorage.getItem("user");
      if (s) {
        const parsed = JSON.parse(s) as User;
        setUser(parsed);
        syncOnboardingFromProfile(parsed);
      }
    } catch {}
    setHydrated(true);
  }, []);

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
      <Dashboard />
    </div>
  );
}
