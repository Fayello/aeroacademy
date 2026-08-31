# Module 5 — System Calls and the Kernel Interface

## The System Call: Where User Meets Kernel

System calls are the only interface between user-space programs and the kernel. Every time a program reads a file, opens a network connection, or allocates memory, it crosses the user/kernel boundary through a system call. Understanding how this boundary works is essential for debugging stuck processes, understanding performance bottlenecks, and securing systems.

## How System Calls Work

### The User Space to Kernel Space Transition

When a user-space program makes a system call, the CPU transitions from user mode (ring 3 on x86) to kernel mode (ring 0). This transition is triggered by a software interrupt instruction:

- **x86_64**: `syscall` instruction
- **x86_32**: `int 0x80`
- **ARM64**: `svc #0`
- **ARM32**: `swi #0`

The `syscall` instruction does the following:

1. Saves the user-space instruction pointer (RIP) to RCX
2. Saves the user-space stack pointer (RSP) to R11
3. Loads the kernel stack pointer from the MSR (Model Specific Register)
4. Loads the kernel entry point from the LSTAR MSR
5. Switches to kernel mode (ring 0)
6. Jumps to the kernel entry point

The kernel entry point (`entry_SYSCALL_64` on x86_64) performs the reverse:

1. Saves user-space registers to the kernel stack
2. Looks up the system call handler in the system call table (`sys_call_table`)
3. Calls the handler with the appropriate arguments
4. Saves the return value
5. Restores user-space registers
6. Executes `sysret` to return to user mode

### The System Call Table

Each architecture maintains a table mapping system call numbers to handler functions. On x86_64:

```bash
# View the system call table (from kernel source)
cat /usr/src/kernels/$(uname -r)/arch/x86/entry/syscalls/syscall_64.tbl | head -30
# 0    common  read                    sys_read
# 1    common  write                   sys_write
# 2    common  open                    sys_openat
# 3    common  close                   sys_close
# 4    common  stat                    sys_stat
# ...
# 9    common  mmap                    sys_mmap_pgoff
# 10   common  mprotect                sys_mprotect
# ...
# 302   common  prlimit64               sys_prlimit64
# 303   common  sendfile64              sys_sendfile64
# ...
# 332   64      statx                   sys_statx
```

The total number of system calls on a modern x86_64 kernel is approximately 350. The exact count depends on kernel configuration:

```bash
cat /proc/kallsyms | grep -c "sys_" | head -1
# or
zcat /proc/config.gz | grep CONFIG_
```

### System Call Arguments

System calls receive arguments through registers. On x86_64:

| Register | Purpose |
|----------|---------|
| RAX | System call number |
| RDI | Argument 1 |
| RSI | Argument 2 |
| RDX | Argument 3 |
| R10 | Argument 4 |
| R8 | Argument 5 |
| R9 | Argument 6 |

The C library (glibc) wraps system calls with functions that set up these registers and execute the `syscall` instruction:

```c
// Simplified version of how glibc implements write()
ssize_t write(int fd, const void *buf, size_t count) {
    long ret;
    asm volatile (
        "syscall"
        : "=a" (ret)
        : "a" (1), "D" (fd), "S" (buf), "d" (count)
        : "rcx", "r11", "memory"
    );
    return ret;
}
```

## strace: Tracing System Calls

strace is the most important debugging tool for understanding what a program is doing at the kernel level. It intercepts system calls and displays their arguments and return values.

### Basic Usage

```bash
# Trace a command
strace ls -la /tmp
# execve("/usr/bin/ls", ["ls", "-la", "/tmp"], 0x7ffd...) = 0
# brk(NULL)                               = 0x55a1b2c3d000
# openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
# read(3, "\177ELF..."..., 832)           = 832
# close(3)                                = 0
# ...

# Trace a running process
strace -p <PID>

# Trace specific syscalls
strace -e trace=open,read,write ls /tmp

# Trace with timing
strace -T ls /tmp
# Each syscall shows time spent in <seconds>

# Trace with child processes
strace -f bash -c "ls | grep txt"

# Output to file
strace -o /tmp/strace.log ls -la
```

### Interpreting strace Output

A typical strace output looks like:

