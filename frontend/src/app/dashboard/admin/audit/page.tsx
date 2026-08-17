"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ScrollText, Users, ShieldCheck, AlertTriangle, Loader2, ChevronLeft, ChevronRight, Eye, X, RefreshCw, Activity } from "lucide-react";
import { fetchApi } from "@/lib/api";
import type { AuditLog, AuditLogResponse } from "@/types/api";

interface Summary {
  byAction: { action: string; count: number }[];
  byStatus: { statusCode: number; count: number }[];
  last24h: number;
}

const PAGE_SIZE = 25;

function ActionBadge({ action }: { action: string }) {
  const base = "px-2 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide";
  if (action.startsWith("AUTH_")) return <span className={`${base} bg-blue-50 text-blue-700`}>{action}</span>;
  if (action.startsWith("LAB_") || action.startsWith("FLAG_")) return <span className={`${base} bg-amber-50 text-amber-700`}>{action}</span>;
  if (action.startsWith("QUIZ_") || action.startsWith("LESSON_")) return <span className={`${base} bg-violet-50 text-violet-700`}>{action}</span>;
  if (action.startsWith("BOOKING_") || action.startsWith("TRAINER_") || action.startsWith("MASTERCLASS_")) return <span className={`${base} bg-emerald-50 text-emerald-700`}>{action}</span>;
  if (action.includes("DELETED") || action.includes("CANCELLED") || action.includes("TERMINATED")) return <span className={`${base} bg-red-50 text-red-700`}>{action}</span>;
  return <span className={`${base} bg-slate-100 text-slate-600`}>{action}</span>;
}

function StatusBadge({ code }: { code: number }) {
  if (code < 400) return <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700">{code}</span>;
  if (code < 500) return <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700">{code}</span>;
  return <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-700">{code}</span>;
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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8 text-slate-900 border border-slate-200">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ScrollText size={24} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
              <p className="text-sm text-slate-500">Immutable trail of administrative and security-relevant actions</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-4 py-2 text-sm">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span className="font-medium">{(summary?.byStatus || []).reduce((acc, s) => acc + s.count, 0)} total events</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-4 py-2 text-sm">
              <Activity size={16} className="text-emerald-600" />
              <span className="font-medium">{summary?.last24h || 0} in last 24h</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-4 py-2 text-sm">
              <AlertTriangle size={16} className="text-amber-600" />
              <span className="font-medium">{(summary?.byStatus || []).find((s) => s.statusCode >= 400)?.count || 0} errors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Most Frequent Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {topActions.map((a) => (
            <button
              key={a.action}
              onClick={() => handleFilterChange(a.action, status)}
              className={`p-4 rounded-xl border text-left transition-all ${action === a.action ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-300 hover:shadow-sm"}`}
            >
              <div className="text-xl font-bold text-slate-900">{a.count}</div>
              <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wide truncate">{a.action}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Action</label>
          <select value={action} onChange={(e) => handleFilterChange(e.target.value, status)} className="input-field">
            <option value="">All actions</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
          <select value={status} onChange={(e) => handleFilterChange(action, e.target.value)} className="input-field">
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
        </div>
        <button
          onClick={() => { setAction(""); setStatus(""); setPage(1); setLoading(true); reloadLogs("", ""); loadSummary(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all"
        >
          <RefreshCw size={16} /> Reset
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actor</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Request</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">IP</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Loader2 className="animate-spin text-emerald-600 mx-auto" size={28} />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                        <ScrollText size={20} className="text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-500">No audit events found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString()} <span className="text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
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
                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${log.method === "GET" ? "bg-blue-50 text-blue-700" : log.method === "POST" ? "bg-emerald-50 text-emerald-700" : log.method === "DELETE" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                          {log.method}
                        </span>
                        <span className="truncate max-w-[220px]">{log.path}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge code={log.statusCode} /></td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{log.ip || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelected(log)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
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

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} events
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { const p = Math.max(1, page - 1); setPage(p); setLoading(true); fetchLogs(p, action, status).then(applyLogs); }}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              <span className="text-sm text-slate-600 font-medium">Page {page} / {totalPages}</span>
              <button
                onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); setLoading(true); fetchLogs(p, action, status).then(applyLogs); }}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelected(null)} aria-hidden="true" />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ActionBadge action={selected.action} />
                <StatusBadge code={selected.statusCode} />
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Actor</p>
                  <p className="font-medium text-slate-900 mt-0.5">{selected.actor?.name || "System"}</p>
                  <p className="text-xs text-slate-500">{selected.actorEmail || selected.actor?.email || "unauthenticated"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Timestamp</p>
                  <p className="font-medium text-slate-900 mt-0.5">{new Date(selected.createdAt).toLocaleString()}</p>
                  {selected.metadata?.durationMs != null && (
                    <p className="text-xs text-slate-500">{selected.metadata.durationMs}ms</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">IP Address</p>
                  <p className="font-medium font-mono text-slate-900 mt-0.5">{selected.ip || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Request</p>
                  <p className="font-mono text-slate-900 mt-0.5">{selected.method} {selected.path}</p>
                </div>
              </div>
              {selected.metadata && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Metadata</p>
                  <pre className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 overflow-x-auto max-h-64 whitespace-pre-wrap font-mono">
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                </div>
              )}
              {selected.userAgent && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">User Agent</p>
                  <p className="text-xs text-slate-600 break-words">{selected.userAgent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
