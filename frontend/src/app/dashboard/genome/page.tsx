"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { fetchApi } from "@/lib/api";
import {
  Dna,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Brain,
  Shield,
  Server,
  Network,
  Database,
  Code,
  Beaker,
  RefreshCw,
} from "lucide-react";

interface SkillMasteryInfo {
  skillId: string;
  name: string;
  displayName: string;
  mastery: number;
  level: number;
  xp: number;
  lastPracticedAt: string | null;
  isDecaying: boolean;
  daysSincePractice: number | null;
}

interface DomainGenome {
  domain: string;
  displayName: string;
  skills: SkillMasteryInfo[];
  averageMastery: number;
}

interface TechnologyGenome {
  domains: DomainGenome[];
  overallMastery: number;
  fadingSkills: SkillMasteryInfo[];
  strengths: SkillMasteryInfo[];
  weaknesses: SkillMasteryInfo[];
  totalSkills: number;
  activeSkills: number;
  decayingSkills: number;
}

const DOMAIN_ICONS: Record<string, typeof Server> = {
  SYSTEMS: Server,
  NETWORKING: Network,
  DEVOPS: Code,
  DATABASES: Database,
  SECURITY: Shield,
  QA: Beaker,
};

const DOMAIN_COLORS: Record<string, string> = {
  SYSTEMS: "from-blue-500 to-blue-600",
  NETWORKING: "from-cyan-500 to-cyan-600",
  DEVOPS: "from-violet-500 to-violet-600",
  DATABASES: "from-amber-500 to-amber-600",
  SECURITY: "from-red-500 to-red-600",
  QA: "from-emerald-500 to-emerald-600",
};

function getMasteryColor(mastery: number): string {
  if (mastery >= 80) return "bg-green-500";
  if (mastery >= 60) return "bg-lime-500";
  if (mastery >= 40) return "bg-yellow-500";
  if (mastery >= 20) return "bg-orange-500";
  return "bg-red-500";
}

function getMasteryTextColor(mastery: number): string {
  if (mastery >= 80) return "text-green-600";
  if (mastery >= 60) return "text-lime-600";
  if (mastery >= 40) return "text-yellow-600";
  if (mastery >= 20) return "text-orange-600";
  return "text-red-600";
}

function getMasteryBgColor(mastery: number): string {
  if (mastery >= 80) return "bg-green-500/10 border-green-200";
  if (mastery >= 60) return "bg-lime-50 border-lime-200";
  if (mastery >= 40) return "bg-yellow-50 border-yellow-200";
  if (mastery >= 20) return "bg-orange-50 border-orange-200";
  return "bg-red-500/10 border-red-200";
}

function formatLastPracticed(date: string | null, t: (key: string) => string): string {
  if (!date) return t("genome.neverPracticed");
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return t("genome.practicedToday");
  if (diffDays === 1) return "Practiced yesterday";
  return t("genome.lastPracticed").replace("{n}", String(diffDays));
}

