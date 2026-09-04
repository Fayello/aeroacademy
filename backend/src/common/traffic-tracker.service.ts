import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

interface RequestRecord {
  ip: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  timestamp: number;
}

interface IpStats {
  total: number;
  perMinute: Record<number, number>;
  endpoints: Record<string, number>;
  statusCodes: Record<number, number>;
  avgDuration: number;
  lastSeen: number;
}

interface EndpointStats {
  total: number;
  perMinute: Record<number, number>;
  avgDuration: number;
  errors: number;
}

@Injectable()
export class TrafficTrackerService {
  private readonly logger = new Logger(TrafficTrackerService.name);
  private ringBuffer: RequestRecord[] = [];
  private readonly maxBufferSize = 50000;
  private readonly windowMs = 60 * 60 * 1000; // 1 hour

  private ipCache = new Map<string, IpStats>();
  private endpointCache = new Map<string, EndpointStats>();

  record(req: {
    ip: string;
    method: string;
    path: string;
    status: number;
    duration: number;
  }) {
    const now = Date.now();
    const minuteKey = Math.floor(now / 60000);

    const record: RequestRecord = {
      ...req,
      timestamp: now,
    };

    this.ringBuffer.push(record);
    if (this.ringBuffer.length > this.maxBufferSize) {
      this.ringBuffer.splice(0, this.ringBuffer.length - this.maxBufferSize);
    }

    // Update IP stats
    let ipStat = this.ipCache.get(req.ip);
    if (!ipStat) {
      ipStat = {
        total: 0,
        perMinute: {},
        endpoints: {},
        statusCodes: {},
        avgDuration: 0,
        lastSeen: now,
      };
      this.ipCache.set(req.ip, ipStat);
    }
    ipStat.total++;
    ipStat.perMinute[minuteKey] = (ipStat.perMinute[minuteKey] || 0) + 1;
    ipStat.endpoints[req.path] = (ipStat.endpoints[req.path] || 0) + 1;
    ipStat.statusCodes[req.status] = (ipStat.statusCodes[req.status] || 0) + 1;
    ipStat.avgDuration =
      (ipStat.avgDuration * (ipStat.total - 1) + req.duration) / ipStat.total;
    ipStat.lastSeen = now;

    // Update endpoint stats
    let epStat = this.endpointCache.get(req.path);
    if (!epStat) {
      epStat = {
        total: 0,
        perMinute: {},
        avgDuration: 0,
        errors: 0,
      };
      this.endpointCache.set(req.path, epStat);
    }
    epStat.total++;
    epStat.perMinute[minuteKey] = (epStat.perMinute[minuteKey] || 0) + 1;
    epStat.avgDuration =
      (epStat.avgDuration * (epStat.total - 1) + req.duration) / epStat.total;
    if (req.status >= 400) epStat.errors++;
  }

  @Interval(60000)
  cleanup() {
    const cutoff = Date.now() - this.windowMs;
    const cutoffMinute = Math.floor(cutoff / 60000);

    // Prune old ring buffer entries
    this.ringBuffer = this.ringBuffer.filter((r) => r.timestamp > cutoff);

    // Prune old per-minute keys from IP stats
    for (const [ip, stats] of this.ipCache) {
      for (const key of Object.keys(stats.perMinute)) {
        if (Number(key) < cutoffMinute) delete stats.perMinute[Number(key)];
      }
      if (Date.now() - stats.lastSeen > this.windowMs) {
        this.ipCache.delete(ip);
      }
    }

    // Prune old per-minute keys from endpoint stats
    for (const [, stats] of this.endpointCache) {
      for (const key of Object.keys(stats.perMinute)) {
        if (Number(key) < cutoffMinute) delete stats.perMinute[Number(key)];
      }
    }
  }

  getSnapshot() {
    const now = Date.now();
    const cutoffMinute = Math.floor((now - this.windowMs) / 60000);

    // Top IPs by request count
    const topIps = Array.from(this.ipCache.entries())
      .map(([ip, stats]) => {
        const recentMinutes = Object.entries(stats.perMinute)
          .filter(([k]) => Number(k) > cutoffMinute)
          .map(([, v]) => v);
        const recentTotal = recentMinutes.reduce((a, b) => a + b, 0);
        const peakPerMinute = Math.max(...recentMinutes, 0);
        return {
          ip,
          total: stats.total,
          recentTotal,
          peakPerMinute,
          avgDuration: Math.round(stats.avgDuration),
          topEndpoints: Object.entries(stats.endpoints)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([path, count]) => ({ path, count })),
          statusCodes: stats.statusCodes,
          lastSeen: stats.lastSeen,
        };
      })
      .sort((a, b) => b.recentTotal - a.recentTotal)
      .slice(0, 50);

    // Top endpoints by hit count
    const topEndpoints = Array.from(this.endpointCache.entries())
      .map(([path, stats]) => {
        const recentMinutes = Object.entries(stats.perMinute)
          .filter(([k]) => Number(k) > cutoffMinute)
          .map(([, v]) => v);
        const recentTotal = recentMinutes.reduce((a, b) => a + b, 0);
        const peakPerMinute = Math.max(...recentMinutes, 0);
        return {
          path,
          total: stats.total,
          recentTotal,
          peakPerMinute,
          avgDuration: Math.round(stats.avgDuration),
          errorRate:
            stats.total > 0
              ? Math.round((stats.errors / stats.total) * 100)
              : 0,
        };
      })
      .sort((a, b) => b.recentTotal - a.recentTotal)
      .slice(0, 50);

    // Requests per minute over last 60 minutes
    const minuteBuckets: Record<number, number> = {};
    for (const rec of this.ringBuffer) {
      const mk = Math.floor(rec.timestamp / 60000);
      minuteBuckets[mk] = (minuteBuckets[mk] || 0) + 1;
    }
    const timeline = Object.entries(minuteBuckets)
      .filter(([k]) => Number(k) > cutoffMinute)
      .map(([minute, count]) => ({
        minute: Number(minute),
        count,
      }))
      .sort((a, b) => a.minute - b.minute);

    // Total stats
    const totalRecent = topIps.reduce((a, b) => a + b.recentTotal, 0);
    const uniqueIps = this.ipCache.size;

    return {
      timestamp: now,
      totals: {
        recentRequests: totalRecent,
        uniqueIps,
        bufferUsage: this.ringBuffer.length,
        maxBuffer: this.maxBufferSize,
      },
      topIps,
      topEndpoints,
      timeline,
    };
  }

  getIpDetail(ip: string) {
    const stats = this.ipCache.get(ip);
    if (!stats) return null;

    const now = Date.now();
    const cutoffMinute = Math.floor((now - this.windowMs) / 60000);
    const recentMinutes = Object.entries(stats.perMinute)
      .filter(([k]) => Number(k) > cutoffMinute)
      .map(([minute, count]) => ({ minute: Number(minute), count }))
      .sort((a, b) => a.minute - b.minute);

    return {
      ip,
      total: stats.total,
      avgDuration: Math.round(stats.avgDuration),
      endpoints: Object.entries(stats.endpoints)
        .sort(([, a], [, b]) => b - a)
        .map(([path, count]) => ({ path, count })),
      statusCodes: stats.statusCodes,
      timeline: recentMinutes,
      lastSeen: stats.lastSeen,
    };
  }
}
