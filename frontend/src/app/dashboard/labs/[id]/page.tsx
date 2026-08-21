"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { fetchApi, API_URL } from "@/lib/api";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { io, Socket } from "socket.io-client";
import { useDashboard } from "@/hooks/useDashboard";
import { Loader2, Play, Square, RefreshCcw, Shield, Terminal as TerminalIcon, ExternalLink, ChevronLeft, Clock, Lock, Copy, PlugZap, Eraser, Wifi, WifiOff, Zap, Maximize2, Minimize2, ZoomIn, ZoomOut, ClipboardPaste, MessageSquare } from "lucide-react";
import toast from "@/lib/toast";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import Modal from "@/components/Modal";
import { getLevel, getLabLock } from "@/lib/levelGating";
import type { LabTelemetry } from "@/types/api";

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
  tasks?: string[];
  credentials?: LabCredential[];
  flags?: LabFlag[];
}

interface LabInstance {
  id?: string;
  status: string;
  port?: number | null;
  expiresAt?: string | null;
  containerId?: string | null;
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

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

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
      (t: LabTelemetry) => t.labName === id,
    ) || null;

  const isExpired = !!instance?.expiresAt && new Date(instance.expiresAt).getTime() <= now.getTime();
  const isRunning = instance?.status === "RUNNING" && !isExpired;
  const minutesRemaining = instance?.expiresAt
    ? Math.floor((new Date(instance.expiresAt).getTime() - now.getTime()) / 60000)
    : Infinity;
  const countdownTone =
    isExpired || minutesRemaining < 10
      ? "bg-red-50 text-red-600"
      : minutesRemaining < 30
        ? "bg-amber-50 text-amber-600"
        : "bg-[#E9F8EE] text-[#229C62]";

  useEffect(() => {
    try {
      const saved = parseInt(window.localStorage.getItem("xterm:fontSize") || "", 10);
      if (saved >= MIN_FONT_SIZE && saved <= MAX_FONT_SIZE) setFontSize(saved);
    } catch {}
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
        if (!cancelled) setLab(labData);
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

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (xtermRef.current) xtermRef.current.dispose();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, []);

  const initTerminal = useCallback(() => {
    if (!terminalRef.current) return;

    let savedFontSize = 14;
    try {
      const parsed = parseInt(localStorage.getItem("xterm:fontSize") || "", 10);
      if (parsed >= MIN_FONT_SIZE && parsed <= MAX_FONT_SIZE) savedFontSize = parsed;
    } catch {}

    const term = new XTerm({
      theme: {
        background: "#0f172a",
        foreground: "#94a3b8",
        cursor: "#229C62",
        cursorAccent: "#0f172a",
        selectionBackground: "rgba(5, 150, 105, 0.3)",
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
        <p className="text-sm text-slate-500">Loading lab...</p>
      </div>
    );
  }

  if (lab) {
    const gate = getLabLock(lab.difficulty || 1200, level);
    if (gate.locked) {
      const xpNeeded = gate.requiredLevel * 1000 - level * 1000;
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in duration-500">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
            <Lock size={28} className="text-amber-500" />
          </div>
          <div className="text-center max-w-sm">
            <h2 className="text-lg font-semibold text-slate-900">Lab Locked</h2>
            <p className="text-sm text-slate-500 mt-1">{gate.reason}</p>
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Your level</span>
                <span className="font-semibold text-slate-900">Level {level}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Required</span>
                <span className="font-semibold text-[#229C62]">Level {gate.requiredLevel}</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#229C62] to-[#229C62] rounded-full transition-all"
                  style={{ width: `${Math.min(((level - 1) / (gate.requiredLevel - 1)) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Earn <span className="font-semibold text-[#229C62]">{xpNeeded} more XP</span> to unlock
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Link href="/dashboard/labs" className="btn-primary text-sm">
                Browse Labs
              </Link>
              <Link href="/dashboard/courses" className="text-sm text-slate-600 hover:text-slate-800 font-medium">
                Take a Course
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-white" : "h-[calc(100vh-4rem)] -m-4 md:-m-8"} flex flex-col animate-in fade-in duration-500`}>
      {/* Header */}
      <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/labs" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-slate-900">{lab?.title || "Lab"}</h1>
            <p className="text-xs text-slate-500">Interactive Environment</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/labs/${id}/discussions`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors border border-slate-200"
          >
            <MessageSquare size={14} />
            Discussions
          </Link>
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
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
              <span className="flex items-center gap-1.5 text-xs text-[#229C62]">
                {connected ? (
                  <Wifi size={12} className="text-[#229C62]" />
                ) : (
                  <WifiOff size={12} className="text-amber-500" />
                )}
                <span className={`w-2 h-2 rounded-full ${connected ? "bg-[#229C62]" : "bg-amber-500"}`} />
                {connected ? "Connected" : "Connecting..."}
              </span>
              <a
                href={`http://${window.location.hostname}${instance.port ? `:${instance.port}` : ""}${lab?.basePath || ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
              >
                <ExternalLink size={12} />
                Open UI
              </a>
              <button onClick={handleReset} disabled={provisioning} className="btn-ghost text-xs">
                <RefreshCcw size={14} className={provisioning ? "animate-spin" : ""} />
                Reset
              </button>
              <button onClick={handleTerminate} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-medium transition-colors">
                <Square size={12} />
                Stop
              </button>
            </>
          ) : instance?.status === "PROVISIONING" || provisioning ? (
            <span className="flex items-center gap-2 text-xs text-amber-600">
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
      </header>

      {/* Telemetry bar */}
      {!isFullscreen && isRunning && telemetry && (
        <div className="h-10 border-b border-slate-200 bg-white px-4 flex items-center gap-6 text-xs text-slate-500 shrink-0">
          <span className="font-medium">CPU</span>
          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${telemetry.cpu > 80 ? "bg-red-500" : telemetry.cpu > 50 ? "bg-amber-500" : "bg-[#229C62]"}`} style={{ width: `${telemetry.cpu}%` }} />
          </div>
          <span className="font-mono w-8">{telemetry.cpu}%</span>
          <span className="font-medium">RAM</span>
          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${telemetry.memory}%` }} />
          </div>
          <span className="font-mono w-8">{telemetry.memory}%</span>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex min-h-0 p-4 gap-4">
        {/* Briefing panel */}
        {!isFullscreen && (
        <div className="w-80 shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-y-auto hidden lg:block">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Briefing</h2>
          </div>

          {isRunning && (
            <div className="p-4 border-b border-slate-100 bg-[#E9F8EE]/40">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap size={12} className="text-[#229C62]" />
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Quick Start</h4>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Click a command to send it straight to the terminal:
              </p>
              <div className="space-y-1.5">
                {QUICK_COMMANDS.map((cmd) => (
                  <div key={cmd} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200">
                    <button
                      onClick={() => sendCommand(cmd)}
                      className="text-[11px] font-mono text-slate-700 hover:text-[#0F203A] transition-colors text-left truncate"
                    >
                      {cmd}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(cmd);
                        toast.success("Command copied!");
                      }}
                      title="Copy command"
                      className="text-slate-400 hover:text-[#229C62] transition-colors shrink-0"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-5 prose prose-sm prose-slate max-w-none">
            <ReactMarkdown>{lab?.briefing || lab?.description}</ReactMarkdown>

            {lab?.tasks && Array.isArray(lab.tasks) && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Tasks</h4>
                <ul className="space-y-1.5 list-none p-0">
                  {lab.tasks.map((task: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600 p-2 rounded-lg bg-slate-50">
                      <span className="text-[#229C62] mt-1">•</span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {lab?.credentials && Array.isArray(lab.credentials) && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Credentials</h4>
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
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#229C62] transition-colors"
                  >
                    <Copy size={11} />
                    Copy all
                  </button>
                </div>
                <div className="space-y-2">
                  {lab.credentials.map((cred: LabCredential, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-slate-700">{cred.service}</p>
                        <button
                          onClick={() => {
                            const text = `User: ${cred.username}${cred.password ? `\nPass: ${cred.password}` : ''}`;
                            navigator.clipboard.writeText(text);
                            toast.success("Credentials copied!");
                          }}
                          className="text-[10px] text-slate-400 hover:text-[#229C62] transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-slate-500">User: <span className="font-mono text-[#229C62]">{cred.username}</span></p>
                      {cred.password && <p className="text-slate-500">Pass: <span className="font-mono text-[#229C62]">{cred.password}</span></p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lab?.flags && lab.flags.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Shield size={12} className="text-[#229C62]" />
                  Flags
                </h4>
                <div className="space-y-3">
                  {lab.flags.map((flag: LabFlag) => (
                    <div key={flag.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700">{flag.title}</span>
                        <span className="text-xs font-medium text-[#229C62]">+{flag.points} pts</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{flag.description}</p>
                      {flag.submissions && flag.submissions.length > 0 ? (
                        <span className="text-xs text-[#229C62] font-medium">Solved</span>
                      ) : (
                        <FlagInput flagId={flag.id} labId={String(id)} setLab={setLab} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Terminal */}
        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-10 border-b border-slate-200 px-4 flex items-center gap-2 shrink-0">
            <TerminalIcon size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Terminal</span>

            {isRunning && connected && (
              <div className="ml-auto flex items-center gap-1">
                <span className="text-[10px] text-slate-400 mr-1 hidden sm:block">Quick:</span>
                {QUICK_COMMANDS.map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => sendCommand(cmd)}
                    title={`Run: ${cmd}`}
                    className="px-2 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-[11px] font-mono text-slate-500 hover:text-[#0F203A] transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <button
                  onClick={handleCopy}
                  disabled={!selection}
                  title="Copy selection"
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                >
                  <Copy size={13} />
                </button>
                <button
                  onClick={handlePaste}
                  title="Paste from clipboard"
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <ClipboardPaste size={13} />
                </button>
                <button
                  onClick={() => updateFontSize(fontSize - 1)}
                  disabled={fontSize <= MIN_FONT_SIZE}
                  title="Decrease font size"
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                >
                  <ZoomOut size={13} />
                </button>
                <button
                  onClick={() => updateFontSize(fontSize + 1)}
                  disabled={fontSize >= MAX_FONT_SIZE}
                  title="Increase font size"
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  onClick={handleClear}
                  title="Clear terminal"
                  className="ml-1 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Eraser size={13} />
                </button>
              </div>
            )}

            {isRunning && !connected && (
              <div className="ml-auto flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-amber-600">
                  <Loader2 className="animate-spin" size={12} />
                  Connecting...
                </span>
                <button
                  onClick={handleManualReconnect}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-[#0F203A] hover:bg-[#E9F8EE] transition-colors"
                >
                  <PlugZap size={12} />
                  Reconnect
                </button>
              </div>
            )}

            <button
              onClick={() => setIsFullscreen((v) => !v)}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          </div>
          <div className="flex-1 min-h-0 relative">
            {isRunning ? (
              <div ref={terminalRef} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-3">
                <TerminalIcon size={28} className="text-slate-300" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {isExpired ? "Lab instance expired" : "Terminal offline"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isExpired
                      ? "Start a fresh instance to continue"
                      : "Start a lab instance to connect"}
                  </p>
                </div>
                {!isRunning && instance?.status !== "PROVISIONING" && !provisioning && (
                  <button onClick={handleLaunch} className="btn-primary text-sm">
                    <Play size={14} />
                    Start Lab
                  </button>
                )}
              </div>
            )}
            {isRunning && !connected && hasConnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                  <WifiOff size={20} className="text-amber-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-900">Connection lost</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    {autoReconnecting
                      ? "Attempting to reconnect automatically..."
                      : "The connection to your terminal was lost. Click below to re-establish the session."}
                  </p>
                </div>
                <button
                  onClick={handleManualReconnect}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#229C62] hover:bg-[#0F203A] text-white text-xs font-medium transition-colors"
                >
                  <PlugZap size={12} />
                  Reconnect
                </button>
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

function FlagInput({ flagId, labId, setLab }: { flagId: string; labId: string; setLab: (lab: LabDefinition) => void }) {
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
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="AERO{...}"
        className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62]"
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="px-3 py-1.5 rounded-lg bg-[#229C62] hover:bg-[#0F203A] text-white text-xs font-medium transition-colors disabled:opacity-50"
      >
        {submitting ? <Loader2 className="animate-spin" size={12} /> : "Submit"}
      </button>
    </div>
  );
}
