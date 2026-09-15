import { NestFactory } from '@nestjs/core';
import type Docker from 'dockerode';
import { AppModule } from '../src/app.module';
import { DockerManager } from '../src/labs/docker-manager.service';
import { LabsService } from '../src/labs/labs.service';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  LAB_REPAIR_BATCH_50_TITLES,
  LAB_REPAIR_INTERACTIVE_TITLES,
} from '../prisma/lab-repair-batch-50';

const SMOKE_EMAIL = 'lab-runtime-smoke@invalid.local';

async function waitForExec(exec: Docker.Exec): Promise<void> {
  await exec.start({ hijack: false });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const state = await exec.inspect();
    if (!state.Running) {
      if (state.ExitCode !== 0) {
        throw new Error(`container validation exited ${state.ExitCode}`);
      }
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('container validation timed out');
}

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);
  const labsService = app.get(LabsService);
  const dockerManager = app.get(DockerManager);
  const user = await prisma.user.upsert({
    where: { email: SMOKE_EMAIL },
    update: { xp: 10_000_000, clearanceLevel: 100 },
    create: {
      email: SMOKE_EMAIL,
      name: 'Lab Runtime Smoke Test',
      role: 'STUDENT',
      xp: 10_000_000,
      clearanceLevel: 100,
      emailVerified: new Date(),
    },
  });
  const failures: string[] = [];
  let titles =
    process.env.SMOKE_INTERACTIVE_ONLY === '1'
      ? LAB_REPAIR_BATCH_50_TITLES.filter((title) =>
          LAB_REPAIR_INTERACTIVE_TITLES.has(title),
        )
      : [...LAB_REPAIR_BATCH_50_TITLES];
  const requestedTitle = process.env.SMOKE_TITLE?.trim();
  if (requestedTitle) {
    titles = titles.filter((title) => title === requestedTitle);
    if (titles.length === 0) {
      throw new Error(`Smoke target is not in this batch: ${requestedTitle}`);
    }
  }

  try {
    const staleInstances = await prisma.labInstance.findMany({
      where: { userId: user.id },
      select: { labId: true },
    });
    for (const stale of staleInstances) {
      await labsService.stopLab(user.id, stale.labId).catch(() => undefined);
    }
    await prisma.activityEvent.deleteMany({ where: { userId: user.id } });
    await prisma.labInstance.deleteMany({ where: { userId: user.id } });

    for (let offset = 0; offset < titles.length; offset += 5) {
      const batch = titles.slice(offset, offset + 5);
      console.log(`\nBatch ${offset / 5 + 1}/${Math.ceil(titles.length / 5)}`);
      for (const title of batch) {
        const lab = await prisma.lab.findFirstOrThrow({ where: { title } });
        try {
          const instance = await labsService.startLab(user.id, lab.id);
          if (!instance.containerId || instance.status !== 'RUNNING') {
            throw new Error('start did not return a running container');
          }
          const docker = dockerManager.getDockerForServer(instance.serverId);
          if (!docker)
            throw new Error(`Docker worker missing: ${instance.serverId}`);
          const container = docker.getContainer(instance.containerId);
          const inspection = await container.inspect();
          if (!inspection.State.Running)
            throw new Error('container is not running');

          if (!LAB_REPAIR_INTERACTIVE_TITLES.has(title)) {
            const validation = await container.exec({
              AttachStdin: false,
              AttachStdout: false,
              AttachStderr: false,
              Cmd: [
                'sh',
                '-c',
                'test -d /home/student/lab-work && id student >/dev/null && command -v sudo >/dev/null',
              ],
            });
            await waitForExec(validation);
          }
          console.log(`PASS\t${title}`);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          failures.push(`${title}: ${message}`);
          console.error(`FAIL\t${title}\t${message}`);
        } finally {
          await labsService.stopLab(user.id, lab.id).catch(() => undefined);
        }
      }
    }
  } finally {
    await prisma.activityEvent.deleteMany({ where: { userId: user.id } });
    await prisma.labInstance.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    await app.close();
  }

  if (failures.length) {
    throw new Error(
      `Runtime smoke failed (${failures.length}):\n${failures.join('\n')}`,
    );
  }
  console.log(
    `\nRuntime smoke passed: ${titles.length}/${titles.length} labs started, validated, and stopped.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
