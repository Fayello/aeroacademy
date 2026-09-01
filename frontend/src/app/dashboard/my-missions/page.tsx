"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { fetchApiV2 } from "@/lib/api";
import toast from "@/lib/toast";
import {
  Swords,
  Clock,
  Star,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Target,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface Mission {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  estimatedMinutes: number;
  targetSkillId: string | null;
  targetDomainId: string | null;
  xpReward: number;
  masteryReward: number;
  missionType: string;
  status: string;
  expiresAt: string | null;
  completedAt: string | null;
  createdAt: string;
  skill: { id: string; name: string; displayName: string } | null;
  domain: { id: string; name: string; displayName: string } | null;
}

const MISSION_TYPE_ICONS: Record<string, typeof RefreshCw> = {
  SKILL_MAINTENANCE: RefreshCw,
  WEAKNESS_IMPROVEMENT: Target,
  CROSS_DOMAIN: ArrowRight,
};

const MISSION_TYPE_COLORS: Record<string, string> = {
  SKILL_MAINTENANCE: "from-amber-500 to-orange-500",
  WEAKNESS_IMPROVEMENT: "from-blue-500 to-indigo-500",
  CROSS_DOMAIN: "from-violet-500 to-purple-500",
};

function getDifficultyStars(difficulty: number): string[] {
  return Array.from({ length: Math.min(5, difficulty) }, () => "filled");
}

export default function MyMissionsPage() {
  const { t } = useI18n();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [history, setHistory] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"available" | "active" | "completed" | "history">("available");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [available, historyData] = await Promise.all([
        fetchApiV2<Mission[]>("/missions/available"),
        fetchApiV2<Mission[]>("/missions/history"),
      ]);
      setMissions(available);
      setHistory(historyData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccept = async (missionId: string) => {
    try {
      await fetchApiV2(`/missions/${missionId}/accept`, { method: "POST" });
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to accept mission");
    }
  };

  const handleComplete = async (missionId: string) => {
    try {
      await fetchApiV2(`/missions/${missionId}/complete`, { method: "POST" });
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to complete mission");
    }
  };

  const availableMissions = missions.filter((m) => m.status === "AVAILABLE");
  const activeMissions = missions.filter((m) => m.status === "ACTIVE");
  const completedMissions = missions.filter((m) => m.status === "COMPLETED");

  const displayMissions =
    activeTab === "available"
      ? availableMissions
      : activeTab === "active"
      ? activeMissions
      : activeTab === "completed"
      ? completedMissions
      : history;

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/10 rounded w-64" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white/10 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">{t("common.error")}</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-[#7AD62A] text-white rounded-lg hover:bg-[#1a7a4d] transition-colors"
          >
            {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F203A] flex items-center gap-2">
            <Swords className="w-7 h-7 text-[#7AD62A]" />
            {t("missions.title")}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t("missions.subtitle")}</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        {[
          { key: "available", label: t("missions.available"), count: availableMissions.length },
          { key: "active", label: t("missions.active"), count: activeMissions.length },
          { key: "completed", label: t("missions.completed"), count: completedMissions.length },
          { key: "history", label: t("missions.history"), count: history.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as "available" | "active" | "completed" | "history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[#0F203A] text-white"
                : "text-slate-600 hover:bg-white/5"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key ? "bg-white/20" : "bg-white/10"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Missions Grid */}
      {displayMissions.length === 0 ? (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
            <Swords size={28} className="text-purple-500" />
          </div>
          <h2 className="text-sm font-semibold text-white mb-1">
            {t("missions.noMissions")}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {t("missions.noMissionsDesc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayMissions.map((mission) => {
            const TypeIcon = MISSION_TYPE_ICONS[mission.missionType] || Target;
            const gradient = MISSION_TYPE_COLORS[mission.missionType] || "from-slate-500 to-slate-600";
            const isExpired = mission.expiresAt && new Date(mission.expiresAt) < new Date();

            return (
              <div
                key={mission.id}
                className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Mission Header */}
                <div className={`bg-gradient-to-r ${gradient} p-4 text-white`}>
                  <div className="flex items-center gap-3">
                    <TypeIcon className="w-6 h-6" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{mission.title}</h3>
                      <p className="text-white/70 text-xs mt-1">
                        {mission.missionType === "SKILL_MAINTENANCE" && t("missions.type.maintenance")}
                        {mission.missionType === "WEAKNESS_IMPROVEMENT" && t("missions.type.improvement")}
                        {mission.missionType === "CROSS_DOMAIN" && t("missions.type.crossdomain")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mission Body */}
                <div className="p-4 space-y-3">
                  <p className="text-slate-600 text-sm">{mission.description}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>{mission.xpReward} XP</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-green-500" />
                      <span>+{mission.masteryReward}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{mission.estimatedMinutes} {t("missions.minutes")}</span>
                    </div>
                  </div>

                  {/* Difficulty Stars */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400 mr-1">{t("missions.difficulty")}</span>
                    {getDifficultyStars(mission.difficulty).map((_, i) => (
                      <Star
                        key={i}
                        className="w-3 h-3 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  {/* Target Info */}
                  {(mission.skill || mission.domain) && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {mission.skill && (
                        <span className="bg-slate-100 px-2 py-1 rounded">
                          {mission.skill.displayName}
                        </span>
                      )}
                      {mission.domain && (
                        <span className="bg-slate-100 px-2 py-1 rounded">
                          {mission.domain.displayName}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expiry */}
                  {mission.expiresAt && (
                    <div className="text-xs text-slate-400">
                      {isExpired ? (
                        <span className="text-red-500">{t("missions.expired")}</span>
                      ) : (
                        <span>
                          Expires {new Date(mission.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="px-4 pb-4">
                  {mission.status === "AVAILABLE" && !isExpired && (
                    <button
                      onClick={() => handleAccept(mission.id)}
                      className="w-full py-2 bg-[#7AD62A] text-white rounded-lg text-sm font-medium hover:bg-[#1a7a4d] transition-colors"
                    >
                      {t("missions.accept")}
                    </button>
                  )}
                  {mission.status === "ACTIVE" && (
                    <button
                      onClick={() => handleComplete(mission.id)}
                      className="w-full py-2 bg-[#0F203A] text-white rounded-lg text-sm font-medium hover:bg-[#1a2d47] transition-colors"
                    >
                      {t("missions.complete")}
                    </button>
                  )}
                  {mission.status === "COMPLETED" && (
                    <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium py-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {t("missions.completed")}
                    </div>
                  )}
                  {(mission.status === "EXPIRED" || isExpired) && (
                    <div className="text-center text-red-500 text-sm py-2">
                      {t("missions.expired")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
