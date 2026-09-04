import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import * as fs from 'fs';
import { execSync } from 'child_process';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const geoip = require('geoip-lite');

export interface ThreatRecord {
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
  method: string;
  data: string;
  source: 'modsecurity' | 'nginx-block' | 'nginx-rate-limit' | 'suricata';
}

export interface ThreatSummary {
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

@Injectable()
export class ThreatIntelService {
  private readonly logger = new Logger(ThreatIntelService.name);
  private threats: ThreatRecord[] = [];
  private readonly maxRecords = 100000;
  private lastModsecurityPos = 0;
  private lastNginxPos = 0;
  private lastSuricataPos = 0;

  private modsecurityLog =
    '/var/log/modsecurity/modsec_audit.log';
  private nginxErrorLog = '/var/log/nginx/error.log';
  private suricataEve = '/var/log/suricata/eve.json';

  constructor() {
    // Initial parse on startup
    setTimeout(() => this.parseLogs(), 2000);
  }

  @Interval(30000)
  periodicParse() {
    this.parseLogs();
  }

  private parseLogs() {
    this.parseModsecurityLog();
    this.parseNginxErrorLog();
    this.parseSuricataEve();
  }

  private parseModsecurityLog() {
    try {
      if (!fs.existsSync(this.modsecurityLog)) return;
      const stat = fs.statSync(this.modsecurityLog);
      if (stat.size <= this.lastModsecurityPos) return;

      const fd = fs.openSync(this.modsecurityLog, 'r');
      const bufferSize = stat.size - this.lastModsecurityPos;
      const buffer = Buffer.alloc(Math.min(bufferSize, 10 * 1024 * 1024));
      fs.readSync(fd, buffer, 0, buffer.length, this.lastModsecurityPos);
      fs.closeSync(fd);
      this.lastModsecurityPos = stat.size;

      const content = buffer.toString('utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        if (!line.includes('[id "') && !line.includes('ModSecurity:')) continue;

        const ruleMatch = line.match(/\[id "(\d+)"\]/);
        const msgMatch = line.match(/\[msg "([^"]+)"\]/);
        const uriMatch = line.match(/\[uri "([^"]+)"\]/);
        const dataMatch = line.match(/\[data "([^"]*)"\]/);
        const hostnameMatch = line.match(/\[hostname "([^"]+)"\]/);
        const codeMatch = line.match(/code (\d{3})/);

        if (!ruleMatch && !msgMatch) continue;

        let ip = hostnameMatch?.[1] || 'unknown';
        if (ip === 'localhost' || ip === '::1') ip = '127.0.0.1';

        const status = Number(codeMatch?.[1] || 403);
        const msg = msgMatch?.[1] || '';
        const type = this.classifyAttack(ruleMatch?.[1] || '', msg, line);
        const geo = geoip.lookup(ip);

        this.threats.push({
          timestamp: Date.now(),
          ip,
          country: geo?.country || 'Unknown',
          countryCode: geo?.country || '??',
          city: geo?.city || 'Unknown',
          type,
          severity: this.getSeverity(type, status),
          ruleId: ruleMatch?.[1] || '',
          msg,
          uri: uriMatch?.[1] || '',
          method: '',
          data: dataMatch?.[1] || '',
          source: 'modsecurity',
        });
      }
    } catch (err) {
      this.logger.error('Failed to parse ModSecurity log', err);
    }
  }

  private parseNginxErrorLog() {
    try {
      if (!fs.existsSync(this.nginxErrorLog)) return;
      const stat = fs.statSync(this.nginxErrorLog);
      if (stat.size <= this.lastNginxPos) return;

      const fd = fs.openSync(this.nginxErrorLog, 'r');
      const bufferSize = stat.size - this.lastNginxPos;
      const buffer = Buffer.alloc(Math.min(bufferSize, 10 * 1024 * 1024));
      fs.readSync(fd, buffer, 0, buffer.length, this.lastNginxPos);
      fs.closeSync(fd);
      this.lastNginxPos = stat.size;

      const lines = buffer.toString('utf-8').split('\n');
      for (const line of lines) {
        if (!line.includes('ModSecurity')) continue;

        const ipMatch = line.match(/client: (\S+)/);
        const codeMatch = line.match(/code (\d+)/);
        const msgMatch = line.match(/\[msg "([^"]+)"\]/);
        const uriMatch = line.match(/request: "(\S+)/);

        if (!ipMatch) continue;
        const ip = ipMatch[1];
        const geo = geoip.lookup(ip);
        const status = Number(codeMatch?.[1] || 403);
        const msg = msgMatch?.[1] || '';

        const type = this.classifyAttack('', msg, line);

        this.threats.push({
          timestamp: Date.now(),
          ip,
          country: geo?.country || 'Unknown',
          countryCode: geo?.country || '??',
          city: geo?.city || 'Unknown',
          type,
          severity: this.getSeverity(type, status),
          ruleId: '',
          msg,
          uri: uriMatch?.[1] || '',
          method: '',
          data: '',
          source: status === 429 ? 'nginx-rate-limit' : 'nginx-block',
        });
      }
    } catch (err) {
      this.logger.error('Failed to parse nginx error log', err);
    }
  }

  private parseSuricataEve() {
    try {
      if (!fs.existsSync(this.suricataEve)) return;
      const stat = fs.statSync(this.suricataEve);
      if (stat.size <= this.lastSuricataPos) return;

      const fd = fs.openSync(this.suricataEve, 'r');
      const bufferSize = stat.size - this.lastSuricataPos;
      const buffer = Buffer.alloc(Math.min(bufferSize, 10 * 1024 * 1024));
      fs.readSync(fd, buffer, 0, buffer.length, this.lastSuricataPos);
      fs.closeSync(fd);
      this.lastSuricataPos = stat.size;

      const lines = buffer.toString('utf-8').split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          if (event.event_type !== 'alert') continue;

          const ip = event.src_ip || event.dest_ip || 'unknown';
          const geo = geoip.lookup(ip);
          const alert = event.alert || {};

          const type = this.classifyAttack(
            String(alert.signature_id || ''),
            alert.signature || '',
            JSON.stringify(alert),
          );

          this.threats.push({
            timestamp: event.timestamp
              ? new Date(event.timestamp).getTime()
              : Date.now(),
            ip,
            country: geo?.country || 'Unknown',
            countryCode: geo?.country || '??',
            city: geo?.city || 'Unknown',
            type,
            severity: this.getSuricataSeverity(alert.severity || 3),
            ruleId: String(alert.signature_id || ''),
            msg: alert.signature || 'Suricata alert',
            uri: event.http?.url || '',
            method: event.http?.http_method || '',
            data: JSON.stringify({
              category: alert.category || '',
              action: alert.action || '',
              protocol: event.proto || '',
              srcPort: event.src_port,
              destPort: event.dest_port,
              communityId: event.community_id || '',
            }),
            source: 'suricata',
          });
        } catch {}
      }
    } catch (err) {
      this.logger.error('Failed to parse Suricata EVE log', err);
    }
  }

