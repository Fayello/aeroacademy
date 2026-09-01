"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Trash2, RefreshCw, ChevronRight } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationItem } from "@/types/api";
import { timeAgo } from "@/lib/format";
import { NotificationTypeIcon } from "@/components/NotificationTypeIcon";
import PageHeader from "@/components/ui/PageHeader";

const PAGE_SIZE = 20;

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Notifications"
        description={
          unread > 0
            ? `You have ${unread} unread notification${unread === 1 ? "" : "s"}`
            : "You are all caught up"
        }
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-[#0f172a] border border-white/10 rounded-lg p-1">
          <button
            onClick={() => {
              setFilter("all");
              void refresh({ limit: PAGE_SIZE, unreadOnly: false });
            }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-white/5"
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
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-white/5"
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={() => void markAllRead()}
            disabled={unread === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((id) => (
            <div key={id} className="angular-card bg-[#0f172a] p-4 flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-white/10 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-full bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="angular-card bg-[#0f172a] py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">
            {filter === "unread" ? "All caught up" : "No notifications yet"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filter === "unread"
              ? "You've read all your notifications. New activity will appear here."
              : "Achievements, flag captures, bookings and more will show up here as you progress."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((n) => (
            <div
              key={n.id}
              className={`group angular-card bg-[#0f172a] p-4 flex items-start gap-4 transition-colors ${
                !n.read ? "border-l-2 border-l-[#7AD62A] bg-[#7AD62A]/10/30" : ""
              }`}
            >
              <div className="mt-0.5 shrink-0 w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                <NotificationTypeIcon type={n.type} size={18} />
              </div>

              <button
                onClick={() => handleItemClick(n)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white truncate">
                    {n.title}
                  </p>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-slate-800 shrink-0" />
                  )}
                </div>
                <p className="text-sm text-slate-300 mt-0.5">{n.message}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                  {n.link && (
                    <span className="flex items-center gap-0.5 text-xs text-slate-300">
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
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
                <button
                  onClick={() => void remove(n.id)}
                  aria-label="Delete notification"
                  title="Delete"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-500/10 transition-colors"
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
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
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
