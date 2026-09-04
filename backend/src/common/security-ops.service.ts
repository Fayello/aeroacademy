import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ThreatIntelService } from './threat-intel.service';
import { execSync } from 'child_process';
import * as fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const geoip = require('geoip-lite');

export interface DefenseLayer {
  name: string;
  status: 'active' | 'inactive' | 'degraded';
  description: string;
  details: string[];
  metrics?: Record<string, number>;
}

export interface SecurityOverview {
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

@Injectable()
export class SecurityOpsService {
  private readonly logger = new Logger(SecurityOpsService.name);

  constructor(
    private prisma: PrismaService,
    private threatIntel: ThreatIntelService,
  ) {}

  @Interval(60000)
  async persistThreats() {
    try {
      const summary = this.threatIntel.getSummary();
      if (summary.recentAttacks.length === 0) return;

      const batchSize = 100;
      for (let i = 0; i < summary.recentAttacks.length; i += batchSize) {
        const batch = summary.recentAttacks.slice(i, i + batchSize);
        await this.prisma.securityEvent.createMany({
          data: batch.map((a) => ({
            timestamp: new Date(a.timestamp),
            ip: a.ip,
            country: a.country,
            city: a.city,
            type: a.type,
            severity: a.severity,
            source: a.source,
            ruleId: a.ruleId || null,
            message: a.msg,
            uri: a.uri || null,
            method: a.method || null,
            status: null,
            data: a.data || null,
          })),
          skipDuplicates: true,
        });
      }
    } catch (err) {
      this.logger.error('Failed to persist security events', err);
    }
  }

