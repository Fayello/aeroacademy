import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lessons = await prisma.lesson.findMany({ orderBy: { title: 'asc' }, take: 30 });
  for (const l of lessons) {
    console.log(`"${l.title}"`);
  }
}

main().then(() => prisma.$disconnect());
