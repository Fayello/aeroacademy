import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const prisma = new PrismaClient();

const modules = [
  { file: 'linux-mod1-ssh-and-navigation.md', sectionContains: 'Getting Started', lessonContains: 'Linux Boot Process' },
  { file: 'linux-mod2-users-groups-permissions.md', sectionContains: 'Users, Groups', lessonContains: 'User and Group' },
  { file: 'linux-mod3-processes-systemd.md', sectionContains: 'Advanced Administration', lessonContains: 'systemd' },
  { file: 'linux-mod4-networking.md', sectionContains: 'Getting Started', lessonContains: 'File System' },
  { file: 'linux-mod5-text-processing.md', sectionContains: 'Shell Scripting', lessonContains: 'Bash Scripting' },
  { file: 'linux-mod6-package-management.md', sectionContains: 'Getting Started', lessonContains: 'Essential Command' },
  { file: 'linux-mod7-ssh-hardening.md', sectionContains: 'Users, Groups', lessonContains: 'sudo' },
  { file: 'linux-mod8-shell-scripting.md', sectionContains: 'Shell Scripting', lessonContains: 'Text Processing' },
  { file: 'linux-mod9-logs-troubleshooting.md', sectionContains: 'Advanced Administration', lessonContains: 'Log Management' },
  { file: 'linux-mod10-system-hardening.md', sectionContains: 'Users, Groups', lessonContains: 'File Permissions' },
];

async function main() {
  const courseId = 'e0822ffc-b4f7-4288-8ffa-9029529fe1cf'; // Linux Fundamentals
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error('Course not found');

  for (const mod of modules) {
    const md = fs.readFileSync(path.join(__dirname, mod.file), 'utf8');
    const section = await prisma.section.findFirst({
      where: { courseId, title: { contains: mod.sectionContains } }
    });
    if (!section) { console.log(`Section not found: ${mod.sectionContains}`); continue; }

    const lesson = await prisma.lesson.findFirst({
      where: { sectionId: section.id, title: { contains: mod.lessonContains } }
    });
    if (!lesson) { console.log(`Lesson not found: ${mod.lessonContains}`); continue; }

    await prisma.lesson.update({ where: { id: lesson.id }, data: { content: md } });
    console.log(`Updated: ${lesson.title} (${md.length} chars)`);
  }

  // Clean up duplicate lessons in section4
  const dupes = await prisma.$queryRawUnsafe(`
    SELECT l1.id as keep_id, l2.id as remove_id
    FROM "Lesson" l1
    JOIN "Lesson" l2 ON l1.title = l2.title AND l1.id != l2.id
    JOIN "Section" s1 ON l1."sectionId" = s1.id
    JOIN "Section" s2 ON l2."sectionId" = s2.id
    WHERE s1."courseId" = '${courseId}' AND s1.id = s2.id
    AND l1."order" < l2."order"
  `) as any[];

  for (const d of dupes) {
    await prisma.answer.deleteMany({ where: { question: { quiz: { lessonId: d.remove_id } } } });
    await prisma.question.deleteMany({ where: { quiz: { lessonId: d.remove_id } } });
    await prisma.quiz.deleteMany({ where: { lessonId: d.remove_id } });
    await prisma.lesson.delete({ where: { id: d.remove_id } });
    console.log(`Removed duplicate lesson: ${d.remove_id}`);
  }

  console.log('Done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
