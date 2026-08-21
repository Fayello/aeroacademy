const bcrypt = require('bcrypt');
const crypto = require('crypto');
function h(a) { return bcrypt.hashSync(a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(), 10); }
const DOCKER = 'c66a327d-7fa7-480c-ba2a-5b94d6216d6d';
const flags = [
  { t: 'Rootfs Builder', d: 'Create a minimal rootfs: mkdir -p /tmp/rootfs/{bin,lib,lib64,usr,etc,proc,sys,dev,tmp} && cp /bin/bash /tmp/rootfs/bin/ && ldd /bin/bash | grep -o "/lib[^ ]*" | while read f; do cp "$f" /tmp/rootfs/lib/ 2>/dev/null; done && cp /lib64/ld-linux-x86-64.so.2 /tmp/rootfs/lib64/ 2>/dev/null. Run: ls /tmp/rootfs/bin/. What binary is present?', a: 'bash', p: 100 },
  { t: 'Chroot Prison', d: 'Using the rootfs from the previous exercise, run: chroot /tmp/rootfs /bin/bash -c "echo confined". What is the output?', a: 'confined', p: 100 },
  { t: 'Namespace Explorer', d: 'Run: ls /proc/self/ns/. How many namespace types are listed? (count the files)', a: '8', p: 75 },
  { t: 'PID Namespace', d: 'Run: unshare --pid --fork --mount-proc bash -c "ps aux | wc -l". How many processes are visible in the new PID namespace? (the header counts as 1)', a: '1', p: 100 },
  { t: 'Mount Namespace', d: 'Run: unshare --mount bash -c "mount -t tmpfs tmpfs /tmp && df -h /tmp | tail -1 | awk \"{print \\$1}\"". What filesystem type is /tmp now?', a: 'tmpfs', p: 100 },
  { t: 'Network Namespace', d: 'Run: unshare --net bash -c "ip link show lo | head -1". What is the state of the loopback interface in the new namespace?', a: '1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN', p: 100 },
  { t: 'User Namespace', d: 'Run: unshare --user --map-root-user bash -c "id". What UID is shown inside the user namespace?', a: 'uid=0(root)', p: 100 },
  { t: 'Cgroup Inspector', d: 'Run: ls /sys/fs/cgroup/ | head -5 | wc -l. How many cgroup controllers are visible?', a: '5', p: 75 },
  { t: 'Memory Limiter', d: 'Create a cgroup with 50MB memory limit: mkdir -p /sys/fs/cgroup/test && echo 52428800 > /sys/fs/cgroup/test/memory.max 2>/dev/null || echo 52428800 > /sys/fs/cgroup/test/memory.limit_in_bytes 2>/dev/null. Run: cat /sys/fs/cgroup/test/memory.max 2>/dev/null || cat /sys/fs/cgroup/test/memory.limit_in_bytes 2>/dev/null. What value is set?', a: '52428800', p: 100 },
  { t: 'Process Limiter', d: 'Create a cgroup with max 3 processes: mkdir -p /sys/fs/cgroup/proclimit && echo 3 > /sys/fs/cgroup/proclimit/pids.max 2>/dev/null. Run: cat /sys/fs/cgroup/proclimit/pids.max. What is the limit?', a: '3', p: 100 },
  { t: 'Union Filesystem', d: 'Create overlay dirs: mkdir -p /tmp/overlay/{lower,upper,work,merged}. Create file in lower: echo "base" > /tmp/overlay/lower/file.txt. Create different file in upper: echo "modified" > /tmp/overlay/upper/file.txt. Run: ls /tmp/overlay/lower/ /tmp/overlay/upper/. How many total files across both?', a: '2', p: 100 },
  { t: 'Container Builder', d: 'Build a minimal container: mkdir -p /tmp/container/{rootfs,upper,work,merged}. Copy bash into rootfs. Mount overlay: mount -t overlay overlay -o lowerdir=/tmp/container/rootfs,upperdir=/tmp/container/upper,workdir=/tmp/container/work /tmp/container/merged 2>/dev/null. Run: ls /tmp/container/merged/bin/bash. Does it exist? (yes/no)', a: 'yes', p: 100 },
  { t: 'Seccomp Inspector', d: 'Run: grep -c "seccomp" /proc/self/status 2>/dev/null || echo "0". Is seccomp mentioned in process status?', a: '1', p: 75 },
  { t: 'Capability Checker', d: 'Run: cat /proc/self/status | grep CapEff | awk "{print $2}". What is the effective capability hex value?', a: '00000000a80425fb', p: 100 },
  { t: 'Filesystem Limits', d: 'Create a loop device and ext4 filesystem: dd if=/dev/zero of=/tmp/container.img bs=1M count=50 2>/dev/null && mkfs.ext4 -q /tmp/container.img && mkdir -p /tmp/containerfs && mount -o loop /tmp/container.img /tmp/containerfs && df -h /tmp/containerfs | tail -1 | awk "{print \\$2}". What is the filesystem size?', a: '46M', p: 100 },
];
const lines = [];
for (const f of flags) {
  const id = crypto.randomUUID();
  lines.push(`INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES ('${id}', '${DOCKER}', '${f.t.replace(/'/g,"''")}', '${f.d.replace(/'/g,"''")}', ${f.p}, '${h(f.a)}');`);
}
console.log(lines.join('\n'));
