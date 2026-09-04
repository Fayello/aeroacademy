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
  cybersecurity: ["security", "owasp", "pentest", "forensic", "incident", "soc", "threat", "webgoat", "dvwa", "juice", "nodegoat", "vapi", "siem", "malware", "vulnerability", "exploit", "penetration", "red team", "blue team", "attack", "defense"],
  cloud: ["cloud", "aws", "azure", "gcp", "terraform", "iam", "s3", "lambda", "ec2", "serverless", "infrastructure as code"],
  containers: ["docker", "kubernetes", "container", "helm", "argo", "k8s", "podman", "containerization"],
  cicd: ["jenkins", "gitlab", "pipeline", "ci/cd", "automation", "ansible", "deployment", "github actions"],
  networking: ["network", "dns", "vpn", "wireguard", "iptables", "firewall", "routing", "tcp", "http", "load balancer", "proxy"],
  "data-eng": ["postgres", "mysql", "mongo", "redis", "elasticsearch", "database", "sql", "kafka", "spark"],
  "ml-ops": ["ml", "ai", "llm", "gpu", "kubeflow", "vector", "qdrant", "feast", "model serving", "feature store"],
  fullstack: ["api", "web", "frontend", "backend", "node", "xss", "sql injection", "javascript", "typescript", "react"],
  mobile: ["mobile", "android", "ios", "apk", "react native", "flutter"],
  design: ["design", "ui", "ux", "figma", "wireframe", "prototype", "usability", "accessibility", "user experience", "user interface", "visual design", "design system"],
  ai: ["ai", "machine learning", "ml", "deep learning", "neural network", "nlp", "computer vision", "llm", "gpt", "transformer", "training", "inference", "model", "data science", "generative ai"],
  databases: ["database", "sql", "postgres", "postgresql", "mysql", "mariadb", "mongo", "mongodb", "redis", "elasticsearch", "query optimization"],
  penetration: ["penetration testing", "pentest", "ethical hacking", "exploit", "vulnerability scanning", "reconnaissance", "privilege escalation"],
  forensics: ["forensic", "digital forensic", "incident response", "malware analysis", "reverse engineering", "memory forensic", "log analysis"],
  cryptography: ["cryptography", "encryption", "certificate", "pki", "hashing", "tls", "ssl", "key management"],
  devops: ["devops", "platform", "infrastructure", "automation", "reliability", "sre", "monitoring", "observability"],
  systems: ["systems", "linux", "sysadmin", "infrastructure", "kernel", "systemd", "bash", "shell"],
};

const TERM_ALIASES: Record<string, string[]> = {
  security: ["security", "cybersecurity", "defense", "blue team", "soc", "siem", "threat", "defensive", "incident", "forensic", "malware", "vulnerability", "penetration", "pentest", "red team", "attack"],
  cybersecurity: ["cybersecurity", "security", "defensive security", "offensive security", "infosec", "information security"],
  appsec: ["appsec", "application security", "web security", "api security", "owasp", "xss", "ssrf", "sql injection", "code review", "secure coding"],
  devsecops: ["devsecops", "secure ci", "secure pipeline", "sast", "dast", "supply chain", "security scanning", "shift left"],
  devops: ["devops", "platform", "infrastructure", "automation", "reliability", "sre", "monitoring", "observability"],
  cloud: ["cloud", "aws", "azure", "gcp", "terraform", "iam", "s3", "serverless", "lambda", "ec2", "infrastructure as code"],
  containers: ["containers", "container", "docker", "kubernetes", "k8s", "helm", "podman", "containerization"],
  kubernetes: ["kubernetes", "k8s", "helm", "argo", "cluster", "container orchestration"],
  cicd: ["cicd", "ci/cd", "pipeline", "github actions", "gitlab", "jenkins", "automation", "deployment"],
  networking: ["networking", "network", "routing", "firewall", "vpn", "dns", "tcp/ip", "tcp", "http", "load balancer", "proxy"],
  software: ["software", "engineering", "backend", "frontend", "api", "architecture", "microservices", "database"],
  web: ["web", "frontend", "backend", "react", "node", "browser", "http", "javascript", "typescript", "html", "css", "rest", "graphql"],
  mobile: ["mobile", "android", "ios", "apk", "react native", "flutter", "swift", "kotlin"],
  data: ["data", "analytics", "warehouse", "etl", "sql", "bi", "business intelligence", "visualization"],
  "data-eng": ["data engineering", "etl", "warehouse", "pipeline", "postgres", "mysql", "mongo", "redis", "elasticsearch", "kafka", "spark"],
  ai: ["ai", "machine learning", "ml", "llm", "nlp", "vision", "deep learning", "neural network", "computer vision", "generative ai", "gen ai", "transformer", "gpt", "bert", "training", "inference", "model", "prediction", "data science"],
  "ml-ops": ["mlops", "ml ops", "model serving", "vector", "qdrant", "kubeflow", "feast", "feature store", "model deployment", "model monitoring", "ml pipeline"],
  design: ["design", "ux", "ui", "research", "figma", "user experience", "user interface", "wireframe", "prototype", "usability", "accessibility", "interaction design", "visual design", "design system"],
  databases: ["database", "sql", "postgres", "postgresql", "mysql", "mariadb", "mongo", "mongodb", "redis", "elasticsearch", "database design", "query optimization"],
  penetration: ["penetration testing", "pentest", "ethical hacking", "exploit", "vulnerability scanning", "reconnaissance", "privilege escalation", "lateral movement"],
  forensics: ["forensic", "digital forensic", "incident response", "malware analysis", "reverse engineering", "memory forensic", "disk forensic", "log analysis"],
  cloudsecurity: ["cloud security", "cloud posture", "cspm", "cwpp", "cloud compliance", "identity management", "access control"],
  cryptography: ["cryptography", "encryption", "certificate", "pki", "hashing", "tls", "ssl", "key management"],
  systems: ["systems", "linux", "sysadmin", "infrastructure", "kernel", "systemd", "bash", "shell"],
  other: [],
};

