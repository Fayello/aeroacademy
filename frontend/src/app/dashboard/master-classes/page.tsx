"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Video, Calendar, Users, Search, Clock, CalendarPlus } from "lucide-react";
import { fetchApi } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import type { MasterClass } from "@/types/api";

const CATEGORIES = ["All", "SECURITY", "LINUX", "DEVOPS", "CLOUD"];

export default function MasterClassesPage() {
  const [classes, setClasses] = useState<MasterClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredClasses = classes.filter((mc) => {
    const q = searchQuery.trim().toLowerCase();
    return (
      !q ||
      mc.title?.toLowerCase().includes(q) ||
      mc.description?.toLowerCase().includes(q) ||
      mc.instructorName?.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    fetchApi(`/master-classes?${params}`)
      .then((data) => { if (!cancelled) setClasses(Array.isArray(data) ? data : data.data || []); })
      .catch((err) => { if (!cancelled && err?.message !== 'Session expired') { /* non-fatal */ } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [category]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Master Classes"
        description={`${filteredClasses.length} class${filteredClasses.length !== 1 ? "es" : ""} available`}
      />

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search master classes..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#0f172a] border border-white/10 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                category === cat
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-slate-100 text-slate-500 border-white/10 hover:border-white/10"
              }`}
            >
              {cat === "All" ? "All" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Master Classes Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((id) => (
            <div key={id} className="angular-card border border-white/10 overflow-hidden">
              <div className="h-40 bg-white/10 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                <div className="h-5 w-3/4 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-full bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="angular-card border border-white/10 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <Video size={28} className="text-orange-500" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">
            {searchQuery.trim() ? "No matching master classes" : "No master classes scheduled"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery.trim()
              ? "Try a different search term or category."
              : "Expert-led sessions are being planned. They'll appear here once scheduled."}
          </p>
          {searchQuery.trim() && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-all"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((mc: MasterClass) => (
            <Link
              key={mc.id}
              href={`/dashboard/master-classes/${mc.id}`}
              className="group relative overflow-hidden angular-card border border-white/10 hover:border-white/10 hover-lift transition-all duration-300"
            >
              {/* Gradient Header */}
              <div className="h-40 bg-gradient-to-br from-violet-500 via-purple-500 to-[#7AD62A] flex items-center justify-center relative">
                <Video size={36} className="text-white/80" />
                {mc.status === "LIVE" && (
                  <span className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg shadow-red-500/30 animate-pulse">
                    <span className="w-2 h-2 bg-[#0f172a] rounded-full" /> LIVE
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
                    mc.status === "UPCOMING" ? "bg-[#7AD62A]/10 text-[#0F203A]" :
                    mc.status === "LIVE" ? "bg-red-500/10 text-red-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>{mc.status}</span>
                </div>
                <h3 className="font-bold text-white group-hover:text-slate-200 transition-colors mb-2">{mc.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{mc.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  {mc.instructorName && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-8 h-8 rounded-full bg-[#7AD62A]/10 flex items-center justify-center text-[#0F203A] font-bold text-xs">
                        {(mc.instructorName || "I").charAt(0)}
                      </span>
                      {mc.instructorName}
                    </span>
                  )}
                  {mc.scheduledAt && (
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(mc.scheduledAt).toLocaleDateString()}</span>
                  )}
                  {mc.scheduledAt && mc.status === "UPCOMING" && (() => {
                    const diff = new Date(mc.scheduledAt).getTime() - now.getTime();
                    if (diff <= 0) return null;
                    const days = Math.floor(diff / 86400000);
                    const hours = Math.floor((diff % 86400000) / 3600000);
                    const minutes = Math.floor((diff % 3600000) / 60000);
                    return (
                      <span className="flex items-center gap-1 text-[#7AD62A] font-medium"><Clock size={12} /> {days}d {hours}h {minutes}m</span>
                    );
                  })()}
                  {mc._count && (
                    <span className="flex items-center gap-1"><Users size={12} /> {mc._count.registrations}</span>
                  )}
                </div>

                {/* Add to Calendar for upcoming */}
                {mc.status === "UPCOMING" && mc.scheduledAt && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const start = new Date(mc.scheduledAt!);
                      const end = new Date(start.getTime() + (mc.duration || 60) * 60000);
                      const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
                      const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${fmt(start)}\nDTEND:${fmt(end)}\nSUMMARY:${mc.title}\nDESCRIPTION:${mc.description || ""}\nEND:VEVENT\nEND:VCALENDAR`;
                      const blob = new Blob([ics], { type: "text/calendar" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url; a.download = `${mc.title.replace(/\s+/g, "_")}.ics`; a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7AD62A] bg-[#7AD62A]/10 rounded-lg hover:bg-[#7AD62A]/20 transition-colors"
                  >
                    <CalendarPlus size={12} /> Add to Calendar
                  </button>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
