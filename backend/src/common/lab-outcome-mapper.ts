import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map lab title keywords → learning outcome codes
const LAB_OUTCOME_MAP: Array<{ keywords: string[]; outcomeCodes: string[] }> = [
  // SYSTEMS
  {
    keywords: [
      'linux',
      'process',
      'system',
      'file',
      'permission',
      'user',
      'group',
      'chmod',
      'chown',
      'ps',
      'top',
      'kill',
    ],
    outcomeCodes: ['SYS1', 'SYS2', 'SYS8'],
  },
  {
    keywords: ['hardening', 'security', 'firewall', 'ssh', 'audit'],
    outcomeCodes: ['SYS3', 'SYS6'],
  },
  {
    keywords: ['shell', 'bash', 'script', 'cron', 'automation'],
    outcomeCodes: ['SYS4', 'SYS5'],
  },
  {
    keywords: ['disk', 'storage', 'mount', 'partition', 'lvm', 'raid'],
    outcomeCodes: ['SYS6'],
  },
  {
    keywords: ['monitor', 'log', 'systemd', 'journal'],
    outcomeCodes: ['SYS7'],
  },

  // NETWORKING
  {
    keywords: ['network', 'tcp', 'ip', 'dns', 'http', 'curl', 'wget', 'socket'],
    outcomeCodes: ['NET1', 'NET5'],
  },
  {
    keywords: ['wireshark', 'tcpdump', 'packet', 'capture', 'pcap'],
    outcomeCodes: ['NET2', 'NET7'],
  },
  {
    keywords: ['firewall', 'iptables', 'nftables', 'ufw', 'security group'],
    outcomeCodes: ['NET3', 'NET7'],
  },
  {
    keywords: ['dns', 'resolve', 'dig', 'nslookup', 'domain'],
    outcomeCodes: ['NET4'],
  },
  {
    keywords: ['ssl', 'tls', 'certificate', 'https', 'vpn', 'tunnel'],
    outcomeCodes: ['NET6', 'NET8'],
  },

  // DEVOPS
  {
    keywords: ['docker', 'container', 'compose', 'dockerfile', 'image'],
    outcomeCodes: ['DEV1'],
  },
  {
    keywords: ['ci/cd', 'pipeline', 'jenkins', 'github action', 'gitlab ci'],
    outcomeCodes: ['DEV2'],
  },
  {
    keywords: ['terraform', 'ansible', 'cloudformation', 'infrastructure'],
    outcomeCodes: ['DEV3', 'DEV4'],
  },
  {
    keywords: ['aws', 'azure', 'gcp', 'cloud', 'ec2', 's3', 'lambda'],
    outcomeCodes: ['DEV4'],
  },
  {
    keywords: ['git', 'branch', 'merge', 'pull request', 'version control'],
    outcomeCodes: ['DEV5'],
  },
  {
    keywords: ['monitor', 'prometheus', 'grafana', 'logging', 'kibana', 'elk'],
    outcomeCodes: ['DEV6'],
  },
  {
    keywords: ['kubernetes', 'k8s', 'orchestrat', 'pods', 'deploy'],
    outcomeCodes: ['DEV8'],
  },

  // DATABASES
  {
    keywords: [
      'sql',
      'query',
      'join',
      'select',
      'insert',
      'update',
      'database',
    ],
    outcomeCodes: ['DBA1', 'DBA2'],
  },
  {
    keywords: ['backup', 'restore', 'recovery', 'dump'],
    outcomeCodes: ['DBA5'],
  },
  {
    keywords: ['index', 'optim', 'explain', 'slow query', 'performance'],
    outcomeCodes: ['DBA4'],
  },
  {
    keywords: ['mongo', 'redis', 'nosql', 'cassandra', 'elastic'],
    outcomeCodes: ['DBA6'],
  },
  {
    keywords: ['encrypt', 'password', 'hash', 'salt', 'access control'],
    outcomeCodes: ['DBA3'],
  },

  // SECURITY
  {
    keywords: ['vuln', 'scan', 'nmap', 'nessus', 'openvas'],
    outcomeCodes: ['SEC1'],
  },
  {
    keywords: [
      'xss',
      'sql injection',
      'csrf',
      'owasp',
      'web security',
      'webgoat',
    ],
    outcomeCodes: ['SEC2'],
  },
  {
    keywords: [
      'pentest',
      'exploit',
      'metasploit',
      'reverse shell',
      'privilege',
    ],
    outcomeCodes: ['SEC3'],
  },
  {
    keywords: ['encrypt', 'cipher', 'pgp', 'gpg', 'crypto', 'certificate'],
    outcomeCodes: ['SEC4'],
  },
  {
    keywords: ['incident', 'forensic', 'malware', 'analysis', 'virus'],
    outcomeCodes: ['SEC5', 'SEC8'],
  },
  {
    keywords: ['osint', 'recon', 'reconnaissance', 'shodan', 'social engineer'],
    outcomeCodes: ['SEC7'],
  },
  {
    keywords: ['compliance', 'baseline', 'cis', 'stig', 'harden'],
    outcomeCodes: ['SEC6'],
  },

  // QA
  {
    keywords: ['test', 'selenium', 'jest', 'mocha', 'cypress', 'e2e'],
    outcomeCodes: ['QA2', 'QA1'],
  },
  {
    keywords: ['api test', 'postman', 'rest', 'graphql', 'endpoint'],
    outcomeCodes: ['QA3'],
  },
  {
    keywords: ['load test', 'stress test', 'k6', 'locust', 'performance'],
    outcomeCodes: ['QA4'],
  },
  {
    keywords: ['bug', 'defect', 'issue', 'jira', 'regression'],
    outcomeCodes: ['QA5'],
  },
  {
    keywords: ['sast', 'dast', 'security test', 'dependency scan', 'owasp zap'],
    outcomeCodes: ['QA6'],
  },
  {
    keywords: ['coverage', 'metric', 'report', 'quality'],
    outcomeCodes: ['QA7'],
  },
];

function matchLabToOutcomes(
  labTitle: string,
  labDescription: string,
): string[] {
  const text = `${labTitle} ${labDescription}`.toLowerCase();
  const matched = new Set<string>();

  for (const { keywords, outcomeCodes } of LAB_OUTCOME_MAP) {
    const hasKeyword = keywords.some((kw) => text.includes(kw));
    if (hasKeyword) {
      outcomeCodes.forEach((c) => matched.add(c));
    }
  }

  return Array.from(matched);
}

async function main() {
  const outcomes = await prisma.learningOutcome.findMany();
  const outcomeMap = new Map(outcomes.map((o) => [o.code, o.id]));

  const labs = await prisma.lab.findMany();
  console.log(`Found ${labs.length} labs`);

  let mapped = 0;
  let unmapped = 0;

  for (const lab of labs) {
    const codes = matchLabToOutcomes(lab.title, lab.description || '');

    if (codes.length === 0) {
      console.log(`  UNMAPPED: ${lab.title}`);
      unmapped++;
      continue;
    }

    for (const code of codes) {
      const outcomeId = outcomeMap.get(code);
      if (!outcomeId) continue;

      await prisma.labOutcome.upsert({
        where: {
          labId_learningOutcomeId: {
            labId: lab.id,
            learningOutcomeId: outcomeId,
          },
        },
        update: { weight: 1.0 },
        create: { labId: lab.id, learningOutcomeId: outcomeId, weight: 1.0 },
      });
    }

    mapped++;
    console.log(`  Mapped: ${lab.title} → [${codes.join(', ')}]`);
  }

  console.log(`\nDone: ${mapped} mapped, ${unmapped} unmapped`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
