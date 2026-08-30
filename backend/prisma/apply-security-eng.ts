import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const prisma = new PrismaClient();

// Course: Product Security Architecture & SDL (04c3438e...)
const courseId = '04c3438e-cff8-493a-8e50-b5b0413d737c';

const modules = [
  { file: 'seceng-mod1-what-it-is.md', section: 'Security Fundamentals' },
  { file: 'seceng-mod2-threat-modeling.md', section: 'Threat Modeling' },
  { file: 'seceng-mod3-secure-design.md', section: 'Secure Design' },
  { file: 'seceng-mod4-code-review.md', section: 'Secure Code Review' },
  { file: 'seceng-mod5-automation.md', section: 'Security Automation' },
  { file: 'seceng-mod6-authn-authz.md', section: 'Authentication & Authorization' },
  { file: 'seceng-mod7-cryptography.md', section: 'Cryptography' },
  { file: 'seceng-mod8-incident-response.md', section: 'Incident Response' },
  { file: 'seceng-mod9-vulnerability-management.md', section: 'Vulnerability Management' },
  { file: 'seceng-mod10-architecture.md', section: 'Security Architecture' },
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
