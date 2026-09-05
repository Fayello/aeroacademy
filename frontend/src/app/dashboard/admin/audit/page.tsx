"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ScrollText, Users, ShieldCheck, AlertTriangle, Loader2, ChevronLeft, ChevronRight, Eye, X, RefreshCw, Activity } from "lucide-react";
import { fetchApi } from "@/lib/api";
import type { AuditLog, AuditLogResponse } from "@/types/api";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

interface Summary {
  byAction: { action: string; count: number }[];
  byStatus: { statusCode: number; count: number }[];
  last24h: number;
}

const PAGE_SIZE = 25;

function ActionBadge({ action }: { action: string }) {
  const base = "px-2 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide";
  if (action.startsWith("AUTH_")) return <span className={`${base} bg-blue-500/10 text-blue-400`}>{action}</span>;
  if (action.startsWith("LAB_") || action.startsWith("FLAG_")) return <span className={`${base} bg-amber-500/10 text-amber-400`}>{action}</span>;
  if (action.startsWith("QUIZ_") || action.startsWith("LESSON_")) return <span className={`${base} bg-violet-50 text-violet-700`}>{action}</span>;
  if (action.startsWith("BOOKING_") || action.startsWith("TRAINER_") || action.startsWith("MASTERCLASS_")) return <span className={`${base} bg-[#7AD62A]/10 text-[#0F203A]`}>{action}</span>;
  if (action.includes("DELETED") || action.includes("CANCELLED") || action.includes("TERMINATED")) return <span className={`${base} bg-red-500/10 text-red-700`}>{action}</span>;
  return <span className={`${base} bg-white/5 text-slate-400`}>{action}</span>;
}

