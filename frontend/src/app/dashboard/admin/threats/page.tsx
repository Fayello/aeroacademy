"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Globe,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Zap,
  X,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import PageHeader from "@/components/ui/PageHeader";

interface ThreatRecord {
  timestamp: number;
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  type: string;
  severity: string;
  ruleId: string;
  msg: string;
  uri: string;
  source: string;
}

interface ThreatSummary {
  totalAttacks: number;
  uniqueAttackerIps: number;
  topCountries: { country: string; countryCode: string; count: number }[];
  topAttackTypes: { type: string; count: number }[];
  topAttackerIps: {
    ip: string;
    country: string;
    countryCode: string;
    count: number;
    types: string[];
  }[];
  timeline: { minute: number; count: number }[];
  severityBreakdown: Record<string, number>;
  recentAttacks: ThreatRecord[];
  hourStats: {
    totalBlocked: number;
    uniqueIps: number;
    topBlockedEndpoint: string;
  };
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-400 bg-red-500/10 border-red-500/20",
  HIGH: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  LOW: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  INFO: "text-slate-400 bg-white/5 border-white/10",
};

const TYPE_ICONS: Record<string, string> = {
  "SQL Injection": "💉",
  XSS: "📜",
  "Command Injection": "💻",
  SSRF: "🔗",
  "Path Traversal": "📁",
  "Scanner/Recon": "🔍",
  "Rate Limit Hit": "⏱️",
  "Log4Shell/RCE": "💣",
  "NoSQL Injection": "🗄️",
  Obfuscation: "🎭",
  Enumeration: "📋",
  "Honeypot Hit": "🍯",
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function Flag({ code }: { code: string }) {
  if (!code || code === "??") return <span className="text-xs">🏳️</span>;
  const codeLower = code.toLowerCase();
  return (
    <span className="text-xs">
      {String.fromCodePoint(
        ...[...codeLower].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)),
      )}
    </span>
  );
}

