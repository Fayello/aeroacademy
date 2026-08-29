import { PrismaClient } from '@prisma/client';

/**
 * Seed skill graph + competency analytics wiring.
 *
 * Idempotent: all creates are upsert/findFirst-guarded.
 * Covers:
 *  - 6 SkillDomains (SYSTEMS, NETWORKING, DEVOPS, DATABASES, SECURITY, QA)
 *  - ~30 Skills across domains
 *  - LabSkill wiring for every lab (1-3 skills via title keywords, fallback ensures coverage)
 *  - Lesson/quiz → skill inference (via lesson+section+course titles; if lesson has lab, ensures LabSkill)
 *  - 8 LearningOutcomes + SkillOutcome + LabOutcome mappings
 *
 * Usage:
 *  import { seedSkillsWiring } from './seed-skills-wiring';
 *  await seedSkillsWiring(prisma);
 */
export async function seedSkillsWiring(prisma: PrismaClient): Promise<void> {
  console.log('🔧 [seed-skills-wiring] starting…');

  // ─────────────────────────────────────────────────────────────────
  // 1. DOMAINS & SKILLS
  // ─────────────────────────────────────────────────────────────────
  const DOMAINS: Array<{
    name: string;
    displayName: string;
    icon: string;
    skills: Array<{ name: string; displayName: string; description?: string }>;
  }> = [
    {
      name: 'SYSTEMS',
      displayName: 'Systems',
      icon: 'server',
      skills: [
        { name: 'linux', displayName: 'Linux', description: 'Linux operating system fundamentals and administration' },
        { name: 'windows', displayName: 'Windows', description: 'Windows Server administration' },
        { name: 'sysadmin', displayName: 'System Administration', description: 'General system administration and hardening' },
        { name: 'automation', displayName: 'Automation', description: 'Shell scripting and infrastructure automation' },
        { name: 'bash', displayName: 'Bash & Shell Scripting', description: 'Bash, shell scripting and text processing' },
        { name: 'systemd', displayName: 'Systemd & Services', description: 'Systemd, process and service management' },
      ],
    },
    {
      name: 'NETWORKING',
      displayName: 'Networking',
      icon: 'network',
      skills: [
        { name: 'networking', displayName: 'Networking', description: 'Core networking concepts and protocols' },
        { name: 'netadmin', displayName: 'Network Administration', description: 'Network device and infrastructure administration' },
        { name: 'dns', displayName: 'DNS', description: 'DNS administration with BIND9' },
        { name: 'firewalls', displayName: 'Firewalls', description: 'Firewall configuration and network security' },
        { name: 'vpn', displayName: 'VPN', description: 'VPN technologies including WireGuard and OpenVPN' },
        { name: 'loadbalancing', displayName: 'Load Balancing', description: 'Load balancing and high availability' },
      ],
    },
    {
      name: 'DEVOPS',
      displayName: 'DevOps',
      icon: 'containers',
      skills: [
        { name: 'docker', displayName: 'Docker', description: 'Containerization with Docker' },
        { name: 'kubernetes', displayName: 'Kubernetes', description: 'Orchestration with Kubernetes' },
        { name: 'terraform', displayName: 'Terraform', description: 'Infrastructure as Code with Terraform' },
        { name: 'aws', displayName: 'AWS', description: 'Amazon Web Services and cloud providers' },
        { name: 'git', displayName: 'Git', description: 'Version control with Git and Gitea' },
        { name: 'cicd', displayName: 'CI/CD', description: 'Continuous integration and delivery' },
        { name: 'ansible', displayName: 'Ansible', description: 'Configuration management with Ansible' },
        { name: 'monitoring', displayName: 'Monitoring & Observability', description: 'Prometheus, Grafana, ELK and observability' },
        { name: 'python', displayName: 'Python', description: 'Python for automation and security tooling' },
      ],
    },
    {
      name: 'DATABASES',
      displayName: 'Databases',
      icon: 'database',
      skills: [
        { name: 'sql', displayName: 'SQL', description: 'Relational SQL fundamentals' },
        { name: 'postgresql', displayName: 'PostgreSQL', description: 'PostgreSQL administration' },
        { name: 'mysql', displayName: 'MySQL', description: 'MySQL and MariaDB administration' },
        { name: 'mongodb', displayName: 'MongoDB', description: 'MongoDB and NoSQL security' },
        { name: 'redis', displayName: 'Redis', description: 'Redis and in-memory data stores' },
        { name: 'dba', displayName: 'Database Administration', description: 'Backup, replication and DBA tasks' },
      ],
    },
    {
      name: 'SECURITY',
      displayName: 'Security',
      icon: 'shield',
      skills: [
        { name: 'cybersecurity', displayName: 'Cybersecurity', description: 'General cybersecurity principles' },
        { name: 'secops', displayName: 'SecOps', description: 'Security operations and SOC' },
        { name: 'hardening', displayName: 'System Hardening', description: 'Hardening, CIS, OpenSCAP and compliance' },
        { name: 'pentesting', displayName: 'Penetration Testing', description: 'Penetration testing and exploitation' },
        { name: 'forensics', displayName: 'Digital Forensics', description: 'Forensics, memory analysis and DFIR' },
        { name: 'devsecops', displayName: 'DevSecOps', description: 'Security in DevOps pipelines' },
      ],
    },
    {
      name: 'QA',
      displayName: 'QA & Testing',
      icon: 'check-circle',
      skills: [
        { name: 'testing', displayName: 'Testing', description: 'QA testing methodologies' },
        { name: 'uat', displayName: 'UAT', description: 'User acceptance testing' },
      ],
    },
  ];

  // Upsert domains & skills
  const domainIdByName = new Map<string, string>();
  const skillIdByDomainAndName = new Map<string, string>(); // key: DOMAIN::skillName

  for (const d of DOMAINS) {
    const domain = await prisma.skillDomain.upsert({
      where: { name: d.name },
      update: { displayName: d.displayName, icon: d.icon },
      create: { name: d.name, displayName: d.displayName, icon: d.icon },
    });
    domainIdByName.set(d.name, domain.id);

    for (const s of d.skills) {
      const skill = await prisma.skill.upsert({
        where: { domainId_name: { domainId: domain.id, name: s.name } },
        update: { displayName: s.displayName, description: s.description },
        create: { domainId: domain.id, name: s.name, displayName: s.displayName, description: s.description },
      });
      skillIdByDomainAndName.set(`${d.name}::${s.name}`, skill.id);
    }
  }

  const totalSkills = DOMAINS.reduce((a, d) => a + d.skills.length, 0);
  console.log(`  ✅ Domains: ${DOMAINS.length}, Skills: ${totalSkills}`);

  // Build helper map for quick lookup by domain+skill
  const allSkillDomains = await prisma.skillDomain.findMany({ include: { skills: true } });
  const domainMap = new Map<string, Map<string, string>>();
  for (const sd of allSkillDomains) {
    const m = new Map<string, string>();
    for (const s of sd.skills) m.set(s.name, s.id);
    domainMap.set(sd.name, m);
  }

  function resolveSkillId(domain: string, skill: string): string | undefined {
    return domainMap.get(domain)?.get(skill);
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. LAB → SKILL WIRING (1-3 skills per lab via title keywords)
  // ─────────────────────────────────────────────────────────────────
  // Ordered keyword → [domain, skill]. First match wins but we collect up to 3.
  // Keywords are lower-cased; we match substring on lowercased title (+dockerImage+description).
  const LAB_KEYWORDS: Array<{ keyword: string; domain: string; skill: string }> = [
    // SYSTEMS
    { keyword: 'ubuntu', domain: 'SYSTEMS', skill: 'linux' },
    { keyword: 'debian', domain: 'SYSTEMS', skill: 'linux' },
    { keyword: 'centos', domain: 'SYSTEMS', skill: 'linux' },
    { keyword: 'rhel', domain: 'SYSTEMS', skill: 'linux' },
    { keyword: 'linux', domain: 'SYSTEMS', skill: 'linux' },
    { keyword: 'kernel', domain: 'SYSTEMS', skill: 'linux' },
    { keyword: 'systemd', domain: 'SYSTEMS', skill: 'systemd' },
    { keyword: 'cron', domain: 'SYSTEMS', skill: 'systemd' },
    { keyword: 'shell', domain: 'SYSTEMS', skill: 'bash' },
    { keyword: 'bash', domain: 'SYSTEMS', skill: 'bash' },
    { keyword: 'text processing', domain: 'SYSTEMS', skill: 'bash' },
    { keyword: 'scripting', domain: 'SYSTEMS', skill: 'automation' },
    { keyword: 'ansible', domain: 'DEVOPS', skill: 'ansible' },
    { keyword: 'automation', domain: 'SYSTEMS', skill: 'automation' },
    { keyword: 'lvm', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'raid', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'nfs', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'samba', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'iscsi', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'drbd', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'storage', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'backup', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'filesystem', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'nginx', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'web server', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'postfix', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'dovecot', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'mail', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'snipe-it', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'cockpit', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'sssd', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'nextcloud', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'server administration', domain: 'SYSTEMS', skill: 'sysadmin' },
    { keyword: 'centralized logging', domain: 'SYSTEMS', skill: 'sysadmin' },
    // NETWORKING
    { keyword: 'network', domain: 'NETWORKING', skill: 'networking' },
    { keyword: 'nmap', domain: 'NETWORKING', skill: 'networking' },
    { keyword: 'wireshark', domain: 'NETWORKING', skill: 'networking' },
    { keyword: 'tshark', domain: 'NETWORKING', skill: 'networking' },
    { keyword: 'packet', domain: 'NETWORKING', skill: 'networking' },
    { keyword: 'vlan', domain: 'NETWORKING', skill: 'networking' },
    { keyword: 'bgp', domain: 'NETWORKING', skill: 'networking' },
    { keyword: 'bpf', domain: 'NETWORKING', skill: 'networking' },
    { keyword: 'dhcp', domain: 'NETWORKING', skill: 'dns' },
    { keyword: 'dns', domain: 'NETWORKING', skill: 'dns' },
    { keyword: 'bind9', domain: 'NETWORKING', skill: 'dns' },
    { keyword: 'named', domain: 'NETWORKING', skill: 'dns' },
    { keyword: 'firewall', domain: 'NETWORKING', skill: 'firewalls' },
    { keyword: 'iptables', domain: 'NETWORKING', skill: 'firewalls' },
    { keyword: 'nftables', domain: 'NETWORKING', skill: 'firewalls' },
    { keyword: 'suricata', domain: 'NETWORKING', skill: 'firewalls' },
    { keyword: 'ids', domain: 'NETWORKING', skill: 'firewalls' },
    { keyword: 'ips', domain: 'NETWORKING', skill: 'firewalls' },
    { keyword: 'vpn', domain: 'NETWORKING', skill: 'vpn' },
    { keyword: 'wireguard', domain: 'NETWORKING', skill: 'vpn' },
    { keyword: 'openvpn', domain: 'NETWORKING', skill: 'vpn' },
    { keyword: 'haproxy', domain: 'NETWORKING', skill: 'loadbalancing' },
    { keyword: 'keepalived', domain: 'NETWORKING', skill: 'loadbalancing' },
    { keyword: 'load balancer', domain: 'NETWORKING', skill: 'loadbalancing' },
    { keyword: 'high availability', domain: 'NETWORKING', skill: 'loadbalancing' },
    { keyword: 'vrrp', domain: 'NETWORKING', skill: 'loadbalancing' },
    { keyword: 'netadmin', domain: 'NETWORKING', skill: 'netadmin' },
    // DEVOPS
    { keyword: 'docker', domain: 'DEVOPS', skill: 'docker' },
    { keyword: 'container', domain: 'DEVOPS', skill: 'docker' },
    { keyword: 'swarm', domain: 'DEVOPS', skill: 'docker' },
    { keyword: 'kubernetes', domain: 'DEVOPS', skill: 'kubernetes' },
    { keyword: 'k8s', domain: 'DEVOPS', skill: 'kubernetes' },
    { keyword: 'k3s', domain: 'DEVOPS', skill: 'kubernetes' },
    { keyword: 'calico', domain: 'DEVOPS', skill: 'kubernetes' },
    { keyword: 'ingress', domain: 'DEVOPS', skill: 'kubernetes' },
    { keyword: 'helm', domain: 'DEVOPS', skill: 'kubernetes' },
    { keyword: 'terraform', domain: 'DEVOPS', skill: 'terraform' },
    { keyword: 'iac', domain: 'DEVOPS', skill: 'terraform' },
    { keyword: 'git', domain: 'DEVOPS', skill: 'git' },
    { keyword: 'gitea', domain: 'DEVOPS', skill: 'git' },
    { keyword: 'gitlab', domain: 'DEVOPS', skill: 'git' },
    { keyword: 'github', domain: 'DEVOPS', skill: 'git' },
    { keyword: 'jenkins', domain: 'DEVOPS', skill: 'cicd' },
    { keyword: 'argocd', domain: 'DEVOPS', skill: 'cicd' },
    { keyword: 'cicd', domain: 'DEVOPS', skill: 'cicd' },
    { keyword: 'ci/cd', domain: 'DEVOPS', skill: 'cicd' },
    { keyword: 'pipeline', domain: 'DEVOPS', skill: 'cicd' },
    { keyword: 'prometheus', domain: 'DEVOPS', skill: 'monitoring' },
    { keyword: 'grafana', domain: 'DEVOPS', skill: 'monitoring' },
    { keyword: 'elk', domain: 'DEVOPS', skill: 'monitoring' },
    { keyword: 'kibana', domain: 'DEVOPS', skill: 'monitoring' },
    { keyword: 'elasticsearch', domain: 'DEVOPS', skill: 'monitoring' },
    { keyword: 'zabbix', domain: 'DEVOPS', skill: 'monitoring' },
    { keyword: 'wazuh', domain: 'DEVOPS', skill: 'monitoring' },
    { keyword: 'alertmanager', domain: 'DEVOPS', skill: 'monitoring' },
    { keyword: 'monitoring', domain: 'DEVOPS', skill: 'monitoring' },
    { keyword: 'observability', domain: 'DEVOPS', skill: 'monitoring' },
    { keyword: 'logging', domain: 'DEVOPS', skill: 'monitoring' },
    { keyword: 'rsyslog', domain: 'DEVOPS', skill: 'monitoring' },
    { keyword: 'filebeat', domain: 'DEVOPS', skill: 'monitoring' },
    { keyword: 'logrotate', domain: 'DEVOPS', skill: 'monitoring' },
    { keyword: 'aws', domain: 'DEVOPS', skill: 'aws' },
    { keyword: 'azure', domain: 'DEVOPS', skill: 'aws' },
    { keyword: 'gcp', domain: 'DEVOPS', skill: 'aws' },
    { keyword: 'cloud', domain: 'DEVOPS', skill: 'aws' },
    { keyword: 's3', domain: 'DEVOPS', skill: 'aws' },
    { keyword: 'vpc', domain: 'DEVOPS', skill: 'aws' },
    { keyword: 'vault', domain: 'DEVOPS', skill: 'aws' },
    { keyword: 'python', domain: 'DEVOPS', skill: 'python' },
    { keyword: 'flask', domain: 'DEVOPS', skill: 'python' },
    { keyword: 'node', domain: 'DEVOPS', skill: 'python' },
    { keyword: 'javascript', domain: 'DEVOPS', skill: 'python' },
    // DATABASES
    { keyword: 'database', domain: 'DATABASES', skill: 'sql' },
    { keyword: 'sql', domain: 'DATABASES', skill: 'sql' },
    { keyword: 'dba', domain: 'DATABASES', skill: 'dba' },
    { keyword: 'postgresql', domain: 'DATABASES', skill: 'postgresql' },
    { keyword: 'postgres', domain: 'DATABASES', skill: 'postgresql' },
    { keyword: 'pg_', domain: 'DATABASES', skill: 'postgresql' },
    { keyword: 'mysql', domain: 'DATABASES', skill: 'mysql' },
    { keyword: 'mariadb', domain: 'DATABASES', skill: 'mysql' },
    { keyword: 'galera', domain: 'DATABASES', skill: 'mysql' },
    { keyword: 'mongodb', domain: 'DATABASES', skill: 'mongodb' },
    { keyword: 'mongo', domain: 'DATABASES', skill: 'mongodb' },
    { keyword: 'redis', domain: 'DATABASES', skill: 'redis' },
    { keyword: 'replication', domain: 'DATABASES', skill: 'dba' },
    { keyword: 'backup & recovery', domain: 'DATABASES', skill: 'dba' },
    // SECURITY
    { keyword: 'kali', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'parrot', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'metasploit', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'metasploitable', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'penetration', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'exploitation', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'reconnaissance', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'osint', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'sqli', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'sql injection', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'xss', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'ssrf', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'deserialization', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'juice', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'webgoat', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'nodegoat', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'dvwa', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'vapi', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'owasp', domain: 'SECURITY', skill: 'pentesting' },
    { keyword: 'forensic', domain: 'SECURITY', skill: 'forensics' },
    { keyword: 'volatility', domain: 'SECURITY', skill: 'forensics' },
    { keyword: 'yara', domain: 'SECURITY', skill: 'forensics' },
    { keyword: 'steganography', domain: 'SECURITY', skill: 'forensics' },
    { keyword: 'memory forensics', domain: 'SECURITY', skill: 'forensics' },
    { keyword: 'incident', domain: 'SECURITY', skill: 'forensics' },
    { keyword: 'malware', domain: 'SECURITY', skill: 'forensics' },
    { keyword: 'hardening', domain: 'SECURITY', skill: 'hardening' },
    { keyword: 'cis', domain: 'SECURITY', skill: 'hardening' },
    { keyword: 'openscap', domain: 'SECURITY', skill: 'hardening' },
    { keyword: 'compliance', domain: 'SECURITY', skill: 'hardening' },
    { keyword: 'modsecurity', domain: 'SECURITY', skill: 'hardening' },
    { keyword: 'waf', domain: 'SECURITY', skill: 'hardening' },
    { keyword: 'siem', domain: 'SECURITY', skill: 'secops' },
    { keyword: 'soc', domain: 'SECURITY', skill: 'secops' },
    { keyword: 'secops', domain: 'SECURITY', skill: 'secops' },
    { keyword: 'devsecops', domain: 'SECURITY', skill: 'devsecops' },
    { keyword: 'sast', domain: 'SECURITY', skill: 'devsecops' },
    { keyword: 'sca', domain: 'SECURITY', skill: 'devsecops' },
    { keyword: 'sbom', domain: 'SECURITY', skill: 'devsecops' },
    { keyword: 'vault', domain: 'SECURITY', skill: 'devsecops' },
    { keyword: 'iam', domain: 'SECURITY', skill: 'hardening' },
    { keyword: 'security', domain: 'SECURITY', skill: 'cybersecurity' },
    { keyword: 'cybersecurity', domain: 'SECURITY', skill: 'cybersecurity' },
    { keyword: 'vulnerability', domain: 'SECURITY', skill: 'cybersecurity' },
    // QA
    { keyword: 'qa', domain: 'QA', skill: 'testing' },
    { keyword: 'testing', domain: 'QA', skill: 'testing' },
    { keyword: 'uat', domain: 'QA', skill: 'uat' },
    { keyword: 'test', domain: 'QA', skill: 'testing' },
  ];

  function inferSkillsForText(text: string): Array<[string, string]> {
    const lower = text.toLowerCase();
    const seen = new Set<string>();
    const result: Array<[string, string]> = [];
    for (const entry of LAB_KEYWORDS) {
      if (lower.includes(entry.keyword.toLowerCase())) {
        const key = `${entry.domain}::${entry.skill}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push([entry.domain, entry.skill]);
          if (result.length >= 3) break;
        }
      }
    }
    return result;
  }

  const labs = await prisma.lab.findMany({ select: { id: true, title: true, description: true, dockerImage: true } });
  console.log(`  📦 Found ${labs.length} labs to wire`);

  let labSkillLinks = 0;
  let labsWithNoMatch = 0;

  for (const lab of labs) {
    const haystack = `${lab.title} ${lab.description ?? ''} ${lab.dockerImage ?? ''}`;
    let inferred = inferSkillsForText(haystack);

    // Fallback: ensure at least 1 skill per lab
    if (inferred.length === 0) {
      labsWithNoMatch++;
      // Heuristic fallback by image
      const img = (lab.dockerImage ?? '').toLowerCase();
      if (img.includes('kali') || img.includes('parrot')) inferred = [['SECURITY', 'pentesting']];
      else if (img.includes('postgres')) inferred = [['DATABASES', 'postgresql']];
      else if (img.includes('mongo')) inferred = [['DATABASES', 'mongodb']];
      else if (img.includes('redis')) inferred = [['DATABASES', 'redis']];
      else if (img.includes('nginx')) inferred = [['SYSTEMS', 'sysadmin']];
      else inferred = [['SYSTEMS', 'linux']];
    }

    // Cap to 3
    inferred = inferred.slice(0, 3);

    for (const [domain, skillName] of inferred) {
      const skillId = resolveSkillId(domain, skillName);
      if (!skillId) {
        console.warn(`    ⚠ Skill not found for mapping ${domain}::${skillName} (lab: ${lab.title})`);
        continue;
      }
      await prisma.labSkill.upsert({
        where: { labId_skillId: { labId: lab.id, skillId } },
        update: {},
        create: { labId: lab.id, skillId },
      });
      labSkillLinks++;
    }
  }

  console.log(`  ✅ LabSkill: ${labSkillLinks} links across ${labs.length} labs (${labsWithNoMatch} fallback)`);
  // Verify coverage
  const labsCovered = await prisma.labSkill.groupBy({ by: ['labId'], _count: { labId: true } });
  const uncoveredLabs = labs.length - labsCovered.length;
  if (uncoveredLabs > 0) console.warn(`  ⚠ ${uncoveredLabs} lab(s) still without skills`);

  // ─────────────────────────────────────────────────────────────────
  // 3. LESSON / QUIZ → SKILL WIRING
  // ─────────────────────────────────────────────────────────────────
  // Schema has no direct QuizSkill table; we wire via LabSkill for lessons that have labId,
  // and log inference coverage for all lessons with quizzes.
  const lessons = await prisma.lesson.findMany({
    include: {
      section: { include: { course: true } },
      quiz: { include: { questions: true } },
      lab: { select: { id: true, title: true } },
    },
  });
  console.log(`  📚 Found ${lessons.length} lessons (${lessons.filter((l) => l.quiz).length} with quizzes)`);

  let quizzesWired = 0;
  let quizzesInferred = 0;
  let quizzesWithoutSkill = 0;

  for (const lesson of lessons) {
    if (!lesson.quiz) continue;
    const haystack = `${lesson.title} ${lesson.section.title} ${lesson.section.course.title} ${lesson.content ?? ''}`;
    const inferred = inferSkillsForText(haystack);

    if (inferred.length === 0) {
      quizzesWithoutSkill++;
      continue;
    }
    quizzesInferred++;

    // If lesson has a lab, ensure those inferred skills are present on the lab
    if (lesson.labId && lesson.lab) {
      for (const [domain, skillName] of inferred.slice(0, 2)) {
        const skillId = resolveSkillId(domain, skillName);
        if (!skillId) continue;
        const existing = await prisma.labSkill.findUnique({
          where: { labId_skillId: { labId: lesson.labId, skillId } },
        });
        if (!existing) {
          await prisma.labSkill.create({ data: { labId: lesson.labId, skillId } });
          labSkillLinks++;
          quizzesWired++;
        } else {
          quizzesWired++;
        }
      }
    } else {
      // No direct lab: count as inferred but not materialized as LabSkill.
      // For analytics we ensure at least LabOutcome/SkillOutcome path exists for inferred skills
      quizzesWired++;
    }
  }

  console.log(`  ✅ Quiz↔Skill: ${quizzesInferred}/${lessons.filter((l) => l.quiz).length} quizzes inferred to skills, ${quizzesWired} wiring actions, ${quizzesWithoutSkill} without inference`);

  // Ensure every lesson without quiz still has a quiz? We do NOT create quizzes here; backfill is handled by seed-enrich-helpers.
  // Just report.

  // ─────────────────────────────────────────────────────────────────
  // 4. LEARNING OUTCOMES + MAPPINGS
  // ─────────────────────────────────────────────────────────────────
  const OUTCOMES: Array<{ code: string; title: string; description: string; domainName: string; weight: number }> = [
    {
      code: 'LO1',
      title: 'Linux System Administration',
      description: 'Demonstrate proficiency in Linux CLI, file systems, users, permissions and process management.',
      domainName: 'SYSTEMS',
      weight: 1.0,
    },
    {
      code: 'LO1',
      title: 'Network Architecture & Protocols',
      description: 'Design, configure and secure network services including DNS, DHCP, VPN and firewalling.',
      domainName: 'NETWORKING',
      weight: 1.0,
    },
    {
      code: 'LO1',
      title: 'Containerization & Orchestration',
      description: 'Build, ship and orchestrate containerized workloads with Docker and Kubernetes.',
      domainName: 'DEVOPS',
      weight: 1.0,
    },
    {
      code: 'LO2',
      title: 'CI/CD & Infrastructure as Code',
      description: 'Implement CI/CD pipelines and manage infrastructure with Terraform, Ansible and GitOps.',
      domainName: 'DEVOPS',
      weight: 1.0,
    },
    {
      code: 'LO1',
      title: 'Database Design & Administration',
      description: 'Administer relational and NoSQL databases, backups, replication and security hardening.',
      domainName: 'DATABASES',
      weight: 1.0,
    },
    {
      code: 'LO1',
      title: 'Offensive Security & Penetration Testing',
      description: 'Execute reconnaissance, vulnerability scanning and exploitation in a controlled environment.',
      domainName: 'SECURITY',
      weight: 1.2,
    },
    {
      code: 'LO2',
      title: 'Defensive Security & Incident Response',
      description: 'Apply hardening, monitoring, forensics and incident response using CIS, ModSecurity and DFIR tools.',
      domainName: 'SECURITY',
      weight: 1.2,
    },
    {
      code: 'LO1',
      title: 'Quality Assurance & Testing Strategy',
      description: 'Design and execute testing, UAT and quality gates for reliable software delivery.',
      domainName: 'QA',
      weight: 0.8,
    },
  ];

  const outcomeIds: Array<{ id: string; domainId: string; domainName: string }> = [];

  for (const o of OUTCOMES) {
    const domainId = domainIdByName.get(o.domainName);
    if (!domainId) {
      console.warn(`  ⚠ Domain not found for outcome ${o.title}: ${o.domainName}`);
      continue;
    }

    // Idempotent: find by domainId+code, else create; update title/description/weight on conflict
    let outcome = await prisma.learningOutcome.findFirst({
      where: { domainId, code: o.code },
    });

    if (!outcome) {
      outcome = await prisma.learningOutcome.create({
        data: {
          code: o.code,
          title: o.title,
          description: o.description,
          domainId,
          weight: o.weight,
        },
      });
      console.log(`    + Outcome ${o.domainName} ${o.code}: ${o.title}`);
    } else {
      // Keep existing id but ensure fields are current (idempotent update)
      if (outcome.title !== o.title || outcome.description !== o.description || outcome.weight !== o.weight) {
        outcome = await prisma.learningOutcome.update({
          where: { id: outcome.id },
          data: { title: o.title, description: o.description, weight: o.weight },
        });
      }
    }
    outcomeIds.push({ id: outcome.id, domainId, domainName: o.domainName });
  }

  console.log(`  ✅ LearningOutcomes: ${outcomeIds.length} ensured`);

  // Map each outcome → its domain's skills via SkillOutcome
  let skillOutcomeLinks = 0;
  for (const oc of outcomeIds) {
    const domainSkills = allSkillDomains.find((d) => d.id === oc.domainId)?.skills ?? [];
    // Fallback: use DOMAINS definition if not found in DB fetch
    const skillsToLink = domainSkills.length > 0
      ? domainSkills
      : (DOMAINS.find((d) => d.name === oc.domainName)?.skills.map((s) => ({
          id: skillIdByDomainAndName.get(`${oc.domainName}::${s.name}`)!,
          name: s.name,
        })) ?? []);

    for (const s of skillsToLink) {
      const skillId = (s as { id: string }).id;
      if (!skillId) continue;
      await prisma.skillOutcome.upsert({
        where: { skillId_learningOutcomeId: { skillId, learningOutcomeId: oc.id } },
        update: { weight: 1.0 },
        create: { skillId, learningOutcomeId: oc.id, weight: 1.0 },
      });
      skillOutcomeLinks++;
    }
  }
  console.log(`  ✅ SkillOutcome: ${skillOutcomeLinks} links`);

  // Map each outcome → relevant labs via LabOutcome (labs whose skills intersect outcome domain)
  // For every labSkill, create LabOutcome linking that lab to the domain's LO(s)
  let labOutcomeLinks = 0;
  const labSkills = await prisma.labSkill.findMany({ include: { skill: true, lab: true } });
  // Build domain → outcomeIds map
  const outcomesByDomain = new Map<string, string[]>();
  for (const oc of outcomeIds) {
    const arr = outcomesByDomain.get(oc.domainId) ?? [];
    arr.push(oc.id);
    outcomesByDomain.set(oc.domainId, arr);
  }

  for (const ls of labSkills) {
    const domainId = ls.skill.domainId;
    const domainOutcomeIds = outcomesByDomain.get(domainId) ?? [];
    for (const oid of domainOutcomeIds) {
      await prisma.labOutcome.upsert({
        where: { labId_learningOutcomeId: { labId: ls.labId, learningOutcomeId: oid } },
        update: { weight: 1.0 },
        create: { labId: ls.labId, learningOutcomeId: oid, weight: 1.0 },
      });
      labOutcomeLinks++;
    }
  }
  console.log(`  ✅ LabOutcome: ${labOutcomeLinks} links (deduped via upsert)`);

  // Summary
  const finalLabSkillCount = await prisma.labSkill.count();
  const finalOutcomes = await prisma.learningOutcome.count();
  const finalSkillOutcomes = await prisma.skillOutcome.count();
  const finalLabOutcomes = await prisma.labOutcome.count();
  const finalQuizzes = await prisma.quiz.count();

  console.log('──────────────────────────────────────────────');
  console.log(`  Summary: Domains=${DOMAINS.length} Skills=${totalSkills} Labs=${labs.length}`);
  console.log(`           LabSkills=${finalLabSkillCount} Quizzes=${finalQuizzes} Lessons=${lessons.length}`);
  console.log(`           Outcomes=${finalOutcomes} SkillOutcomes=${finalSkillOutcomes} LabOutcomes=${finalLabOutcomes}`);
  console.log('🔧 [seed-skills-wiring] complete');
}
