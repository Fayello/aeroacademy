import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Reclassify Labs — difficulty re-evaluation based on technical complexity,
 * prerequisites, and estimated time.
 *
 * Criteria:
 * - BEGINNER 800-1100: Single service, guided, no prerequisites, 60min,
 *   fundamentals/beginner in title, single-concept hardening
 * - INTERMEDIATE 1150-1300: 2-3 services, basic HA, requires BEGINNER,
 *   60-90min, exploitation with guidance, cloud IAM, 2-tier setups
 * - ADVANCED 1350-1500: Distributed/clustered, 3+ nodes, requires INTERMEDIATE,
 *   90-120min, advanced exploitation, multi-region, compliance
 * - EXPERT 1550-1700: Research-level, kernel, crypto side-channels, multi-cloud
 *   Red Team, requires ADVANCED, 90-120min
 */

function getLevel(difficulty: number): 1 | 4 | 7 | 10 {
  if (difficulty <= 1100) return 1;
  if (difficulty <= 1300) return 4;
  if (difficulty <= 1500) return 7;
  return 10;
}

function levelLabel(lvl: number): string {
  switch (lvl) {
    case 1:
      return 'BEGINNER';
    case 4:
      return 'INTERMEDIATE';
    case 7:
      return 'ADVANCED';
    case 10:
      return 'EXPERT';
    default:
      return `LVL_${lvl}`;
  }
}

/**
 * Compute distribution by level 1/4/7/10.
 */
function distribution(labs: Array<{ difficulty: number }>): Record<number, number> {
  const dist: Record<number, number> = { 1: 0, 4: 0, 7: 0, 10: 0 };
  for (const l of labs) {
    const lvl = getLevel(l.difficulty);
    dist[lvl] = (dist[lvl] ?? 0) + 1;
  }
  return dist;
}

function formatDist(d: Record<number, number>): string {
  return `LVL 1 (BEGINNER 800-1100): ${d[1]} | LVL 4 (INTERMEDIATE 1150-1300): ${d[4]} | LVL 7 (ADVANCED 1350-1500): ${d[7]} | LVL 10 (EXPERT 1550-1700): ${d[10]}`;
}

// Exact known misclassifications — highest priority.
// Key is lower-cased substring to match; value is corrected difficulty.
const EXACT_OVERRIDES: Array<{ match: string; difficulty: number }> = [
  { match: 'docker & container fundamentals', difficulty: 900 },
  { match: 'kubernetes pod security & admission control', difficulty: 1350 },
  { match: 'kubernetes pod security', difficulty: 1350 },
  { match: 'redis exploitation & hardening', difficulty: 1250 },
  { match: 'penetration testing methodology (ptes)', difficulty: 1100 },
  { match: 'penetration testing methodology', difficulty: 1100 },
  { match: 'network security: firewalls, vpns & ids/ips', difficulty: 1300 },
  { match: 'high availability with keepalived & haproxy', difficulty: 1300 },
  { match: 'penetration testing: metasploitable practice', difficulty: 1400 },
  { match: 'linux security auditing with openscap', difficulty: 1200 },
  { match: 'system hardening: cis benchmarks', difficulty: 1300 },
  { match: 'kubernetes cluster setup', difficulty: 1400 },
  { match: 'kali linux: vulnerability scanning & exploitation', difficulty: 1300 },
  { match: 'kali linux: vulnerability scanning', difficulty: 1300 },
  { match: 'linux kernel debugging & tracing', difficulty: 1500 },
  { match: 'parrot security os: privacy & forensics', difficulty: 1200 },
  { match: 'parrot security os', difficulty: 1200 },
  { match: 'elk pipeline', difficulty: 1350 },
  { match: 'filebeat to kibana', difficulty: 1350 },
  { match: 'secure logging, monitoring & incident response', difficulty: 1350 },
  { match: 'iscsi san', difficulty: 1300 },
  { match: 'nfsv4 ha with drbd', difficulty: 1350 },
  { match: 'keepalived vrrp', difficulty: 1200 },
  { match: 'prometheus + alertmanager', difficulty: 1100 },
  { match: 'monitoring stack: prometheus & grafana', difficulty: 1100 },
  { match: 'bind9 master-slave', difficulty: 1150 },
  { match: 'snipe-it', difficulty: 850 },
  { match: 'postfix + dovecot', difficulty: 1250 },
  { match: 'mail server with postfix & dovecot', difficulty: 1250 },
  { match: 'mariadb galera', difficulty: 1450 },
  { match: 'postgres streaming replication', difficulty: 1350 },
  { match: 'database administration: postgresql', difficulty: 1350 },
  { match: 'docker swarm overlay', difficulty: 1200 },
  { match: 'k8s ingress with cert-manager', difficulty: 1350 },
  { match: 'terraform multi-region vpc', difficulty: 1300 },
  { match: 'ansible fleet', difficulty: 1000 },
  { match: 'linux automation: ansible & bash scripting', difficulty: 1000 },
  { match: 'saml & sso', difficulty: 1250 },
  { match: 'bug bounty methodology', difficulty: 1200 },
  // crypto bumps
  { match: 'blockchain & cryptocurrency security', difficulty: 1300 },
  { match: 'blockchain', difficulty: 1300 },
  { match: 'side-channel attack analysis', difficulty: 1350 },
  { match: 'side channel', difficulty: 1350 },
  { match: 'symmetric encryption & key management', difficulty: 1000 },
  { match: 'symmetric encryption', difficulty: 1000 },
];