export interface OnboardingRecommendation {
  title: string;
  description: string;
  href: string;
  cta: string;
}

export function reorderItemsByIds<T extends { id: string }>(items: T[], orderedIds: string[]): T[] {
  if (!orderedIds.length) return items;
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const orderedItems = orderedIds
    .map((id) => itemMap.get(id))
    .filter((item): item is T => Boolean(item));
  const seen = new Set(orderedItems.map((item) => item.id));
  return [...orderedItems, ...items.filter((item) => !seen.has(item.id))];
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
  const focusLabels = [
    ...selections.skills.map((item) => formatSlugLabel(item)),
    ...selections.field.map((item) => FIELD_LABELS[item] || formatSlugLabel(item)),
  ].filter((value, index, array) => value && array.indexOf(value) === index);

  if (focusLabels.length > 1) {
    return `${focusLabels[0]} + ${focusLabels[1]}`;
  }

  if (focusLabels.length > 0) {
    return focusLabels[0];
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
  let score = scoreTextAgainstOnboarding(haystack, selections);

  if (selections.experience === "None" && /(intro|beginner|basic|fundamental|first)/.test(haystack)) {
    score += 3;
  }

  if (selections.experience === "5+" && /(advanced|expert|hardening|incident|architecture)/.test(haystack)) {
    score += 2;
  }

  return score;
}

export function scoreTextAgainstOnboarding(text: string, selections: OnboardingSelections | null): number {
  if (!selections) return 0;

  const haystack = text.toLowerCase();
  let score = 0;

  for (const keyword of getInterestKeywords(selections)) {
    if (!keyword) continue;
    if (haystack.includes(keyword)) {
      score += keyword.includes(" ") ? 3 : keyword.length > 4 ? 2 : 1;
    }
  }

  for (const token of getInterestTokensFromOnboarding(selections)) {
    if (!token) continue;
    if (haystack.includes(token)) {
      score += token.length > 4 ? 2 : 1;
    }
  }

  return score;
}

export function getInterestTokensFromOnboarding(selections: OnboardingSelections | null): string[] {
  if (!selections) return [];

  const rawValues = [
    ...selections.field,
    ...selections.skills,
    ...selections.purpose,
    ...selections.jobInterests,
    selections.role,
    selections.experience,
  ].filter(Boolean);

  const expanded = rawValues.flatMap((value) => {
    const normalized = value.toLowerCase().trim();
    const aliases = TERM_ALIASES[normalized] || SKILL_TO_KEYWORDS[normalized] || [];
    return [
      normalized,
      ...normalized.split(/[\s/_-]+/),
      ...aliases,
    ];
  });

  return expanded
    .map((value) => value.trim().toLowerCase())
    .filter((value, index, array) => value.length > 1 && array.indexOf(value) === index);
}

export function getInterestKeywords(selections: OnboardingSelections | null): string[] {
  if (!selections) return [];

  const keywordGroups = [
    ...selections.field.map((field) => SKILL_TO_KEYWORDS[field] || TERM_ALIASES[field] || []),
    ...selections.skills.map((skill) => SKILL_TO_KEYWORDS[skill] || TERM_ALIASES[skill] || []),
  ];

  return keywordGroups
    .flat()
    .map((value) => value.toLowerCase().trim())
    .filter((value, index, array) => value.length > 1 && array.indexOf(value) === index);
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
