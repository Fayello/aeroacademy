import { assessLabCompatibility } from '../src/labs/lab-compatibility';
import { LAB_REPAIR_BATCH_50_TITLES } from '../prisma/lab-repair-batch-50';
import { LAB_REPAIR_BATCH_02_TITLES } from '../prisma/lab-repair-batch-02';
import { FINAL_LAB_REPAIR_MARKER } from '../prisma/lab-repair-final';

interface PublicLab {
  id: string;
  title: string;
  description?: string | null;
  briefing?: string | null;
  tasks?: unknown;
  flags?: unknown;
  dockerImage?: string | null;
}

const args = process.argv.slice(2);
const summaryOnly = args.includes('--summary');
const titlesOnly = args.includes('--titles');
const unrepairedOnly = args.includes('--unrepaired');
const issueCode = args
  .find((argument) => argument.startsWith('--code='))
  ?.slice('--code='.length);
const baseUrl =
  args.find((argument) => !argument.startsWith('--')) ||
  'https://xpertclass.academy/api/v1';
const pageSize = 50;

async function main() {
  const labs: PublicLab[] = [];

  for (let skip = 0; ; skip += pageSize) {
    const response = await fetch(
      `${baseUrl}/labs/public?take=${pageSize}&skip=${skip}`,
    );
    if (!response.ok) {
      throw new Error(`Catalog request failed with HTTP ${response.status}`);
    }

    const page = (await response.json()) as PublicLab[];
    labs.push(...page);
    if (page.length < pageSize) break;
  }

  const repairedTitles = new Set<string>([
    'Linux Fundamentals: Ubuntu CLI Mastery',
    'Linux Fundamentals: File Permissions & Users',
    'Linux Fundamentals: Text Processing & Shell Scripting',
    'Linux Fundamentals: Process & Service Management',
    'Docker & Container Fundamentals',
    ...LAB_REPAIR_BATCH_50_TITLES,
    ...LAB_REPAIR_BATCH_02_TITLES,
  ]);
  const auditedLabs = unrepairedOnly
    ? labs.filter(
        (lab) =>
          !repairedTitles.has(lab.title) &&
          !lab.briefing?.toLowerCase().includes(FINAL_LAB_REPAIR_MARKER),
      )
    : labs;
  const findings = auditedLabs
    .map((lab) => ({ lab, issues: assessLabCompatibility(lab) }))
    .map(({ lab, issues }) => ({
      lab,
      issues: issueCode
        ? issues.filter((issue) => issue.code === issueCode)
        : issues,
    }))
    .filter(({ issues }) => issues.length > 0);

  console.log(`Audited ${auditedLabs.length} live practice labs.`);
  console.log(`Found ${findings.length} incompatible labs.\n`);

  if (unrepairedOnly) {
    const imageCounts = new Map<string, number>();
    for (const lab of auditedLabs) {
      const image = lab.dockerImage || '(missing image)';
      imageCounts.set(image, (imageCounts.get(image) || 0) + 1);
    }
    console.log('Remaining image counts:');
    for (const [image, total] of [...imageCounts].sort(
      (left, right) => right[1] - left[1],
    )) {
      console.log(`${image}\t${total}`);
    }
    console.log('');
    if (titlesOnly) {
      for (const lab of auditedLabs) {
        console.log(`${lab.id}\t${lab.dockerImage || ''}\t${lab.title}`);
      }
      return;
    }
  }

  const issueCounts = new Map<string, number>();
  for (const { issues } of findings) {
    for (const issue of issues) {
      issueCounts.set(issue.code, (issueCounts.get(issue.code) || 0) + 1);
    }
  }

  for (const [code, count] of [...issueCounts.entries()].sort(
    (left, right) => right[1] - left[1],
  )) {
    console.log(`${code}\t${count}`);
  }

  if (!summaryOnly) {
    console.log('');
    for (const { lab, issues } of findings) {
      console.log(`${lab.id}\t${lab.title}`);
      if (!titlesOnly) {
        for (const issue of issues) {
          console.log(`  - ${issue.code}: ${issue.reason}`);
        }
      }
    }
  }

  if (findings.length > 0) process.exitCode = 2;
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