/**
 * Title-based keyword rules for auto-classification of remaining labs.
 * Each entry maps a lower-case substring / pattern to a target difficulty.
 * Ordered from most specific (advanced/expert) to general (beginner) so
 * first match wins where multiple could apply — but EXACT_OVERRIDES run first.
 */
const KEYWORD_RULES: Array<{ keywords: string[]; difficulty: number; note: string }> = [
  // ADVANCED high — distributed / clustered / compliance
  { keywords: ['galera', 'mariadb galera cluster'], difficulty: 1450, note: 'Galera clustered DB = advanced high' },
  { keywords: ['kubernetes pod security', 'admission control', 'gatekeeper', 'kyverno', 'psa configurer'], difficulty: 1350, note: 'K8s admission/policy = advanced' },
  { keywords: ['k8s ingress with cert-manager', 'ingress with cert-manager', 'helm chart security'], difficulty: 1350, note: 'Ingress+cert = advanced' },
  { keywords: ['cilium deployer', 'cilium', 'service mesh security', 'istio installer', 'mtls enforcer'], difficulty: 1400, note: 'Service mesh / Cilium = advanced' },
  { keywords: ['container escape', 'runtime exploitation', 'cgroup escaper', 'privileged escaper'], difficulty: 1450, note: 'Container escape = advanced' },
  { keywords: ['falco installer', 'falco deployer', 'runtime protection with sysdig/falco'], difficulty: 1400, note: 'Runtime protection = advanced' },
  { keywords: ['kubernetes cluster setup', 'kubectl get nodes', 'kubeadm'], difficulty: 1400, note: 'Cluster setup = advanced' },
  { keywords: ['cron exploitation', 'privilege escalation on linux', 'suid exploiter'], difficulty: 1500, note: 'Cron privesc = advanced top' },
  { keywords: ['linux kernel debugging', 'linux kernel & system internals', 'strace output', 'perf stat', 'flame graph'], difficulty: 1500, note: 'Kernel debugging = advanced top' },
  { keywords: ['penetration testing: metasploitable', 'web server exploitation with metasploitable', 'metasploitable practice'], difficulty: 1400, note: 'Guided metasploitable = advanced not expert' },
  { keywords: ['bgp security', 'route hijacking defense', 'rpkI deployer'], difficulty: 1400, note: 'BGP hijacking = advanced' },
  { keywords: ['packet analysis with wireshark', 'tshark', 'packet analysis'], difficulty: 1300, note: 'Wireshark analysis = intermediate-advanced border' },
  { keywords: ['network segmentation with vlans', 'vlan creator', 'bridge builder'], difficulty: 1250, note: 'VLAN segmentation = intermediate' },
  { keywords: ['elk pipeline', 'filebeat to kibana', 'elk deployer', 'centralized logging: rsyslog'], difficulty: 1350, note: 'ELK pipeline = advanced' },
  { keywords: ['nfsv4 ha with drbd', 'nfs & samba file sharing', 'drbd'], difficulty: 1350, note: 'DRBD HA = advanced' },
  { keywords: ['keepalived vrrp', 'haproxy.cfg', 'keepalived & haproxy'], difficulty: 1200, note: 'VRRP basic HA = intermediate' },
  { keywords: ['postgres streaming replication', 'wal archive status', 'pg_hba.conf'], difficulty: 1350, note: 'Postgres replication = advanced intro' },
  { keywords: ['lvm & raid', 'raid builder', 'volume creator'], difficulty: 1300, note: 'LVM+RAID = intermediate-advanced' },
  { keywords: ['terraform multi-region', 'multi-region vpc'], difficulty: 1300, note: 'Multi-region = intermediate-advanced' },
  { keywords: ['terraform security & iac scanning', 'iac scanning'], difficulty: 1300, note: 'IaC scanning = intermediate-advanced' },
  { keywords: ['saml & sso', 'oauth 2.0 & oidc', 'rbac design'], difficulty: 1250, note: 'SSO/SAML = intermediate' },
  { keywords: ['bug bounty methodology', 'subdomain finder', 'js analyzer'], difficulty: 1200, note: 'Methodology = intermediate' },
  { keywords: ['penetration testing methodology', 'ptes', 'ptes info gatherer'], difficulty: 1100, note: 'PTES methodology = intermediate intro' },
  { keywords: ['compliance testing & security auditing', 'cis scanner', 'cis benchmarks'], difficulty: 1300, note: 'CIS/compliance = intermediate-advanced' },
  { keywords: ['linux security auditing with openscap', 'openscap scan'], difficulty: 1200, note: 'Auditing = intermediate' },
  { keywords: ['network security: firewalls, vpns & ids/ips', 'firewall builder', 'ids architect'], difficulty: 1300, note: 'Overview security = intermediate-advanced' },
  { keywords: ['docker swarm overlay', 'docker swarm'], difficulty: 1200, note: 'Swarm = intermediate' },
  { keywords: ['bind9 master-slave', 'dns server administration with bind9', 'bind9'], difficulty: 1150, note: 'DNS replication = intermediate intro' },
  { keywords: ['dns security & cache poisoning', 'dns installer', 'dnssec enabler'], difficulty: 950, note: 'DNS caching = beginner-intermediate' },
  { keywords: ['prometheus + alertmanager', 'prometheus & grafana', 'monitoring stack'], difficulty: 1100, note: 'Prometheus overview = beginner-intermediate border' },
  { keywords: ['postfix + dovecot', 'mail server with postfix'], difficulty: 1250, note: 'Mail stack = intermediate' },
  { keywords: ['high availability with keepalived', 'keepalived & haproxy'], difficulty: 1300, note: 'Basic HA = intermediate' },
  { keywords: ['intrusion detection with suricata', 'suricata', 'ids installer'], difficulty: 1100, note: 'Suricata IDS = intermediate intro' },
  { keywords: ['wireless network security assessment', 'aircrack-ng', 'monitor mode'], difficulty: 1150, note: 'Wireless assessment = intermediate' },
  { keywords: ['ddos mitigation', 'traffic analysis', 'syn cookie'], difficulty: 1200, note: 'DDoS mitigation = intermediate' },
  { keywords: ['kali linux: reconnaissance & osint', 'nmap', 'host finder'], difficulty: 850, note: 'Nmap recon = beginner' },
  { keywords: ['kali linux: vulnerability scanning & exploitation', 'vulnerability scanning'], difficulty: 1300, note: 'Scanning = intermediate' },
  { keywords: ['parrot security os', 'parrot'], difficulty: 1200, note: 'Parrot OS overview = intermediate' },
  { keywords: ['firewall configuration with iptables', 'iptables -p input drop', 'policy setter'], difficulty: 800, note: 'iptables single service = beginner' },
  { keywords: ['docker & container fundamentals', 'container runner', 'dockerfile author'], difficulty: 900, note: 'Docker fundamentals = beginner' },
  { keywords: ['linux fundamentals: ubuntu cli', 'ubuntu cli mastery'], difficulty: 800, note: 'Ubuntu CLI = beginner 800' },
  { keywords: ['linux fundamentals: file permissions', 'file permissions & users'], difficulty: 900, note: 'File perms = beginner 900' },
  { keywords: ['linux fundamentals: text processing', 'text processing & shell scripting'], difficulty: 1000, note: 'Text processing = beginner 1000' },
  { keywords: ['linux fundamentals: process & service management', 'process & service management'], difficulty: 1100, note: 'Process management = beginner 1100' },
  { keywords: ['systemd service hardening', 'protectsystem=strict', 'capability dropper'], difficulty: 1200, note: 'Single service hardening = intermediate' },
  { keywords: ['server administration: debian server hardening', 'debian server hardening'], difficulty: 1200, note: 'Debian hardening = intermediate' },
  { keywords: ['server administration: centos', 'centos/rhel management'], difficulty: 1250, note: 'CentOS mgmt = intermediate' },
  { keywords: ['server administration: web servers & nginx', 'nginx mastery', 'vhost builder'], difficulty: 1300, note: 'Nginx mastery = intermediate-advanced' },
  { keywords: ['server administration: storage & filesystems', 'storage & filesystems', 'pv creator'], difficulty: 1350, note: 'Storage/LVM = advanced intro' },
  { keywords: ['kali linux: reconnaissance', 'reconnaissance & osint'], difficulty: 850, note: 'Recon = beginner' },
  // crypto / blockchain advanced bumps already in overrides but also generic:
  { keywords: ['blockchain & cryptocurrency', 'slither auditor', 'reentrancy exploiter'], difficulty: 1300, note: 'Blockchain = advanced' },
  { keywords: ['side-channel', 'timing attacker', 'cache analyzer', 'constant-time enforcer'], difficulty: 1350, note: 'Side-channel = advanced' },
  { keywords: ['symmetric encryption & key management', 'file encryptor', 'pbkdf2 deriver'], difficulty: 1000, note: 'Symmetric crypto = beginner-intermediate' },
  { keywords: ['asymmetric encryption & pki', 'rsa generator', 'ca builder'], difficulty: 1100, note: 'Asymmetric/PKI = intermediate intro' },
  { keywords: ['hashing & password security', 'bcrypt hasher', 'argon2'], difficulty: 1000, note: 'Hashing = beginner-intermediate' },
  { keywords: ['tls protocol analysis', 'downgrade attack', 'poodle tester'], difficulty: 1150, note: 'TLS analysis = intermediate' },
  { keywords: ['quantum-resistant cryptography', 'kyber deployer'], difficulty: 1450, note: 'PQC = advanced high' },
  { keywords: ['steganography & covert channel', 'steghide extractor'], difficulty: 1200, note: 'Steganography = intermediate' },
  // web exploitation progressive
  { keywords: ['owasp juice shop: beginner', 'juice shop: beginner', 'bkimminich/juice-shop'], difficulty: 800, note: 'Juice Shop beginner keep 800' },
  { keywords: ['owasp juice shop', 'juice shop', 'scoreboard hunter'], difficulty: 800, note: 'Juice Shop beginner keep' },
  { keywords: ['web exploitation sandbox', 'vulnerables/web-dvwa', 'dvwa'], difficulty: 800, note: 'DVWA beginner keep' },
  { keywords: ['sql injection deep dive', 'union extractor', 'blind oracle'], difficulty: 950, note: 'SQLi deep dive = beginner-intermediate' },
  { keywords: ['cross-site scripting (xss) exploitation', 'reflected xss', 'stored xss'], difficulty: 900, note: 'XSS exploitation = beginner-intermediate' },
  { keywords: ['api security testing (rest & graphql)', 'bola exploiter'], difficulty: 1050, note: 'API security = intermediate intro' },
  { keywords: ['file upload vulnerabilities', 'mime bypasser'], difficulty: 900, note: 'File upload = beginner-intermediate' },
  { keywords: ['server-side request forgery (ssrf)', 'metadata accessor'], difficulty: 1150, note: 'SSRF = intermediate' },
  { keywords: ['insecure deserialization', 'php injector', 'java gadget'], difficulty: 1200, note: 'Deserialization = intermediate' },
  { keywords: ['redis exploitation & hardening', 'redis'], difficulty: 1250, note: 'Redis exploitation = intermediate' },
  { keywords: ['mongodb nosql injection', 'operator injector'], difficulty: 1150, note: 'Mongo injection = intermediate' },
  { keywords: ['database encryption at rest', 'column encryptor'], difficulty: 1200, note: 'DB encryption = intermediate' },
  { keywords: ['aws iam security & policy analysis', 'iam enumerator'], difficulty: 1200, note: 'IAM security = intermediate' },
  { keywords: ['container image scanning & registry security', 'trivy scanner'], difficulty: 1150, note: 'Image scanning = intermediate intro' },
  { keywords: ['kubernetes security hardening', 'rbac auditor', 'network isolator'], difficulty: 1350, note: 'K8s hardening = advanced' },
  { keywords: ['secrets management with hashicorp vault', 'vault initializer'], difficulty: 1250, note: 'Vault secrets = intermediate' },
  { keywords: ['multi-cloud identity federation', 'idp configurer'], difficulty: 1300, note: 'Multi-cloud federation = intermediate-advanced' },
  { keywords: ['git repository security & secret scanning', 'trufflehog scanner'], difficulty: 1100, note: 'Git secret scanning = intermediate intro' },
  { keywords: ['ci/cd pipeline security', 'workflow auditor'], difficulty: 1200, note: 'CI/CD security = intermediate' },
  { keywords: ['snipe-it', 'snipe-it asset'], difficulty: 850, note: 'Snipe-IT very beginner' },
];

