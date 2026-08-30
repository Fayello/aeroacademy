import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const prisma = new PrismaClient();

// Course: Networking & Security (d8029430...) -> rewrite as Networking
const courseId = 'd8029430-8cc8-4ab9-92f1-2b11ce9f17b4';

const modules = [
  { file: 'net-mod1-osi-packets.md', section: 'Protocol Layers & Packet Flow' },
  { file: 'net-mod2-subnetting.md', section: 'IP Addressing & Subnetting' },
  { file: 'net-mod3-dns.md', section: 'DNS & Name Resolution' },
  { file: 'net-mod4-routing.md', section: 'Routing & Traffic Path' },
  { file: 'net-mod5-switching-vlans.md', section: 'Switching & VLANs' },
  { file: 'net-mod6-firewalls.md', section: 'Firewalls & Filtering' },
  { file: 'net-mod7-vpn.md', section: 'VPN Technologies' },
  { file: 'net-mod8-troubleshooting.md', section: 'Network Troubleshooting' },
  { file: 'net-mod9-packet-analysis.md', section: 'Packet Analysis' },
  { file: 'net-mod10-security-monitoring.md', section: 'Network Security Monitoring' },
];

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

  // Create one section per module
  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    const md = fs.readFileSync(path.join(__dirname, mod.file), 'utf8');
    const section = await prisma.section.create({ data: { courseId, title: mod.section, order: i } });
    const lesson = await prisma.lesson.create({
      data: {
        sectionId: section.id,
        title: md.split('\n')[0].replace(/^# /, '').replace(/Module \d+ — /, ''),
        content: md,
        order: 0,
      }
    });
    console.log(`Created: ${lesson.title} (${md.length} chars)`);
  }

  console.log('Done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
