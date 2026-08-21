const bcrypt = require('bcrypt');

function normalizeAnswer(answer) {
  return answer.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim();
}

// From DB - actual container behavior in ubuntu:22.04 with student user
const flags = [
  { title: 'User Deleter', hash: '$2b$10$hYp.8q41aqJHqCyfObZo1.HCVOOGb3ByZCRaSUHrSEuDi0w.4/WOe', candidates: ['no such user', 'no such user'] },
  { title: 'Find World Writable', hash: '$2b$10$gztJunZ6BRaMEyBPrY0KDO0MrIIfyvS9qnl8INKf87h36WpC5lzFu', candidates: ['1', '0'] },
  { title: 'Group Manager', hash: '$2b$10$jnCmVtWkhFt/Gx0GInm3ou7xrGK6SqVcVm8S/./Woh8hWyZ.YDyQe', candidates: ['student : student admin_group', 'student admin_group'] },
  { title: 'Passwd Field Parse', hash: '$2b$10$SIIwfFNDwBM4XTOmDHbuneC/Rz9bR.z/uq9yNZjz5C8FpCYB2v9Ke', candidates: ['nobody student', 'nobody student'] },
  { title: 'Column Extractor', hash: '$2b$10$j0Oh4Oi1f/jNAxi99ej6VOEP/DQKO45qcLdo7it0YQc5MTgg/lTuu', candidates: ['alice charlie', 'alice', 'charlie'] },
  { title: 'Pipeline Master', hash: '$2b$10$5hjt33h4OsRNTxt0lfAWJuTXanGqJEyBBAKB929fqZJUkWyu4yToe', candidates: ['/bin/bash /bin/sync /usr/sbin/nologin', '/bin/bash /bin/sh /usr/sbin/nologin'] },
  { title: 'Sort & Count', hash: '$2b$10$ZjizwoxpxdNwJ4uZfaPbbuSf./tXm4yUmhvfiR9pxjghkssK1XkaW', candidates: ['banana'] },
  { title: 'awk Architect', hash: '$2b$10$kS.vzjqOsJIE.ArDiXeBB.PvW2pmT7wZumSgIiysjuIaWbd1M7uga', candidates: ['root daemon bin', 'root nobody student'] },
  { title: 'Disk Space Expert', hash: '$2b$10$VVYrOP2QLwmAWBsrBazanuWxelm1LOeQM6ssi.1OYnLongAlxx/gG', candidates: ['/'] },
  { title: 'Pipe Composer', hash: '$2b$10$OWaZX.ygxD4VrTWLuOfmH.U3edG93HJJqLnXkKl05wyEGP/hGcSui', candidates: ['/bin/bash /bin/sync /usr/sbin/nologin', '/bin/bash /bin/sh /usr/sbin/nologin'] },
  { title: 'Process Inspector', hash: '$2b$10$F19Rav5kqABOI5LKCBEPCOnLs6cL4xzvMuji9MTR8RIZlyL4q3AE6', candidates: ['tail', 'bash', 'tail -f /dev/null'] },
  { title: 'Tar Packer', hash: '$2b$10$RJ9P/pL1GkWpUvzW8WqceuUlCoNDsXFzFIb2I00sOnZ88lbKF09Ey', candidates: ['3', '4'] },
];

async function main() {
  for (const flag of flags) {
    let found = false;
    for (const candidate of flag.candidates) {
      const normalized = normalizeAnswer(candidate);
      const matches = await bcrypt.compare(normalized, flag.hash);
      if (matches) {
        console.log(`PASS: ${flag.title} = "${candidate}"`);
        found = true;
        break;
      }
    }
    if (!found) {
      console.log(`FAIL: ${flag.title} - none of [${flag.candidates.join(', ')}] match`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
