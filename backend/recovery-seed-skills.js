const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DOMAINS = [
  { name: 'SYSTEMS', displayName: 'Systems', skills: [
    { name: 'linux', displayName: 'Linux' },
    { name: 'windows', displayName: 'Windows' },
    { name: 'sysadmin', displayName: 'System Administration' },
    { name: 'automation', displayName: 'Automation' },
  ]},
  { name: 'NETWORKING', displayName: 'Networking', skills: [
    { name: 'networking', displayName: 'Networking' },
    { name: 'netadmin', displayName: 'Network Administration' },
    { name: 'dns', displayName: 'DNS' },
    { name: 'firewalls', displayName: 'Firewalls' },
  ]},
  { name: 'DEVOPS', displayName: 'DevOps', skills: [
    { name: 'docker', displayName: 'Docker' },
    { name: 'cicd', displayName: 'CI/CD' },
    { name: 'kubernetes', displayName: 'Kubernetes' },
    { name: 'terraform', displayName: 'Terraform' },
    { name: 'git', displayName: 'Git' },
  ]},
  { name: 'DATABASES', displayName: 'Databases', skills: [
    { name: 'sql', displayName: 'SQL' },
    { name: 'postgresql', displayName: 'PostgreSQL' },
    { name: 'mysql', displayName: 'MySQL' },
    { name: 'dba', displayName: 'Database Administration' },
  ]},
  { name: 'SECURITY', displayName: 'Security', skills: [
    { name: 'secops', displayName: 'SecOps' },
    { name: 'devsecops', displayName: 'DevSecOps' },
    { name: 'cybersecurity', displayName: 'Cybersecurity' },
    { name: 'hardening', displayName: 'System Hardening' },
  ]},
  { name: 'QA', displayName: 'QA & Testing', skills: [
    { name: 'testing', displayName: 'Testing' },
    { name: 'uat', displayName: 'UAT' },
  ]},
];

const LAB_SKILL_MAP = {
  'Linux': ['SYSTEMS', 'linux'], 'Ubuntu': ['SYSTEMS', 'linux'], 'Debian': ['SYSTEMS', 'linux'],
  'CentOS': ['SYSTEMS', 'linux'], 'Shell': ['SYSTEMS', 'linux'], 'Scripting': ['SYSTEMS', 'automation'],
  'File Permission': ['SYSTEMS', 'linux'], 'Process': ['SYSTEMS', 'linux'], 'Text Processing': ['SYSTEMS', 'linux'],
  'Kernel': ['SYSTEMS', 'linux'], 'Docker': ['DEVOPS', 'docker'], 'Container': ['DEVOPS', 'docker'],
  'Kubernetes': ['DEVOPS', 'kubernetes'], 'Git': ['DEVOPS', 'git'], 'Gitea': ['DEVOPS', 'git'],
  'Ansible': ['SYSTEMS', 'automation'], 'Nginx': ['SYSTEMS', 'sysadmin'], 'Web Server': ['SYSTEMS', 'sysadmin'],
  'Mail': ['SYSTEMS', 'sysadmin'], 'Postfix': ['SYSTEMS', 'sysadmin'], 'Prometheus': ['DEVOPS', 'cicd'],
  'Grafana': ['DEVOPS', 'cicd'], 'Monitoring': ['DEVOPS', 'cicd'], 'Backup': ['SYSTEMS', 'sysadmin'],
  'Storage': ['SYSTEMS', 'sysadmin'], 'HAProxy': ['NETWORKING', 'netadmin'], 'Keepalived': ['NETWORKING', 'netadmin'],
  'High Availability': ['NETWORKING', 'netadmin'], 'Network': ['NETWORKING', 'networking'], 'DNS': ['NETWORKING', 'dns'],
  'Firewall': ['NETWORKING', 'firewalls'], 'VPN': ['NETWORKING', 'firewalls'], 'IDS': ['NETWORKING', 'firewalls'],
  'IPS': ['NETWORKING', 'firewalls'], 'Database': ['DATABASES', 'sql'], 'MySQL': ['DATABASES', 'mysql'],
  'MariaDB': ['DATABASES', 'mysql'], 'PostgreSQL': ['DATABASES', 'postgresql'], 'Kali': ['SECURITY', 'cybersecurity'],
  'Security': ['SECURITY', 'cybersecurity'], 'Hardening': ['SECURITY', 'hardening'], 'Penetration': ['SECURITY', 'cybersecurity'],
  'Exploitation': ['SECURITY', 'cybersecurity'], 'Forensic': ['SECURITY', 'cybersecurity'], 'ModSecurity': ['SECURITY', 'hardening'],
  'OpenSCAP': ['SECURITY', 'hardening'], 'CIS': ['SECURITY', 'hardening'], 'Compliance': ['SECURITY', 'hardening'],
  'Linux Automation': ['SYSTEMS', 'automation'], 'Server Administration': ['SYSTEMS', 'sysadmin'],
  'Centralized Logging': ['SYSTEMS', 'sysadmin'],
};

