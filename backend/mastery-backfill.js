const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const MAX = 5000;
async function main() {
  const us = await prisma.userSkill.findMany({ select: { id: true, userId: true, skillId: true, xp: true } });
  let c = 0;
  for (const s of us) {
    const m = Math.min(100, (s.xp / MAX) * 100);
    await prisma.userSkill.update({ where: { id: s.id }, data: { mastery: m, lastPracticedAt: new Date(), createdAt: new Date(), updatedAt: new Date() } });
    if (m > 0) await prisma.skillMasteryEvent.create({ data: { userId: s.userId, skillId: s.skillId, eventType: 'MASTERY_SET', amount: m, masteryBefore: 0, masteryAfter: m, source: 'BACKFILL' } });
    c++;
  }
  console.log('Backfilled ' + c + ' user skills');
}
main().catch(function(e) { console.error(e); process.exit(1); }).finally(function() { prisma.$disconnect(); });