export default function ThreatsPage() {
  const [data, setData] = useState<ThreatSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const [ipDetail, setIpDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [fail2ban, setFail2ban] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      const [snapshot, f2b] = await Promise.allSettled([
        fetchApi<ThreatSummary>("/admin/threats/summary"),
        fetchApi<any>("/admin/threats/fail2ban").catch(() => null),
      ]);
      if (snapshot.status === "fulfilled") setData(snapshot.value);
      if (f2b.status === "fulfilled" && f2b.value) setFail2ban(f2b.value);
    } catch {
      toast.error("Failed to load threat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const loadIpDetail = async (ip: string) => {
    setSelectedIp(ip);
    setLoadingDetail(true);
    try {
      const detail = await fetchApi<any>(`/admin/threats/ip/${ip}`);
      setIpDetail(detail);
    } catch {
      toast.error("Failed to load IP details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const maxMinuteCount = data
    ? Math.max(...data.timeline.map((t) => t.count), 1)
    : 1;

  const filteredAttacks = data?.recentAttacks.filter(
    (a) =>
      (!typeFilter || a.type === typeFilter) &&
      (!severityFilter || a.severity === severityFilter),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Threat Intelligence"
        description="Security attacks, origins, and patterns from ModSecurity + Nginx logs"
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#7AD62A]" size={32} />
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-slate-500">
          No threat data available yet. Logs are parsed every 30 seconds.
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Shield size={14} />
                Attacks (1h)
              </div>
              <p className="text-2xl font-bold text-white">
                {data.totalAttacks.toLocaleString()}
              </p>
            </div>
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Globe size={14} />
                Unique IPs
              </div>
              <p className="text-2xl font-bold text-white">
                {data.uniqueAttackerIps}
              </p>
            </div>
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 text-red-400 text-xs mb-2">
                <AlertTriangle size={14} />
                Critical
              </div>
              <p className="text-2xl font-bold text-red-400">
                {data.severityBreakdown.CRITICAL || 0}
              </p>
            </div>
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 text-orange-400 text-xs mb-2">
                <Zap size={14} />
                High
              </div>
              <p className="text-2xl font-bold text-orange-400">
                {data.severityBreakdown.HIGH || 0}
              </p>
            </div>
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Clock size={14} />
                Top Target
              </div>
              <p className="text-sm font-bold text-white truncate">
                {data.hourStats.topBlockedEndpoint}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                autoRefresh
                  ? "bg-[#7AD62A]/10 text-[#7AD62A] border border-[#7AD62A]/20"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:border-white/20"
              }`}
            >
              <RefreshCw
                size={14}
                className={autoRefresh ? "animate-spin" : ""}
              />
              {autoRefresh ? "Live" : "Paused"}
            </button>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-slate-400 border border-white/10 hover:border-white/20 transition-all"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          {/* fail2ban Status */}
          {fail2ban && (
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Shield size={16} className="text-[#7AD62A]" />
                  fail2ban Status
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      fail2ban.active
                        ? "bg-[#7AD62A]/10 text-[#7AD62A]"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {fail2ban.active ? "Active" : "Inactive"}
                  </span>
                </h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(fail2ban.jails).map(
                  ([name, jail]: [string, any]) => (
                    <div
                      key={name}
                      className="bg-white/[0.03] rounded-lg p-3 border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-white">{name}</p>
                        {jail.currentlyBanned > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">
                            {jail.currentlyBanned} banned
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-[10px] text-slate-500">
                        <div className="flex justify-between">
                          <span>Total banned</span>
                          <span className="text-white">
                            {jail.totalBanned || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Currently failed</span>
                          <span className="text-white">
                            {jail.currentlyFailed || 0}
                          </span>
                        </div>
                        {jail.bannedIps?.length > 0 && (
                          <div className="pt-1 border-t border-white/5">
                            <p className="text-slate-400 mb-1">Banned IPs:</p>
                            <div className="flex flex-wrap gap-1">
                              {jail.bannedIps.slice(0, 5).map((ip: string) => (
                                <span
                                  key={ip}
                                  className="text-[9px] px-1 py-0.5 rounded bg-white/5 text-slate-400 font-mono"
                                >
                                  {ip}
                                </span>
                              ))}
                              {jail.bannedIps.length > 5 && (
                                <span className="text-[9px] text-slate-500">
                                  +{jail.bannedIps.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Attack Timeline */}
          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              Attack Timeline (Last Hour)
            </h3>
            <div className="flex items-end gap-1 h-24">
              {data.timeline.length === 0 ? (
                <p className="text-xs text-slate-500">No attacks in the last hour.</p>
              ) : (
                data.timeline.map((point) => (
                  <div
                    key={point.minute}
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                  >
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-slate-800 border border-white/10 rounded px-2 py-1 text-[10px] text-white whitespace-nowrap">
                      {point.count} attacks
                    </div>
                    <div
                      className="w-full bg-red-500 rounded-t transition-all min-h-[2px] hover:bg-red-400"
                      style={{
                        height: `${(point.count / maxMinuteCount) * 100}%`,
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Countries */}
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Globe size={16} className="text-[#7AD62A]" />
                Top Attacker Countries
              </h3>
              <div className="space-y-2">
                {data.topCountries.slice(0, 10).map((c) => (
                  <div
                    key={c.countryCode}
                    className="flex items-center gap-3 py-2"
                  >
                    <Flag code={c.countryCode} />
                    <span className="text-xs text-white flex-1">
                      {c.country}
                    </span>
                    <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{
                          width: `${(c.count / (data.topCountries[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-white font-medium w-10 text-right">
                      {c.count}
                    </span>
                  </div>
                ))}
                {data.topCountries.length === 0 && (
                  <p className="text-xs text-slate-500">No data yet.</p>
                )}
              </div>
            </div>

            {/* Attack Types */}
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                Attack Types
              </h3>
              <div className="space-y-2">
                {data.topAttackTypes.map((t) => (
                  <div
                    key={t.type}
                    className="flex items-center gap-3 py-2"
                  >
                    <span className="text-sm">
                      {TYPE_ICONS[t.type] || "⚡"}
                    </span>
                    <span className="text-xs text-white flex-1">{t.type}</span>
                    <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${(t.count / (data.topAttackTypes[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-white font-medium w-10 text-right">
                      {t.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Attacker IPs */}
          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              Top Attacker IPs
            </h3>
            <div className="space-y-1">
              {data.topAttackerIps.slice(0, 15).map((entry) => (
                <div
                  key={entry.ip}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => loadIpDetail(entry.ip)}
                >
                  <Flag code={entry.countryCode} />
                  <span className="text-xs text-white font-mono w-32">
                    {entry.ip}
                  </span>
                  <span className="text-[10px] text-slate-500 w-16">
                    {entry.country}
                  </span>
                  <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{
                        width: `${(entry.count / (data.topAttackerIps[0]?.count || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-white font-medium w-10 text-right">
                    {entry.count}
                  </span>
                  <div className="flex gap-1 flex-1">
                    {entry.types.slice(0, 3).map((type) => (
                      <span
                        key={type}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400"
                      >
                        {type}
                      </span>
                    ))}
                    {entry.types.length > 3 && (
                      <span className="text-[9px] text-slate-500">
                        +{entry.types.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Attacks Log */}
          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">
                Recent Attacks
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-xs text-white"
                >
                  <option value="">All severity</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-xs text-white"
                >
                  <option value="">All types</option>
                  {data.topAttackTypes.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredAttacks?.slice(0, 50).map((attack, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 text-xs font-mono"
                >
                  <span className="text-slate-500 w-16">
                    {formatTime(attack.timestamp)}
                  </span>
                  <Flag code={attack.countryCode} />
                  <span className="text-white w-28">{attack.ip}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${
                      SEVERITY_COLORS[attack.severity] || SEVERITY_COLORS.INFO
                    }`}
                  >
                    {attack.severity}
                  </span>
                  <span className="text-amber-400 w-28">{attack.type}</span>
                  <span className="text-slate-400 flex-1 truncate">
                    {attack.msg}
                  </span>
                  {attack.uri && (
                    <span className="text-slate-500 w-40 truncate">
                      {attack.uri}
                    </span>
                  )}
                </div>
              ))}
              {(!filteredAttacks || filteredAttacks.length === 0) && (
                <p className="text-xs text-slate-500 text-center py-4">
                  No attacks match the current filters.
                </p>
              )}
            </div>
          </div>

          {/* IP Detail Modal */}
          {selectedIp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => {
                  setSelectedIp(null);
                  setIpDetail(null);
                }}
              />
              <div className="relative bg-[#0f172a] rounded-2xl border border-white/10 shadow-xl w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    IP Details: {selectedIp}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedIp(null);
                      setIpDetail(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-300 rounded-lg hover:bg-white/5"
                  >
                    <X size={18} />
                  </button>
                </div>

                {loadingDetail ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-slate-400" size={24} />
                  </div>
                ) : ipDetail ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase">
                          Country
                        </p>
                        <p className="text-sm text-white mt-1 flex items-center gap-2">
                          <Flag code={ipDetail.geo.countryCode} />
                          {ipDetail.geo.country}
                        </p>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase">
                          City
                        </p>
                        <p className="text-sm text-white mt-1">
                          {ipDetail.geo.city}
                        </p>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase">
                          Total Attacks
                        </p>
                        <p className="text-sm text-white mt-1">
                          {ipDetail.totalAttacks}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 uppercase mb-2">
                        Attack Types
                      </p>
                      <div className="space-y-1">
                        {ipDetail.typeBreakdown.map((t: any) => (
                          <div
                            key={t.type}
                            className="flex items-center justify-between py-1.5 text-xs"
                          >
                            <span className="text-white">{t.type}</span>
                            <span className="text-slate-400">{t.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 uppercase mb-2">
                        Recent Attacks
                      </p>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {ipDetail.recentAttacks.map((a: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 py-1.5 text-[10px] font-mono border-b border-white/5"
                          >
                            <span className="text-slate-500">
                              {formatTime(a.timestamp)}
                            </span>
                            <span
                              className={`px-1 py-0.5 rounded ${
                                SEVERITY_COLORS[a.severity] ||
                                SEVERITY_COLORS.INFO
                              }`}
                            >
                              {a.severity}
                            </span>
                            <span className="text-amber-400">{a.type}</span>
                            <span className="text-slate-400 flex-1 truncate">
                              {a.msg}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
