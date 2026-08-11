"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Video, Calendar, Clock, UserCheck, ArrowRight, Loader2, Users } from "lucide-react";
import { fetchApi } from "@/lib/api";

const CATEGORIES = ["All", "SECURITY", "LINUX", "DEVOPS", "CLOUD"];

export default function MasterClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    fetchApi(`/master-classes?${params}`)
      .then((data: any) => setClasses(Array.isArray(data) ? data : data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Video size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Master Classes</h1>
              <p className="text-violet-100 text-sm">Live sessions and recorded classes from expert instructors</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  category === cat
                    ? "bg-white text-violet-600"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {cat === "All" ? "All Categories" : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Master Classes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Video size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No master classes found</h3>
          <p className="text-sm text-slate-500">Check back later for upcoming sessions.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((mc: any) => (
            <Link
              key={mc.id}
              href={`/dashboard/master-classes/${mc.id}`}
              className="group relative overflow-hidden bg-white rounded-xl border border-slate-200 hover:shadow-lg hover:border-violet-300 transition-all duration-300"
            >
              {/* Gradient Header */}
              <div className="h-40 bg-gradient-to-br from-violet-500 via-purple-500 to-emerald-500 flex items-center justify-center relative">
                <Video size={36} className="text-white/80" />
                {mc.status === "LIVE" && (
                  <span className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE
                  </span>
                )}
                {mc.status === "COMPLETED" && mc.recordingUrl && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/50 text-white text-xs rounded-full">Recorded</span>
                )}
                <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/40 text-white text-xs rounded-full font-medium">{mc.duration}min</span>
              </div>
              
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-violet-600 font-semibold">{mc.category}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    mc.status === "UPCOMING" ? "bg-emerald-50 text-emerald-700" :
                    mc.status === "LIVE" ? "bg-red-50 text-red-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>{mc.status}</span>
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-violet-600 transition-colors mb-2">{mc.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{mc.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  {mc.instructorName && (
                    <span className="flex items-center gap-1"><UserCheck size={12} /> {mc.instructorName}</span>
                  )}
                  {mc.scheduledAt && (
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(mc.scheduledAt).toLocaleDateString()}</span>
                  )}
                  {mc._count && (
                    <span className="flex items-center gap-1"><Users size={12} /> {mc._count.registrations}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
