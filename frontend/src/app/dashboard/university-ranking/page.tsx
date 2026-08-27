"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import { Trophy, Users, TrendingUp, Crown, Medal, School } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

interface UniversityStat {
  id: string;
  name: string;
  totalXp: number;
  studentCount: number;
}

interface Season {
  name: string;
  startDate: string;
  endDate: string;
}

export default function UniversityRankingPage() {
  const [universities, setUniversities] = useState<UniversityStat[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi("/dashboard/leagues");
        setUniversities(data.university || []);
        setSeason(data.season || null);
      } catch {
        setUniversities([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return universities;
    return universities.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));
  }, [universities, search]);

  const totalStudents = universities.reduce((acc, u) => acc + u.studentCount, 0);
  const totalXp = universities.reduce((acc, u) => acc + u.totalXp, 0);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="University Rankings" description="Top universities by total XP" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="angular-card bg-white p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="University Rankings"
        description="Universities ranked by total XP earned by their students"
        action={
          <span className="text-xs text-slate-400">{universities.length} universities</span>
        }
      />

      {/* Season banner */}
      {season && (
        <div className="angular-card text-white p-5 overflow-hidden relative" style={{ backgroundColor: "#0F203A" }}>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#229C62]/20 flex items-center justify-center">
                <Trophy size={18} className="text-[#7AD62A]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{season.name}</h3>
                <p className="text-xs text-white/60">
                  Ends {new Date(season.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40">Season Stats</p>
              <p className="text-sm font-bold text-[#7AD62A]">{totalStudents} students · {(totalXp / 1000).toFixed(0)}k XP</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#229C62]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="angular-card bg-white p-4 text-center">
          <School size={20} className="mx-auto mb-2 text-[#229C62]" />
          <p className="text-xl font-bold text-slate-900">{universities.length}</p>
          <p className="text-xs text-slate-500">Universities</p>
        </div>
        <div className="angular-card bg-white p-4 text-center">
          <Users size={20} className="mx-auto mb-2 text-blue-500" />
          <p className="text-xl font-bold text-slate-900">{totalStudents}</p>
          <p className="text-xs text-slate-500">Students</p>
        </div>
        <div className="angular-card bg-white p-4 text-center">
          <TrendingUp size={20} className="mx-auto mb-2 text-[#7AD62A]" />
          <p className="text-xl font-bold text-slate-900">{(totalXp / 1000).toFixed(0)}k</p>
          <p className="text-xs text-slate-500">Total XP</p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search universities..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62] transition-all"
      />

      {/* Rankings table */}
      {filtered.length === 0 ? (
        <div className="angular-card bg-white p-12 text-center">
          <School size={40} className="mx-auto mb-3 text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-900 mb-1">No universities found</h3>
          <p className="text-xs text-slate-500">
            {search ? "Try a different search term" : "Universities will appear here once students enroll"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((uni, idx) => {
            const rank = idx + 1;
            const avgXp = uni.studentCount > 0 ? Math.round(uni.totalXp / uni.studentCount) : 0;
            const isFirst = rank === 1;
            const isTop3 = rank <= 3;

            return (
              <div
                key={uni.id}
                className={`angular-card border transition-all hover-lift ${
                  isFirst
                    ? "border-[#7AD62A]/30 bg-[#E9F8EE]/30"
                    : isTop3
                    ? "border-[#229C62]/15 bg-white"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className={`h-0.5 w-full ${isFirst ? "bg-[#7AD62A]" : isTop3 ? "bg-[#229C62]" : "bg-slate-200"} opacity-40`} />
                <div className="p-4 flex items-center gap-4">
                  {/* Rank */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                      isFirst
                        ? "bg-[#7AD62A] text-[#0F203A]"
                        : isTop3
                        ? "bg-[#229C62] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isFirst ? <Crown size={20} /> : isTop3 ? <Medal size={18} /> : rank}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{uni.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Users size={10} />
                        {uni.studentCount} student{uni.studentCount !== 1 ? "s" : ""}
                      </span>
                      <span>·</span>
                      <span>{avgXp.toLocaleString()} avg XP</span>
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">{uni.totalXp.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">XP</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