function StatusBadge({ code }: { code: number }) {
  if (code < 400) return <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#7AD62A]/10 text-[#0F203A]">{code}</span>;
  if (code < 500) return <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-400">{code}</span>;
  return <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-700">{code}</span>;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const loadSummary = useCallback(() => {
    fetchApi("/admin/audit-logs/summary").then(setSummary).catch(() => {});
  }, []);

  const fetchLogs = useCallback(async (p: number, act: string, st: string): Promise<AuditLogResponse | null> => {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String((p - 1) * PAGE_SIZE));
    if (act) params.set("action", act);
    if (st) params.set("status", st);
    try {
      return (await fetchApi(`/admin/audit-logs?${params.toString()}`)) as AuditLogResponse;
    } catch {
      return null;
    }
  }, []);

  const applyLogs = useCallback((data: AuditLogResponse | null) => {
    setLogs(data && Array.isArray(data.items) ? data.items : []);
    setTotal(data?.total || 0);
    setLoading(false);
  }, []);

  const reloadLogs = useCallback((act: string, st: string) => {
    fetchLogs(1, act, st).then(applyLogs);
  }, [fetchLogs, applyLogs]);

  useEffect(() => {
    let cancelled = false;
    loadSummary();
    fetchLogs(1, "", "").then((data) => { if (!cancelled) applyLogs(data); });
    return () => { cancelled = true; };
  }, [loadSummary, fetchLogs, applyLogs]);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const handleFilterChange = (act: string, st: string) => {
    setAction(act);
    setStatus(st);
    setPage(1);
    setLoading(true);
    fetchLogs(1, act, st).then(applyLogs);
  };

  const uniqueActions = useMemo(
    () => (summary?.byAction || []).map((a) => a.action),
    [summary],
  );

  const topActions = useMemo(() => (summary?.byAction || []).slice(0, 5), [summary]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Audit Logs"
        description="Review the administrative and security trail with clearer signals for scale, errors, and follow-up"
      />

      <div className="relative overflow-hidden angular-card border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#1b3657] p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center">
              <ScrollText size={24} className="text-[#7AD62A]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
              <p className="text-sm text-slate-300">Immutable trail of administrative and security-relevant actions</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2 bg-[#0f172a] rounded-lg border border-white/10 px-4 py-2 text-sm">
              <ShieldCheck size={16} className="text-[#7AD62A]" />
              <span className="font-medium">{(summary?.byStatus || []).reduce((acc, s) => acc + s.count, 0)} total events</span>
            </div>
            <div className="flex items-center gap-2 bg-[#0f172a] rounded-lg border border-white/10 px-4 py-2 text-sm">
              <Activity size={16} className="text-[#7AD62A]" />
              <span className="font-medium">{summary?.last24h || 0} in last 24h</span>
            </div>
            <div className="flex items-center gap-2 bg-[#0f172a] rounded-lg border border-white/10 px-4 py-2 text-sm">
              <AlertTriangle size={16} className="text-amber-600" />
              <span className="font-medium">{(summary?.byStatus || []).find((s) => s.statusCode >= 400)?.count || 0} errors</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
          <h3 className="text-sm font-semibold text-white">Review order</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Start with summary volume, filter on unusual actions or error states, then open details only where context or follow-up is needed.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
          <h3 className="text-sm font-semibold text-white">Operational use</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            This page should support accountability, incident review, and governance evidence rather than act like a raw developer log dump.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
          <h3 className="text-sm font-semibold text-white">Current signal</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {(summary?.last24h || 0) > 0
              ? `${summary?.last24h || 0} events were recorded in the last 24 hours. Use this with status filters to isolate exceptions quickly.`
              : "No recent events are visible yet. Once activity is present, use action and status filters to narrow review."}
          </p>
        </div>
      </div>

      {/* Top actions */}
      <div className="angular-card bg-[#0f172a] p-6">
        <h3 className="font-semibold text-white mb-4">Most Frequent Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {topActions.map((a) => (
            <button
              key={a.action}
              onClick={() => handleFilterChange(a.action, status)}
              className={`p-4 rounded-xl border text-left transition-all ${action === a.action ? "border-[#7AD62A] bg-[#7AD62A]/10" : "border-white/10 hover:border-[#7AD62A]/30 hover:shadow-sm"}`}
            >
              <div className="text-xl font-bold text-white">{a.count}</div>
              <div className="mt-1 truncate text-[11px] uppercase tracking-wide text-slate-400">{a.action}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="angular-card bg-[#0f172a] p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-slate-400">Action</label>
          <select value={action} onChange={(e) => handleFilterChange(e.target.value, status)} className="input-field">
            <option value="">All actions</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-slate-400">Status</label>
          <select value={status} onChange={(e) => handleFilterChange(action, e.target.value)} className="input-field">
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
        </div>
        <button
          onClick={() => { setAction(""); setStatus(""); setPage(1); setLoading(true); reloadLogs("", ""); loadSummary(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-medium transition-all"
        >
          <RefreshCw size={16} /> Reset
        </button>
      </div>

      {/* Table */}
      <div className="angular-card bg-[#0f172a] overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actor</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Request</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">IP</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Loader2 className="animate-spin text-[#7AD62A] mx-auto" size={28} />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <EmptyState icon={ScrollText} title="No audit events found" description="" />
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString()} <span className="text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          <Users size={12} className="text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[160px]">{log.actor?.name || "System"}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[160px]">{log.actorEmail || log.actor?.email || "unauthenticated"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><ActionBadge action={log.action} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${log.method === "GET" ? "bg-blue-500/10 text-blue-400" : log.method === "POST" ? "bg-[#7AD62A]/10 text-[#0F203A]" : log.method === "DELETE" ? "bg-red-500/10 text-red-700" : "bg-amber-500/10 text-amber-400"}`}>
                          {log.method}
                        </span>
                        <span className="truncate max-w-[220px]">{log.path}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge code={log.statusCode} /></td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{log.ip || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelected(log)}
                        className="p-2 text-slate-400 hover:text-[#7AD62A] hover:bg-[#7AD62A]/10 rounded-lg transition-all"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        {!loading && logs.length > 0 && (
          <div className="md:hidden divide-y divide-white/5">
            {logs.map((log) => (
              <div key={log.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">{new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}</span>
                  <StatusBadge code={log.statusCode} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center shrink-0">
                    <Users size={10} className="text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{log.actor?.name || "System"}</p>
                    <p className="text-[10px] text-slate-400 truncate">{log.actorEmail || log.actor?.email || "unauthenticated"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                    <span className={`px-1 py-0.5 rounded font-bold ${log.method === "GET" ? "bg-blue-500/10 text-blue-400" : log.method === "POST" ? "bg-[#7AD62A]/10 text-[#0F203A]" : log.method === "DELETE" ? "bg-red-500/10 text-red-700" : "bg-amber-500/10 text-amber-400"}`}>
                      {log.method}
                    </span>
                    <span className="truncate max-w-[200px]">{log.path}</span>
                  </div>
                  <button
                    onClick={() => setSelected(log)}
                    className="p-1.5 text-slate-400 hover:text-[#7AD62A] hover:bg-[#7AD62A]/10 rounded-lg transition-all"
                  >
                    <Eye size={14} />
                  </button>
                </div>
                <div className="text-[10px] font-mono text-slate-500">IP: {log.ip || "—"}</div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} events
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { const p = Math.max(1, page - 1); setPage(p); setLoading(true); fetchLogs(p, action, status).then(applyLogs); }}
                disabled={page === 1}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} className="text-slate-400" />
              </button>
              <span className="text-sm text-slate-400 font-medium">Page {page} / {totalPages}</span>
              <button
                onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); setLoading(true); fetchLogs(p, action, status).then(applyLogs); }}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelected(null)} aria-hidden="true" />
          <div className="relative angular-card max-h-[85vh] w-full max-w-lg overflow-hidden bg-[#0f172a] shadow-xl">
            <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ActionBadge action={selected.action} />
                <StatusBadge code={selected.statusCode} />
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-white/5 transition-colors" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto p-6 text-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Actor</p>
                  <p className="font-medium text-white mt-0.5">{selected.actor?.name || "System"}</p>
                  <p className="text-xs text-slate-400">{selected.actorEmail || selected.actor?.email || "unauthenticated"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Timestamp</p>
                  <p className="font-medium text-white mt-0.5">{new Date(selected.createdAt).toLocaleString()}</p>
                  {selected.metadata?.durationMs != null && (
                    <p className="text-xs text-slate-400">{selected.metadata.durationMs}ms</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">IP Address</p>
                  <p className="font-medium font-mono text-white mt-0.5">{selected.ip || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Request</p>
                  <p className="font-mono text-white mt-0.5">{selected.method} {selected.path}</p>
                </div>
              </div>
              {selected.metadata && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Metadata</p>
                  <pre className="bg-white/5 border border-white/10 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto max-h-64 whitespace-pre-wrap font-mono">
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                </div>
              )}
              {selected.userAgent && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">User Agent</p>
                  <p className="text-xs text-slate-400 break-words">{selected.userAgent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
