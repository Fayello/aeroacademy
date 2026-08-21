const bcrypt = require('bcrypt');
const { execSync } = require('child_process');

function normalizeAnswer(answer) {
  return answer.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim();
}

const fixes = [
  { 
    title: 'User Deleter', 
    lab: 'Linux Fundamentals: File Permissions & Users',
    newAnswer: "id: 'tempuser': no such user",  // id tempuser 2>&1 returns this with quotes
    description: 'Create user tempuser: useradd tempuser. Then delete it: userdel tempuser. Run: id tempuser 2>&1. What is the last word of the error?'
  },
  { 
    title: 'Pipeline Master', 
    lab: 'Linux Fundamentals: Text Processing & Shell Scripting',
    newAnswer: '/bin/bash /bin/sync /usr/sbin/nologin',
    description: 'Run: cat /etc/passwd | cut -d: -f7 | sort | uniq | head -3. Submit the 3 unique shell types separated by spaces.'
  },
  { 
    title: 'Passwd Field Parse', 
    lab: 'Linux Fundamentals: File Permissions & Users',
    newAnswer: 'nobody student',
    description: 'Run: awk -F: "$3>=1000{print $1}" /etc/passwd | head-3. Submit the usernames separated by spaces.'
  },
];

async function main() {
  for (const fix of fixes) {
    const normalized = normalizeAnswer(fix.newAnswer);
    const hash = await bcrypt.hash(normalized, 10);
    const sql = `UPDATE "LabFlag" SET "correctAnswer" = '${hash}' WHERE title = '${fix.title}' AND description LIKE '%${fix.lab.split(':').pop().trim()}%';`;
    console.log(`\n${fix.title}:`);
    console.log(`  New answer: "${fix.newAnswer}"`);
    console.log(`  Normalized: "${normalized}"`);
    console.log(`  Hash: ${hash}`);
    
    // Verify
    const match = await bcrypt.compare(normalized, hash);
    console.log(`  Verify: ${match}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
