const bcrypt = require('bcrypt');
const crypto = require('crypto');

function normalize(a) { return a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(); }
function h(a) { return bcrypt.hashSync(normalize(a), 10); }
function u() { return crypto.randomUUID(); }

// Lab IDs (from production DB)
const LAB1 = '08587d88-0e1c-4858-8e4f-03c79c619559';
const LAB2 = 'f74e1aaf-05e3-4793-aeea-c7eee726375c';
const LAB3 = '3f3af78b-3f18-4278-8bf8-bc42181f0d24';
const LAB4 = '88ca76ae-9628-4095-b15d-3e0a9f33037e';

const newFlags = [
  // LAB 1: Ubuntu CLI Mastery (+10 new flags)
  { labId: LAB1, title: 'Directory Builder', desc: 'Create the directory tree /home/student/project/src/utils using mkdir -p. Then run: ls -R /home/student/project. How many times does "utils" appear in the output?', answer: '1', pts: 75 },
  { labId: LAB1, title: 'File Mover', desc: 'Create /home/student/old_name.txt with content "migrate me". Rename it to /home/student/new_name.txt using mv. Run: cat /home/student/new_name.txt. What is the content?', answer: 'migrate me', pts: 75 },
  { labId: LAB1, title: 'Chain Commander', desc: 'Run: touch /home/student/a.txt /home/student/b.txt /home/student/c.txt && ls /home/student/*.txt | wc -l. How many .txt files exist?', answer: '3', pts: 100 },
  { labId: LAB1, title: 'Glob Master', desc: 'Run: touch /home/student/{1..5}.log && ls /home/student/*.log | wc -l. How many .log files were created?', answer: '5', pts: 75 },
  { labId: LAB1, title: 'Redirect Wizard', desc: 'Run: echo "first" > /tmp/redirect.txt && echo "second" >> /tmp/redirect.txt && wc -l < /tmp/redirect.txt. How many lines in the file?', answer: '2', pts: 75 },
  { labId: LAB1, title: 'Pipe Composer', desc: 'Run: cat /etc/passwd | cut -d: -f7 | sort | uniq | head -3. Submit the 3 unique shell types separated by spaces.', answer: '/bin/bash /bin/sync /usr/sbin/nologin', pts: 100 },
  { labId: LAB1, title: 'Script Crafter', desc: 'Create /home/student/sysinfo.sh that prints "HOSTNAME=$(hostname)" on line 1 and "USER=$(whoami)" on line 2. chmod +x and run it. Submit the first line output.', answer: 'HOSTNAME=', pts: 100 },
  { labId: LAB1, title: 'Find & Exec', desc: 'Run: find /etc -name "*.conf" -type f 2>/dev/null | head -5 | wc -l. How many .conf files were found in the first 5?', answer: '5', pts: 100 },
  { labId: LAB1, title: 'Tar Packer', desc: 'Create /home/student/bundle/ with 3 files (a.txt, b.txt, c.txt). Pack: tar czf /tmp/bundle.tar.gz -C /home/student bundle. Run: tar tzf /tmp/bundle.tar.gz | wc -l. How many entries?', answer: '4', pts: 100 },
  { labId: LAB1, title: 'Diff Detective', desc: 'Create /home/student/file1.txt with "hello" and /home/student/file2.txt with "world". Run: diff /home/student/file1.txt /home/student/file2.txt. What are the first two characters of the output?', answer: '1c1', pts: 100 },

  // LAB 2: File Permissions & Users (+10 new flags)
  { labId: LAB2, title: 'Permission Decode', desc: 'Create /home/student/data.txt and run chmod 644 on it. Run: stat -c "%A" /home/student/data.txt. What is the full permission string?', answer: '-rw-r--r--', pts: 75 },
  { labId: LAB2, title: 'Ownership Transfer', desc: 'Create /home/student/shared.txt. Change owner to alice: chown alice /home/student/shared.txt. Run: stat -c "%U" /home/student/shared.txt. Who owns it now?', answer: 'alice', pts: 75 },
  { labId: LAB2, title: 'Group Write', desc: 'Create /home/student/team.txt. Run: chmod g+w /home/student/team.txt && stat -c "%A" /home/student/team.txt. What permission string?', answer: '-rw-rw-r--', pts: 100 },
  { labId: LAB2, title: 'Recursive Chmod', desc: 'Create /home/student/dir1/sub1/sub2 (mkdir -p). Run: chmod -R 755 /home/student/dir1 && stat -c "%A" /home/student/dir1/sub1/sub2. What permissions?', answer: 'drwxr-xr-x', pts: 100 },
  { labId: LAB2, title: 'User Deleter', desc: 'Create user tempuser, then delete it: userdel tempuser. Run: id tempuser 2>&1. What is the first word of the error?', answer: 'no', pts: 75 },
  { labId: LAB2, title: 'Password Vault', desc: 'Set alice password: echo "alice:secret123" | chpasswd. Then run: su - alice -c "echo authenticated" 2>&1. What is the output?', answer: 'authenticated', pts: 100 },
  { labId: LAB2, title: 'Umask Detective', desc: 'Run: umask 022 && touch /home/student/umask_test.txt && stat -c "%A" /home/student/umask_test.txt. What permissions?', answer: '-rw-r--r--', pts: 100 },
  { labId: LAB2, title: 'Find World Writable', desc: 'Run: find /tmp -maxdepth 1 -perm -o+w -type d 2>/dev/null | wc -l. How many world-writable directories exist in /tmp?', answer: '1', pts: 100 },
  { labId: LAB2, title: 'Effective Group', desc: 'Run: id -gn alice 2>/dev/null || echo "alice". What is alice primary group name?', answer: 'alice', pts: 75 },
  { labId: LAB2, title: 'Passwd Field Parse', desc: 'Run: awk -F: "$3>=1000{print $1}" /etc/passwd | head -3. Submit the usernames separated by spaces.', answer: 'student alice bob', pts: 100 },

  // LAB 3: Text Processing & Shell Scripting (+10 new flags)
  { labId: LAB3, title: 'CSV Parser', desc: 'Create /home/student/data.csv with 4 lines: header,name,score then 3 data rows with scores 10,20,30. Run: awk -F, "NR>1{sum+=$3}END{print sum}" /home/student/data.csv. What is the total?', answer: '60', pts: 100 },
  { labId: LAB3, title: 'Log Filter', desc: 'Create /home/student/app.log with 3 lines: "INFO ok", "ERROR fail", "INFO ok". Run: grep -c "ERROR" /home/student/app.log. How many error lines?', answer: '1', pts: 75 },
  { labId: LAB3, title: 'Word Counter', desc: 'Run: echo "the cat sat on the mat" | wc -w. How many words?', answer: '6', pts: 50 },
  { labId: LAB3, title: 'sed Replace All', desc: 'Run: echo "aaa bbb aaa ccc aaa" | sed "s/aaa/XXX/g". How many times does "XXX" appear? (count with grep -o XXX | wc -l)', answer: '3', pts: 100 },
  { labId: LAB3, title: 'Column Extractor', desc: 'Create /home/student/grades.csv: "alice,90" "bob,85" "charlie,95" (one per line). Run: awk -F, "$2>=90{print $1}" /home/student/grades.csv. Who passed with 90+?', answer: 'alice charlie', pts: 100 },
  { labId: LAB3, title: 'Sort & Count', desc: 'Run: echo -e "banana\napple\ncherry\nbanana\napple" | sort | uniq -c | sort -rn | head -1 | awk "{print $2}". What is the most frequent word?', answer: 'banana', pts: 100 },
  { labId: LAB3, title: 'Script Loop', desc: 'Create /home/student/count.sh that loops 1..10 and outputs the sum. Make executable and run. What is the total?', answer: '55', pts: 100 },
  { labId: LAB3, title: 'Regex Matcher', desc: 'Run: echo "test@email.com" | grep -oP "[a-zA-Z0-9]+@" | tr -d "@". What username part is extracted?', answer: 'test', pts: 100 },
  { labId: LAB3, title: 'String Transform', desc: 'Run: echo "Hello World" | tr "A-Z" "a-z" | sed "s/world/AERO/". What is the output?', answer: 'hello aero', pts: 100 },
  { labId: LAB3, title: 'Line Address', desc: 'Create /home/student/lines.txt with 10 numbered lines ("line1" through "line10"). Run: sed -n "3,7p" /home/student/lines.txt | wc -l. How many lines printed?', answer: '5', pts: 100 },

  // LAB 4: Process & Service Management (+10 new flags)
  { labId: LAB4, title: 'Process Hunter', desc: 'Run: cat /proc/1/comm. What is the name of PID 1?', answer: 'tail', pts: 50 },
  { labId: LAB4, title: 'Service Architect', desc: 'Start ssh: service ssh start. Run: service ssh status 2>&1. Submit the full status line.', answer: 'sshd is running', pts: 50 },
  { labId: LAB4, title: 'Signal Handler', desc: 'Run: kill -0 1 2>&1; echo $?. What exit code means PID 1 is alive?', answer: '0', pts: 50 },
  { labId: LAB4, title: 'Systemd Master', desc: 'After starting ssh, run: service ssh status 2>&1. Does sshd show as running? Submit "is running" or "is not running".', answer: 'is running', pts: 50 },
  { labId: LAB4, title: 'Cron Crafter', desc: 'Add cron: echo "* * * * * echo cron_ok > /tmp/cron_proof" | crontab -. Wait 60 seconds, then run: cat /tmp/cron_proof. What is the content?', answer: 'cron_ok', pts: 50 },
  { labId: LAB4, title: 'Background Job', desc: 'Run: nohup sleep 300 & then pgrep sleep | head -1. Submit the PID number.', answer: '1', pts: 75 },
  { labId: LAB4, title: 'Process Tree', desc: 'Run: ps aux | wc -l. How many processes are running? (submit the number minus 1 for the header)', answer: '4', pts: 75 },
  { labId: LAB4, title: 'Signal Messenger', desc: 'Run: kill -USR1 1 2>&1; echo $?. What is the exit code when sending USR1 to PID 1?', answer: '0', pts: 100 },
  { labId: LAB4, title: 'File Descriptor', desc: 'Run: ls /proc/self/fd/ | wc -l. How many file descriptors does the current shell have?', answer: '10', pts: 100 },
  { labId: LAB4, title: 'Memory Inspector', desc: 'Run: free -m | awk "/Mem:/{print $2}". How many MB of total RAM is available?', answer: '1', pts: 100 },
];

async function generate() {
  const lines = [];
  lines.push('-- Expanded Lab Flags: 40 new exercises across Labs 1-4');
  lines.push('-- Generated with bcrypt hashes');
  lines.push('');
  for (const f of newFlags) {
    const id = u();
    const hash = h(f.answer);
    const t = f.title.replace(/'/g, "''");
    const d = f.desc.replace(/'/g, "''");
    lines.push(`INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES ('${id}', '${f.labId}', '${t}', '${d}', ${f.pts}, '${hash}');`);
  }
  console.log(lines.join('\n'));
}

generate();
