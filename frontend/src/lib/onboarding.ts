"use client";

export const ONBOARDING_COMPLETE_KEY = "onboardingComplete";
export const ONBOARDING_SELECTIONS_KEY = "onboardingSelections";

export interface OnboardingSelections {
  purpose: string[];
  field: string[];
  role: string;
  experience: string;
  skills: string[];
  jobInterests: string[];
}

export const EMPTY_ONBOARDING_SELECTIONS: OnboardingSelections = {
  purpose: [],
  field: [],
  role: "",
  experience: "",
  skills: [],
  jobInterests: [],
};

const FIELD_LABELS: Record<string, string> = {
  cybersecurity: "Cybersecurity",
  software: "Software Engineering",
  data: "Data Science & Analytics",
  cloud: "Cloud Computing",
  ai: "AI & Machine Learning",
  devops: "DevOps & Infrastructure",
  networking: "Networking & Systems",
  web: "Web & Mobile Development",
  design: "UX/UI Design",
  other: "Technology",
};

const PURPOSE_ROLE_LABELS: Record<string, string> = {
  teach: "Instructor",
  compete: "Competitor",
  team: "Team Lead",
  certify: "Certification Seeker",
  learn: "Learner",
  train: "Practitioner",
  jobs: "Career Explorer",
  connect: "Community Builder",
  other: "Learner",
};

const SKILL_TO_KEYWORDS: Record<string, string[]> = {
  cybersecurity: ["security", "owasp", "pentest", "forensic", "incident", "soc", "threat", "webgoat", "dvwa", "juice", "nodegoat", "vapi"],
  cloud: ["cloud", "aws", "azure", "gcp", "terraform", "iam", "s3"],
  containers: ["docker", "kubernetes", "container", "helm", "argo", "k8s"],
  cicd: ["jenkins", "gitlab", "pipeline", "ci/cd", "automation", "ansible"],
  networking: ["network", "dns", "vpn", "wireguard", "iptables", "firewall", "routing"],
  "data-eng": ["postgres", "mysql", "mongo", "redis", "elasticsearch", "database", "sql"],
  "ml-ops": ["ml", "ai", "llm", "gpu", "kubeflow", "vector", "qdrant", "feast"],
  fullstack: ["api", "web", "frontend", "backend", "node", "xss", "sql injection"],
  mobile: ["mobile", "android", "ios", "apk"],
  design: ["design", "ui", "ux"],
};

export interface OnboardingRecommendation {
  title: string;
  description: string;
  href: string;
  cta: string;
}

export function readOnboardingSelections(): OnboardingSelections | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_SELECTIONS_KEY);
    if (raw) return normalizeOnboardingSelections(JSON.parse(raw));

    const userRaw = localStorage.getItem("user");
    if (!userRaw) return null;
    const user = JSON.parse(userRaw);
    return normalizeOnboardingSelections(user?.preference?.onboardingSelections);
  } catch {
    return null;
  }
}

export function writeOnboardingSelections(selections: OnboardingSelections) {
  if (typeof window === "undefined") return;
  const normalized = normalizeOnboardingSelections(selections);
  localStorage.setItem(ONBOARDING_SELECTIONS_KEY, JSON.stringify(normalized));
}

export function markOnboardingComplete() {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
}

export function clearOnboardingState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
}

export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true") return true;
    const userRaw = localStorage.getItem("user");
    if (!userRaw) return false;
    const user = JSON.parse(userRaw);
    return user?.preference?.onboardingCompleted === true;
  } catch {
    return false;
  }
}

export function syncOnboardingFromProfile(profile: { preference?: { onboardingCompleted?: boolean; onboardingSelections?: unknown } | null }) {
  if (typeof window === "undefined") return;
  const preference = profile.preference;
  if (!preference) return;

  if (preference.onboardingCompleted) {
    markOnboardingComplete();
  }

  const selections = normalizeOnboardingSelections(preference.onboardingSelections);
  if (hasMeaningfulSelections(selections)) {
    writeOnboardingSelections(selections);
  }
}

export function getPrimaryPurpose(selections: OnboardingSelections | null): string {
  return selections?.purpose?.[0] || "other";
}

export function getRoleLabelFromOnboarding(selections: OnboardingSelections | null): string {
  if (!selections) return "Learner";
  return (
    selections.purpose.find((item) => PURPOSE_ROLE_LABELS[item]) &&
    PURPOSE_ROLE_LABELS[selections.purpose.find((item) => PURPOSE_ROLE_LABELS[item]) as string]
  ) || "Learner";
}

