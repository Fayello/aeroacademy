"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Video, Calendar, UserCheck, Loader2, Users, Search, X } from "lucide-react";
import { fetchApi } from "@/lib/api";

const CATEGORIES = ["All", "SECURITY", "LINUX", "DEVOPS", "CLOUD"];

export default function MasterClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClasses = (classes || []).filter((mc: { title?: string; description?: string; instructorName?: string }) => {
    const q = searchQuery.trim().toLowerCase();
    return (
      !q ||
      mc.title?.toLowerCase().includes(q) ||
      mc.description?.toLowerCase().includes(q) ||
      mc.instructorName?.toLowerCase().includes(q)
    );
  });

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Master Classes</h1>
        <div className="relative mt-4 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search master classes..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                category === cat
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat === "All" ? "All" : cat}
            </button>
          ))}
        </div>
        {searchQuery.trim() && (
          <p className="mt-3 text-xs text-slate-500">
            Showing {filteredClasses.length} of {classes.length} master classes
          </p>
        )}
      </div>

      {/* Master Classes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Video size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {searchQuery.trim() ? "No matching master classes" : "No master classes found"}
          </h3>
          <p className="text-sm text-slate-500">
            {searchQuery.trim()
              ? "Try a different search term or category."
              : "Check back later for upcoming sessions."}
          </p>
          {searchQuery.trim() && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-all"
            >
              <X size={14} /> Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((mc: any) => (
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
