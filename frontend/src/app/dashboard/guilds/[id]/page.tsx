"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import {
  Loader2, Users, Crown, Shield, Settings, Activity,
  Zap, UserPlus,
  Check, X, Copy, RefreshCw, Globe, Lock, Key,
  Send, Pin, MoreVertical,
  ArrowDown, UserX, LogOut,
} from "lucide-react";
import toast from "@/lib/toast";

const TABS = ["Roster", "Chat", "Feed", "Applications", "Settings"] as const;
type Tab = (typeof TABS)[number];

interface GuildMember {
  id: string;
  userId: string;
  role: string;
  contributionXp: number;
  joinedAt: string;
  user: { id: string; name: string; username: string; xp: number; division: string; avatarUrl?: string; currentStreak: number };
}

interface GuildDetail {
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
  inviteCode: string;
  maxMembers: number;
  masterId: string;
  master: { id: string; name: string; avatarUrl?: string };
  _count: { members: number };
  members: GuildMember[];
}

interface ChatMessage {
  id: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  user: { id: string; name: string; username: string; avatarUrl?: string };
}

interface GuildApplication {
  id: string;
  userId: string;
  message?: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; username: string; xp: number; division: string };
}

interface ActivityEvent {
  id: string;
  type: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string };
}

const DIVISION_COLORS: Record<string, string> = { CADET: "text-slate-400", ENGINEER: "text-sky-400", SPECIALIST: "text-indigo-400", OPERATIVE: "text-purple-400", AGENT: "text-amber-400", COMMANDER: "text-[#7AD62A]" };
const ROLE_BADGES: Record<string, string> = { MASTER: "bg-amber-500/20 text-amber-300", OFFICER: "bg-indigo-500/20 text-indigo-300", MEMBER: "bg-white/5 text-slate-400" };

