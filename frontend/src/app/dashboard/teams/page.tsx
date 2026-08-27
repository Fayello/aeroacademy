"use client";

import { useEffect, useState, useRef } from "react";
import { fetchApi } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import {
  Users, Trophy, BookOpen, Star, ChevronRight, Loader2, Crown,
  Plus, LogIn, X, Copy, Check, Shield, Palette, Camera, Pencil, Image as ImageIcon,
} from "lucide-react";
import toast from "@/lib/toast";

const PRESET_COLORS = [
  { primary: "#229C62", accent: "#7AD62A", label: "Green" },
  { primary: "#3B82F6", accent: "#60A5FA", label: "Blue" },
  { primary: "#8B5CF6", accent: "#A78BFA", label: "Purple" },
  { primary: "#F59E0B", accent: "#FCD34D", label: "Amber" },
  { primary: "#EF4444", accent: "#F87171", label: "Red" },
  { primary: "#EC4899", accent: "#F472B6", label: "Pink" },
  { primary: "#06B6D4", accent: "#22D3EE", label: "Cyan" },
  { primary: "#F97316", accent: "#FB923C", label: "Orange" },
];

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
  avatarUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  motto?: string;
  tagline?: string;
}

export default function TeamsPage() {
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [teamTab, setTeamTab] = useState<"my-team" | "browse">("browse");
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createVisibility, setCreateVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [createMotto, setCreateMotto] = useState("");
  const [createTagline, setCreateTagline] = useState("");
  const [createPrimary, setCreatePrimary] = useState("#229C62");
  const [createAccent, setCreateAccent] = useState("#7AD62A");
  const [createAvatar, setCreateAvatar] = useState("");
  const [createBanner, setCreateBanner] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const mine = await fetchApi<Team>("/teams/mine").catch(() => null);
        if (mine) {
          setMyTeam(mine);
          setTeamTab("my-team");
        } else {
          const data = await fetchApi<Team[]>("/teams");
          setTeams(data);
          setTeamTab("browse");
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function uploadImage(file: File, type: "avatar" | "banner"): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    setUploading(type);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/upload/team`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return data.url;
    } catch {
      toast.error(`Failed to upload ${type}`);
      return null;
    } finally {
      setUploading(null);
    }
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>, mode: "create" | "edit") {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const url = await uploadImage(file, "avatar");
      if (url) {
        if (mode === "create") setCreateAvatar(url);
        else handleEditField("avatarUrl", url);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>, mode: "create" | "edit") {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const url = await uploadImage(file, "banner");
      if (url) {
        if (mode === "create") setCreateBanner(url);
        else handleEditField("bannerUrl", url);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleCreate() {
    if (!createName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const team = await fetchApi<Team>("/teams/create", {
        method: "POST",
        body: JSON.stringify({
          name: createName.trim(),
          description: createDesc.trim() || undefined,
          visibility: createVisibility,
          avatarUrl: createAvatar || undefined,
          bannerUrl: createBanner || undefined,
          primaryColor: createPrimary,
          accentColor: createAccent,
          motto: createMotto.trim() || undefined,
          tagline: createTagline.trim() || undefined,
        }),
      });
      setMyTeam(team);
      setShowCreate(false);
      setCreateName("");
      setCreateDesc("");
      setCreateMotto("");
      setCreateTagline("");
      setCreateAvatar("");
      setCreateBanner("");
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
      const team = await fetchApi<Team>("/teams/join", {
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
      await fetchApi("/teams/leave", { method: "DELETE" });
      setMyTeam(null);
      const data = await fetchApi<Team[]>("/teams");
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
      const detail = await fetchApi<Team>(`/teams/${team.id}`);
      setSelectedTeam(detail);
    } catch {
      setSelectedTeam(team);
    } finally {
      setDetailLoading(false);
    }
  }

  const [editFields, setEditFields] = useState<Partial<Team>>({});

  function handleEditField(field: string, value: string) {
    setEditFields((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveEdit() {
    if (!myTeam) return;
    try {
      const updated = await fetchApi<Team>(`/teams/${myTeam.id}/update`, {
        method: "POST",
        body: JSON.stringify(editFields),
      });
      setMyTeam({ ...myTeam, ...updated });
      setShowEdit(false);
      setEditFields({});
      toast.success("Team updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update team");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-[#7AD62A] animate-spin" />
      </div>
    );
  }

  // ─── HELPER: Team Banner + Avatar ────────────────────────
  function TeamHeader({ team, size = "lg" }: { team: Team; size?: "sm" | "lg" }) {
    const primary = team.primaryColor || "#229C62";
    const accent = team.accentColor || "#7AD62A";
    const isLg = size === "lg";

    return (
      <div className="relative overflow-hidden rounded-xl" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
        {team.bannerUrl && (
          <img src={team.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className={`relative z-10 flex items-center gap-3 ${isLg ? "p-5" : "p-3"}`}>
          {team.avatarUrl ? (
            <img
              src={team.avatarUrl}
              alt={team.name}
              className={`${isLg ? "w-14 h-14" : "w-10 h-10"} rounded-xl object-cover border-2 border-white/30 shrink-0`}
            />
          ) : (
            <div className={`${isLg ? "w-14 h-14" : "w-10 h-10"} rounded-xl bg-white/20 flex items-center justify-center border-2 border-white/30 shrink-0`}>
              <Users size={isLg ? 24 : 18} className="text-white" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className={`font-bold text-white truncate ${isLg ? "text-lg" : "text-sm"}`}>{team.name}</h3>
            {team.motto && (
              <p className="text-white/80 text-xs truncate italic">&ldquo;{team.motto}&rdquo;</p>
            )}
            {team.tagline && isLg && (
              <p className="text-white/60 text-xs truncate mt-0.5">{team.tagline}</p>
            )}
          </div>
        </div>
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
          className="text-sm text-[#7AD62A] hover:text-[#0F203A] font-medium"
        >
          &larr; Back to Teams
        </button>

        <TeamHeader team={selectedTeam} />

        {selectedTeam.description && (
          <p className="text-sm text-slate-400">{selectedTeam.description}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="angular-card p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Crown size={14} /> Owner
            </div>
            <p className="text-sm font-semibold text-white">{selectedTeam.ownerName}</p>
          </div>
          <div className="angular-card p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Users size={14} /> Members
            </div>
            <p className="text-sm font-semibold text-white">
              {selectedTeam.memberCount}
              {selectedTeam.maxMembers ? ` / ${selectedTeam.maxMembers}` : ""}
            </p>
          </div>
          <div className="angular-card p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Trophy size={14} /> Total XP
            </div>
            <p className="text-sm font-semibold text-white">
              {selectedTeam.totalXp.toLocaleString()}
            </p>
          </div>
        </div>

        {selectedTeam.inviteCode && (
          <div className="bg-[#7AD62A]/10 border border-[#7AD62A]/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#7AD62A] mb-0.5">Invite Code</p>
              <p className="text-lg font-mono font-bold text-[#0F203A] tracking-wider">{selectedTeam.inviteCode}</p>
            </div>
            <button
              onClick={() => copyCode(selectedTeam.inviteCode!)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7AD62A] text-white text-xs font-medium hover:bg-[#0F203A] transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        {sortedMembers.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Leaderboard</h2>
            <div className="angular-card overflow-hidden">
              {sortedMembers.map((member, idx) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-white/10 last:border-b-0"
                >
                  <span className="text-sm font-bold text-slate-400 w-6 text-center">{idx + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-[#7AD62A]/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#0F203A]">
                      {member.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{member.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{member.role?.toLowerCase()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-amber-400" />
                    <span className="text-sm font-semibold text-slate-300">{member.xp?.toLocaleString() || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTeam.courses && selectedTeam.courses.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Enrolled Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedTeam.courses.map((course) => (
                <div key={course.id} className="angular-card p-4 flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-lg">
                    <BookOpen size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{course.title}</p>
                    {course.progress !== undefined && (
                      <div className="mt-1.5 w-full bg-white/5 rounded-full h-1.5">
                        <div className="bg-[#7AD62A] h-1.5 rounded-full transition-all" style={{ width: `${Math.min(course.progress, 100)}%` }} />
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

  // ─── TABS — MY TEAM / BROWSE ─────────────────────────
  const sortedMembers = myTeam?.members
    ? [...myTeam.members].sort((a, b) => b.xp - a.xp)
    : [];
  const isOwner = myTeam?.ownerId === (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}").id : "");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title="Teams" description="Create or join a team to collaborate with other engineers" />

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-white/10">
        <button
          onClick={() => setTeamTab("my-team")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            teamTab === "my-team"
              ? "border-[#7AD62A] text-[#7AD62A]"
              : "border-transparent text-slate-500 hover:text-slate-200 hover:border-white/10"
          }`}
        >
          My Team
          {myTeam && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-[#7AD62A]/10 text-[#7AD62A]">1</span>}
        </button>
        <button
          onClick={() => setTeamTab("browse")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            teamTab === "browse"
              ? "border-[#7AD62A] text-[#7AD62A]"
              : "border-transparent text-slate-500 hover:text-slate-200 hover:border-white/10"
          }`}
        >
          Browse Teams
          <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-white/5 text-slate-500">{teams.length}</span>
        </button>
      </div>

      {/* My Team tab */}
      {teamTab === "my-team" && myTeam && (
        <div className="space-y-6">
          <TeamHeader team={myTeam} />
          {myTeam.motto && !showEdit && (
            <p className="text-sm text-slate-500 italic">&ldquo;{myTeam.motto}&rdquo;</p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {isOwner && (
              <button
                onClick={() => {
                  setEditFields({
                    name: myTeam.name,
                    description: myTeam.description || "",
                    motto: myTeam.motto || "",
                    tagline: myTeam.tagline || "",
                    avatarUrl: myTeam.avatarUrl || "",
                    bannerUrl: myTeam.bannerUrl || "",
                    primaryColor: myTeam.primaryColor || "#229C62",
                    accentColor: myTeam.accentColor || "#7AD62A",
                  });
                  setShowEdit(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7AD62A] bg-[#7AD62A]/10 rounded-lg hover:bg-[#7AD62A]/20 transition-colors"
              >
                <Pencil size={12} /> Customize
              </button>
            )}
            <button
              onClick={handleLeave}
              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-500/10 rounded-lg hover:bg-red-100 transition-colors"
            >
              Leave Team
            </button>
          </div>

          {showEdit && (
            <div className="angular-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Palette size={14} /> Customize Team
                </h3>
                <button onClick={() => setShowEdit(false)} className="text-slate-400 hover:text-slate-300">
                  <X size={16} />
                </button>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  {(editFields.avatarUrl || myTeam.avatarUrl) ? (
                    <img src={(editFields.avatarUrl || myTeam.avatarUrl)!} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Camera size={20} className="text-slate-400" />
                    </div>
                  )}
                  <button
                    onClick={() => avatarRef.current?.click()}
                    className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <Camera size={16} className="text-white" />
                  </button>
                  <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e, "edit")} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">Team Avatar</p>
                  <p className="text-xs text-slate-400">Square image, recommended 128x128</p>
                </div>
              </div>

              {/* Banner */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Banner Image</label>
                <div className="relative group rounded-xl overflow-hidden border border-white/10">
                  {(editFields.bannerUrl || myTeam.bannerUrl) ? (
                    <img src={(editFields.bannerUrl || myTeam.bannerUrl)!} alt="" className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 bg-gradient-to-r from-[#0F203A] to-[#7AD62A] flex items-center justify-center">
                      <ImageIcon size={20} className="text-white/40" />
                    </div>
                  )}
                  <button
                    onClick={() => bannerRef.current?.click()}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <Camera size={16} className="text-white" />
                  </button>
                  <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleBannerUpload(e, "edit")} />
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Team Colors</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => { handleEditField("primaryColor", preset.primary); handleEditField("accentColor", preset.accent); }}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
                        editFields.primaryColor === preset.primary ? "border-slate-900 scale-110" : "border-transparent"
                      }`}
                      style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.accent})` }}
                      title={preset.label}
                    />
                  ))}
                </div>
              </div>

              {/* Fields */}
              <input
                type="text"
                value={(editFields.name as string) || ""}
                onChange={(e) => handleEditField("name", e.target.value)}
                placeholder="Team name"
                className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none"
              />
              <input
                type="text"
                value={(editFields.description as string) || ""}
                onChange={(e) => handleEditField("description", e.target.value)}
                placeholder="Description"
                className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none"
              />
              <input
                type="text"
                value={(editFields.motto as string) || ""}
                onChange={(e) => handleEditField("motto", e.target.value)}
                placeholder="Team motto (shown on banner)"
                className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none"
              />
              <input
                type="text"
                value={(editFields.tagline as string) || ""}
                onChange={(e) => handleEditField("tagline", e.target.value)}
                placeholder="Short tagline"
                className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none"
              />

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowEdit(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-white/5 rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveEdit} className="px-4 py-2 text-sm bg-[#7AD62A] text-white rounded-lg hover:bg-[#0F203A] transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {myTeam.inviteCode && (
            <div className="bg-[#7AD62A]/10 border border-[#7AD62A]/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#7AD62A] mb-0.5">Share this invite code with teammates</p>
                <p className="text-lg font-mono font-bold text-[#0F203A] tracking-wider">{myTeam.inviteCode}</p>
              </div>
              <button
                onClick={() => copyCode(myTeam.inviteCode!)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7AD62A] text-white text-xs font-medium hover:bg-[#0F203A] transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="angular-card p-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1"><Crown size={14} /> Owner</div>
              <p className="text-sm font-semibold text-white">{myTeam.ownerName}</p>
            </div>
            <div className="angular-card p-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1"><Users size={14} /> Members</div>
              <p className="text-sm font-semibold text-white">{myTeam.memberCount}</p>
            </div>
            <div className="angular-card p-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1"><Trophy size={14} /> Total XP</div>
              <p className="text-sm font-semibold text-white">{myTeam.totalXp.toLocaleString()}</p>
            </div>
          </div>

          {sortedMembers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Team Members</h2>
              <div className="angular-card overflow-hidden">
                {sortedMembers.map((member, idx) => (
                  <div key={member.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/10 last:border-b-0">
                    <span className="text-sm font-bold text-slate-400 w-6 text-center">{idx + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-[#7AD62A]/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-[#0F203A]">{member.name?.charAt(0)?.toUpperCase() || "?"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{member.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{member.role?.toLowerCase()}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400" />
                      <span className="text-sm font-semibold text-slate-300">{member.xp?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Team tab - no team */}
      {teamTab === "my-team" && !myTeam && (
        <div className="angular-card py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#7AD62A]/10 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-[#7AD62A]" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">You haven&apos;t joined a team yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Create a new team or join an existing one with an invite code.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setShowCreate(true); setTeamTab("browse"); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#7AD62A] text-white rounded-xl text-sm font-medium hover:bg-[#0F203A] transition-colors"
            >
              <Plus size={16} /> Create Team
            </button>
            <button
              onClick={() => { setShowJoin(true); setTeamTab("browse"); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] border border-white/10 text-slate-300 rounded-xl text-sm font-medium hover:border-[#7AD62A] transition-colors"
            >
              <LogIn size={16} /> Join with Code
            </button>
          </div>
        </div>
      )}

      {/* Browse tab */}
      {teamTab === "browse" && (
        <>
          {error && (
            <div className="bg-red-500/10 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => { setShowCreate(true); setShowJoin(false); setError(""); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#7AD62A] text-white rounded-xl text-sm font-medium hover:bg-[#0F203A] transition-colors"
            >
              <Plus size={16} /> Create Team
            </button>
            <button
              onClick={() => { setShowJoin(true); setShowCreate(false); setError(""); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0f172a] border border-white/10 text-slate-300 rounded-xl text-sm font-medium hover:border-[#7AD62A] transition-colors"
            >
              <LogIn size={16} /> Join with Code
            </button>
          </div>

          {showCreate && (
            <div className="angular-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Create a Team</h3>
            <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-300">
              <X size={16} />
            </button>
          </div>

          {/* Avatar + Banner Preview */}
          <div className="relative rounded-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${createPrimary}, ${createAccent})` }}>
            {createBanner ? (
              <img src={createBanner} alt="" className="w-full h-24 object-cover opacity-60" />
            ) : (
              <div className="w-full h-24" />
            )}
            <div className="absolute bottom-3 left-3">
              <div className="relative group">
                {createAvatar ? (
                  <img src={createAvatar} alt="" className="w-12 h-12 rounded-xl object-cover border-2 border-white/30" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center border-2 border-white/30">
                    <Camera size={16} className="text-white/60" />
                  </div>
                )}
                <button
                  onClick={() => avatarRef.current?.click()}
                  className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <Camera size={12} className="text-white" />
                </button>
              </div>
            </div>
            <button
              onClick={() => bannerRef.current?.click()}
              className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/40 text-white text-[10px] sm:opacity-0 sm:group-hover:opacity-100 hover:bg-black/60 transition-all flex items-center gap-1"
            >
              <Camera size={10} /> Banner
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e, "create")} />
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleBannerUpload(e, "create")} />
          </div>

          {/* Color Presets */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block flex items-center gap-1"><Palette size={12} /> Team Colors</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => { setCreatePrimary(preset.primary); setCreateAccent(preset.accent); }}
                  className={`w-7 h-7 rounded-lg border-2 transition-all ${
                    createPrimary === preset.primary ? "border-slate-900 scale-110" : "border-transparent"
                  }`}
                  style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.accent})` }}
                  title={preset.label}
                />
              ))}
            </div>
          </div>

          <input
            type="text"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Team name"
            className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none"
          />
          <input
            type="text"
            value={createDesc}
            onChange={(e) => setCreateDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none"
          />
          <input
            type="text"
            value={createMotto}
            onChange={(e) => setCreateMotto(e.target.value)}
            placeholder="Team motto (optional, shown on banner)"
            className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none"
          />
          <input
            type="text"
            value={createTagline}
            onChange={(e) => setCreateTagline(e.target.value)}
            placeholder="Short tagline (optional)"
            className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setCreateVisibility("PUBLIC")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                createVisibility === "PUBLIC" ? "bg-[#7AD62A] text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              <Users size={12} /> Public
            </button>
            <button
              onClick={() => setCreateVisibility("PRIVATE")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                createVisibility === "PRIVATE" ? "bg-[#7AD62A] text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              <Shield size={12} /> Private
            </button>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !createName.trim()}
            className="w-full py-2 bg-[#7AD62A] text-white rounded-xl text-sm font-medium hover:bg-[#0F203A] transition-colors disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Team"}
          </button>
        </div>
      )}

          {showJoin && (
            <div className="angular-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Join with Invite Code</h3>
            <button onClick={() => setShowJoin(false)} className="text-slate-400 hover:text-slate-300">
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter 8-character invite code"
            className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none uppercase tracking-wider"
            maxLength={8}
          />
          <button
            onClick={handleJoin}
            disabled={joining || joinCode.trim().length < 4}
            className="w-full py-2 bg-[#7AD62A] text-white rounded-xl text-sm font-medium hover:bg-[#0F203A] transition-colors disabled:opacity-50"
          >
            {joining ? "Joining..." : "Join Team"}
          </button>
        </div>
      )}

          {teams.length === 0 ? (
        <div className="angular-card py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#7AD62A]/10 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-[#7AD62A]" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No public teams yet</h3>
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
              className="angular-card overflow-hidden text-left hover-lift hover:border-[#7AD62A]/20 transition-all group"
            >
              {/* Team Banner */}
              <div
                className="relative h-16"
                style={{ background: `linear-gradient(135deg, ${team.primaryColor || "#229C62"}, ${team.accentColor || "#7AD62A"})` }}
              >
                {team.bannerUrl && (
                  <img src={team.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                )}
                {team.avatarUrl ? (
                  <img src={team.avatarUrl} alt="" className="absolute -bottom-4 left-4 w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" />
                ) : (
                  <div className="absolute -bottom-4 left-4 w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center border-2 border-white shadow-sm">
                    <Users size={16} className="text-[#7AD62A]" />
                  </div>
                )}
                <ChevronRight size={16} className="absolute top-3 right-3 text-white/40 group-hover:text-white/80 transition-colors" />
              </div>

              <div className="p-4 pt-6">
                <h3 className="text-sm font-semibold text-white mb-0.5">{team.name}</h3>
                {team.motto && (
                  <p className="text-[10px] text-slate-400 italic mb-1">&ldquo;{team.motto}&rdquo;</p>
                )}
                {team.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">{team.description}</p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-2">
                  <Crown size={10} className="text-amber-400" />
                  <span>{team.ownerName}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <Users size={10} />
                    <span>{team.memberCount} member{team.memberCount !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy size={10} className="text-amber-500" />
                    <span>{team.totalXp.toLocaleString()} XP</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
