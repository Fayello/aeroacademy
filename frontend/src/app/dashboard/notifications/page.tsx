"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  Trophy,
  Flame,
  CalendarCheck,
  CalendarX,
  Video,
  Info,
  CheckCheck,
  Trash2,
  Loader2,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationItem } from "@/types/api";

const PAGE_SIZE = 20;

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "ACHIEVEMENT":
      return <Trophy size={18} className="text-amber-500" />;
    case "SUCCESS":
      return <Flame size={18} className="text-emerald-600" />;
    case "BOOKING":
      return <CalendarCheck size={18} className="text-blue-600" />;
    case "WARNING":
      return <CalendarX size={18} className="text-red-500" />;
    case "MASTERCLASS":
      return <Video size={18} className="text-violet-500" />;
    default:
      return <Info size={18} className="text-slate-400" />;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const {
    notifications,
    total,
    unread,
    loading,
    refresh,
    markRead,
    markAllRead,
    remove,
  } = useNotifications();

  const visible =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const hasMore = visible.length < total;

  const loadMore = () => {
    const nextLimit = Math.min(visible.length + PAGE_SIZE, 200);
    void refresh({ limit: nextLimit, unreadOnly: filter === "unread" });
  };

  const handleItemClick = (n: NotificationItem) => {
    if (!n.read) void markRead(n.id);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8 text-slate-900 border border-slate-200">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <BellRing size={24} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
              <p className="text-sm text-slate-500">
                {unread > 0
                  ? `You have ${unread} unread notification${unread === 1 ? "" : "s"}`
                  : "You are all caught up"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          <button
            onClick={() => {
              setFilter("all");
              void refresh({ limit: PAGE_SIZE, unreadOnly: false });
            }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              setFilter("unread");
              void refresh({ limit: PAGE_SIZE, unreadOnly: true });
            }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === "unread"
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Unread {unread > 0 && `(${unread})`}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              void refresh({ limit: Math.max(visible.length, PAGE_SIZE), unreadOnly: filter === "unread" })
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={() => void markAllRead()}
            disabled={unread === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-emerald-600" />
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-16 text-center">
          <Bell size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-base font-medium text-slate-700">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Achievements, flag captures, bookings and more will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((n) => (
            <div
              key={n.id}
              className={`group bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-4 transition-colors ${
                !n.read ? "border-emerald-200 bg-emerald-50/30" : ""
              }`}
            >
              <div className="mt-0.5 shrink-0 w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
                <TypeIcon type={n.type} />
              </div>

              <button
                onClick={() => handleItemClick(n)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {n.title}
                  </p>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                  {n.link && (
                    <span className="flex items-center gap-0.5 text-xs text-emerald-600">
                      View <ChevronRight size={12} />
                    </span>
                  )}
                </div>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                {!n.read && (
                  <button
                    onClick={() => void markRead(n.id)}
                    aria-label="Mark as read"
                    title="Mark as read"
                    className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
                <button
                  onClick={() => void remove(n.id)}
                  aria-label="Delete notification"
                  title="Delete"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={loadMore}
                className="px-4 py-2 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}