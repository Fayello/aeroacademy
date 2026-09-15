import { labs } from '../prisma/seed-enrich-labs';
import { assessLabCompatibility } from '../src/labs/lab-compatibility';

const repairedTitles = new Set([
  'Linux Fundamentals: Ubuntu CLI Mastery',
  'Linux Fundamentals: File Permissions & Users',
  'Linux Fundamentals: Text Processing & Shell Scripting',
  'Linux Fundamentals: Process & Service Management',
  'Docker & Container Fundamentals',
]);

const countArgument = process.argv
  .slice(2)
  .find((argument) => argument.startsWith('--count='));
const count = Number.parseInt(
  countArgument?.slice('--count='.length) || '50',
  10,
);

if (!Number.isInteger(count) || count < 1) {
  throw new Error('--count must be a positive integer');
}

const cohort = labs
  .filter((lab) => !repairedTitles.has(lab.title))
  .slice(0, count);
const issueCounts = new Map<string, number>();

for (const [index, lab] of cohort.entries()) {
  const issues = assessLabCompatibility(lab);
  for (const issue of issues) {
    issueCounts.set(issue.code, (issueCounts.get(issue.code) || 0) + 1);
  }
  const status = issues.length
    ? issues.map((issue) => issue.code).join(',')
    : 'STATIC_CHECK_PASSED';
  console.log(
    `${String(index + 1).padStart(2, '0')}\t${lab.dockerImage}\t${status}\t${lab.title}`,
  );
}

console.log(`\nCohort: ${cohort.length}`);
console.log(
  `Flagged: ${cohort.filter((lab) => assessLabCompatibility(lab).length > 0).length}`,
);
for (const [code, total] of [...issueCounts.entries()].sort(
  (left, right) => right[1] - left[1],
)) {
  console.log(`${code}: ${total}`);
}
