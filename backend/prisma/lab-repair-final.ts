import type { PrismaClient } from '@prisma/client';
import { LAB_REPAIR_BATCH_02_TITLES } from './lab-repair-batch-02';
import {
  LAB_REPAIR_BATCH_50_TITLES,
  LAB_REPAIR_INTERACTIVE_TITLES,
} from './lab-repair-batch-50';

export const FINAL_LAB_REPAIR_MARKER = 'repair cohort: final remaining labs';
export const PORTABLE_LAB_IMAGE = 'aeroacademy/ubuntu-practice:22.04';

const ORIGINAL_REPAIRED_LAB_TITLES = [
  'Linux Fundamentals: Ubuntu CLI Mastery',
  'Linux Fundamentals: File Permissions & Users',
  'Linux Fundamentals: Text Processing & Shell Scripting',
  'Linux Fundamentals: Process & Service Management',
  'Docker & Container Fundamentals',
] as const;

export const FINAL_SERVICE_LAB_TITLES = new Set([
  'Broken Authentication Sandbox',
  'Node.js Security Matrix: NodeGoat',
  'Enterprise Java Security: WebGoat',
  'API Security Sandbox: vAPI',
  'Nginx Security Hardening',
  'Reverse Proxy & Load Balancer Security',
]);

export const PREVIOUSLY_REPAIRED_LAB_TITLES = new Set<string>([
  ...ORIGINAL_REPAIRED_LAB_TITLES,
  ...LAB_REPAIR_BATCH_50_TITLES,
  ...LAB_REPAIR_BATCH_02_TITLES,
]);

export function isFinalLabRepairTarget(lab: {
  title: string;
  briefing?: string | null;
}): boolean {
  return (
    !PREVIOUSLY_REPAIRED_LAB_TITLES.has(lab.title) &&
    !lab.briefing?.toLowerCase().includes(FINAL_LAB_REPAIR_MARKER)
  );
}

export function getFinalLabCheckpointToken(flagId: string): string {
  return `checkpoint-${flagId.slice(0, 8).toLowerCase()}`;
}

function portableBriefing(
  title: string,
  checkpoints: Array<{ title: string; token: string }>,
): string {
  return `### Mission Objective
Complete ${title} in a deterministic local practice workspace.

### Runtime mode: portable artifact validation
### Repair cohort: final remaining labs
This exercise does not require external cloud accounts, host devices, nested container engines, desktop applications, GPUs, or a multi-node environment. Work only inside \`/home/student/lab-work\` and create a \`solution.md\` file containing your commands, configuration, analysis, and evidence.

### Checkpoints
${checkpoints
  .map(
    ({ title: checkpointTitle, token }, index) =>
      `${index + 1}. Document "${checkpointTitle}" in solution.md. Completion token: \`${token}\``,
  )
  .join('\n')}

Submit the completion token shown for each checkpoint after documenting that checkpoint. Tokens and checks are stable across resets and new deployments.`;
}

function serviceBriefing(existingBriefing: string | null): string {
  if (existingBriefing?.toLowerCase().includes(FINAL_LAB_REPAIR_MARKER)) {
    return existingBriefing;
  }
  return `${existingBriefing || 'Use the provided service to complete each checkpoint.'}

### Runtime mode: service-backed validation
### Repair cohort: final remaining labs
This lab uses its dedicated application image. Wait for the service health check, open the web interface, and complete the original checkpoints in the running target.`;
}

export async function repairRemainingPracticeLabs(
  prisma: PrismaClient,
): Promise<{ repaired: number; portable: number; serviceBacked: number }> {
  const labs = await prisma.lab.findMany({
    where: { type: 'PRACTICE' },
    include: {
      flags: {
        select: { id: true, title: true },
        orderBy: { id: 'asc' },
      },
    },
  });
  const targets = labs.filter(isFinalLabRepairTarget);
  let portable = 0;
  let serviceBacked = 0;

  for (const lab of targets) {
    if (FINAL_SERVICE_LAB_TITLES.has(lab.title)) {
      serviceBacked += 1;
      await prisma.lab.update({
        where: { id: lab.id },
        data: { briefing: serviceBriefing(lab.briefing) },
      });
      continue;
    }

    portable += 1;
    const checkpoints = lab.flags.map((flag) => ({
      title: flag.title,
      token: getFinalLabCheckpointToken(flag.id),
    }));
    const tasks = checkpoints.map(
      ({ title, token }, index) =>
        `Checkpoint ${index + 1}: document "${title}" in solution.md, then submit ${token}.`,
    );

    await prisma.$transaction([
      prisma.lab.update({
        where: { id: lab.id },
        data: {
          description: `Practice ${lab.title} in a deterministic local workspace without unavailable external infrastructure.`,
          dockerImage: PORTABLE_LAB_IMAGE,
          briefing: portableBriefing(lab.title, checkpoints),
          tasks,
        },
      }),
      ...lab.flags.map((flag) => {
        const token = getFinalLabCheckpointToken(flag.id);
        return prisma.labFlag.update({
          where: { id: flag.id },
          data: {
            description: `Document this checkpoint in solution.md, then submit the stable completion token: ${token}`,
          },
        });
      }),
    ]);
  }

  return { repaired: targets.length, portable, serviceBacked };
}

export { LAB_REPAIR_INTERACTIVE_TITLES };
