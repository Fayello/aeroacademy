"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, MapPin, GraduationCap, Star, ChevronRight, Loader2, ChevronLeft } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { CAMEROON_CITIES } from "@/lib/constants";
import Link from "next/link";
import toast from "@/lib/toast";
import ClassroomCommand from "@/components/enterprise/ClassroomCommand";
import PageHeader from "@/components/ui/PageHeader";

interface Talent {
  id: string;
  name: string;
  email: string;
  city: string;
  xp: number;
  rank: number;
  division: string;
  bio: string;
  organization: { name: string; type: string } | null;
  achievements: { achievement: { id: string; title: string; description: string; icon: string; category: string; xpReward: number } }[];
  _count: { labSubmissions: number };
}

const divisionBadge: Record<string, string> = {
  TITAN: "bg-indigo-100 text-indigo-700 border-indigo-200",
  DIAMOND: "bg-blue-100 text-blue-700 border-blue-200",
  PLATINUM: "bg-[#7AD62A]/10 text-[#0F203A] border-[#7AD62A]/20",
  GOLD: "bg-amber-100 text-amber-700 border-amber-200",
};

const PAGE_SIZE = 12;

export default function EnterprisePortal() {
  const [talent, setTalent] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());
  const [showShortlistedOnly, setShowShortlistedOnly] = useState(false);
  const [view, setView] = useState<"TALENT" | "CLASSROOM">("TALENT");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const cities = ["All", ...CAMEROON_CITIES];

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setUserRole(user.role ?? null);
    } catch {
      setUserRole(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchApi("/recruitment/talent-pool");
        if (!cancelled) setTalent(data);
      } catch {
        toast.error("Failed to load talent pool.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    (async () => {
      try {
        const data = await fetchApi("/recruitment/shortlisted");
        if (!cancelled) setShortlisted(new Set(data.map((s: { studentId: string }) => s.studentId)));
      } catch { /* ignore */ }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleShortlist = async (studentId: string) => {
    try {
      const res = await fetchApi("/recruitment/shortlist/toggle", {
        method: "POST",
        body: JSON.stringify({ studentId }),
      });
      setShortlisted((prev) => {
        const next = new Set(prev);
        if (res.shortlisted) next.add(studentId); else next.delete(studentId);
        return next;
      });
      toast.success(res.shortlisted ? "Candidate shortlisted" : "Removed from shortlist");
    } catch {
      toast.error("Action failed.");
    }
  };

  const filteredTalent = useMemo(() => {
    return talent.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.organization?.name.toLowerCase().includes(search.toLowerCase());
      const matchesCity = selectedCity === "All" || t.city === selectedCity;
      const matchesShortlist = !showShortlistedOnly || shortlisted.has(t.id);
      return matchesSearch && matchesCity && matchesShortlist;
    });
  }, [talent, search, selectedCity, showShortlistedOnly, shortlisted]);

  const totalPages = Math.ceil(filteredTalent.length / PAGE_SIZE);
  const paginatedTalent = filteredTalent.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
        <div className="h-10 w-full max-w-md bg-white/10 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <div key={id} className="bg-[#0f172a] rounded-xl border border-white/10 p-5 space-y-4">
              <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/10 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Enterprise Portal" description="Discover and recruit top security talent." />
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>{talent.length} candidates</span>
          <span className="text-slate-300">|</span>
          <span>{shortlisted.size} saved</span>
        </div>
      </div>

      {(userRole === "ADMIN" || userRole === "RECRUITER") && (
        <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
          <button onClick={() => setView("TALENT")} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "TALENT" ? "bg-[#0f172a] text-white shadow-sm" : "text-slate-500 hover:text-slate-200"}`}>
            Talent Pool
          </button>
          <button onClick={() => setView("CLASSROOM")} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "CLASSROOM" ? "bg-[#0f172a] text-white shadow-sm" : "text-slate-500 hover:text-slate-200"}`}>
            Classroom
          </button>
        </div>
      )}

      {view === "CLASSROOM" ? (
        <ClassroomCommand />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search by name or institution..." className="input-field pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setShowShortlistedOnly(!showShortlistedOnly)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${showShortlistedOnly ? "bg-slate-800 text-white border border-slate-800" : "bg-slate-100 text-slate-600 hover:bg-white/10"}`}>
                <Star size={12} className="inline mr-1" fill={showShortlistedOnly ? "currentColor" : "none"} />
                Saved
              </button>
              {cities.map((city) => (
                <button key={city} onClick={() => setSelectedCity(city)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedCity === city ? "bg-slate-800 text-white border border-slate-800" : "bg-slate-100 text-slate-600 hover:bg-white/10"}`}>
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Talent grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTalent.map((t) => (
              <div key={t.id} className="bg-[#0f172a] rounded-xl border border-white/10 p-5 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${divisionBadge[t.division] || "bg-slate-100 text-slate-600 border-white/10"}`}>
                    {t.division}
                  </span>
                  <button onClick={() => handleToggleShortlist(t.id)} className={`p-1.5 rounded-lg transition-colors ${shortlisted.has(t.id) ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:text-slate-300 hover:bg-white/5"}`} aria-label={shortlisted.has(t.id) ? `Remove ${t.name} from shortlist` : `Add ${t.name} to shortlist`}>
                    <Star size={14} fill={shortlisted.has(t.id) ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                    {t.name?.[0] || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{t.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={10} />
                      {t.city}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-slate-500">Rank</p>
                    <p className="font-semibold text-white">{t.rank || 1200}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-slate-500">Labs</p>
                    <p className="font-semibold text-white">{t._count.labSubmissions}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <GraduationCap size={12} />
                  <span className="truncate">{t.organization?.name || "Independent"}</span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Link href={`/dashboard/enterprise/registry/${t.id}`} className="flex-1 btn-primary text-xs py-2 justify-center">
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-slate-100 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-slate-100 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {filteredTalent.length === 0 && (
            <div className="bg-[#0f172a] rounded-xl border border-white/10 py-16 text-center">
              <p className="text-sm font-medium text-slate-500">No candidates match your criteria.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
