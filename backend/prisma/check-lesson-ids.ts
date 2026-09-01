import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check if the specific lesson exists
  const lesson = await prisma.lesson.findUnique({ where: { id: 'a6725d7e-20f5-46b0-b5b1-ee40638b8da3' } });
  if (lesson) {
    console.log('Lesson found:', lesson.title);
  } else {
    console.log('Lesson NOT found: a6725d7e-20f5-46b0-b5b1-ee40638b8da3');
  }

  // Check if apply scripts are deleting/recreating lessons (changing IDs)
  const courses = await prisma.course.findMany({ include: { sections: { include: { lessons: { select: { id: true, title: true } } } } } });
  for (const course of courses) {
    const totalLessons = course.sections.reduce((s, sec) => s + sec.lessons.length, 0);
    if (totalLessons > 0) {
      console.log(`\n${course.title} (${totalLessons} lessons):`);
      for (const sec of course.sections) {
        for (const l of sec.lessons) {
          console.log(`  ${l.id} | ${l.title}`);
        }
      }
    }
  }
}

main().then(() => prisma.$disconnect());
