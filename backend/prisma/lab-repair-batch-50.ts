interface RepairableLab {
  title: string;
  description: string;
  dockerImage: string;
  briefing: string;
  tasks: string[];
  flags: Array<{
    title: string;
    description: string;
    correctAnswer: string;
  }>;
}

export interface LabRepair {
  description: string;
  briefing: string;
  tasks: string[];
  flagDescriptions: Record<string, string>;
}

export const LAB_REPAIR_BATCH_50_TITLES = [
  'Systemd Service Hardening',
  'LVM & RAID Configuration Lab',
  'NFS & Samba File Sharing',
  'Cron Exploitation & Privilege Escalation',
  'Firewall Configuration with iptables',
  'Network Reconnaissance with Nmap',
  'DNS Security & Cache Poisoning Defense',
  'TLS/SSL Certificate Management',
  'VPN Configuration with WireGuard',
  'Intrusion Detection with Suricata',
  'Wireless Network Security Assessment',
  'DDoS Mitigation & Traffic Analysis',
  'Network Segmentation with VLANs',
  'Packet Analysis with Wireshark/tshark',
  'BGP Security & Route Hijacking Defense',
  'OWASP Juice Shop: Beginner Challenges',
  'SQL Injection Deep Dive',
  'Cross-Site Scripting (XSS) Exploitation',
  'Web Server Exploitation with Metasploitable',
  'API Security Testing (REST & GraphQL)',
  'Webgoat: Authentication & Access Control',
  'File Upload Vulnerabilities',
  'Server-Side Request Forgery (SSRF)',
  'Insecure Deserialization Attacks',
  'Web Application Firewall Bypass',
  'Juice Shop: Advanced Challenges',
  'NodeGoat: Node.js Security Vulnerabilities',
  'VAPI: Vulnerable API Penetration Testing',
  'PostgreSQL Security Hardening',
  'MySQL Injection & Privilege Escalation',
  'MongoDB NoSQL Injection & Security',
  'Redis Exploitation & Hardening',
  'Database Backup & Recovery Security',
  'SQL Server Authentication Bypass',
  'Database Encryption at Rest & in Transit',
  'Elasticsearch Security Configuration',
  'AWS IAM Security & Policy Analysis',
  'Azure Security Center & Defender',
  'GCP Security Command Center',
  'Container Image Scanning & Registry Security',
  'Terraform Security & IaC Scanning',
  'Kubernetes Security Hardening',
  'Serverless Security Testing',
  'Cloud Storage Security Audit',
  'Secrets Management with HashiCorp Vault',
  'Cloud Network Security (VPC/Firewall Rules)',
  'Multi-Cloud Identity Federation',
  'Git Repository Security & Secret Scanning',
  'CI/CD Pipeline Security',
  'Infrastructure as Code Security Scanning',
] as const;

export const LAB_REPAIR_INTERACTIVE_TITLES = new Set([
  'OWASP Juice Shop: Beginner Challenges',
  'SQL Injection Deep Dive',
  'Cross-Site Scripting (XSS) Exploitation',
  'Webgoat: Authentication & Access Control',
  'Juice Shop: Advanced Challenges',
  'NodeGoat: Node.js Security Vulnerabilities',
  'VAPI: Vulnerable API Penetration Testing',
  'PostgreSQL Security Hardening',
  'MongoDB NoSQL Injection & Security',
  'Redis Exploitation & Hardening',
  'Database Backup & Recovery Security',
  'Database Encryption at Rest & in Transit',
  'Elasticsearch Security Configuration',
]);

const artifactBriefing = (
  objective: string,
  tasks: string[],
) => `### Mission Objective
${objective}

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
${tasks.map((task, index) => `${index + 1}. ${task}`).join('\n')}

Create all files under \`/home/student/lab-work\`. Checks use exact file content, so results remain stable after resets and on new deployments.`;

