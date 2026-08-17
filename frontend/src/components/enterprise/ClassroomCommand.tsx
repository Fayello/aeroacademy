"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Square, Activity, Shield, Loader2, CheckCircle } from "lucide-react";
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

  const loadTeamProgress = useCallback(async () => {
    if (!selectedTeam) return;
    try {
      const data = await fetchApi(`/admin/teams/${selectedTeam}/progress`);
      setTeamProgress(data);
    } catch { /* ignore */ }
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
        toast.error("Failed to load data.");
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
        const data = await fetchApi(`/admin/teams/${selectedTeam}/progress`);
        if (!cancelled) setTeamProgress(data);
      } catch { /* ignore */ }
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
      const results = await fetchApi("/admin/classroom/launch", {
        method: "POST",
        body: JSON.stringify({ teamId: selectedTeam, labId: selectedLab }),
      });
      const count = results.filter((r: LaunchResult) => r.status === "SUCCESS").length;
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
      {/* Controls */}
      <div className="card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Shield size={16} className="text-emerald-600" />
          Classroom Control
        </h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Team</label>
          <select className="input-field" value={selectedTeam || ""} onChange={(e) => setSelectedTeam(e.target.value)}>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t._count.members} members)</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Lab</label>
          <select className="input-field" value={selectedLab || ""} onChange={(e) => setSelectedLab(e.target.value)}>
            {labs.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
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
      </div>

      {/* Member progress */}
      <div className="lg:col-span-2 card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Activity size={16} className="text-emerald-600" />
            Team Progress
          </h3>
          {teamProgress && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {teamProgress?.members?.map((member: MemberProgress) => {
            const isCorrect = member.labSubmissions?.some((s: { flag: LabFlag }) => s.flag.labId === selectedLab);
            return (
              <div key={member.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                  {member.name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 truncate">{member.name}</p>
                    <span className="text-xs text-slate-500">{member.rank || 1200} ELO</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${isCorrect ? "bg-emerald-500" : "bg-slate-200"}`} style={{ width: isCorrect ? "100%" : "5%" }} />
                    </div>
                    <span className={`text-xs ${isCorrect ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                      {isCorrect ? "Done" : "Pending"}
                    </span>
                  </div>
                </div>
                {isCorrect && <CheckCircle size={16} className="text-emerald-500 shrink-0" />}
              </div>
            );
          })}
          {!teamProgress && (
            <div className="text-center py-12 text-sm text-slate-500">
              Select a team to view progress.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