export default function GenomePage() {
  const { t } = useI18n();
  const [genome, setGenome] = useState<TechnologyGenome | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const fetchGenome = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi<TechnologyGenome>("/genome/profile");
      setGenome(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenome();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/10 rounded w-64" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white/10 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-white/10 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !genome) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">{t("common.error")}</h2>
          <p className="text-slate-500 mb-4">{error || t("common.error")}</p>
          <button
            onClick={fetchGenome}
            className="px-4 py-2 bg-[#7AD62A] text-white rounded-lg hover:bg-[#1a7a4d] transition-colors"
          >
            {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  const displayedDomains = selectedDomain
    ? genome.domains.filter((d) => d.domain === selectedDomain)
    : genome.domains;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F203A] flex items-center gap-2">
            <Dna className="w-7 h-7 text-[#7AD62A]" />
            {t("genome.title")}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t("genome.subtitle")}</p>
        </div>
        <button
          onClick={fetchGenome}
          className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Overall Mastery Card */}
      <div className="bg-gradient-to-r from-[#0F203A] to-[#7AD62A] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold opacity-90">{t("genome.overall")}</h2>
            <div className="text-5xl font-bold mt-2">
              {Math.round(genome.overallMastery)}%
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
              <Brain className="w-4 h-4" />
              <span>{genome.totalSkills} {t("genome.skills").toLowerCase()}</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>{genome.activeSkills} {t("genome.active").toLowerCase()}</span>
            </div>
            {genome.decayingSkills > 0 && (
              <div className="flex items-center gap-2 text-amber-300 text-sm">
                <TrendingDown className="w-4 h-4" />
                <span>{genome.decayingSkills} {t("genome.fading").toLowerCase()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fading Skills Warning */}
      {genome.fadingSkills.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
            <AlertTriangle className="w-5 h-5" />
            {t("genome.fadingSkills")}
          </div>
          <p className="text-amber-600 text-sm mb-3">{t("genome.fadingDesc")}</p>
          <div className="space-y-2">
            {genome.fadingSkills.slice(0, 5).map((skill) => (
              <div
                key={skill.skillId}
                className="flex items-center justify-between bg-[#0f172a] rounded-lg px-4 py-2 border border-amber-100"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold ${getMasteryBgColor(skill.mastery)}`}
                  >
                    {Math.round(skill.mastery)}%
                  </div>
                  <div>
                    <div className="font-medium text-slate-700">{skill.displayName}</div>
                    <div className="text-xs text-amber-600">
                      {formatLastPracticed(skill.lastPracticedAt, t)}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  {skill.daysSincePractice !== null && (
                    <span>{skill.daysSincePractice}d ago</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedDomain(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            !selectedDomain
              ? "bg-[#0F203A] text-white"
              : "bg-slate-100 text-slate-600 hover:bg-white/10"
          }`}
        >
          All Domains
        </button>
        {genome.domains.map((domain) => {
          const Icon = DOMAIN_ICONS[domain.domain] || Server;
          return (
            <button
              key={domain.domain}
              onClick={() => setSelectedDomain(domain.domain)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedDomain === domain.domain
                  ? "bg-[#0F203A] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-white/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              {domain.displayName}
              <span className="text-xs opacity-70">
                {Math.round(domain.averageMastery)}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Domain Cards with Skills */}
      <div className="space-y-4">
        {displayedDomains.map((domain) => {
          const Icon = DOMAIN_ICONS[domain.domain] || Server;
          const gradient = DOMAIN_COLORS[domain.domain] || "from-slate-500 to-slate-600";

          return (
            <div
              key={domain.domain}
              className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden"
            >
              {/* Domain Header */}
              <div className={`bg-gradient-to-r ${gradient} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6" />
                    <div>
                      <h3 className="font-semibold">{domain.displayName}</h3>
                      <p className="text-white/70 text-sm">
                        {domain.skills.length} skills
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {Math.round(domain.averageMastery)}%
                    </div>
                    <div className="text-white/70 text-xs">Average</div>
                  </div>
                </div>
              </div>

              {/* Skills List */}
              <div className="divide-y divide-slate-100">
                {domain.skills
                  .sort((a, b) => b.mastery - a.mastery)
                  .map((skill) => (
                    <div
                      key={skill.skillId}
                      className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${getMasteryColor(skill.mastery)}`}
                        />
                        <div>
                          <div className="font-medium text-slate-700 text-sm">
                            {skill.displayName}
                          </div>
                          <div className="text-xs text-slate-400">
                            Level {skill.level} · {skill.xp} XP
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {skill.isDecaying && (
                          <TrendingDown className="w-4 h-4 text-amber-500" />
                        )}
                        <div className="text-right">
                          <div
                            className={`text-sm font-semibold ${getMasteryTextColor(skill.mastery)}`}
                          >
                            {Math.round(skill.mastery)}%
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {skill.daysSincePractice !== null
                              ? skill.daysSincePractice === 0
                                ? "Today"
                                : `${skill.daysSincePractice}d`
                              : "Never"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* No Skills State */}
      {genome.totalSkills === 0 && (
        <div className="text-center py-16">
          <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-600 mb-2">
            {t("genome.noSkills")}
          </h2>
          <p className="text-slate-400 max-w-md mx-auto">
            {t("genome.noSkillsDesc")}
          </p>
        </div>
      )}
    </div>
  );
}
