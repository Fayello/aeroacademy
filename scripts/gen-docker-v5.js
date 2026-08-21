const bcrypt = require('bcrypt');
const crypto = require('crypto');
function h(a) { return bcrypt.hashSync(a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(), 10); }
const DOCKER = 'c66a327d-7fa7-480c-ba2a-5b94d6216d6d';
const flags = [
  { t: 'Process Inspector', d: 'Run: cat /proc/1/cmdline | tr "\\0" " ". What command is PID 1 running?', a: 'tail -f /dev/null', p: 50 },
  { t: 'File Creator', d: 'Create /home/student/container_proof.txt with exact content: I built this container. Run: cat /home/student/container_proof.txt. What is the content?', a: 'I built this container', p: 50 },
  { t: 'Limits Reader', d: 'Run: cat /proc/1/limits | grep "Max open files" | awk "{print $4}". What is the soft limit for open files?', a: '1024', p: 75 },
  { t: 'Script Writer', d: 'Create /home/student/inspect.sh that outputs exactly CONTAINER_OK. Make executable. Run it. What is the output?', a: 'CONTAINER_OK', p: 75 },
  { t: 'Permission Setter', d: 'Create /home/student/locked.txt. Set to chmod 000. Run: stat -c "%a" /home/student/locked.txt. What number?', a: '0', p: 75 },
  { t: 'Process Killer', d: 'Start: sleep 999 &. Kill it: kill $(pgrep sleep | head -1). Run: pgrep sleep | wc -l. How many sleep processes remain?', a: '0', p: 75 },
  { t: 'Multi-Line Writer', d: 'Create /home/student/data.txt with 3 lines: apple on line 1, banana on line 2, cherry on line 3. Run: wc -l /home/student/data.txt. How many lines?', a: '3', p: 75 },
  { t: 'Text Searcher', d: 'Create /home/student/search.txt with "hello world foo bar hello world". Run: grep -o "hello" /home/student/search.txt | wc -l. How many times does "hello" appear?', a: '2', p: 75 },
  { t: 'Sort Master', d: 'Run: echo -e "charlie\nalice\nbob" | sort | head -1. What name is first after sorting?', a: 'alice', p: 75 },
  { t: 'Unique Counter', d: 'Run: echo -e "a\na\nb\nb\nb\nc" | sort | uniq -c | sort -rn | head -1 | awk "{print $1}". What is the count of the most frequent item?', a: '3', p: 100 },
  { t: 'Date Formatter', d: 'Run: date +%Y%m%d. What is today date in YYYYMMDD format?', a: '20260821', p: 75 },
  { t: 'String Length', d: 'Run: echo -n "AEROACADEMY" | wc -c. How many characters in AEROACADEMY?', a: '11', p: 75 },
  { t: 'File Duplicator', d: 'Create /home/student/original.txt with "clone me". Copy to /home/student/clone.txt. Run: diff /home/student/original.txt /home/student/clone.txt. What is the output (empty if identical)?', a: '', p: 75 },
  { t: 'Hex Converter', d: 'Run: echo 255 | xargs printf "%x". What is 255 in hexadecimal?', a: 'ff', p: 100 },
  { t: 'Path Resolver', d: 'Run: realpath /home/student/. What is the absolute path?', a: '/home/student', p: 75 },
];
const lines = [];
for (const f of flags) {
  const id = crypto.randomUUID();
  lines.push(`INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES ('${id}', '${DOCKER}', '${f.t.replace(/'/g,"''")}', '${f.d.replace(/'/g,"''")}', ${f.p}, '${h(f.a)}');`);
}
console.log(lines.join('\n'));
