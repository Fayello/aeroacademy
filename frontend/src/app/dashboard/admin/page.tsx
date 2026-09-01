"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap, Microscope, Video, Calendar, Users, ArrowRight, Activity, ScrollText, TrendingUp, Target, Award, ClipboardCheck, Layers, Swords, Sparkles, ShieldAlert, RefreshCw } from "lucide-react";
import { fetchApi } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";

interface AdminStats {
  totalStudents?: number;
  totalCourses?: number;
  totalLabs?: number;
  masterClasses?: number;
  trainers?: number;
  users?: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchApi("/dashboard/public-stats").catch(() => ({})),
      fetchApi("/master-classes").catch(() => []),
      fetchApi("/training/trainers").catch(() => []),
      fetchApi("/admin/users/stats").catch(() => ({ total: 0, byRole: [] })),
    ]).then(([s, mc, t, u]) => {
      if (!cancelled) {
        setStats({
          ...s,
          masterClasses: Array.isArray(mc) ? mc.length : 0,
          trainers: Array.isArray(t) ? t.length : 0,
          users: u.total || 0,
        });
      }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <div key={id} className="bg-[#0f172a] rounded-xl border border-white/10 p-5 space-y-2">
              <div className="h-5 w-5 bg-white/10 rounded animate-pulse" />
              <div className="h-6 w-12 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Students", value: stats?.totalStudents || 0, icon: Users, color: "emerald", bg: "bg-[#7AD62A]", trend: "+12%" },
    { label: "Courses", value: stats?.totalCourses || 0, icon: GraduationCap, color: "blue", bg: "bg-blue-500", trend: "+3" },
    { label: "Labs", value: stats?.totalLabs || 0, icon: Microscope, color: "violet", bg: "bg-violet-500", trend: "+8" },
    { label: "Master Classes", value: stats?.masterClasses || 0, icon: Video, color: "amber", bg: "bg-amber-500", trend: "+2" },
    { label: "Trainers", value: stats?.trainers || 0, icon: Calendar, color: "rose", bg: "bg-rose-500", trend: "+1" },
    { label: "Total Users", value: stats?.users || 0, icon: Users, color: "slate", bg: "bg-white/50", trend: "+18%" },
  ];

  const operatingPriorities = [
    {
      title: "Protect platform integrity",
      description: "Review live monitoring and audit activity before changing delivery or access settings.",
      href: "/dashboard/admin/monitoring",
      icon: Activity,
      meta: "Monitoring and audit first",
    },
    {
      title: "Keep academic delivery governed",
      description: "Check curricula, assessments, and learning content so learner and institutional records stay defensible.",
      href: "/dashboard/admin/courses",
      icon: GraduationCap,
      meta: "Content and assessment control",
    },
    {
      title: "Manage user and role risk",
      description: "Confirm access roles, recruiter/admin assignments, and unusual account growth before expanding operations.",
      href: "/dashboard/admin/users",
      icon: Users,
      meta: "Access and permission hygiene",
    },
  ];

  const actionGroups = [
    {
      title: "Content Management",
      items: [
        { label: "Courses", href: "/dashboard/admin/courses", icon: GraduationCap, description: "Create, edit sections, lessons & quizzes" },
        { label: "Labs", href: "/dashboard/admin/labs", icon: Microscope, description: "Lab environments & CTF flags" },
        { label: "Master Classes", href: "/dashboard/admin/master-classes", icon: Video, description: "Schedule live sessions" },
        { label: "Trainers", href: "/dashboard/admin/trainers", icon: Calendar, description: "Add trainers & availability" },
      ],
    },
    {
      title: "Gamification",
      items: [
        { label: "Challenges", href: "/dashboard/admin/challenges", icon: Target, description: "Create & manage competitive challenges" },
        { label: "Seasons", href: "/dashboard/admin/seasons", icon: Calendar, description: "Season lifecycle, XP multipliers" },
        { label: "Battle Pass", href: "/dashboard/admin/battle-pass", icon: Layers, description: "Tier-based progression rewards" },
        { label: "Boss Missions", href: "/dashboard/admin/boss-missions", icon: Swords, description: "Boss fights with XP & rating rewards" },
        { label: "Badges", href: "/dashboard/admin/badges", icon: Award, description: "Achievement badges & rewards" },
      ],
    },
    {
      title: "Assessment & AI",
      items: [
        { label: "Assessments", href: "/dashboard/admin/assessments", icon: ClipboardCheck, description: "Skill assessments & quizzes" },
        { label: "AI Content Engine", href: "/dashboard/admin/ai-generator", icon: Sparkles, description: "Generate briefings, questions, outlines" },
        { label: "Content Refresh", href: "/dashboard/admin/content-refresh", icon: RefreshCw, description: "AI-powered content freshness" },
      ],
    },
    {
      title: "Analytics & Monitoring",
      items: [
        { label: "Analytics", href: "/dashboard/admin/analytics", icon: TrendingUp, description: "User growth, engagement & completion metrics" },
        { label: "Lab Analytics", href: "/dashboard/admin/analytics/labs", icon: Microscope, description: "Step-level insights, difficulty calibration" },
        { label: "Cohort Intelligence", href: "/dashboard/admin/cohort-intelligence", icon: Users, description: "Assessment analytics per cohort" },
        { label: "Predictive Analytics", href: "/dashboard/admin/predictive-analytics", icon: ShieldAlert, description: "At-risk predictions & interventions" },
        { label: "Tutoring Analytics", href: "/dashboard/admin/tutoring-analytics", icon: GraduationCap, description: "AI tutoring interaction insights" },
        { label: "Lab Monitoring", href: "/dashboard/admin/monitoring", icon: Activity, description: "Monitor active users & force-stop labs" },
        { label: "Audit Logs", href: "/dashboard/admin/audit", icon: ScrollText, description: "Security and admin action trail" },
      ],
    },
    {
      title: "User Management",
      items: [
        { label: "Users", href: "/dashboard/admin/users", icon: Users, description: "User accounts & role management" },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Admin Dashboard"
        description="Run content, operations, risk, and institutional delivery from one control surface"
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#18344f] p-6 sm:p-7">
        <div className="absolute inset-0 dot-grid-bg opacity-[0.04] pointer-events-none" />
        <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Operations Console</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Keep delivery quality, access control, and platform evidence aligned</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              The admin journey should start with platform health, then move into curriculum and assessment control, and only then into expansion work.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Today&apos;s focus</p>
                <p className="mt-2 text-sm font-semibold text-white">Risk, delivery, governance</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Primary route</p>
                <p className="mt-2 text-sm font-semibold text-white">Monitor, review, then update</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Why it matters</p>
                <p className="mt-2 text-sm font-semibold text-white">Institutional trust depends on controlled operations</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#7AD62A]/20 bg-[#0b1627]/80 p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-[#7AD62A]" />
              <p className="text-sm font-semibold text-white">Suggested admin order</p>
            </div>
            <div className="mt-4 space-y-3">
              {[
                "Open monitoring before making operational changes.",
                "Check users and audit logs when role or access activity spikes.",
                "Review assessments and content quality before promoting new pathways.",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0f172a] p-5 transition-all duration-300 hover:shadow-md">
            <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-white/10" />
            <card.icon size={20} className="mb-3 text-[#7AD62A]" />
            <div className="text-2xl font-bold text-white">{card.value}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-300">{card.label}</span>
              <span className="rounded-full bg-[#7AD62A]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#7AD62A]">{card.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {operatingPriorities.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-2xl border border-white/10 bg-[#0f172a] p-5 transition-all hover:border-[#7AD62A]/20 hover:bg-white/[0.03]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center">
                <item.icon size={18} className="text-[#7AD62A]" />
              </div>
              <ArrowRight size={16} className="text-slate-500 transition-all group-hover:translate-x-1 group-hover:text-[#7AD62A]" />
            </div>
            <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.meta}</p>
            <h3 className="mt-2 text-base font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.description}</p>
          </Link>
        ))}
      </div>

      <div className="space-y-6">
        {actionGroups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">{group.title}</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((link) => (
                <Link key={link.href} href={link.href} className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0f172a] p-5 transition-all duration-300 hover:border-[#7AD62A]/20 hover:bg-white/[0.03] hover:shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7AD62A]/10 transition-colors duration-300 group-hover:bg-[#7AD62A]/15">
                      <link.icon size={18} className="text-[#7AD62A] transition-colors duration-300" />
                    </div>
                    <ArrowRight size={16} className="text-slate-500 transition-all group-hover:translate-x-1 group-hover:text-[#7AD62A]" />
                  </div>
                  <h4 className="mb-0.5 font-semibold text-white transition-colors group-hover:text-[#7AD62A]">{link.label}</h4>
                  <p className="text-xs text-slate-300">{link.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
