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

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
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
  role: string;
  sections: NavSection[];
  alerts: NavAlert[];
  showTeach: boolean;
  showAcademic: boolean;
  showAdmin: boolean;
}

const DEFAULT_CONTEXT: NavigationContext = {
  experience: "INDIVIDUAL",
  level: 1,
  role: "STUDENT",
  sections: [
    {
      id: "dashboard",
      label: "Command Center",
      items: [{ href: "/dashboard", tKey: "nav.dashboard", icon: "Home", label: "Dashboard" }],
    },
    {
      id: "learn",
      label: "Learn",
      items: [
        { href: "/dashboard/courses", tKey: "nav.courses", icon: "GraduationCap", label: "Courses" },
        { href: "/dashboard/learning-paths", tKey: "nav.paths", icon: "Route", label: "Learning Paths" },
        { href: "/dashboard/training", tKey: "nav.masterclasses", icon: "Award", label: "Master Classes" },
      ],
    },
    {
      id: "labs",
      label: "Practice",
      items: [
        { href: "/dashboard/labs", tKey: "nav.labs", icon: "FlaskConical", label: "Labs" },
        { href: "/dashboard/exams", tKey: "nav.exams", icon: "ClipboardCheck", label: "Practical Exams" },
        { href: "/dashboard/assessments", tKey: "nav.assessments", icon: "Target", label: "Skill Assessments" },
      ],
    },
  ],
  alerts: [],
  showTeach: false,
  showAcademic: false,
  showAdmin: false,
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