export function getFocusLabelFromOnboarding(selections: OnboardingSelections | null): string {
  if (!selections) return "";
  if (selections.skills.length > 0) {
    return formatSlugLabel(selections.skills[0]);
  }
  if (selections.field.length > 0) {
    return FIELD_LABELS[selections.field[0]] || formatSlugLabel(selections.field[0]);
  }
  return "";
}

export function getFieldCountFromOnboarding(selections: OnboardingSelections | null): number {
  return selections?.field?.length || 0;
}

export function getExperienceLabel(selections: OnboardingSelections | null): string {
  const value = selections?.experience || "";
  if (value === "None") return "Entry level";
  if (value === "1-2") return "Junior";
  if (value === "3-5") return "Mid-level";
  if (value === "5+") return "Senior";
  return "";
}

export function getPrimaryRecommendation(selections: OnboardingSelections | null): OnboardingRecommendation {
  const purpose = getPrimaryPurpose(selections);

  if (purpose === "teach") {
    return {
      title: "Set up your teaching workspace",
      description: "Start with course authoring and classroom tools tailored for instructors.",
      href: "/dashboard/admin/courses",
      cta: "Create a Course",
    };
  }

  if (purpose === "team") {
    return {
      title: "Create your first team",
      description: "Bring your people together first, then assign learning and labs from one place.",
      href: "/dashboard/teams",
      cta: "Create a Team",
    };
  }

  if (purpose === "compete") {
    return {
      title: "Warm up with a beginner-friendly challenge",
      description: "Start with one approachable lab, then use the leaderboard as motivation rather than a distraction.",
      href: "/dashboard/starting-point",
      cta: "Start the Path",
    };
  }

  if (purpose === "certify") {
    return {
      title: "Start the certification prep path",
      description: "Build the foundations first so your first assessment and certificate feel earned.",
      href: "/dashboard/starting-point",
      cta: "Begin Prep",
    };
  }

  return {
    title: "Start your guided beginner path",
    description: "We picked the easiest high-value entry point so you can get your first win fast.",
    href: "/dashboard/starting-point",
    cta: "Start the Path",
  };
}

export function getSecondaryRecommendation(selections: OnboardingSelections | null): OnboardingRecommendation {
  const purpose = getPrimaryPurpose(selections);
  if (purpose === "teach") {
    return {
      title: "Preview learner-facing labs",
      description: "See the hands-on environments your students will experience.",
      href: "/dashboard/labs",
      cta: "Explore Labs",
    };
  }

  if (purpose === "team") {
    return {
      title: "Review the lab catalog",
      description: "Choose the hands-on exercises that match your team's skill gaps.",
      href: "/dashboard/labs",
      cta: "Browse Labs",
    };
  }

  return {
    title: "Browse the full lab catalog",
    description: "If you'd rather explore freely, the complete catalog is one click away.",
    href: "/dashboard/labs",
    cta: "Browse Labs",
  };
}

export function scoreLabAgainstOnboarding(
  title: string,
  description: string,
  selections: OnboardingSelections | null,
): number {
  if (!selections) return 0;

  const haystack = `${title} ${description}`.toLowerCase();
  let score = 0;

  for (const field of selections.field) {
    score += keywordScore(haystack, SKILL_TO_KEYWORDS[field] || []);
  }

  for (const skill of selections.skills) {
    score += keywordScore(haystack, SKILL_TO_KEYWORDS[skill] || []);
  }

  if (selections.experience === "None" && /(intro|beginner|basic|fundamental|first)/.test(haystack)) {
    score += 3;
  }

  if (selections.experience === "5+" && /(advanced|expert|hardening|incident|architecture)/.test(haystack)) {
    score += 2;
  }

  return score;
}

function keywordScore(haystack: string, keywords: string[]): number {
  return keywords.reduce((total, keyword) => total + (haystack.includes(keyword) ? 2 : 0), 0);
}

function formatSlugLabel(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeOnboardingSelections(value: unknown): OnboardingSelections {
  const source = value && typeof value === "object" ? value as Partial<Record<keyof OnboardingSelections, unknown>> : {};
  return {
    purpose: stringArray(source.purpose),
    field: stringArray(source.field),
    role: typeof source.role === "string" ? source.role : "",
    experience: typeof source.experience === "string" ? source.experience : "",
    skills: stringArray(source.skills),
    jobInterests: stringArray(source.jobInterests),
  };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function hasMeaningfulSelections(selections: OnboardingSelections): boolean {
  return Boolean(
    selections.purpose.length ||
    selections.field.length ||
    selections.role ||
    selections.experience ||
    selections.skills.length ||
    selections.jobInterests.length,
  );
}
