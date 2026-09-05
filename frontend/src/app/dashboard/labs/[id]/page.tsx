"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { fetchApi, API_URL } from "@/lib/api";
import { getDifficultyStyle } from "@/lib/labs";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { io, Socket } from "socket.io-client";
import { useDashboard } from "@/hooks/useDashboard";
import { Loader2, Play, Square, RefreshCcw, Shield, Terminal as TerminalIcon, ExternalLink, ChevronLeft, Clock, Lock, Copy, PlugZap, Eraser, Wifi, WifiOff, Zap, Maximize2, Minimize2, ZoomIn, ZoomOut, ClipboardPaste, MessageSquare, Star, Users, Home, ChevronRight, Monitor, SplitSquareHorizontal, CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import LabAvatar from "@/components/ui/LabAvatar";
import toast from "@/lib/toast";
import { showXpGain } from "@/components/gamification/XpGain";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import Modal from "@/components/Modal";
import { getLevel, getLabLock } from "@/lib/levelGating";
import type { LabTelemetry } from "@/types/api";

interface ReviewUser {
  id: string;
  name: string | null;
  email: string;
  division: string;
}

interface LabReview {
  id: string;
  userId: string;
  labId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: ReviewUser;
}

interface ReviewStats {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

interface ReviewsData {
  reviews: LabReview[];
  stats: ReviewStats;
}

interface LabCredential {
  service: string;
  username: string;
  password?: string;
}

interface LabFlag {
  id: string;
  title: string;
  points: number;
  description: string;
  submissions?: unknown[];
}

interface LabDefinition {
  id: string;
  title: string;
  description: string;
  briefing?: string | null;
  basePath?: string;
  difficulty: number;
  dockerImage?: string;
  isLocked?: boolean;
  tasks?: string[];
  credentials?: LabCredential[];
  flags?: LabFlag[];
  videoUrl?: string | null;
  imageUrl?: string | null;
}

interface LabInstance {
  id?: string;
  status: string;
  port?: number | null;
  expiresAt?: string | null;
  containerId?: string | null;
  serverId?: string | null;
  labId?: string;
  lab?: { id: string; title: string; description: string; difficulty: number };
}

function formatTimeRemaining(expiresAt: string, now: Date = new Date()): string {
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  if (diff <= 0) return "Expired";
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  if (totalHours > 0) return `${totalHours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

const QUICK_COMMANDS = ["whoami", "pwd", "ls -la", "id", "cat /etc/hostname"];
const MAX_RECONNECT_ATTEMPTS = 4;
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 24;

function getDifficultyInfo(difficulty: number) {
  const s = getDifficultyStyle(difficulty);
  return { label: s.label, color: s.color, bar: s.bar, dot: s.dot };
}

function getEstimatedTime(flags: number) {
  if (flags <= 2) return "30-60m";
  if (flags <= 4) return "1-2h";
  if (flags <= 6) return "2-4h";
  return "4h+";
}

const WEB_LAB_IMAGES = ["juice-shop", "webgoat", "nodegoat", "vapi", "dvwa", "hackazon", "web-dvwa", "railsgoat", "juice"];
function isWebLab(dockerImage?: string): boolean {
  if (!dockerImage) return false;
  const lower = dockerImage.toLowerCase();
  return WEB_LAB_IMAGES.some((keyword) => lower.includes(keyword));
}

interface WalkthroughStep {
  id: number;
  title: string;
  hint: string;
  completed: boolean;
}

function getWalkthroughSteps(lab: LabDefinition | null): WalkthroughStep[] {
  if (!lab) return [];
  const steps: WalkthroughStep[] = [];
  if (lab.tasks && Array.isArray(lab.tasks)) {
    lab.tasks.forEach((task: string, i: number) => {
      steps.push({ id: i, title: task, hint: "", completed: false });
    });
  }
  if (steps.length === 0 && lab.flags && Array.isArray(lab.flags)) {
    lab.flags.forEach((flag: LabFlag, i: number) => {
      steps.push({ id: i, title: flag.title, hint: flag.description, completed: (flag.submissions?.length ?? 0) > 0 });
    });
  }
  return steps;
}

function buildLabAccessUrl(instance: LabInstance | null, basePath?: string) {
  if (!instance?.port) return null;

  try {
    const api = new URL(API_URL);
    return `${api.protocol}//${api.hostname}:${instance.port}${basePath || ""}`;
  } catch {
    if (typeof window === "undefined") return null;
    return `${window.location.protocol}//${window.location.hostname}:${instance.port}${basePath || ""}`;
  }
}

export default function LabWorkspace() {
  const { id } = useParams();
  const { labTelemetry } = useDashboard();
  const [lab, setLab] = useState<LabDefinition | null>(null);
  const [instance, setInstance] = useState<LabInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "warning" | "danger" | "success";
    onConfirm?: () => void;
    confirmText?: string;
  }>({ isOpen: false, title: "", message: "", type: "info" });
  const [level, setLevel] = useState(1);
  const [now, setNow] = useState<Date>(new Date());
  const expiredHandledRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [selection, setSelection] = useState("");
  const [autoReconnecting, setAutoReconnecting] = useState(false);
  const [reconnectTick, setReconnectTick] = useState(0);

  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasConnectedRef = useRef(false);
  const sessionEndedRef = useRef(false);
  const [hasConnected, setHasConnected] = useState(false);
  const [viewMode, setViewMode] = useState<"info" | "workspace">("info");
  const [activeLabTab, setActiveLabTab] = useState<"play" | "info" | "reviews">("play");
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [workspaceView, setWorkspaceView] = useState<"terminal" | "web" | "split">("terminal");
  const [walkthroughSteps, setWalkthroughSteps] = useState<WalkthroughStep[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isMobile = useIsMobile();
  const [mobileCommand, setMobileCommand] = useState("");

  // Load lab reviews
  useEffect(() => {
    if (activeLabTab !== "reviews" || !id) return;
    let cancelled = false;
    fetchApi(`/labs/${id}/reviews`)
      .then((data) => { if (!cancelled) setReviewsData(data as ReviewsData); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activeLabTab, id]);

  // Load existing user review
  useEffect(() => {
    if (!reviewsData || !id) return;
    const timeoutId = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const user = JSON.parse(stored) as { id?: string };
          const existing = reviewsData.reviews.find((r) => r.userId === user.id);
          if (existing) {
            setMyRating(existing.rating);
            setMyComment(existing.comment || "");
          }
        }
      } catch {}
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [reviewsData, id]);

  const handleSubmitReview = useCallback(async () => {
    if (myRating < 1) return;
    setSubmittingReview(true);
    try {
      await fetchApi(`/labs/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: myRating, comment: myComment || undefined }),
      });
      toast.success("Review submitted!");
      const data = await fetchApi(`/labs/${id}/reviews`);
      setReviewsData(data as ReviewsData);
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  }, [id, myRating, myComment]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const toggleWalkthroughStep = useCallback((stepId: number) => {
    setWalkthroughSteps((prev) => {
      const next = prev.map((s) => s.id === stepId ? { ...s, completed: !s.completed } : s);
      try {
        const completedIds = next.filter((s) => s.completed).map((s) => s.id);
        localStorage.setItem(`walkthrough:${String(id)}`, JSON.stringify(completedIds));
        fetchApi(`/labs/${String(id)}/checkpoint`, {
          method: "POST",
          body: JSON.stringify({ walkthroughState: completedIds }),
        }).catch(() => {});
      } catch {}
      return next;
    });
  }, [id]);

  const handleReconnect = useCallback(() => {
    clearReconnectTimer();
    if (xtermRef.current) {
      xtermRef.current.dispose();
      xtermRef.current = null;
    }
    if (socketRef.current) socketRef.current.disconnect();
    sessionEndedRef.current = false;
    setReconnectTick((t) => t + 1);
    toast.success("Reconnecting terminal...");
  }, [clearReconnectTimer]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setAutoReconnecting(false);
      return;
    }
    reconnectAttemptsRef.current += 1;
    setAutoReconnecting(true);
    const delay = 1500 * reconnectAttemptsRef.current;
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      handleReconnect();
    }, delay);
  }, [handleReconnect]);

  const handleManualReconnect = () => {
    reconnectAttemptsRef.current = 0;
    setAutoReconnecting(false);
    handleReconnect();
  };

  const handleLaunchAndView = async () => {
    setViewMode("workspace");
    await handleLaunch();
  };

  const updateFontSize = (next: number) => {
    if (next < MIN_FONT_SIZE || next > MAX_FONT_SIZE) return;
    setFontSize(next);
    localStorage.setItem("xterm:fontSize", String(next));
    if (xtermRef.current) {
      xtermRef.current.options.fontSize = next;
      fitAddonRef.current?.fit();
      const dims = { cols: xtermRef.current.cols, rows: xtermRef.current.rows };
      socketRef.current?.emit("resize", dims);
    }
  };

  const handleCopy = async () => {
    const text = xtermRef.current?.getSelection();
    if (!text) {
      toast.error("No selection to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Selection copied to clipboard.");
    } catch {
      toast.error("Failed to copy selection.");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      if (socketRef.current?.connected) {
        socketRef.current.emit("input", text);
        toast.success("Clipboard pasted to terminal.");
      } else {
        toast.error("Terminal is not connected.");
      }
    } catch {
      toast.error("Unable to read clipboard.");
    }
  };

  const telemetry =
    (labTelemetry || []).find(
      (t: LabTelemetry) =>
        (instance?.containerId && t.containerId === instance.containerId) ||
        t.labId === id,
    ) || null;
  const accessUrl = buildLabAccessUrl(instance, lab?.basePath);

  const isExpired = !!instance?.expiresAt && new Date(instance.expiresAt).getTime() <= now.getTime();
  const isRunning = instance?.status === "RUNNING" && !isExpired;
  const isProvisioning = instance?.status === "PROVISIONING" || provisioning;
  const isStopped = instance?.status === "STOPPED";
  const minutesRemaining = instance?.expiresAt
    ? Math.floor((new Date(instance.expiresAt).getTime() - now.getTime()) / 60000)
    : Infinity;
  const countdownTone =
    isExpired || minutesRemaining < 10
      ? "bg-red-500/10 text-red-600"
      : minutesRemaining < 30
        ? "bg-amber-500/10 text-amber-600"
        : "bg-[#7AD62A]/10 text-[#7AD62A]";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const saved = parseInt(window.localStorage.getItem("xterm:fontSize") || "", 10);
        if (saved >= MIN_FONT_SIZE && saved <= MAX_FONT_SIZE) setFontSize(saved);
      } catch {}
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (instance?.status !== "RUNNING" || !instance?.expiresAt) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [instance?.status, instance?.expiresAt]);

  useEffect(() => {
    expiredHandledRef.current = false;
  }, [instance?.id, instance?.status]);

  useEffect(() => {
    if (isExpired && instance?.status === "RUNNING" && !expiredHandledRef.current) {
      expiredHandledRef.current = true;
      toast.error("Your lab instance has expired. Start a new instance to continue.");
      setHasConnected(false);
      hasConnectedRef.current = false;
      sessionEndedRef.current = false;
      clearReconnectTimer();
      if (socketRef.current) socketRef.current.disconnect();
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
    }
  }, [isExpired, instance?.status, clearReconnectTimer]);

  useEffect(() => {
    let cancelled = false;
    const levelTimer = setTimeout(() => {
      try {
        const xp = parseInt(localStorage.getItem("xp") || "0", 10);
        setLevel(getLevel(xp));
      } catch {}
    }, 0);

    async function loadLab() {
      try {
        const labData = await fetchApi(`/labs/definition/${id}`);
        if (!cancelled) {
          setLab(labData);
          if (isMobile && isWebLab(labData.dockerImage || undefined)) {
            setWorkspaceView("web");
          }
        }
        const status = await fetchApi(`/labs/status/${id}`);
        if (!cancelled) setInstance(status);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadLab();

    const pollInterval = setInterval(async () => {
      try {
        const status = await fetchApi(`/labs/status/${id}`);
        if (!cancelled) {
          setInstance(status);
          if (status && (status.status === "STOPPED" || (status.expiresAt && new Date(status.expiresAt).getTime() <= Date.now()))) {
            clearInterval(pollInterval);
          }
        }
      } catch {
        if (!cancelled) setInstance(null);
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearTimeout(levelTimer);
      clearInterval(pollInterval);
    };
  }, [id]);

  // Load walkthrough state from server checkpoint
  useEffect(() => {
    if (!lab) return;
    const currentLab = lab;
    const steps = getWalkthroughSteps(currentLab);
    async function loadCheckpoint() {
      try {
        const checkpoint = await fetchApi<{ walkthroughState: number[] } | null>(`/labs/${String(id)}/checkpoint`);
        if (checkpoint?.walkthroughState) {
          const completed = checkpoint.walkthroughState as number[];
          steps.forEach((s) => { s.completed = completed.includes(s.id); });
        } else {
          try {
            const saved = JSON.parse(localStorage.getItem(`walkthrough:${String(id)}`) || "[]") as number[];
            steps.forEach((s) => { s.completed = saved.includes(s.id); });
          } catch {}
        }
      } catch {
        try {
          const saved = JSON.parse(localStorage.getItem(`walkthrough:${String(id)}`) || "[]") as number[];
          steps.forEach((s) => { s.completed = saved.includes(s.id); });
        } catch {}
      }
      setWalkthroughSteps(steps);
      if (isWebLab(currentLab.dockerImage || undefined)) {
        setWorkspaceView("web");
      }
    }
    loadCheckpoint();
  }, [lab, id]);

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (xtermRef.current) xtermRef.current.dispose();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, []);

  const initTerminal = useCallback(() => {
    if (!terminalRef.current) return;

    let savedFontSize = isMobile ? 18 : 14;
    try {
      const parsed = parseInt(localStorage.getItem("xterm:fontSize") || "", 10);
      if (parsed >= MIN_FONT_SIZE && parsed <= MAX_FONT_SIZE) savedFontSize = parsed;
    } catch {}

    const term = new XTerm({
      theme: {
        background: "#0f172a",
        foreground: "#94a3b8",
        cursor: "#7AD62A",
        cursorAccent: "#0f172a",
        selectionBackground: "rgba(122, 214, 42, 0.3)",
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: savedFontSize,
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    fitAddonRef.current = fitAddon;
    xtermRef.current = term;

    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

    const token = localStorage.getItem("token");
    const socket = io(`${API_URL}/terminal`, { auth: { token }, withCredentials: true });

    socket.on("connect", () => {
      if (socketRef.current !== socket) return;
      setConnected(true);
      setHasConnected(true);
      hasConnectedRef.current = true;
      sessionEndedRef.current = false;
      reconnectAttemptsRef.current = 0;
      setAutoReconnecting(false);
      socket.emit("join", { labId: id });
    });
    socket.on("output", (data: string) => {
      if (socketRef.current !== socket) return;
      term.write(data);
    });
    socket.on("ready", () => {
      if (socketRef.current !== socket) return;
      term.focus();
    });
    socket.on("disconnect", () => {
      if (socketRef.current !== socket) return;
      setConnected(false);
      if (hasConnectedRef.current && xtermRef.current && !sessionEndedRef.current) {
        scheduleReconnect();
      }
    });
    socket.on("exit", () => {
      if (socketRef.current !== socket) return;
      toast.error("Terminal session ended.");
      setConnected(false);
      sessionEndedRef.current = true;
      clearReconnectTimer();
    });
    socket.on("error", (msg: string) => {
      if (socketRef.current !== socket) return;
      toast.error(msg || "Terminal error occurred.");
    });
    term.onData((data: string) => socket.emit("input", data));
    term.onSelectionChange(() => {
      if (xtermRef.current === term) setSelection(term.getSelection());
    });

    // Send resize events when terminal is resized (debounced)
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
          const dims = { cols: term.cols, rows: term.rows };
          socket.emit("resize", dims);
        }
      }, 150);
    });
    if (terminalRef.current) resizeObserver.observe(terminalRef.current);

    socketRef.current = socket;

    const origDispose = term.dispose.bind(term);
    term.dispose = () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      origDispose();
    };
  }, [id, clearReconnectTimer, scheduleReconnect]);

  const sendCommand = (cmd: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("input", `${cmd}\r`);
      xtermRef.current?.focus();
    }
  };

  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.focus();
    }
  };

  useEffect(() => {
    if (isRunning && terminalRef.current && !xtermRef.current) {
      initTerminal();
    }
  }, [instance, isRunning, initTerminal, reconnectTick]);

  const handleLaunch = async () => {
    setProvisioning(true);
    try {
      const newInstance = await fetchApi(`/labs/start/${id}`, { method: "POST" });
      setInstance(newInstance);
      toast.success("Lab started successfully.");
    } catch {
      toast.error("Failed to start lab.");
    } finally {
      setProvisioning(false);
    }
  };

  const handleTerminate = () => {
    setModalConfig({
      isOpen: true,
      title: "Terminate lab",
      message: "This will destroy the container and all unsaved data. Are you sure?",
      type: "danger",
      confirmText: "Terminate",
      onConfirm: async () => {
        try {
          await fetchApi(`/labs/stop/${id}`, { method: "POST" });
          toast.success("Lab terminated.");
        } catch {
          // soft-fail
        } finally {
          setInstance(null);
          setHasConnected(false);
          hasConnectedRef.current = false;
          sessionEndedRef.current = false;
          clearReconnectTimer();
          if (socketRef.current) socketRef.current.disconnect();
          if (xtermRef.current) { xtermRef.current.dispose(); xtermRef.current = null; }
        }
      },
    });
  };

  const handleReset = () => {
    setModalConfig({
      isOpen: true,
      title: "Reset lab",
      message: "This will destroy the current container and provision a fresh instance.",
      type: "warning",
      confirmText: "Reset",
      onConfirm: async () => {
        setProvisioning(true);
        try {
          setHasConnected(false);
          hasConnectedRef.current = false;
          sessionEndedRef.current = false;
          clearReconnectTimer();
          if (socketRef.current) socketRef.current.disconnect();
          if (xtermRef.current) { xtermRef.current.dispose(); xtermRef.current = null; }
          const newInstance = await fetchApi(`/labs/reset/${id}`, { method: "POST" });
          setInstance(newInstance);
          toast.success("Lab reset.");
        } catch {
          toast.error("Failed to reset lab.");
        } finally {
          setProvisioning(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-slate-400" size={32} />
        <p className="text-sm text-slate-400">Loading lab...</p>
      </div>
    );
  }

  if (lab) {
    const gate = getLabLock(lab.difficulty || 1200, level);
    if (gate.locked) {
      const xpNeeded = gate.requiredLevel * 1000 - level * 1000;
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in duration-500">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Lock size={28} className="text-amber-400" />
          </div>
          <div className="text-center max-w-sm">
            <h2 className="text-lg font-semibold text-white">Lab Locked</h2>
            <p className="text-sm text-slate-400 mt-1">{gate.reason}</p>
            <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Your level</span>
                <span className="font-semibold text-white">Level {level}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Required</span>
                <span className="font-semibold text-[#7AD62A]">Level {gate.requiredLevel}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7AD62A] to-[#7AD62A] rounded-full transition-all"
                  style={{ width: `${Math.min(((level - 1) / (gate.requiredLevel - 1)) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Earn <span className="font-semibold text-[#7AD62A]">{xpNeeded} more XP</span> to unlock
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Link href="/dashboard/labs" className="btn-primary text-sm">
                Browse Labs
              </Link>
              <Link href="/dashboard/courses" className="text-sm text-slate-400 hover:text-slate-200 font-medium">
                Take a Course
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  const diff = lab ? getDifficultyInfo(lab.difficulty || 1200) : null;
  const flags = lab?.flags?.length || 0;
  const solvedFlags = lab?.flags?.filter((f: LabFlag) => f.submissions && f.submissions.length > 0).length || 0;
  const isLocked = lab?.isLocked ?? false;

  if (viewMode === "info" && lab && !isRunning) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-400">
          <Link href="/dashboard" className="hover:text-[#7AD62A] transition-colors">
            <Home size={14} />
          </Link>
          <ChevronRight size={12} className="text-slate-300" />
          <Link href="/dashboard/labs" className="hover:text-[#7AD62A] transition-colors">Labs</Link>
          <ChevronRight size={12} className="text-slate-300" />
          <span className="text-white font-medium truncate max-w-[200px]">{lab.title}</span>
        </nav>

        {/* Hero section */}
        <div className="angular-card bg-[#0f172a] overflow-hidden">
          <div className={`h-1.5 w-full ${diff?.bar || "bg-slate-300"}`} />
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  {diff && (
                    <span className={`text-[11px] font-mono tracking-wider ${diff.color}`}>{diff.label}</span>
                  )}
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400">{flags} objectives</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400">{getEstimatedTime(flags)}</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                  <LabAvatar title={lab.title} id={lab.id} size={44} />
                  {lab.title}
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">{lab.description}</p>
              </div>
              <div className="flex flex-row sm:flex-row items-center gap-3 sm:justify-end">
                <div className="text-left sm:text-right">
                  <div className="flex items-center gap-1.5 justify-start sm:justify-end">
                    <Users size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-400">{solvedFlags}/{flags} solved</span>
                  </div>
                </div>
                <button
                  onClick={handleLaunchAndView}
                  disabled={provisioning || isLocked}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7AD62A] hover:bg-[#1d8a56] text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {provisioning ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                  Start Lab
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-white/10 overflow-x-auto">
          {[
            { key: "play" as const, label: "Play Lab" },
            { key: "info" as const, label: "Lab Info" },
            { key: "reviews" as const, label: "Reviews" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveLabTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeLabTab === tab.key
                  ? "border-[#7AD62A] text-[#7AD62A]"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeLabTab === "play" && (
          <div className="angular-card bg-[#0f172a] p-8 text-center hover-lift">
            <div className="w-16 h-16 rounded-2xl bg-[#7AD62A]/10 flex items-center justify-center mx-auto mb-4">
              <TerminalIcon size={28} className="text-[#7AD62A]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Ready to start?</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Launch this lab to get a live interactive terminal environment. You&apos;ll have access to all tools and can work through the objectives at your own pace.
            </p>
            <button
              onClick={handleLaunchAndView}
              disabled={provisioning || isLocked}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#7AD62A] hover:bg-[#1d8a56] text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {provisioning ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
              Start Machine
            </button>
          </div>
        )}

        {activeLabTab === "info" && (
          <div className="angular-card bg-[#0f172a] p-6 space-y-6">
            {lab.briefing && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Scenario</h3>
                <div className="text-sm text-slate-300 leading-relaxed prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{lab.briefing}</ReactMarkdown>
                </div>
              </div>
            )}
            {lab.tasks && lab.tasks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Objectives</h3>
                <div className="space-y-2">
                  {lab.tasks.map((task: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                      <span className="w-6 h-6 rounded-full bg-[#7AD62A]/10 flex items-center justify-center text-xs font-bold text-[#7AD62A] shrink-0">{i + 1}</span>
                      <p className="text-sm text-slate-300">{task}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {lab.flags && lab.flags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Flags</h3>
                <div className="space-y-3">
                  {lab.flags.map((flag: LabFlag) => (
                    <div key={flag.id} className="p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">{flag.title}</span>
                        <span className="text-sm font-bold text-[#7AD62A]">+{flag.points} pts</span>
                      </div>
                      <p className="text-xs text-slate-400">{flag.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {lab.credentials && lab.credentials.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Credentials</h3>
                <div className="grid gap-2">
                  {lab.credentials.map((cred: LabCredential, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-3 rounded-lg bg-white/5 border border-white/10 text-xs">
                      <span className="font-medium text-slate-300">{cred.service}</span>
                      <span className="text-slate-400 hidden sm:inline">·</span>
                      <span className="font-mono text-[#7AD62A]">{cred.username}</span>
                      {cred.password && (
                        <>
                          <span className="text-slate-400 hidden sm:inline">·</span>
                          <span className="font-mono text-[#7AD62A]">{cred.password}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeLabTab === "reviews" && (
          <div className="space-y-6">
            {/* Rating summary */}
            <div className="angular-card bg-[#0f172a] p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-white">{reviewsData?.stats.average ? reviewsData.stats.average.toFixed(1) : "—"}</p>
                  <div className="flex items-center gap-0.5 my-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} className={s <= Math.round(reviewsData?.stats.average || 0) ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">{reviewsData?.stats.total || 0} ratings</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewsData?.stats.distribution[star] || 0;
                    const total = reviewsData?.stats.total || 1;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-3">{star}</span>
                        <Star size={10} className="text-amber-400 fill-amber-400" />
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(count / total) * 100}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Write a review */}
            <div className="angular-card bg-[#0f172a] p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-white mb-3">Write a Review</h3>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setMyRating(s)}
                    className="p-0.5"
                  >
                    <Star
                      size={20}
                      className={`transition-colors ${
                        s <= (hoverRating || myRating) ? "text-amber-400 fill-amber-400" : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
                {myRating > 0 && <span className="text-sm text-slate-400 ml-2">{myRating}/5</span>}
              </div>
              <textarea
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                placeholder="Share your experience with this lab (optional)..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0f172a] text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] resize-none transition-all"
              />
              <button
                onClick={handleSubmitReview}
                disabled={myRating < 1 || submittingReview}
                className="mt-3 px-4 py-2 rounded-lg bg-[#7AD62A] hover:bg-[#1d8a56] text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>

            {/* Reviews list */}
            <div className="angular-card bg-[#0f172a] p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Reviews</h3>
              {!reviewsData || reviewsData.reviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm text-slate-400">No reviews yet. Be the first to review this lab!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewsData.reviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0F203A] to-[#1a3a5c] flex items-center justify-center text-white text-[9px] font-bold">
                            {review.user.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{review.user.name || "Anonymous"}</p>
                            <p className="text-[10px] text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={12} className={s <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-300">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-[#0f172a]" : "min-h-[calc(100vh-4rem)] -mx-4 md:-m-8"} flex flex-col animate-in fade-in duration-500`}>
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0f172a] px-4 py-3 shrink-0">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => setViewMode("info")} className="text-slate-400 hover:text-slate-300 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white truncate">{lab?.title || "Lab"}</h1>
            <p className="text-xs text-slate-400">Interactive Environment</p>
          </div>
        </div>

        <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 overflow-x-auto">
          <Link
            href={`/dashboard/labs/${id}/discussions`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-white/5 text-xs font-medium transition-colors border border-white/10"
          >
            <MessageSquare size={14} />
            <span className="hidden sm:inline">Discussions</span>
          </Link>
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-white/5 text-xs font-medium transition-colors"
            >
              <Minimize2 size={14} />
              Exit Fullscreen
            </button>
          )}
          {isRunning && instance?.expiresAt && (
            <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${countdownTone} font-medium`}>
              <Clock size={12} />
              {formatTimeRemaining(instance.expiresAt, now)}
            </span>
          )}
          {isRunning ? (
            <>
              <span className="flex items-center gap-1.5 text-xs text-[#7AD62A]">
                {connected ? (
                  <Wifi size={12} className="text-[#7AD62A]" />
                ) : (
                  <WifiOff size={12} className="text-amber-500" />
                )}
                <span className={`w-2 h-2 rounded-full ${connected ? "bg-[#7AD62A]" : "bg-amber-500"}`} />
                {connected ? "Connected" : "Connecting..."}
              </span>
              <a
                href={accessUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors ${
                  accessUrl ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-600 cursor-not-allowed opacity-60"
                }`}
              >
                <ExternalLink size={12} />
                <span className="hidden sm:inline">Open UI</span>
              </a>
              <button onClick={handleReset} disabled={provisioning} className="btn-ghost text-xs">
                <RefreshCcw size={14} className={provisioning ? "animate-spin" : ""} />
                Reset
              </button>
              <button onClick={handleTerminate} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-500/10 text-xs font-medium transition-colors">
                <Square size={12} />
                Stop
              </button>
            </>
          ) : isProvisioning ? (
            <span className="flex items-center gap-2 text-xs text-amber-400">
              <Loader2 className="animate-spin" size={14} />
              Provisioning...
            </span>
          ) : (
            <button onClick={handleLaunch} disabled={provisioning} className="btn-primary text-xs">
              {provisioning ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
              Start Lab
            </button>
          )}
        </div>
        </div>
      </header>

      {/* Telemetry bar */}
      {!isFullscreen && isRunning && telemetry && (
        <div className="border-b border-white/10 bg-[#0f172a] px-4 py-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="font-medium w-8 shrink-0">CPU</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${telemetry.cpu > 80 ? "bg-red-500" : telemetry.cpu > 50 ? "bg-amber-500" : "bg-[#7AD62A]"}`} style={{ width: `${telemetry.cpu}%` }} />
              </div>
              <span className="font-mono w-8 text-right">{telemetry.cpu}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium w-8 shrink-0">RAM</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${telemetry.memory}%` }} />
              </div>
              <span className="font-mono w-8 text-right">{telemetry.memory}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex min-h-0 flex-col p-3 sm:p-4 gap-4 lg:flex-row">
        {/* Briefing panel */}
        {!isFullscreen && (
        <div className="angular-card bg-[#0f172a] shadow-sm overflow-y-auto w-full lg:w-80 lg:shrink-0">
          <div className="p-5 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Briefing</h2>
          </div>

          {isRunning && (
            <div className="p-4 border-b border-white/10 bg-[#7AD62A]/5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap size={12} className="text-[#7AD62A]" />
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Quick Start</h4>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Click a command to send it straight to the terminal:
              </p>
              <div className="space-y-1.5">
                {QUICK_COMMANDS.map((cmd) => (
                  <div key={cmd} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#0f172a] border border-white/10">
                    <button
                      onClick={() => sendCommand(cmd)}
                      className="text-[11px] font-mono text-slate-300 hover:text-white transition-colors text-left truncate"
                    >
                      {cmd}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(cmd);
                        toast.success("Command copied!");
                      }}
                      title="Copy command"
                      className="text-slate-400 hover:text-[#7AD62A] transition-colors shrink-0"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-5 prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{lab?.briefing || lab?.description}</ReactMarkdown>

            {lab?.tasks && Array.isArray(lab.tasks) && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">Tasks</h4>
                <ul className="space-y-1.5 list-none p-0">
                  {lab.tasks.map((task: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300 p-2 rounded-lg bg-white/5">
                      <span className="text-[#7AD62A] mt-1">•</span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Walkthrough Steps */}
            {walkthroughSteps.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Walkthrough</h4>
                  <button
                    onClick={() => setShowHints((v) => !v)}
                    className="text-[10px] text-slate-400 hover:text-[#7AD62A] transition-colors"
                  >
                    {showHints ? "Hide hints" : "Show hints"}
                  </button>
                </div>
                <div className="space-y-1.5">
                  {walkthroughSteps.map((step) => (
                    <div key={step.id} className={`p-2.5 rounded-lg border transition-colors ${
                      step.completed
                        ? "bg-[#7AD62A]/5 border-[#7AD62A]/20"
                        : "bg-white/5 border-white/10"
                    }`}>
                      <button
                        onClick={() => toggleWalkthroughStep(step.id)}
                        className="flex items-start gap-2 w-full text-left"
                      >
                        {step.completed ? (
                          <CheckCircle2 size={14} className="text-[#7AD62A] mt-0.5 shrink-0" />
                        ) : (
                          <Circle size={14} className="text-slate-500 mt-0.5 shrink-0" />
                        )}
                        <span className={`text-xs font-medium ${step.completed ? "text-[#7AD62A]" : "text-slate-300"}`}>
                          {step.title}
                        </span>
                      </button>
                      {showHints && step.hint && (
                        <p className="text-[11px] text-slate-400 mt-1.5 ml-5">{step.hint}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[10px] text-slate-500">
                  {walkthroughSteps.filter((s) => s.completed).length} / {walkthroughSteps.length} steps completed
                </div>
              </div>
            )}

            {lab?.credentials && Array.isArray(lab.credentials) && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Credentials</h4>
                  <button
                    onClick={() => {
                      const text = lab.credentials
                        ?.map((c: LabCredential) =>
                          `${c.service}:\nUser: ${c.username}${c.password ? `\nPass: ${c.password}` : ""}`,
                        )
                        .join("\n\n") ?? "";
                      navigator.clipboard.writeText(text);
                      toast.success("All credentials copied!");
                    }}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#7AD62A] transition-colors"
                  >
                    <Copy size={11} />
                    Copy all
                  </button>
                </div>
                <div className="space-y-2">
                  {lab.credentials.map((cred: LabCredential, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-slate-300">{cred.service}</p>
                        <button
                          onClick={() => {
                            const text = `User: ${cred.username}${cred.password ? `\nPass: ${cred.password}` : ''}`;
                            navigator.clipboard.writeText(text);
                            toast.success("Credentials copied!");
                          }}
                          className="text-[10px] text-slate-400 hover:text-[#7AD62A] transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-slate-400">User: <span className="font-mono text-[#7AD62A]">{cred.username}</span></p>
                      {cred.password && <p className="text-slate-400">Pass: <span className="font-mono text-[#7AD62A]">{cred.password}</span></p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lab?.flags && lab.flags.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Shield size={12} className="text-[#7AD62A]" />
                  Flags
                </h4>
                <div className="space-y-3">
                  {lab.flags.map((flag: LabFlag) => (
                    <div key={flag.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-300">{flag.title}</span>
                        <span className="text-xs font-medium text-[#7AD62A]">+{flag.points} pts</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{flag.description}</p>
                      {flag.submissions && flag.submissions.length > 0 ? (
                        <span className="text-xs text-[#7AD62A] font-medium">Solved</span>
                      ) : (
                        <FlagInput
                          flagId={flag.id}
                          labId={String(id)}
                          setLab={setLab}
                          walkthroughComplete={walkthroughSteps.length === 0 || walkthroughSteps.filter((s) => s.completed).length >= Math.ceil(walkthroughSteps.length * 0.5)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Workspace (Terminal + Web UI) */}
        <div className="flex-1 flex flex-col min-w-0 angular-card bg-[#0f172a] shadow-sm overflow-hidden">
          {/* Workspace tabs */}
          <div className="border-b border-white/10 px-3 sm:px-4 py-2 shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWorkspaceView("terminal")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  workspaceView === "terminal"
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <TerminalIcon size={13} />
                Terminal
              </button>
              {isWebLab(lab?.dockerImage || undefined) && (
                <>
                  <button
                    onClick={() => setWorkspaceView("web")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      workspaceView === "web"
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <Monitor size={13} />
                    Web UI
                  </button>
                  <button
                    onClick={() => setWorkspaceView("split")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      workspaceView === "split"
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <SplitSquareHorizontal size={13} />
                    Split
                  </button>
                </>
              )}

              {/* Quick commands + controls (terminal view only) */}
              {isRunning && connected && workspaceView !== "web" && (
                <div className="sm:ml-auto flex items-center gap-1 overflow-x-auto">
                  <span className="text-[10px] text-slate-400 mr-1 hidden sm:block">Quick:</span>
                  {QUICK_COMMANDS.map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => sendCommand(cmd)}
                      title={`Run: ${cmd}`}
                      className="px-2 py-1 rounded-md bg-white/5 hover:bg-[#7AD62A]/10 text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
                    >
                      {cmd}
                    </button>
                  ))}
                  <div className="hidden sm:block w-px h-4 bg-white/10 mx-1 shrink-0" />
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <button
                      onClick={handleCopy}
                      disabled={!selection}
                      title="Copy selection"
                      className="p-1 sm:p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      onClick={handlePaste}
                      title="Paste from clipboard"
                      className="p-1 sm:p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                    >
                      <ClipboardPaste size={13} />
                    </button>
                    <button
                      onClick={() => updateFontSize(fontSize - 1)}
                      disabled={fontSize <= MIN_FONT_SIZE}
                      title="Decrease font size"
                      className="p-1 sm:p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    >
                      <ZoomOut size={13} />
                    </button>
                    <button
                      onClick={() => updateFontSize(fontSize + 1)}
                      disabled={fontSize >= MAX_FONT_SIZE}
                      title="Increase font size"
                      className="p-1 sm:p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    >
                      <ZoomIn size={13} />
                    </button>
                    <button
                      onClick={handleClear}
                      title="Clear terminal"
                      className="ml-0.5 sm:ml-1 p-1 sm:p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                    >
                      <Eraser size={13} />
                    </button>
                  </div>
                </div>
              )}

              {isRunning && !connected && (
                <div className="sm:ml-auto flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-amber-600">
                    <Loader2 className="animate-spin" size={12} />
                    Connecting...
                  </span>
                  <button
                    onClick={handleManualReconnect}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-[#7AD62A] hover:bg-[#7AD62A]/10 transition-colors"
                  >
                    <PlugZap size={12} />
                    Reconnect
                  </button>
                </div>
              )}

              <button
                onClick={() => setIsFullscreen((v) => !v)}
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              >
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
            </div>
          </div>

          {/* Workspace content */}
          <div className={`flex-1 min-h-[360px] lg:min-h-0 relative ${workspaceView === "split" ? "flex" : ""}`}>
            {/* Terminal pane */}
            {(workspaceView === "terminal" || workspaceView === "split") && (
              <div className={`${workspaceView === "split" ? "w-1/2 border-r border-white/10" : "w-full"} h-full flex flex-col`}>
                {isRunning ? (
                  <>
                    <div ref={terminalRef} className="w-full flex-1 min-h-0" />
                    {isMobile && (
                      <div className="shrink-0 border-t border-white/10 bg-[#0a0f1a] p-2 safe-area-pb">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1">
                            {QUICK_COMMANDS.map((cmd) => (
                              <button
                                key={cmd}
                                onClick={() => sendCommand(cmd)}
                                className="px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-[#7AD62A]/10 text-[11px] font-mono text-slate-400 hover:text-white transition-colors shrink-0"
                              >
                                {cmd}
                              </button>
                            ))}
                          </div>
                        </div>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (mobileCommand.trim()) {
                              sendCommand(mobileCommand.trim());
                              setMobileCommand("");
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={mobileCommand}
                            onChange={(e) => setMobileCommand(e.target.value)}
                            placeholder="Type command..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#7AD62A]/50"
                            autoComplete="off"
                            autoCapitalize="off"
                            spellCheck={false}
                          />
                          <button
                            type="submit"
                            disabled={!mobileCommand.trim()}
                            className="px-3 py-2 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] disabled:opacity-30 text-[#0F203A] text-xs font-medium transition-colors shrink-0"
                          >
                            Run
                          </button>
                        </form>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-slate-400 gap-3">
                    <TerminalIcon size={28} className="text-slate-300" />
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {isExpired ? "Lab instance expired" : isProvisioning ? "Lab is provisioning" : isStopped ? "Lab stopped" : "Terminal offline"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {isExpired
                          ? "Start a fresh instance to continue"
                          : isProvisioning
                            ? "Your environment is being prepared. The terminal will connect when the lab becomes ready."
                            : isStopped
                              ? "The last attempt has ended. Start a fresh instance to continue."
                              : "Start a lab instance to connect"}
                      </p>
                    </div>
                    {!isRunning && !isProvisioning && (
                      <button onClick={handleLaunch} className="btn-primary text-sm">
                        <Play size={14} />
                        {isStopped || isExpired ? "Start Fresh Instance" : "Start Lab"}
                      </button>
                    )}
                  </div>
                )}
                {isRunning && !connected && hasConnected && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/5">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <WifiOff size={20} className="text-amber-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white">Connection lost</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        {autoReconnecting
                          ? "Attempting to reconnect automatically..."
                          : "The connection to your terminal was lost. Click below to re-establish the session."}
                      </p>
                    </div>
                    <button
                      onClick={handleManualReconnect}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] text-xs font-medium transition-colors"
                    >
                      <PlugZap size={12} />
                      Reconnect
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Web UI iframe */}
            {(workspaceView === "web" || workspaceView === "split") && isWebLab(lab?.dockerImage || undefined) && (
              <div className={`${workspaceView === "split" ? "w-1/2" : "w-full"} h-full flex flex-col`}>
                {/* URL bar */}
                {isRunning && accessUrl && (
                  <div className="border-b border-white/10 px-3 py-1.5 flex items-center gap-2 shrink-0 bg-[#0f172a]">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${iframeLoading ? "bg-amber-400 animate-pulse" : iframeError ? "bg-red-400" : "bg-[#7AD62A]"}`} />
                      <span className="text-[11px] font-mono text-slate-400 truncate">{accessUrl}</span>
                    </div>
                    <button
                      onClick={() => {
                        setIframeLoading(true);
                        setIframeError(false);
                        if (iframeRef.current) iframeRef.current.src = accessUrl;
                      }}
                      title="Refresh"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <RefreshCcw size={12} />
                    </button>
                    <a
                      href={accessUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in new tab"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
                {/* Iframe content */}
                <div className="flex-1 relative min-h-0">
                  {isRunning && accessUrl ? (
                    <>
                      {iframeLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a] z-10">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-[#7AD62A]" size={24} />
                            <p className="text-xs text-slate-400">Loading web interface...</p>
                          </div>
                        </div>
                      )}
                      {iframeError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a] z-10">
                          <div className="flex flex-col items-center gap-3 text-center">
                            <Monitor size={28} className="text-red-400" />
                            <div>
                              <p className="text-sm font-medium text-white">Failed to load web interface</p>
                              <p className="text-xs text-slate-400 mt-1">The lab service may not be responding yet</p>
                            </div>
                            <button
                              onClick={() => {
                                setIframeLoading(true);
                                setIframeError(false);
                                if (iframeRef.current) iframeRef.current.src = accessUrl;
                              }}
                              className="btn-primary text-xs"
                            >
                              <RefreshCcw size={12} />
                              Retry
                            </button>
                          </div>
                        </div>
                      )}
                      <iframe
                        ref={iframeRef}
                        src={accessUrl}
                        className="w-full h-full border-0 bg-white"
                        title="Web Lab UI"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        onLoad={() => setIframeLoading(false)}
                        onError={() => { setIframeLoading(false); setIframeError(true); }}
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-slate-400 gap-3">
                      <Monitor size={28} className="text-slate-300" />
                      <div className="text-center">
                        <p className="text-sm font-medium">
                          {isExpired ? "Lab instance expired" : isProvisioning ? "Lab is provisioning" : isStopped ? "Lab stopped" : "Web UI offline"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {isExpired
                            ? "Start a fresh instance to continue"
                            : isProvisioning
                              ? "The web interface will be available once the lab is ready."
                              : isStopped
                                ? "The last attempt has ended. Start a fresh instance to continue."
                                : "Start a lab instance to access the web interface"}
                        </p>
                      </div>
                      {!isRunning && !isProvisioning && (
                        <button onClick={handleLaunch} className="btn-primary text-sm">
                          <Play size={14} />
                          {isStopped || isExpired ? "Start Fresh Instance" : "Start Lab"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
      />
    </div>
  );
}

function FlagInput({ flagId, labId, setLab, walkthroughComplete }: { flagId: string; labId: string; setLab: (lab: LabDefinition) => void; walkthroughComplete?: boolean }) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetchApi(`/labs/submit-flag/${flagId}`, {
        method: "POST",
        body: JSON.stringify({ answer: value }),
      });
      if (res.isCorrect) {
        toast.success(res.message);
        showXpGain(res.xpAwarded || 10);
        const labData = await fetchApi(`/labs/definition/${labId}`);
        setLab(labData);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      {walkthroughComplete === false && (
        <p className="text-[10px] text-amber-400 flex items-center gap-1">
          <AlertTriangle size={10} />
          Complete walkthrough steps first for best results
        </p>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="AERO{...}"
          className="flex-1 text-xs border border-white/10 bg-[#0f172a] text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-3 py-1.5 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] text-xs font-medium transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 className="animate-spin" size={12} /> : "Submit"}
        </button>
      </div>
    </div>
  );
}
