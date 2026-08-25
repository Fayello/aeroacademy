"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap, Microscope, Video, Calendar, Users, Loader2, ArrowRight, BarChart3, Activity, ScrollText, TrendingUp, Target, Award, ClipboardCheck, Layers, Swords, Sparkles } from "lucide-react";
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
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <div key={id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
              <div className="h-5 w-5 bg-slate-200 rounded animate-pulse" />
              <div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Students", value: stats?.totalStudents || 0, icon: Users, color: "emerald", bg: "bg-[#229C62]" },
    { label: "Courses", value: stats?.totalCourses || 0, icon: GraduationCap, color: "blue", bg: "bg-blue-500" },
    { label: "Labs", value: stats?.totalLabs || 0, icon: Microscope, color: "violet", bg: "bg-violet-500" },
    { label: "Master Classes", value: stats?.masterClasses || 0, icon: Video, color: "amber", bg: "bg-amber-500" },
    { label: "Trainers", value: stats?.trainers || 0, icon: Calendar, color: "rose", bg: "bg-rose-500" },
    { label: "Total Users", value: stats?.users || 0, icon: Users, color: "slate", bg: "bg-slate-500" },
  ];

  const quickLinks = [
    { label: "Manage Courses", href: "/dashboard/admin/courses", icon: GraduationCap, description: "Create, edit sections, lessons & quizzes" },
    { label: "Manage Labs", href: "/dashboard/admin/labs", icon: Microscope, description: "Lab environments & CTF flags" },
    { label: "Manage Challenges", href: "/dashboard/admin/challenges", icon: Target, description: "Create & manage competitive challenges" },
    { label: "Manage Seasons", href: "/dashboard/admin/seasons", icon: Calendar, description: "Season lifecycle, XP multipliers, rotation" },
    { label: "Manage Battle Pass", href: "/dashboard/admin/battle-pass", icon: Layers, description: "Tier-based progression rewards" },
    { label: "Manage Boss Missions", href: "/dashboard/admin/boss-missions", icon: Swords, description: "Boss fights with XP & rating rewards" },
    { label: "Manage Badges", href: "/dashboard/admin/badges", icon: Award, description: "Define achievement badges & rewards" },
    { label: "Manage Assessments", href: "/dashboard/admin/assessments", icon: ClipboardCheck, description: "Create skill assessments & quizzes" },
    { label: "Lab Monitoring", href: "/dashboard/admin/monitoring", icon: Activity, description: "Monitor active users & force-stop labs" },
    { label: "Analytics", href: "/dashboard/admin/analytics", icon: TrendingUp, description: "User growth, engagement & completion metrics" },
    { label: "Lab Analytics", href: "/dashboard/admin/analytics/labs", icon: Microscope, description: "Step-level insights, difficulty calibration & trends" },
    { label: "Audit Logs", href: "/dashboard/admin/audit", icon: ScrollText, description: "Security and administrative action trail" },
    { label: "Manage Master Classes", href: "/dashboard/admin/master-classes", icon: Video, description: "Schedule live sessions" },
    { label: "Manage Trainers", href: "/dashboard/admin/trainers", icon: Calendar, description: "Add trainers & availability" },
    { label: "Manage Users", href: "/dashboard/admin/users", icon: Users, description: "User accounts & role management" },
    { label: "AI Content Engine", href: "/dashboard/admin/ai-generator", icon: Sparkles, description: "Generate briefings, questions, outlines & calibrate" },
    { label: "Cohort Intelligence", href: "/dashboard/admin/cohort-intelligence", icon: Users, description: "Assessment analytics per cohort" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Admin Dashboard"
        description="Manage your platform"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="relative overflow-hidden bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all duration-300">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-slate-100 opacity-60 rounded-bl-full`}></div>
            <card.icon size={20} className="text-slate-600 mb-3" />
            <div className="text-2xl font-bold text-slate-900">{card.value}</div>
            <div className="text-sm text-slate-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="group relative overflow-hidden bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-slate-800 transition-colors duration-300">
                  <link.icon size={20} className="text-slate-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="font-semibold text-slate-900 group-hover:text-slate-700 transition-colors mb-1">{link.label}</h4>
              <p className="text-sm text-slate-500">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
