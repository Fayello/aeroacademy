"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Microscope, Play, Clock, Shield, Lock, Search, X, LayoutGrid, List, Rocket, Zap } from "lucide-react";
import LabAvatar from "@/components/ui/LabAvatar";
import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import toast from "@/lib/toast";
import { getLevel } from "@/lib/levelGating";
import { getDifficultyStyle, getEstimatedTime, getSolvedCount, getProgressStatus } from "@/lib/labs";
import { getFocusLabelFromOnboarding, getInterestTokensFromOnboarding, readOnboardingSelections, reorderItemsByIds, scoreLabAgainstOnboarding } from "@/lib/onboarding";
import type { DashboardRecommendations, Lab, LabStats } from "@/types/api";

type TabFilter = "all" | "not-started" | "in-progress" | "completed";

const TABS: { id: TabFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "not-started", label: "Not started" },
  { id: "in-progress", label: "In progress" },
  { id: "completed", label: "Completed" },
];

export default function LabsCatalog() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setSystemStats] = useState<LabStats | null>(null);
  const [level] = useState(() => {
    try {
      return getLevel(parseInt(localStorage.getItem("xp") || "0", 10));
    } catch {
      return 1;
    }
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [domainFilter, setDomainFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"featured" | "domain" | "difficulty" | "title">("featured");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [recommendations, setRecommendations] = useState<DashboardRecommendations | null>(null);
  const onboarding = readOnboardingSelections();
  const focusLabel = getFocusLabelFromOnboarding(onboarding);
  const focusTokens = getInterestTokensFromOnboarding(onboarding);
  const recommendedLabIds = recommendations?.labs?.map((lab) => lab.id) || [];

  const DIFFICULTIES = ["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
  const DOMAINS = ["ALL", "Systems", "Networking", "Web Security", "Security", "Cloud", "Databases", "DevOps", "AI & MLOps", "IT Ops"];

  function getLabDomain(lab: Lab): string {
    const t = `${lab.title} ${lab.description}`.toLowerCase();
    if (/(samba|active directory|ad |ldap|kerberos|bloodhound)/.test(t)) return "Systems";
    if (/(bind|dns|dhcp|nfs|iscsi|lvm|wireguard|vpn|bgp|evpn|nat|iptables|vrrp|haproxy)/.test(t)) return "Networking";
    if (/(juice|dvwa|webgoat|nodegoat|vapi|xss|sql injection|ssrf|api security|owasp|waf)/.test(t)) return "Web Security";
    if (/(aws|azure|gcp|cloud|terraform|s3|iam)/.test(t)) return "Cloud";
    if (/(postgres|mysql|mariadb|galera|mongo|redis|elasticsearch|clickhouse|citus|vitess)/.test(t)) return "Databases";
    if (/(docker|kubernetes|k8s|helm|argo|flagger|jenkins|gitlab|ansible|prometheus|grafana|elk|zabbix|wazuh)/.test(t)) return "DevOps";
    if (/(machine learning|deep learning|neural network|llm|nlp|computer vision|ai |artificial intelligence|data science|mlops|model training|inference|transformer|gpt|bert|generative ai|prediction|classification)/.test(t)) return "AI & MLOps";
    if (/(ux|ui|figma|wireframe|prototype|usability|accessibility|user experience|user interface|design system|visual design|interaction design)/.test(t)) return "Design";
    if (/(qdrant|vllm|kubeflow|feast|vector|gpu|kali|parrot|exploit|rop|crypto|side-channel|firmware|apt|fuzz)/.test(t)) return "Security";
    if (/(snipe|cockpit|nextcloud|mail|postfix|rsyslog|vault|finops|beyondcorp|tinkerbell|k3s|ceph|trino)/.test(t)) return "IT Ops";
    return "Systems";
  }

  const filteredLabs = reorderItemsByIds((labs || []), recommendedLabIds)
    .filter((lab) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        lab.title?.toLowerCase().includes(q) ||
        lab.description?.toLowerCase().includes(q);

      const diff = getDifficultyStyle(lab.difficulty || 1200);
      const matchesDifficulty = difficultyFilter === "ALL" || diff.label === difficultyFilter;
      const matchesDomain = domainFilter === "ALL" || getLabDomain(lab) === domainFilter;

      const progressStatus = getProgressStatus(lab.flags);
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "not-started" && progressStatus === "NOT_STARTED") ||
        (activeTab === "in-progress" && progressStatus === "IN_PROGRESS") ||
        (activeTab === "completed" && progressStatus === "COMPLETED");

      return matchesSearch && matchesDifficulty && matchesDomain && matchesTab;
    })
    .sort((a, b) => {
      if (sortBy === "featured") {
        const recommendedA = recommendedLabIds.indexOf(a.id);
        const recommendedB = recommendedLabIds.indexOf(b.id);
        const haystackA = `${a.title} ${a.description}`.toLowerCase();
        const haystackB = `${b.title} ${b.description}`.toLowerCase();
        const scoreA = scoreLabAgainstOnboarding(a.title, a.description, onboarding) +
          focusTokens.reduce((score, token) => score + (haystackA.includes(token) ? 1 : 0), 0);
        const scoreB = scoreLabAgainstOnboarding(b.title, b.description, onboarding) +
          focusTokens.reduce((score, token) => score + (haystackB.includes(token) ? 1 : 0), 0);
        if (recommendedA !== -1 || recommendedB !== -1) {
          if (recommendedA === -1) return 1;
          if (recommendedB === -1) return -1;
          if (recommendedA !== recommendedB) return recommendedA - recommendedB;
        }
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
      if (sortBy === "domain") return getLabDomain(a).localeCompare(getLabDomain(b));
      if (sortBy === "difficulty") return (a.difficulty || 1200) - (b.difficulty || 1200);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });

  const hasActiveFilters = searchQuery !== "" || difficultyFilter !== "ALL" || domainFilter !== "ALL" || activeTab !== "all";

  const tabCounts = {
    all: labs.length,
    "not-started": labs.filter((l) => getProgressStatus(l.flags) === "NOT_STARTED").length,
    "in-progress": labs.filter((l) => getProgressStatus(l.flags) === "IN_PROGRESS").length,
    "completed": labs.filter((l) => getProgressStatus(l.flags) === "COMPLETED").length,
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDifficultyFilter("ALL");
    setDomainFilter("ALL");
    setActiveTab("all");
  };

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [labsData, stats] = await Promise.all([
          fetchApi("/labs?take=600"),
          fetchApi("/labs/stats"),
        ]);
        if (!cancelled) {
          setLabs(labsData);
          setSystemStats(stats);
        }
        fetchApi<DashboardRecommendations>("/dashboard/recommendations?limit=6")
          .then((data) => { if (!cancelled) setRecommendations(data); })
          .catch(() => {});
      } catch {
        if (!cancelled) toast.error("Failed to load labs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="h-10 w-full max-w-md bg-white/10 rounded-lg animate-pulse" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-7 w-20 bg-white/10 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <div key={id} className="angular-card border border-white/10 p-5 space-y-3">
              <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
              <div className="h-5 w-3/4 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-full bg-white/10 rounded animate-pulse" />
              <div className="h-1 w-full bg-white/10 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Labs"
        description={
          focusLabel
            ? `${labs.length} labs available, ranked for ${focusLabel.toLowerCase()}`
            : `${labs.length} lab${labs.length !== 1 ? "s" : ""} available`
        }
      />

      {/* Beginner Path CTA */}
      <Link
          href="/dashboard/starting-point"
          className="angular-card group flex flex-col gap-3 p-4 text-white transition-colors hover:bg-[#1a3a5c] sm:flex-row sm:items-center sm:justify-between"
          style={{ backgroundColor: "#0F203A" }}
        >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7AD62A]/20 flex items-center justify-center">
            <Rocket size={18} className="text-[#7AD62A]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold group-hover:text-[#7AD62A] transition-colors">Just getting started?</h3>
            <p className="text-xs text-white/60">Follow our guided beginner path — build your skills step by step</p>
          </div>
        </div>
        <span className="text-xs text-white/40 transition-colors group-hover:text-[#7AD62A] sm:shrink-0">Begin →</span>
      </Link>

      {focusLabel && recommendedLabIds.length > 0 && (
        <div className="angular-card bg-[#0f172a] border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#7AD62A]">Personalized ranking</p>
            <p className="text-sm text-white mt-1">
              Featured labs are now prioritized for <span className="text-[#7AD62A]">{focusLabel}</span>.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {recommendations?.insights?.journeySummary ||
                "Your interests shape this ranking dynamically, so blended goals like security plus DevOps can surface a mixed practice path."}
            </p>
          </div>
          <Link
            href="/dashboard/starting-point"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] text-sm font-semibold transition-colors"
          >
            {recommendations?.source === "ai" ? "Open AI-guided path" : "Start Guided Path"}
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex min-w-max items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[#7AD62A] text-[#7AD62A]"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-white/10"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-[#7AD62A]/10 text-[#7AD62A]" : "bg-white/5 text-slate-400"
                }`}>
                  {tabCounts[tab.id]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 sm:hidden">View mode</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-300"}`}
              aria-label="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-300"}`}
              aria-label="Table view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Difficulty Filters */}
      <div className="space-y-3">
        <div className="relative max-w-none sm:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search labs..."
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-[#0f172a] border border-white/10 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                difficultyFilter === d
                  ? "bg-[#7AD62A] text-[#0F203A] border-[#7AD62A]"
                  : "bg-white/5 text-slate-400 border-white/10 hover:border-white/10"
              }`}
            >
              {d === "ALL" ? "All levels" : d.charAt(0) + d.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 w-full text-xs text-slate-400 sm:w-auto">Domain:</span>
          {DOMAINS.map((d) => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                domainFilter === d
                  ? "bg-[#0F203A] text-[#7AD62A] border-[#7AD62A]/30"
                  : "bg-white/5 text-slate-400 border-white/10 hover:border-white/10"
              }`}
            >
              {d === "ALL" ? "All domains" : d}
            </button>
          ))}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "featured" | "domain" | "difficulty" | "title")}
            className="w-full sm:w-auto sm:ml-2 px-2 py-1.5 text-xs font-medium rounded-full border bg-white/5 text-slate-400 border-white/10 focus:outline-none focus:border-[#7AD62A]/30"
            aria-label="Sort labs"
          >
            <option value="featured">Sort: Featured</option>
            <option value="domain">Sort: Domain</option>
            <option value="difficulty">Sort: Difficulty</option>
            <option value="title">Sort: Title</option>
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/5 rounded-full border border-white/10 transition-all"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredLabs.length === 0 ? (
        <div className="angular-card border border-white/10 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#7AD62A]/10 flex items-center justify-center mx-auto mb-4">
            <Microscope size={28} className="text-[#7AD62A]" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">
            {labs.length === 0 ? "The lab is quiet" : "No labs match your filters"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {labs.length === 0
              ? "Lab environments are being prepared. Check back soon."
              : "Try adjusting your search or clearing filters."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#7AD62A] rounded-lg hover:bg-[#6bc422] transition-all"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredLabs.map((lab) => {
            const diff = getDifficultyStyle(lab.difficulty || 1200);
            const flags = lab.flags?.length || 0;
            const solvedFlags = getSolvedCount(lab.flags);
            const isLocked = lab.isLocked ?? false;
            const requiredLevel = lab.requiredLevel ?? 1;
            const progress = flags > 0 ? (solvedFlags / flags) * 100 : 0;
            const progressStatus = getProgressStatus(lab.flags);

            if (isLocked) {
              const xpNeeded = requiredLevel * 1000 - level * 1000;
              return (
                <div
                  key={lab.id}
                  className="group relative angular-card border border-white/10 overflow-hidden opacity-75"
                  aria-label={`${lab.title} — locked, requires level ${requiredLevel}`}
                >
                  <div className="absolute inset-0 z-20 backdrop-blur-md bg-[#0a0f1a]/90 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Lock size={20} className="text-amber-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-mono text-slate-300 mb-1">LEVEL {requiredLevel} REQUIRED</p>
                      <div className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                        Earn {xpNeeded > 0 ? xpNeeded : 500} more XP to unlock
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <LabAvatar title={lab.title} id={lab.id} size={40} className="opacity-50" />
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                        <span className={`text-[10px] font-mono tracking-wider ${diff.color}`}>{diff.label}</span>
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-slate-400">{lab.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{lab.description}</p>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={lab.id}
                href={`/dashboard/labs/${lab.id}`}
                className="group relative angular-card border border-white/10 hover:border-white/10 overflow-hidden transition-all duration-300 hover-lift"
              >
                <div className={`h-0.5 w-full ${diff.bar} opacity-60`} />
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <LabAvatar title={lab.title} id={lab.id} size={40} />
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                      <span className={`text-[10px] font-mono tracking-wider ${diff.color}`}>{diff.label}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-[#7AD62A]/10 text-[#7AD62A] rounded flex items-center gap-0.5">
                        <Zap size={8} /> {flags * 10} XP
                      </span>
                    </div>
                    {/* Status badge */}
                    {progressStatus === "COMPLETED" && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#7AD62A]/10 text-[#7AD62A]">Done</span>
                    )}
                    {progressStatus === "IN_PROGRESS" && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">Active</span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-white group-hover:text-slate-200 transition-colors">{lab.title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{lab.description}</p>

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Shield size={10} />{solvedFlags}/{flags}</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="flex items-center gap-1"><Clock size={10} />{getEstimatedTime(flags)}</span>
                  </div>

                  {/* Progress bar */}
                  {flags > 0 && progress > 0 && (
                    <div className="space-y-1">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#7AD62A] to-[#6bc422] transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">{flags} OBJECTIVES</span>
                    <span className="text-xs font-medium text-slate-400 group-hover:text-white flex items-center gap-1.5 transition-colors">
                      LAUNCH
                      <span className="w-5 h-5 rounded-md bg-white/5 group-hover:bg-[#7AD62A]/10 flex items-center justify-center transition-all">
                        <Play size={10} fill="currentColor" />
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <>
          <div className="angular-card overflow-hidden hidden md:block">
            <div className="flex items-center gap-4 px-4 py-2.5 bg-white/5 border-b border-white/10 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <span className="w-6 text-center shrink-0">#</span>
              <span className="flex-1 min-w-0">Lab</span>
              <span className="hidden sm:block w-24 shrink-0">Difficulty</span>
              <span className="hidden md:block w-20 shrink-0">Progress</span>
              <span className="hidden lg:block w-20 shrink-0">Time</span>
              <span className="w-20 shrink-0 text-right">Status</span>
            </div>
            {filteredLabs.map((lab, index) => {
              const diff = getDifficultyStyle(lab.difficulty || 1200);
              const flags = lab.flags?.length || 0;
              const solvedFlags = getSolvedCount(lab.flags);
              const isLocked = lab.isLocked ?? false;
              const progressStatus = getProgressStatus(lab.flags);

              return (
                <div key={lab.id}>
                  {isLocked ? (
                    <div className="flex items-center gap-4 px-4 py-3 bg-[#0f172a] border-b border-white/6 opacity-50">
                      <span className="text-xs text-slate-400 w-6 text-center shrink-0">{index + 1}</span>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <Lock size={12} className="text-slate-400 shrink-0" />
                        <span className="text-sm text-slate-400 truncate">{lab.title}</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 w-24 shrink-0">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((d) => (
                            <div key={d} className={`w-1.5 h-1.5 rounded-full ${d <= Math.ceil((lab.difficulty || 1200) / 400) ? diff.dot : "bg-white/10"}`} />
                          ))}
                        </div>
                      </div>
                      <span className="w-20 shrink-0 text-right text-xs text-slate-400">Locked</span>
                    </div>
                  ) : (
                    <Link
                      href={`/dashboard/labs/${lab.id}`}
                      className="group flex items-center gap-4 px-4 py-3 bg-[#0f172a] border-b border-white/6 hover:bg-white/5 transition-colors"
                    >
                      <span className="text-xs text-slate-400 w-6 text-center shrink-0">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-white truncate block">{lab.title}</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 w-24 shrink-0">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((d) => (
                            <div key={d} className={`w-1.5 h-1.5 rounded-full ${d <= Math.ceil((lab.difficulty || 1200) / 400) ? diff.dot : "bg-white/10"}`} />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400">{diff.label}</span>
                      </div>
                      <div className="hidden md:block w-20 text-xs text-slate-400 shrink-0">
                        {solvedFlags}/{flags}
                      </div>
                      <div className="hidden lg:block w-20 text-xs text-slate-400 shrink-0">
                        {getEstimatedTime(flags)}
                      </div>
                      <div className="w-20 shrink-0 text-right">
                        {progressStatus === "COMPLETED" && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#7AD62A]/10 text-[#7AD62A]">Done</span>
                        )}
                        {progressStatus === "IN_PROGRESS" && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">Active</span>
                        )}
                        {progressStatus === "NOT_STARTED" && (
                          <span className="text-[10px] font-medium text-[#7AD62A] group-hover:underline">Launch</span>
                        )}
                      </div>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-3 md:hidden">
            {filteredLabs.map((lab) => {
              const diff = getDifficultyStyle(lab.difficulty || 1200);
              const flags = lab.flags?.length || 0;
              const solvedFlags = getSolvedCount(lab.flags);
              const isLocked = lab.isLocked ?? false;
              const requiredLevel = lab.requiredLevel ?? 1;
              const progressStatus = getProgressStatus(lab.flags);
              const progress = flags > 0 ? (solvedFlags / flags) * 100 : 0;

              if (isLocked) {
                const xpNeeded = requiredLevel * 1000 - level * 1000;
                return (
                  <div key={lab.id} className="angular-card border border-white/10 p-4 space-y-3 opacity-80">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <LabAvatar title={lab.title} id={lab.id} size={36} className="opacity-50" />
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium text-slate-300 truncate">{lab.title}</h3>
                          <p className="text-[11px] text-slate-500">{diff.label}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-400">
                        <Lock size={10} />
                        Locked
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{lab.description}</p>
                    <p className="text-xs text-amber-300">Earn {xpNeeded > 0 ? xpNeeded : 500} more XP to unlock level {requiredLevel}.</p>
                  </div>
                );
              }

              return (
                <Link key={lab.id} href={`/dashboard/labs/${lab.id}`} className="angular-card border border-white/10 p-4 block">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <LabAvatar title={lab.title} id={lab.id} size={36} />
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">{lab.title}</h3>
                        <p className="text-[11px] text-slate-400">{getLabDomain(lab)} · {diff.label}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-[#7AD62A] shrink-0">
                      {progressStatus === "COMPLETED" ? "Done" : progressStatus === "IN_PROGRESS" ? "Active" : "Launch"}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-300 line-clamp-2 leading-relaxed">{lab.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Shield size={10} />{solvedFlags}/{flags}</span>
                    <span className="flex items-center gap-1"><Clock size={10} />{getEstimatedTime(flags)}</span>
                  </div>
                  {flags > 0 && progress > 0 && (
                    <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#7AD62A] to-[#6bc422]" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
