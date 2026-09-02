"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  MapPin,
  GraduationCap,
  Star,
  ChevronRight,
  ChevronLeft,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  ShieldCheck,
  Users,
  Target,
} from "lucide-react";
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
  DIAMOND: "bg-blue-500/10 text-blue-400 border-blue-200",
  PLATINUM: "bg-[#7AD62A]/10 text-[#0F203A] border-[#7AD62A]/20",
  GOLD: "bg-amber-500/10 text-amber-400 border-amber-200",
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
  const [userRole] = useState<string | null>(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.role ?? null;
    } catch {
      return null;
    }
  });
  const [page, setPage] = useState(1);

  const cities = ["All", ...CAMEROON_CITIES];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchApi<Talent[]>("/recruitment/talent-pool");
        if (!cancelled) setTalent(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Failed to load talent pool.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    (async () => {
      try {
        const data = await fetchApi<{ studentId: string }[]>("/recruitment/shortlisted");
        if (!cancelled) setShortlisted(new Set(data.map((item) => item.studentId)));
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleShortlist = async (studentId: string) => {
    try {
      const res = await fetchApi<{ shortlisted: boolean }>("/recruitment/shortlist/toggle", {
        method: "POST",
        body: JSON.stringify({ studentId }),
      });
      setShortlisted((prev) => {
        const next = new Set(prev);
        if (res.shortlisted) next.add(studentId);
        else next.delete(studentId);
        return next;
      });
      toast.success(res.shortlisted ? "Candidate shortlisted" : "Removed from shortlist");
    } catch {
      toast.error("Action failed.");
    }
  };

  const filteredTalent = useMemo(() => {
    return talent.filter((entry) => {
      const matchesSearch =
        entry.name.toLowerCase().includes(search.toLowerCase()) ||
        entry.organization?.name.toLowerCase().includes(search.toLowerCase());
      const matchesCity = selectedCity === "All" || entry.city === selectedCity;
      const matchesShortlist = !showShortlistedOnly || shortlisted.has(entry.id);
      return matchesSearch && matchesCity && matchesShortlist;
    });
  }, [talent, search, selectedCity, showShortlistedOnly, shortlisted]);

  const totalPages = Math.ceil(filteredTalent.length / PAGE_SIZE);
  const paginatedTalent = filteredTalent.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const shortlistedCandidates = filteredTalent.filter((entry) => shortlisted.has(entry.id)).length;
  const averageRank =
    filteredTalent.length > 0
      ? Math.round(filteredTalent.reduce((sum, entry) => sum + (entry.rank || 1200), 0) / filteredTalent.length)
      : 0;
  const averageLabProof =
    filteredTalent.length > 0
      ? Math.round(filteredTalent.reduce((sum, entry) => sum + entry._count.labSubmissions, 0) / filteredTalent.length)
      : 0;
  const universityLinked = filteredTalent.filter((entry) => entry.organization?.type === "UNIVERSITY").length;
  const highProofCandidates = filteredTalent.filter((entry) => entry._count.labSubmissions >= 10).length;

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

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#193553] p-6 sm:p-7">
        <div className="absolute inset-0 dot-grid-bg opacity-[0.04] pointer-events-none" />
        <div className="relative grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Institutional Workspace</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Review capability evidence, not just profiles</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              This space is for universities, recruiters, and enterprise leaders who need practical proof, cohort visibility, and a more governed way to identify talent.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Talent pool", value: `${talent.length} candidates`, icon: Users },
                { label: "Shortlisted", value: `${shortlisted.size} saved profiles`, icon: Star },
                { label: "Average lab proof", value: `${averageLabProof} completed labs`, icon: ClipboardCheck },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <item.icon size={15} className="text-[#7AD62A]" />
                  <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#7AD62A]/20 bg-[#0b1627]/80 p-5">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-[#7AD62A]" />
              <p className="text-sm font-semibold text-white">Operational focus</p>
            </div>
            <div className="mt-4 space-y-3">
              {[
                "Search for practical evidence, not only credentials.",
                "Shortlist high-signal candidates for follow-up.",
                "Use classroom control to run the same lab experience for a whole cohort.",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {(userRole === "ADMIN" || userRole === "RECRUITER") && (
        <div className="flex bg-white/5 p-1 rounded-lg w-fit">
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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[
              {
                icon: BriefcaseBusiness,
                title: "Recruitment readiness",
                text:
                  shortlistedCandidates > 0
                    ? `${shortlistedCandidates} currently filtered candidate${shortlistedCandidates === 1 ? "" : "s"} already shortlisted for review.`
                    : "Save strong candidates so the evaluation process stays focused.",
              },
              {
                icon: ShieldCheck,
                title: "Evidence quality",
                text:
                  averageRank > 0
                    ? `The current filtered set averages about ${averageRank} rating, helping you compare capability consistency.`
                    : "Rating data becomes more useful as the talent pool grows.",
              },
              {
                icon: ClipboardCheck,
                title: "Verified practical proof",
                text:
                  highProofCandidates > 0
                    ? `${highProofCandidates} filtered candidate${highProofCandidates === 1 ? "" : "s"} already show a deeper practical record with 10 or more lab submissions.`
                    : "As candidates complete more labs, this view becomes stronger for high-confidence screening.",
              },
              {
                icon: Target,
                title: "What to do next",
                text: "Filter the pool, open a candidate record, and compare practical proof before starting outreach.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
                <item.icon size={18} className="text-[#7AD62A]" />
                <h3 className="mt-3 text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Institution mix</p>
              <p className="mt-2 text-2xl font-bold text-white">{universityLinked}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                candidates in the current view are linked to universities, which helps when you want graduate-pipeline sourcing instead of fully independent profiles.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Practical threshold</p>
              <p className="mt-2 text-2xl font-bold text-white">{highProofCandidates}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                candidate{highProofCandidates === 1 ? "" : "s"} in this filtered set already cross a stronger practical-proof threshold for serious review.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Best next action</p>
              <p className="mt-2 text-sm font-semibold text-white">Open registry records before outreach</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Use the registry detail view to compare evidence, readiness, and organization context before you contact a candidate or start a cohort discussion.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search by name or institution..." className="input-field pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setShowShortlistedOnly(!showShortlistedOnly)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${showShortlistedOnly ? "bg-slate-800 text-white border border-slate-800" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                <Star size={12} className="inline mr-1" fill={showShortlistedOnly ? "currentColor" : "none"} />
                Saved
              </button>
              {cities.map((city) => (
                <button key={city} onClick={() => setSelectedCity(city)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedCity === city ? "bg-slate-800 text-white border border-slate-800" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                  {city}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTalent.map((candidate) => (
              <div key={candidate.id} className="bg-[#0f172a] rounded-xl border border-white/10 p-5 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${divisionBadge[candidate.division] || "bg-white/5 text-slate-400 border-white/10"}`}>
                    {candidate.division}
                  </span>
                  <button onClick={() => handleToggleShortlist(candidate.id)} className={`p-1.5 rounded-lg transition-colors ${shortlisted.has(candidate.id) ? "bg-white/5 text-slate-300" : "text-slate-400 hover:text-slate-300 hover:bg-white/5"}`} aria-label={shortlisted.has(candidate.id) ? `Remove ${candidate.name} from shortlist` : `Add ${candidate.name} to shortlist`}>
                    <Star size={14} fill={shortlisted.has(candidate.id) ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-sm font-semibold text-slate-400">
                    {candidate.name?.[0] || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{candidate.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={10} />
                      {candidate.city}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-slate-500">Rank</p>
                    <p className="font-semibold text-white">{candidate.rank || 1200}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-slate-500">Labs</p>
                    <p className="font-semibold text-white">{candidate._count.labSubmissions}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Proof summary</p>
                  <p className="mt-2 text-sm text-slate-300">
                    {candidate.organization?.type === "UNIVERSITY" ? "University-linked candidate" : "Independent or enterprise-linked candidate"} with {candidate._count.labSubmissions} lab submission{candidate._count.labSubmissions === 1 ? "" : "s"} and division {candidate.division}.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <GraduationCap size={12} />
                  <span className="truncate">{candidate.organization?.name || "Independent"}</span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <Link href={`/dashboard/enterprise/registry/${candidate.id}`} className="flex-1 btn-primary text-xs py-2 justify-center">
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {filteredTalent.length === 0 && (
            <div className="bg-[#0f172a] rounded-xl border border-white/10 py-16 text-center">
              <p className="text-sm font-medium text-slate-500">No candidates match your criteria.</p>
              <p className="mt-2 text-xs text-slate-400">Broaden your search or remove the saved-only filter to review the full talent pool.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