  private getSuricataSeverity(severity: number): string {
    if (severity <= 1) return 'CRITICAL';
    if (severity <= 2) return 'HIGH';
    if (severity <= 3) return 'MEDIUM';
    return 'LOW';
  }

  private classifyAttack(
    ruleId: string,
    msg: string,
    raw: string,
  ): string {
    const text = `${ruleId} ${msg} ${raw}`.toLowerCase();

    if (text.includes('sql') || text.includes('sqli') || text.includes('union') || text.includes('select'))
      return 'SQL Injection';
    if (text.includes('xss') || text.includes('cross-site') || text.includes('<script'))
      return 'XSS';
    if (text.includes('rce') || text.includes('command injection') || text.includes('exec'))
      return 'Command Injection';
    if (text.includes('ssrf') || text.includes('internal ip') || text.includes('169.254'))
      return 'SSRF';
    if (text.includes('lfi') || text.includes('path traversal') || text.includes('directory'))
      return 'Path Traversal';
    if (text.includes('scanner') || text.includes('penetration') || text.includes('nikto') || text.includes('nmap') || text.includes('metasploit') || text.includes('burp'))
      return 'Scanner/Recon';
    if (text.includes('429') || text.includes('rate limit') || text.includes('automated attack'))
      return 'Rate Limit Hit';
    if (text.includes('null byte') || text.includes('obfuscation'))
      return 'Obfuscation';
    if (text.includes('log4shell') || text.includes('jndi') || text.includes('ldap'))
      return 'Log4Shell/RCE';
    if (text.includes('nosql') || text.includes('mongodb'))
      return 'NoSQL Injection';
    if (text.includes('prototype pollution'))
      return 'Prototype Pollution';
    if (text.includes('xxe') || text.includes('xml'))
      return 'XXE';
    if (text.includes('ldap'))
      return 'LDAP Injection';
    if (text.includes('404') || text.includes('enumeration'))
      return 'Enumeration';
    if (text.includes('444') || text.includes('honeypot'))
      return 'Honeypot Hit';
    if (text.includes('block') || text.includes('deny'))
      return 'Blocked Request';

    return 'Other';
  }

  private getSeverity(type: string, status: number): string {
    if (['SQL Injection', 'XSS', 'Command Injection', 'SSRF', 'Log4Shell/RCE'].includes(type))
      return 'CRITICAL';
    if (['Path Traversal', 'NoSQL Injection', 'XXE', 'LDAP Injection'].includes(type))
      return 'HIGH';
    if (['Scanner/Recon', 'Obfuscation', 'Prototype Pollution'].includes(type))
      return 'MEDIUM';
    if (status === 429) return 'LOW';
    return 'INFO';
  }

