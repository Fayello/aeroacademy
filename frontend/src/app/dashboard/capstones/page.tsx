"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Trophy, Clock, Cpu, Search, Lock, ArrowRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import { getLevel } from "@/lib/levelGating";

interface CapstoneLab {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  estimatedMinutes: number;
  ramRequirement: number;
  flags: { id: string }[];
  labSkills: { skill: { name: string; domain: { name: string } } }[];
}

const DOMAINS = ["ALL", "Security", "DevOps", "DBA", "Networking", "Systems", "Cloud"];

function getDifficultyLabel(d: number) {
  if (d <= 1100) return { label: "BEGINNER", color: "text-green-400 bg-green-400/10" };
  if (d <= 1300) return { label: "INTERMEDIATE", color: "text-amber-400 bg-amber-400/10" };
  if (d <= 1500) return { label: "ADVANCED", color: "text-orange-400 bg-orange-400/10" };
  return { label: "EXPERT", color: "text-rose-400 bg-rose-400/10" };
}

function getRequiredLevel(d: number) {
  if (d <= 1100) return 1;
  if (d <= 1300) return 4;
  if (d <= 1500) return 7;
  return 10;
}

export default function CapstoneCatalog() {
  const [capstones, setCapstones] = useState<CapstoneLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("ALL");
  const [level] = useState(() => {
    try {
      return getLevel(parseInt(localStorage.getItem("xp") || "0", 10));
    } catch {
      return 1;
    }
  });

  useEffect(() => {
    fetchApi<{ data: CapstoneLab[] }>("/labs?take=600")
      .then((res) => {
        const all = res.data || [];
        setCapstones(all.filter((l) => (l as CapstoneLab & { type?: string }).type === "CAPSTONE"));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = capstones.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (domainFilter !== "ALL") {
      const domains = c.labSkills?.map((s) => s.skill?.domain?.name) || [];
      if (!domains.includes(domainFilter)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <PageHeader
        title="Capstones"
        description="Real-world projects that prove you can do the work. Multi-service deployments, production infrastructure, security operations."
      />

      <div className="max-w-7xl mx-auto mt-6">
        {/* Search and filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search capstones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0f172a] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-[#7AD62A]/50"
            />
          </div>
          <div className="flex gap-2">
            {DOMAINS.map((d) => (
              <button
                key={d}
                onClick={() => setDomainFilter(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  domainFilter === d
                    ? "bg-[#7AD62A] text-black"
                    : "bg-[#0f172a] text-gray-400 hover:text-white border border-white/10"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Capstone grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading capstones...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No capstones found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((capstone) => {
              const diff = getDifficultyLabel(capstone.difficulty);
              const reqLevel = getRequiredLevel(capstone.difficulty);
              const locked = level < reqLevel;
              const domains = [...new Set(capstone.labSkills?.map((s) => s.skill?.domain?.name).filter(Boolean))];

              return (
                <Link
                  key={capstone.id}
                  href={locked ? "#" : `/dashboard/capstones/${capstone.id}`}
                  className={`group relative bg-[#0f172a] border border-white/10 rounded-xl p-5 transition hover:border-[#7AD62A]/30 ${
                    locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {locked && (
                    <div className="absolute top-4 right-4">
                      <Lock className="w-4 h-4 text-gray-500" />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-5 h-5 text-[#7AD62A]" />
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${diff.color}`}>
                      {diff.label}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#7AD62A] transition">
                    {capstone.title.replace("Capstone: ", "")}
                  </h3>

                  <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                    {capstone.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {domains.map((d) => (
                      <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {capstone.estimatedMinutes}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        {capstone.ramRequirement ? `${Math.round(capstone.ramRequirement / 1024)}GB` : "512MB"}
                      </span>
                      <span>{capstone.flags?.length || 0} flags</span>
                    </div>
                    {!locked && (
                      <ArrowRight className="w-4 h-4 text-[#7AD62A] opacity-0 group-hover:opacity-100 transition" />
                    )}
                  </div>

                  {locked && (
                    <div className="mt-3 text-xs text-amber-400">
                      Requires Level {reqLevel}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
