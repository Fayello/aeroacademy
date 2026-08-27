"use client";

import { useEffect, useState } from "react";
import { fetchApiV2 } from "@/lib/api";
import {
  Loader2,
  Calendar,
  Users,
  Target,
  Zap,
  Trophy,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import toast from "@/lib/toast";

interface GlobalEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  targetXp: number | null;
  targetCount: number | null;
  xpReward: number | null;
  metadata: Record<string, unknown> | null;
  startsAt: string;
  expiresAt: string;
  _count: { participants: number };
}

interface EventProgress {
  eventId: string;
  title: string;
  type: string;
  targetXp: number | null;
  targetCount: number | null;
  totalParticipants: number;
  totalProgress: number;
  completedCount: number;
}

interface UserProgress {
  joined: boolean;
  progress: number;
  completed: boolean;
  eligibleToClaim: boolean;
}

const TYPE_STYLES: Record<
  string,
  { bg: string; text: string; icon: typeof Zap }
> = {
  COMMUNITY_XP: { bg: "bg-blue-100", text: "text-blue-700", icon: Zap },
  TEAM_COMPETITION: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    icon: Users,
  },
  SPEEDRUN: { bg: "bg-orange-100", text: "text-orange-700", icon: Clock },
  COLLABORATIVE: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    icon: Target,
  },
};

function getEventStyles(type: string) {
  return (
    TYPE_STYLES[type] || {
      bg: "bg-slate-100",
      text: "text-slate-700",
      icon: Zap,
    }
  );
}