/**
 * Classify lab difficulty based on title keyword matching + estimatedMinutes.
 * Priority:
 * 1) Exact overrides (known misclassifications)
 * 2) Juice Shop / DVWA beginner keep (800-900)
 * 3) Crypto side-channel / blockchain bumps
 * 4) Generic keyword rules
 * 5) EstimatedMinutes heuristic fallback
 * 6) Keep current if no rule matches
 */
export function classify(title: string, estimatedMinutes: number | null | undefined, currentDifficulty: number): number {
  const lower = title.toLowerCase().trim();
  const mins = estimatedMinutes ?? 60;

  // 1) Exact overrides — substring match (covers title variants)
  for (const o of EXACT_OVERRIDES) {
    if (lower.includes(o.match)) {
      return o.difficulty;
    }
  }

  // 2) Juice Shop / DVWA beginner labs at 800-900 correct — keep
  if (lower.includes('juice shop') || lower.includes('dvwa')) {
    if (currentDifficulty >= 800 && currentDifficulty <= 900) return currentDifficulty;
    // if mis-set outside beginner, force beginner midpoint
    if (currentDifficulty < 800) return 800;
    if (currentDifficulty > 1100) return 850;
  }
  if (lower.includes('webgoat') && lower.includes('enterprise java')) {
    // WebGoat enterprise is higher than beginner
    return 1200;
  }

  // 3) Crypto advanced bumps (if not already overridden)
  // Blockchain at 1050-1100 should be 1300-1400
  if (lower.includes('blockchain') && currentDifficulty < 1300) {
    return 1300;
  }
  if ((lower.includes('side-channel') || lower.includes('side channel')) && currentDifficulty < 1350) {
    return 1350;
  }
  // 4) Generic keyword rules — first match wins (ordered by specificity)
  for (const rule of KEYWORD_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return rule.difficulty;
      }
    }
  }

  // 5) Fallback heuristic using estimatedMinutes + current level hint
  // Beginner 60min, intermediate 60-90, advanced 90-120
  // Also consider currentDifficulty tier to avoid huge jumps for unknown labs.
  if (mins <= 60) {
    // single service, guided, no prereqs
    if (lower.includes('hardening') || lower.includes('compliance') || lower.includes('cis')) return 1200;
    if (lower.includes('exploitation') || lower.includes('injection')) return 1150;
    return 900;
  }
  if (mins <= 75) {
    if (lower.includes('cluster') || lower.includes('distributed') || lower.includes('replication')) return 1350;
    if (lower.includes('exploitation') || lower.includes('hardening')) return 1250;
    return 1100;
  }
  if (mins <= 90) {
    if (lower.includes('kernel') || lower.includes('side-channel') || lower.includes('crypto')) return 1400;
    if (lower.includes('multi-region') || lower.includes('multi-cloud') || lower.includes('ha ') || lower.includes('high availability')) return 1350;
    return 1300;
  }
  // 90-120 advanced/expert
  if (mins <= 120) {
    if (lower.includes('kernel') || lower.includes('red team') || lower.includes('research')) return 1550;
    return 1400;
  }

  // 6) No rule matched — keep current
  return currentDifficulty;
}

