import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lessons = await prisma.lesson.findMany();
  let updated = 0;

  for (const lesson of lessons) {
    if (!lesson.title) continue;
    const newTitle = lesson.title.replace(/Module (\d+) —/g, 'Module $1:').replace(/ — /g, ': ');
    if (newTitle !== lesson.title) {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { title: newTitle },
      });
      console.log(`Fixed: "${lesson.title}" → "${newTitle}"`);
      updated++;
    }
  }

  console.log(`\nUpdated ${updated} lesson titles`);
}

main().then(() => prisma.$disconnect());
