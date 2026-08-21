const bcrypt = require('bcrypt');
const crypto = require('crypto');
function h(a) { return bcrypt.hashSync(a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(), 10); }

// All verified fixes from container testing
const fixes = [
  // Lab 1 - answers verified in ubuntu:22.04
  { title: 'Pipe Composer', newDesc: 'Run: cat /etc/passwd | cut -d: -f7 | sort | uniq | head -3. Submit the 3 unique shell types separated by spaces.', newAnswer: '/bin/bash /bin/sync /usr/sbin/nologin', lab: 'Linux Fundamentals: Ubuntu CLI Mastery' },
  { title: 'Hidden Finder', newDesc: 'Run: ls -la /root 2>/dev/null | grep "^\\." | wc -l. How many hidden files/dirs exist in /root? (count entries starting with .)', newAnswer: '0', lab: 'Linux Fundamentals: Ubuntu CLI Mastery' },
  { title: 'Environment Detective', newDesc: 'Run: echo $PATH | tr ":" "\\n" | wc -l. How many directories are in your PATH?', newAnswer: '6', lab: 'Linux Fundamentals: Ubuntu CLI Mastery' },
  { title: 'Directory Builder', newDesc: 'Create the directory tree /home/student/project/src/utils using mkdir -p. Then run: ls -R /home/student/project | grep -c "utils". How many times does "utils" appear in the output?', newAnswer: '2', lab: 'Linux Fundamentals: Ubuntu CLI Mastery' },

  // Lab 2 - answers verified
  { title: 'Ownership Transfer', newDesc: 'Create /home/student/shared.txt. Change owner to root: chown root /home/student/shared.txt. Run: stat -c "%U" /home/student/shared.txt. Who owns it now?', newAnswer: 'root', lab: 'Linux Fundamentals: File Permissions & Users' },
  { title: 'User Deleter', newDesc: 'Create user tempuser: useradd tempuser. Then delete it: userdel tempuser. Run: id tempuser 2>&1. What is the first word of the error?', newAnswer: 'id', lab: 'Linux Fundamentals: File Permissions & Users' },
  { title: 'Password Vault', newDesc: 'Create user alice: useradd -m alice. Set password: echo "alice:secret123" | chpasswd. Verify: echo "alice:secret123" | chpasswd && echo "password_set". What is the output?', newAnswer: 'password_set', lab: 'Linux Fundamentals: File Permissions & Users' },
  { title: 'Effective Group', newDesc: 'Run: id -gn root. What is the primary group name for root?', newAnswer: 'root', lab: 'Linux Fundamentals: File Permissions & Users' },
  { title: 'Passwd Field Parse', newDesc: 'Run: awk -F: "$3>=1000{print $1}" /etc/passwd | head -3. Submit the usernames separated by spaces.', newAnswer: 'nobody', lab: 'Linux Fundamentals: File Permissions & Users' },

  // Lab 3 - CSV parser was summing city names (strings), fix to sum ages
  { title: 'CSV Parser', newDesc: 'Create /home/student/data.csv with 4 lines: header,name,score then 3 data rows with scores 10,20,30. Run: awk -F, "NR>1{sum+=$3}END{print sum}" /home/student/data.csv. What is the total?', newAnswer: '60', lab: 'Linux Fundamentals: Text Processing & Shell Scripting' },

  // Lab 4 - PID 1 in docker run is bash, not tail
  { title: 'Process Hunter', newDesc: 'Run: cat /proc/1/comm. What is the name of PID 1?', newAnswer: 'bash', lab: 'Linux Fundamentals: Process & Service Management' },
  { title: 'Process Tree', newDesc: 'Run: ps aux | wc -l. How many processes are running? (submit the number minus 1 for the header)', newAnswer: '5', lab: 'Linux Fundamentals: Process & Service Management' },
  { title: 'File Descriptor', newDesc: 'Run: ls /proc/self/fd/ | wc -l. How many file descriptors does the current shell have?', newAnswer: '4', lab: 'Linux Fundamentals: Process & Service Management' },
];

const lines = [];
for (const f of fixes) {
  const hash = h(f.newAnswer);
  const desc = f.newDesc.replace(/'/g, "''");
  lines.push(`UPDATE "LabFlag" SET "correctAnswer" = '${hash}', description = '${desc}' WHERE title = '${f.title.replace(/'/g,"''")}' AND "labId" = (SELECT id FROM "Lab" WHERE title = '${f.lab.replace(/'/g,"''")}');`);
}
console.log(lines.join('\n'));
