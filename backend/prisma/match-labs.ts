import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const courseIds = [
  'e0822ffc-b4f7-4288-8ffa-9029529fe1cf', // Linux Fundamentals
  '29cfecbb-9f10-4173-a9e4-32ad87517632', // Linux Sysadmin
  'd8029430-8cc8-4ab9-92f1-2b11ce9f17b4', // Networking
  '7647f852-ba48-4b26-90f7-21a4387c0c17', // Linux Internals
  '04c3438e-cff8-493a-8e50-b5b0413d737c', // Security Engineering
  'd504a621-2c61-4060-9e40-db450c094a00', // Web App Security
  'ad74f191-1606-4b41-aaba-e9d6c9f7999c', // DevOps
];

// Manual mapping: lesson title keyword → lab title substring
const mappings: Record<string, string[]> = {
  // Linux Fundamentals
  'File System Navigation': ['file system navigation', 'linux file', 'ls command'],
  'Essential Command Line Tools': ['command line', 'linux basics', 'terminal'],
  'File Permissions Deep Dive': ['file permissions', 'chmod', 'chown'],
  'User and Group Management': ['user management', 'useradd', 'group'],
  'Bash Scripting Fundamentals': ['bash scripting', 'shell script'],
  'Text Processing with sed and awk': ['sed', 'awk', 'text processing'],
  'Regular Expressions': ['regex', 'regular expression', 'grep'],
  'Log Management & journald': ['journald', 'log management', 'logging'],
  'Cron, At & Scheduled Tasks': ['cron', 'scheduled task', 'crontab'],
  'sudo and Privilege Escalation': ['sudo', 'privilege escalation'],
  'Linux Boot Process': ['boot process', 'grub', 'systemd boot'],
  'systemd Deep-Dive': ['systemd', 'service management'],

  // Linux Sysadmin
  'Boot Process and Kernel Management': ['boot', 'kernel', 'grub'],
  'Storage and Filesystems': ['storage', 'filesystem', 'lvm', 'disk'],
  'User Administration at Scale': ['user admin', 'ldap', 'centralized auth'],
  'Service Management': ['service', 'systemd', 'init'],
  'Network Configuration': ['network config', 'ip address', 'nmcli'],
  'Security Hardening': ['hardening', 'cis benchmark', 'security'],
  'Backup and Recovery': ['backup', 'rsync', 'tar'],
  'Monitoring and Logging': ['monitoring', 'logging', 'syslog'],
  'Virtualization': ['virtualization', 'kvm', 'qemu', 'libvirt'],
  'Ansible Automation': ['ansible', 'automation', 'playbook'],

  // Networking
  'How Packets Actually Move': ['packet', 'osi', 'networking'],
  'Subnetting and IP Addressing': ['subnet', 'ip address', 'cidr'],
  'DNS': ['dns', 'bind', 'resolver'],
  'Firewalls': ['firewall', 'iptables', 'nftables'],
  'VPN Technologies': ['vpn', 'wireguard', 'openvpn', 'ipsec'],
  'Switching and VLANs': ['switch', 'vlan', 'spanning tree'],
  'Routing': ['routing', 'bgp', 'ospf'],
  'Network Troubleshooting': ['troubleshoot', 'ping', 'traceroute'],
  'Packet Analysis': ['packet analysis', 'wireshark', 'tcpdump'],
  'Network Security Monitoring': ['network monitoring', 'ids', 'ips'],

  // Linux Internals
  'How the Kernel Boots': ['boot', 'kernel boot'],
  'Process Management': ['process', 'fork', 'exec'],
  'Memory Management': ['memory', 'virtual memory', 'page'],
  'System Calls and the Kernel Interface': ['system call', 'syscall'],
  'Filesystems': ['filesystem', 'vfs', 'ext4'],
  'Device Drivers and Hardware': ['device driver', 'hardware'],
  'Kernel Modules and eBPF': ['kernel module', 'ebpf', 'bpf'],
  'Namespaces and Containers': ['namespace', 'container', 'cgroup'],
  'Performance Profiling and Tracing': ['profiling', 'tracing', 'perf'],
  'Kernel Security': ['kernel security', 'selinux', 'apparmor'],

  // Security Engineering
  'Security Engineering: What It Actually Is': ['security engineering', 'appsec'],
  'Threat Modeling': ['threat model', 'stride', 'pasta'],
  'Secure Design Principles': ['secure design', 'security pattern'],
  'Secure Code Review': ['code review', 'secure code', 'static analysis'],
  'Security Automation (SAST/DAST/SCA)': ['sast', 'dast', 'sca', 'security automation'],
  'Authentication and Authorization': ['authentication', 'authorization', 'oauth'],
  'Cryptography: What You Actually Need': ['cryptography', 'encryption', 'pki'],
  'Incident Response': ['incident response', 'ir playbook'],
  'Vulnerability Management': ['vulnerability', 'cve', 'scanning'],
  'Security Architecture': ['security architecture', 'zero trust'],

  // Web App Security
  'How Web Apps Actually Work': ['web app', 'http', 'owasp'],
  'Injection Attacks': ['injection', 'sql injection', 'sqli'],
  'Cross-Site Scripting (XSS)': ['xss', 'cross-site scripting'],
  'Authentication and Session Attacks': ['authentication', 'session', 'brute force'],
  'Access Control (IDOR)': ['idor', 'access control', 'authorization'],
  'Security Misconfiguration': ['misconfiguration', 'security header'],
  'Cryptographic Failures': ['crypto', 'tls', 'ssl'],
  'Server-Side Request Forgery (SSRF)': ['ssrf', 'server-side request'],
  'API Security': ['api security', 'rest security', 'graphql'],
  'Modern Attack Surfaces': ['modern attack', 'supply chain', 'websocket'],

  // DevOps
  'DevOps: What It Actually Means': ['devops', 'cicd', 'ci/cd'],
  'Git and Version Control': ['git', 'version control'],
  'CI/CD Pipelines': ['cicd', 'ci/cd', 'pipeline', 'github actions'],
  'Containerization with Docker': ['docker', 'container'],
  'Docker Compose and Multi-Service Apps': ['docker compose', 'multi-service'],
  'Kubernetes Fundamentals': ['kubernetes', 'k8s', 'kubectl'],
  'Infrastructure as Code with Terraform': ['terraform', 'infrastructure as code', 'iac'],
  'Monitoring and Observability': ['monitoring', 'observability', 'prometheus', 'grafana'],
  'Configuration Management with Ansible': ['ansible', 'playbook'],
  'Incident Response and SRE Practices': ['incident response', 'sre', 'post-mortem'],
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function scorematch(lessonTitle: string, labTitle: string, keywords: string[]): number {
  const nl = normalize(lessonTitle);
  const nl2 = normalize(labTitle);
  
  // Direct substring match
  if (nl2.includes(nl) || nl.includes(nl2)) return 100;
  
  // Keyword match
  let score = 0;
  for (const kw of keywords) {
    if (nl2.includes(normalize(kw))) score += 30;
  }
  
  // Word overlap
  const lessonWords = nl.split(' ');
  const labWords = nl2.split(' ');
  for (const w of lessonWords) {
    if (w.length > 3 && labWords.includes(w)) score += 10;
  }
  
  return score;
}

async function main() {
  const labs = await prisma.lab.findMany({ select: { id: true, title: true } });
  
  for (const courseId of courseIds) {
    const lessons = await prisma.lesson.findMany({
      where: { section: { courseId } },
      select: { id: true, title: true },
    });
    
    console.log(`\n--- Course: ${courseId} (${lessons.length} lessons) ---`);
    
    for (const lesson of lessons) {
      const keywords = mappings[lesson.title] || [];
      let bestLab = null;
      let bestScore = 0;
      
      for (const lab of labs) {
        const score = scorematch(lesson.title, lab.title, keywords);
        if (score > bestScore) {
          bestScore = score;
          bestLab = lab;
        }
      }
      
      if (bestLab && bestScore >= 30) {
        console.log(`  "${lesson.title}" → "${bestLab.title}" (score: ${bestScore})`);
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { labId: bestLab.id },
        });
      } else {
        console.log(`  "${lesson.title}" → NO MATCH (best: ${bestLab?.title} score: ${bestScore})`);
      }
    }
  }
  
  console.log('\nDone');
}

main().catch(console.error).finally(() => prisma.$disconnect());
