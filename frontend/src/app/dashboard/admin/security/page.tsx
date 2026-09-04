"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Globe,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Lock,
  Server,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Eye,
  Activity,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import PageHeader from "@/components/ui/PageHeader";

interface DefenseLayer {
  name: string;
  status: "active" | "inactive" | "degraded";
  description: string;
  details: string[];
  metrics?: Record<string, number>;
}

interface SecurityOverview {
  timestamp: number;
  summary: {
    totalEvents24h: number;
    totalEvents7d: number;
    uniqueAttackers24h: number;
    uniqueAttackers7d: number;
    blockedIps: number;
    criticalEvents24h: number;
  };
  defenseLayers: DefenseLayer[];
  topCountries24h: { country: string; countryCode: string; count: number }[];
  topAttackTypes24h: { type: string; count: number }[];
  topAttackerIps24h: {
    ip: string;
    country: string;
    countryCode: string;
    count: number;
    banned: boolean;
  }[];
  hourlyTimeline24h: { hour: string; count: number }[];
  recentCritical: any[];
}

const LAYER_ICONS: Record<string, typeof Shield> = {
  "UFW Firewall": Lock,
  fail2ban: Shield,
  "ModSecurity WAF": Eye,
  "Nginx Rate Limits": Zap,
  "Suricata IDS/IPS": Activity,
  "Docker Sandboxing": Server,
};

const LAYER_COLORS: Record<string, string> = {
  active: "border-[#7AD62A]/30 bg-[#7AD62A]/5",
  inactive: "border-red-500/30 bg-red-500/5",
  degraded: "border-amber-500/30 bg-amber-500/5",
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function Flag({ code }: { code: string }) {
  if (!code || code === "??") return <span>🏳️</span>;
  const codeLower = code.toLowerCase();
  return (
    <span>
      {String.fromCodePoint(
        ...[...codeLower].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)),
      )}
    </span>
  );
}