  getSummary(): ThreatSummary {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recent = this.threats.filter((t) => t.timestamp > oneHourAgo);

    // Country aggregation
    const countryMap = new Map<
      string,
      { country: string; countryCode: string; count: number }
    >();
    for (const t of recent) {
      const key = t.countryCode;
      const existing = countryMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        countryMap.set(key, {
          country: t.country,
          countryCode: t.countryCode,
          count: 1,
        });
      }
    }
    const topCountries = Array.from(countryMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Attack type aggregation
    const typeMap = new Map<string, number>();
    for (const t of recent) {
      typeMap.set(t.type, (typeMap.get(t.type) || 0) + 1);
    }
    const topAttackTypes = Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // IP aggregation
    const ipMap = new Map<
      string,
      {
        ip: string;
        country: string;
        countryCode: string;
        count: number;
        types: Set<string>;
      }
    >();
    for (const t of recent) {
      const existing = ipMap.get(t.ip);
      if (existing) {
        existing.count++;
        existing.types.add(t.type);
      } else {
        ipMap.set(t.ip, {
          ip: t.ip,
          country: t.country,
          countryCode: t.countryCode,
          count: 1,
          types: new Set([t.type]),
        });
      }
    }
    const topAttackerIps = Array.from(ipMap.values())
      .map((v) => ({ ...v, types: Array.from(v.types) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    // Timeline (per minute)
    const minuteBuckets = new Map<number, number>();
    for (const t of recent) {
      const mk = Math.floor(t.timestamp / 60000);
      minuteBuckets.set(mk, (minuteBuckets.get(mk) || 0) + 1);
    }
    const timeline = Array.from(minuteBuckets.entries())
      .map(([minute, count]) => ({ minute, count }))
      .sort((a, b) => a.minute - b.minute);

    // Severity breakdown
    const severityBreakdown: Record<string, number> = {};
    for (const t of recent) {
      severityBreakdown[t.severity] =
        (severityBreakdown[t.severity] || 0) + 1;
    }

    // Unique attacker IPs
    const uniqueIps = new Set(recent.map((t) => t.ip));

    // Top blocked endpoint
    const endpointMap = new Map<string, number>();
    for (const t of recent) {
      if (t.uri) endpointMap.set(t.uri, (endpointMap.get(t.uri) || 0) + 1);
    }
    const topEndpoint = Array.from(endpointMap.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0];

    return {
      totalAttacks: recent.length,
      uniqueAttackerIps: uniqueIps.size,
      topCountries,
      topAttackTypes,
      topAttackerIps,
      timeline,
      severityBreakdown,
      recentAttacks: recent
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50),
      hourStats: {
        totalBlocked: recent.length,
        uniqueIps: uniqueIps.size,
        topBlockedEndpoint: topEndpoint?.[0] || 'N/A',
      },
    };
  }

  getIpDetail(ip: string) {
    const geo = geoip.lookup(ip);
    const attacks = this.threats
      .filter((t) => t.ip === ip)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100);

    const typeBreakdown = new Map<string, number>();
    for (const t of attacks) {
      typeBreakdown.set(t.type, (typeBreakdown.get(t.type) || 0) + 1);
    }

    return {
      ip,
      geo: {
        country: geo?.country || 'Unknown',
        countryCode: geo?.country || '??',
        city: geo?.city || 'Unknown',
        region: geo?.region || 'Unknown',
        ll: geo?.ll || [0, 0],
      },
      totalAttacks: attacks.length,
      typeBreakdown: Array.from(typeBreakdown.entries()).map(
        ([type, count]) => ({ type, count }),
      ),
      recentAttacks: attacks.slice(0, 20),
    };
  }

  getFail2banStatus() {
    try {
      const statusFile = '/var/log/fail2ban-status.json';
      if (fs.existsSync(statusFile)) {
        const content = fs.readFileSync(statusFile, 'utf-8');
        return JSON.parse(content);
      }

      const statusRaw = execSync('fail2ban-client status 2>/dev/null', {
        encoding: 'utf-8',
        timeout: 5000,
      });

      const jails: Record<string, any> = {};
      const jailMatch = statusRaw.match(/Jail list:\s+(.+)/);
      const jailNames = jailMatch
        ? jailMatch[1].split(',').map((j) => j.trim())
        : [];

      for (const jail of jailNames) {
        try {
          const jailStatus = execSync(
            `fail2ban-client status ${jail} 2>/dev/null`,
            { encoding: 'utf-8', timeout: 5000 },
          );
          const bannedMatch = jailStatus.match(
            /Currently banned:\s+(\d+)/,
          );
          const totalMatch = jailStatus.match(/Total banned:\s+(\d+)/);
          const failedMatch = jailStatus.match(
            /Currently failed:\s+(\d+)/,
          );
          const bannedIpMatch = jailStatus.match(
            /Banned IP list:\s*(.*)/,
          );

          jails[jail] = {
            currentlyBanned: parseInt(bannedMatch?.[1] || '0'),
            totalBanned: parseInt(totalMatch?.[1] || '0'),
            currentlyFailed: parseInt(failedMatch?.[1] || '0'),
            bannedIps: bannedIpMatch?.[1]
              ? bannedIpMatch[1].trim().split(/\s+/).filter(Boolean)
              : [],
          };
        } catch {
          jails[jail] = { error: 'Failed to get status' };
        }
      }

      return { active: true, jails };
    } catch {
      return { active: false, jails: {} };
    }
  }
}
