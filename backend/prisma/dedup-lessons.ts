import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const dups: any[] = await prisma.$queryRawUnsafe(`
    SELECT c.title as "courseTitle", l.title as "lessonTitle", array_agg(l.id) as ids, count(*) as cnt
    FROM "Lesson" l
    JOIN "Section" s ON s.id = l."sectionId"
    JOIN "Course" c ON c.id = s."courseId"
    GROUP BY c.title, l.title HAVING count(*) > 1
  `);
  console.log(`Found ${dups.length} duplicate lesson groups`);
  let totalDeleted = 0;
  for (const g of dups) {
    const ids: string[] = g.ids;
    const keep = ids[0];
    const remove = ids.slice(1);
    for (const dupId of remove) {
      await prisma.$executeRawUnsafe(`DELETE FROM "Answer" WHERE "questionId" IN (SELECT q.id FROM "Question" q JOIN "Quiz" qz ON qz.id=q."quizId" WHERE qz."lessonId"=$1)`, dupId);
      await prisma.$executeRawUnsafe(`DELETE FROM "Question" WHERE "quizId" IN (SELECT id FROM "Quiz" WHERE "lessonId"=$1)`, dupId);
      await prisma.$executeRawUnsafe(`DELETE FROM "Progress" WHERE "lessonId"=$1`, dupId);
      await prisma.$executeRawUnsafe(`DELETE FROM "Quiz" WHERE "lessonId"=$1`, dupId);
      await prisma.$executeRawUnsafe(`DELETE FROM "Lesson" WHERE id=$1`, dupId);
      totalDeleted++;
    }
    if (dups.indexOf(g) < 5) console.log(`  ${g.courseTitle} :: ${g.lessonTitle} — removed ${remove.length}`);
  }
  console.log(`Deleted ${totalDeleted} duplicate lessons`);
  const counts: any[] = await prisma.$queryRawUnsafe(`SELECT 'courses=' || count(*) as c FROM "Course" UNION ALL SELECT 'lessons=' || count(*) FROM "Lesson" UNION ALL SELECT 'quizzes=' || count(*) FROM "Quiz"`);
  console.log(counts.map((r:any)=>r.c).join(' '));
}
main().catch(console.error).finally(()=>prisma.$disconnect());
