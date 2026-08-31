# Module 2 — Process Management

## Processes: The Fundamental Unit of Work

Every running program on a Linux system is a process. Understanding how processes work — how they are created, how they are scheduled, how they communicate, and how they die — is essential for debugging production systems. When a service hangs, when CPU utilization spikes, or when a server runs out of resources, the problem is almost always rooted in process behavior.

This module covers the Linux process model from the system call level up to the tools you use daily for diagnosis.

## Process States

A Linux process exists in one of five states, visible in the `STAT` column of `ps` output:

| State | Meaning | Common Cause |
|-------|---------|--------------|
| **R** (Running/Runnable) | Currently on CPU or ready to run | Normal execution, or stuck in CPU-bound loop |
| **S** (Sleeping/Interruptible) | Waiting for an event (I/O, signal, timer) | Most idle processes, waiting for network/disk |
| **D** (Uninterruptible Sleep) | Waiting for I/O with signals blocked | Disk I/O, NFS hangs, driver bugs |
| **Z** (Zombie) | Dead but entry not collected by parent | Parent not calling wait() |
| **T** (Stopped) | Suspended by signal | SIGSTOP, or debugger attached |

You can see these states with:

```bash
ps aux | awk '{print $8}' | sort | uniq -c | sort -rn
```

The **D state** (uninterruptible sleep) deserves special attention. When a process is in D state, it cannot be killed — not even with `kill -9`. This is by design: the kernel guarantees that I/O operations complete atomically. If a process is writing to disk and you could kill it mid-operation, the filesystem could be left in an inconsistent state.

The most common cause of widespread D state processes is an NFS server becoming unreachable. The NFS client waits indefinitely for the server to respond, and every process that touches an NFS-mounted path enters D state. The kernel parameter `intr` (or `soft` mount option) can make NFS operations interruptible, but this risks data corruption.

```bash
# Find processes in D state
ps aux | awk '$8 ~ /D/ {print $0}'

# Count D-state processes per second (watch for trends)
watch -n 1 'ps -eo state | grep -c D'
```

## Process Creation: fork() and exec()

Linux creates processes using the `fork()` system call. Unlike some operating systems that have separate "create" and "execute" primitives, Unix separates these into two distinct steps.

### fork()

When a process calls `fork()`, the kernel creates an exact copy of the calling process. The new process (child) gets its own:
- PID (process ID)
- Copy of the parent's address space (copy-on-write)
- File descriptor table (shared with parent)
- Signal handlers
- Scheduling priority

The key optimization is **copy-on-write (COW)**. Instead of immediately duplicating the entire address space, the kernel marks the pages as shared and read-only. Only when either process writes to a page does the kernel create a physical copy. This makes `fork()` nearly instantaneous for large processes.

After `fork()`, both parent and child continue executing from the point of the call. The return value distinguishes them:
- Parent receives the child's PID
- Child receives 0
- On error, -1 is returned

```c
pid_t pid = fork();
if (pid == 0) {
    // Child process
    exec("/bin/ls", args);
} else if (pid > 0) {
    // Parent process
    waitpid(pid, &status, 0);
} else {
    // fork() failed
    perror("fork");
}
```

### exec() Family

After `fork()`, the child typically calls one of the `exec()` family to replace its address space with a new program:

- `execl(path, arg0, arg1, ..., NULL)` — arguments as list
- `execv(path, argv[])` — arguments as array
- `execle(path, arg0, ..., NULL, envp[])` — with environment
- `execve(path, argv[], envp[])` — the actual syscall (all others are wrappers)
- `execlp(file, arg0, ..., NULL)` — searches PATH
- `execvp(file, argv[])` — searches PATH

The `execve()` syscall is the only one that actually enters the kernel. The others are library wrappers that eventually call `execve()`.

### vfork() and clone()

`vfork()` is an optimization that shares the parent's address space without COW. The parent is suspended until the child calls `exec()` or `_exit()`. This is dangerous if the child modifies memory and is rarely used directly — `posix_spawn()` is preferred.

`clone()` is the low-level syscall used to create threads. Unlike `fork()`, `clone()` lets you specify exactly which resources are shared between parent and child:

