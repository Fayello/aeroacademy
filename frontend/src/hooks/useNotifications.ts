import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL, fetchApi } from "@/lib/api";
import type { NotificationItem, NotificationResponse } from "@/types/api";

let globalSocket: Socket | null = null;
let globalListeners = 0;

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refresh = useCallback(
    async (opts?: { limit?: number; unreadOnly?: boolean }) => {
      const params = new URLSearchParams();
      params.set("limit", String(opts?.limit ?? 20));
      if (opts?.unreadOnly) params.set("unreadOnly", "true");
      try {
        const [data, unreadData] = await Promise.all([
          fetchApi(`/notifications?${params.toString()}`),
          fetchApi("/notifications/unread-count"),
        ]);
        const list = data as NotificationResponse | null;
        const unreadRes = unreadData as { count: number } | null;
        if (mountedRef.current) {
          setNotifications(list?.items || []);
          setTotal(list?.total || 0);
          setUnread(unreadRes?.count || 0);
          setLoading(false);
        }
      } catch {
        if (mountedRef.current) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    mountedRef.current = true;
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!globalSocket) {
      globalSocket = io(`${API_URL}/notifications`, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 10000,
      });
    }

    globalListeners++;
    const s = globalSocket;

    s.on("connect", () => setIsConnected(true));
    s.on("disconnect", () => setIsConnected(false));
    s.on("notification:new", (n: NotificationItem) => {
      setNotifications((prev) => [n, ...prev].slice(0, 200));
      setUnread((u) => u + 1);
    });

    const timer = setTimeout(() => void refresh(), 0);

    return () => {
      clearTimeout(timer);
      mountedRef.current = false;
      globalListeners--;
      if (globalListeners === 0 && globalSocket) {
        globalSocket.close();
        globalSocket = null;
      }
    };
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    try {
      await fetchApi(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await fetchApi("/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await fetchApi(`/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch {}
  }, []);

  return {
    notifications,
    total,
    unread,
    isConnected,
    loading,
    refresh,
    markRead,
    markAllRead,
    remove,
  };
}