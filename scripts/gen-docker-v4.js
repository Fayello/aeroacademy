const bcrypt = require('bcrypt');
const crypto = require('crypto');
function h(a) { return bcrypt.hashSync(a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(), 10); }
const DOCKER = 'c66a327d-7fa7-480c-ba2a-5b94d6216d6d';
const flags = [
  { t: 'Process Inspector', d: 'Run: cat /proc/1/cmdline | tr "\\0" " ". What command is PID 1 running?', a: 'tail -f /dev/null', p: 50 },
  { t: 'Namespace Counter', d: 'Run: ls /proc/self/ns/ | wc -l. How many namespace types exist on this system?', a: '12', p: 75 },
  { t: 'Environment Inspector', d: 'Run: cat /proc/1/environ | tr "\\0" "\\n" | grep -c PATH. How many PATH variables are set for PID 1?', a: '1', p: 75 },
  { t: 'Limits Reader', d: 'Run: cat /proc/1/limits | grep "Max open files" | awk "{print $4}". What is the soft limit for open files?', a: '1024', p: 100 },
  { t: 'Mount Inspector', d: 'Run: cat /proc/1/mountinfo | wc -l. How many mount entries does PID 1 see?', a: '16', p: 100 },
  { t: 'Signal Explorer', d: 'Run: kill -l | grep -c "SIG". How many signals can you list with kill -l?', a: '0', p: 75 },
  { t: 'Process Killer', d: 'Start: sleep 999 &. Find PID: pgrep sleep | head -1. Kill it: kill $PID. Run: pgrep sleep | wc -l. How many sleep processes remain?', a: '0', p: 75 },
  { t: 'IPC Inspector', d: 'Run: ipcs -s 2>/dev/null | tail -n +3 | wc -l. How many semaphore segments exist (exclude headers)?', a: '0', p: 100 },
  { t: 'File Creator', d: 'Create /home/student/container_proof.txt with exact content: I built this container. Run: cat /home/student/container_proof.txt. What is the content?', a: 'I built this container', p: 50 },
  { t: 'Script Writer', d: 'Create /home/student/inspect.sh that outputs "CONTAINER_OK" and make it executable. Run it. What is the output?', a: 'CONTAINER_OK', p: 75 },
  { t: 'Permission Setter', d: 'Create /home/student/locked.txt. Set to chmod 000. Run: stat -c "%a" /home/student/locked.txt. What permission number?', a: '000', p: 75 },
  { t: 'Network Explorer', d: 'Run: cat /proc/net/tcp | head -3 | wc -l. How many lines are in the TCP socket table (including header)?', a: '3', p: 100 },
  { t: 'Filesystem Reader', d: 'Run: cat /proc/filesystems | grep -c "nodev". How many pseudo-filesystems are supported?', a: '1', p: 100 },
  { t: 'Process Counter', d: 'Run: ls /proc | grep -c "^[0-9]". How many process directories exist in /proc?', a: '1', p: 75 },
  { t: 'Timer Creator', d: 'Run: timeout 1 sleep 2 & sleep 0.5 && pgrep timeout | wc -l. How many timeout processes are running during the 0.5s window?', a: '1', p: 100 },
];
const lines = [];
for (const f of flags) {
  const id = crypto.randomUUID();
  lines.push(`INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES ('${id}', '${DOCKER}', '${f.t.replace(/'/g,"''")}', '${f.d.replace(/'/g,"''")}', ${f.p}, '${h(f.a)}');`);
}
console.log(lines.join('\n'));