```c
clone(child_fn, stack_ptr, CLONE_VM | CLONE_FS | CLONE_FILES, NULL);
```

- `CLONE_VM` — share address space (threads)
- `CLONE_FS` — share filesystem info
- `CLONE_FILES` — share file descriptor table
- `CLONE_NEWNS` — create new mount namespace (containers)
- `CLONE_NEWPID` — create new PID namespace (containers)

The `pthread_create()` library function uses `clone()` internally with the appropriate flags for POSIX threads.

## Process Termination and wait()

When a process finishes (either by calling `exit()` or being killed), it does not immediately disappear. It enters the **Zombie** state, retaining its exit status and resource usage information. The parent must call `wait()` or `waitpid()` to collect this information.

```c
int status;
pid_t child = waitpid(-1, &status, WNOHANG);  // Non-blocking
if (child > 0) {
    if (WIFEXITED(status)) {
        printf("Child %d exited with status %d\n", child, WEXITSTATUS(status));
    } else if (WIFSIGNALED(status)) {
        printf("Child %d killed by signal %d\n", child, WTERMSIG(status));
    }
}
```

If the parent dies before calling `wait()`, the child becomes an orphan and is adopted by `init` (PID 1) or `systemd`, which calls `wait()` promptly. This is why zombie processes are usually temporary.

A **zombie epidemic** occurs when a parent process has a bug in its `wait()` logic — it either never calls `wait()`, or only calls it sporadically. Each child that exits becomes a zombie, consuming a PID and a process table entry. Eventually the system runs out of PIDs.

```bash
# Find zombie processes
ps aux | awk '$8 == "Z"'

# Find which parent has zombies (PPID column)
ps -eo pid,ppid,stat,comm | awk '$3 == "Z"'

# Find the parent process details
ps -p <PPID> -o pid,ppid,comm,args
```

The only way to clear zombies is to either fix the parent so it calls `wait()`, or kill the parent (which causes zombies to be re-parented to init/systemd, which collects them immediately).

## Process Scheduling: CFS

Linux uses the **Completely Fair Scheduler (CFS)** for normal processes. CFS is based on the concept of virtual runtime — each process gets a share of CPU time proportional to its weight (determined by nice value).

### Nice Values

The nice value ranges from -20 (highest priority) to +19 (lowest priority). The default is 0. Nice values affect the weight of a process in CFS scheduling:

```bash
# Set nice value at launch
nice -n -10 ./my_program

# Change nice value of running process
renice -n -10 -p <PID>

# View nice values
ps -eo pid,ni,comm
```

The relationship between nice value and weight is:

| Nice | Weight | CPU Share (approx) |
|------|--------|---------------------|
| -20 | 88761 | 88x baseline |
| -10 | 11817 | 12x baseline |
| 0 | 1024 | 1x baseline |
| 10 | 128 | 1/8x baseline |
| 19 | 15 | 1/68x baseline |

### Real-Time Scheduling

Linux supports two real-time scheduling policies:

- **SCHED_FIFO** — First-in, first-out. The process runs until it voluntarily yields or is preempted by a higher-priority real-time process. No time slicing.
- **SCHED_RR** — Round-robin. Same as FIFO but with time slicing among processes at the same priority level.

Real-time priorities range from 1 to 99. These processes always preempt normal CFS processes. Misconfigured real-time processes can starve the entire system:

```bash
# Set real-time priority
chrt -f 50 ./my_realtime_program

# View scheduling policies
chrt -p <PID>
```

A common mistake: running a real-time process that spins on CPU without yielding. This will lock up the system because the scheduler cannot take the CPU away from it. Always use `SCHED_DEADLINE` or at minimum set a CPU affinity limit with `taskset`:

```bash
# Pin to CPU 0 and set real-time priority
taskset -c 0 chrt -f 50 ./my_program
```

### cgroups and CPU Control

For production systems, cgroups provide more granular CPU control than nice values. With cgroups v2:

```bash
# Create a CPU-limited cgroup
echo "+cpu +cpuset +io" > /sys/fs/cgroup/mygroup/cgroup.subtree_control
echo "50000 100000" > /sys/fs/cgroup/mygroup/mygroup.cpu.max  # 50% of one CPU
echo <PID> > /sys/fs/cgroup/mygroup/mygroup.cgroup.procs
```

