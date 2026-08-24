import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MAX_SKILL_XP_FOR_MASTERY = 5000;

async function main() {
  console.log('Backfilling mastery for existing UserSkill records...');

  const userSkills = await prisma.userSkill.findMany({
    select: { id: true, userId: true, skillId: true, xp: true },
  });

  let updated = 0;

  for (const us of userSkills) {
    const mastery = Math.min(100, (us.xp / MAX_SKILL_XP_FOR_MASTERY) * 100);

    await prisma.userSkill.update({
      where: { id: us.id },
      data: {
        mastery,
        lastPracticedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create initial mastery event
    if (mastery > 0) {
      await prisma.skillMasteryEvent.create({
        data: {
          userId: us.userId,
          skillId: us.skillId,
          eventType: 'MASTERY_SET',
          amount: mastery,
          masteryBefore: 0,
          masteryAfter: mastery,
          source: 'BACKFILL',
        },
      });
    }

    updated++;
  }

  console.log(`Backfilled mastery for ${updated} UserSkill records`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
