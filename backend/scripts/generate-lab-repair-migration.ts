import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { LAB_REPAIR_BATCH_50_TITLES } from '../prisma/lab-repair-batch-50';
import { labs } from '../prisma/seed-enrich-labs';

const partArgument = process.argv
  .slice(2)
  .find((argument) => argument.startsWith('--part='));
const part = Number.parseInt(partArgument?.slice('--part='.length) || '', 10);
const batchSize = 5;
const force = process.argv.includes('--force');

if (!Number.isInteger(part) || part < 1 || part > 10) {
  throw new Error('--part must be an integer from 1 to 10');
}

const titles = LAB_REPAIR_BATCH_50_TITLES.slice(
  (part - 1) * batchSize,
  part * batchSize,
);
const cohort = titles.map((title) => labs.find((lab) => lab.title === title));
const missing = titles.filter((_title, index) => !cohort[index]);
if (missing.length) {
  throw new Error(`Missing canonical repairs: ${missing.join(', ')}`);
}

const quote = (value: string): string => `'${value.replace(/'/g, "''")}'`;
const statements: string[] = [
  '-- Generated from prisma/lab-repair-batch-50.ts.',
  '-- Existing lab and flag IDs are preserved so learner history remains intact.',
];

for (const [index, title] of titles.entries()) {
  const lab = cohort[index];
  if (!lab) continue;
  statements.push(`
UPDATE "Lab"
SET
  "description" = ${quote(lab.description)},
  "dockerImage" = ${quote(lab.dockerImage)},
  "briefing" = ${quote(lab.briefing)},
  "tasks" = ${quote(JSON.stringify(lab.tasks))}::jsonb
WHERE "title" = ${quote(title)};`);

  for (const flag of lab.flags) {
    statements.push(`
UPDATE "LabFlag"
SET "description" = ${quote(flag.description)}
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = ${quote(title)}
)
AND "title" = ${quote(flag.title)};`);
  }
}

const migrationName = `20260915_repair_lab_batch_50_part${String(part).padStart(2, '0')}`;
const migrationDirectory = resolve('prisma', 'migrations', migrationName);
const migrationPath = resolve(migrationDirectory, 'migration.sql');

if (existsSync(migrationPath) && !force) {
  throw new Error(`Refusing to overwrite existing migration: ${migrationPath}`);
}

mkdirSync(migrationDirectory, { recursive: true });
writeFileSync(migrationPath, `${statements.join('\n')}\n`, 'utf8');
console.log(`Created ${migrationPath}`);
