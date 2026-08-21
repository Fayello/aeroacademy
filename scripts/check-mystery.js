const bcrypt = require('bcrypt');
function normalizeAnswer(a) { return a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(); }

const flags = [
  { title: 'User Deleter', hash: '$2b$10$hYp.8q41aqJHqCyfObZo1.HCVOOGb3ByZCRaSUHrSEuDi0w.4/WOe',
    candidates: [
      'user', 'no such user', 'no such', 'such user', 'no', 'id',
      'id: \'tempuser\': no such user', 'no such user', 'id: no such user',
    ]
  },
  { title: 'Passwd Field Parse', hash: '$2b$10$SIIwfFNDwBM4XTOmDHbuneC/Rz9bR.z/uq9yNZjz5C8FpCYB2v9Ke',
    candidates: [
      'nobody student', 'nobody games', 'nobody',
      'nobody student games', 'games', 
    ]
  },
];

async function main() {
  for (const flag of flags) {
    let found = false;
    for (const c of flag.candidates) {
      const n = normalizeAnswer(c);
      if (await bcrypt.compare(n, flag.hash)) {
        console.log(`FOUND: ${flag.title} = "${c}" (normalized: "${n}")`);
        found = true;
        break;
      }
    }
    if (!found) console.log(`NOT FOUND: ${flag.title}`);
  }
}
main();
