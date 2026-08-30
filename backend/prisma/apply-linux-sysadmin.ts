import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const prisma = new PrismaClient();

// Course: Web Server Administration (29cfecbb...) -> rewrite as Linux Systems Administration
const courseId = '29cfecbb-9f10-4173-a9e4-32ad87517632';

const modules = [
  { file: 'sysadmin-mod1-boot-kernel.md', sectionContains: 'Nginx', lessonContains: 'Nginx Architecture' },
  { file: 'sysadmin-mod2-storage-filesystems.md', sectionContains: 'Nginx', lessonContains: 'Reverse Proxy' },
  { file: 'sysadmin-mod3-user-admin.md', sectionContains: 'Nginx', lessonContains: 'SSL/TLS' },
  { file: 'sysadmin-mod4-service-management.md', sectionContains: 'Apache', lessonContains: 'Apache Configuration' },
  { file: 'sysadmin-mod5-network-config.md', sectionContains: 'Apache', lessonContains: 'Security Hardening' },
  { file: 'sysadmin-mod6-security-hardening.md', sectionContains: 'Apache', lessonContains: 'Performance Tuning' },
  { file: 'sysadmin-mod7-backup-recovery.md', sectionContains: 'Application', lessonContains: 'Deploying Node' },
  { file: 'sysadmin-mod8-monitoring-logging.md', sectionContains: 'Application', lessonContains: 'Containerized' },
  { file: 'sysadmin-mod9-virtualization.md', sectionContains: 'Application', lessonContains: 'Zero-Downtime' },
];

// Create3 new sections for the 10-module structure
async function main() {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error('Course not found');

  // Delete existing sections and lessons
  const existingSections = await prisma.section.findMany({ where: { courseId } });
  for (const s of existingSections) {
    const lessons = await prisma.lesson.findMany({ where: { sectionId: s.id } });
    for (const l of lessons) {
      await prisma.answer.deleteMany({ where: { question: { quiz: { lessonId: l.id } } } });
      await prisma.question.deleteMany({ where: { quiz: { lessonId: l.id } } });
      await prisma.quiz.deleteMany({ where: { lessonId: l.id } });
    }
    await prisma.lesson.deleteMany({ where: { sectionId: s.id } });
    await prisma.section.delete({ where: { id: s.id } });
  }
  console.log('Cleaned existing sections');

  // Create new sections
  const sectionNames = [
    'Boot & Kernel',
    'Storage & Users',
    'Services & Networking',
    'Security & Backup',
    'Monitoring & Automation',
  ];

  const sections = [];
  for (let i = 0; i < sectionNames.length; i++) {
    const s = await prisma.section.create({ data: { courseId, title: sectionNames[i], order: i } });
    sections.push(s);
  }
  console.log('Created new sections');

  // Map modules to sections (2 per section, last section has1)
  const sectionMap = [0, 0, 1, 1, 2, 2, 3, 3, 4]; // index of section for each module

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    const md = fs.readFileSync(path.join(__dirname, mod.file), 'utf8');
    const section = sections[sectionMap[i]];

    const lesson = await prisma.lesson.create({
      data: {
        sectionId: section.id,
        title: md.split('\n')[0].replace(/^# /, '').replace(/Module \d+ — /, ''),
        content: md,
        order: i,
      }
    });
    console.log(`Created: ${lesson.title} (${md.length} chars)`);
  }

  console.log('Done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
