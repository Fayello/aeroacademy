"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import {
  Users,
  Trophy,
  BookOpen,
  Star,
  ChevronRight,
  Loader2,
  Crown,
  Plus,
  LogIn,
  X,
  Copy,
  Check,
  Shield,
} from "lucide-react";

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  xp: number;
  role: string;
  joinedAt: string;
}

interface TeamCourse {
  id: string;
  title: string;
  progress?: number;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  inviteCode?: string;
  visibility?: string;
  ownerName: string;
  ownerId: string;
  totalXp: number;
  memberCount: number;
  maxMembers?: number;
  members?: TeamMember[];
  courses?: TeamCourse[];
}

export default function TeamsPage() {
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createVisibility, setCreateVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const mine = await fetchApi<Team>("/team-enrollments/mine").catch(() => null);
        if (mine) {
          setMyTeam(mine);
        } else {
          const data = await fetchApi<Team[]>("/team-enrollments");
          setTeams(data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCreate() {
    if (!createName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const team = await fetchApi<Team>("/team-enrollments/create", {
        method: "POST",
        body: JSON.stringify({ name: createName.trim(), description: createDesc.trim() || undefined, visibility: createVisibility }),
      });
      setMyTeam(team);
      setShowCreate(false);
      setCreateName("");
      setCreateDesc("");
    } catch (err: any) {
      setError(err?.message || "Failed to create team");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setJoining(true);
    setError("");
    try {
      const team = await fetchApi<Team>("/team-enrollments/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: joinCode.trim().toUpperCase() }),
      });
      setMyTeam(team);
      setShowJoin(false);
      setJoinCode("");
    } catch (err: any) {
      setError(err?.message || "Failed to join team");
    } finally {
      setJoining(false);
    }
  }

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this team?")) return;
    try {
      await fetchApi("/team-enrollments/leave", { method: "DELETE" });
      setMyTeam(null);
      const data = await fetchApi<Team[]>("/team-enrollments");
      setTeams(data);
    } catch (err: any) {
      setError(err?.message || "Failed to leave team");
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function openTeam(team: Team) {
    setDetailLoading(true);
    try {
      const detail = await fetchApi<Team>(`/team-enrollments/${team.id}`);
      setSelectedTeam(detail);
    } catch {
      setSelectedTeam(team);
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-[#229C62] animate-spin" />
      </div>
    );
  }

  // ─── TEAM DETAIL VIEW ─────────────────────────────────
  if (selectedTeam) {
    const sortedMembers = selectedTeam.members
      ? [...selectedTeam.members].sort((a, b) => b.xp - a.xp)
      : [];

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <button
          onClick={() => setSelectedTeam(null)}
          className="text-sm text-[#229C62] hover:text-[#0F203A] font-medium"
        >
          &larr; Back to Teams
        </button>

        <div className="flex items-center gap-3">
          <div className="bg-[#E9F8EE] p-3 rounded-xl">
            <Users size={24} className="text-[#229C62]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {selectedTeam.name}
            </h1>
            {selectedTeam.description && (
              <p className="text-sm text-slate-500 mt-0.5">{selectedTeam.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Crown size={14} /> Owner
            </div>
            <p className="text-sm font-semibold text-slate-900">{selectedTeam.ownerName}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Users size={14} /> Members
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {selectedTeam.memberCount}
              {selectedTeam.maxMembers ? ` / ${selectedTeam.maxMembers}` : ""}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Trophy size={14} /> Total XP
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {selectedTeam.totalXp.toLocaleString()}
            </p>
          </div>
        </div>

        {selectedTeam.inviteCode && (
          <div className="bg-[#E9F8EE] border border-[#229C62]/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#229C62] mb-0.5">Invite Code</p>
              <p className="text-lg font-mono font-bold text-[#0F203A] tracking-wider">{selectedTeam.inviteCode}</p>
            </div>
            <button
              onClick={() => copyCode(selectedTeam.inviteCode!)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#229C62] text-white text-xs font-medium hover:bg-[#0F203A] transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        {sortedMembers.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Leaderboard</h2>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {sortedMembers.map((member, idx) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0"
                >
                  <span className="text-sm font-bold text-slate-400 w-6 text-center">
                    {idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#E9F8EE] flex items-center justify-center">
                    <span className="text-xs font-bold text-[#0F203A]">
                      {member.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{member.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{member.role?.toLowerCase()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-amber-400" />
                    <span className="text-sm font-semibold text-slate-700">
                      {member.xp?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTeam.courses && selectedTeam.courses.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Enrolled Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedTeam.courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <BookOpen size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{course.title}</p>
                    {course.progress !== undefined && (
                      <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-[#229C62] h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(course.progress, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── MY TEAM VIEW ─────────────────────────────────────
  if (myTeam) {
    const sortedMembers = myTeam.members
      ? [...myTeam.members].sort((a, b) => b.xp - a.xp)
      : [];

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader title="My Team" description={myTeam.name} />

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-[#E9F8EE] p-3 rounded-xl">
            <Users size={24} className="text-[#229C62]" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{myTeam.name}</h1>
            {myTeam.description && <p className="text-sm text-slate-500">{myTeam.description}</p>}
          </div>
          <button
            onClick={handleLeave}
            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Leave Team
          </button>
        </div>

        {myTeam.inviteCode && (
          <div className="bg-[#E9F8EE] border border-[#229C62]/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#229C62] mb-0.5">Share this invite code with teammates</p>
              <p className="text-lg font-mono font-bold text-[#0F203A] tracking-wider">{myTeam.inviteCode}</p>
            </div>
            <button
              onClick={() => copyCode(myTeam.inviteCode!)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#229C62] text-white text-xs font-medium hover:bg-[#0F203A] transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Crown size={14} /> Owner
            </div>
            <p className="text-sm font-semibold text-slate-900">{myTeam.ownerName}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Users size={14} /> Members
            </div>
            <p className="text-sm font-semibold text-slate-900">{myTeam.memberCount}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Trophy size={14} /> Total XP
            </div>
            <p className="text-sm font-semibold text-slate-900">{myTeam.totalXp.toLocaleString()}</p>
          </div>
        </div>

        {sortedMembers.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Team Members</h2>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {sortedMembers.map((member, idx) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0"
                >
                  <span className="text-sm font-bold text-slate-400 w-6 text-center">{idx + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-[#E9F8EE] flex items-center justify-center">
                    <span className="text-xs font-bold text-[#0F203A]">
                      {member.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{member.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{member.role?.toLowerCase()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-amber-400" />
                    <span className="text-sm font-semibold text-slate-700">{member.xp?.toLocaleString() || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── NO TEAM — BROWSE / CREATE / JOIN ─────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Teams"
        description="Create or join a team to collaborate with other engineers"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => { setShowCreate(true); setShowJoin(false); setError(""); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#229C62] text-white rounded-xl text-sm font-medium hover:bg-[#0F203A] transition-colors"
        >
          <Plus size={16} /> Create Team
        </button>
        <button
          onClick={() => { setShowJoin(true); setShowCreate(false); setError(""); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:border-[#229C62] transition-colors"
        >
          <LogIn size={16} /> Join with Code
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Create a Team</h3>
            <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Team name"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62] outline-none"
          />
          <input
            type="text"
            value={createDesc}
            onChange={(e) => setCreateDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62] outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setCreateVisibility("PUBLIC")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                createVisibility === "PUBLIC"
                  ? "bg-[#229C62] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Users size={12} /> Public
            </button>
            <button
              onClick={() => setCreateVisibility("PRIVATE")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                createVisibility === "PRIVATE"
                  ? "bg-[#229C62] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Shield size={12} /> Private
            </button>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !createName.trim()}
            className="w-full py-2 bg-[#229C62] text-white rounded-xl text-sm font-medium hover:bg-[#0F203A] transition-colors disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Team"}
          </button>
        </div>
      )}

      {showJoin && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Join with Invite Code</h3>
            <button onClick={() => setShowJoin(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter 8-character invite code"
            className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62] outline-none uppercase tracking-wider"
            maxLength={8}
          />
          <button
            onClick={handleJoin}
            disabled={joining || joinCode.trim().length < 4}
            className="w-full py-2 bg-[#229C62] text-white rounded-xl text-sm font-medium hover:bg-[#0F203A] transition-colors disabled:opacity-50"
          >
            {joining ? "Joining..." : "Join Team"}
          </button>
        </div>
      )}

      {teams.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#E9F8EE] flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-[#229C62]" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">No public teams yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Be the first to create a team or ask a teammate for an invite code.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => openTeam(team)}
              className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:shadow-md hover:border-[#229C62]/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="bg-[#E9F8EE] p-2 rounded-lg group-hover:bg-[#229C62]/30 transition-colors">
                  <Users size={18} className="text-[#229C62]" />
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-300 group-hover:text-[#229C62] transition-colors mt-1"
                />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">{team.name}</h3>
              {team.description && (
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{team.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                <Crown size={12} className="text-amber-400" />
                <span>{team.ownerName}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  <span>{team.memberCount} member{team.memberCount !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy size={12} className="text-amber-500" />
                  <span>{team.totalXp.toLocaleString()} XP</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
