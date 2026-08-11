import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { seedLinuxLabs } from './prisma/seed-linux-labs';
import { seedLinuxCourses } from './prisma/seed-linux-courses';
import { seedLinuxCoursesPart2 } from './prisma/seed-linux-courses-part2';
import { seedLinuxCoursesPart3 } from './prisma/seed-linux-courses-part3';

const ENCRYPTION_KEY = process.env.LAB_ENCRYPTION_KEY || 'aeroacademy-labs-encryption-key-change-in-production-32b!';

async function main() {
  // Check if Linux courses already exist
  const existing = await prisma.course.findMany({
    where: { title: { contains: 'Linux' } },
  });
  if (existing.length > 0) {
    console.log(`Found ${existing.length} existing Linux courses. Skipping...`);
    console.log('If you want to re-seed, delete them first.');
    return;
  }

  console.log('Seeding Linux labs...');
  const linuxLabs = await seedLinuxLabs(ENCRYPTION_KEY);
  console.log(`Created ${linuxLabs.length} labs`);

  console.log('Seeding Linux courses (Part 1)...');
  await seedLinuxCourses(prisma, linuxLabs);

  console.log('Seeding Linux courses (Part 2)...');
  await seedLinuxCoursesPart2(prisma, linuxLabs);

  console.log('Seeding Linux courses (Part 3)...');
  await seedLinuxCoursesPart3(prisma, linuxLabs);

  console.log('Linux curriculum seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