```
openat(AT_FDCWD, "/etc/passwd", O_RDONLY) = 3
read(3, "root:x:0:0:root:/root:/bin/bash\n"..., 4096) = 3123
close(3)                                = 0
write(1, "root:x:0:0:root:/root:/bin/bash\n", 3123) = 3123
```

Key observations:
- Return values indicate success (>= 0) or failure (< 0, errno set)
- `= 3` means the file descriptor returned is 3 (0, 1, 2 are stdin/stdout/stderr)
- `read(3, "...", 4096) = 3123` means 3123 bytes were read
- Failed syscalls show the error: `openat(AT_FDCWD, "/nonexistent", O_RDONLY) = -1 ENOENT (No such file or directory)`

### Common strace Patterns for Debugging

**Stuck process — what is it waiting on?**

```bash
strace -p <PID> -e trace=network,read,write
# If it shows:
# read(5,  ← blank — it is waiting for data on file descriptor 5
# poll([{fd=5, events=POLLIN}], 1, -1) = 1  — waiting indefinitely for input
# futex(0x55a1b2c3d120, FUTEX_WAIT, 0, NULL) = 0  — waiting on a mutex

# This tells you WHAT the process is blocked on
```

**Slow application — where is time being spent?**

```bash
strace -T -e trace=network,write -p <PID>
# Look for syscalls with large time values
# write(7, "large data..."..., 65536) = 65536 <0.000012>
# recvfrom(7, "response..."..., 8192, 0, NULL, NULL) = 4096 <0.023456>
# The recvfrom took 23ms — this is the bottleneck
```

**Permission denied — which file access fails?**

```bash
strace -e trace=open,openat,access,stat -f my_program 2>&1 | grep -i "denied\|EACCES\|EPERM"
# openat(AT_FDCWD, "/etc/shadow", O_RDONLY) = -1 EACCES (Permission denied)
```

### strace Limitations

strace uses `ptrace()` to intercept system calls. This has significant overhead:

- Each system call requires two context switches (user→kernel→user, plus ptrace trap)
- Typical overhead: 5-10x slowdown
- Not suitable for production tracing of performance-sensitive applications
- Can cause deadlocks if the traced process is in a critical section

For production tracing, use `perf trace` (lower overhead) or eBPF-based tools (see Module 6).

## Common System Calls in Detail

### open/openat

`open()` opens a file and returns a file descriptor. `openat()` is the modern variant that takes a directory file descriptor, enabling relative path resolution:

```c
int fd = openat(AT_FDCWD, "/etc/config.json", O_RDONLY | O_CLOEXEC);
// AT_FDCWD: start from current working directory
// O_CLOEXEC: close on exec (prevents file descriptor leaks)
// O_RDONLY: read-only
// O_WRONLY | O_CREAT | O_TRUNC: write, create if missing, truncate
// O_RDWR | O_APPEND: read-write, always write at end
```

Common flags:

| Flag | Purpose |
|------|---------|
| O_RDONLY | Open for reading |
| O_WRONLY | Open for writing |
| O_RDWR | Open for read-write |
| O_CREAT | Create file if it does not exist |
| O_EXCL | Fail if file exists (use with O_CREAT) |
| O_TRUNC | Truncate to zero length |
| O_APPEND | Append mode (atomic for small writes) |
| O_NONBLOCK | Non-blocking I/O |
| O_CLOEXEC | Close on exec |
| O_DIRECT | Bypass page cache (direct I/O) |
| O_SYNC | Synchronize data and metadata to disk |

### read/write

`read()` and `write()` transfer data between user space and the kernel's page cache:

```c
char buf[4096];
ssize_t n = read(fd, buf, sizeof(buf));
// Returns number of bytes read, 0 for EOF, -1 for error

n = write(fd, buf, n);
// Returns number of bytes written, -1 for error
// Short writes are possible (n < requested)
```

Important behaviors:
- `read()` may return fewer bytes than requested (short read)
- `write()` may return fewer bytes than requested (short write)
- `write()` to a pipe may block if the pipe is full
- `write()` to a socket may fail with EAGAIN if non-blocking and the buffer is full
- `O_APPEND` writes are atomic for small sizes (up to PIPE_BUF, typically 4096 bytes)