function timeAgo(d: string) {
  const sec = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function timeAgoMinutes(d: string) {
  const sec = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

export default function GuildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.id as string;
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  const [guild, setGuild] = useState<GuildDetail | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Roster");
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [myRole, setMyRole] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Feed state
  const [feed, setFeed] = useState<ActivityEvent[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);

  // Applications state
  const [applications, setApplications] = useState<GuildApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({ name: "", description: "", motto: "", focusDomain: "", visibility: "PUBLIC" });
  const [savingSettings, setSavingSettings] = useState(false);

  // Action menus
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  // Apply state
  const [applyMessage, setApplyMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const loadGuild = useCallback(async () => {
    try {
      const data = await fetchApi<GuildDetail>(`/guilds/${guildId}`);
      setGuild(data);
      const myMembership = data.members.find((m) => m.userId === user.id);
      setIsMember(!!myMembership);
      setMyRole(myMembership?.role || "");
      setSettings({ name: data.name, description: data.description || "", motto: data.motto || "", focusDomain: data.focusDomain || "", visibility: data.visibility });
    } catch {
      toast.error("Failed to load guild");
      router.push("/dashboard/guilds");
    } finally {
      setLoading(false);
    }
  }, [guildId, user.id, router]);

  useEffect(() => { loadGuild(); }, [loadGuild]);

  // WebSocket connection for real-time chat
  useEffect(() => {
    if (!isMember || !guildId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(`${typeof window !== "undefined" ? window.location.origin : ""}/guild-chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("join-guild", { guildId });
    });

    socket.on("new-message", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });

    socketRef.current = socket;

    return () => {
      socket.emit("leave-guild", { guildId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [guildId, isMember]);

  // Load tab data
  useEffect(() => {
    if (!isMember) return;
    if (activeTab === "Chat") {
      setChatLoading(true);
      fetchApi<ChatMessage[]>(`/guilds/${guildId}/chat`).then((msgs) => {
        setMessages(msgs);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }).catch(() => {}).finally(() => setChatLoading(false));
    }
    if (activeTab === "Feed") {
      setFeedLoading(true);
      fetchApi<ActivityEvent[]>(`/guilds/${guildId}/feed`).then((f) => setFeed(f || [])).catch(() => {}).finally(() => setFeedLoading(false));
    }
    if (activeTab === "Applications" && (myRole === "MASTER" || myRole === "OFFICER")) {
      setAppsLoading(true);
      fetchApi<GuildApplication[]>(`/guilds/${guildId}/applications`).then((a) => setApplications(a || [])).catch(() => {}).finally(() => setAppsLoading(false));
    }
  }, [activeTab, guildId, isMember, myRole]);

  async function sendMessage() {
    if (!chatInput.trim()) return;
    const content = chatInput.trim();
    setChatInput("");

    if (socketRef.current?.connected) {
      socketRef.current.emit("send-message", { guildId, content });
    } else {
      try {
        const msg = await fetchApi<ChatMessage>(`/guilds/${guildId}/chat`, { method: "POST", body: JSON.stringify({ content }) });
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      } catch {
        toast.error("Failed to send message");
      }
    }
  }

  async function handleAppReview(appId: string, action: "APPROVED" | "REJECTED") {
    try {
      await fetchApi(`/guilds/${guildId}/applications/${appId}`, { method: "POST", body: JSON.stringify({ action }) });
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      toast.success(action === "APPROVED" ? "Accepted!" : "Rejected");
      if (action === "APPROVED") loadGuild();
    } catch {
      toast.error("Failed to review application");
    }
  }

  async function handleKick(memberId: string) {
    try {
      await fetchApi(`/guilds/${guildId}/members/${memberId}`, { method: "DELETE" });
      toast.success("Member kicked");
      loadGuild();
      
      setShowActionMenu(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to kick");
    }
  }

  async function handlePromote(memberId: string) {
    try {
      await fetchApi(`/guilds/${guildId}/promote/${memberId}`, { method: "POST" });
      toast.success("Promoted to officer");
      loadGuild();
      
      setShowActionMenu(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to promote");
    }
  }

  async function handleDemote(memberId: string) {
    try {
      await fetchApi(`/guilds/${guildId}/demote/${memberId}`, { method: "POST" });
      toast.success("Demoted");
      loadGuild();
      
      setShowActionMenu(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to demote");
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      await fetchApi(`/guilds/${guildId}`, { method: "PATCH", body: JSON.stringify(settings) });
      toast.success("Settings saved");
      loadGuild();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
    setSavingSettings(false);
  }

  async function handleRefreshCode() {
    try {
      const res = await fetchApi<{ inviteCode: string }>(`/guilds/${guildId}/refresh-code`, { method: "POST" });
      if (guild) setGuild({ ...guild, inviteCode: res.inviteCode });
      toast.success("Invite code refreshed");
    } catch {
      toast.error("Failed to refresh code");
    }
  }

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this guild?")) return;
    try {
      await fetchApi("/guilds/leave", { method: "POST" });
      toast.success("Left guild");
      router.push("/dashboard/guilds");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to leave");
    }
  }

  async function handleDisband() {
    if (!confirm("DISBAND this guild? This is permanent and cannot be undone.")) return;
    try {
      await fetchApi(`/guilds/${guildId}`, { method: "DELETE" });
      toast.success("Guild disbanded");
      router.push("/dashboard/guilds");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to disband");
    }
  }

  async function handleApply() {
    setApplying(true);
    try {
      await fetchApi(`/guilds/${guildId}/apply`, { method: "POST", body: JSON.stringify({ message: applyMessage.trim() || undefined }) });
      toast.success("Application sent!");
      setHasApplied(true);
      setApplyMessage("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to apply");
    }
    setApplying(false);
  }

  async function handlePinMessage(messageId: string) {
    try {
      await fetchApi(`/guilds/${guildId}/chat/pin/${messageId}`, { method: "POST" });
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, pinned: !m.pinned } : m));
    } catch {
      toast.error("Failed to pin message");
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="text-[#7AD62A] animate-spin" /></div>;
  }

  if (!guild) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header banner */}
      <div className="relative rounded-xl overflow-hidden border border-white/6">
        <div className="h-28 sm:h-36" style={{ background: `linear-gradient(135deg, ${guild.primaryColor}30 0%, ${guild.accentColor}10 50%, #0a0f1a 100%)` }} />
        <div className="px-5 pb-5 -mt-10 relative z-10">
          <div className="flex items-end gap-4 mb-4">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center text-white font-bold text-3xl border-4 border-[#0a0f1a] shrink-0 shadow-lg" style={{ backgroundColor: guild.primaryColor }}>
              {guild.name[0]}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{guild.name}</h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#7AD62A]/10 text-[#7AD62A]">Level {guild.level}</span>
                {guild.visibility === "PRIVATE" && <Lock size={12} className="text-slate-500" />}
                {guild.visibility === "INVITE_ONLY" && <Key size={12} className="text-slate-500" />}
                {guild.visibility === "PUBLIC" && <Globe size={12} className="text-slate-500" />}
              </div>
              {guild.motto && <p className="text-xs text-slate-500 italic mt-1">&ldquo;{guild.motto}&rdquo;</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Crown size={12} className="text-amber-400" /> {guild.master.name}</span>
            <span className="flex items-center gap-1.5"><Users size={12} /> {guild._count.members}/{guild.maxMembers}</span>
            <span className="flex items-center gap-1.5"><Zap size={12} className="text-[#7AD62A]" /> {Number(guild.xp).toLocaleString()} XP</span>
            {guild.focusDomain && <span className="px-1.5 py-0.5 rounded bg-white/5">{guild.focusDomain}</span>}
          </div>

          {guild.description && <p className="text-sm text-slate-400 mt-3">{guild.description}</p>}
        </div>
      </div>

      {/* Apply section for non-members on PRIVATE guilds */}
      {!isMember && guild.visibility === "PRIVATE" && (
        <div className="angular-card bg-[#0f172a] border border-amber-500/20 p-5">
          {hasApplied ? (
            <div className="flex items-center gap-2 text-amber-400">
              <Check size={16} />
              <p className="text-sm font-medium">Application sent! Waiting for review.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-300 mb-3">This guild is private. Send an application to join.</p>
              <textarea value={applyMessage} onChange={(e) => setApplyMessage(e.target.value)} placeholder="Why do you want to join? (optional)" rows={2} className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7AD62A]/50 resize-none mb-3" />
              <button onClick={handleApply} disabled={applying} className="px-4 py-2 bg-[#7AD62A] text-[#0F203A] text-sm font-semibold rounded-lg hover:bg-[#6bc422] disabled:opacity-50">
                {applying ? <Loader2 size={14} className="animate-spin" /> : "Send Application"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      {isMember && (
        <div className="flex gap-1 p-1 bg-white/[0.02] rounded-lg border border-white/5 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab ? "bg-[#7AD62A]/10 text-[#7AD62A]" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              {tab}
              {tab === "Applications" && applications.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px]">{applications.length}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      <div className="min-h-[300px]">

        {/* === ROSTER TAB === */}
        {activeTab === "Roster" && (
          <div className="space-y-3">
            {guild.members.map((m, i) => (
              <div key={m.id} className="angular-card bg-[#0f172a] border border-white/5 p-4 flex items-center gap-3 hover:border-white/8 transition-colors">
                <span className="text-xs text-slate-600 w-5 text-right shrink-0">#{i + 1}</span>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: guild.primaryColor }}>
                  {m.user.name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">{m.user.name || "Unknown"}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${ROLE_BADGES[m.role]}`}>
                      {m.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                    <span className={DIVISION_COLORS[m.user.division] || ""}>{m.user.division}</span>
                    <span>{Number(m.user.xp).toLocaleString()} XP</span>
                    {m.user.currentStreak > 0 && <span className="text-amber-400">{m.user.currentStreak}d streak</span>}
                    <span>contributed {Number(m.contributionXp).toLocaleString()} XP</span>
                  </div>
                </div>
                {m.userId !== user.id && (myRole === "MASTER" || myRole === "OFFICER") && (
                  <div className="relative">
                    <button onClick={() => setShowActionMenu(showActionMenu === m.id ? null : m.id)} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded">
                      <MoreVertical size={14} />
                    </button>
                    {showActionMenu === m.id && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-[#1a2332] border border-white/10 rounded-lg shadow-xl z-20 py-1">
                        {m.role === "MEMBER" && myRole === "MASTER" && (
                          <button onClick={() => handlePromote(m.userId)} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2">
                            <Shield size={12} className="text-indigo-400" /> Promote to Officer
                          </button>
                        )}
                        {m.role === "OFFICER" && myRole === "MASTER" && (
                          <button onClick={() => handleDemote(m.userId)} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2">
                            <ArrowDown size={12} className="text-slate-400" /> Demote to Member
                          </button>
                        )}
                        {m.role !== "MASTER" && (
                          <button onClick={() => handleKick(m.userId)} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/5 flex items-center gap-2">
                            <UserX size={12} /> Kick from Guild
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* === CHAT TAB === */}
        {activeTab === "Chat" && (
          <div className="angular-card bg-[#0f172a] border border-white/5 overflow-hidden flex flex-col" style={{ height: "450px" }}>
            {chatLoading ? (
              <div className="flex-1 flex items-center justify-center"><Loader2 size={20} className="text-[#7AD62A] animate-spin" /></div>
            ) : (
              <>
                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && <p className="text-center text-slate-500 text-xs py-8">No messages yet. Start the conversation!</p>}
                  {messages.map((msg) => (
                    <div key={msg.id} className={`group flex items-start gap-2.5 ${msg.pinned ? "bg-amber-500/5 -mx-2 px-2 py-1 rounded-lg border border-amber-500/10" : ""}`}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: guild.primaryColor }}>
                        {msg.user.name?.[0] || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{msg.user.name}</span>
                          <span className="text-[10px] text-slate-500">{timeAgoMinutes(msg.createdAt)}</span>
                          {msg.pinned && <Pin size={10} className="text-amber-400" />}
                          {(myRole === "MASTER" || myRole === "OFFICER") && (
                            <button onClick={() => handlePinMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/5 rounded" title={msg.pinned ? "Unpin" : "Pin"}>
                              <Pin size={10} className={msg.pinned ? "text-amber-400" : "text-slate-500"} />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 mt-0.5 break-words">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-white/5 p-3 flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7AD62A]/50"
                  />
                  <button onClick={sendMessage} disabled={!chatInput.trim()} className="p-2 bg-[#7AD62A] text-[#0F203A] rounded-lg hover:bg-[#6bc422] disabled:opacity-40">
                    <Send size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* === FEED TAB === */}
        {activeTab === "Feed" && (
          <div className="space-y-2">
            {feedLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 size={20} className="text-[#7AD62A] animate-spin" /></div>
            ) : feed.length === 0 ? (
              <div className="text-center py-12">
                <Activity size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No activity yet</p>
              </div>
            ) : (
              feed.map((evt) => {
                const meta = evt.metadata && typeof evt.metadata === "object" ? evt.metadata : {};
                const detail = (meta as Record<string, unknown>).labTitle
                  || (meta as Record<string, unknown>).flagTitle
                  || (meta as Record<string, unknown>).courseTitle
                  || (meta as Record<string, unknown>).lessonTitle
                  || (meta as Record<string, unknown>).quizTitle
                  || (meta as Record<string, unknown>).detail
                  || (meta as Record<string, unknown>).title
                  || null;
                return (
                  <div key={evt.id} className="angular-card bg-[#0f172a] border border-white/5 p-4 flex items-center gap-3">
                    <Activity size={14} className="text-[#7AD62A] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300">
                        <span className="font-semibold text-white">{evt.user.name}</span>{" "}
                        {evt.type.replace(/_/g, " ").toLowerCase()}
                        {detail && <span className="text-slate-500"> · {String(detail)}</span>}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{timeAgo(evt.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* === APPLICATIONS TAB === */}
        {activeTab === "Applications" && (myRole === "MASTER" || myRole === "OFFICER") ? (
          <div className="space-y-3">
            {appsLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 size={20} className="text-[#7AD62A] animate-spin" /></div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No pending applications</p>
              </div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="angular-card bg-[#0f172a] border border-white/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: guild.primaryColor }}>
                        {app.user.name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{app.user.name}</p>
                        <p className="text-[10px] text-slate-500">{Number(app.user.xp).toLocaleString()} XP · {app.user.division}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleAppReview(app.id, "APPROVED")} className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20">
                        <Check size={14} />
                      </button>
                      <button onClick={() => handleAppReview(app.id, "REJECTED")} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  {app.message && <p className="text-xs text-slate-400 italic mt-1">&ldquo;{app.message}&rdquo;</p>}
                  <p className="text-[10px] text-slate-500 mt-1">Applied {timeAgo(app.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "Applications" ? (
          <div className="text-center py-12">
            <Shield size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Only officers and masters can manage applications</p>
          </div>
        ) : null}

        {/* === SETTINGS TAB === */}
        {activeTab === "Settings" && (myRole === "MASTER" || myRole === "OFFICER") ? (
          <div className="angular-card bg-[#0f172a] border border-white/5 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Guild Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Guild Name {myRole !== "MASTER" && <span className="text-slate-600">(master only)</span>}</label>
                <input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} disabled={myRole !== "MASTER"} className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7AD62A]/50 disabled:opacity-40 disabled:cursor-not-allowed" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Motto</label>
                <input value={settings.motto} onChange={(e) => setSettings({ ...settings, motto: e.target.value })} className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7AD62A]/50" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Focus Domain</label>
                <select value={settings.focusDomain} onChange={(e) => setSettings({ ...settings, focusDomain: e.target.value })} className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#7AD62A]/50">
                  <option value="">None</option>
                  {["SECURITY", "NETWORKING", "DEVOPS", "DATABASES", "SYSTEMS", "QA"].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Visibility {myRole !== "MASTER" && <span className="text-slate-600">(master only)</span>}</label>
                <div className="flex gap-2">
                  {["PUBLIC", "INVITE_ONLY", "PRIVATE"].map((v) => (
                    <button key={v} onClick={() => myRole === "MASTER" && setSettings({ ...settings, visibility: v })} disabled={myRole !== "MASTER"} className={`flex-1 py-2 text-[10px] rounded-lg border transition-colors ${settings.visibility === v ? "border-[#7AD62A]/50 bg-[#7AD62A]/10 text-[#7AD62A]" : "border-white/10 text-slate-400 hover:bg-white/5"} ${myRole !== "MASTER" ? "opacity-40 cursor-not-allowed" : ""}`}>
                      {v.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] text-slate-400 mb-1 block">Description</label>
                <textarea value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} rows={3} className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7AD62A]/50 resize-none" />
              </div>
            </div>

            {/* Invite code section (master only) */}
            {myRole === "MASTER" && (
              <div className="border-t border-white/5 pt-4">
                <label className="text-[10px] text-slate-400 mb-1 block">Invite Code</label>
                <div className="flex gap-2">
                  <input value={guild.inviteCode || ""} readOnly className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white font-mono" />
                  <button onClick={() => { navigator.clipboard.writeText(guild.inviteCode || ""); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }} className="p-2 border border-white/10 text-slate-300 rounded-lg hover:bg-white/5">
                    {copiedCode ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                  <button onClick={handleRefreshCode} className="p-2 border border-white/10 text-slate-300 rounded-lg hover:bg-white/5">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={handleSaveSettings} disabled={savingSettings} className="px-4 py-2 bg-[#7AD62A] text-[#0F203A] text-sm font-semibold rounded-lg hover:bg-[#6bc422] disabled:opacity-50">
                {savingSettings ? <Loader2 size={14} className="animate-spin" /> : "Save Settings"}
              </button>
            </div>

            {/* Danger zone (master only) */}
            {myRole === "MASTER" && (
              <div className="border-t border-red-500/20 pt-4 mt-4">
                <p className="text-xs text-red-400 mb-2">Danger Zone</p>
                <button onClick={handleDisband} className="px-4 py-2 bg-red-500/10 text-red-400 text-sm rounded-lg hover:bg-red-500/20 border border-red-500/20">
                  Disband Guild
                </button>
              </div>
            )}
          </div>
        ) : activeTab === "Settings" ? (
          <div className="text-center py-12">
            <Settings size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Only officers and masters can access settings</p>
          </div>
        ) : null}
      </div>

      {/* Leave button (not master) */}
      {isMember && myRole !== "MASTER" && activeTab !== "Settings" && (
        <div className="text-center">
          <button onClick={handleLeave} className="px-4 py-2 text-xs text-slate-500 hover:text-red-400 border border-white/5 rounded-lg hover:border-red-500/20 transition-colors">
            <LogOut size={12} className="inline mr-1" /> Leave Guild
          </button>
        </div>
      )}
    </div>
  );
}
