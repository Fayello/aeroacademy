"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap, Microscope, Video, Calendar, Users, Loader2, ArrowRight, BarChart3, Activity, TrendingUp, Award, BookOpen, Shield } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi("/dashboard/public-stats").catch(() => ({})),
      fetchApi("/master-classes").catch(() => []),
      fetchApi("/training/trainers").catch(() => []),
      fetchApi("/admin/users/stats").catch(() => ({ total: 0, byRole: [] })),
    ]).then(([s, mc, t, u]) => {
      setStats({
        ...s,
        masterClasses: Array.isArray(mc) ? mc.length : 0,
        trainers: Array.isArray(t) ? t.length : 0,
        users: u.total || 0,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>;
  }

  const cards = [
    { label: "Students", value: stats?.totalStudents || 0, icon: Users, color: "emerald", bg: "bg-emerald-500" },
    { label: "Courses", value: stats?.totalCourses || 0, icon: GraduationCap, color: "blue", bg: "bg-blue-500" },
    { label: "Labs", value: stats?.totalLabs || 0, icon: Microscope, color: "violet", bg: "bg-violet-500" },
    { label: "Master Classes", value: stats?.masterClasses || 0, icon: Video, color: "amber", bg: "bg-amber-500" },
    { label: "Trainers", value: stats?.trainers || 0, icon: Calendar, color: "rose", bg: "bg-rose-500" },
    { label: "Total Users", value: stats?.users || 0, icon: Users, color: "slate", bg: "bg-slate-500" },
  ];

  const quickLinks = [
    { label: "Manage Courses", href: "/dashboard/admin/courses", icon: GraduationCap, description: "Create, edit sections, lessons & quizzes" },
    { label: "Manage Labs", href: "/dashboard/admin/labs", icon: Microscope, description: "Lab environments & CTF flags" },
    { label: "Manage Master Classes", href: "/dashboard/admin/master-classes", icon: Video, description: "Schedule live sessions" },
    { label: "Manage Trainers", href: "/dashboard/admin/trainers", icon: Calendar, description: "Add trainers & availability" },
    { label: "Manage Users", href: "/dashboard/admin/users", icon: Users, description: "User accounts & role management" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center"><BarChart3 size={24} className="text-emerald-400" /></div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-slate-300 text-sm">Platform overview and management</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2"><Activity size={16} className="text-emerald-400" /><span className="text-sm font-medium">{stats?.totalStudents || 0} Active Students</span></div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2"><TrendingUp size={16} className="text-emerald-400" /><span className="text-sm font-medium">{stats?.totalCourses || 0} Courses</span></div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2"><Shield size={16} className="text-emerald-400" /><span className="text-sm font-medium">{stats?.totalLabs || 0} Labs</span></div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="relative overflow-hidden bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all duration-300">
            <div className={`absolute top-0 right-0 w-20 h-20 ${card.bg} opacity-10 rounded-bl-full`}></div>
            <card.icon size={20} className={`text-${card.color}-600 mb-3`} />
            <div className="text-2xl font-bold text-slate-900">{card.value}</div>
            <div className="text-sm text-slate-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="group relative overflow-hidden bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-emerald-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-300">
                  <link.icon size={20} className="text-emerald-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors mb-1">{link.label}</h4>
              <p className="text-sm text-slate-500">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
