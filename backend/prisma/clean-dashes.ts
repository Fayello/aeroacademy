import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function removeDashes(content: string): string {
  let cleaned = content;
  
  // Remove standalone --- lines (horizontal rules)
  cleaned = cleaned.replace(/^---\s*$/gm, '');
  
  // Clean up multiple blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned.trim();
}

async function main() {
  const lessons = await prisma.lesson.findMany({
    where: { content: { contains: '---' } }
  });

  console.log(`Found ${lessons.length} lessons with dashes`);

  let updated = 0;
  for (const lesson of lessons) {
    const cleaned = removeDashes(lesson.content || '');
    if (cleaned !== lesson.content) {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { content: cleaned }
      });
      updated++;
    }
  }

  console.log(`Updated ${updated} lessons`);
  console.log('Done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