### mmap

`mmap()` maps a file or device into memory. It is the foundation of modern file I/O and memory management:

```c
// Map a file for reading
struct stat st;
fstat(fd, &st);
void *addr = mmap(NULL, st.st_size, PROT_READ, MAP_PRIVATE, fd, 0);
// NULL: let kernel choose the address
// st.st_size: map the entire file
// PROT_READ: readable
// MAP_PRIVATE: copy-on-write (changes not visible to other processes)
// fd: file descriptor
// 0: offset in file

// Access the file content through the pointer
char *data = (char *)addr;
printf("First byte: %c\n", data[0]);

// Unmap when done
munmap(addr, st.st_size);
```

`mmap` vs `read/write`:

| Aspect | read/write | mmap |
|--------|------------|------|
| Copies | Data copied user↔kernel | Shared pages, no copy |
| Page cache | Uses page cache | Maps page cache directly |
| Random access | Must read sequentially | Can access any offset |
| Large files | Limited by buffer size | Limited by address space |
| Synchronization | Manual flush needed | msync() to flush |
| Shared memory | Not directly | MAP_SHARED for IPC |

### ioctl

`ioctl()` is the catch-all system call for device-specific operations. It is used for anything that does not fit into the read/write model:

```c
// Example: get terminal window size
struct winsize ws;
ioctl(STDOUT_FILENO, TIOCGWINSZ, &ws);
printf("Rows: %d, Cols: %d\n", ws.ws_row, ws.ws_col);

// Example: set network interface to promiscuous mode
struct ifreq ifr;
strcpy(ifr.ifr_name, "eth0");
ioctl(sock, SIOCGIFFLAGS, &ifr);
ifr.ifr_flags |= IFF_PROMISC;
ioctl(sock, SIOCSIFFLAGS, &ifr);
```

Common ioctls:

| ioctl | Purpose |
|-------|---------|
| TIOCGWINSZ | Get terminal window size |
| TIOCSWINSZ | Set terminal window size |
| FIONBIO | Set/clear non-blocking mode |
| SIOCGIFADDR | Get interface IP address |
| SIOCSIFFLAGS | Set interface flags |
| BLKGETSIZE | Get block device size |
| BLKFLSBUF | Flush block device buffers |
| KDSKBMODE | Set keyboard mode |
| EVIOCGVERSION | Get input event version |

### mmap and Modern Applications

mmap is used extensively in modern applications:

- **Databases**: Map data files directly into memory for zero-copy access
- **JVM**: Maps heap and code segments using mmap
- **Redis**: Uses mmap for persistence (RDB and AOF)
- **PostgreSQL**: Uses mmap for shared memory and WAL
- **Linkers**: Use mmap to load shared libraries

```bash
# See what a process has mapped
cat /proc/<PID>/maps | grep "\.so" | head -10
# Shows all shared libraries mapped into the process

# Check page cache usage for a file
fincore /path/to/file
# or
vmtouch -v /path/to/file
```

## Seccomp: System Call Filtering

Seccomp (Secure Computing) restricts which system calls a process can make. It is a critical security boundary used by browsers, containers, and sandboxed applications.

### Seccomp Modes

1. **Mode 1 (strict)**: Only read, write, exit, and sigreturn are allowed. No other syscalls. Extremely restrictive.

2. **Mode 2 (filter)**: BPF programs filter system calls. Allows fine-grained control over which syscalls are permitted and with which arguments.

### Setting Up Seccomp Filters

```c
#include <seccomp.h>

// Create a filter context
scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_KILL);  // Default: kill process

// Allow specific syscalls
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(read), 0);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(write), 0);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(exit), 0);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(exit_group), 0);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(mmap), 1,
    SCMP_A0(SCMP_CMP_MASKED_EQ, PROT_EXEC, PROT_EXEC));

// Load the filter
seccomp_load(ctx);

// Release the context
seccomp_release(ctx);
```

### Practical Seccomp Usage

**Docker default seccomp profile**: Docker applies a seccomp profile by default that blocks ~44 dangerous syscalls. You can view it:

