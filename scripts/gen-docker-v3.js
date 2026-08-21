const bcrypt = require('bcrypt');
const crypto = require('crypto');
function h(a) { return bcrypt.hashSync(a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(), 10); }
const DOCKER = 'c66a327d-7fa7-480c-ba2a-5b94d6216d6d';
const flags = [
  { t: 'Process Inspector', d: 'Run: cat /proc/1/cmdline | tr "\0" " ". What is PID 1 running?', a: 'tail -f /dev/null', p: 50 },
  { t: 'Resource Monitor', d: 'Run: cat /proc/meminfo | head -3. What is the total memory (MemTotal) in kB?', a: 'MemTotal:', p: 50 },
  { t: 'File Descriptor Counter', d: 'Run: ls /proc/1/fd/ | wc -l. How many file descriptors does PID 1 have?', a: '3', p: 75 },
  { t: 'Namespace Inspector', d: 'Run: ls -la /proc/1/ns/. How many namespace links are shown for PID 1?', a: '8', p: 75 },
  { t: 'Environment Inspector', d: 'Run: cat /proc/1/environ | tr "\0" "\n" | head -3. How many environment variables are shown?', a: '3', p: 75 },
  { t: 'Limits Reader', d: 'Run: cat /proc/1/limits | grep "Max open files". What is the soft limit?', a: '1024', p: 100 },
  { t: 'Mount Inspector', d: 'Run: cat /proc/1/mountinfo | head -3. How many mounted filesystems does PID 1 see?', a: '3', p: 100 },
  { t: 'CPU Info', d: 'Run: cat /proc/cpuinfo | grep -c "processor". How many CPUs are visible?', a: '1', p: 75 },
  { t: 'Uptime Checker', d: 'Run: cat /proc/uptime | awk "{print $1}". What is the system uptime in seconds? (submit the integer part)', a: '1', p: 75 },
  { t: 'IO Scheduler', d: 'Run: cat /sys/block/vda/queue/scheduler 2>/dev/null || cat /sys/block/sda/queue/scheduler 2>/dev/null || echo "none". What I/O scheduler is active? (the one in brackets)', a: 'none', p: 100 },
  { t: 'Process Killer', d: 'Start a background process: sleep 999 &. Find its PID: pgrep sleep | head -1. Kill it: kill $PID. Run: pgrep sleep | wc -l. How many sleep processes remain?', a: '0', p: 75 },
  { t: 'Signal Sender', d: 'Run: kill -l | wc -l. How many signals are available on this system?', a: '31', p: 75 },
  { t: 'OOM Inspector', d: 'Run: cat /proc/1/oom_score 2>/dev/null || echo "0". What is the OOM score of PID 1?', a: '0', p: 100 },
  { t: 'IPC Explorer', d: 'Run: ipcs -s 2>/dev/null | wc -l || echo "0". How many shared memory segments exist? (submit total lines minus 2 for headers)', a: '0', p: 100 },
  { t: 'System Map', d: 'Run: cat /proc/devices | grep -c "^[0-9]". How many character/block device drivers are registered?', a: '1', p: 100 },
];
const lines = [];
for (const f of flags) {
  const id = crypto.randomUUID();
  lines.push(`INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES ('${id}', '${DOCKER}', '${f.t.replace(/'/g,"''")}', '${f.d.replace(/'/g,"''")}', ${f.p}, '${h(f.a)}');`);
}
console.log(lines.join('\n'));