async function main(): Promise<void> {
  console.log('=== Lab Difficulty Reclassification ===');
  console.log('Criteria:');
  console.log('  BEGINNER 800-1100: Single service, guided, no prereqs, 60min');
  console.log('  INTERMEDIATE 1150-1300: 2-3 services, basic HA, requires BEGINNER, 60-90min');
  console.log('  ADVANCED 1350-1500: Distributed/clustered, 3+ nodes, requires INTERMEDIATE, 90-120min');
  console.log('  EXPERT 1550-1700: Research-level, kernel, crypto side-channels, multi-cloud Red Team, 90-120min');
  console.log('');

  const labs = await prisma.lab.findMany({
    select: { id: true, title: true, difficulty: true, estimatedMinutes: true },
    orderBy: { title: 'asc' },
  });

  console.log(`Fetched ${labs.length} labs (expected 177).`);

  const beforeDist = distribution(labs);
  console.log('Distribution BEFORE: ' + formatDist(beforeDist));
  for (const lvl of [1, 4, 7, 10] as const) {
    console.log(`  ${levelLabel(lvl)} (lvl ${lvl}): ${beforeDist[lvl]} labs`);
  }

  type Change = { id: string; title: string; from: number; to: number; minutes: number | null; fromLvl: number; toLvl: number };

  const changes: Change[] = [];
  const kept: Array<{ title: string; difficulty: number }> = [];

  for (const lab of labs) {
    const corrected = classify(lab.title, lab.estimatedMinutes ?? undefined, lab.difficulty);
    if (corrected !== lab.difficulty) {
      changes.push({
        id: lab.id,
        title: lab.title,
        from: lab.difficulty,
        to: corrected,
        minutes: lab.estimatedMinutes ?? null,
        fromLvl: getLevel(lab.difficulty),
        toLvl: getLevel(corrected),
      });
    } else {
      kept.push({ title: lab.title, difficulty: lab.difficulty });
    }
  }

  console.log('');
  console.log(`Detected ${changes.length} misclassified labs, ${kept.length} correctly classified.`);

  if (changes.length > 0) {
    console.log('');
    console.log('--- Changes (title | minutes | current -> corrected | lvl) ---');
    // sort by from difficulty for readability
    changes.sort((a, b) => a.from - b.from);
    for (const c of changes) {
      const lvlChange = c.fromLvl !== c.toLvl ? ` [${levelLabel(c.fromLvl)}->${levelLabel(c.toLvl)}]` : '';
      console.log(`  ${c.title} | ${c.minutes ?? '?'}min | ${c.from} -> ${c.to}${lvlChange}`);
    }

    console.log('');
    console.log('Applying updates...');
    let updated = 0;
    let failed = 0;
    for (const c of changes) {
      try {
        await prisma.lab.update({
          where: { id: c.id },
          data: { difficulty: c.to },
        });
        console.log(`  UPDATED: ${c.title} ${c.from} -> ${c.to}`);
        updated++;
      } catch (e) {
        console.error(`  FAILED: ${c.title} ${c.from} -> ${c.to}`, e);
        failed++;
      }
    }
    console.log(`Updates complete: ${updated} succeeded, ${failed} failed.`);
  } else {
    console.log('No updates needed — all labs correctly classified.');
  }

  // Re-fetch for after distribution
  const labsAfter = await prisma.lab.findMany({ select: { difficulty: true } });
  const afterDist = distribution(labsAfter);
  console.log('');
  console.log('Distribution AFTER: ' + formatDist(afterDist));
  for (const lvl of [1, 4, 7, 10] as const) {
    console.log(`  ${levelLabel(lvl)} (lvl ${lvl}): ${afterDist[lvl]} labs`);
  }

  console.log('');
  console.log('--- Summary ---');
  console.log(`BEFORE: ${formatDist(beforeDist)}`);
  console.log(`AFTER : ${formatDist(afterDist)}`);
  const delta = (lvl: number): string => {
    const diff = (afterDist[lvl] ?? 0) - (beforeDist[lvl] ?? 0);
    return diff > 0 ? `+${diff}` : `${diff}`;
  };
  console.log(`Delta 1:${delta(1)} 4:${delta(4)} 7:${delta(7)} 10:${delta(10)}`);
  console.log(`Total labs processed: ${labs.length} | Updated: ${changes.length} | Kept: ${kept.length}`);
}

main()
  .catch((e) => {
    console.error('Reclassification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
