import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const prisma = new PrismaClient();

const courses = [
  { id: '41320943-d4e3-4d7a-a5ef-1eb5816c084d', prefix: 'cloudsec', name: 'Cloud Security & Hardening' },
  { id: '8b116e54-a810-446a-8c91-b375dcffbecf', prefix: 'dbadmin', name: 'Database Administration & Security' },
  { id: 'af563710-f028-468e-97d4-fe8e704a2529', prefix: 'ir', name: 'Incident Response & Digital Forensics' },
  { id: '49683ab5-be4b-4b4b-9b03-b03e4e776aec', prefix: 'k8s', name: 'Kubernetes Administration & Security' },
  { id: '6f8b735c-2e07-4d28-99e5-9c299f453e5a', prefix: 'pysec', name: 'Python for Cybersecurity & Automation' },
  { id: 'ac1882dd-e812-4020-9ba9-ca970ae6d945', prefix: 'malware', name: 'Malware Analysis & Reverse Engineering' },
  { id: '62a8257a-4dc0-4e2d-9fe0-adb9866c95eb', prefix: 'sre', name: 'Site Reliability Engineering' },
  { id: 'cfc30055-50ab-4c4b-83a0-580ec407140f', prefix: 'fullstack', name: 'Full-Stack JavaScript Development' },
  { id: 'b0ad8040-ad84-47a8-8588-1e39c92427c7', prefix: 'iac', name: 'Infrastructure as Code' },
  { id: 'e525b288-d8e8-4d49-99b8-bc27e46829e5', prefix: 'api', name: 'API Design & Security' },
  { id: '7cd6af83-f843-42ec-bb1a-007eb7577d95', prefix: 'blockchain', name: 'Blockchain Security & Smart Contracts' },
  { id: '0801ddab-7d9a-4053-ad22-50c024d5c3cf', prefix: 'ai', name: 'AI Engineering & MLOps' },
  { id: '8985b525-2fcc-4743-8696-e44c1def2e79', prefix: 'quantum', name: 'Quantum Computing & Post-Quantum Cryptography' },
];

const sectionNames: Record<string, string[]> = {
  cloudsec: ['Shared Responsibility', 'IAM & Least Privilege', 'Network Security', 'Data Protection', 'Logging & Monitoring', 'Container Security', 'Serverless Security', 'Compliance', 'Incident Response', 'Multi-Cloud Security'],
  dbadmin: ['Fundamentals', 'PostgreSQL', 'MySQL', 'MongoDB', 'SQL Injection', 'Access Control', 'Encryption', 'Backup & Recovery', 'Performance Tuning', 'Security Hardening'],
  ir: ['IR Process', 'Detection & Triage', 'Containment', 'Eradication', 'Recovery', 'Forensics Fundamentals', 'Memory Forensics', 'Disk Forensics', 'Network Forensics', 'Post-Incident Review'],
  k8s: ['Architecture', 'Pod Security', 'RBAC', 'Network Policies', 'Secrets Management', 'Image Security', 'Cluster Hardening', 'Monitoring', 'Disaster Recovery', 'Advanced Security'],
  pysec: ['Python for Security', 'Network Scanning', 'Packet Analysis', 'Web Scraping', 'Exploit Development', 'Automation', 'Cryptography', 'Forensics Scripts', 'Malware Analysis', 'Security Tools'],
  malware: ['Taxonomy', 'Safe Environment', 'Static Analysis', 'Dynamic Analysis', 'x86 Assembly', 'Debugging', 'Reverse Engineering', 'Anti-Analysis', 'Classification', 'Incident Response'],
  sre: ['SRE Fundamentals', 'SLIs/SLOs/SLAs', 'Toil Reduction', 'Change Management', 'Capacity Planning', 'Performance', 'Incident Management', 'Post-Mortems', 'Chaos Engineering', 'Continuous Improvement'],
  fullstack: ['JavaScript Fundamentals', 'Node.js & Express', 'React', 'Database Integration', 'Authentication', 'API Design', 'Testing', 'Deployment', 'Security', 'Performance'],
  iac: ['IaC Fundamentals', 'Terraform Basics', 'Terraform Modules', 'Terraform Workspaces', 'Pulumi', 'Ansible', 'CloudFormation', 'Security in IaC', 'Testing IaC', 'IaC at Scale'],
  api: ['API Fundamentals', 'RESTful Design', 'Authentication', 'Authorization', 'Input Validation', 'Error Handling', 'Versioning', 'GraphQL Security', 'API Testing', 'API Gateway'],
  blockchain: ['Fundamentals', 'Ethereum & Contracts', 'Vulnerabilities', 'Contract Testing', 'DeFi Security', 'Wallet Security', 'Exchange Security', 'Token Security', 'Governance', 'Incident Response'],
  ai: ['ML Fundamentals', 'MLOps Pipeline', 'Model Training', 'Model Deployment', 'Monitoring', 'Security', 'Ethics', 'Infrastructure', 'Governance', 'Production'],
  quantum: ['Quantum Fundamentals', 'Qubits & Gates', 'Algorithms', 'Cryptography Threats', 'Post-Quantum Algorithms', 'Key Exchange', 'Digital Signatures', 'Migration', 'Implementation', 'Future'],
};

function generateStableId(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(1, 4)}-${((parseInt(hex.slice(0, 2), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0')}${hex.slice(2, 4)}-${hex.slice(4, 8)}${hex.slice(0, 4)}`;
}

async function upsertSection(courseId: string, title: string, order: number) {
  const existing = await prisma.section.findFirst({ where: { courseId, order } });
  if (existing) {
    await prisma.section.update({ where: { id: existing.id }, data: { title } });
    return existing;
  }
  return prisma.section.create({ data: { courseId, title, order } });
}

async function upsertLesson(sectionId: string, title: string, content: string, order: number) {
  const existing = await prisma.lesson.findFirst({ where: { sectionId, order } });
  if (existing) {
    await prisma.lesson.update({ where: { id: existing.id }, data: { title, content } });
    return existing;
  }
  return prisma.lesson.create({ data: { sectionId, title, content, order } });
}

async function main() {
  for (const course of courses) {
    console.log(`\n=== ${course.name} ===`);
    const c = await prisma.course.findUnique({ where: { id: course.id } });
    if (!c) { console.log('  SKIP - not found'); continue; }

    const sections = sectionNames[course.prefix] || [];
    for (let i = 0; i < 10; i++) {
      const file = `${course.prefix}-mod${i + 1}.md`;
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) { console.log(`  MISSING: ${file}`); continue; }
      const md = fs.readFileSync(filePath, 'utf8');
      const title = md.split('\n')[0].replace(/^# /, '').replace(/Module \d+: /, '');
      const section = await upsertSection(course.id, sections[i] || `Module ${i + 1}`, i);
      const lesson = await upsertLesson(section.id, title, md, 0);
      console.log(`  ${i + 1}. ${lesson.title} (${md.length} chars)`);
    }
  }
  console.log('\nDone');
}

main().catch(console.error).finally(() => prisma.$disconnect());
