import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LAB_SKILL_MAP: Record<string, string[]> = {
  Linux: ['SYSTEMS', 'linux'],
  Ubuntu: ['SYSTEMS', 'linux'],
  Debian: ['SYSTEMS', 'linux'],
  CentOS: ['SYSTEMS', 'linux'],
  Shell: ['SYSTEMS', 'linux'],
  Scripting: ['SYSTEMS', 'automation'],
  'File Permission': ['SYSTEMS', 'linux'],
  Process: ['SYSTEMS', 'linux'],
  'Text Processing': ['SYSTEMS', 'linux'],
  Kernel: ['SYSTEMS', 'linux'],
  Docker: ['DEVOPS', 'docker'],
  Container: ['DEVOPS', 'docker'],
  Kubernetes: ['DEVOPS', 'kubernetes'],
  Git: ['DEVOPS', 'git'],
  Gitea: ['DEVOPS', 'git'],
  Ansible: ['SYSTEMS', 'automation'],
  Nginx: ['SYSTEMS', 'sysadmin'],
  'Web Server': ['SYSTEMS', 'sysadmin'],
  Mail: ['SYSTEMS', 'sysadmin'],
  Postfix: ['SYSTEMS', 'sysadmin'],
  Prometheus: ['DEVOPS', 'cicd'],
  Grafana: ['DEVOPS', 'cicd'],
  Monitoring: ['DEVOPS', 'cicd'],
  Backup: ['SYSTEMS', 'sysadmin'],
  Storage: ['SYSTEMS', 'sysadmin'],
  HAProxy: ['NETWORKING', 'netadmin'],
  Keepalived: ['NETWORKING', 'netadmin'],
  'High Availability': ['NETWORKING', 'netadmin'],
  Network: ['NETWORKING', 'networking'],
  DNS: ['NETWORKING', 'dns'],
  Firewall: ['NETWORKING', 'firewalls'],
  VPN: ['NETWORKING', 'firewalls'],
  IDS: ['NETWORKING', 'firewalls'],
  IPS: ['NETWORKING', 'firewalls'],
  Database: ['DATABASES', 'sql'],
  MySQL: ['DATABASES', 'mysql'],
  MariaDB: ['DATABASES', 'mysql'],
  PostgreSQL: ['DATABASES', 'postgresql'],
  Kali: ['SECURITY', 'cybersecurity'],
  Security: ['SECURITY', 'cybersecurity'],
  Hardening: ['SECURITY', 'hardening'],
  Penetration: ['SECURITY', 'cybersecurity'],
  Exploitation: ['SECURITY', 'cybersecurity'],
  Forensic: ['SECURITY', 'cybersecurity'],
  ModSecurity: ['SECURITY', 'hardening'],
  OpenSCAP: ['SECURITY', 'hardening'],
  CIS: ['SECURITY', 'hardening'],
  Compliance: ['SECURITY', 'hardening'],
  'Linux Automation': ['SYSTEMS', 'automation'],
  'Server Administration': ['SYSTEMS', 'sysadmin'],
  'Centralized Logging': ['SYSTEMS', 'sysadmin'],
};

async function main() {
  const labs = await prisma.lab.findMany({ select: { id: true, title: true } });
  const skillDomains = await prisma.skillDomain.findMany({
    include: { skills: true },
  });

  const domainMap = new Map<string, Map<string, string>>();
  for (const sd of skillDomains) {
    const skillMap = new Map<string, string>();
    for (const s of sd.skills) {
      skillMap.set(s.name, s.id);
    }
    domainMap.set(sd.name, skillMap);
  }

  let linked = 0;
  for (const lab of labs) {
    const title = lab.title;
    for (const [keyword, [domainName, skillName]] of Object.entries(
      LAB_SKILL_MAP,
    )) {
      if (title.includes(keyword)) {
        const skillMap = domainMap.get(domainName);
        const skillId = skillMap?.get(skillName);
        if (skillId) {
          await prisma.labSkill.upsert({
            where: { labId_skillId: { labId: lab.id, skillId } },
            update: {},
            create: { labId: lab.id, skillId },
          });
          linked++;
        }
      }
    }
  }

  console.log(
    `Linked ${linked} lab-skill relationships across ${labs.length} labs`,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
