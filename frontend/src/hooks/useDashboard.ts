import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "@/lib/api";
import type { IntelligenceData, FeedItem, LeaderboardEntry, LabTelemetry, Achievement } from "@/types/api";

let globalSocket: Socket | null = null;
let globalListeners = 0;

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

export function useDashboard() {
  const [intelligence, setIntelligence] = useState<IntelligenceData | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [labTelemetry, setLabTelemetry] = useState<LabTelemetry[]>([]);
  const [lastAchievement, setLastAchievement] = useState<Achievement | null>(null);
  const [socket] = useState<Socket | null>(() => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("token");
    if (!token) return null;
    if (!globalSocket) {
      globalSocket = io(`${API_URL}/dashboard`, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 10000,
      });
    }
    return globalSocket;
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const achievementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!socket) return;

    globalListeners++;
    const s = socket;

    s.on("connect", () => { setIsConnected(true); setError(null); });
    s.on("disconnect", () => setIsConnected(false));
    s.on("connect_error", () => {
      setIsConnected(false);
      setError("Connection error. Retrying...");
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

    return () => {
      globalListeners--;
      if (achievementTimeoutRef.current) clearTimeout(achievementTimeoutRef.current);
      if (globalListeners === 0 && globalSocket) {
        globalSocket.close();
        globalSocket = null;
      }
    };
  }, [socket]);

  return { intelligence, userMetrics, feed, lastAchievement, leaderboard, labTelemetry, socket, isConnected, error };
}