Or with systemd:

```bash
systemd-run --scope -p CPUQuota=50% -p MemoryMax=1G /usr/bin/my_service
```

## The /proc Filesystem

The `/proc` filesystem is a virtual filesystem that provides a window into kernel data structures. Every process has a directory `/proc/[pid]/` containing:

```bash
ls /proc/self/
# cmdline  environ  fd/  maps  stat  status  ...
```

### Key Files

**/proc/[pid]/stat** — Machine-readable process status. One line with 44 fields separated by spaces. Field 1 is PID, field 2 is command name (in parentheses), field 3 is state character.

**/proc/[pid]/status** — Human-readable version of stat. Key fields:

```
Name:   bash
State:  S (sleeping)
Pid:    1234
PPid:   1000
Threads: 1
VmSize: 12345 kB
VmRSS:  8901 kB
```

**/proc/[pid]/cmdline** — The command line arguments, null-separated. Use `cat -v /proc/[pid]/cmdline | tr '\0' ' '` to read it.

**/proc/[pid]/environ** — The environment variables, null-separated.

**/proc/[pid]/fd/** — Directory of open file descriptors. Each entry is a symlink to the actual file/socket/pipe:

```bash
ls -la /proc/1234/fd/
# lrwx------ 1 root root 64 ... 0 -> /var/log/syslog
# lrwx------ 1 root root 64 ... 1 -> pipe:[12345]
# lrwx------ 1 root root 64 ... 3 -> socket:[12346]
```

**/proc/[pid]/maps** — Memory mapping. Shows which parts of the address space are mapped to which files:

```bash
cat /proc/1234/maps
# address           perms offset  dev   inode   pathname
# 00400000-00452000 r-xp 00000000 08:01 131074  /bin/bash
# 7f123000-7f156000 r-xp 00000000 08:01 262145  /lib/x86_64-linux-gnu/libc.so.6
```

**/proc/[pid]/io** — I/O statistics:

```
rchar: 1234567      # bytes read (including cache)
wchar: 890123       # bytes written
read_bytes: 100000  # actual disk reads
write_bytes: 50000  # actual disk writes
```

**/proc/[pid]/limits** — Resource limits (open files, memory, CPU time, etc.)

**/proc/[pid]/oom_score** — The OOM killer score for this process. Higher = more likely to be killed.

## Process Groups and Sessions

A **process group** is a collection of processes that share the same process group ID (PGID). A **session** is a collection of process groups that share a controlling terminal.

When you run `bash -c "cat file | grep pattern | wc -l"`, the shell creates a pipeline of three processes, all in the same process group. The shell is the **process group leader**.

```bash
# View process groups
ps -eo pid,pgid,sid,comm | head -20

# Create a process group
setsid bash   # New session, new process group
```

Process groups matter for signal delivery. When you press Ctrl+C in a terminal, the SIGINT is sent to all processes in the foreground process group — not just the current process. This is why all three processes in a pipeline receive the signal.

Sessions matter for job control. Each terminal emulator creates a new session. Background jobs (`&`) are placed in their own process groups within the session.

## Signals

Signals are the primary inter-process communication mechanism for process control. A signal is a one-bit notification — either the signal exists or it does not. There is no queue of signals; if a signal is sent twice before it is handled, only one is delivered.

### Signal Delivery

When a signal is sent to a process (via `kill()`, a terminal action, or a kernel event), the signal is marked as pending. Before returning to user space, the kernel checks for pending signals and delivers them according to the process's signal disposition:

1. **Ignore** (`SIG_IGN`) — Signal is discarded. Exception: `SIGKILL` and `SIGSTOP` cannot be ignored.
2. **Default** (`SIG_DFL`) — Depends on the signal. Most terminate the process. `SIGCHLD` is ignored by default.
3. **Handler** — A user-defined function registered with `sigaction()`:

```c
void handler(int sig) {
    printf("Caught signal %d\n", sig);
}

struct sigaction sa;
sa.sa_handler = handler;
sa.sa_flags = 0;
sigemptyset(&sa.sa_mask);
sigaction(SIGINT, &sa, NULL);
```

