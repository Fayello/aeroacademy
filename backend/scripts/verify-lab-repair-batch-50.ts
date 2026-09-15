import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LAB_REPAIR_BATCH_50_TITLES } from '../prisma/lab-repair-batch-50';
import { labs } from '../prisma/seed-enrich-labs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const canonicalLabs = LAB_REPAIR_BATCH_50_TITLES.map((title) => {
    const lab = labs.find((candidate) => candidate.title === title);
    if (!lab) throw new Error(`Canonical lab is missing: ${title}`);
    return lab;
  });
  const databaseLabs = await prisma.lab.findMany({
    where: { title: { in: [...LAB_REPAIR_BATCH_50_TITLES] } },
    include: { flags: true },
  });
  const databaseByTitle = new Map(databaseLabs.map((lab) => [lab.title, lab]));
  const failures: string[] = [];

  for (const canonical of canonicalLabs) {
    const database = databaseByTitle.get(canonical.title);
    if (!database) {
      failures.push(`${canonical.title}: missing database row`);
      continue;
    }

    if (database.description !== canonical.description) {
      failures.push(`${canonical.title}: description mismatch`);
    }
    if (database.dockerImage !== canonical.dockerImage) {
      failures.push(`${canonical.title}: image mismatch`);
    }
    if (database.briefing !== canonical.briefing) {
      failures.push(`${canonical.title}: briefing mismatch`);
    }
    if (JSON.stringify(database.tasks) !== JSON.stringify(canonical.tasks)) {
      failures.push(`${canonical.title}: tasks mismatch`);
    }

    const flagsByTitle = new Map(
      database.flags.map((flag) => [flag.title, flag]),
    );
    if (database.flags.length !== canonical.flags.length) {
      failures.push(`${canonical.title}: flag count mismatch`);
    }
    for (const expectedFlag of canonical.flags) {
      const databaseFlag = flagsByTitle.get(expectedFlag.title);
      if (!databaseFlag) {
        failures.push(`${canonical.title}/${expectedFlag.title}: missing flag`);
        continue;
      }
      if (databaseFlag.description !== expectedFlag.description) {
        failures.push(
          `${canonical.title}/${expectedFlag.title}: description mismatch`,
        );
      }
      if (
        !(await bcrypt.compare(
          expectedFlag.correctAnswer.trim().toLowerCase(),
          databaseFlag.correctAnswer,
        ))
      ) {
        failures.push(
          `${canonical.title}/${expectedFlag.title}: answer hash mismatch`,
        );
      }
    }
  }

  if (failures.length) {
    console.error(
      `Lab repair verification failed (${failures.length} issues):`,
    );
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
    return;
  }

  const flagCount = canonicalLabs.reduce(
    (total, lab) => total + lab.flags.length,
    0,
  );
  console.log(
    `Verified ${canonicalLabs.length} repaired labs and ${flagCount} hashed answers.`,
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
