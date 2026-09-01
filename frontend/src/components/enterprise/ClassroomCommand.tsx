"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Play,
  Square,
  Activity,
  Shield,
  Loader2,
  CheckCircle,
  Users,
  ClipboardCheck,
  TimerReset,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";

interface Team {
  id: string;
  name: string;
  description: string;
  _count: { members: number };
}

interface Lab {
  id: string;
  title: string;
  difficulty: number;
}

interface LabFlag {
  id: string;
  labId: string;
  title: string;
}

interface MemberProgress {
  id: string;
  name: string | null;
  xp: number;
  rank: number;
  labSubmissions: { flag: LabFlag }[];
}

interface TeamProgress {
  id: string;
  name: string;
  members: MemberProgress[];
}

interface LaunchResult {
  status: string;
}

export default function ClassroomCommand() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedLab, setSelectedLab] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [teamProgress, setTeamProgress] = useState<TeamProgress | null>(null);

  const selectedTeamRecord = useMemo(
    () => teams.find((team) => team.id === selectedTeam) || null,
    [teams, selectedTeam],
  );
  const selectedLabRecord = useMemo(
    () => labs.find((lab) => lab.id === selectedLab) || null,
    [labs, selectedLab],
  );
  const completedMembers = teamProgress?.members?.filter((member) =>
    member.labSubmissions?.some((submission) => submission.flag.labId === selectedLab),
  ).length ?? 0;
  const totalMembers = teamProgress?.members?.length ?? 0;

  const loadTeamProgress = useCallback(async () => {
    if (!selectedTeam) return;
    try {
      const data = await fetchApi<TeamProgress>(`/admin/teams/${selectedTeam}/progress`);
      setTeamProgress(data);
    } catch {
      // ignore
    }
  }, [selectedTeam]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [teamsData, labsData] = await Promise.all([fetchApi("/admin/teams"), fetchApi("/labs")]);
        if (cancelled) return;
        const safeTeams = Array.isArray(teamsData) ? teamsData : [];
        const safeLabs = Array.isArray(labsData) ? labsData : [];
        setTeams(safeTeams);
        setLabs(safeLabs);
        if (safeTeams.length > 0) setSelectedTeam(safeTeams[0].id);
        if (safeLabs.length > 0) setSelectedLab(safeLabs[0].id);
      } catch {
        toast.error("Failed to load classroom data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedTeam) return;
    let cancelled = false;
    const run = async () => {
      try {
        const data = await fetchApi<TeamProgress>(`/admin/teams/${selectedTeam}/progress`);
        if (!cancelled) setTeamProgress(data);
      } catch {
        // ignore
      }
    };
    run();
    const interval = setInterval(run, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedTeam]);

  const handleLaunch = async () => {
    if (!selectedTeam || !selectedLab) return;
    setActionLoading(true);
    try {
      const results = await fetchApi<LaunchResult[]>("/admin/classroom/launch", {
        method: "POST",
        body: JSON.stringify({ teamId: selectedTeam, labId: selectedLab }),
      });
      const count = results.filter((result) => result.status === "SUCCESS").length;
      toast.success(`Launched ${count} instances.`);
      loadTeamProgress();
    } catch {
      toast.error("Launch failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminate = async () => {
    if (!selectedTeam || !selectedLab) return;
    setActionLoading(true);
    try {
      await fetchApi("/admin/classroom/terminate", {
        method: "POST",
        body: JSON.stringify({ teamId: selectedTeam, labId: selectedLab }),
      });
      toast.success("All instances terminated.");
      loadTeamProgress();
    } catch {
      toast.error("Termination failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="card p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Shield size={16} className="text-[#7AD62A]" />
            Classroom Control
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Coordinate a cohort lab session, monitor completion, and keep the practical environment controlled for every member.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Team</label>
          <select className="input-field" value={selectedTeam || ""} onChange={(e) => setSelectedTeam(e.target.value)}>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name} ({team._count.members} members)</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Lab</label>
          <select className="input-field" value={selectedLab || ""} onChange={(e) => setSelectedLab(e.target.value)}>
            {labs.map((lab) => (
              <option key={lab.id} value={lab.id}>{lab.title}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Selected cohort</p>
            <p className="mt-2 text-sm font-semibold text-white">{selectedTeamRecord?.name || "No team selected"}</p>
            <p className="mt-1 text-xs text-slate-400">{selectedTeamRecord ? `${selectedTeamRecord._count.members} member cohort` : "Choose a team to manage."}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Selected lab</p>
            <p className="mt-2 text-sm font-semibold text-white">{selectedLabRecord?.title || "No lab selected"}</p>
            <p className="mt-1 text-xs text-slate-400">{selectedLabRecord ? `Difficulty ${selectedLabRecord.difficulty}` : "Pick the practical exercise you want to run."}</p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button onClick={handleLaunch} disabled={actionLoading || !selectedTeam || !selectedLab} className="btn-primary w-full">
            {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
            Launch for all
          </button>
          <button onClick={handleTerminate} disabled={actionLoading || !selectedTeam} className="btn-danger w-full text-xs">
            <Square size={14} />
            Terminate all
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-400">
          Launch creates the same practical environment for the whole cohort. Terminate clears active instances when the session ends.
        </div>
      </div>

      <div className="lg:col-span-2 card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity size={16} className="text-[#7AD62A]" />
            Team Progress
          </h3>
          {teamProgress && (
            <span className="text-xs text-[#7AD62A] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7AD62A] animate-pulse" />
              Live
            </span>
          )}
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[#7AD62A]" />
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Members tracked</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{totalMembers}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-[#7AD62A]" />
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Completions</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{completedMembers}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={14} className="text-[#7AD62A]" />
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Coverage</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{totalMembers > 0 ? Math.round((completedMembers / totalMembers) * 100) : 0}%</p>
          </div>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {teamProgress?.members?.map((member) => {
            const isCorrect = member.labSubmissions?.some((submission) => submission.flag.labId === selectedLab);
            return (
              <div key={member.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-slate-200">
                  {member.name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{member.name}</p>
                    <span className="text-xs text-slate-500">{member.rank || 1200} ELO</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${isCorrect ? "bg-[#7AD62A]" : "bg-white/10"}`} style={{ width: isCorrect ? "100%" : "5%" }} />
                    </div>
                    <span className={`text-xs ${isCorrect ? "text-[#7AD62A] font-medium" : "text-slate-400"}`}>
                      {isCorrect ? "Done" : "Pending"}
                    </span>
                  </div>
                </div>
                {isCorrect && <CheckCircle size={16} className="text-[#7AD62A] shrink-0" />}
              </div>
            );
          })}
          {!teamProgress && (
            <div className="text-center py-12 text-sm text-slate-500">
              Select a team to view progress.
            </div>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-300">
            <TimerReset size={14} className="text-[#7AD62A]" />
            Session guidance
          </div>
          <p className="mt-2 leading-relaxed">
            Use this view to confirm that the whole cohort has access to the same lab, monitor completion signals, and intervene early when practical progress stalls.
          </p>
        </div>
      </div>
    </div>
  );
}
