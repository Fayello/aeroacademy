# Module 5 — System Calls and the Kernel Interface

**Course:** Linux Internals | **Path:** Linux Internals (5 of 10)

---

## What You'll Actually Do

Your app is making a system call that's taking3 seconds. You'll trace it with strace, understand how syscalls work, and find the bottleneck.

---

## What Is a System Call?

When a process needs hardware access, file I/O, or network, it can't do it directly. It asks the kernel through a system call.

```c
// User space
fd = open("/etc/passwd", O_RDONLY);  // looks like a function call
read(fd, buffer, 1024);              // but it's actually a syscall
close(fd);
```

Under the hood, `open()` triggers a software interrupt (`int 0x80` on x86, `syscall` on x86_64). The kernel takes over, does the work, and returns the result.

---

## strace — Trace System Calls

```bash
# Trace a command
strace ls /tmp
# openat(AT_FDCWD, "/tmp", O_RDONLY|O_NONBLOCK|O_CLOEXEC|O_DIRECTORY) = 3
# getdents64(3, /* 5 entries */, 32768) = 168
# write(1, "file1  file2  file3\n", 21) = 21
# close(3) = 0
# exit_group(0) = ?

# Count syscalls by type
strace -c ls /tmp
# % time     seconds  usecs/call     calls    errors syscall
# ------ ----------- ----------- --------- --------- --------
#  45.00    0.000045          45         1           write
#  30.00    0.000030          30         1           openat
#  25.00    0.000025          25         1           getdents64

# Trace a specific syscall
strace -e openat ls /tmp

# Trace a running process
strace -p 1234

# Follow forks
strace -f ./myapp

# Write to file
strace -o trace.log ./myapp
```

---

## Common System Calls

| Call | What it does |
|------|-------------|
| `openat` | Open a file |
| `read` | Read from file descriptor |
| `write` | Write to file descriptor |
| `close` | Close file descriptor |
| `mmap` | Map file into memory |
| `brk` | Allocate heap memory |
| `clone` | Create a process |
| `execve` | Replace process image |
| `ioctl` | Device control |
| `socket` | Create network socket |
| `connect` | Connect to remote |
| `sendto` / `recvfrom` | Send/receive data |
| `stat` | Get file metadata |

---

## Slow Syscalls — Finding Bottlenecks

```bash
# App is slow. What's it doing?
strace -p 1234 -T
# read(5, ..., 4096) = 4096 <0.000012>
# read(5, ..., 4096) = 4096 <0.000008>
# read(5, ..., 4096) = 4096 <0.000010>
# read(5, ..., 4096) = 0    <3.001234>  ← 3 seconds!

# The last read took3 seconds. Why?
# - Network socket waiting for data
# - Disk I/O slow
# - NFS timeout

# Check with ltrace (library calls)
ltrace -p 1234
```

---

## File Descriptors

Every open file, socket, pipe is a file descriptor (integer).

```bash
# See open file descriptors for a process
ls -la /proc/1234/fd/
# 0 → /dev/pts/0    (stdin)
# 1 → /dev/pts/0    (stdout)
# 2 → /dev/pts/0    (stderr)
# 3 → socket:[12345] (network connection)
# 4 → /var/log/app.log

# Count open file descriptors
ls /proc/1234/fd/ | wc -l

# Check system-wide limit
cat /proc/sys/fs/file-nr
# 1234  0  9223372036854775807
# allocated  free  max
```

---

## Real Task: Debug a Slow Application

```bash
# App is hanging. Trace it.
strace -p 1234 -T -e trace=network
# connect(5, {sa_family=AF_INET, sin_port=htons(5432), sin_addr=inet_addr("10.0.0.20")}, 16) = -1 ETIMEDOUT <30.001234>

# The connect() to PostgreSQL on10.0.0.20 timed out after30 seconds
# Check if PostgreSQL is reachable
nc -zv 10.0.0.20 5432
# Connection refused

# Check PostgreSQL status
systemctl status postgresql
# Active: failed

# Fix: restart PostgreSQL
systemctl restart postgresql
```

---

## Assessment

**Lab task (20 min):**

1. Trace a command with strace and identify syscalls
2. Count syscalls by type
3. Trace a running process
4. Find a slow syscall
5. List open file descriptors for a process
6. Debug a hanging application with strace

**Grading:**
- strace used: 15%
- Syscalls counted: 15%
- Running process traced: 15%
- Slow syscall found: 25%
- File descriptors listed: 15%
- Debug completed: 15%

---

## Evidence

- **OutcomeEvidence:** `INT-LO5 — System Call Tracing`

---

## Unlock

Module6 — Kernel Modules and eBPF. You know how syscalls work. Now you learn how to extend the kernel.
