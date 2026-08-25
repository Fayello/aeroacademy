"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  courses: "Courses",
  labs: "Labs",
  challenges: "Challenges",
  badges: "Badges",
  achievements: "Achievements",
  cohorts: "Cohorts",
  exams: "Exams",
  "learning-paths": "Learning Paths",
  "master-classes": "Master Classes",
  analytics: "Analytics",
  users: "Users",
  teams: "Teams",
  settings: "Settings",
  profile: "Profile",
  leaderboard: "Leaderboard",
  certifications: "Certifications",
  "battle-pass": "Battle Pass",
  "boss-missions": "Boss Missions",
  compete: "Compete",
  training: "Training",
  notifications: "Notifications",
  recommendations: "Recommendations",
  gradebook: "Gradebook",
  genome: "Genome",
  registry: "Registry",
  seasons: "Seasons",
  curricula: "Curricula",
  "capability-ranking": "Capability Ranking",
  ranking: "Ranking",
  referrals: "Referrals",
  streak: "Streak",
  "skill-gaps": "Skill Gaps",
  "my-missions": "My Missions",
  enterprise: "Enterprise",
  events: "Events",
  academics: "Academics",
  competency: "Competency",
  "ai-generator": "AI Generator",
  audit: "Audit Log",
  monitoring: "Monitoring",
  trainers: "Trainers",
  "content-refresh": "Content Refresh",
  "predictive-analytics": "Predictive Analytics",
  "tutoring-analytics": "Tutoring Analytics",
  "cohort-intelligence": "Cohort Intelligence",
  assessments: "Assessments",
  edit: "Edit",
  "change-password": "Change Password",
  discussions: "Discussions",
  certificate: "Certificate",
  lessons: "Lessons",
  content: "Content",
  bookings: "Bookings",
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  if (!pathname || pathname === "/dashboard") return null;

  const segments = pathname.split("/").filter(Boolean);
  // Skip "dashboard" from breadcrumb display (it's the root)
  const crumbs = segments
    .filter((s) => s !== "dashboard")
    .map((segment, i) => {
      const href = "/" + segments.slice(0, i + 2).join("/");
      const isLast = i === segments.filter((s) => s !== "dashboard").length - 1;
      const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      return { href, label, isLast };
    });

  if (crumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-slate-500 mb-4">
      <Link href="/dashboard" className="hover:text-slate-700 transition-colors">
        <Home size={14} />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight size={12} className="text-slate-300" />
          {crumb.isLast ? (
            <span className="text-slate-900 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-slate-700 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