### Common Signals

| Signal | Number | Default | Purpose |
|--------|--------|---------|---------|
| SIGHUP | 1 | Terminate | Hangup (terminal disconnect) |
| SIGINT | 2 | Terminate | Interrupt (Ctrl+C) |
| SIGQUIT | 3 | Core dump | Quit (Ctrl+\) |
| SIGKILL | 9 | Terminate | Force kill (uncatchable) |
| SIGSEGV | 11 | Core dump | Segmentation fault |
| SIGTERM | 15 | Terminate | Graceful termination |
| SIGCHLD | 20 | Ignore | Child exited |
| SIGSTOP | 19 | Stop | Force stop (uncatchable) |
| SIGCONT | 18 | Continue | Continue stopped process |
| SIGUSR1 | 10 | Terminate | User-defined #1 |
| SIGUSR2 | 12 | Terminate | User-defined #2 |

### Signal Masking

You can block signals from being delivered using `sigprocmask()`:

```c
sigset_t mask;
sigemptyset(&mask);
sigaddset(&mask, SIGINT);
sigprocmask(SIG_BLOCK, &mask, NULL);
// SIGINT is now blocked
// ... critical section ...
sigprocmask(SIG_UNBLOCK, &mask, NULL);
```

The `SA_RESTART` flag in `sigaction()` causes certain system calls to be automatically restarted after a signal handler returns. Without it, a system call interrupted by a signal returns `EINTR`.

### Signal Practical Debugging

```bash
# Send signal to a process
kill -TERM <PID>      # Graceful shutdown
kill -HUP <PID>       # Reload configuration (convention)
kill -USR1 <PID>      # Application-defined action
kill -9 <PID>         # Force kill (last resort)

# Send signal to all processes in a process group
kill -TERM -<PGID>

# Send signal by name
killall -TERM nginx
pkill -f "my_program.*arg"
```

### Process Priority and Scheduling

The Linux scheduler provides multiple scheduling policies for different workload types:

**Normal processes (SCHED_OTHER/SCHED_NORMAL):**
The default time-sharing policy. CFS provides fair CPU allocation based on nice values. Every normal process uses this unless explicitly changed.

**Batch processes (SCHED_BATCH):**
Designed for CPU-intensive, non-interactive workloads. The scheduler assumes these processes will use their full time slice and schedules them accordingly, reducing unnecessary preemption.

**Idle processes (SCHED_IDLE):**
The lowest priority scheduling policy. Only runs when no other process needs the CPU. Useful for background maintenance tasks.

**Real-time processes (SCHED_FIFO/SCHED_RR):**
Guaranteed CPU time. Real-time processes always preempt normal processes. SCHED_FIFO runs until it yields; SCHED_RR timeslices among processes at the same priority.

```bash
# View scheduling policy
chrt -p <PID>
# pid 1234's current scheduling policy: SCHED_OTHER
# pid 1234's current scheduling priority: 0

# Set to batch processing
chrt -b 0 <PID>

# Set to SCHED_FIFO with priority 50
chrt -f 50 ./my_realtime_app

# Check scheduling statistics
cat /proc/<PID>/sched
# my_program (1234, #threads: 1)
# ---------------------------------------------------
# se.exec_start                        :     12345678.901234
# se.vruntime                          :         12345.678901
# se.sum_exec_runtime                  :          5678.901234
# nr_switches                          :              12345
# nr_voluntary_switches                :              10000
# nr_involuntary_switches              :               2345
```

### Process Resource Limits

Each process has resource limits set by the kernel. These can be viewed and modified:

