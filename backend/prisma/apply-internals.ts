import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const prisma = new PrismaClient();

// Course: Linux Kernel & System Internals (7647f852...)
const courseId = '7647f852-ba48-4b26-90f7-21a4387c0c17';

const modules = [
  { file: 'internals-mod1-boot.md', section: 'Kernel Boot & Initialization' },
  { file: 'internals-mod2-processes.md', section: 'Process Management' },
  { file: 'internals-mod3-memory.md', section: 'Memory Management' },
  { file: 'internals-mod4-filesystems.md', section: 'Filesystem Internals' },
  { file: 'internals-mod5-syscalls.md', section: 'System Calls & Kernel Interface' },
  { file: 'internals-mod6-kernel-modules.md', section: 'Kernel Modules & eBPF' },
  { file: 'internals-mod7-containers.md', section: 'Namespaces & Containers' },
  { file: 'internals-mod8-hardware.md', section: 'Device Drivers & Hardware' },
  { file: 'internals-mod9-profiling.md', section: 'Performance Profiling' },
  { file: 'internals-mod10-security.md', section: 'Kernel Security' },
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