```bash
# Docker's default seccomp profile location
cat /etc/docker/seccomp.json | python3 -m json.tool | grep -A2 "clone"

# Run a container with no seccomp (dangerous)
docker run --security-opt seccomp=unconfined alpine sh

# Run with custom profile
docker run --security-opt seccomp=/path/to/profile.json alpine sh
```

**Chrome browser**: Chrome uses seccomp-bpf to sandbox each renderer process. The filter blocks most syscalls and only allows what is needed for rendering.

**systemd services**: systemd can apply seccomp filters to services:

```ini
[Service]
SystemCallFilter=@system-service
SystemCallFilter=~@debug @mount @obsolete @reboot @swap @clock
SystemCallArchitectures=native
```

### Viewing Seccomp Status

```bash
# Check if a process has seccomp enabled
cat /proc/<PID>/status | grep Seccomp
# Seccomp:     2          # 0=disabled, 1=strict, 2=filter

# Check the filter rules (requires root)
cat /proc/<PID>/seccomp/filter  # May require CONFIG_SECCOMP_FILTER_DEBUGGER

# strace can show seccomp denials
strace -f -e trace=process command
# If a syscall is denied by seccomp, the process receives SIGSYS
```

## /proc/[pid]/syscall and /proc/[pid]/status

### /proc/[pid]/syscall

Shows the system call the process is currently executing:

```bash
cat /proc/12345/syscall
# 0 3 4096 7f1234567890 0 0 0 0 0 0
# Fields: syscall_number arg1 arg2 arg3 arg4 arg5 arg6

# Or more readably:
cat /proc/12345/sysinfo  # system-wide information
```

### /proc/[pid]/status

Human-readable process status:

```bash
cat /proc/12345/status
# Name:   nginx
# State:  S (sleeping)
# Tgid:   12345
# Pid:    12345
# PPid:   1000
# TracerPid:  0          # 0 = not being traced
# Uid:    0 0 0 0
# Gid:    0 0 0 0
# FDSize: 128            # Number of file descriptor slots allocated
# Threads:    4          # Number of threads
# SigPnd: 0000000000000000  # Signals pending for this thread
# ShdPnd: 0000000000000000  # Signals pending for process
# SigBlk: 0000000000010000  # Signals blocked
# SigIgn: 0000000000001000  # Signals ignored
# SigCgt: 0000000180000000  # Signals caught
# CapEff: 00000000a80425fb  # Effective capabilities
# CapPrm: 00000000a80425fb  # Permitted capabilities
# Voluntary_ctxt_switches:    12345
# Nonvoluntary_ctxt_switches:  6789
```

The context switch counts are valuable for diagnosing CPU contention. High voluntary context switches indicate a process that frequently yields (waiting on I/O or locks). High non-voluntary context switches indicate the process is being preempted by the scheduler (CPU contention).

### Process Capabilities

Linux capabilities divide the traditional root privilege into distinct units:

```bash
# View capabilities of a process
cat /proc/12345/status | grep Cap
# CapPrm: 00000000a80425fb  Permitted
# CapEff: 00000000a80425fb  Effective
# CapBnd: 0000003fffffffff  Bounding set
# CapAmb: 0000000000000000  Ambient

# Decode capabilities
capsh --decode=00000000a80425fb
# 0x00000000a80425fb=cap_chown,cap_dac_override,cap_fowner,cap_fsetid,cap_kill,cap_setgid,cap_setuid,cap_setpcap,cap_net_bind_service,cap_net_raw,cap_sys_chroot,cap_mknod,cap_audit_write,cap_setfcap

# Drop specific capabilities
# In systemd unit:
# CapabilityBoundingSet=CAP_NET_BIND_SERVICE CAP_SETUID CAP_SETGID
# AmbientCapabilities=CAP_NET_BIND_SERVICE

# Or use setcap on a binary
setcap cap_net_bind_service+ep /usr/bin/myapp
getcap /usr/bin/myapp
# /usr/bin/myapp cap_net_bind_service=ep
```

### Process Namespaces (via /proc)

Each process has namespace information visible in /proc:

