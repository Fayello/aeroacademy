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

export type ViewMode = "ADMIN" | "LEARNER";

export interface NavigationContext {
  experience: UserExperience;
  level: number;
  role: string;
  sections: NavSection[];
  alerts: NavAlert[];
  showTeach: boolean;
  showAcademic: boolean;
  showAdmin: boolean;
  viewMode: ViewMode;
  canAccessAdminView: boolean;
  adminHomePath: string | null;
  adminViewLabel: string | null;
  adminRoutePrefixes: string[];
}

const DEFAULT_CONTEXT: NavigationContext = {
  experience: "INDIVIDUAL",
  level: 1,
  role: "STUDENT",
  viewMode: "LEARNER",
  sections: [
    {
      id: "dashboard",
      label: "Dashboard",
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
  canAccessAdminView: false,
  adminHomePath: null,
  adminViewLabel: null,
  adminRoutePrefixes: [],
};

function canAccessAdminView(role: string) {
  return role === "ADMIN" || role === "RECRUITER";
}

function getAdminHomePath(role: string) {
  if (role === "RECRUITER") return "/dashboard/enterprise";
  if (role === "ADMIN") return "/dashboard/admin";
  return null;
}

function getAdminViewLabel(role: string) {
  if (role === "RECRUITER") return "Recruitment Workspace";
  if (role === "ADMIN") return "Admin Workspace";
  return null;
}

function getAdminRoutePrefixes(role: string) {
  if (role === "RECRUITER") {
    return [
      "/dashboard/enterprise",
      "/dashboard/admin/inquiries",
      "/dashboard/admin/community-programs",
    ];
  }
  if (role === "ADMIN") {
    return ["/dashboard/admin", "/dashboard/enterprise"];
  }
  return [];
}

function getLearnerFallbackContext(experience: UserExperience, role: string, level: number): NavigationContext {
  if (experience === "UNIVERSITY" || role === "INSTRUCTOR") {
    return {
      experience,
      level,
      role,
      viewMode: "LEARNER",
      sections: [
        {
          id: "dashboard",
          label: "Overview",
          items: [{ href: "/dashboard", tKey: "nav.dashboard", icon: "Home", label: "Academic Overview" }],
        },
        {
          id: "academics",
          label: "Academic Delivery",
          items: [
            { href: "/dashboard/academics", tKey: "nav.academics", icon: "GraduationCap", label: "Academic Record" },
            { href: "/dashboard/curricula", tKey: "nav.curricula", icon: "BookOpen", label: "Curricula" },
            { href: "/dashboard/gradebook", tKey: "nav.gradebook", icon: "ClipboardCheck", label: "Gradebook" },
          ],
        },
        {
          id: "practice",
          label: "Labs and Readiness",
          items: [
            { href: "/dashboard/labs", tKey: "nav.labs", icon: "FlaskConical", label: "Labs" },
            { href: "/dashboard/exams", tKey: "nav.exams", icon: "ShieldCheck", label: "Practical Exams" },
          ],
        },
      ],
      alerts: [],
      showTeach: true,
      showAcademic: true,
      showAdmin: canAccessAdminView(role),
      canAccessAdminView: canAccessAdminView(role),
      adminHomePath: getAdminHomePath(role),
      adminViewLabel: getAdminViewLabel(role),
      adminRoutePrefixes: getAdminRoutePrefixes(role),
    };
  }

  if (experience === "CORPORATE") {
    return {
      experience,
      level,
      role,
      viewMode: "LEARNER",
      sections: [
        {
          id: "dashboard",
          label: "Overview",
          items: [{ href: "/dashboard", tKey: "nav.dashboard", icon: "Home", label: "Capability Overview" }],
        },
        {
          id: "enterprise",
          label: "Institutional Tools",
          items: [
            { href: "/dashboard/enterprise", tKey: "nav.enterprise", icon: "Building2", label: "Enterprise Portal" },
            { href: "/dashboard/curricula", tKey: "nav.curricula", icon: "BookOpen", label: "Curricula" },
            { href: "/dashboard/gradebook", tKey: "nav.gradebook", icon: "ClipboardCheck", label: "Gradebook" },
          ],
        },
        {
          id: "evidence",
          label: "Evidence",
          items: [
            { href: "/dashboard/labs", tKey: "nav.labs", icon: "FlaskConical", label: "Labs" },
            { href: "/dashboard/certifications", tKey: "nav.certifications", icon: "Award", label: "Certifications" },
          ],
        },
      ],
      alerts: [],
      showTeach: false,
      showAcademic: true,
      showAdmin: canAccessAdminView(role),
      canAccessAdminView: canAccessAdminView(role),
      adminHomePath: getAdminHomePath(role),
      adminViewLabel: getAdminViewLabel(role),
      adminRoutePrefixes: getAdminRoutePrefixes(role),
    };
  }

  return {
    ...DEFAULT_CONTEXT,
    experience,
    level,
    role,
    viewMode: "LEARNER",
    showAdmin: canAccessAdminView(role),
    canAccessAdminView: canAccessAdminView(role),
    adminHomePath: getAdminHomePath(role),
    adminViewLabel: getAdminViewLabel(role),
    adminRoutePrefixes: getAdminRoutePrefixes(role),
  };
}

function getAdminFallbackContext(role: string, level: number): NavigationContext {
  if (role === "RECRUITER") {
    return {
      experience: "CORPORATE",
      level,
      role,
      viewMode: "ADMIN",
      sections: [
        {
          id: "dashboard",
          label: "Recruitment",
          items: [{ href: "/dashboard/enterprise", tKey: "nav.enterprise", icon: "Building2", label: "Talent Portal" }],
        },
        {
          id: "pipeline",
          label: "Talent Pipeline",
          items: [
            { href: "/dashboard/enterprise", tKey: "nav.enterprise", icon: "Users", label: "Talent Pool" },
            { href: "/dashboard/admin/inquiries", tKey: "nav.inquiries", icon: "Inbox", label: "Institutional Inquiries" },
            { href: "/dashboard/admin/community-programs", tKey: "nav.community", icon: "Megaphone", label: "Community Programs" },
          ],
        },
      ],
      alerts: [],
      showTeach: false,
      showAcademic: false,
      showAdmin: true,
      canAccessAdminView: true,
      adminHomePath: "/dashboard/enterprise",
      adminViewLabel: "Recruitment Workspace",
      adminRoutePrefixes: getAdminRoutePrefixes(role),
    };
  }

  return {
    experience: "ADMIN",
    level,
    role,
    viewMode: "ADMIN",
    sections: [
      {
        id: "dashboard",
        label: "Operations",
        items: [{ href: "/dashboard/admin", tKey: "nav.adminDashboard", icon: "ShieldCheck", label: "Admin Overview" }],
      },
      {
        id: "platform",
        label: "Platform Control",
        items: [
          { href: "/dashboard/admin/users", tKey: "nav.users", icon: "Users", label: "Users" },
          { href: "/dashboard/admin/inquiries", tKey: "nav.inquiries", icon: "Inbox", label: "Inquiries" },
          { href: "/dashboard/admin/community-programs", tKey: "nav.community", icon: "Megaphone", label: "Community Programs" },
          { href: "/dashboard/admin/monitoring", tKey: "nav.monitoring", icon: "Activity", label: "Lab Monitoring" },
          { href: "/dashboard/admin/audit", tKey: "nav.audit", icon: "ScrollText", label: "Audit Logs" },
        ],
      },
      {
        id: "delivery",
        label: "Delivery Systems",
        items: [
          { href: "/dashboard/admin/courses", tKey: "nav.courses", icon: "GraduationCap", label: "Courses" },
          { href: "/dashboard/admin/labs", tKey: "nav.labs", icon: "FlaskConical", label: "Labs" },
          { href: "/dashboard/admin/assessments", tKey: "nav.assessments", icon: "ClipboardCheck", label: "Assessments" },
        ],
      },
      {
        id: "intelligence",
        label: "Analytics",
        items: [
          { href: "/dashboard/admin/analytics", tKey: "nav.analytics", icon: "TrendingUp", label: "Analytics" },
          { href: "/dashboard/admin/cohort-intelligence", tKey: "nav.cohorts", icon: "Users", label: "Cohort Intelligence" },
          { href: "/dashboard/admin/predictive-analytics", tKey: "nav.predictive", icon: "ShieldAlert", label: "Predictive Analytics" },
        ],
      },
    ],
    alerts: [],
    showTeach: true,
    showAcademic: true,
    showAdmin: true,
    canAccessAdminView: true,
    adminHomePath: "/dashboard/admin",
    adminViewLabel: "Admin Workspace",
    adminRoutePrefixes: getAdminRoutePrefixes(role),
  };
}

function buildNavigationContext(
  base: Omit<NavigationContext, "viewMode">,
  viewMode: ViewMode,
): NavigationContext {
  if (viewMode === "ADMIN" && base.canAccessAdminView) {
    return getAdminFallbackContext(base.role, base.level);
  }

  return {
    ...base,
    viewMode: "LEARNER",
  };
}

function getFallbackContext(experience: UserExperience, role: string, level: number, viewMode: ViewMode): NavigationContext {
  const learnerBase = getLearnerFallbackContext(experience, role, level);
  return buildNavigationContext(learnerBase, viewMode);
}

interface NavigationContextValue {
  nav: NavigationContext;
  loading: boolean;
  refresh: () => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem("viewMode") as ViewMode) || "LEARNER";
    } catch {
      return "LEARNER";
    }
  });

  const [nav, setNav] = useState<NavigationContext>(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const experience = (user.userExperience || user.experience || DEFAULT_CONTEXT.experience) as UserExperience;
      const role = user.role || DEFAULT_CONTEXT.role;
      const xp = Number(localStorage.getItem("xp") || user.xp || 0);
      const level = Math.floor(xp / 1000) + 1;
      const safeViewMode = canAccessAdminView(role) ? viewMode : "LEARNER";
      return getFallbackContext(experience, role, level, safeViewMode);
    } catch {
      return DEFAULT_CONTEXT;
    }
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await fetchApi<Omit<NavigationContext, "viewMode">>("/navigation/context");
      const safeViewMode = result.canAccessAdminView ? viewMode : "LEARNER";
      setNav(buildNavigationContext(result, safeViewMode));
    } catch {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const experience = (user.userExperience || user.experience || DEFAULT_CONTEXT.experience) as UserExperience;
        const role = user.role || DEFAULT_CONTEXT.role;
        const xp = Number(localStorage.getItem("xp") || user.xp || 0);
        const level = Math.floor(xp / 1000) + 1;
        const safeViewMode = canAccessAdminView(role) ? viewMode : "LEARNER";
        setNav(getFallbackContext(experience, role, level, safeViewMode));
      } catch {
        setNav(DEFAULT_CONTEXT);
      }
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const setViewMode = useCallback((mode: ViewMode) => {
    const nextMode = nav.canAccessAdminView ? mode : "LEARNER";
    setViewModeState(nextMode);
    localStorage.setItem("viewMode", nextMode);
    setNav((prev) => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const experience = (user.userExperience || user.experience || DEFAULT_CONTEXT.experience) as UserExperience;
        const role = user.role || DEFAULT_CONTEXT.role;
        const xp = Number(localStorage.getItem("xp") || user.xp || 0);
        const level = Math.floor(xp / 1000) + 1;
        return getFallbackContext(experience, role, level, nextMode);
      } catch {
        return buildNavigationContext({ ...prev }, nextMode);
      }
    });
  }, [nav.canAccessAdminView]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await load();
  }, [load]);

  const value = useMemo(() => ({ nav, loading, refresh, setViewMode }), [nav, loading, refresh, setViewMode]);

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
