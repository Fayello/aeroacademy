"use client";

import { createContext, useContext, useEffect, useState, useRef, useMemo, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "@/lib/api";
import type { IntelligenceData, FeedItem, LeaderboardEntry, LabTelemetry, Achievement } from "@/types/api";

export interface UserMetrics {
  id: string;
  xp: number;
  level: number;
  streak: number;
  division: string;
  rank: number;
  clearance: string;
  latestProgress: {
    lessonId: string;
    lesson: {
      title: string;
      section: { title: string; course: { title: string } };
    };
  } | null;
  courseProgress: number;
  achievements: Achievement[];
}

interface DashboardSocketValue {
  intelligence: IntelligenceData | null;
  userMetrics: UserMetrics | null;
  feed: FeedItem[];
  lastAchievement: Achievement | null;
  leaderboard: LeaderboardEntry[];
  labTelemetry: LabTelemetry[];
  socket: Socket | null;
  isConnected: boolean;
}

const DashboardSocketContext = createContext<DashboardSocketValue>({
  intelligence: null,
  userMetrics: null,
  feed: [],
  lastAchievement: null,
  leaderboard: [],
  labTelemetry: [],
  socket: null,
  isConnected: false,
});

export function DashboardSocketProvider({ children }: { children: ReactNode }) {
  const [intelligence, setIntelligence] = useState<IntelligenceData | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [lastAchievement, setLastAchievement] = useState<Achievement | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [labTelemetry, setLabTelemetry] = useState<LabTelemetry[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const achievementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    // In production API_URL is "" (relative) — use current origin for socket so it hits nginx proxy
    const socketUrl = API_URL || (typeof window !== "undefined" ? window.location.origin : "");

    let s: Socket;
    function connectSocket(authToken?: string | null) {
      s = io(`${socketUrl}/dashboard`, {
        auth: authToken ? { token: authToken } : {},
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 10000,
      });

      s.on("connect", () => setIsConnected(true));
      s.on("disconnect", () => setIsConnected(false));
      s.on("connect_error", () => {
        setIsConnected(false);
      });
      s.on("intelligence_update", (data: IntelligenceData) => setIntelligence(data));
      s.on("user_metrics_update", (data: UserMetrics) => setUserMetrics(data));
      s.on("leaderboard_update", (data: LeaderboardEntry[]) => setLeaderboard(data));
      s.on("global_feed_update", (item: FeedItem) => setFeed((prev) => [item, ...prev].slice(0, 20)));
      s.on("achievement_unlocked", (achievement: Achievement) => {
        setLastAchievement(achievement);
        if (achievementTimeoutRef.current) clearTimeout(achievementTimeoutRef.current);
        achievementTimeoutRef.current = setTimeout(() => setLastAchievement(null), 8000);
      });
      s.on("lab_telemetry", (data: LabTelemetry[]) => setLabTelemetry(data));
      s.on("unauthorized", () => {
        s.close();
        window.dispatchEvent(new Event("token-refreshed"));
      });

      setSocket(s);
    }

    connectSocket(token);

    function onTokenRefreshed() {
      const newToken = localStorage.getItem("token");
      if (newToken && s) {
        s.close();
        connectSocket(newToken);
      }
    }
    window.addEventListener("token-refreshed", onTokenRefreshed);

    return () => {
      window.removeEventListener("token-refreshed", onTokenRefreshed);
      if (achievementTimeoutRef.current) clearTimeout(achievementTimeoutRef.current);
      if (s) s.close();
    };
  }, []);

  const value = useMemo(
    () => ({ intelligence, userMetrics, feed, lastAchievement, leaderboard, labTelemetry, socket, isConnected }),
    [intelligence, userMetrics, feed, lastAchievement, leaderboard, labTelemetry, socket, isConnected],
  );

  return (
    <DashboardSocketContext.Provider value={value}>
      {children}
    </DashboardSocketContext.Provider>
  );
}

export function useDashboardSocket() {
  return useContext(DashboardSocketContext);
}