```bash
# View limits for a process
cat /proc/<PID>/limits
# Limit                     Soft Limit           Hard Limit           Units
# Max cpu time              unlimited            unlimited            seconds
# Max file size             unlimited            unlimited            bytes
# Max data size             unlimited            unlimited            bytes
# Max stack size            8388608              unlimited            bytes
# Max core file size        0                    unlimited            bytes
# Max resident set          unlimited            unlimited            bytes
# Max open files            1024                 1048576              files
# Max locked memory         67108864             67108864             bytes
# Max address space         unlimited            unlimited            bytes
# Max file locks            unlimited            unlimited            locks
# Max pending signals       123456               123456               signals
# Max msgqueue size         819200               819200               bytes
# Max nice priority         0                    0
# Max realtime priority     0                    0
# Max realtime timeout      unlimited            unlimited            us

# Set limits with ulimit
ulimit -n 4096        # Set max open files for current shell
ulimit -u 1024        # Set max user processes

# Set limits for a service in systemd
# /etc/systemd/system/myapp.service.d/limits.conf
[Service]
LimitNOFILE=65535
LimitNPROC=4096
LimitCORE=infinity
LimitMEMLOCK=64M
```

## Real Scenario: Zombie Process Epidemic

### The Problem

A batch processing server running a custom ETL (Extract, Transform, Load) application started accumulating zombie processes. Within 24 hours, `ps` showed over 30,000 zombie processes. The system was still responsive but new process creation was slowing down because the process table was filling up.

### Investigation

```bash
# Count zombies
ps aux | awk '$8 == "Z"' | wc -l
# 31,847

# Find the parent of all zombies
ps aux | awk '$8 == "Z" {print $4}' | sort | uniq -c | sort -rn | head
# 31847 12345

# Check what process 12345 is
ps -p 12345 -o pid,ppid,comm,args
# PID    PPID   COMMAND  ARGS
# 12345  1      etl-app  /opt/etl/bin/etl-app --config /etc/etl/prod.conf
```

The ETL application was the parent of all zombies. Examining `/proc/12345/fd/` showed 31,847 open file descriptors — all pipes to zombie child processes.

### Root Cause

Reading the application source revealed the bug. The ETL app forked child processes to handle individual data transformations. The parent registered a `SIGCHLD` handler but the handler was defined without `SA_RESTART` and used `waitpid()` with `WNOHANG`:

```c
// BUGGY CODE
void sigchld_handler(int sig) {
    while (waitpid(-1, NULL, WNOHANG) > 0) {
        // collect children
    }
}
```

The problem: when the handler was called while the parent was in a blocking system call (reading from a message queue), the `waitpid()` loop ran but did not collect all zombies. Some children exited between handler invocations and were never collected.

### Resolution

The fix had two parts:

1. Changed the signal handler to use `SA_RESTART` and `waitid()`:

```c
void sigchld_handler(int sig) {
    while (waitid(P_ALL, 0, NULL, WNOHANG | WEXITED) == 0) {
        // keep collecting until no more zombies
    }
}

struct sigaction sa;
sa.sa_handler = sigchld_handler;
sa.sa_flags = SA_RESTART | SA_NOCLDSTOP;
sigaction(SIGCHLD, &sa, NULL);
```

2. Added a periodic cleanup thread that collected any straggler zombies:

```c
void *cleanup_thread(void *arg) {
    while (running) {
        while (waitid(P_ALL, 0, NULL, WNOHANG | WEXITED) == 0) {
            // collect all zombies
        }
        sleep(5);
    }
    return NULL;
}
```

### Immediate Recovery (Without Restarting)

To deal with the existing zombies without restarting the application:

```bash
# Option 1: Send SIGCHLD to force collection
kill -SIGCHLD 12345

# Option 2: Reparent zombies to init (if parent is unrecoverable)
# Only works if parent can be killed
kill -TERM 12345  # Graceful shutdown
# Zombies are reparented to PID 1, which collects them

# Option 3: Use prctl to set child subreaper
prctl(PR_SET_CHILD_SUBREAPER, 1)  # for new processes
```

### Prevention

```bash
# Monitor zombie count
cat << 'EOF' > /usr/local/bin/check-zombies.sh
#!/bin/bash
ZOMBIE_COUNT=$(ps -eo state | grep -c Z)
if [ "$ZOMBIE_COUNT" -gt 100 ]; then
    echo "WARNING: $ZOMBIE_COUNT zombie processes detected"
    ps -eo pid,ppid,stat,comm | awk '$3 == "Z"'
    # Send alert
fi
EOF
chmod +x /usr/local/bin/check-zombies.sh
```

Add to cron to run every 5 minutes:

