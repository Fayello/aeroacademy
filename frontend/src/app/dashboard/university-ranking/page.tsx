"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import { Trophy, Users, TrendingUp, Crown, Medal, School, Search, ClipboardCheck } from "lucide-react";
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
            <div key={i} className="angular-card bg-[#0f172a] p-6 animate-pulse">
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
        description="Compare university participation and practical output with clearer institutional signals"
        action={
          <span className="text-xs text-slate-400">{universities.length} universities</span>
        }
      />

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#1b3657] p-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Institutional Benchmarking</p>
            <h2 className="mt-2 text-2xl font-bold text-white">See which universities are building measurable learner momentum</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Rankings should support institutional comparison, not just competition. Use them to understand cohort participation, practical engagement, and growth signals across universities.
            </p>
          </div>
          <div className="rounded-2xl border border-[#7AD62A]/20 bg-[#0b1627]/80 p-5">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={16} className="text-[#7AD62A]" />
              <p className="text-sm font-semibold text-white">How to read this board</p>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4">Start with total XP, then compare how many students are contributing to that outcome.</p>
              <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4">Use average XP to distinguish broad cohort strength from a few standout learners.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Season banner */}
      {season && (
        <div className="angular-card text-white p-5 overflow-hidden relative" style={{ backgroundColor: "#0F203A" }}>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7AD62A]/20 flex items-center justify-center">
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
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#7AD62A]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="angular-card bg-[#0f172a] p-4 text-center">
          <School size={20} className="mx-auto mb-2 text-[#7AD62A]" />
          <p className="text-xl font-bold text-white">{universities.length}</p>
          <p className="text-xs text-slate-500">Universities</p>
        </div>
        <div className="angular-card bg-[#0f172a] p-4 text-center">
          <Users size={20} className="mx-auto mb-2 text-blue-500" />
          <p className="text-xl font-bold text-white">{totalStudents}</p>
          <p className="text-xs text-slate-500">Students</p>
        </div>
        <div className="angular-card bg-[#0f172a] p-4 text-center">
          <TrendingUp size={20} className="mx-auto mb-2 text-[#7AD62A]" />
          <p className="text-xl font-bold text-white">{(totalXp / 1000).toFixed(0)}k</p>
          <p className="text-xs text-slate-500">Total XP</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search universities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#0f172a] py-2.5 pl-10 pr-4 text-sm text-slate-200 transition-all focus:border-[#7AD62A] focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20"
        />
      </div>

      {/* Rankings table */}
      {filtered.length === 0 ? (
        <div className="angular-card bg-[#0f172a] p-12 text-center">
          <School size={40} className="mx-auto mb-3 text-slate-300" />
          <h3 className="text-sm font-semibold text-white mb-1">No universities found</h3>
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
                    ? "border-[#7AD62A]/30 bg-[#7AD62A]/10/30"
                    : isTop3
                    ? "border-[#7AD62A]/15 bg-[#0f172a]"
                    : "border-white/10 bg-[#0f172a]"
                }`}
              >
                <div className={`h-0.5 w-full ${isFirst ? "bg-[#7AD62A]" : isTop3 ? "bg-[#7AD62A]" : "bg-white/10"} opacity-40`} />
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                      isFirst
                        ? "bg-[#7AD62A] text-[#0F203A]"
                        : isTop3
                        ? "bg-[#7AD62A] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isFirst ? <Crown size={20} /> : isTop3 ? <Medal size={18} /> : rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{uni.name}</h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users size={10} />
                        {uni.studentCount} student{uni.studentCount !== 1 ? "s" : ""}
                      </span>
                      <span>·</span>
                      <span>{avgXp.toLocaleString()} avg XP</span>
                    </div>
                  </div>

                  <div className="grid shrink-0 grid-cols-2 gap-3 text-center sm:min-w-[13rem] sm:grid-cols-2">
                    <div className="rounded-lg bg-white/[0.04] p-3">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Total XP</p>
                      <p className="mt-1 text-sm font-bold text-white">{uni.totalXp.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.04] p-3">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Average XP</p>
                      <p className="mt-1 text-sm font-bold text-white">{avgXp.toLocaleString()}</p>
                    </div>
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