function getTimeRemaining(expiresAt: string): string {
  const now = new Date().getTime();
  const end = new Date(expiresAt).getTime();
  const diff = end - now;
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export default function EventsPage() {
  const [events, setEvents] = useState<GlobalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "my">("active");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const [progressMap, setProgressMap] = useState<
    Record<string, EventProgress>
  >({});
  const [userProgressMap, setUserProgressMap] = useState<
    Record<string, UserProgress>
  >({});
  const [joinLoading, setJoinLoading] = useState<string | null>(null);
  const [claimLoading, setClaimLoading] = useState<string | null>(null);
  const [progressLoading, setProgressLoading] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserId(parsed.id);
      }
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadEvents() {
      try {
        const data = await fetchApiV2<GlobalEvent[]>("/global-events/active");
        if (!cancelled) setEvents(data);
      } catch {
        toast.error("Failed to load events");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  const myEvents = events.filter((e) => userProgressMap[e.id]?.joined);

  const displayEvents = activeTab === "my" ? myEvents : events;

  useEffect(() => {
    if (events.length === 0) return;
    let cancelled = false;
    async function loadProgress() {
      const results = await Promise.allSettled(
        events.map(async (event) => {
          const [progress, userProg] = await Promise.allSettled([
            fetchApiV2<EventProgress>(
              `/global-events/${event.id}/progress`
            ),
            userId
              ? fetchApiV2<{ joined: boolean; progress: number; completed: boolean; eligibleToClaim: boolean }>(
                  `/global-events/${event.id}/progress?userId=${userId}`
                )
              : Promise.resolve(null),
          ]);
          return {
            eventId: event.id,
            progress:
              progress.status === "fulfilled" ? progress.value : null,
            userProgress:
              userProg.status === "fulfilled" ? userProg.value : null,
          };
        })
      );
      if (cancelled) return;
      const pMap: Record<string, EventProgress> = {};
      const uMap: Record<string, UserProgress> = {};
      for (const r of results) {
        if (r.status === "fulfilled") {
          if (r.value.progress) pMap[r.value.eventId] = r.value.progress;
          if (r.value.userProgress)
            uMap[r.value.eventId] = r.value.userProgress as UserProgress;
        }
      }
      setProgressMap(pMap);
      setUserProgressMap(uMap);
    }
    loadProgress();
    return () => {
      cancelled = true;
    };
  }, [events, userId]);

  async function handleJoin(eventId: string) {
    if (!userId) {
      toast.error("Please log in to join events");
      return;
    }
    setJoinLoading(eventId);
    try {
      await fetchApiV2(`/global-events/${eventId}/join`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      toast.success("Joined event!");
      setUserProgressMap((prev) => ({
        ...prev,
        [eventId]: {
          joined: true,
          progress: 0,
          completed: false,
          eligibleToClaim: false,
        },
      }));
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, _count: { participants: e._count.participants + 1 } }
            : e
        )
      );
    } catch {
      toast.error("Failed to join event");
    } finally {
      setJoinLoading(null);
    }
  }

  async function handleClaim(eventId: string) {
    if (!userId) return;
    setClaimLoading(eventId);
    try {
      await fetchApiV2(`/global-events/${eventId}/claim`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      toast.success("Reward claimed!");
      setUserProgressMap((prev) => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          eligibleToClaim: false,
          completed: true,
        },
      }));
    } catch {
      toast.error("Failed to claim reward");
    } finally {
      setClaimLoading(null);
    }
  }

  async function handleProgress(eventId: string) {
    if (!userId) return;
    setProgressLoading(eventId);
    try {
      await fetchApiV2(`/global-events/${eventId}/progress`, {
        method: "POST",
        body: JSON.stringify({ userId, progress: 1 }),
      });
      toast.success("Progress updated!");
      setUserProgressMap((prev) => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          progress: (prev[eventId]?.progress || 0) + 1,
        },
      }));
    } catch {
      toast.error("Failed to update progress");
    } finally {
      setProgressLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Global Events"
          description="Join community events and compete for rewards"
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Global Events"
        description="Join community events and compete for rewards"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "active"
              ? "bg-[#0F203A] text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Active Events
        </button>
        <button
          onClick={() => setActiveTab("my")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "my"
              ? "bg-[#0F203A] text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          My Events
        </button>
      </div>

      {displayEvents.length === 0 ? (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-teal-500" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">
            {activeTab === "my" ? "No events joined yet" : "No active events"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === "my"
              ? "Join an event to compete, collaborate, and earn rewards with other engineers."
              : "Community events bring themed challenges and competitions. New ones are added regularly."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayEvents.map((event) => {
            const style = getEventStyles(event.type);
            const Icon = style.icon;
            const progress = progressMap[event.id];
            const userProg = userProgressMap[event.id];
            const isExpanded = expandedEventId === event.id;
            const timeLeft = getTimeRemaining(event.expiresAt);
            const xpPercent =
              event.targetXp && progress
                ? Math.min((progress.totalProgress / event.targetXp) * 100, 100)
                : 0;

            return (
              <div
                key={event.id}
                className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() =>
                    setExpandedEventId(isExpanded ? null : event.id)
                  }
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
                      >
                        <Icon size={12} />
                        {event.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <ArrowRight
                      size={16}
                      className={`text-slate-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </div>

                  <h3 className="text-base font-semibold text-white mb-1">
                    {event.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                    {event.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {timeLeft}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {event._count.participants} joined
                    </span>
                    {event.xpReward && (
                      <span className="flex items-center gap-1 text-[#7AD62A] font-medium">
                        <Zap size={12} />
                        {event.xpReward} XP
                      </span>
                    )}
                  </div>

                  {event.targetXp && progress && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">
                          Community Progress
                        </span>
                        <span className="text-xs font-medium text-slate-700">
                          {progress.totalProgress.toLocaleString()} /{" "}
                          {event.targetXp.toLocaleString()} XP
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#7AD62A] to-[#7AD62A] rounded-full transition-all duration-500"
                          style={{ width: `${xpPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    {userProg?.eligibleToClaim ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaim(event.id);
                        }}
                        disabled={claimLoading === event.id}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7AD62A] hover:bg-[#1b8554] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {claimLoading === event.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trophy size={16} />
                        )}
                        Claim Reward
                      </button>
                    ) : userProg?.joined ? (
                      <div className="flex gap-2">
                        <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg">
                          <CheckCircle2 size={16} />
                          In Progress
                        </div>
                        {!userProg.completed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProgress(event.id);
                            }}
                            disabled={progressLoading === event.id}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {progressLoading === event.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              "+1"
                            )}
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoin(event.id);
                        }}
                        disabled={joinLoading === event.id}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F203A] hover:bg-[#0a1628] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {joinLoading === event.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ArrowRight size={16} />
                        )}
                        Join Event
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 bg-white/5 p-5 space-y-4 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">
                        About this event
                      </h4>
                      <p className="text-sm text-slate-600">
                        {event.description}
                      </p>
                    </div>

                    {event.targetXp && progress && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">
                          Community Progress
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-[#0f172a] rounded-lg border border-white/10 p-3 text-center">
                            <p className="text-lg font-bold text-white">
                              {progress.totalParticipants}
                            </p>
                            <p className="text-xs text-slate-500">
                              Participants
                            </p>
                          </div>
                          <div className="bg-[#0f172a] rounded-lg border border-white/10 p-3 text-center">
                            <p className="text-lg font-bold text-[#7AD62A]">
                              {progress.totalProgress.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500">
                              Total XP
                            </p>
                          </div>
                          <div className="bg-[#0f172a] rounded-lg border border-white/10 p-3 text-center">
                            <p className="text-lg font-bold text-[#7AD62A]">
                              {progress.completedCount}
                            </p>
                            <p className="text-xs text-slate-500">Completed</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {userProg && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">
                          Your Progress
                        </h4>
                        <div className="bg-[#0f172a] rounded-lg border border-white/10 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">
                              Progress
                            </span>
                            <span className="text-sm font-medium text-white">
                              {userProg.progress}{" "}
                              {event.targetCount
                                ? `/ ${event.targetCount}`
                                : ""}
                            </span>
                          </div>
                          {event.targetCount && (
                            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    (userProg.progress / event.targetCount) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {userProg.completed ? (
                              <span className="text-xs text-[#7AD62A] font-medium flex items-center gap-1">
                                <CheckCircle2 size={12} /> Completed
                              </span>
                            ) : userProg.joined ? (
                              <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                <Clock size={12} /> In Progress
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )}

                    {progress &&
                      progress.totalParticipants > 0 &&
                      event.targetXp && (
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-2">
                            Event Stats
                          </h4>
                          <div className="bg-[#0f172a] rounded-lg border border-white/10 overflow-hidden">
                            <div className="grid grid-cols-2 gap-3 p-3">
                              <div className="text-center">
                                <p className="text-lg font-bold text-white">{progress.totalParticipants}</p>
                                <p className="text-xs text-slate-500">Participants</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-[#7AD62A]">{progress.totalProgress.toLocaleString()}</p>
                                <p className="text-xs text-slate-500">Total XP</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
