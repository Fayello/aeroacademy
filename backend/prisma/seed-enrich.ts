import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');

  if (process.env.NODE_ENV === 'production' && !force) {
    console.error('CRITICAL: This script must NOT be run in production without --force flag.');
    process.exit(1);
  }

  console.log('=== AeroAcademy Enrichment Seed ===');
  console.log(`Mode: ${force ? 'FORCED' : 'safe'}`);

  // Phase 3: Labs
  console.log('\n--- Phase 3: Seeding labs ---');
  const { seedEnrichLabs } = await import('./seed-enrich-labs');
  await seedEnrichLabs(prisma, process.env.LAB_ENCRYPTION_KEY || 'aeroacademy-labs-default-key-change-in-production-32b!');

  // Phase 3b: IT labs
  console.log('\n--- Phase 3b: Seeding IT labs ---');
  const { seedEnrichITLabs } = await import('./seed-enrich-it-labs');
  await seedEnrichITLabs(prisma, process.env.LAB_ENCRYPTION_KEY || 'aeroacademy-labs-default-key-change-in-production-32b!');

  // Phase 3c: Expert labs
  console.log('\n--- Phase 3c: Seeding EXPERT labs ---');
  const { seedEnrichExpertLabs } = await import('./seed-enrich-expert-labs');
  await seedEnrichExpertLabs(prisma, process.env.LAB_ENCRYPTION_KEY || 'aeroacademy-labs-default-key-change-in-production-32b!');

  // Phase 3d: Expert IT labs
  console.log('\n--- Phase 3d: Seeding EXPERT IT labs ---');
  const { seedEnrichExpertITLabs } = await import('./seed-enrich-expert-it-labs');
  await seedEnrichExpertITLabs(prisma, process.env.LAB_ENCRYPTION_KEY || 'aeroacademy-labs-default-key-change-in-production-32b!');

  // Phase 3e: Scale to 300 labs (+82)
  console.log('\n--- Phase 3e: Scaling to 300 labs (+82) ---');
  try {
    const { seedScale82Labs } = await import('./seed-scale-82-labs');
    await seedScale82Labs(prisma, process.env.LAB_ENCRYPTION_KEY || 'aeroacademy-labs-default-key-change-in-production-32b!');
  } catch (e) { console.log('  Note: scale-82 not yet run', (e as Error).message.slice(0,120)); }

  // Phase 4: New courses
  console.log('\n--- Phase 4: Seeding new courses ---');
  const { seedEnrichCoursesNew } = await import('./seed-enrich-courses-new');
  await seedEnrichCoursesNew(prisma);

  // Phase 4b: Backfill missing lessons (52)
  console.log('\n--- Phase 4b: Backfilling 52 missing lessons ---');
  const { seedEnrichCoursesNewPart2 } = await import('./seed-enrich-courses-new-part2');
  await seedEnrichCoursesNewPart2(prisma);

  // Phase 4c: 3 new Harvard courses (AI, Blockchain, Quantum)
  console.log('\n--- Phase 4c: Seeding 3 new courses (AI/Blockchain/Quantum) ---');
  try {
    const { seedNewThreeCourses } = await import('./seed-new-three-courses');
    await seedNewThreeCourses(prisma);
  } catch (e) { console.log('  Note: seed-new-three-courses not yet run', (e as Error).message.slice(0,120)); }

  // Phase 5: Enrich existing courses
  console.log('\n--- Phase 5: Enriching existing courses ---');
  const { seedEnrichCourses } = await import('./seed-enrich-courses');
  await seedEnrichCourses(prisma);

  // Phase 6: Quizzes
  console.log('\n--- Phase 6: Backfilling quizzes ---');
  const { backfillQuizzes } = await import('./seed-enrich-helpers');
  await backfillQuizzes(prisma);

  // Phase 7: Lab-Course wiring
  console.log('\n--- Phase 7: Wiring labs to courses ---');
  const { wireLabCourseLinks } = await import('./seed-enrich-wiring');
  await wireLabCourseLinks(prisma);

  // Phase 8: Skill graph wiring
  console.log('\n--- Phase 8: Skill graph wiring ---');
  try {
    const { seedSkillsWiring } = await import('./seed-skills-wiring');
    await seedSkillsWiring(prisma);
  } catch (e) { console.log('  Note: skills wiring not yet run', (e as Error).message.slice(0,120)); }

  console.log('\n=== Enrichment seed complete ===');

  // Print stats
  const courseCount = await prisma.course.count();
  const lessonCount = await prisma.lesson.count();
  const labCount = await prisma.lab.count();
  const quizCount = await prisma.quiz.count();
  const questionCount = await prisma.question.count();
  const flagCount = await prisma.labFlag.count();

  console.log(`Courses: ${courseCount}`);
  console.log(`Lessons: ${lessonCount}`);
  console.log(`Labs: ${labCount}`);
  console.log(`Quizzes: ${quizCount}`);
  console.log(`Questions: ${questionCount}`);
  console.log(`Flags: ${flagCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