```bash
# View namespace membership
ls -la /proc/12345/ns/
# lrwxrwxrwx 1 root root 0 ... cgroup -> 'cgroup:[4026531835]'
# lrwxrwxrwx 1 root root 0 ... ipc -> 'ipc:[4026531839]'
# lrwxrwxrwx 1 root root 0 ... mnt -> 'mnt:[4026531840]'
# lrwxrwxrwx 1 root root 0 ... net -> 'net:[4026531969]'
# lrwxrwxrwx 1 root root 0 ... pid -> 'pid:[4026531836]'
# lrwxrwxrwx 1 root root 0 ... user -> 'user:[4026531837]'
# lrwxrwxrwx 1 root root 0 ... uts -> 'uts:[4026531838]'

# Compare namespaces between processes
# If inode numbers differ, processes are in different namespaces
ls -la /proc/1/ns/pid /proc/12345/ns/pid
```

## Real Scenario: Debugging a Stuck Process with strace

### The Problem

A production web application started returning HTTP 504 Gateway Timeout errors. The application ran behind nginx, which was returning the timeout. The application process was still running (PID was alive) but not responding to requests.

### Investigation

```bash
# Step 1: Verify the process is alive
ps -p 12345 -o pid,stat,wchan,comm
# PID    STAT  WCHAN     COMMAND
# 12345  Sl    ep_poll   myapp
# Status S = sleeping, l = multi-threaded, wchan shows it is in epoll_wait

# Step 2: Check what the process is doing
cat /proc/12345/status | grep -E "Threads|voluntary"
# Threads:        32
# Voluntary_ctxt_switches:    567890
# Nonvoluntary_ctxt_switches:  1234
# High voluntary context switches — it is blocking somewhere

# Step 3: Attach strace to see what syscalls are in progress
strace -p 12345 -e trace=network,read,write -f
# Process 12345 attached with 32 threads
# --- SIGALRM {si_signo=SIGALRM, si_code=SI_KERNEL} ---
# epoll_wait(7, [{events=EPOLLIN, data={u32=5, u64=5}}], 128, -1) = 1
# recvfrom(5, "GET /api/data HTTP/1.1\r\nHost:..."..., 8192, 0, NULL, NULL) = 145
# write(5, "HTTP/1.1 200 OK\r\n..."..., 65536) = 65536
# recvfrom(5,  ← stuck here, waiting for client to send more data

# Step 4: Analyze the strace output
# The process read a request, wrote a response, then tried to read more
# from the same connection. The client has disconnected but the process
# does not know yet (TCP keepalive has not fired).

# Step 5: Check the number of connections
ss -tnp | grep 12345 | wc -l
# 234

# Many connections — some may be stale
ss -tnp | grep 12345 | awk '{print $1}' | sort | uniq -c
# ESTAB  200
# CLOSE-WAIT  34
# TIME-WAIT  0

# 34 connections in CLOSE-WAIT — the remote end closed but the app has not

# Step 6: Check strace on threads in CLOSE-WAIT
strace -p 12345 -e trace=close -f 2>&1 | head -5
# Not closing sockets — this is the bug
```

### Root Cause

The application had a bug in its connection handling code. When a client disconnected mid-request, the application wrote the response but did not close the socket. Over time, these stale connections accumulated. The application's thread pool of 32 threads was mostly blocked on `recvfrom()` for dead connections, leaving no threads available to handle new requests.

### Resolution

```bash
# Immediate: Restart the application
systemctl restart myapp

# Monitor for recurrence
while true; do
    CLOSE_WAIT=$(ss -tnp | grep myapp | grep -c CLOSE-WAIT)
    if [ "$CLOSE_WAIT" -gt 10 ]; then
        echo "ALERT: $CLOSE_WAIT CLOSE-WAIT connections on myapp"
    fi
    sleep 30
done
```

### Code Fix

The application needed to set TCP keepalive and implement read timeouts:

```python
# Python example
import socket
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPIDLE, 60)   # Start keepalive after 60s
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, 10)  # Send probe every 10s
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPCNT, 3)     # Drop after 3 failed probes
sock.settimeout(30)  # Read timeout of 30 seconds
```

### Lessons Learned