```bash
*/5 * * * * /usr/local/bin/check-zombies.sh | mail -s "Zombie Alert" admin@example.com
```

## Assessment

### Lab Task 1: Process State Investigation (20 minutes)

1. Identify all processes in D (uninterruptible sleep) state on the system
2. For each D-state process, determine what I/O operation it is waiting on by examining `/proc/[pid]/wchan` and `/proc/[pid]/stack`
3. Write a one-sentence explanation for each D-state process explaining what it is waiting for
4. If no D-state processes exist, create one by running `dd if=/dev/sda of=/dev/null bs=1M` on a busy disk and observing it

**Grading**: Correct identification (30%), correct I/O wait analysis (40%), clear explanation (30%)

### Lab Task 2: Fork and Zombie Creation (30 minutes)

1. Write a C program that forks 100 child processes, has each child exit immediately after a random sleep (0-2 seconds), but the parent never calls `wait()`
2. Compile and run the program
3. Observe zombie accumulation using `ps`
4. Write a second version that properly collects all children
5. Verify no zombies remain after the corrected version exits

**Grading**: Correct fork/exec/wait implementation (40%), zombie demonstration (20%), correct cleanup (30%), verification (10%)

### Lab Task 3: Signal Handling (20 minutes)

1. Write a program that blocks SIGINT for 5 seconds, then unblocks it
2. During the blocked period, send SIGINT to the program 3 times
3. Demonstrate that only one SIGINT is delivered after unblocking (signals are not queued)
4. Modify the program to use `sigpending()` to check for pending signals before unblocking

**Grading**: Correct blocking behavior (40%), correct pending signal detection (30%), demonstration of non-queueing (30%)

### Lab Task 4: Process Priority Manipulation (20 minutes)

1. Launch two CPU-bound programs (e.g., `yes > /dev/null`)
2. Set one to nice value -10 and the other to nice value 10
3. Observe CPU distribution using `top` or `mpstat`
4. Change the priority of the low-priority process to match the high-priority one
5. Verify CPU distribution changes accordingly

**Grading**: Correct nice value setting (25%), observable CPU difference (25%), priority change (25%), documentation with screenshots or output (25%)

## Evidence

### Process Model Understanding

Evidence of mastery includes:

- Ability to read `/proc/[pid]/stat` and interpret all 44 fields
- Using `strace -f` to trace fork/clone/exec system calls and understanding the output
- Interpreting `ps` STAT column flags (Ss, Sl, S+, Z+, etc.) to identify process state, session membership, and multi-threading
- Using `pstree` to visualize process hierarchies and identify orphans/zombies
- Understanding copy-on-write fork semantics and when COW faults occur
- Calculating the PID exhaustion point based on `/proc/sys/kernel/pid_max` and current usage

### Key Diagnostic Commands

| Command | Purpose |
|---------|---------|
| `ps -eo pid,ppid,pgid,sid,stat,comm` | Process hierarchy and state |
| `ps -eo pid,wchan,comm` | What each process is waiting on |
| `cat /proc/<pid>/stack` | Kernel stack of a process (what syscalls are in progress) |
| `strace -p <pid>` | Trace system calls of a running process |
| `strace -f <command>` | Trace fork/exec of a command |
| `lsof -p <pid>` | Open files and sockets |
| `top -H -p <pid>` | Thread-level CPU usage |
| `kill -l` | List all signals |

### Process State Transitions

Understanding the state diagram helps diagnose issues:

```
fork() → R (Ready/Running) → Running on CPU
  ↓
sleep()/pause()/wait() → S (Sleeping) → waiting for event
  ↓ (event occurs)
S → R → Running again
  ↓
exit() → Z (Zombie) → parent calls wait() → removed from table
  ↓
SIGSTOP → T (Stopped) → SIGCONT → R (Running)
  ↓
I/O wait (uninterruptible) → D (Disk sleep) → I/O completes → S → R
```

The only way to remove a D-state process is to wait for the I/O to complete. If the I/O never completes (e.g., NFS server is permanently down), the only option is to reboot. This is why production NFS mounts should always use the `soft,timeo=N` mount options or have a robust timeout configuration.