const bcrypt = require('bcrypt');

function normalizeAnswer(answer) {
  return answer.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim();
}

// More candidates for the 3 failing flags
const flags = [
  { title: 'User Deleter', hash: '$2b$10$hYp.8q41aqJHqCyfObZo1.HCVOOGb3ByZCRaSUHrSEuDi0w.4/WOe', 
    candidates: [
      'no such user', 'id: no such user', 'no such user', 
      'unknown user', 'can\'t insert user', 'cannot add user',
      'id: \'tempuser\': no such user', 'id: \'tempuser2\': no such user',
    ] },
  { title: 'Passwd Field Parse', hash: '$2b$10$SIIwfFNDwBM4XTOmDHbuneC/Rz9bR.z/uq9yNZjz5C8FpCYB2v9Ke', 
    candidates: [
      'nobody student', 'nobody student games',
      'nobody systemd-network systemd-resolve',
      'nobody systemd-timesync',
    ] },
  { title: 'Pipeline Master', hash: '$2b$10$5hjt33h4OsRNTxt0lfAWJuTXanGqJEyBBAKB929fqZJUkWyu4yToe', 
    candidates: [
      '/bin/bash /bin/sync /usr/sbin/nologin',
      '/bin/bash /bin/sh /usr/sbin/nologin',
      '/bin/bash /bin/sh /bin/sync',
      'bash sh nologin',
    ] },
];

async function main() {
  for (const flag of flags) {
    let found = false;
    for (const candidate of flag.candidates) {
      const normalized = normalizeAnswer(candidate);
      const matches = await bcrypt.compare(normalized, flag.hash);
      if (matches) {
        console.log(`PASS: ${flag.title} = "${candidate}" (normalized: "${normalized}")`);
        found = true;
        break;
      }
    }
    if (!found) {
      console.log(`FAIL: ${flag.title} - none of [${flag.candidates.join(' | ')}] match`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
