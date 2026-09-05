"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import {
  Shield, Plus, Search, Loader2, ChevronRight, Crown,
  Trophy, Lock, Globe, Key, X, Target,
} from "lucide-react";
import toast from "@/lib/toast";

interface Guild {
  id: string;
  name: string;
  description?: string;
  motto?: string;
  primaryColor: string;
  accentColor: string;
  focusDomain?: string;
  visibility: string;
  level: number;
  xp: number;
  master: { id: string; name: string };
  _count: { members: number };
}

const DOMAIN_OPTIONS = ["", "SECURITY", "NETWORKING", "DEVOPS", "DATABASES", "SYSTEMS", "QA"];
const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "Public", icon: Globe, desc: "Anyone can join" },
  { value: "INVITE_ONLY", label: "Invite Only", icon: Key, desc: "Join with invite code" },
  { value: "PRIVATE", label: "Private", icon: Lock, desc: "Application required" },
];

export default function GuildsPage() {
  const router = useRouter();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [myGuild, setMyGuild] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", motto: "", focusDomain: "", visibility: "PUBLIC", primaryColor: "#229C62", accentColor: "#7AD62A" });
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [seekers, setSeekers] = useState<Array<{ id: string; name: string; username: string; xp: number; division: string; currentStreak: number; avatarUrl?: string; city?: string }>>([]);
  const [leaderboard, setLeaderboard] = useState<Guild[]>([]);

  useEffect(() => {
    Promise.all([
      fetchApi<Guild[]>("/guilds"),
      fetchApi<Guild | null>("/guilds/mine").catch(() => null),
      fetchApi<Array<{ id: string; name: string; username: string; xp: number; division: string; currentStreak: number }>>("/guilds/seekers").catch(() => []),
      fetchApi<Guild[]>("/guilds/leaderboard").catch(() => []),
    ]).then(([g, mine, seekersData, lb]) => {
      setGuilds(g || []);
      setMyGuild(mine);
      setSeekers(seekersData || []);
      setLeaderboard(lb || []);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetchApi<Guild>("/guilds", { method: "POST", body: JSON.stringify(form) });
      setMyGuild(res);
      setShowCreate(false);
      toast.success("Guild created!");
      router.push(`/dashboard/guilds/${res.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create guild");
    }
    setCreating(false);
  }

  async function handleJoinByCode() {
    if (!joinCode.trim()) return;
    try {
      await fetchApi(`/guilds/join/${joinCode.trim()}`, { method: "POST" });
      toast.success("Joined guild!");
      window.location.reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to join");
    }
  }

  async function handleJoin(guildId: string) {
    try {
      await fetchApi(`/guilds/${guildId}/join`, { method: "POST" });
      toast.success("Joined guild!");
      window.location.reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to join");
    }
  }

  const filtered = guilds.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="text-[#7AD62A] animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Guilds"
        description="Join a guild to compete, chat, and grow with up to 50 engineers."
        action={
          <div className="flex gap-2">
            {!myGuild && (
              <button onClick={() => setShowJoin(!showJoin)} className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 text-slate-300 text-sm rounded-lg hover:bg-white/5">
                <Key size={14} /> Join by Code
              </button>
            )}
            {!myGuild && (
              <button onClick={() => setShowCreate(!showCreate)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#7AD62A] text-[#0F203A] text-sm font-semibold rounded-lg hover:bg-[#6bc422]">
                <Plus size={14} /> Create Guild
              </button>
            )}
          </div>
        }
      />

      {/* My guild banner */}
      {myGuild && (
        <Link href={`/dashboard/guilds/${myGuild.id}`} className="block angular-card border border-[#7AD62A]/30 p-5 hover:bg-[#7AD62A]/[0.03] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0" style={{ backgroundColor: myGuild.primaryColor }}>
              {myGuild.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{myGuild.name}</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#7AD62A]/10 text-[#7AD62A]">Your Guild</span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{myGuild._count.members}/50 members · Level {myGuild.level} · {Number(myGuild.xp).toLocaleString()} XP</p>
              {myGuild.motto && <p className="text-xs text-slate-500 italic mt-1">&ldquo;{myGuild.motto}&rdquo;</p>}
            </div>
            <ChevronRight size={20} className="text-[#7AD62A] shrink-0" />
          </div>
        </Link>
      )}

      {/* Join by code */}
      {showJoin && (
        <div className="angular-card bg-[#0f172a] border border-[#7AD62A]/20 p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Join by Invite Code</h3>
          <div className="flex gap-2">
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Enter invite code..." className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7AD62A]/50" />
            <button onClick={handleJoinByCode} className="px-4 py-2 bg-[#7AD62A] text-[#0F203A] text-sm font-semibold rounded-lg hover:bg-[#6bc422]">Join</button>
            <button onClick={() => setShowJoin(false)} className="px-3 py-2 border border-white/10 text-slate-300 text-sm rounded-lg hover:bg-white/5"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Create guild form */}
      {showCreate && !myGuild && (
        <div className="angular-card bg-[#0f172a] border border-[#7AD62A]/20 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Create a Guild</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Guild name *" className="px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7AD62A]/50" />
            <input value={form.motto} onChange={(e) => setForm({ ...form, motto: e.target.value })} placeholder="Motto (optional)" className="px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7AD62A]/50" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="sm:col-span-2 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7AD62A]/50 resize-none" />
            <select value={form.focusDomain} onChange={(e) => setForm({ ...form, focusDomain: e.target.value })} className="px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#7AD62A]/50">
              <option value="">Focus domain (optional)</option>
              {DOMAIN_OPTIONS.filter(Boolean).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-2 rounded-lg border border-white/10 bg-white/5">
                <span className="text-[10px] text-slate-400">Primary</span>
                <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
              </div>
              <div className="flex items-center gap-1.5 px-2 rounded-lg border border-white/10 bg-white/5">
                <span className="text-[10px] text-slate-400">Accent</span>
                <input type="color" value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {VISIBILITY_OPTIONS.map((v) => (
              <button key={v.value} onClick={() => setForm({ ...form, visibility: v.value })} className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-colors ${form.visibility === v.value ? "border-[#7AD62A]/50 bg-[#7AD62A]/10 text-[#7AD62A]" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>
                <v.icon size={12} /> {v.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={!form.name.trim() || creating} className="px-4 py-2 bg-[#7AD62A] text-[#0F203A] text-sm font-semibold rounded-lg hover:bg-[#6bc422] disabled:opacity-50">
              {creating ? <Loader2 size={14} className="animate-spin" /> : "Create Guild"}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-white/10 text-slate-300 text-sm rounded-lg hover:bg-white/5">Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guilds..." className="w-full pl-9 pr-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7AD62A]/50" />
      </div>

      {/* Guild grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((guild) => (
          <div key={guild.id} className="angular-card bg-[#0f172a] border border-white/6 overflow-hidden hover:border-white/10 transition-all group">
            <div className="h-2 w-full" style={{ backgroundColor: guild.primaryColor }} />
            <div className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ backgroundColor: guild.primaryColor }}>
                  {guild.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white group-hover:text-[#7AD62A] transition-colors truncate">{guild.name}</h3>
                  <p className="text-xs text-slate-400">{guild._count.members}/50 members · Level {guild.level}</p>
                </div>
              </div>
              {guild.motto && <p className="text-xs text-slate-500 italic mb-2">&ldquo;{guild.motto}&rdquo;</p>}
              {guild.description && <p className="text-xs text-slate-400 line-clamp-2 mb-3">{guild.description}</p>}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <Crown size={10} className="text-amber-400" /> {guild.master.name}
                  {guild.focusDomain && <span className="px-1.5 py-0.5 rounded bg-white/5">{guild.focusDomain}</span>}
                </div>
                {!myGuild && guild.visibility !== "PRIVATE" && (
                  <button onClick={() => handleJoin(guild.id)} className="px-3 py-1 bg-[#7AD62A] text-[#0F203A] text-[10px] font-semibold rounded-lg hover:bg-[#6bc422]">
                    {guild.visibility === "INVITE_ONLY" ? "Request" : "Join"}
                  </button>
                )}
                {!myGuild && guild.visibility === "PRIVATE" && (
                  <Link href={`/dashboard/guilds/${guild.id}`} className="text-[10px] text-slate-400 flex items-center gap-1 hover:text-[#7AD62A] transition-colors"><Lock size={9} /> Apply</Link>
                )}
                {myGuild && <Link href={`/dashboard/guilds/${guild.id}`} className="text-xs text-[#7AD62A] hover:text-[#6bc422]">View</Link>}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Shield size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No guilds found</p>
          </div>
        )}
      </div>

      {/* Looking for Guild seekers */}
      {!myGuild && seekers.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Target size={14} className="text-[#7AD62A]" /> Engineers Looking for a Guild</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {seekers.slice(0, 6).map((s) => (
              <div key={s.id} className="angular-card bg-[#0f172a] border border-white/5 p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {s.name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{s.name}</p>
                  <p className="text-[10px] text-slate-500">{Number(s.xp).toLocaleString()} XP · {s.division}</p>
                </div>
                {s.currentStreak > 0 && <span className="text-[10px] text-amber-400">{s.currentStreak}d</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guild Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Trophy size={14} className="text-amber-400" /> Top Guilds</h3>
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((g, i) => (
              <Link key={g.id} href={`/dashboard/guilds/${g.id}`} className="angular-card bg-[#0f172a] border border-white/5 p-3 flex items-center gap-3 hover:border-white/8 transition-colors">
                <span className="text-xs text-slate-600 w-5 text-right shrink-0">#{i + 1}</span>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: g.primaryColor }}>
                  {g.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{g.name}</p>
                  <p className="text-[10px] text-slate-500">{g._count.members} members · Level {g.level}</p>
                </div>
                <span className="text-[10px] text-[#7AD62A] font-semibold">{Number(g.xp).toLocaleString()} XP</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
