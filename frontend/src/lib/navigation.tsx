"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchApi } from "@/lib/api";

export type UserExperience = "INDIVIDUAL" | "UNIVERSITY" | "CORPORATE" | "INSTRUCTOR" | "ADMIN";

export interface NavItem {
  href: string;
  tKey: string;
  icon: string;
  label: string;
  badge?: string;
  disabled?: boolean;
}

export interface NavAlert {
  type: "EXAM_AVAILABLE" | "COHORT_ACTIVE" | "CURRICULUM_ASSIGNED" | "LEVEL_UP";
  title: string;
  description: string;
  href?: string;
}

export interface NavigationContext {
  experience: UserExperience;
  level: number;
  learnItems: NavItem[];
  competeItems: NavItem[];
  communityItems: NavItem[];
  profileItems: NavItem[];
  alerts: NavAlert[];
  showCompete: boolean;
  showCommunity: boolean;
}

const DEFAULT_CONTEXT: NavigationContext = {
  experience: "INDIVIDUAL",
  level: 1,
  learnItems: [
    { href: "/dashboard/courses", tKey: "bucket.courses", icon: "GraduationCap", label: "Courses" },
    { href: "/dashboard/learning-paths", tKey: "bucket.paths", icon: "Route", label: "Learning Paths" },
    { href: "/dashboard/training", tKey: "bucket.masterclasses", icon: "Award", label: "Masterclasses" },
    { href: "/dashboard/analytics/competency", tKey: "bucket.assessments", icon: "ClipboardCheck", label: "Assessments" },
  ],
  competeItems: [],
  communityItems: [
    { href: "/dashboard/teams", tKey: "bucket.teams", icon: "Users", label: "Teams" },
    { href: "/dashboard/events", tKey: "bucket.events", icon: "ScrollText", label: "Events" },
  ],
  profileItems: [
    { href: "/dashboard/profile", tKey: "bucket.overview", icon: "User", label: "Overview" },
    { href: "/dashboard/genome", tKey: "bucket.skills", icon: "Target", label: "Skills" },
    { href: "/dashboard/competency", tKey: "bucket.competency", icon: "BarChart3", label: "Competency" },
    { href: "/dashboard/certifications", tKey: "bucket.certifications", icon: "Award", label: "Certifications" },
    { href: "/dashboard/analytics", tKey: "bucket.achievements", icon: "Award", label: "Achievements" },
  ],
  alerts: [],
  showCompete: false,
  showCommunity: true,
};

interface NavigationContextValue {
  nav: NavigationContext;
  loading: boolean;
  refresh: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = useState<NavigationContext>(DEFAULT_CONTEXT);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await fetchApi<NavigationContext>("/navigation/context");
      setNav(result);
    } catch {
      // use default
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await load();
  }, [load]);

  const value = useMemo(() => ({ nav, loading, refresh }), [nav, loading, refresh]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used within a NavigationProvider");
  return ctx;
}