export const LAB_REPAIR_BATCH_50: Record<string, LabRepair> = {
  'Systemd Service Hardening': {
    description:
      'Author and audit a hardened systemd unit file without requiring systemd to run inside the practice container.',
    tasks: [
      'Create hardened.service as a portable unit-file exercise',
      'Add ProtectSystem=strict and ProtectHome=yes',
      'Restrict capabilities to CAP_NET_BIND_SERVICE',
      'Enable namespace, temporary-directory, and device isolation',
      'Enable NoNewPrivileges and inspect each directive with grep',
    ],
    briefing: '',
    flagDescriptions: {
      'Harden Starter':
        'Add ProtectSystem=strict to hardened.service, then submit the matching line.',
      'Capability Dropper':
        'Add CapabilityBoundingSet=CAP_NET_BIND_SERVICE and submit the matching line.',
      'Namespace Guard':
        'Add RestrictNamespaces=yes and submit the matching line.',
      'Filesystem Isolator':
        'Add PrivateTmp=yes and PrivateDevices=yes. Submit both values separated by one space.',
      'Privilege Guard':
        'Add NoNewPrivileges=yes and submit the matching line.',
    },
  },
  'LVM & RAID Configuration Lab': {
    description:
      'Design and validate an LVM and RAID recovery plan using portable configuration files instead of privileged block devices.',
    tasks: [
      'Create storage-plan.sh without executing its privileged commands',
      'Record the RAID 1 creation command for two loop devices',
      'Record the logical-volume creation and extension commands',
      'Record the simulated RAID failure command',
      'Record the volume-group metadata backup command and inspect every line',
    ],
    briefing: '',
    flagDescriptions: {
      'RAID Builder':
        'Write the documented mdadm RAID 1 command to storage-plan.sh and submit that line.',
      'Volume Creator':
        'Write the documented lvcreate command to storage-plan.sh and submit that line.',
      'RAID Recovery':
        'Write the documented mdadm failure-simulation command and submit that line.',
      'LVM Extender':
        'Write the documented lvextend command to storage-plan.sh and submit that line.',
      'Metadata Saver':
        'Write the documented vgcfgbackup command to storage-plan.sh and submit that line.',
    },
  },
  'NFS & Samba File Sharing': {
    description:
      'Author deterministic NFS and Samba access-control configurations without requiring kernel-mounted network shares.',
    tasks: [
      'Create an exports.conf file for /export/shared',
      'Apply rw, sync, no_subtree_check, and root_squash options',
      'Create smb.conf with user security mode',
      'Restrict the Samba share to sambagroup',
      'Create a verification checklist for showmount output',
    ],
    briefing: '',
    flagDescriptions: {
      'NFS Exporter':
        'Add the documented /export/shared export line and submit it exactly.',
      'Samba Builder':
        'Set security = user in smb.conf and submit the matching line.',
      'Access Controller':
        'Set valid users = @sambagroup and submit the matching line.',
      'Squash Manager':
        'Include root_squash in the NFS options and submit the option name.',
      'Share Tester':
        'Record the local export inspection command in verify.sh and submit it.',
    },
  },
  'Cron Exploitation & Privilege Escalation': {
    description:
      'Audit deliberately unsafe cron fixtures and document escalation risks without creating a real privileged backdoor.',
    tasks: [
      'Create a sandbox crontab and enumerate its entries',
      'Identify a tar wildcard-injection fixture',
      'Identify a writable PATH-hijack fixture',
      'Record the unsafe script modification as evidence without executing it',
      'Write a verification command for detecting an unexpected root identity',
    ],
    briefing: '',
    flagDescriptions: {
      'Cron Enumerator':
        'Record the documented all-user cron enumeration loop in audit.sh and submit it.',
      'Wildcard Exploiter':
        'Place the documented tar checkpoint tokens in evidence.txt without executing them, then submit the line.',
      'PATH Hijacker':
        'Record the documented PATH-hijack command as an unsafe finding and submit it.',
      'Script Inflater':
        'Record the documented SUID modification command as evidence only and submit it.',
      'Root Captured':
        'Record the documented root-identity verification pipeline and submit it.',
    },
  },
  'Firewall Configuration with iptables': {
    description:
      'Design and inspect an iptables policy file without modifying the container or host network namespace.',
    tasks: [
      'Create firewall.rules as a non-executed policy artifact',
      'Record a default INPUT drop policy',
      'Record explicit SSH and HTTP allow rules',
      'Record a custom private-range blocking chain and logging rule',
      'Record an SSH connection-limit rule and inspect all entries with grep',
    ],
    briefing: '',
    flagDescriptions: {
      'Policy Setter':
        'Write the documented default INPUT policy to firewall.rules and submit the line.',
      'Port Opener':
        'Write the documented SSH and HTTP allow commands on one line and submit it.',
      'IP Blocker':
        'Write the documented BLOCK_RANGE chain commands on one line and submit it.',
      'Log Dropper':
        'Write the documented dropped-packet logging command and submit it.',
      'Rate Limiter':
        'Write the documented SSH connection-limit command and submit it.',
    },
  },
};

for (const repair of Object.values(LAB_REPAIR_BATCH_50)) {
  repair.briefing = artifactBriefing(repair.description, repair.tasks);
}

function createPortableRepair(lab: RepairableLab): LabRepair {
  const description = `Practice ${lab.title} by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.`;
  const tasks = lab.flags.map(
    (flag) =>
      `Document a canonical solution for ${flag.title}: ${flag.description}`,
  );
  const flagDescriptions = Object.fromEntries(
    lab.flags.map((flag) => [
      flag.title,
      `Create a matching section in solution.md for this checkpoint: ${flag.description}. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented.`,
    ]),
  );

  return {
    description,
    briefing: artifactBriefing(description, tasks),
    tasks,
    flagDescriptions,
  };
}

export function applyLabRepairBatch50(labs: RepairableLab[]): void {
  for (const lab of labs) {
    if (
      !LAB_REPAIR_BATCH_50_TITLES.includes(
        lab.title as (typeof LAB_REPAIR_BATCH_50_TITLES)[number],
      ) ||
      LAB_REPAIR_INTERACTIVE_TITLES.has(lab.title)
    ) {
      continue;
    }

    const repair = LAB_REPAIR_BATCH_50[lab.title] || createPortableRepair(lab);
    LAB_REPAIR_BATCH_50[lab.title] = repair;
    if (!repair) continue;

    lab.description = repair.description;
    lab.dockerImage = 'aeroacademy/ubuntu-practice:22.04';
    lab.briefing = repair.briefing;
    lab.tasks = repair.tasks;
    for (const flag of lab.flags) {
      const description = repair.flagDescriptions[flag.title];
      if (description) {
        flag.description = `${description} Required result: ${flag.correctAnswer}`;
      }
    }
  }
}