export default function SecurityOpsPage() {
  const [data, setData] = useState<SecurityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const snapshot = await fetchApi<SecurityOverview>("/admin/security/overview");
      setData(snapshot);
    } catch {
      toast.error("Failed to load security data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const maxHourly = data
    ? Math.max(...data.hourlyTimeline24h.map((h) => h.count), 1)
    : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Operations Center"
        description="Unified view of all defense layers, attacks, and threat intelligence"
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#7AD62A]" size={32} />
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-slate-500">
          No security data available yet.
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Activity size={14} />
                Events (24h)
              </div>
              <p className="text-2xl font-bold text-white">
                {data.summary.totalEvents24h.toLocaleString()}
              </p>
            </div>
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Activity size={14} />
                Events (7d)
              </div>
              <p className="text-2xl font-bold text-white">
                {data.summary.totalEvents7d.toLocaleString()}
              </p>
            </div>
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Globe size={14} />
                Attackers (24h)
              </div>
              <p className="text-2xl font-bold text-white">
                {data.summary.uniqueAttackers24h}
              </p>
            </div>
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 text-[#7AD62A] text-xs mb-2">
                <Shield size={14} />
                IPs Blocked
              </div>
              <p className="text-2xl font-bold text-[#7AD62A]">
                {data.summary.blockedIps}
              </p>
            </div>
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 text-red-400 text-xs mb-2">
                <AlertTriangle size={14} />
                Critical (24h)
              </div>
              <p className="text-2xl font-bold text-red-400">
                {data.summary.criticalEvents24h}
              </p>
            </div>
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Clock size={14} />
                Updated
              </div>
              <p className="text-2xl font-bold text-white">
                {formatTime(data.timestamp)}
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
              {autoRefresh ? "Live (30s)" : "Paused"}
            </button>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-slate-400 border border-white/10 hover:border-white/20 transition-all"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          {/* Defense Layers */}
          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Shield size={16} className="text-[#7AD62A]" />
              Defense Layers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.defenseLayers.map((layer) => {
                const Icon = LAYER_ICONS[layer.name] || Shield;
                return (
                  <div
                    key={layer.name}
                    className={`rounded-xl border p-4 transition-all ${
                      LAYER_COLORS[layer.status]
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon
                          size={18}
                          className={
                            layer.status === "active"
                              ? "text-[#7AD62A]"
                              : layer.status === "inactive"
                              ? "text-red-400"
                              : "text-amber-400"
                          }
                        />
                        <h4 className="text-sm font-medium text-white">
                          {layer.name}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          layer.status === "active"
                            ? "bg-[#7AD62A]/10 text-[#7AD62A]"
                            : layer.status === "inactive"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {layer.status === "active" ? (
                          <CheckCircle size={10} className="inline mr-1" />
                        ) : (
                          <XCircle size={10} className="inline mr-1" />
                        )}
                        {layer.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-3">
                      {layer.description}
                    </p>
                    <div className="space-y-1">
                      {layer.details.map((detail, i) => (
                        <p key={i} className="text-[10px] text-slate-400">
                          {detail}
                        </p>
                      ))}
                    </div>
                    {layer.metrics && (
                      <div className="flex gap-3 mt-3 pt-3 border-t border-white/5">
                        {Object.entries(layer.metrics).map(([k, v]) => (
                          <div key={k} className="text-center">
                            <p className="text-xs font-bold text-white">{v}</p>
                            <p className="text-[9px] text-slate-500">{k}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attack Timeline (24h) */}
          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              Attack Timeline (24h)
            </h3>
            <div className="flex items-end gap-0.5 h-20">
              {data.hourlyTimeline24h.length === 0 ? (
                <p className="text-xs text-slate-500">No attacks in 24h.</p>
              ) : (
                data.hourlyTimeline24h.map((point) => (
                  <div
                    key={point.hour}
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                  >
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-slate-800 border border-white/10 rounded px-2 py-1 text-[10px] text-white whitespace-nowrap">
                      {point.hour}:00 — {point.count} attacks
                    </div>
                    <div
                      className="w-full bg-red-500 rounded-t transition-all min-h-[1px] hover:bg-red-400"
                      style={{
                        height: `${(point.count / maxHourly) * 100}%`,
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
                Top Countries (24h)
              </h3>
              <div className="space-y-2">
                {data.topCountries24h.slice(0, 10).map((c) => (
                  <div key={c.countryCode} className="flex items-center gap-3 py-1.5">
                    <Flag code={c.countryCode} />
                    <span className="text-xs text-white flex-1">{c.country}</span>
                    <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{
                          width: `${(c.count / (data.topCountries24h[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-white font-medium w-8 text-right">
                      {c.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attack Types */}
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                Attack Types (24h)
              </h3>
              <div className="space-y-2">
                {data.topAttackTypes24h.slice(0, 10).map((t) => (
                  <div key={t.type} className="flex items-center gap-3 py-1.5">
                    <span className="text-xs text-white flex-1">{t.type}</span>
                    <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${(t.count / (data.topAttackTypes24h[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-white font-medium w-8 text-right">
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
              Top Attacker IPs (24h)
            </h3>
            <div className="space-y-1">
              {data.topAttackerIps24h.slice(0, 15).map((entry) => (
                <div
                  key={entry.ip}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 text-xs"
                >
                  <Flag code={entry.countryCode} />
                  <span className="text-white font-mono w-28">{entry.ip}</span>
                  <span className="text-slate-500 w-16">{entry.country}</span>
                  <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{
                        width: `${(entry.count / (data.topAttackerIps24h[0]?.count || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-white font-medium w-8 text-right">
                    {entry.count}
                  </span>
                  {entry.banned && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#7AD62A]/10 text-[#7AD62A] font-medium">
                      BANNED
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Critical Events */}
          {data.recentCritical.length > 0 && (
            <div className="bg-[#0f172a] rounded-xl border border-red-500/10 p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-400" />
                Recent Critical/High Events
              </h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {data.recentCritical.map((event, i) => (
                  <div
                    key={event.id || i}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 text-xs font-mono"
                  >
                    <span className="text-slate-500 w-16">
                      {formatTime(new Date(event.timestamp).getTime())}
                    </span>
                    <Flag code={event.countryCode || "??"} />
                    <span className="text-white w-28">{event.ip}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        event.severity === "CRITICAL"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-orange-500/10 text-orange-400"
                      }`}
                    >
                      {event.severity}
                    </span>
                    <span className="text-amber-400 w-24">{event.type}</span>
                    <span className="text-slate-400 flex-1 truncate">
                      {event.message}
                    </span>
                    <span className="text-slate-500">{event.source}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
