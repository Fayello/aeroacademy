"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi, API_URL } from "@/lib/api";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { io, Socket } from "socket.io-client";
import { useDashboard } from "@/hooks/useDashboard";
import { Loader2, Play, Square, RefreshCcw, Shield, Terminal as TerminalIcon, ExternalLink, ChevronLeft, Clock, Lock } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import Modal from "@/components/Modal";
import { getLevel, getLabLock } from "@/lib/levelGating";

function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export default function LabWorkspace() {
  const { id } = useParams();
  const router = useRouter();
  const { labTelemetry } = useDashboard();
  const [lab, setLab] = useState<any>(null);
  const [instance, setInstance] = useState<any>(null);
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

  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const currentLabTitle = lab?.title?.toLowerCase().replace(/\s+/g, "-");
  const telemetry = labTelemetry.find((t: any) => t.labName?.toLowerCase() === currentLabTitle) || null;

  useEffect(() => {
    try {
      const xp = parseInt(localStorage.getItem("xp") || "0", 10);
      setLevel(getLevel(xp));
    } catch {}

    async function loadLab() {
      try {
        const labData = await fetchApi(`/labs/definition/${id}`);
        setLab(labData);
        const status = await fetchApi(`/labs/status/${id}`);
        setInstance(status);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    loadLab();

    const pollInterval = setInterval(async () => {
      try {
        const status = await fetchApi(`/labs/status/${id}`);
        setInstance(status);
      } catch {
        setInstance(null);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [id]);

  useEffect(() => {
    if (instance?.status === "RUNNING" && terminalRef.current && !xtermRef.current) {
      initTerminal();
    }
  }, [instance]);

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (xtermRef.current) xtermRef.current.dispose();
    };
  }, []);

  const initTerminal = () => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      theme: {
        background: "#0f172a",
        foreground: "#94a3b8",
        cursor: "#059669",
        selectionBackground: "rgba(5, 150, 105, 0.3)",
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 14,
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
    const socket = io(`${API_URL}/terminal`, { auth: { token } });

    socket.on("connect", () => { setConnected(true); socket.emit("join", { labId: id }); });
    socket.on("output", (data: string) => term.write(data));
    socket.on("ready", () => term.focus());
    socket.on("disconnect", () => setConnected(false));
    socket.on("exit", () => {
      toast.error("Terminal session ended.");
      setConnected(false);
    });
    socket.on("error", (msg: string) => {
      toast.error(msg || "Terminal error occurred.");
    });
    term.onData((data: string) => socket.emit("input", data));

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
  };

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
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in duration-500">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Lock size={28} className="text-slate-400" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-900">Lab Locked</h2>
            <p className="text-sm text-slate-500 mt-1">{gate.reason}</p>
            <p className="text-xs text-slate-400 mt-2">Complete more lessons and labs to earn XP and level up.</p>
          </div>
          <Link href="/dashboard/labs" className="btn-primary text-sm">
            Back to Labs
          </Link>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 md:-m-8 animate-in fade-in duration-500">
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
          {instance?.status === "RUNNING" && instance?.expiresAt && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
              <Clock size={12} />
              {formatTimeRemaining(instance.expiresAt)}
            </span>
          )}
          {instance?.status === "RUNNING" ? (
            <>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-500"}`} />
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
      {instance?.status === "RUNNING" && telemetry && (
        <div className="h-10 border-b border-slate-200 bg-white px-4 flex items-center gap-6 text-xs text-slate-500 shrink-0">
          <span className="font-medium">CPU</span>
          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${telemetry.cpu > 80 ? "bg-red-500" : telemetry.cpu > 50 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${telemetry.cpu}%` }} />
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
        <div className="w-80 shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-y-auto hidden lg:block">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Briefing</h2>
          </div>
          <div className="p-5 prose prose-sm prose-slate max-w-none">
            <ReactMarkdown>{lab?.briefing || lab?.description}</ReactMarkdown>

            {lab?.tasks && Array.isArray(lab.tasks) && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Tasks</h4>
                <ul className="space-y-1.5 list-none p-0">
                  {lab.tasks.map((task: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600 p-2 rounded-lg bg-slate-50">
                      <span className="text-emerald-500 mt-1">•</span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {lab?.credentials && Array.isArray(lab.credentials) && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Credentials</h4>
                <div className="space-y-2">
                  {lab.credentials.map((cred: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-slate-700">{cred.service}</p>
                        <button
                          onClick={() => {
                            const text = `User: ${cred.username}${cred.password ? `\nPass: ${cred.password}` : ''}`;
                            navigator.clipboard.writeText(text);
                            toast.success("Credentials copied!");
                          }}
                          className="text-[10px] text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-slate-500">User: <span className="font-mono text-emerald-600">{cred.username}</span></p>
                      {cred.password && <p className="text-slate-500">Pass: <span className="font-mono text-emerald-600">{cred.password}</span></p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lab?.flags && lab.flags.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Shield size={12} className="text-emerald-600" />
                  Flags
                </h4>
                <div className="space-y-3">
                  {lab.flags.map((flag: any) => (
                    <div key={flag.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700">{flag.title}</span>
                        <span className="text-xs font-medium text-emerald-600">+{flag.points} pts</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{flag.description}</p>
                      {flag.submissions && flag.submissions.length > 0 ? (
                        <span className="text-xs text-emerald-600 font-medium">Solved</span>
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

        {/* Terminal */}
        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-10 border-b border-slate-200 px-4 flex items-center gap-2 shrink-0">
            <TerminalIcon size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Terminal</span>
          </div>
          <div className="flex-1 min-h-0">
            {instance?.status === "RUNNING" ? (
              <div ref={terminalRef} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-3">
                <TerminalIcon size={28} className="text-slate-300" />
                <div className="text-center">
                  <p className="text-sm font-medium">Terminal offline</p>
                  <p className="text-xs text-slate-400 mt-1">Start a lab instance to connect</p>
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

function FlagInput({ flagId, labId, setLab }: { flagId: string; labId: string; setLab: any }) {
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
        className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
      >
        {submitting ? <Loader2 className="animate-spin" size={12} /> : "Submit"}
      </button>
    </div>
  );
}
