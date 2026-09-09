"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import {
  Trophy, Play, Square, Clock, Cpu, Terminal, CheckCircle2,
  Circle, ArrowLeft, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import toast from "@/lib/toast";
import { useI18n } from "@/lib/i18n";

interface CapstonePhase {
  id: string;
  phaseNumber: number;
  title: string;
  description: string;
  requirements: { flags: string[]; tasks: string[]; deliverable: string };
}

interface CapstoneLab {
  id: string;
  title: string;
  description: string;
  briefing: string;
  difficulty: number;
  estimatedMinutes: number;
  ramRequirement: number;
  composeFile: string | null;
  flags: { id: string; title: string; description: string; points: number; correctAnswer: string }[];
  capstonePhases: CapstonePhase[];
  labSkills: { skill: { name: string; domain: { name: string } } }[];
}

interface LabInstance {
  id: string;
  status: string;
  port: number;
  containerId: string | null;
  expiresAt: string;
}

export default function CapstoneDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const [capstone, setCapstone] = useState<CapstoneLab | null>(null);
  const [instance, setInstance] = useState<LabInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [activePhase, setActivePhase] = useState(1);
  const [flagAnswers, setFlagAnswers] = useState<Record<string, string>>({});
  const [flagResults, setFlagResults] = useState<Record<string, { correct: boolean; message: string }>>({});

  useEffect(() => {
    fetchApi<CapstoneLab>(`/labs/definition/${id}`)
      .then((res) => setCapstone(res))
      .catch(console.error)
      .finally(() => setLoading(false));

    fetchApi<LabInstance>(`/labs/status/${id}`)
      .then((res) => {
        if (res && res.status === "RUNNING") {
          setInstance(res);
        }
      })
      .catch(() => {});
  }, [id]);

  const startLab = async () => {
    setStarting(true);
    try {
      const res = await fetchApi<LabInstance>(`/labs/start/${id}`, { method: "POST" });
      setInstance(res);
      toast.success(t("capstoneDetail.deployingToast"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("capstoneDetail.startError"));
    } finally {
      setStarting(false);
    }
  };

  const stopLab = async () => {
    setStopping(true);
    try {
      await fetchApi(`/labs/stop/${id}`, { method: "POST" });
      setInstance(null);
      toast.success(t("capstoneDetail.stoppedToast"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("capstoneDetail.stopError"));
    } finally {
      setStopping(false);
    }
  };

  const submitFlag = async (flagId: string) => {
    const answer = flagAnswers[flagId];
    if (!answer?.trim()) {
      toast.error(t("capstoneDetail.enterAnswer"));
      return;
    }
    try {
      const res = await fetchApi<{ isCorrect: boolean; message: string }>(
        `/labs/submit-flag`,
        { method: "POST", body: JSON.stringify({ flagId, answer }) },
      );
      setFlagResults((prev) => ({
        ...prev,
        [flagId]: { correct: res.isCorrect, message: res.message || (res.isCorrect ? t("capstoneDetail.correct") : t("capstoneDetail.incorrect")) },
      }));
      if (res.isCorrect) toast.success(t("capstoneDetail.flagSolved"));
      else toast.error(t("capstoneDetail.incorrectAnswer"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("capstoneDetail.submitFlagError"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
        <div className="text-center py-20 text-gray-500">{t("capstoneDetail.loading")}</div>
      </div>
    );
  }

  if (!capstone) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
        <div className="text-center py-20 text-gray-500">{t("capstoneDetail.notFound")}</div>
      </div>
    );
  }

  const isRunning = instance?.status === "RUNNING";
  const phases = capstone.capstonePhases?.sort((a, b) => a.phaseNumber - b.phaseNumber) || [];
  const solvedFlags = capstone.flags.filter((f) => flagResults[f.id]?.correct).length;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/capstones" className="text-sm text-gray-400 hover:text-white flex items-center gap-1 mb-4">
            <ArrowLeft className="w-4 h-4" /> {t("capstoneDetail.back")}
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-6 h-6 text-[#7AD62A]" />
                <h1 className="text-2xl font-bold">{capstone.title.replace("Capstone: ", "")}</h1>
              </div>
              <p className="text-gray-400 max-w-2xl">{capstone.description}</p>
            </div>

            <div className="flex items-center gap-3">
              {isRunning ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    {t("capstoneDetail.running")}
                  </div>
                  <button
                    onClick={stopLab}
                    disabled={stopping}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition text-sm"
                  >
                    <Square className="w-4 h-4" />
                    {stopping ? t("capstoneDetail.stopping") : t("capstoneDetail.stop")}
                  </button>
                </>
              ) : (
                <button
                  onClick={startLab}
                  disabled={starting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#7AD62A] text-black rounded-lg font-medium hover:bg-[#6ac125] transition"
                >
                  <Play className="w-4 h-4" />
                  {starting ? t("capstoneDetail.deploying") : t("capstoneDetail.deployStack")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#0f172a] border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[#7AD62A]">{capstone.flags?.length || 0}</div>
            <div className="text-xs text-gray-400 mt-1">{t("capstoneDetail.totalFlags")}</div>
          </div>
          <div className="bg-[#0f172a] border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{solvedFlags}</div>
            <div className="text-xs text-gray-400 mt-1">{t("capstoneDetail.solved")}</div>
          </div>
          <div className="bg-[#0f172a] border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 flex items-center justify-center gap-1">
              <Clock className="w-5 h-5" />
              {capstone.estimatedMinutes}m
            </div>
            <div className="text-xs text-gray-400 mt-1">{t("capstoneDetail.estTime")}</div>
          </div>
          <div className="bg-[#0f172a] border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 flex items-center justify-center gap-1">
              <Cpu className="w-5 h-5" />
              {capstone.ramRequirement ? `${Math.round(capstone.ramRequirement / 1024)}GB` : "512MB"}
            </div>
            <div className="text-xs text-gray-400 mt-1">{t("capstoneDetail.ramRequired")}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Briefing */}
            {capstone.briefing && (
              <div className="bg-[#0f172a] border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[#7AD62A]" />
                  {t("capstoneDetail.briefing")}
                </h2>
                <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap">
                  {capstone.briefing}
                </div>
              </div>
            )}

            {/* Phases */}
            {phases.length > 0 && (
              <div className="bg-[#0f172a] border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">{t("capstoneDetail.phases")}</h2>
                <div className="space-y-3">
                  {phases.map((phase) => (
                    <button
                      key={phase.id}
                      onClick={() => setActivePhase(phase.phaseNumber)}
                      className={`w-full text-left p-4 rounded-lg border transition ${
                        activePhase === phase.phaseNumber
                          ? "border-[#7AD62A] bg-[#7AD62A]/5"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {solvedFlags >= (phase.requirements?.flags?.length || 0) ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                        <div>
                          <div className="font-medium text-sm">
                            {t("capstoneDetail.phase", { number: phase.phaseNumber, title: phase.title })}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{phase.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Flags */}
            <div className="bg-[#0f172a] border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">{t("capstoneDetail.verificationFlags")}</h2>
              <div className="space-y-3">
                {capstone.flags?.map((flag) => {
                  const result = flagResults[flag.id];
                  return (
                    <div
                      key={flag.id}
                      className={`p-4 rounded-lg border ${
                        result?.correct
                          ? "border-green-500/30 bg-green-500/5"
                          : result
                            ? "border-red-500/30 bg-red-500/5"
                            : "border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{flag.title}</span>
                        <span className="text-xs text-gray-500">{flag.points} pts</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">{flag.description}</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={t("capstoneDetail.answerPlaceholder")}
                          value={flagAnswers[flag.id] || ""}
                          onChange={(e) => setFlagAnswers((prev) => ({ ...prev, [flag.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && submitFlag(flag.id)}
                          disabled={!isRunning}
                          className="flex-1 px-3 py-1.5 bg-black/30 border border-white/10 rounded text-sm focus:outline-none focus:border-[#7AD62A]/50 disabled:opacity-50"
                        />
                        <button
                          onClick={() => submitFlag(flag.id)}
                          disabled={!isRunning || !flagAnswers[flag.id]?.trim()}
                          className="px-3 py-1.5 bg-[#7AD62A] text-black rounded text-sm font-medium hover:bg-[#6ac125] transition disabled:opacity-50"
                        >
                          {t("capstoneDetail.submit")}
                        </button>
                      </div>
                      {result && (
                        <div className={`text-xs mt-2 ${result.correct ? "text-green-400" : "text-red-400"}`}>
                          {result.message}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Connection info */}
            {isRunning && (
              <div className="bg-[#0f172a] border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3">{t("capstoneDetail.connection")}</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t("capstoneDetail.status")}</span>
                    <span className="text-green-400">{t("capstoneDetail.running")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t("capstoneDetail.expires")}</span>
                    <span>{instance ? new Date(instance.expiresAt).toLocaleTimeString() : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t("capstoneDetail.stack")}</span>
                    <span>{capstone.composeFile ? t("capstoneDetail.dockerCompose") : t("capstoneDetail.singleContainer")}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Skills */}
            <div className="bg-[#0f172a] border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">{t("capstoneDetail.skillsTested")}</h3>
              <div className="flex flex-wrap gap-1.5">
                {capstone.labSkills?.map((s, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                    {s.skill?.domain?.name}: {s.skill?.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Warning */}
            {!isRunning && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-200">
                    <p className="font-medium mb-1">{t("capstoneDetail.requirements")}</p>
                    <p>{t("capstoneDetail.requirementsDesc")}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
