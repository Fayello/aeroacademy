import { PrismaClient } from '@prisma/client';
import {
  FINAL_LAB_REPAIR_MARKER,
  FINAL_SERVICE_LAB_TITLES,
  getFinalLabCheckpointToken,
  PORTABLE_LAB_IMAGE,
} from '../prisma/lab-repair-final';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const labs = await prisma.lab.findMany({
    where: {
      type: 'PRACTICE',
      briefing: { contains: FINAL_LAB_REPAIR_MARKER, mode: 'insensitive' },
    },
    include: { flags: true },
    orderBy: { title: 'asc' },
  });
  const failures: string[] = [];
  const portable = labs.filter(
    (lab) => !FINAL_SERVICE_LAB_TITLES.has(lab.title),
  );
  const serviceBacked = labs.filter((lab) =>
    FINAL_SERVICE_LAB_TITLES.has(lab.title),
  );

  if (labs.length !== 405)
    failures.push(`expected 405 labs, found ${labs.length}`);
  if (portable.length !== 399)
    failures.push(`expected 399 portable labs, found ${portable.length}`);
  if (serviceBacked.length !== 6)
    failures.push(
      `expected 6 service-backed labs, found ${serviceBacked.length}`,
    );

  for (const title of FINAL_SERVICE_LAB_TITLES) {
    if (!serviceBacked.some((lab) => lab.title === title)) {
      failures.push(`${title}: missing service-backed lab`);
    }
  }

  for (const lab of portable) {
    if (lab.dockerImage !== PORTABLE_LAB_IMAGE) {
      failures.push(`${lab.title}: unexpected image ${lab.dockerImage}`);
    }
    const tasks = Array.isArray(lab.tasks) ? lab.tasks : [];
    if (tasks.length !== lab.flags.length) {
      failures.push(
        `${lab.title}: ${tasks.length} tasks for ${lab.flags.length} flags`,
      );
    }
    for (const flag of lab.flags) {
      const token = getFinalLabCheckpointToken(flag.id);
      if (!flag.description?.includes(token)) {
        failures.push(`${lab.title}/${flag.title}: missing ${token}`);
      }
      if (!flag.correctAnswer) {
        failures.push(`${lab.title}/${flag.title}: missing answer hash`);
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `Final lab repair verification failed (${failures.length}):\n${failures.join('\n')}`,
    );
  }

  const flagCount = portable.reduce(
    (total, lab) => total + lab.flags.length,
    0,
  );
  console.log(
    `Verified ${labs.length} final-cohort labs (${portable.length} portable, ${serviceBacked.length} service-backed) and ${flagCount} deterministic checkpoints.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
