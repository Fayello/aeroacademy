const bcrypt = require('bcrypt');
function h(a) { return bcrypt.hashSync(a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(), 10); }

const fixes = [
  // Pipeline Master: test showed /bin/bash /bin/sh /bin/sync
  { title: 'Pipeline Master', lab: 'Linux Fundamentals: Text Processing & Shell Scripting', newAnswer: '/bin/bash /bin/sh /bin/sync' },
  // Script Writer: wc -l /etc/passwd shows 22 not 21
  { title: 'Script Writer', lab: 'Linux Fundamentals: Text Processing & Shell Scripting', newAnswer: '22' },
];

for (const f of fixes) {
  console.log(`UPDATE "LabFlag" SET "correctAnswer" = '${h(f.newAnswer)}' WHERE title = '${f.title}' AND "labId" = (SELECT id FROM "Lab" WHERE title = '${f.lab}');`);
}
