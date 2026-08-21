const bcrypt = require('bcrypt');
function normalizeAnswer(a) { return a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(); }

const fixes = [
  { title: 'Pipeline Master', lab: 'Text Processing', desc: 'Run: cat /etc/passwd | cut -d: -f7 | sort | uniq | head -3. Submit the 3 unique shell types separated by spaces.', newAnswer: '/bin/bash /bin/sync /usr/sbin/nologin' },
  { title: 'Passwd Field Parse', lab: 'File Permissions', desc: 'Run: awk -F: "$3>=1000{print $1}" /etc/passwd | head -3. Submit the usernames separated by spaces.', newAnswer: 'nobody student' },
];

async function main() {
  for (const fix of fixes) {
    const normalized = normalizeAnswer(fix.newAnswer);
    const hash = await bcrypt.hash(normalized, 10);
    console.log(`${fix.title}:`);
    console.log(`  answer: "${fix.newAnswer}"`);
    console.log(`  normalized: "${normalized}"`);
    console.log(`  hash: ${hash}`);
    const match = await bcrypt.compare(normalized, hash);
    console.log(`  verify: ${match}`);
    console.log();
    console.log(`  SQL: UPDATE "LabFlag" SET "correctAnswer" = '${hash}' WHERE title = '${fix.title}' AND description LIKE '%${fix.lab}%';`);
    console.log();
  }
}
main();
