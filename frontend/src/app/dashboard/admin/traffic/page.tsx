"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Globe,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  AlertTriangle,
  Server,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import PageHeader from "@/components/ui/PageHeader";

interface IpEntry {
  ip: string;
  total: number;
  recentTotal: number;
  peakPerMinute: number;
  avgDuration: number;
  topEndpoints: { path: string; count: number }[];
  statusCodes: Record<number, number>;
  lastSeen: number;
}

interface EndpointEntry {
  path: string;
  total: number;
  recentTotal: number;
  peakPerMinute: number;
  avgDuration: number;
  errorRate: number;
}

interface TimelinePoint {
  minute: number;
  count: number;
}

interface TrafficSnapshot {
  timestamp: number;
  totals: {
    recentRequests: number;
    uniqueIps: number;
    bufferUsage: number;
    maxBuffer: number;
  };
  topIps: IpEntry[];
  topEndpoints: EndpointEntry[];
  timeline: TimelinePoint[];
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatMinute(minute: number) {
  const d = new Date(minute * 60000);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-16 h-2 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full bg-[#7AD62A] rounded-full transition-all"
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

export default function TrafficAnalyticsPage() {
  const [data, setData] = useState<TrafficSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [ipFilter, setIpFilter] = useState("");
  const [expandedIps, setExpandedIps] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const snapshot = await fetchApi<TrafficSnapshot>(
        "/admin/traffic/snapshot",
      );
      setData(snapshot);
    } catch {
      toast.error("Failed to load traffic data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const toggleIpExpand = (ip: string) => {
    setExpandedIps((prev) => {
      const next = new Set(prev);
      if (next.has(ip)) next.delete(ip);
      else next.add(ip);
      return next;
    });
  };

  const maxMinuteCount = data
    ? Math.max(...data.timeline.map((t) => t.count), 1)
    : 1;

  const filteredIps = data?.topIps.filter(
    (ip) =>
      !ipFilter ||
      ip.ip.includes(ipFilter) ||
      ip.topEndpoints.some((e) => e.path.includes(ipFilter)),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Traffic Analytics"
        description="Real-time request monitoring for rate limit tuning"
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#7AD62A]" size={32} />
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-slate-500">
          No traffic data available yet.
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Activity size={14} />
                Requests (1h)
              </div>
              <p className="text-2xl font-bold text-white">
                {data.totals.recentRequests.toLocaleString()}
              </p>
            </div>
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Globe size={14} />
                Unique IPs
              </div>
              <p className="text-2xl font-bold text-white">
                {data.totals.uniqueIps}
              </p>
            </div>
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Server size={14} />
                Buffer
              </div>
              <p className="text-2xl font-bold text-white">
                {data.totals.bufferUsage.toLocaleString()}
                <span className="text-sm text-slate-500 font-normal">
                  /{data.totals.maxBuffer.toLocaleString()}
                </span>
              </p>
            </div>
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Clock size={14} />
                Last Updated
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
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </button>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-slate-400 border border-white/10 hover:border-white/20 transition-all"
            >
              <RefreshCw size={14} />
              Refresh now
            </button>
          </div>

          {/* Requests Timeline */}
          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              Requests per Minute (Last Hour)
            </h3>
            <div className="flex items-end gap-1 h-32">
              {data.timeline.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No data yet — traffic will appear within a minute.
                </p>
              ) : (
                data.timeline.map((point) => (
                  <div
                    key={point.minute}
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                  >
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-slate-800 border border-white/10 rounded px-2 py-1 text-[10px] text-white whitespace-nowrap">
                      {formatMinute(point.minute)}: {point.count} req/min
                    </div>
                    <div
                      className="w-full bg-[#7AD62A] rounded-t transition-all min-h-[2px] hover:bg-[#7AD62A]/80"
                      style={{
                        height: `${(point.count / maxMinuteCount) * 100}%`,
                      }}
                    />
                  </div>
                ))
              )}
            </div>
            {data.timeline.length > 0 && (
              <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                <span>
                  {formatMinute(data.timeline[0]?.minute || 0)}
                </span>
                <span>
                  {formatMinute(
                    data.timeline[data.timeline.length - 1]?.minute || 0,
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Top Endpoints */}
          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              Top Endpoints (Last Hour)
            </h3>
            <div className="space-y-2">
              {data.topEndpoints.slice(0, 20).map((ep) => (
                <div
                  key={ep.path}
                  className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
                >
                  <span className="text-xs text-slate-300 font-mono flex-1 truncate">
                    {ep.path}
                  </span>
                  <MiniBar
                    value={ep.recentTotal}
                    max={data.topEndpoints[0]?.recentTotal || 1}
                  />
                  <span className="text-xs text-white font-medium w-12 text-right">
                    {ep.recentTotal}
                  </span>
                  <span className="text-[10px] text-slate-500 w-16 text-right">
                    {ep.avgDuration}ms avg
                  </span>
                  {ep.errorRate > 0 && (
                    <span className="text-[10px] text-red-400 w-10 text-right">
                      {ep.errorRate}% err
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Top IPs */}
          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">
                Top IPs (Last Hour)
              </h3>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  value={ipFilter}
                  onChange={(e) => setIpFilter(e.target.value)}
                  placeholder="Filter by IP or endpoint..."
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#7AD62A]/50 w-64"
                />
              </div>
            </div>
            <div className="space-y-1">
              {filteredIps?.slice(0, 30).map((entry) => (
                <div key={entry.ip}>
                  <div
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => toggleIpExpand(entry.ip)}
                  >
                    <div className="w-5 flex justify-center">
                      {expandedIps.has(entry.ip) ? (
                        <ChevronUp size={12} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={12} className="text-slate-400" />
                      )}
                    </div>
                    <span className="text-xs text-white font-mono w-32">
                      {entry.ip}
                    </span>
                    <MiniBar
                      value={entry.recentTotal}
                      max={filteredIps[0]?.recentTotal || 1}
                    />
                    <span className="text-xs text-white font-medium w-12 text-right">
                      {entry.recentTotal}
                    </span>
                    <span className="text-[10px] text-slate-500 w-16 text-right">
                      peak {entry.peakPerMinute}/min
                    </span>
                    <span className="text-[10px] text-slate-500 w-16 text-right">
                      {entry.avgDuration}ms avg
                    </span>
                    {entry.statusCodes[429] && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1">
                        <AlertTriangle size={10} />
                        {entry.statusCodes[429]} rate-limited
                      </span>
                    )}
                    {entry.statusCodes[403] && (
                      <span className="text-[10px] text-red-400">
                        {entry.statusCodes[403]} blocked
                      </span>
                    )}
                  </div>

                  {expandedIps.has(entry.ip) && (
                    <div className="ml-8 mb-2 p-3 bg-white/[0.02] rounded-lg border border-white/5">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">
                        Top Endpoints
                      </p>
                      <div className="space-y-1">
                        {entry.topEndpoints.map((ep) => (
                          <div
                            key={ep.path}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-slate-300 font-mono">
                              {ep.path}
                            </span>
                            <span className="text-white">{ep.count}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">
                        Last seen: {formatTime(entry.lastSeen)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Rate Limit Recommendations */}
          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#7AD62A]" />
              Rate Limit Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const peakIp = data.topIps[0];
                const peakPerMin = peakIp?.peakPerMinute || 0;
                const avgPerMin =
                  data.totals.recentRequests /
                  Math.max(data.timeline.length, 1);
                return (
                  <>
                    <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                        Observed Peak (per IP)
                      </p>
                      <p className="text-xl font-bold text-white mt-1">
                        {peakPerMin} <span className="text-sm text-slate-400">req/min</span>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {peakIp?.ip} — recommended ModSecurity limit:{" "}
                        <span className="text-[#7AD62A]">
                          {Math.ceil(peakPerMin * 2)}/min
                        </span>
                      </p>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                        Avg Requests/min (all IPs)
                      </p>
                      <p className="text-xl font-bold text-white mt-1">
                        {Math.round(avgPerMin)}{" "}
                        <span className="text-sm text-slate-400">req/min</span>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Nginx api zone:{" "}
                        <span className="text-[#7AD62A]">
                          {Math.ceil(avgPerMin / 60 * 10)}/s
                        </span>{" "}
                        burst:{" "}
                        <span className="text-[#7AD62A]">
                          {Math.ceil(avgPerMin / 60 * 100)}
                        </span>
                      </p>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                        Scanner Baseline
                      </p>
                      <p className="text-xl font-bold text-white mt-1">
                        {data.topIps
                          .filter((i) => i.peakPerMinute > 200)
                          .map((i) => i.ip)
                          .join(", ") || "None detected"}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        IPs exceeding 200 req/min — block threshold
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