  async getOverview(): Promise<SecurityOverview> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      total24h,
      total7d,
      uniqueIps24h,
      uniqueIps7d,
      critical24h,
      topCountries,
      topTypes,
      topIps,
      hourlyTimeline,
      recentCritical,
    ] = await Promise.all([
      this.prisma.securityEvent.count({
        where: { timestamp: { gte: oneDayAgo } },
      }),
      this.prisma.securityEvent.count({
        where: { timestamp: { gte: sevenDaysAgo } },
      }),
      this.prisma.securityEvent.groupBy({
        by: ['ip'],
        where: { timestamp: { gte: oneDayAgo } },
      }),
      this.prisma.securityEvent.groupBy({
        by: ['ip'],
        where: { timestamp: { gte: sevenDaysAgo } },
      }),
      this.prisma.securityEvent.count({
        where: {
          timestamp: { gte: oneDayAgo },
          severity: { in: ['CRITICAL', 'HIGH'] },
        },
      }),
      this.prisma.securityEvent.groupBy({
        by: ['country'],
        where: { timestamp: { gte: oneDayAgo }, country: { not: null } },
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
        take: 15,
      }),
      this.prisma.securityEvent.groupBy({
        by: ['type'],
        where: { timestamp: { gte: oneDayAgo } },
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } },
        take: 15,
      }),
      this.prisma.securityEvent.groupBy({
        by: ['ip'],
        where: { timestamp: { gte: oneDayAgo } },
        _count: { ip: true },
        orderBy: { _count: { ip: 'desc' } },
        take: 20,
      }),
      this.getHourlyTimeline(oneDayAgo),
      this.prisma.securityEvent.findMany({
        where: {
          timestamp: { gte: oneDayAgo },
          severity: { in: ['CRITICAL', 'HIGH'] },
        },
        orderBy: { timestamp: 'desc' },
        take: 20,
      }),
    ]);

    // Get banned IPs from fail2ban
    const bannedIps = this.getBannedIps();

    const defenseLayers = await this.getDefenseLayers();

    return {
      timestamp: now.getTime(),
      summary: {
        totalEvents24h: total24h,
        totalEvents7d: total7d,
        uniqueAttackers24h: uniqueIps24h.length,
        uniqueAttackers7d: uniqueIps7d.length,
        blockedIps: bannedIps.size,
        criticalEvents24h: critical24h,
      },
      defenseLayers,
      topCountries24h: topCountries.map((c) => {
        const geo = geoip.lookup('');
        return {
          country: c.country || 'Unknown',
          countryCode: c.country || '??',
          count: c._count.country,
        };
      }),
      topAttackTypes24h: topTypes.map((t) => ({
        type: t.type,
        count: t._count.type,
      })),
      topAttackerIps24h: topIps.map((ip) => ({
        ip: ip.ip,
        country: geoip.lookup(ip.ip)?.country || 'Unknown',
        countryCode: geoip.lookup(ip.ip)?.country || '??',
        count: ip._count.ip,
        banned: bannedIps.has(ip.ip),
      })),
      hourlyTimeline24h: hourlyTimeline,
      recentCritical,
    };
  }

  private async getHourlyTimeline(since: Date) {
    const events = await this.prisma.securityEvent.findMany({
      where: { timestamp: { gte: since } },
      select: { timestamp: true },
      orderBy: { timestamp: 'asc' },
    });

    const buckets: Record<string, number> = {};
    for (const e of events) {
      const hour = e.timestamp.toISOString().slice(0, 13);
      buckets[hour] = (buckets[hour] || 0) + 1;
    }

    return Object.entries(buckets).map(([hour, count]) => ({ hour, count }));
  }

  private getBannedIps(): Set<string> {
    const banned = new Set<string>();
    try {
      const jails = [
        'sshd',
        'honeypot',
        'modsecurity',
        'modsecurity-aggressive',
        'nginx-limit',
        'scanner-probe',
      ];
      for (const jail of jails) {
        try {
          const out = execSync(`fail2ban-client status ${jail} 2>/dev/null`, {
            encoding: 'utf-8',
            timeout: 3000,
          });
          const match = out.match(/Banned IP list:\s*(.*)/);
          if (match?.[1]) {
            match[1]
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .forEach((ip) => banned.add(ip));
          }
        } catch {}
      }
    } catch {}
    return banned;
  }

  private async getDefenseLayers(): Promise<DefenseLayer[]> {
    const layers: DefenseLayer[] = [];

    // 1. UFW Firewall
    layers.push({
      name: 'UFW Firewall',
      status: 'active',
      description: 'Network-level packet filtering',
      details: ['Port 22 (SSH), 80 (HTTP), 443 (HTTPS) open'],
      metrics: { policy: 1 },
    });

    // 2. fail2ban
    const f2b = this.threatIntel.getFail2banStatus();
    const totalBanned = Object.values(f2b.jails as Record<string, any>).reduce(
      (sum: number, j: any) => sum + (j.currentlyBanned || 0),
      0,
    );
    layers.push({
      name: 'fail2ban',
      status: f2b.active ? 'active' : 'inactive',
      description: 'Automated IP banning based on attack patterns',
      details: Object.entries(f2b.jails).map(
        ([name, j]: [string, any]) => {
          const bannedCount = j.currentlyBanned || 0;
          const tracking = j.currentlyFailed || 0;
          return `${name}: ${bannedCount} banned, ${tracking} tracking`;
        },
      ),
      metrics: {
        totalBanned,
        activeJails: Object.keys(f2b.jails).length,
      },
    });

    // 3. ModSecurity WAF
    const modsecRules = this.getModsecRuleCount();
    layers.push({
      name: 'ModSecurity WAF',
      status: 'active',
      description: 'Web Application Firewall with OWASP CRS',
      details: [
        `${modsecRules} rules loaded`,
        'OWASP CRS v3.3.5',
        'Custom rules: injection, SSRF, Log4Shell, scanners',
      ],
      metrics: { rules: modsecRules },
    });

    // 4. Nginx Rate Limiting
    layers.push({
      name: 'Nginx Rate Limits',
      status: 'active',
      description: 'Request rate throttling per IP',
      details: [
        'API zone: 30 req/s, burst 300',
        'General zone: 50 req/s, burst 500',
        'Auth zone: 10 req/s, burst 100',
      ],
      metrics: { zones: 3 },
    });

    // 5. Suricata IDS/IPS
    const suricataRules = this.getSuricataRuleCount();
    const suricataActive = this.isSuricataRunning();
    layers.push({
      name: 'Suricata IDS/IPS',
      status: suricataActive ? 'active' : 'inactive',
      description: 'Network intrusion detection and prevention',
      details: [
        `${suricataRules} rules loaded (ET Open + custom)`,
        'Monitoring eth0 in AF_PACKET mode',
        'EVE JSON logging to /var/log/suricata/eve.json',
        'Custom rules: SQLi, XSS, SSRF, XXE, scanners, Log4Shell',
      ],
      metrics: { rules: suricataRules },
    });

    // 6. Docker sandboxing
    layers.push({
      name: 'Docker Sandboxing',
      status: 'active',
      description: 'Lab environments isolated in containers',
      details: [
        'Backend runs with cap_drop ALL',
        'no-new-privileges enabled',
        'Resource limits: 2GB backend, 1GB frontend',
      ],
    });

    return layers;
  }

  private getModsecRuleCount(): number {
    try {
      const content = fs.readFileSync(
        '/etc/modsecurity/aeroacademy-rules.conf',
        'utf-8',
      );
      const matches = content.match(/^SecRule\s/gm);
      return matches?.length || 0;
    } catch {
      return 0;
    }
  }

  private getSuricataRuleCount(): number {
    try {
      const content = fs.readFileSync(
        '/var/lib/suricata/rules/suricata.rules',
        'utf-8',
      );
      return content.split('\n').filter((l) => l.trim() && !l.startsWith('#')).length;
    } catch {
      return 0;
    }
  }

  private isSuricataRunning(): boolean {
    try {
      const logPath = '/var/log/suricata/eve.json';
      if (!fs.existsSync(logPath)) return false;
      const stat = fs.statSync(logPath);
      // Check if log was written in the last 5 minutes
      return Date.now() - stat.mtimeMs < 5 * 60 * 1000;
    } catch {
      return false;
    }
  }
}