const DEFAULT_UNLOCKS = [
  { feature: 'CORE_LEARNING', requiredLevel: 1, description: 'Access courses and labs' },
  { feature: 'DAILY_MISSIONS', requiredLevel: 2, description: 'Daily missions with XP rewards' },
  { feature: 'SKILL_PROFILE', requiredLevel: 4, description: 'View your skill progression' },
  { feature: 'ACHIEVEMENTS', requiredLevel: 5, description: 'Unlock achievements' },
  { feature: 'LEADERBOARD', requiredLevel: 7, description: 'Compete on the leaderboard' },
  { feature: 'RANKED_CHALLENGES', requiredLevel: 10, description: 'Ranked competitive challenges' },
  { feature: 'TEAM_CHALLENGES', requiredLevel: 15, description: 'Challenge your team' },
  { feature: 'ADVANCED_LABS', requiredLevel: 20, description: 'Access advanced labs' },
  { feature: 'SEASONAL', requiredLevel: 25, description: 'Seasonal competitions' },
];

async function main() {
  console.log('Seeding skill domains and skills...');
  for (const domain of DOMAINS) {
    const createdDomain = await prisma.skillDomain.upsert({
      where: { name: domain.name },
      update: { displayName: domain.displayName },
      create: { name: domain.name, displayName: domain.displayName },
    });
    console.log('  Domain: ' + createdDomain.displayName);
    for (const skill of domain.skills) {
      await prisma.skill.upsert({
        where: { domainId_name: { domainId: createdDomain.id, name: skill.name } },
        update: { displayName: skill.displayName },
        create: { domainId: createdDomain.id, name: skill.name, displayName: skill.displayName },
      });
    }
  }
  console.log('Skills seeded.');

  console.log('Linking labs to skills...');
  const labs = await prisma.lab.findMany({ select: { id: true, title: true } });
  const skillDomains = await prisma.skillDomain.findMany({ include: { skills: true } });
  const domainMap = new Map();
  for (const sd of skillDomains) {
    const skillMap = new Map();
    for (const s of sd.skills) skillMap.set(s.name, s.id);
    domainMap.set(sd.name, skillMap);
  }
  let linked = 0;
  for (const lab of labs) {
    for (const [keyword, [domainName, skillName]] of Object.entries(LAB_SKILL_MAP)) {
      if (lab.title.includes(keyword)) {
        const skillMap = domainMap.get(domainName);
        const skillId = skillMap && skillMap.get(skillName);
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
  console.log('Linked ' + linked + ' lab-skill relationships.');

  console.log('Seeding feature unlocks...');
  for (const u of DEFAULT_UNLOCKS) {
    await prisma.featureUnlock.upsert({
      where: { feature: u.feature },
      update: { requiredLevel: u.requiredLevel, description: u.description },
      create: u,
    });
  }
  console.log('Feature unlocks seeded: ' + DEFAULT_UNLOCKS.length);

  console.log('Seeding daily missions...');
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const now2 = new Date();
  const startOfDay = new Date(now2); startOfDay.setHours(0,0,0,0);
  const endOfDay = new Date(now2); endOfDay.setHours(23,59,59,999);
  const missions = [
    { title: 'Flag Catcher', description: 'Capture 3 flags across any labs', type: 'DAILY_WARMUP', difficulty: 'EASY', objectiveType: 'FLAG_COMPLETIONS', objectiveTarget: 3, xpReward: 150, metadata: { trigger: 'FLAG_CAPTURES' }, startAt: startOfDay, endAt: endOfDay },
    { title: 'Lab Explorer', description: 'Start a new lab session', type: 'DAILY_SKILL', difficulty: 'EASY', objectiveType: 'LAB_COMPLETIONS', objectiveTarget: 1, xpReward: 50, metadata: { trigger: 'LAB_START' }, startAt: startOfDay, endAt: endOfDay },
    { title: 'Code Warrior', description: 'Submit 5 answers in any lab', type: 'DAILY_BOSS', difficulty: 'EASY', objectiveType: 'FLAG_COMPLETIONS', objectiveTarget: 5, xpReward: 100, metadata: { trigger: 'FLAG_SUBMISSIONS' }, startAt: startOfDay, endAt: endOfDay },
  ];
  for (const m of missions) {
    const exists = await prisma.challenge.findFirst({ where: { title: m.title, type: m.type } });
    if (!exists) {
      await prisma.challenge.create({ data: m });
    }
  }
  console.log('Daily missions seeded.');
  console.log('All recovery seeds complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
