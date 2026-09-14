import { assessLabCompatibility } from '../src/labs/lab-compatibility';

interface PublicLab {
  id: string;
  title: string;
  description?: string | null;
  briefing?: string | null;
  tasks?: unknown;
  flags?: unknown;
}

const args = process.argv.slice(2);
const summaryOnly = args.includes('--summary');
const titlesOnly = args.includes('--titles');
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

  const findings = labs
    .map((lab) => ({ lab, issues: assessLabCompatibility(lab) }))
    .map(({ lab, issues }) => ({
      lab,
      issues: issueCode
        ? issues.filter((issue) => issue.code === issueCode)
        : issues,
    }))
    .filter(({ issues }) => issues.length > 0);

  console.log(`Audited ${labs.length} live practice labs.`);
  console.log(`Found ${findings.length} incompatible labs.\n`);

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
