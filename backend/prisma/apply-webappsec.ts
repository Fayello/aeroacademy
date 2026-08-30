import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const prisma = new PrismaClient();

// Course: Advanced Web Vulnerabilities (d504a621...)
const courseId = 'd504a621-2c61-4060-9e40-db450c094a00';

const modules = [
  { file: 'was-mod1-http.md', section: 'HTTP Fundamentals' },
  { file: 'was-mod2-injection.md', section: 'Injection Attacks' },
  { file: 'was-mod3-xss.md', section: 'Cross-Site Scripting' },
  { file: 'was-mod4-auth-sessions.md', section: 'Authentication & Session Attacks' },
  { file: 'was-mod5-access-control.md', section: 'Access Control' },
  { file: 'was-mod6-misconfiguration.md', section: 'Security Misconfiguration' },
  { file: 'was-mod7-crypto-failures.md', section: 'Cryptographic Failures' },
  { file: 'was-mod8-ssrf.md', section: 'Server-Side Request Forgery' },
  { file: 'was-mod9-api-security.md', section: 'API Security' },
  { file: 'was-mod10-modern-attacks.md', section: 'Modern Attack Surfaces' },
];

async function main() {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error('Course not found');

  const existingSections = await prisma.section.findMany({ where: { courseId } });
  for (const s of existingSections) {
    const lessons = await prisma.lesson.findMany({ where: { sectionId: s.id } });
    for (const l of lessons) {
      await prisma.progress.deleteMany({ where: { lessonId: l.id } });
      await prisma.answer.deleteMany({ where: { question: { quiz: { lessonId: l.id } } } });
      await prisma.question.deleteMany({ where: { quiz: { lessonId: l.id } } });
      await prisma.quiz.deleteMany({ where: { lessonId: l.id } });
    }
    await prisma.lesson.deleteMany({ where: { sectionId: s.id } });
    await prisma.section.delete({ where: { id: s.id } });
  }
  console.log('Cleaned existing sections');

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