1. **Always set socket timeouts** — Never block indefinitely on network I/O
2. **Monitor CLOSE-WAIT connections** — They indicate application bugs
3. **strace reveals the truth** — Even when monitoring tools show the process is "alive"
4. **Thread pool exhaustion** — A few stuck connections can block the entire application
5. **TCP keepalive is not enough** — Default keepalive timeout is 2+ hours; set it shorter for application-level detection

## Assessment

### Lab Task 1: System Call Tracing (25 minutes)

1. Use strace to trace `ls -la /usr/bin/` and identify all filesystem-related syscalls
2. Count the number of `openat`, `read`, and `close` calls
3. Find the total time spent in `read` calls using strace `-c` (summary mode)
4. Compare the strace output to the actual file count — are they consistent?
5. Document the complete syscall sequence from open to close for a single file

**Grading**: Correct strace usage (20%), syscall counting (20%), timing analysis (20%), sequence documentation (20%), accuracy (20%)

### Lab Task 2: Debugging a Slow Process (25 minutes)

1. Write a script that takes 10 seconds to complete (use `sleep` or `dd`)
2. While it runs, attach strace with timing (`-T`)
3. Identify which syscall consumes the most time
4. Use `strace -c` to get a summary of syscall counts and times
5. Explain what the process was doing based on the strace output

**Grading**: Correct strace attachment (20%), timing identification (25%), summary analysis (25%), explanation (30%)

### Lab Task 3: Seccomp Filter (30 minutes)

1. Write a simple C program that reads a file and prints its contents
2. Use strace to identify all syscalls the program makes
3. Write a seccomp filter that allows only the necessary syscalls
4. Test the filter and verify the program still works
5. Test that blocked syscalls (e.g., `socket()`) are denied

**Grading**: Correct syscall identification (20%), working seccomp filter (30%), blocked syscall test (30%), documentation (20%)

### Lab Task 2: Process State Investigation (20 minutes)

1. Run `strace -e trace=network -p <PID>` on a network server process
2. Identify the pattern of read/write syscalls
3. Determine the request-response cycle timing
4. Find any syscalls that are taking longer than expected
5. Write recommendations for optimization based on findings

**Grading**: Correct strace usage (20%), pattern identification (25%), timing analysis (25%), recommendations (30%)

## Evidence

### System Call Understanding

Evidence of mastery includes:

- Using `strace -f -T` to trace child processes and identify time-consuming syscalls
- Interpreting strace output to diagnose stuck processes, slow I/O, and permission errors
- Understanding the user-to-kernel transition and the role of the syscall table
- Using `/proc/[pid]/syscall` to check what a process is currently doing without strace overhead
- Configuring seccomp filters to restrict syscall access for security
- Choosing between `read/write` and `mmap` based on access patterns and performance requirements
- Understanding `ioctl` as the catch-all for device-specific operations
- Reading `/proc/[pid]/status` to check thread count, context switches, and capability sets

### Key Diagnostic Commands

| Command | Purpose |
|---------|---------|
| `strace -p <PID>` | Trace system calls of running process |
| `strace -f -T <command>` | Trace with child processes and timing |
| `strace -c <command>` | Summary of syscall counts and times |
| `strace -e trace=<class>` | Filter by syscall class |
| `ltrace <command>` | Trace library calls (not syscalls) |
| `cat /proc/<PID>/syscall` | Current syscall (no overhead) |
| `cat /proc/<PID>/status` | Process status including context switches |
| `perf trace -p <PID>` | Low-overhead syscall tracing |
| `dmesg | grep seccomp` | View seccomp audit log |
| `readelf -s /lib/libc.so.6 \| grep -c " T "` | Count libc functions |

### Syscall Categories

Understanding syscall categories helps with strace filtering:

| Category | Syscalls | strace filter |
|----------|----------|---------------|
| File I/O | open, read, write, close, stat, fstat | `-e trace=file` |
| Network | socket, connect, send, recv, bind, listen | `-e trace=network` |
| Process | fork, exec, wait, kill, exit | `-e trace=process` |
| Memory | mmap, mprotect, brk, munmap | `-e trace=memory` |
| IPC | pipe, shmget, semget, msgget | `-e trace=ipc` |
| Signal | rt_sigaction, rt_sigprocmask, kill | `-e trace=signal` |
| System | reboot, sethostname, sysinfo | `-e trace=system` |