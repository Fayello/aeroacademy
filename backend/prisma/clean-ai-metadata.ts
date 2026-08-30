import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function cleanContent(content: string): string {
  let cleaned = content;

  // Remove lines with AI metadata patterns
  const patterns = [
    /^\*\*Course:?\*\*.*\*\*Status:?\*\*.*$/gm,
    /^\*\*Estimated time:?\*\*.*$/gm,
    /^\*\*Prerequisite:?\*\*.*$/gm,
    /^## AI Provenance$/gm,
    /^- \*\*Draft:?\*\*.*$/gm,
    /^- \*\*Fact extraction:?\*\*.*$/gm,
    /^- \*\*Verification:?\*\*.*$/gm,
    /^- \*\*Technical review:?\*\*.*$/gm,
    /^- \*\*Pedagogical review:?\*\*.*$/gm,
    /^- \*\*Status:?\*\*.*$/gm,
    /^> AI-generated content.*$/gm,
    /^Video coming soon.*$/gm,
    /^\*\*Course:?\*\*.*\*\*Path:?\*\*.*\*\*Estimated.*$/gm,
    /^\*\*Course:?\*\*.*\*\*Path:?\*\*.*\*\*Prerequisit.*$/gm,
    /^\*\*Course:?\*\*.*\*\*Path:?\*\*.*$/gm,
    /^\*\*Estimated time:?\*\*.*\*\*Prerequisite:?\*\*.*$/gm,
    /^\*\*Status:?\*\*.*\*\*Estimated time:?\*\*.*$/gm,
    /^\*\*Status:?\*\*.*DRAFT.*PUBLISHED.*$/gm,
    /^---\s*$/gm, // Remove standalone --- separators that were around AI provenance
  ];

  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Remove "Voice: ..." lines
  cleaned = cleaned.replace(/^Voice:.*$/gm, '');

  // Clean up multiple blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

async function main() {
  const lessons = await prisma.lesson.findMany({
    where: {
      OR: [
        { content: { contains: 'AI Provenance' } },
        { content: { contains: 'Estimated time:' } },
        { content: { contains: 'Prerequisite:' } },
        { content: { contains: 'Video coming soon' } },
        { content: { contains: 'Status: DRAFT' } },
        { content: { contains: 'Draft: LLM' } },
        { content: { contains: 'Voice:' } },
      ]
    }
  });

  console.log(`Found ${lessons.length} lessons to clean`);

  for (const lesson of lessons) {
    const cleaned = cleanContent(lesson.content || '');
    if (cleaned !== lesson.content) {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { content: cleaned }
      });
      console.log(`Cleaned: ${lesson.title}`);
    }
  }

  console.log('Done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
