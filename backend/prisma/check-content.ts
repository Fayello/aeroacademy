import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lessons = await prisma.lesson.findMany({ orderBy: { title: 'asc' } });
  const total = lessons.length;
  const withContent = lessons.filter(l => l.content && l.content.length > 20000).length;
  const avg = Math.round(lessons.reduce((s, l) => s + (l.content?.length || 0), 0) / total);
  const below = lessons.filter(l => l.content && l.content.length < 15000).map(l => `  ${l.title} (${l.content?.length || 0} chars)`);
  
  console.log(`Total lessons: ${total}`);
  console.log(`Over 20k chars: ${withContent}`);
  console.log(`Average chars: ${avg}`);
  console.log(`Below 15k: ${below.length}`);
  if (below.length > 0) console.log(below.join('\n'));
}

main().then(() => prisma.$disconnect());
