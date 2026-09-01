import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Pick a few lessons across courses and confirm stable IDs
  const lessons = await prisma.lesson.findMany({
    select: { id: true, title: true, section: { select: { course: { select: { title: true } } } } },
    take: 10,
  });
  for (const l of lessons) {
    console.log(`${l.id} | ${l.title} | ${l.section?.course?.title}`);
  }

  const total = await prisma.lesson.count();
  console.log(`\nTotal lessons: ${total}`);
}

main().then(() => prisma.$disconnect());
