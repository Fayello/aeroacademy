import { PrismaClient } from '@prisma/client';

export async function seedLinuxCoursesPart3(prisma: PrismaClient, labs: any[]) {
  const kernelLab = labs[8];
  const dockerLab = labs[9];

  async function createCourse(title: string, description: string, sectionsData: any[]) {
    const course = await prisma.course.create({
      data: {
        title, description,
        sections: {
          create: sectionsData.map(s => ({
            title: s.title, order: s.order,
            lessons: {
              create: s.lessons.map((les: any) => ({
                title: les.title, order: les.order, labId: les.labId, content: les.content,
              })),
            },
          })),
        },
      },
    });
    const allLessons = await prisma.lesson.findMany({ where: { section: { courseId: course.id } } });
    for (const lesson of allLessons) {
      const sectionData = sectionsData.find((s: any) => s.lessons.some((l: any) => l.title === lesson.title));
      const lessonData = sectionData?.lessons.find((l: any) => l.title === lesson.title);
      if (lessonData && lessonData.questions.length > 0) {
        await prisma.quiz.create({
          data: {
            lessonId: lesson.id,
            questions: { create: lessonData.questions.map((q: any) => ({ text: q.text, answers: { create: q.answers } })) },
          },
        });
      }
    }
    return course;
  }

  // ═══════════════════════════════════════════════════════════════════
  // COURSE 5: Linux Kernel & System Internals
  // ═══════════════════════════════════════════════════════════════════

  await createCourse(
    'Linux Kernel & System Internals',
    'Dive deep into the heart of the Linux operating system. This course covers kernel architecture, process and memory management, kernel modules, performance tuning, sysctl parameters, system call tracing, and container internals including namespaces and cgroups.',
    [
      // ─── SECTION 1: Kernel Architecture ───
      {
        title: 'Kernel Architecture', order: 1,
        lessons: [
          {
            title: 'Kernel Space vs User Space', order: 1, labId: kernelLab?.id,
            content: `# Kernel Space vs User Space

### Learning Objectives
- Understand the fundamental division between kernel space and user space in Linux
- Explain the role of system calls as the interface between the two domains
- Identify Ring 0 and Ring 3 privilege levels on x86 architectures
- Recognize the security implications of this separation

### Section 1: What Are Kernel Space and User Space?

Every modern operating system divides execution into two distinct domains: **kernel space** and **user space**. This separation is enforced by the CPU hardware through privilege levels called **rings**.

On x86 and x86-64 processors, there are four rings (Ring 0 through Ring 3). Linux uses only two:

| Ring | Domain | Privileges |
|------|--------|------------|
| Ring 0 | Kernel Space | Full access to hardware, memory, and CPU instructions |
| Ring 3 | User Space | Restricted access; must request kernel assistance via system calls |

**Kernel space** is where the kernel itself executes. The kernel has unrestricted access to all hardware, can access any memory address, and can execute any CPU instruction. Device drivers, the memory manager, the scheduler, and the network stack all run in kernel space.

**User space** is where all application code runs -- from your bash shell to Firefox to nginx. Applications in user space cannot directly access hardware or other processes' memory. When an application needs to perform a privileged operation (reading a file, sending network packets, allocating memory), it must make a **system call** to request the kernel's help.

### Section 2: System Calls -- The Bridge Between Worlds

A system call (syscall) is the mechanism by which user-space programs request services from the kernel. When a program calls a function like \`open()\`, \`read()\`, or \`write()\`, the CPU switches from Ring 3 to Ring 0, the kernel executes the requested operation, and then control returns to the user-space program.

The Linux kernel exposes system calls through the \`syscall\` instruction on x86-64. Each system call has a unique number:

\`\`\`bash
# Common system call numbers (x86-64):
# 0  = read      # 1  = write     # 2  = open
# 3  = close     # 9  = mmap      # 39 = getpid
# 56 = clone     # 57 = fork      # 59 = execve
\`\`\`

When you run \`strace\` on a program, you can see every system call it makes:

\`\`\`bash
strace ls /tmp
# execve("/usr/bin/ls", ["ls", "/tmp"], 0x7ffc...) = 0
# brk(NULL)                               = 0x55a...
# openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY) = 3
# read(3, "\\177ELF...", 832)              = 832
# write(1, "file1.txt  file2.txt\\n", 21)  = 21
# close(3)                                = 0
\`\`\`

### Section 3: Memory Protection

One of the most critical functions of the kernel/user space separation is **memory protection**. Each process gets its own virtual address space, managed by the kernel using the CPU's Memory Management Unit (MMU).

Key memory protection features:

| Feature | Description |
|---------|-------------|
| **Virtual Memory** | Each process sees a private, contiguous address space mapped to physical RAM by the kernel |
| **Page Tables** | Data structures mapping virtual addresses to physical addresses, maintained per-process |
| **ASLR** | Address Space Layout Randomization randomizes memory locations to prevent exploitation |
| **NX Bit** | The No-Execute bit marks memory regions as non-executable, preventing code injection |
| **Stack Canaries** | Sentinel values on the stack to detect buffer overflow attacks |

You can inspect a process's memory map:

\`\`\`bash
cat /proc/self/maps
# 55a123400000-55a123401000 r--p 00000000 08:01 12345  /usr/bin/bash
# 7f1234000000-7f1234020000 r-xp 00000000 08:01 67890  /lib/x86_64-linux-gnu/libc.so.6
\`\`\`

### Section 4: The /proc Virtual Filesystem

The kernel exposes internal data structures through the \`/proc\` virtual filesystem. Files in \`/proc\` do not exist on disk -- they are generated on-the-fly by the kernel:

\`\`\`bash
/proc/cpuinfo    # CPU information
/proc/meminfo    # Memory usage statistics
/proc/version    # Kernel version string
/proc/sys/       # Kernel parameters (readable and writable)
/proc/<pid>/     # Per-process information
/proc/<pid>/cmdline    # Command that started the process
/proc/<pid>/fd/        # Open file descriptors
/proc/<pid>/maps       # Memory map
\`\`\`

The \`/proc/sys\` directory provides a writable interface to kernel parameters:

\`\`\`bash
cat /proc/sys/fs/file-max          # Max number of open files
echo "myserver" > /proc/sys/kernel/hostname  # Change hostname
echo 1 > /proc/sys/net/ipv4/ip_forward       # Enable IP forwarding
\`\`\`

### Section 5: Context Switching

When the kernel switches from one process to another, it performs a **context switch** -- saving the CPU state of the outgoing process and restoring the state of the incoming process.

Context switches are expensive. Each involves:
1. Saving the current process state to its kernel stack
2. Updating page tables if switching to a different process
3. Flushing the Translation Lookaside Buffer (TLB) if needed
4. Loading the new process state

Monitor context switches:

\`\`\`bash
ps -o pid,voluntary_ctx_switches,nonvoluntary_ctx_switches -p $$
vmstat 1   # The 'cs' column shows context switches per second
\`\`\`

### Hands-On Practice

1. Run \`strace ls\` and count the system calls needed to list a directory
2. Compare \`/proc/self/maps\` before and after running a large program
3. Use \`watch -n1 cat /proc/stat\` to observe context switches in real time
4. Run \`cat /proc/version\` to see your kernel version and compiler

### Key Takeaways
- Kernel space (Ring 0) has full hardware access; user space (Ring 3) is restricted
- System calls are the only way for user-space programs to access kernel services
- The kernel provides memory isolation between processes via virtual memory
- The \`/proc\` filesystem exposes kernel internals as readable files
- Context switches between processes are costly operations managed by the kernel

### References & Further Reading
**Textbooks:**
1. "Understanding the Linux Kernel, 3rd Edition" by Daniel P. Bovet & Marco Cesati -- Chapter 1: Introduction, pages 1-35
2. "Linux Kernel Development, 3rd Edition" by Robert Love -- Chapter 2: Getting Started with the Kernel, pages 15-40
3. "How Linux Works, 3rd Edition" by Brian Ward -- Chapter 4: Inside the Kernel, pages 85-120

**Online Resources:**
1. [Linux man pages -- syscall(2)](https://man7.org/linux/man-pages/man2/syscall.2.html)
2. [The /proc Filesystem -- Kernel documentation](https://www.kernel.org/doc/Documentation/filesystems/proc.rst)
3. [Understanding Linux System Calls -- IBM Developer](https://developer.ibm.com/tutorials/l-linux-system-calls/)`,
            questions: [
              { text: 'Which CPU privilege level does the Linux kernel operate in?', answers: [{ text: 'Ring 0', isCorrect: true }, { text: 'Ring 1', isCorrect: false }, { text: 'Ring 2', isCorrect: false }, { text: 'Ring 3', isCorrect: false }] },
              { text: 'What is the mechanism called when a user-space program requests a kernel service?', answers: [{ text: 'System call', isCorrect: true }, { text: 'Interrupt', isCorrect: false }, { text: 'Signal', isCorrect: false }, { text: 'Trap', isCorrect: false }] },
              { text: 'Which virtual filesystem exposes kernel parameters that can be modified at runtime?', answers: [{ text: '/proc/sys', isCorrect: true }, { text: '/dev', isCorrect: false }, { text: '/sys/block', isCorrect: false }, { text: '/etc/proc', isCorrect: false }] },
              { text: 'What does ASLR protect against?', answers: [{ text: 'Exploitation of known memory addresses', isCorrect: true }, { text: 'Buffer overflows in the heap', isCorrect: false }, { text: 'Denial of service attacks', isCorrect: false }, { text: 'Man-in-the-middle attacks', isCorrect: false }] },
              { text: 'Which command shows every system call made by a program?', answers: [{ text: 'strace', isCorrect: true }, { text: 'ltrace', isCorrect: false }, { text: 'top', isCorrect: false }, { text: 'nmap', isCorrect: false }] },
              { text: 'What is a context switch?', answers: [{ text: 'The kernel saving one process state and loading another', isCorrect: true }, { text: 'Switching from user mode to kernel mode', isCorrect: false }, { text: 'Changing the active terminal session', isCorrect: false }, { text: 'Reloading kernel modules', isCorrect: false }] },
              { text: 'Which /proc entry contains detailed memory usage statistics?', answers: [{ text: '/proc/meminfo', isCorrect: true }, { text: '/proc/cpuinfo', isCorrect: false }, { text: '/proc/loadavg', isCorrect: false }, { text: '/proc/vmstat', isCorrect: false }] },
              { text: 'What does the NX bit in page tables do?', answers: [{ text: 'Marks memory as non-executable to prevent code injection', isCorrect: true }, { text: 'Disables caching for that page', isCorrect: false }, { text: 'Marks the page as read-only', isCorrect: false }, { text: 'Reserves the page for kernel use only', isCorrect: false }] },
            ],
          },


          {
            title: 'Process Management Deep Dive', order: 2,
            content: `# Process Management Deep Dive

### Learning Objectives
- Understand how Linux creates, schedules, and terminates processes
- Master the fork/exec model for process creation
- Analyze process states and the process lifecycle
- Use tools like ps, top, and /proc to inspect process details

### Section 1: The Process Model

A **process** is an instance of a running program. Every process in Linux has a unique Process ID (PID), a parent process (PPID), its own virtual address space, file descriptors, signal handlers, and security context.

The kernel stores process information in a **task_struct** structure (the Process Control Block):

| Field | Description |
|-------|-------------|
| pid | Unique process identifier |
| tgid | Thread group ID (main thread's PID) |
| state | Current process state (Running, Sleeping, Stopped, Zombie) |
| mm_struct | Memory management information (page tables, segments) |
| files | Open file descriptors |
| signal | Pending signals and signal handlers |
| cred | User/group IDs and capabilities |
| fs | Current working directory and root directory |
| ns | Namespace information (for containers) |

### Section 2: The fork/exec Model

Linux creates new processes using the **fork/exec** model:

1. **fork()** -- Creates an exact copy of the calling process. The child gets a duplicate of the parent's address space, file descriptors, and resources.
2. **exec()** -- Replaces the current process image with a new program. The process retains its PID but its memory and code are replaced.

\`\`\`bash
# Demonstrate fork/exec with strace
strace -f -e trace=process bash -c 'ls'
# clone(...) = 12345        # fork creates child process
# execve("/usr/bin/ls", ...) = 0  # child replaces itself with ls
\`\`\`

Here is a simple demonstration in C:

\`\`\`c
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main() {
    pid_t pid = fork();
    if (pid == 0) {
        printf("Child PID: %d, Parent PID: %d\\n", getpid(), getppid());
        execlp("ls", "ls", "-la", "/tmp", NULL);
        perror("exec failed");
    } else if (pid > 0) {
        printf("Parent PID: %d, Child PID: %d\\n", getpid(), pid);
        wait(NULL);
    } else {
        perror("fork failed");
    }
    return 0;
}
\`\`\`

### Section 3: Process States

Every process in Linux is in one of these states:

| State | Description |
|-------|-------------|
| **Running (R)** | Currently executing on a CPU or ready to run in the run queue |
| **Sleeping (S)** | Interruptible sleep -- waiting for an event (I/O, signal, timer) |
| **Disk Sleep (D)** | Uninterruptible sleep -- waiting for disk I/O. Cannot be killed. |
| **Stopped (T)** | Suspended by a signal (SIGSTOP) or debugger (SIGTSTP) |
| **Zombie (Z)** | Process has exited but parent has not yet called wait() |
| **Traced (t)** | Being traced by a debugger (ptrace) |

\`\`\`bash
ps aux | awk '{print $8}' | sort | uniq -c | sort -rn

# STAT column details:
# R=Running  S=Sleeping  D=Disk sleep  Z=Zombie  T=Stopped
# s=Session leader  +=Foreground  <=High priority  N=Low priority
\`\`\`

### Section 4: Process Priorities and Scheduling

Linux uses the **Completely Fair Scheduler (CFS)** by default. The **nice value** ranges from -20 (highest priority) to +19 (lowest priority):

\`\`\`bash
nice -n -10 ./my_program        # Start with high priority
renice -5 -p 1234               # Change priority of running process
ps -eo pid,ni,comm | head -20   # View nice values

# Real-time scheduling policies:
# SCHED_FIFO  - First-in, first-out real-time
# SCHED_RR    - Round-robin real-time
# SCHED_BATCH - Batch processing
# SCHED_IDLE  - Very low priority
\`\`\`

### Section 5: /proc/<pid> Deep Dive

\`\`\`bash
PID=1
cat /proc/$PID/cmdline | tr '\\0' ' '   # Command line
cat /proc/$PID/status                    # Status summary
cat /proc/$PID/environ | tr '\\0' '\\n'   # Environment variables
ls -la /proc/$PID/fd                     # Open file descriptors
cat /proc/$PID/maps                      # Memory maps
ls -la /proc/$PID/cwd                    # Current working directory
\`\`\`

### Section 6: Signals

| Signal | Number | Default Action | Description |
|--------|--------|----------------|-------------|
| SIGHUP | 1 | Terminate | Hangup -- often used to reload configuration |
| SIGINT | 2 | Terminate | Interrupt (Ctrl+C) |
| SIGKILL | 9 | Terminate | Forceful kill -- cannot be caught or ignored |
| SIGTERM | 15 | Terminate | Graceful termination -- the default kill signal |
| SIGSTOP | 19 | Stop | Pause process -- cannot be caught or ignored |
| SIGCONT | 18 | Continue | Resume a stopped process |

\`\`\`bash
kill -SIGTERM 1234     # Graceful shutdown
kill -9 1234           # Forceful kill (SIGKILL)
pkill -SIGUSR1 myapp   # Send signal to process by name
kill -l                # List all signals
\`\`\`

### Hands-On Practice

1. Run \`ps auxf\` to see the process tree on your system
2. Use \`cat /proc/self/status | grep Threads\` to see thread information
3. Create a zombie process and observe it with \`ps\`
4. Use \`strace -f\` to watch fork/exec in action

### Key Takeaways
- Processes are created via fork() (duplicate) and exec() (replace image)
- Every process has a unique PID, a state, a nice value, and a parent
- The CFS scheduler gives each process fair CPU time based on nice values
- The /proc/<pid> directory exposes detailed per-process information
- Signals provide inter-process communication; SIGTERM is the default graceful kill

### References & Further Reading
**Textbooks:**
1. "The Linux Programming Interface" by Michael Kerrisk -- Chapter 3: System Calls, pages 49-78
2. "Linux Kernel Development, 3rd Edition" by Robert Love -- Chapter 4: Process Scheduling, pages 65-90
3. "Understanding the Linux Kernel, 3rd Edition" by Bovet & Cesati -- Chapter 3: Processes, pages 85-120

**Online Resources:**
1. [Linux man pages -- fork(2)](https://man7.org/linux/man-pages/man2/fork.2.html)
2. [Linux man pages -- kill(1)](https://man7.org/linux/man-pages/man1/kill.1.html)
3. [Process States in Linux -- Kernel documentation](https://www.kernel.org/doc/Documentation/filesystems/proc.rst)`,
            questions: [
              { text: 'What system call creates a new process as a copy of the calling process?', answers: [{ text: 'fork()', isCorrect: true }, { text: 'exec()', isCorrect: false }, { text: 'clone()', isCorrect: false }, { text: 'spawn()', isCorrect: false }] },
              { text: 'What does the exec() system call do?', answers: [{ text: 'Replaces the current process image with a new program', isCorrect: true }, { text: 'Creates a new child process', isCorrect: false }, { text: 'Terminates the current process', isCorrect: false }, { text: 'Sends a signal to another process', isCorrect: false }] },
              { text: 'What is a zombie process?', answers: [{ text: 'A process that has exited but whose parent has not collected its exit status', isCorrect: true }, { text: 'A process consuming excessive CPU', isCorrect: false }, { text: 'A process that cannot be killed', isCorrect: false }, { text: 'A process running in an infinite loop', isCorrect: false }] },
              { text: 'Which signal cannot be caught or ignored?', answers: [{ text: 'SIGKILL', isCorrect: true }, { text: 'SIGTERM', isCorrect: false }, { text: 'SIGUSR1', isCorrect: false }, { text: 'SIGHUP', isCorrect: false }] },
              { text: 'What does the nice value -10 indicate?', answers: [{ text: 'Higher priority than the default', isCorrect: true }, { text: 'Lower priority than the default', isCorrect: false }, { text: 'A real-time scheduling policy', isCorrect: false }, { text: 'A disk sleep state', isCorrect: false }] },
              { text: 'Which command shows the process tree?', answers: [{ text: 'ps auxf', isCorrect: true }, { text: 'top', isCorrect: false }, { text: 'df -h', isCorrect: false }, { text: 'ls -la', isCorrect: false }] },
              { text: 'What is the Completely Fair Scheduler (CFS)?', answers: [{ text: 'The default Linux process scheduler that gives each process fair CPU time', isCorrect: true }, { text: 'A real-time scheduler for embedded systems', isCorrect: false }, { text: 'A scheduler for I/O-bound processes only', isCorrect: false }, { text: 'A scheduler that runs only root processes', isCorrect: false }] },
            ],
          },


          {
            title: 'Memory Management', order: 3,
            content: `# Memory Management

### Learning Objectives
- Understand virtual memory and how the kernel manages physical RAM
- Learn about pages, page tables, and the Translation Lookaside Buffer (TLB)
- Identify memory usage metrics from /proc/meminfo and free
- Understand swap, page faults, and memory-mapped files

### Section 1: Virtual Memory Architecture

Linux uses **virtual memory** to give each process the illusion of a large, private address space. The kernel, with help from the CPU's Memory Management Unit (MMU), translates virtual addresses to physical addresses.

| Concept | Description |
|---------|-------------|
| **Virtual Address** | The address a process uses. Each process has its own virtual address space (typically 128 TB on 64-bit). |
| **Physical Address** | The actual address in RAM hardware. |
| **Page** | A fixed-size block of memory (typically 4 KB on x86-64). The basic unit of memory management. |
| **Page Table** | Per-process data structure mapping virtual pages to physical page frames. |
| **TLB** | Translation Lookaside Buffer -- a CPU cache of recent virtual-to-physical translations. |

When a process accesses a virtual address, the CPU walks the page table to find the corresponding physical address. If the translation is not in the TLB, this causes a **TLB miss**. If the page is not in physical memory (swapped to disk), this causes a **page fault**.

### Section 2: Reading Memory Statistics

The primary source of memory information is \`/proc/meminfo\`:

\`\`\`bash
cat /proc/meminfo
# MemTotal:       16384000 kB    # Total physical RAM
# MemFree:         2048000 kB    # Completely unused RAM
# MemAvailable:    6144000 kB    # Memory available for applications
# Buffers:          512000 kB    # Raw block device buffers
# Cached:          4096000 kB    # Page cache for file contents
# SwapTotal:       2097152 kB    # Total swap space
# Active:          8192000 kB    # Recently used pages
# Inactive:        4096000 kB    # Pages not recently used
\`\`\`

The \`free\` command provides a summary:

\`\`\`bash
free -h
#               total        used        free      shared  buff/cache   available
# Mem:           15Gi       6.2Gi       2.0Gi       512Mi       7.2Gi       5.8Gi
# Swap:         2.0Gi          0B       2.0Gi
\`\`\`

Key insight: **Linux uses "free" memory for disk caching**. The buff/cache column shows memory used for file system caches. This memory can be instantly reclaimed when applications need it. Check the **available** column for real availability.

### Section 3: Page Allocation and Swapping

The kernel manages physical memory using a **buddy allocator** for contiguous page frames and a **slab allocator** for smaller, kernel-internal objects.

When physical memory runs low, the kernel can **swap** pages to disk:

| Metric | Description |
|--------|-------------|
| **Major Page Fault** | Page must be read from disk. Very slow (milliseconds). |
| **Minor Page Fault** | Page is in memory but mapping needs updating. Fast. |
| **Swap In** | Reading a page from swap back into physical memory. |
| **Swap Out** | Writing a page from physical memory to swap. |

\`\`\`bash
ps -o pid,min_flt,maj_flt,comm -p $$   # Per-process page faults
vmstat 1  # si/so = swap in/out per second
watch -n2 'cat /proc/meminfo | grep -E "SwapTotal|SwapFree"'
\`\`\`

### Section 4: Memory-Mapped Files

Linux supports **memory-mapped I/O** via the \`mmap()\` system call, mapping a file into a process's address space:

\`\`\`bash
cat /proc/$(pgrep -n bash)/maps | grep -v '\\[heap\\]\\|\\[stack\\]'
# Shows mapped shared libraries, program code, etc.
# 7f1234000000-7f1234020000 r-xp 00000000 08:01 67890  /lib/libc.so.6
\`\`\`

Benefits of mmap:
- The kernel can efficiently cache file contents in the page cache
- Multiple processes can share the same physical pages (shared libraries)
- Copy-on-write semantics allow efficient process creation (fork)

### Section 5: Kernel Memory Allocation

| Allocator | Purpose |
|-----------|---------|
| **Buddy Allocator** | Allocates physically contiguous pages for large allocations |
| **Slab Allocator** | Caches frequently used kernel objects (inodes, dentries, task_structs) |
| **vmalloc** | Allocates virtually contiguous memory (not necessarily physically contiguous) |
| **kmalloc** | Allocates physically contiguous kernel memory (for DMA, etc.) |

\`\`\`bash
cat /proc/slabinfo | head -20  # View slab cache statistics
slabtop                         # Interactive slab monitoring

# Key slab caches:
# dentry - Directory entry cache (file name lookups)
# inode_cache - Inode metadata cache
# task_struct - Process descriptor cache
\`\`\`

### Section 6: Memory Pressure and OOM

When the system runs critically low on memory, the **OOM Killer** selects and kills processes:

\`\`\`bash
# Check OOM score for processes
for pid in /proc/[0-9]*/oom_score; do
  echo "\$(cat \$pid) \$(cat \${pid%/oom_score}/comm)"
done | sort -rn | head -10

# Adjust OOM score (-1000 to 1000)
echo -500 > /proc/<pid>/oom_score_adj  # Protect this process
echo 1000 > /proc/<pid>/oom_score_adj  # Prioritize for killing
\`\`\`

### Hands-On Practice

1. Monitor memory usage with \`vmstat 1\` for 30 seconds while running a memory-intensive program
2. Use \`smem\` to see actual memory usage per process (accounting for shared libraries)
3. Create a large file and observe the page cache grow in \`/proc/meminfo\`
4. Examine slab caches with \`slabtop\` and identify the largest consumers

### Key Takeaways
- Virtual memory gives each process an isolated, private address space
- Linux uses free RAM for disk caching; check "available" not "free" for real availability
- Swap provides overflow space but is much slower than physical RAM
- The OOM killer is the last resort when memory is exhausted
- mmap enables efficient file I/O and shared library loading

### References & Further Reading
**Textbooks:**
1. "Understanding the Linux Kernel, 3rd Edition" by Bovet & Cesati -- Chapter 2: Memory Addressing, pages 41-70
2. "Linux Kernel Development, 3rd Edition" by Robert Love -- Chapter 12: Memory Management, pages 203-230
3. "How Linux Works, 3rd Edition" by Brian Ward -- Chapter 5: How the Kernel Manages Memory, pages 121-155

**Online Resources:**
1. [Linux man pages -- mmap(2)](https://man7.org/linux/man-pages/man2/mmap.2.html)
2. [Kernel documentation -- /proc/meminfo](https://www.kernel.org/doc/Documentation/filesystems/proc.rst)
3. [Understanding Memory Usage on Linux -- Red Hat](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/performance_tuning_guide/)`,
            questions: [
              { text: 'What is the typical page size on x86-64 Linux?', answers: [{ text: '4 KB', isCorrect: true }, { text: '1 KB', isCorrect: false }, { text: '64 KB', isCorrect: false }, { text: '1 MB', isCorrect: false }] },
              { text: 'Which column in the free command shows memory that can be immediately reclaimed?', answers: [{ text: 'available', isCorrect: true }, { text: 'free', isCorrect: false }, { text: 'buff/cache', isCorrect: false }, { text: 'used', isCorrect: false }] },
              { text: 'What is a major page fault?', answers: [{ text: 'The page must be read from disk because it is not in physical memory', isCorrect: true }, { text: 'The page table entry needs updating for copy-on-write', isCorrect: false }, { text: 'The TLB cache was flushed', isCorrect: false }, { text: 'The process was killed by the OOM killer', isCorrect: false }] },
              { text: 'What does mmap() allow a process to do?', answers: [{ text: 'Map a file into the process address space for direct memory access', isCorrect: true }, { text: 'Allocate physically contiguous DMA memory', isCorrect: false }, { text: 'Create a new process with copy-on-write semantics', isCorrect: false }, { text: 'Reserve swap space on disk', isCorrect: false }] },
              { text: 'What happens when the system is critically low on memory?', answers: [{ text: 'The OOM killer selects and kills processes to free memory', isCorrect: true }, { text: 'The kernel automatically adds more swap space', isCorrect: false }, { text: 'All processes are paused until memory is freed', isCorrect: false }, { text: 'The kernel crashes with a kernel panic', isCorrect: false }] },
              { text: 'Which command shows kernel slab allocator statistics?', answers: [{ text: 'slabtop', isCorrect: true }, { text: 'df -h', isCorrect: false }, { text: 'lsblk', isCorrect: false }, { text: 'netstat', isCorrect: false }] },
            ],
          },


          {
            title: 'Kernel Modules', order: 4,
            content: `# Kernel Modules

### Learning Objectives
- Understand what kernel modules are and why they exist
- Load, unload, and query kernel modules at runtime
- Configure module loading behavior through configuration files
- Build a simple kernel module from source

### Section 1: What Are Kernel Modules?

A **kernel module** is a piece of code that can be loaded into the kernel at runtime without rebooting. Modules extend the kernel's functionality -- they can add device drivers, filesystem support, networking protocols, or system call filters.

| Approach | Pros | Cons |
|----------|------|------|
| **Modules** | Load only what you need; faster boot; easy to update | Slight overhead; potential dependency issues |
| **Built-in** | Slightly faster execution; always available at boot | Larger kernel image; must recompile to add functionality |

### Section 2: Module Management Commands

\`\`\`bash
lsmod                        # List all loaded kernel modules
modinfo ext4                 # Show detailed module information
sudo modprobe ext4           # Load a module (resolves dependencies)
sudo rmmod ext4              # Remove a module
sudo modprobe -r ext4        # Remove with dependencies
modinfo -p ext4              # View module parameters
\`\`\`

### Section 3: Module Parameters

\`\`\`bash
sudo modprobe bonding mode=1 miimon=100  # Load with parameters
cat /sys/module/bonding/parameters/mode   # View loaded parameters
\`\`\`

### Section 4: Module Configuration

\`\`\`bash
# Blacklist a module (prevent loading)
echo "blacklist nouveau" | sudo tee /etc/modprobe.d/blacklist-nouveau.conf

# Set default parameters
echo "options bonding mode=1 miimon=100" | sudo tee /etc/modprobe.d/bonding.conf

# Rebuild dependency database
sudo depmod -a
\`\`\`

### Section 5: /sys/module -- Runtime Module Information

\`\`\`bash
ls /sys/module/                            # List all loaded modules
ls /sys/module/bonding/parameters/         # View module parameters
cat /sys/module/ext4/refcnt                # Module reference count
cat /sys/module/ext4/coresize              # Module memory usage
\`\`\`

### Section 6: Building a Kernel Module

\`\`\`c
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Your Name");
MODULE_DESCRIPTION("A simple hello world kernel module");

static int __init hello_init(void) {
    printk(KERN_INFO "Hello, kernel world!\\n");
    return 0;
}

static void __exit hello_exit(void) {
    printk(KERN_INFO "Goodbye, kernel world!\\n");
}

module_init(hello_init);
module_exit(hello_exit);
\`\`\`

\`\`\`bash
sudo apt install linux-headers-$(uname -r)  # Install kernel headers
make -C /lib/modules/$(uname -r)/build M=$(pwd) modules  # Build
sudo insmod hello_module.ko                 # Load
dmesg | tail -5                            # Check output
sudo rmmod hello_module                    # Unload
\`\`\`

### Hands-On Practice

1. Run \`lsmod | wc -l\` to see how many modules are loaded
2. Use \`modinfo\` to examine the ext4 filesystem module
3. Blacklist a non-essential module and reboot to verify
4. Write, compile, load, and unload the hello world module

### Key Takeaways
- Kernel modules extend the kernel at runtime without recompilation
- Use modprobe (not insmod) for automatic dependency resolution
- /etc/modprobe.d/ configures module blacklisting and default parameters
- /sys/module exposes runtime information about loaded modules
- Building modules requires kernel headers and the kernel build system

### References & Further Reading
**Textbooks:**
1. "Linux Kernel Development, 3rd Edition" by Robert Love -- Chapter 19: Portability, pages 345-360
2. "The Linux Programming Interface" by Michael Kerrisk -- Chapter 63: Kernel Modules, pages 1295-1310
3. "Linux Device Drivers, 3rd Edition" by Corbet, Rubini & Kroah-Hartman -- Chapter 2: Building and Running Modules, pages 25-50

**Online Resources:**
1. [The Linux Kernel -- Modules documentation](https://www.kernel.org/doc/html/latest/core-api/modules.html)
2. [Linux man pages -- modprobe(8)](https://man7.org/linux/man-pages/man8/modprobe.8.html)
3. [Writing a Linux Kernel Module](https://tldp.org/LDP/lkmpg/2.6/html/)`,
            questions: [
              { text: 'What is the advantage of kernel modules over compiling everything into the kernel?', answers: [{ text: 'They can be loaded at runtime without rebooting', isCorrect: true }, { text: 'They always run faster than built-in code', isCorrect: false }, { text: 'They do not require kernel headers to compile', isCorrect: false }, { text: 'They automatically update themselves', isCorrect: false }] },
              { text: 'Which command loads a module while resolving dependencies automatically?', answers: [{ text: 'modprobe', isCorrect: true }, { text: 'insmod', isCorrect: false }, { text: 'lsmod', isCorrect: false }, { text: 'depmod', isCorrect: false }] },
              { text: 'Where do you configure module blacklisting?', answers: [{ text: '/etc/modprobe.d/', isCorrect: true }, { text: '/etc/modules.conf', isCorrect: false }, { text: '/proc/modules', isCorrect: false }, { text: '/sys/module/', isCorrect: false }] },
              { text: 'What does the modinfo command show?', answers: [{ text: 'Module filename, license, description, dependencies, and parameters', isCorrect: true }, { text: 'Only the module file size', isCorrect: false }, { text: 'The real-time CPU usage of a module', isCorrect: false }, { text: 'The kernel log messages from a module', isCorrect: false }] },
              { text: 'Which macro marks a function as a module initialization function?', answers: [{ text: '__init / module_init()', isCorrect: true }, { text: 'EXPORT_SYMBOL()', isCorrect: false }, { text: 'MODULE_LICENSE()', isCorrect: false }, { text: 'MODULE_PARM()', isCorrect: false }] },
              { text: 'Where is the module dependency database stored?', answers: [{ text: '/lib/modules/$(uname -r)/modules.dep', isCorrect: true }, { text: '/etc/modules.dep', isCorrect: false }, { text: '/proc/modules', isCorrect: false }, { text: '/sys/module/dep', isCorrect: false }] },
              { text: 'What is the purpose of rmmod?', answers: [{ text: 'Remove (unload) a kernel module from memory', isCorrect: true }, { text: 'Remove the module source files', isCorrect: false }, { text: 'Recompile a kernel module', isCorrect: false }, { text: 'List all removable modules', isCorrect: false }] },
            ],
          },

        ],
      },
      // ─── SECTION 2: Performance & Tuning ───
      {
        title: 'Performance & Tuning', order: 2,
        lessons: [

          {
            title: 'Performance Analysis Tools', order: 5,
            content: `# Performance Analysis Tools

### Learning Objectives
- Master the essential Linux performance monitoring tools
- Interpret output from top, htop, vmstat, iostat, sar, and perf
- Identify CPU, memory, I/O, and network bottlenecks
- Build a systematic approach to performance analysis

### Section 1: The Performance Analysis Toolkit

| Tool | Purpose | Key Metrics |
|------|---------|-------------|
| **top / htop** | Real-time process monitoring | CPU%, MEM%, load average |
| **vmstat** | Virtual memory and CPU statistics | r (run queue), b (blocked), si/so (swap) |
| **iostat** | Disk I/O statistics | IOPS, throughput, await, %util |
| **mpstat** | Per-CPU statistics | %usr, %sys, %iowait per core |
| **sar** | System Activity Reporter (historical) | CPU, memory, network, disk over time |
| **perf** | Performance counters and profiling | Cache misses, branch predictions, cycles |
| **pidstat** | Per-process statistics | CPU, I/O, context switches per process |

### Section 2: top and htop

\`\`\`bash
top
# Tasks: 256 total,   2 running, 254 sleeping,   0 stopped,   0 zombie
# %Cpu(s): 12.5 us,  3.2 sy,  0.0 ni, 82.1 id,  1.8 wa,  0.0 hi,  0.4 si

# Useful top commands:
# P - Sort by CPU  |  M - Sort by memory  |  1 - Per-CPU stats
# H - Show threads  |  c - Full command  |  k - Kill process

htop   # More user-friendly: color, mouse, tree view, filtering
\`\`\`

### Section 3: vmstat -- System-Wide Statistics

\`\`\`bash
vmstat 1 10   # Report every 1 second, 10 times
# procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
#  r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
#  2  0      0 2048000 512000 4096000    0    0     0     0  500 1000 12  3 85  0  0

# Key columns:
# r  - Processes in run queue (waiting for CPU)
# b  - Processes in uninterruptible sleep (waiting for I/O)
# si/so - Swap in/out (KB/s)
# us/sy/id/wa - User/System/Idle/IO-wait CPU percentages
\`\`\`

**Interpreting vmstat:**
- r > number of CPU cores = CPU bottleneck
- b > 0 = processes blocked on I/O (disk bottleneck)
- si/so > 0 = swap activity; low physical memory
- wa > 10% = significant I/O wait

### Section 4: iostat -- Disk I/O Analysis

\`\`\`bash
iostat -xz 1 5   # Extended stats, every 1 sec, 5 times
# Device  r/s    w/s   rkB/s   wkB/s  await  %util
# sda    150.00 200.00 6000.00 40000.00  2.50  42.00

# r/s, w/s   - IOPS (reads/writes per second)
# rkB/s, wkB/s - Throughput in KB/s
# await      - Average I/O wait time in milliseconds
# %util      - Device busy percentage (>80% = saturated)
\`\`\`

### Section 5: sar -- Historical Performance Data

\`\`\`bash
sar -u 1 10       # CPU usage
sar -r 1 10       # Memory usage
sar -d 1 10       # Disk I/O
sar -n DEV 1 10   # Network interface statistics
\`\`\`

### Section 6: perf -- Linux Profiling

\`\`\`bash
perf stat ls /tmp
#  1,234,567 instructions  # 1.23 insn per cycle
#    234,567 cache-misses  # 3.21% of all cache refs

perf record -g ./my_program   # Record a profile
perf report                   # Analyze profile
perf top -p 1234              # Monitor a running process
\`\`\`

### Section 7: Systematic Performance Analysis

1. **Establish a baseline** -- Know what "normal" looks like
2. **Check the big four** -- CPU, Memory, Disk I/O, Network
3. **Use the right tool** -- Start broad (top, vmstat), then narrow down
4. **Look at trends** -- A single snapshot may be misleading
5. **Check logs** -- dmesg, /var/log/syslog, application logs

### Hands-On Practice

1. Use \`top\` to identify the top 5 CPU-consuming processes
2. Run \`vmstat 1 10\` while running \`dd if=/dev/zero of=/tmp/test bs=1M count=1000\`
3. Use \`iostat -xz 1\` during the same dd command to observe disk I/O
4. Record a 30-second profile with \`perf stat sleep 30\`

### Key Takeaways
- top/htop provide real-time per-process CPU and memory usage
- vmstat reveals CPU queue depth, swap activity, and I/O wait
- iostat shows per-device IOPS, throughput, and utilization
- sar provides historical performance data for trend analysis
- perf uses hardware counters for low-overhead profiling
- Always establish a baseline before investigating anomalies

### References & Further Reading
**Textbooks:**
1. "Systems Performance, 2nd Edition" by Brendan Gregg -- Chapters 2-5, pages 35-200
2. "Performance Analysis and Tuning on Linux" by Gregg & Mauro -- Chapters 1-4
3. "How Linux Works, 3rd Edition" by Brian Ward -- Chapter 8, pages 255-285

**Online Resources:**
1. [Brendan Gregg's Linux Performance Tools](https://www.brendangregg.com/linuxperf.html)
2. [Linux man pages -- vmstat(8)](https://man7.org/linux/man-pages/man8/vmstat.8.html)
3. [perf Tutorial -- Linux Kernel documentation](https://perf.wiki.kernel.org/index.php/Tutorial)`,
            questions: [
              { text: 'What does a high "wa" value in vmstat output indicate?', answers: [{ text: 'CPU is spending significant time waiting for disk I/O', isCorrect: true }, { text: 'CPU is running too many threads', isCorrect: false }, { text: 'Swap space is full', isCorrect: false }, { text: 'Network bandwidth is saturated', isCorrect: false }] },
              { text: 'What does %util in iostat represent?', answers: [{ text: 'Percentage of time the device was busy processing I/O requests', isCorrect: true }, { text: 'Percentage of disk space used', isCorrect: false }, { text: 'Percentage of CPU used by I/O operations', isCorrect: false }, { text: 'Percentage of memory used for I/O buffers', isCorrect: false }] },
              { text: 'Which tool provides historical performance data for later review?', answers: [{ text: 'sar', isCorrect: true }, { text: 'top', isCorrect: false }, { text: 'free', isCorrect: false }, { text: 'uptime', isCorrect: false }] },
              { text: 'In vmstat, what does r > number of CPU cores indicate?', answers: [{ text: 'A CPU bottleneck -- processes are queuing for CPU time', isCorrect: true }, { text: 'A memory bottleneck', isCorrect: false }, { text: 'An I/O bottleneck', isCorrect: false }, { text: 'A network bottleneck', isCorrect: false }] },
              { text: 'What does perf stat measure?', answers: [{ text: 'Hardware performance counters like instructions per cycle and cache misses', isCorrect: true }, { text: 'Network packet statistics', isCorrect: false }, { text: 'File system usage and inode counts', isCorrect: false }, { text: 'User login sessions', isCorrect: false }] },
              { text: 'Which command shows per-CPU statistics?', answers: [{ text: 'mpstat -P ALL', isCorrect: true }, { text: 'top -1', isCorrect: false }, { text: 'free -h', isCorrect: false }, { text: 'df -h', isCorrect: false }] },
            ],
          },


          {
            title: 'Kernel Parameters (sysctl)', order: 6,
            content: `# Kernel Parameters (sysctl)

### Learning Objectives
- Understand the sysctl interface for tuning kernel parameters at runtime
- Browse, read, and modify kernel parameters using sysctl and /proc/sys
- Configure persistent kernel parameters in /etc/sysctl.conf and /etc/sysctl.d/
- Tune networking, memory, and file system parameters for specific workloads

### Section 1: What Are Kernel Parameters?

Kernel parameters (sysctl tunables) control the behavior of the running kernel. They are exposed through two interfaces:

| Interface | Description |
|-----------|-------------|
| /proc/sys/ | Virtual filesystem -- each parameter is a file you can cat/echo |
| sysctl command | Command-line tool for reading/writing parameters |

\`\`\`bash
cat /proc/sys/net/ipv4/ip_forward       # Read via filesystem
sysctl net.ipv4.ip_forward              # Read via sysctl
echo 1 > /proc/sys/net/ipv4/ip_forward  # Set via filesystem
sysctl -w net.ipv4.ip_forward=1         # Set via sysctl
\`\`\`

### Section 2: Commonly Tuned Parameters

**Networking:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| net.ipv4.ip_forward | 0 | Enable IP forwarding (router/VPN) |
| net.ipv4.tcp_max_syn_backlog | 1024 | Max queued SYN packets |
| net.core.somaxconn | 128 | Max listen backlog |
| net.ipv4.tcp_tw_reuse | 0 | Reuse TIME_WAIT sockets |

**Memory:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| vm.swappiness | 60 | How aggressively the kernel swaps (0-100) |
| vm.overcommit_memory | 0 | Memory overcommit policy |
| vm.dirty_ratio | 20 | % memory before dirty pages forced to disk |

**File System:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| fs.file-max | 65536 | Max number of file handles |
| fs.inotify.max_user_watches | 8192 | Max inotify watches per user |

### Section 3: Persistent Configuration

\`\`\`bash
# Create custom sysctl configuration
sudo tee /etc/sysctl.d/99-web-server.conf << 'EOF'
net.core.somaxconn = 4096
net.ipv4.tcp_max_syn_backlog = 4096
net.ipv4.tcp_tw_reuse = 1
vm.swappiness = 10
fs.file-max = 2097152
EOF

sudo sysctl --system   # Apply all configurations
\`\`\`

### Section 4: Practical Tuning Examples

**High-Traffic Web Server:**
\`\`\`bash
net.core.somaxconn = 8192
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65535
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
vm.swappiness = 10
\`\`\`

**VPN/Router:**
\`\`\`bash
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 1
net.ipv4.conf.all.accept_redirects = 0
\`\`\`

### Hands-On Practice

1. Find the current value of vm.swappiness and change it to 10
2. Create a sysctl configuration file for a web server and apply it
3. Use \`sysctl -a | grep tcp\` to find all TCP-related parameters
4. Enable IP forwarding temporarily, verify it works, then disable it

### Key Takeaways
- sysctl provides a runtime interface to tune kernel behavior
- /proc/sys/ is the filesystem interface; sysctl is the CLI interface
- Persistent changes go in /etc/sysctl.d/*.conf files
- Common tuning targets: networking backlog, memory swapping, file limits
- Always test changes before deploying to production

### References & Further Reading
**Textbooks:**
1. "How Linux Works, 3rd Edition" by Brian Ward -- Chapter 6: Networking, pages 157-190
2. "UNIX and Linux System Administration Handbook, 5th Edition" -- Chapter 6: Networking, pages 185-230
3. "Linux Performance Optimization" by Brendan Gregg -- Kernel tuning chapters

**Online Resources:**
1. [Linux man page -- sysctl(8)](https://man7.org/linux/man-pages/man8/sysctl.8.html)
2. [Kernel.org -- sysctl documentation](https://www.kernel.org/doc/Documentation/sysctl/)
3. [Sysctl settings -- Arch Wiki](https://wiki.archlinux.org/title/Sysctl)`,
            questions: [
              { text: 'Which command is equivalent to "echo 1 > /proc/sys/net/ipv4/ip_forward"?', answers: [{ text: 'sysctl -w net.ipv4.ip_forward=1', isCorrect: true }, { text: 'sysctl net.ipv4.ip_forward 1', isCorrect: false }, { text: 'echo 1 | sysctl ip_forward', isCorrect: false }, { text: 'net.ipv4.ip_forward=1', isCorrect: false }] },
              { text: 'Where should persistent sysctl configuration files be placed?', answers: [{ text: '/etc/sysctl.d/', isCorrect: true }, { text: '/etc/sysconfig/', isCorrect: false }, { text: '/proc/sys/conf.d/', isCorrect: false }, { text: '/var/lib/sysctl/', isCorrect: false }] },
              { text: 'What does vm.swappiness=10 mean?', answers: [{ text: 'The kernel will strongly prefer keeping processes in RAM and rarely swap', isCorrect: true }, { text: 'Only 10% of swap space can be used', isCorrect: false }, { text: 'Swap will be disabled after 10 minutes', isCorrect: false }, { text: 'The swap partition will be resized to 10 GB', isCorrect: false }] },
              { text: 'Which parameter should be increased for a high-traffic web server?', answers: [{ text: 'net.core.somaxconn', isCorrect: true }, { text: 'vm.swappiness', isCorrect: false }, { text: 'fs.file-max', isCorrect: false }, { text: 'net.ipv4.icmp_echo_ignore_all', isCorrect: false }] },
              { text: 'What does setting net.ipv4.ip_forward=1 enable?', answers: [{ text: 'IP forwarding -- the kernel can route packets between interfaces', isCorrect: true }, { text: 'ICMP echo requests through firewalls', isCorrect: false }, { text: 'SSH port forwarding', isCorrect: false }, { text: 'Transparent HTTP proxying', isCorrect: false }] },
              { text: 'How do you apply all sysctl configuration files at once?', answers: [{ text: 'sysctl --system', isCorrect: true }, { text: 'sysctl -a', isCorrect: false }, { text: 'sysctl --reload', isCorrect: false }, { text: 'sysctl --apply', isCorrect: false }] },
            ],
          },


          {
            title: 'System Call Tracing (strace/ltrace)', order: 7,
            content: `# System Call Tracing (strace/ltrace)

### Learning Objectives
- Use strace to trace system calls made by a program
- Filter strace output by syscall category, name, or time
- Use ltrace to trace library calls instead of system calls
- Apply strace and ltrace to debug real-world problems

### Section 1: Introduction to strace

strace intercepts and records all system calls made by a process, using the ptrace system call:

\`\`\`bash
strace ls /tmp
# execve("/usr/bin/ls", ["ls", "/tmp"], 0x7ffd...) = 0
# brk(NULL)                               = 0x55a123456000
# openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
# read(3, "\\177ELF...", 832)              = 832
# close(3)                                = 0
# write(1, "file1.txt  file2.txt\n", 21)  = 21
# exit_group(0)                           = ?
# +++ exited with 0 +++
\`\`\`

Output format: syscall(args) = return_value

### Section 2: Filtering strace Output

\`\`\`bash
strace -e trace=open,read,write ls /tmp     # Specific syscalls
strace -e trace=file ls                     # All file-related syscalls
strace -e trace=process ls                  # All process-related syscalls
strace -e trace=network ls                  # All network-related syscalls
strace -e trace=signal ls                   # Signal-related syscalls
strace -e trace=ipc ls                      # IPC syscalls
\`\`\`

### Section 3: strace Output Options

\`\`\`bash
strace -t ls /tmp          # Timestamps (seconds since epoch)
strace -T ls /tmp          # Time spent in each syscall
strace -r ls /tmp          # Relative timestamps
strace -s 1024 cat /etc/hostname  # Full string output (not truncated)
strace -f bash -c 'ls'     # Follow child processes
strace -o /tmp/trace.log ls /tmp  # Output to file
strace -c ls /tmp          # Summary of syscall statistics
# % time     seconds  usecs/call     calls    errors
# ------ ----------- ----------- --------- ---------
#  45.00    0.000450          45        10
#  20.00    0.000200          20        10
#  10.00    0.000100          10        10           2
\`\`\`

### Section 4: Tracing Running Processes

\`\`\`bash
strace -p 1234             # Attach to running process
strace -f -p 1234          # Attach and follow child threads
# Common use case: debug a hung process
strace -p $(pgrep myapp) -e trace=all -T
\`\`\`

### Section 5: Introduction to ltrace

While strace traces system calls, ltrace traces library calls (calls to shared libraries like libc):

\`\`\`bash
ltrace ls /tmp
# __libc_start_main(0x4049a0, 2, 0x7ffd...)
# strlen("file1.txt")                     = 9
# malloc(128)                             = 0x55a123456780
# strcmp("file1.txt", ".")                 = 1
# printf("file1.txt ")                    = 10

ltrace -e malloc+free ls /tmp  # Filter specific calls
ltrace -c ls /tmp              # Summary of library call frequency
\`\`\`

### Section 6: Practical Debugging with strace

**Finding Configuration Files:**

\`\`\`bash
strace -e openat,access myapp 2>&1 | grep -E "\\.conf|/etc/"
# Reveals the exact config files the program looks for
\`\`\`

**Debugging Permission Denied:**

\`\`\`bash
strace -e trace=access,openat myapp 2>&1 | grep EACCES
# openat(AT_FDCWD, "/var/log/app.log", O_WRONLY|O_CREAT) = -1 EACCES
\`\`\`

**Measuring Program Startup Time:**

\`\`\`bash
strace -T -c myapp 2>&1 | tail -5
# Shows which syscalls consume the most time
\`\`\`

**Checking Network Connections:**

\`\`\`bash
strace -e trace=network -s 256 curl http://example.com
# socket(AF_INET, SOCK_STREAM, IPPROTO_TCP) = 3
# connect(3, {sin_port=htons(80), sin_addr=inet_addr("93.184.216.34")}, 16) = 0
\`\`\`

### Hands-On Practice

1. Run \`strace ls /tmp\` and count how many system calls a simple ls needs
2. Use \`strace -e trace=file\` to find where bash looks for its config files
3. Trace a curl command and identify the DNS lookup and connection syscalls
4. Use \`strace -c\` to profile a computationally intensive script

### Key Takeaways
- strace traces system calls; ltrace traces library calls
- Use -e to filter by category (file, process, network, signal, ipc)
- -c provides a statistical summary of syscall frequency and timing
- strace -p attaches to running processes for live debugging
- strace is invaluable for diagnosing permission errors, missing files, and hangs

### References & Further Reading
**Textbooks:**
1. "The Linux Programming Interface" by Michael Kerrisk -- Chapter 2: System Calls, pages 27-48
2. "UNIX and Linux System Administration Handbook, 5th Edition" -- Chapter 17: Debugging, pages 595-620
3. "Linux Server Hacks, Volume One" by Rob Flickenger -- Hack #46: Debugging with strace, pages 185-195

**Online Resources:**
1. [Linux man page -- strace(1)](https://man7.org/linux/man-pages/man1/strace.1.html)
2. [Linux man page -- ltrace(1)](https://man7.org/linux/man-pages/man1/ltrace.1.html)
3. [How To Use strace -- DigitalOcean Tutorial](https://www.digitalocean.com/community/tutorials/using-strace-to-debug-and-trace-programs)`,
            questions: [
              { text: 'What does strace use internally to trace a process?', answers: [{ text: 'The ptrace system call', isCorrect: true }, { text: 'The trace() system call', isCorrect: false }, { text: 'The LD_PRELOAD environment variable', isCorrect: false }, { text: '/proc/sys/kernel/trace', isCorrect: false }] },
              { text: 'What is the difference between strace and ltrace?', answers: [{ text: 'strace traces system calls; ltrace traces library calls', isCorrect: true }, { text: 'strace traces network calls; ltrace traces local calls', isCorrect: false }, { text: 'strace runs in kernel space; ltrace runs in user space', isCorrect: false }, { text: 'There is no difference -- they are aliases', isCorrect: false }] },
              { text: 'Which strace option filters for file-related system calls?', answers: [{ text: '-e trace=file', isCorrect: true }, { text: '-e file', isCorrect: false }, { text: '--filter=files', isCorrect: false }, { text: '-F file', isCorrect: false }] },
              { text: 'How do you attach strace to a running process?', answers: [{ text: 'strace -p <PID>', isCorrect: true }, { text: 'strace --attach <PID>', isCorrect: false }, { text: 'strace --pid <PID>', isCorrect: false }, { text: 'strace --run <PID>', isCorrect: false }] },
              { text: 'What does the -T option in strace show?', answers: [{ text: 'The time spent in each syscall (wall-clock time)', isCorrect: true }, { text: 'The total execution time', isCorrect: false }, { text: 'Thread IDs', isCorrect: false }, { text: 'The timestamp since boot', isCorrect: false }] },
              { text: 'How do you see a summary of syscall frequency and timing?', answers: [{ text: 'strace -c', isCorrect: true }, { text: '-e summary', isCorrect: false }, { text: '--stats', isCorrect: false }, { text: '-R', isCorrect: false }] },
              { text: 'Which strace option follows child processes after fork?', answers: [{ text: '-f', isCorrect: true }, { text: '-F', isCorrect: false }, { text: '--follow', isCorrect: false }, { text: '-p', isCorrect: false }] },
            ],
          },


          {
            title: 'Container Internals (namespaces/cgroups)', order: 8,
            content: `# Container Internals (namespaces/cgroups)

### Learning Objectives
- Understand that containers are NOT virtual machines
- Learn how Linux namespaces provide process isolation
- Understand how cgroups limit and account resource usage
- Map Docker container features to underlying kernel primitives

### Section 1: Containers vs Virtual Machines

| Feature | Containers | Virtual Machines |
|---------|-----------|-----------------|
| **Isolation mechanism** | Kernel namespaces + cgroups | Hardware virtualization (hypervisor) |
| **Kernel** | Shared host kernel | Each VM has its own kernel |
| **Overhead** | Minimal (native performance) | Significant (extra kernel, memory) |
| **Startup time** | Milliseconds | Minutes |
| **Image size** | Megabytes | Gigabytes |
| **Security** | Weaker (shared kernel) | Stronger (hardware isolation) |

Containers are **isolated processes** running on the host kernel using:
1. **Namespaces** -- Isolate what a process can see (filesystem, network, processes, users)
2. **cgroups** -- Limit what a process can consume (CPU, memory, I/O, network)

### Section 2: Linux Namespaces

| Namespace | Isolates | Example |
|-----------|----------|---------|
| **PID** | Process IDs | Container sees PID 1 as its init process |
| **Mount** | Filesystem mount points | Container has its own /, /etc, /var |
| **Network** | Network stack (interfaces, IPs, ports) | Container has its own eth0, 127.0.0.1 |
| **UTS** | Hostname and domain name | Container can have its own hostname |
| **IPC** | Inter-process communication | Isolates shared memory, semaphores |
| **User** | User and group IDs | Container root is not host root |
| **Cgroup** | Cgroup root directory | Prevents container from seeing host cgroups |
| **Time** | System clocks | Container can have different time offset |

\`\`\`bash
# View namespaces of the current process
lsns
# NS          TYPE  NPROCS  PID  USER    COMMAND
# 4026531835  cgroup  256    1   root    /sbin/init
# 4026531836  pid     256    1   root    /sbin/init

# View namespaces of a Docker container
docker run --rm alpine lsns
\`\`\`

### Section 3: Control Groups (cgroups)

cgroups limit, account for, and isolate resource usage:

| Resource | cgroup Controller | Docker Flag |
|----------|-------------------|-------------|
| CPU | cpu | --cpus, --cpu-shares |
| Memory | memory | --memory, --memory-swap |
| I/O | io (v2) / blkio (v1) | --device-read-bps |
| PID count | pids | --pids-limit |

\`\`\`bash
# cgroups v2 hierarchy (unified)
ls /sys/fs/cgroup/
# cgroup.controllers  cpu.max  cpu.stat
# memory.current  memory.max  io.max  pids.max

# Check which version is in use
stat -fc %T /sys/fs/cgroup/
# cgroup2fs = v2, tmpfs = v1
\`\`\`

### Section 4: How Docker Uses Namespaces and cgroups

When you run \`docker run\`, Docker:
1. Creates new namespaces for the container
2. Sets up cgroups to limit resource usage
3. Creates a filesystem from image layers (OverlayFS)
4. Runs the entrypoint process inside the isolated environment

\`\`\`bash
# Start a container
docker run -d --name myweb -p 8080:80 --memory=256m --cpus=1 nginx

# Find container PID on host
PID=$(docker inspect --format '{{.State.Pid}}' myweb)

# View container namespaces
lsns -p $PID

# View container cgroups
cat /proc/$PID/cgroup
\`\`\`

### Section 5: Overlay Filesystem

\`\`\`bash
# See the overlay mount in a container
docker run --rm alpine mount | grep overlay
# overlay on / type overlay (rw, lowerdir=.../layer1:.../layer2)

# Layer structure:
# - Read-only lower layers (shared between containers)
# - Writable upper layer (container-specific changes)
# - Merged view (what the container sees)
\`\`\`

### Section 6: unshare -- Creating Namespaces Without Docker

\`\`\`bash
# Create a new PID namespace and run a shell
sudo unshare --pid --fork --mount-proc bash
ps aux   # PID 1 is bash itself

# Create a new network namespace
sudo unshare --net ip addr   # Only loopback interface

# Create a new UTS namespace (hostname isolation)
sudo unshare --uts bash
hostname mycontainer
hostname   # shows "mycontainer"
\`\`\`

### Hands-On Practice

1. Use \`lsns\` to list all namespaces and identify which belong to containers
2. Run a Docker container and inspect its cgroup resource limits
3. Use \`unshare\` to create a PID namespace and observe isolated process view
4. Examine the overlay filesystem inside a Docker container

### Key Takeaways
- Containers are isolated processes, NOT virtual machines -- they share the host kernel
- Namespaces isolate what a process can see (PIDs, network, filesystem, hostname)
- cgroups limit what a process can consume (CPU, memory, I/O)
- Docker automates namespace creation, cgroup setup, and filesystem mounting
- OverlayFS provides efficient, layered filesystem storage for container images

### References & Further Reading
**Textbooks:**
1. "Docker Deep Dive" by Nigel Poulton -- Chapter 3: Containers Under the Hood, pages 35-65
2. "Kubernetes in Action, 2nd Edition" by Marko Luksa -- Chapter 2: First Steps with Docker, pages 25-55
3. "Understanding the Linux Kernel, 3rd Edition" by Bovet & Cesati -- Chapter 9: Process Scheduling, pages 300-330

**Online Resources:**
1. [Linux man page -- namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html)
2. [Linux man page -- cgroups(7)](https://man7.org/linux/man-pages/man7/cgroups.7.html)
3. [Docker documentation -- Container internals](https://docs.docker.com/engine/containers/container-lifecycle/)
4. [From Docker to Kernel](https://iximiuz.com/en/posts/from-docker-to-kernel/)`,
            questions: [
              { text: 'What are the two main Linux kernel features that make containers work?', answers: [{ text: 'Namespaces and cgroups', isCorrect: true }, { text: 'KVM and QEMU', isCorrect: false }, { text: 'LXC and LXD', isCorrect: false }, { text: 'OverlayFS and AUFS', isCorrect: false }] },
              { text: 'What does a PID namespace do?', answers: [{ text: 'Isolates the process ID number space so containers see their own PID 1', isCorrect: true }, { text: 'Limits the number of processes a container can run', isCorrect: false }, { text: 'Prevents processes from forking', isCorrect: false }, { text: 'Prioritizes process scheduling', isCorrect: false }] },
              { text: 'How do containers differ from virtual machines?', answers: [{ text: 'Containers share the host kernel; VMs have their own kernel', isCorrect: true }, { text: 'Containers are slower to start than VMs', isCorrect: false }, { text: 'VMs use less memory than containers', isCorrect: false }, { text: 'Containers run on a hypervisor', isCorrect: false }] },
              { text: 'What filesystem technology do containers typically use?', answers: [{ text: 'OverlayFS', isCorrect: true }, { text: 'ext4', isCorrect: false }, { text: 'NTFS', isCorrect: false }, { text: 'ZFS only', isCorrect: false }] },
              { text: 'Which Docker flag limits container memory usage?', answers: [{ text: '--memory', isCorrect: true }, { text: '--mem', isCorrect: false }, { text: '--ram', isCorrect: false }, { text: '--memory-limit', isCorrect: false }] },
              { text: 'What command creates namespaces without Docker?', answers: [{ text: 'unshare', isCorrect: true }, { text: 'nsenter', isCorrect: false }, { text: 'chroot', isCorrect: false }, { text: 'mount --bind', isCorrect: false }] },
              { text: 'Which namespace type isolates the hostname?', answers: [{ text: 'UTS namespace', isCorrect: true }, { text: 'PID namespace', isCorrect: false }, { text: 'IPC namespace', isCorrect: false }, { text: 'User namespace', isCorrect: false }] },
              { text: 'What does cgroup v2 provide over cgroups v1?', answers: [{ text: 'A single unified hierarchy for all resource controllers', isCorrect: true }, { text: 'Better performance for network I/O', isCorrect: false }, { text: 'Support for more than 256 CPUs', isCorrect: false }, { text: 'Automatic resource scaling', isCorrect: false }] },
            ],
          },

        ],
      },
    ],
  );

  // ═══════════════════════════════════════════════════════════════════
  // COURSE 6: Containerization & DevOps
  // ═══════════════════════════════════════════════════════════════════

  await createCourse(
    'Containerization & DevOps',
    'Master Docker, Docker Compose, and Kubernetes. Learn container architecture, Dockerfile best practices, networking, volumes, multi-service orchestration, and modern DevOps workflows from development to production.',
    [
      // ─── SECTION 1: Docker Mastery ───
      {
        title: 'Docker Mastery', order: 1,
        lessons: [

          {
            title: 'Docker Architecture', order: 1, labId: dockerLab?.id,
            content: `# Docker Architecture

### Learning Objectives
- Understand the client-server architecture of Docker
- Learn the role of the Docker daemon (dockerd), containerd, and runc
- Distinguish between Docker images, containers, and registries
- Understand the OCI (Open Container Initiative) standards

### Section 1: The Docker Client-Server Model

Docker uses a client-server architecture with three major components:

| Component | Role | Process |
|-----------|------|---------|
| **Docker CLI** (docker) | Client -- sends commands to the daemon | Your terminal |
| **Docker Daemon** (dockerd) | Server -- manages images, containers, networks, volumes | docker.service |
| **containerd** | Manages container runtime operations | containerd.service |
| **runc** | Low-level container runtime (creates containers) | Called by containerd |

When you run \`docker run nginx\`:

1. The CLI parses the command and sends an API request to the daemon via \`/var/run/docker.sock\`
2. The daemon checks if the nginx image exists locally; if not, pulls from Docker Hub
3. The daemon creates a new container with the specified configuration
4. The daemon delegates lifecycle management to **containerd**
5. **containerd** uses **runc** to create the container using kernel features (namespaces, cgroups)
6. runc exits after creating the container; containerd manages its lifecycle

\`\`\`bash
# The Docker socket
ls -la /var/run/docker.sock
# srw-rw---- 1 root docker 0 ... /var/run/docker.sock

# Communicate with the daemon via the API
curl --unix-socket /var/run/docker.sock http://localhost/version
\`\`\`

### Section 2: Docker Images

A Docker image is a read-only template containing everything needed to run a container. Images are built in **layers**:

\`\`\`dockerfile
FROM ubuntu:22.04           # Layer 1: Base OS
RUN apt-get update && \     # Layer 2: Installed packages
    apt-get install -y nginx
COPY nginx.conf /etc/nginx/ # Layer 3: Config file
COPY . /usr/share/nginx/    # Layer 4: Application code
EXPOSE 80                   # Metadata (no layer)
CMD ["nginx", "-g", "daemon off;"]  # Metadata (no layer)
\`\`\`

Benefits of layering:
- **Efficient storage**: Common layers shared between images
- **Faster pulls**: Only changed layers need downloading
- **Cache**: Build steps cached -- only rebuild after changes

\`\`\`bash
docker history nginx:latest  # View image layers
docker inspect nginx:latest  # Inspect image details
\`\`\`

### Section 3: Docker Registries

\`\`\`bash
docker pull nginx:latest                # Docker Hub (default)
docker push myrepo/myapp:latest         # Push to Docker Hub
docker pull registry.example.com/myapp  # Private registry
docker images                           # List local images
\`\`\`

### Section 4: Docker Containers

\`\`\`bash
docker run -d --name web -p 8080:80 nginx:latest  # Run a container
docker ps                 # List running containers
docker ps -a              # List all containers
docker logs web           # View container logs
docker exec -it web bash  # Execute commands inside
docker stop web && docker rm web  # Stop and remove
\`\`\`

### Section 5: The OCI Standards

| Specification | Purpose |
|---------------|---------|
| **Runtime Specification** | Defines how to run a container (runc implements this) |
| **Image Specification** | Defines the image format (layers, manifest, config) |
| **Distribution Specification** | Defines the API for pushing/pulling images |

### Hands-On Practice

1. Run \`docker version\` and identify client and server versions
2. Pull two nginx tags and compare layers with \`docker history\`
3. Run a container, execute a command inside it, observe the writable layer
4. Use \`curl\` with the Docker socket to query the Docker API

### Key Takeaways
- Docker uses client-server architecture with CLI, daemon, containerd, and runc
- Images are read-only, layered templates; containers add a writable layer
- Registries store and distribute images; Docker Hub is the default
- OCI standards ensure container portability across runtimes
- The Docker socket (/var/run/docker.sock) is the API entry point

### References & Further Reading
**Textbooks:**
1. "Docker Deep Dive" by Nigel Poulton -- Chapters 1-2: Architecture and Images, pages 1-34
2. "Docker: Up & Running, 3rd Edition" by Sean Kane & Karl Matthias -- Chapter 2: Docker Architecture, pages 25-55
3. "Container Security" by Liz Rice -- Chapter 2: How Containers Work, pages 25-55

**Online Resources:**
1. [Docker Architecture documentation](https://docs.docker.com/get-started/docker-overview/)
2. [OCI -- Open Container Initiative](https://opencontainers.org/)
3. [Docker Engine API reference](https://docs.docker.com/engine/api/)`,
            questions: [
              { text: 'What is the role of containerd in Docker architecture?', answers: [{ text: 'Manages container runtime operations and delegates to runc', isCorrect: true }, { text: 'Provides the Docker CLI interface', isCorrect: false }, { text: 'Stores container images', isCorrect: false }, { text: 'Manages Docker networking only', isCorrect: false }] },
              { text: 'Why are Docker images built in layers?', answers: [{ text: 'To enable efficient storage, caching, and incremental updates', isCorrect: true }, { text: 'To ensure each layer is encrypted', isCorrect: false }, { text: 'Because the OCI specification requires exactly 5 layers', isCorrect: false }, { text: 'To prevent multiple containers from sharing base images', isCorrect: false }] },
              { text: 'Where does the Docker daemon listen for API requests by default?', answers: [{ text: '/var/run/docker.sock', isCorrect: true }, { text: '/etc/docker/daemon.json', isCorrect: false }, { text: '/var/lib/docker/containers', isCorrect: false }, { text: 'TCP port 2375 only', isCorrect: false }] },
              { text: 'What is the difference between a Docker image and a container?', answers: [{ text: 'An image is a read-only template; a container is a running instance', isCorrect: true }, { text: 'They are the same thing', isCorrect: false }, { text: 'A container is read-only; an image is writable', isCorrect: false }, { text: 'An image runs on Kubernetes; a container runs on Docker', isCorrect: false }] },
              { text: 'Which OCI specification defines how to run a container?', answers: [{ text: 'Runtime Specification', isCorrect: true }, { text: 'Image Specification', isCorrect: false }, { text: 'Distribution Specification', isCorrect: false }, { text: 'Network Specification', isCorrect: false }] },
              { text: 'What tool does containerd use to create the container process?', answers: [{ text: 'runc', isCorrect: true }, { text: 'Docker CLI', isCorrect: false }, { text: 'iptables', isCorrect: false }, { text: 'systemd', isCorrect: false }] },
            ],
          },


          {
            title: 'Dockerfile Best Practices', order: 2,
            content: `# Dockerfile Best Practices

### Learning Objectives
- Write efficient Dockerfiles that produce small, secure images
- Understand layer caching and how to optimize build order
- Implement multi-stage builds to reduce final image size
- Follow security best practices for Docker image creation

### Section 1: Dockerfile Instructions Reference

| Instruction | Purpose | Example |
|-------------|---------|---------|
| FROM | Base image | \`FROM ubuntu:22.04\` |
| RUN | Execute commands during build | \`RUN apt-get update && apt-get install -y curl\` |
| COPY | Copy files from build context | \`COPY . /app/\` |
| CMD | Default command for the container | \`CMD ["python", "app.py"]\` |
| ENTRYPOINT | Fixed executable for the container | \`ENTRYPOINT ["nginx", "-g", "daemon off;"]\` |
| ENV | Set environment variables | \`ENV NODE_ENV=production\` |
| WORKDIR | Set working directory | \`WORKDIR /app\` |
| USER | Set the user for subsequent instructions | \`USER appuser\` |
| HEALTHCHECK | Define container health check | \`HEALTHCHECK CMD curl -f http://localhost/\` |

### Section 2: Layer Caching and Build Order

Docker caches each layer. Instruction order dramatically affects build speed:

\`\`\`dockerfile
# BAD -- Every code change reinstalls all dependencies
COPY . /app/
RUN npm install

# GOOD -- Dependencies change less frequently than code
COPY package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --production
COPY . /app/
\`\`\`

Key insight: **put instructions that change infrequently BEFORE instructions that change frequently**.

### Section 3: Multi-Stage Builds

\`\`\`dockerfile
# Stage 1: Build
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
\`\`\`

Benefits: Build tools NOT in final image. Final image might be 100 MB instead of 1 GB.

### Section 4: Minimizing Image Size

\`\`\`dockerfile
FROM node:20-alpine
# Combine RUN commands and clean up in the same layer
RUN apk add --no-cache python3 make g++ && \
    npm install && \
    apk del python3 make g++
\`\`\`

Use \`.dockerignore\` to exclude unnecessary files:
\`\`\`
.git
node_modules
*.md
.env
\`\`\`

### Section 5: Security Best Practices

\`\`\`dockerfile
FROM node:20-alpine
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -D appuser
WORKDIR /app
COPY --chown=appuser:appgroup . .
RUN npm ci --production
USER appuser
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["node", "index.js"]
\`\`\`

| Practice | Why |
|----------|-----|
| Don't run as root | Limits damage if container is compromised |
| Use specific version tags | Prevents unexpected changes from :latest |
| Scan for vulnerabilities | Use docker scout or Trivy to find CVEs |
| Minimize installed packages | Fewer packages = fewer attack vectors |
| Use .dockerignore | Prevents secrets from being copied into image |

### Hands-On Practice

1. Write a Dockerfile for a simple Node.js app and build it
2. Implement a multi-stage build and compare image sizes
3. Add a non-root user and verify with \`docker exec\`
4. Create a .dockerignore and verify excluded files are not in the build

### Key Takeaways
- Order Dockerfile instructions from least to most frequently changing
- Multi-stage builds dramatically reduce final image size
- Never run containers as root in production
- Use specific version tags, not :latest
- .dockerignore keeps the build context clean

### References & Further Reading
**Textbooks:**
1. "Docker Deep Dive" by Nigel Poulton -- Chapter 5: Docker Images, pages 75-110
2. "Docker: Up & Running, 3rd Edition" -- Chapter 5: Packaging Software, pages 115-150
3. "Container Security" by Liz Rice -- Chapter 6: Securing Container Images, pages 105-125

**Online Resources:**
1. [Dockerfile reference](https://docs.docker.com/engine/reference/builder/)
2. [Best practices for writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
3. [Docker Scout vulnerability scanning](https://docs.docker.com/scout/)`,
            questions: [
              { text: 'Why should infrequently-changing instructions come before frequently-changing ones?', answers: [{ text: 'Docker caches each layer, so later layers are reused if earlier ones are unchanged', isCorrect: true }, { text: 'Docker builds from the last instruction first', isCorrect: false }, { text: 'Earlier instructions use less memory', isCorrect: false }, { text: 'The daemon processes instructions in reverse order', isCorrect: false }] },
              { text: 'What is the main benefit of multi-stage builds?', answers: [{ text: 'The final image contains only runtime dependencies, not build tools', isCorrect: true }, { text: 'Multi-stage builds run faster', isCorrect: false }, { text: 'They allow using multiple base images', isCorrect: false }, { text: 'They automatically scan for vulnerabilities', isCorrect: false }] },
              { text: 'Why should you avoid running containers as root?', answers: [{ text: 'If compromised, root access could allow escaping to the host', isCorrect: true }, { text: 'Root processes run slower', isCorrect: false }, { text: 'Docker Hub rejects root images', isCorrect: false }, { text: 'Root users cannot access the network', isCorrect: false }] },
              { text: 'What is the purpose of a .dockerignore file?', answers: [{ text: 'Exclude files from the build context sent to the daemon', isCorrect: true }, { text: 'Ignore errors during the build', isCorrect: false }, { text: 'Hide environment variables', isCorrect: false }, { text: 'Disable Docker layer caching', isCorrect: false }] },
              { text: 'What is the difference between CMD and ENTRYPOINT?', answers: [{ text: 'ENTRYPOINT defines the fixed executable; CMD provides default arguments', isCorrect: true }, { text: 'CMD runs during build; ENTRYPOINT at runtime', isCorrect: false }, { text: 'There is no difference', isCorrect: false }, { text: 'ENTRYPOINT is for Compose; CMD for single containers', isCorrect: false }] },
              { text: 'Which HEALTHCHECK flag defines how often the check runs?', answers: [{ text: '--interval', isCorrect: true }, { text: '--frequency', isCorrect: false }, { text: '--timeout', isCorrect: false }, { text: '--retry', isCorrect: false }] },
            ],
          },


          {
            title: 'Docker Networking', order: 3,
            content: `# Docker Networking

### Learning Objectives
- Understand Docker's networking drivers: bridge, host, overlay, macvlan, none
- Configure container networking for single-host scenarios
- Use Docker DNS for inter-container communication
- Map ports between host and container environments

### Section 1: Docker Network Drivers

| Driver | Description | Use Case |
|--------|-------------|----------|
| **bridge** | Default. Private network on the host. Containers get their own IPs. | Most single-host setups |
| **host** | Container shares the host's network namespace. No isolation. | Performance-critical apps |
| **overlay** | Multi-host networking for Swarm services. | Docker Swarm |
| **macassign** | Assigns a MAC address to the container. | Legacy L2 requirements |
| **none** | Disables all networking. Only loopback. | Security-sensitive workloads |

\`\`\`bash
docker network ls             # List available networks
docker network inspect bridge # Inspect default bridge
\`\`\`

### Section 2: The Bridge Network (Default)

\`\`\`bash
# Run two containers on bridge
docker run -d --name web1 -p 8081:80 nginx
docker run -d --name web2 -p 8082:80 nginx

# Both get IPs on 172.17.0.0/16
docker inspect web1 | grep IPAddress

# Containers can ping each other by IP
docker exec web1 ping -c 2 172.17.0.3

# But NOT by name on default bridge (no DNS)
docker exec web1 ping -c 2 web2  # This will fail
\`\`\`

### Section 3: User-Defined Bridge Networks

Custom bridge networks provide automatic DNS resolution:

\`\`\`bash
docker network create mynetwork
docker run -d --name web --network mynetwork nginx
docker run -d --name api --network mynetwork python:3.11

# Containers can ping each other BY NAME
docker exec api ping -c 2 web

# Disconnect and reconnect
docker network disconnect mynetwork web
docker network connect mynetwork web
\`\`\`

### Section 4: Port Mapping

\`\`\`bash
docker run -d -p 8080:80 nginx              # Map host:container
docker run -d -p 127.0.0.1:8080:80 nginx    # Specific host IP
docker run -d -P nginx                      # Random host port (uses EXPOSE)
docker run -d -p 80:80 -p 443:443 nginx     # Multiple ports
docker port web                             # View port mappings
\`\`\`

Syntax: \`-p [host_ip:]host_port:container_port[/protocol]\`

### Section 5: The Host Network

\`\`\`bash
docker run -d --network host nginx
# Nginx listens on port 80 on the host directly
# No port mapping needed -- no NAT overhead
curl http://localhost:80
\`\`\`

### Section 6: DNS and Service Discovery

\`\`\`bash
docker network create appnet
docker run -d --name db --network appnet -e POSTGRES_PASSWORD=secret postgres:15
docker run -d --name myapp --network appnet -e DB_HOST=db myapp:latest
# Inside myapp: "db" resolves to the container's IP via Docker DNS (127.0.0.11)
\`\`\`

### Hands-On Practice

1. Create a user-defined bridge network and verify DNS resolution between containers
2. Map a container port to a specific host IP
3. Run a container in host mode and compare performance with bridge mode
4. Connect a container to two different networks simultaneously

### Key Takeaways
- Bridge is the default; user-defined bridges add automatic DNS
- Host mode shares the host network namespace for maximum performance
- Port mapping (-p) connects host ports to container ports
- Container name DNS only works on user-defined networks
- overlay networks enable multi-host communication in Swarm

### References & Further Reading
**Textbooks:**
1. "Docker Deep Dive" by Nigel Poulton -- Chapter 8: Docker Networking, pages 155-190
2. "Docker: Up & Running, 3rd Edition" -- Chapter 8: Advanced Networking, pages 215-250
3. "Networking and Virtualization" by David Varn -- Chapter 1: Network Fundamentals

**Online Resources:**
1. [Docker networking overview](https://docs.docker.com/network/)
2. [Linux man page -- bridge(8)](https://man7.org/linux/man-pages/man8/bridge.8.html)
3. [Docker network drivers](https://docs.docker.com/network/drivers/)`,
            questions: [
              { text: 'Which Docker network driver provides automatic DNS resolution?', answers: [{ text: 'User-defined bridge network', isCorrect: true }, { text: 'Default bridge network', isCorrect: false }, { text: 'Host network', isCorrect: false }, { text: 'None network', isCorrect: false }] },
              { text: 'What happens with --network host?', answers: [{ text: 'Container shares the host network namespace directly with no isolation', isCorrect: true }, { text: 'It gets a dedicated namespace separate from host', isCorrect: false }, { text: 'It cannot communicate with other containers', isCorrect: false }, { text: 'Port mapping is automatically configured', isCorrect: false }] },
              { text: 'What is the syntax for mapping host port 9090 to container port 80?', answers: [{ text: '-p 9090:80', isCorrect: true }, { text: '-p 80:9090', isCorrect: false }, { text: '--port 9090->80', isCorrect: false }, { text: '-P 80,9090', isCorrect: false }] },
              { text: 'Which command creates a user-defined bridge network?', answers: [{ text: 'docker network create mynetwork', isCorrect: true }, { text: 'docker network --create mynetwork', isCorrect: false }, { text: 'docker create --network mynetwork', isCorrect: false }, { text: 'docker init --network mynetwork', isCorrect: false }] },
              { text: 'Why does DNS not work on the default bridge network?', answers: [{ text: 'The default bridge does not have an embedded DNS server enabled', isCorrect: true }, { text: 'DNS is disabled for security reasons', isCorrect: false }, { text: 'Default bridge only supports IPv6', isCorrect: false }, { text: 'You must install dnsmasq first', isCorrect: false }] },
              { text: 'What is the Docker embedded DNS server address inside containers?', answers: [{ text: '127.0.0.11', isCorrect: true }, { text: '8.8.8.8', isCorrect: false }, { text: '127.0.0.1', isCorrect: false }, { text: '172.17.0.1', isCorrect: false }] },
            ],
          },


          {
            title: 'Docker Volumes & Storage', order: 4,
            content: `# Docker Volumes & Storage

### Learning Objectives
- Understand the three types of Docker storage: volumes, bind mounts, and tmpfs
- Create and manage Docker volumes for persistent data
- Configure bind mounts for development workflows
- Understand the storage drivers and overlay filesystem

### Section 1: Storage Types

| Type | Description | Persistence | Use Case |
|------|-------------|-------------|----------|
| **Volumes** | Managed by Docker, stored in /var/lib/docker/volumes/ | Persistent | Databases, production data |
| **Bind mounts** | Map a host directory into the container | Depends on host | Development, config files |
| **tmpfs** | Stored in memory only | Ephemeral | Sensitive data, caches |

\`\`\`bash
# Volumes (recommended for most use cases)
docker volume create mydata
docker run -d -v mydata:/var/lib/mysql mysql:8

# Bind mounts
docker run -d -v $(pwd)/src:/app/src node:20 npm start

# tmpfs (memory only)
docker run --tmpfs /tmp:rw,size=100m alpine
\`\`\`

### Section 2: Docker Volumes

\`\`\`bash
# Create a volume
docker volume create mydata

# List volumes
docker volume ls

# Inspect a volume
docker volume inspect mydata
# {
#   "Mountpoint": "/var/lib/docker/volumes/mydata/_data",
#   "Labels": {},
#   "Scope": "local"
# }

# Use a volume
docker run -d --name db -v mydata:/var/lib/mysql mysql:8

# Remove a volume
docker volume rm mydata

# Prune unused volumes
docker volume prune
\`\`\`

### Section 3: Bind Mounts

\`\`\`bash
# Mount current directory into container
docker run -v $(pwd):/app -w /app node:20 npm start

# Read-only bind mount
docker run -v $(pwd)/config:/etc/app/config:ro myapp

# With specific ownership
docker run -v $(pwd):/app -u $(id -u):$(id -g) node:20 npm start
\`\`\`

### Section 4: Named vs Anonymous Volumes

\`\`\`bash
# Named volume (recommended)
docker run -v mydata:/var/lib/mysql mysql:8

# Anonymous volume (auto-generated name)
docker run -v /var/lib/mysql mysql:8

# Read-only volume from Dockerfile
# VOLUME ["/var/log"]
\`\`\`

### Section 5: Backup and Migration

\`\`\`bash
# Backup a volume
docker run --rm -v mydata:/source -v $(pwd):/backup \
  alpine tar czf /backup/mydata-backup.tar.gz -C /source .

# Restore a volume
docker volume create mydata_restored
docker run --rm -v mydata_restored:/target -v $(pwd):/backup \
  alpine tar xzf /backup/mydata-backup.tar.gz -C /target
\`\`\`

### Hands-On Practice

1. Create a named volume, mount it in a container, write data, then verify persistence after container removal
2. Set up a bind mount for live development with a Node.js application
3. Backup a database volume using the tar approach
4. Compare \`docker volume ls\` before and after creating volumes

### Key Takeaways
- Volumes are the preferred way to persist data in Docker
- Bind mounts are ideal for development where you need live code changes
- tmpfs mounts store data in memory only (ephemeral)
- Always use named volumes over anonymous volumes for manageability
- Backup volumes by running a temporary container with tar

### References & Further Reading
**Textbooks:**
1. "Docker Deep Dive" by Nigel Poulton -- Chapter 7: Docker Volumes, pages 135-155
2. "Docker: Up & Running, 3rd Edition" -- Chapter 6: Managing Data in Docker, pages 151-180
3. "Container Storage" by Docker documentation -- Storage drivers overview

**Online Resources:**
1. [Docker storage overview](https://docs.docker.com/storage/)
2. [Docker volumes documentation](https://docs.docker.com/storage/volumes/)
3. [Docker bind mounts](https://docs.docker.com/storage/bind-mounts/)`,
            questions: [
              { text: 'Which Docker storage type is recommended for persistent production data?', answers: [{ text: 'Volumes', isCorrect: true }, { text: 'Bind mounts', isCorrect: false }, { text: 'tmpfs', isCorrect: false }, { text: 'Layer storage', isCorrect: false }] },
              { text: 'What is the difference between a named volume and a bind mount?', answers: [{ text: 'Volumes are managed by Docker; bind mounts map a specific host path', isCorrect: true }, { text: 'Volumes are faster than bind mounts', isCorrect: false }, { text: 'Bind mounts persist after container removal; volumes do not', isCorrect: false }, { text: 'There is no difference', isCorrect: false }] },
              { text: 'Where are Docker volumes stored on the host?', answers: [{ text: '/var/lib/docker/volumes/', isCorrect: true }, { text: '/tmp/docker/', isCorrect: false }, { text: '/opt/docker/data/', isCorrect: false }, { text: '/etc/docker/volumes/', isCorrect: false }] },
              { text: 'How do you make a bind mount read-only?', answers: [{ text: 'Add :ro to the end of the mount specification', isCorrect: true }, { text: 'Use the --readonly flag', isCorrect: false }, { text: 'Set the volume mode to read-only in the Dockerfile', isCorrect: false }, { text: 'Bind mounts cannot be read-only', isCorrect: false }] },
              { text: 'What type of mount stores data in memory only?', answers: [{ text: 'tmpfs', isCorrect: true }, { text: 'Volume', isCorrect: false }, { text: 'Bind mount', isCorrect: false }, { text: 'Overlay mount', isCorrect: false }] },
              { text: 'How do you backup a Docker volume?', answers: [{ text: 'Run a temporary container that tars the volume contents to a host directory', isCorrect: true }, { text: 'Use docker volume backup command', isCorrect: false }, { text: 'Copy /var/lib/docker/volumes/ directly', isCorrect: false }, { text: 'Volumes cannot be backed up', isCorrect: false }] },
            ],
          },

        ],
      },
      // ─── SECTION 2: Docker Compose ───
      {
        title: 'Docker Compose', order: 2,
        lessons: [

          {
            title: 'Compose File Deep Dive', order: 5,
            content: `# Compose File Deep Dive

### Learning Objectives
- Understand the structure and syntax of docker-compose.yml
- Define services, networks, and volumes in a Compose file
- Use environment variables, .env files, and variable substitution
- Master Compose file features: depends_on, healthcheck, profiles

### Section 1: Compose File Structure

\`\`\`yaml
version: "3.9"

services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html:ro
    networks:
      - frontend
    depends_on:
      api:
        condition: service_healthy

  api:
    build: ./api
    environment:
      - DB_HOST=db
      - DB_PORT=5432
    networks:
      - frontend
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  db:
    image: postgres:15
    volumes:
      - dbdata:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: secret
    networks:
      - backend

volumes:
  dbdata:

networks:
  frontend:
  backend:
\`\`\`

### Section 2: Service Configuration

| Key | Description |
|-----|-------------|
| \`image\` | Use an existing image |
| \`build\` | Build from a Dockerfile |
| \`ports\` | Port mappings |
| \`volumes\` | Volume mounts |
| \`environment\` | Environment variables (list or map) |
| \`env_file\` | Load env vars from a file |
| \`depends_on\` | Service startup dependencies |
| \`restart\` | Restart policy (no, always, on-failure, unless-stopped) |
| \`command\` | Override the default CMD |
| \`healthcheck\` | Container health check definition |

### Section 3: Environment Variables

\`\`\`yaml
services:
  api:
    # List format
    environment:
      - DB_HOST=db
      - DB_PORT=5432

    # Map format
    environment:
      DB_HOST: db
      DB_PORT: 5432

    # Load from file
    env_file:
      - .env
      - .env.local
\`\`\`

Variable substitution from shell or .env file:

\`\`\`yaml
services:
  web:
    image: nginx:\${NGINX_VERSION:-alpine}
    ports:
      - "\${HOST_PORT:-8080}:80"
\`\`\`

### Section 4: depends_on and Healthchecks

\`\`\`yaml
services:
  api:
    depends_on:
      db:
        condition: service_healthy   # Wait for healthcheck
      redis:
        condition: service_started   # Just wait for start

  db:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
\`\`\`

### Section 5: Profiles

\`\`\`yaml
services:
  web:
    image: nginx:alpine
    # No profile -- always starts

  debug:
    image: busybox
    profiles:
      - debug    # Only starts with --profile debug

  test:
    image: alpine
    profiles:
      - test     # Only starts with --profile test
\`\`\`

\`\`\`bash
docker compose up               # Starts only 'web'
docker compose --profile debug up  # Starts 'web' and 'debug'
\`\`\`

### Hands-On Practice

1. Create a Compose file with a web server, API, and database
2. Configure healthchecks for the API service
3. Use variable substitution with a .env file
4. Set up profiles for debug and test services

### Key Takeaways
- Compose files define multi-container applications declaratively
- Use depends_on with service_healthy for proper startup ordering
- Environment variables can be set inline, via env_file, or .env substitution
- Profiles allow conditional service startup
- Named volumes ensure data persistence across container restarts

### References & Further Reading
**Textbooks:**
1. "Docker Deep Dive" by Nigel Poulton -- Chapter 10: Docker Compose, pages 210-240
2. "Docker: Up & Running, 3rd Edition" -- Chapter 9: Docker Compose, pages 251-285
3. "Kubernetes in Action, 2nd Edition" -- Chapter 2: Docker basics review, pages 25-55

**Online Resources:**
1. [Compose file reference](https://docs.docker.com/compose/compose-file/)
2. [Compose specification](https://docs.docker.com/compose/compose-file/04-version-and-name/)
3. [Docker Compose documentation](https://docs.docker.com/compose/)`,
            questions: [
              { text: 'What does the depends_on directive with condition: service_healthy do?', answers: [{ text: 'Waits for the dependency to pass its healthcheck before starting', isCorrect: true }, { text: 'Starts the dependency first, then the current service', isCorrect: false }, { text: 'Only starts if the dependency is already running', isCorrect: false }, { text: 'Prevents the dependency from being stopped', isCorrect: false }] },
              { text: 'How do you load environment variables from a file in Compose?', answers: [{ text: 'env_file directive', isCorrect: true }, { text: 'environment_file', isCorrect: false }, { text: 'load_env', isCorrect: false }, { text: 'include_env', isCorrect: false }] },
              { text: 'What is the purpose of Docker Compose profiles?', answers: [{ text: 'To conditionally start services based on which profile is active', isCorrect: true }, { text: 'To configure different network profiles', isCorrect: false }, { text: 'To set performance profiles for containers', isCorrect: false }, { text: 'To define deployment stages', isCorrect: false }] },
              { text: 'How do you specify a default value for variable substitution?', answers: [{ text: '\${VAR:-default}', isCorrect: true }, { text: '\${VAR=default}', isCorrect: false }, { text: '\${VAR:=default}', isCorrect: false }, { text: '\${VAR | default}', isCorrect: false }] },
              { text: 'What is the correct way to define a named volume in Compose?', answers: [{ text: 'Under the top-level volumes: key', isCorrect: true }, { text: 'Inside each service definition only', isCorrect: false }, { text: 'In a separate volumes.yml file', isCorrect: false }, { text: 'Using docker volume create before compose up', isCorrect: false }] },
              { text: 'Which Compose directive allows overriding the container CMD?', answers: [{ text: 'command', isCorrect: true }, { text: 'entrypoint', isCorrect: false }, { text: 'run', isCorrect: false }, { text: 'exec', isCorrect: false }] },
            ],
          },


          {
            title: 'Multi-service Applications', order: 6,
            content: `# Multi-service Applications

### Learning Objectives
- Design and implement a multi-service application stack
- Configure service dependencies and communication patterns
- Use Docker Compose to manage complex application topologies
- Implement service scaling and load balancing

### Section 1: Application Stack Architecture

A typical web application stack:

| Service | Technology | Ports | Networks |
|---------|-----------|-------|----------|
| Frontend | nginx / React | 80/443 | frontend |
| API Server | Node.js / Python | 3000 | frontend, backend |
| Database | PostgreSQL | 5432 | backend |
| Cache | Redis | 6379 | backend |
| Worker | Background jobs | -- | backend |

### Section 2: Complete Stack Example

\`\`\`yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
      - "443:443"
    networks:
      - frontend
    depends_on:
      - api

  api:
    build: ./api
    environment:
      DATABASE_URL: postgres://admin:secret@db:5432/myapp
      REDIS_URL: redis://cache:6379
    networks:
      - frontend
      - backend
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started

  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d myapp"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - backend

  cache:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    networks:
      - backend

volumes:
  pgdata:
  redisdata:

networks:
  frontend:
  backend:
\`\`\`

### Section 3: Service Communication

Services communicate using their service name as hostname:

\`\`\`bash
# API connects to database using "db" hostname
DATABASE_URL=postgres://admin:secret@db:5432/myapp

# Frontend connects to API using "api" hostname
# In nginx.conf: proxy_pass http://api:3000;
\`\`\`

### Section 4: Scaling Services

\`\`\`bash
# Scale a service to 3 replicas
docker compose up -d --scale api=3

# Load balancer distributes traffic across replicas
# Note: ports conflict when scaling -- use different host ports or omit
\`\`\`

\`\`\`yaml
services:
  api:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 256M
\`\`\`

### Section 5: Service Logging

\`\`\`bash
# View logs for all services
docker compose logs

# Follow logs for specific service
docker compose logs -f api

# View last 100 lines
docker compose logs --tail=100 db
\`\`\`

### Hands-On Practice

1. Build a complete stack: frontend, API, database, and cache
2. Configure service dependencies so the API waits for the database
3. Scale the API service to 3 replicas
4. Use \`docker compose logs\` to troubleshoot service issues

### Key Takeaways
- Services communicate using their service name as DNS hostname
- Use depends_on with healthchecks for proper startup ordering
- Scale services with --scale or deploy.replicas
- Named networks provide service isolation and DNS resolution
- Docker Compose manages the full application lifecycle

### References & Further Reading
**Textbooks:**
1. "Docker Deep Dive" by Nigel Poulton -- Chapter 10: Docker Compose, pages 210-240
2. "Docker: Up & Running, 3rd Edition" -- Chapter 9: Docker Compose, pages 251-285
3. "Microservices with Docker, Flask, and React" by testdriven.io -- Multi-service architecture

**Online Resources:**
1. [Docker Compose networking](https://docs.docker.com/compose/networking/)
2. [Compose file services reference](https://docs.docker.com/compose/compose-file/05-services/)
3. [Scaling services with Compose](https://docs.docker.com/compose/reference/up/)`,
            questions: [
              { text: 'How do services communicate with each other in Docker Compose?', answers: [{ text: 'Using the service name as a DNS hostname', isCorrect: true }, { text: 'Using localhost with different ports', isCorrect: false }, { text: 'Using IP addresses from docker inspect', isCorrect: false }, { text: 'Using shared memory', isCorrect: false }] },
              { text: 'How do you scale a service to multiple replicas?', answers: [{ text: 'docker compose up --scale api=3', isCorrect: true }, { text: 'docker compose scale api=3', isCorrect: false }, { text: 'docker compose replicas api=3', isCorrect: false }, { text: 'docker scale api=3', isCorrect: false }] },
              { text: 'What is required for services on different Compose networks to communicate?', answers: [{ text: 'The service must be connected to a common network', isCorrect: true }, { text: 'They must use the same port', isCorrect: false }, { text: 'They must use host networking', isCorrect: false }, { text: 'Communication is always possible by default', isCorrect: false }] },
              { text: 'How do you view logs for a specific service in Compose?', answers: [{ text: 'docker compose logs -f <service>', isCorrect: true }, { text: 'docker logs <service>', isCorrect: false }, { text: 'docker compose tail <service>', isCorrect: false }, { text: 'docker compose status <service>', isCorrect: false }] },
              { text: 'What does deploy.resources.limits achieve?', answers: [{ text: 'Sets maximum CPU and memory a container can use', isCorrect: true }, { text: 'Reserves minimum resources for a container', isCorrect: false }, { text: 'Sets the number of replicas', isCorrect: false }, { text: 'Configures auto-scaling thresholds', isCorrect: false }] },
            ],
          },


          {
            title: 'Dev vs Production Configs', order: 7,
            content: `# Dev vs Production Configs

### Learning Objectives
- Separate development and production Compose configurations
- Use Docker Compose override files for environment-specific settings
- Configure build vs image strategies for dev and production
- Implement secrets management for different environments

### Section 1: Compose File Merging

Docker Compose automatically merges multiple files:
- \`docker-compose.yml\` -- Base configuration
- \`docker-compose.override.yml\` -- Development overrides (auto-loaded)
- \`docker-compose.prod.yml\` -- Production overrides (explicit)

\`\`\`bash
# Development (auto-loads base + override)
docker compose up

# Production (explicit file selection)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
\`\`\`

### Section 2: Development Configuration

\`\`\`yaml
# docker-compose.yml (base)
services:
  api:
    build: ./api
    environment:
      - NODE_ENV=development
    volumes:
      - ./api/src:/app/src    # Live code reload
      - /app/node_modules     # Anonymous volume (don't overwrite)
    ports:
      - "3000:3000"

# docker-compose.override.yml (dev overrides)
services:
  api:
    command: npm run dev       # Use nodemon for hot reload
    environment:
      - DEBUG=app:*
    volumes:
      - ./api:/app            # Mount entire directory
\`\`\`

### Section 3: Production Configuration

\`\`\`yaml
# docker-compose.prod.yml
services:
  api:
    image: myregistry.com/api:1.0.0  # Pre-built image
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: "1.0"
          memory: 1G
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    ports: []   # No port mapping -- use reverse proxy

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/prod.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - api
\`\`\`

### Section 4: Secrets Management

\`\`\`yaml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt   # Development
    # In production, use external secrets:
    # external: true
\`\`\`

### Section 5: Environment-Specific Best Practices

| Aspect | Development | Production |
|--------|------------|------------|
| **Code mounting** | Bind mount for live reload | Pre-built image |
| **Debug tools** | Debug ports, verbose logging | Minimal, secure |
| **Resources** | Unlimited | Set limits |
| **Replicas** | 1 | Multiple |
| **Restart policy** | no | unless-stopped |
| **Healthchecks** | Optional | Required |
| **Secrets** | .env file | External secrets manager |

### Hands-On Practice

1. Create a base Compose file and separate dev/prod override files
2. Use volume mounts for live code reload in development
3. Configure resource limits and replicas for production
4. Implement secrets management with Docker secrets

### Key Takeaways
- Use docker-compose.override.yml for automatic dev configuration
- Use explicit -f flags for production Compose files
- Development uses bind mounts; production uses pre-built images
- Production requires healthchecks, resource limits, and restart policies
- Keep secrets out of Docker images; use Docker secrets or environment files

### References & Further Reading
**Textbooks:**
1. "Docker Deep Dive" by Nigel Poulton -- Chapter 10: Docker Compose, pages 210-240
2. "Docker: Up & Running, 3rd Edition" -- Chapter 10: Docker in Production, pages 287-320
3. "The Docker Handbook" by freeCodeCamp -- Multi-environment setups

**Online Resources:**
1. [Compose merge rules](https://docs.docker.com/compose/extends/#multiple-compose-files)
2. [Compose profiles documentation](https://docs.docker.com/compose/profiles/)
3. [Docker secrets documentation](https://docs.docker.com/engine/swarm/secrets/)`,
            questions: [
              { text: 'Which file is automatically loaded by Docker Compose as an override?', answers: [{ text: 'docker-compose.override.yml', isCorrect: true }, { text: 'docker-compose.override.yaml', isCorrect: false }, { text: 'docker-compose.dev.yml', isCorrect: false }, { text: 'compose-override.yml', isCorrect: false }] },
              { text: 'How do you explicitly specify multiple Compose files for production?', answers: [{ text: 'docker compose -f docker-compose.yml -f docker-compose.prod.yml up', isCorrect: true }, { text: 'docker compose --prod up', isCorrect: false }, { text: 'docker compose --env=prod up', isCorrect: false }, { text: 'docker compose --files prod.yml up', isCorrect: false }] },
              { text: 'Why use anonymous volumes for node_modules in development?', answers: [{ text: 'To prevent the host node_modules from overwriting the container node_modules', isCorrect: true }, { text: 'To speed up npm install', isCorrect: false }, { text: 'To enable hot reload', isCorrect: false }, { text: 'To reduce image size', isCorrect: false }] },
              { text: 'What is the key difference between dev and prod configurations?', answers: [{ text: 'Dev uses bind mounts for live reload; prod uses pre-built images', isCorrect: true }, { text: 'Dev requires more CPU than production', isCorrect: false }, { text: 'Production should never use healthchecks', isCorrect: false }, { text: 'Development should always use 3 replicas', isCorrect: false }] },
              { text: 'How should secrets be managed in production Docker Compose?', answers: [{ text: 'Use Docker secrets or external secrets manager, not environment files', isCorrect: true }, { text: 'Hard-code secrets in the Dockerfile', isCorrect: false }, { text: 'Store secrets in environment variables in the Compose file', isCorrect: false }, { text: 'Secrets are not needed in containers', isCorrect: false }] },
            ],
          },

        ],
      },
      // ─── SECTION 3: Orchestration Introduction ───
      {
        title: 'Orchestration Introduction', order: 3,
        lessons: [

          {
            title: 'Kubernetes Concepts', order: 8,
            content: `# Kubernetes Concepts

### Learning Objectives
- Understand the architecture of a Kubernetes cluster
- Learn the core Kubernetes objects: Pods, Deployments, Services, ConfigMaps
- Understand the control plane and worker node components
- Compare Docker Compose with Kubernetes for orchestration

### Section 1: Kubernetes Architecture

A Kubernetes cluster consists of a **control plane** and **worker nodes**:

| Component | Role |
|-----------|------|
| **API Server** | Front-end for the Kubernetes control plane (kubectl talks to this) |
| **etcd** | Distributed key-value store for all cluster data |
| **Scheduler** | Assigns newly created Pods to nodes |
| **Controller Manager** | Runs controller loops (replica, node, endpoint controllers) |
| **kubelet** | Agent on each worker node; manages Pods |
| **kube-proxy** | Maintains network rules on each node |

### Section 2: Core Kubernetes Objects

**Pod:**
The smallest deployable unit. A Pod wraps one or more containers:

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  containers:
    - name: web
      image: nginx:alpine
      ports:
        - containerPort: 80
    - name: sidecar
      image: busybox
      command: ["sh", "-c", "while true; do echo hello; sleep 5; done"]
\`\`\`

**Deployment:**
Manages replica sets and provides declarative updates:

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: myregistry.com/my-app:1.0
          ports:
            - containerPort: 3000
          resources:
            limits:
              memory: "256Mi"
              cpu: "500m"
            requests:
              memory: "128Mi"
              cpu: "250m"
\`\`\`

**Service:**
Exposes a set of Pods as a network service:

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP   # ClusterIP, NodePort, LoadBalancer
\`\`\`

**ConfigMap and Secret:**

\`\`\`yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DATABASE_HOST: db
  LOG_LEVEL: info

---
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
data:
  DB_PASSWORD: c2VjcmV0    # base64 encoded
\`\`\`

### Section 3: Control Plane vs Worker Nodes

| Control Plane | Worker Nodes |
|---------------|-------------|
| API Server | kubelet |
| etcd | kube-proxy |
| Scheduler | Container runtime |
| Controller Manager | Pod containers |

### Section 4: Kubernetes vs Docker Compose

| Feature | Docker Compose | Kubernetes |
|---------|---------------|------------|
| **Scope** | Single host | Multi-host cluster |
| **Scaling** | Manual --scale | Auto-scaling (HPA) |
| **Self-healing** | restart policy only | Restart, reschedule, reschedule |
| **Service discovery** | DNS (single host) | DNS (cluster-wide) |
| **Load balancing** | Round-robin | Service-level load balancing |
| **Rolling updates** | Manual | Built-in with zero downtime |

### Hands-On Practice

1. Identify the components of a Kubernetes cluster using \`kubectl cluster-info\`
2. Create a Deployment with 3 replicas and verify with \`kubectl get pods\`
3. Expose the Deployment as a Service and access it via ClusterIP
4. Update the Deployment image and observe rolling update behavior

### Key Takeaways
- Kubernetes manages containerized applications across clusters of machines
- Pods are the smallest deployable unit; Deployments manage replica sets
- Services provide stable network endpoints for accessing Pods
- ConfigMaps and Secrets manage configuration and sensitive data
- Kubernetes provides self-healing, auto-scaling, and rolling updates

### References & Further Reading
**Textbooks:**
1. "Kubernetes in Action, 2nd Edition" by Marko Luksa -- Chapters 1-3: Architecture and core concepts, pages 1-90
2. "Kubernetes: Up and Running, 3rd Edition" by Burns, Beda & Hightower -- Chapters 1-4
3. "The Kubernetes Book" by Nigel Poulton -- Chapters 1-3: Kubernetes fundamentals

**Online Resources:**
1. [Kubernetes documentation](https://kubernetes.io/docs/)
2. [Kubernetes concepts overview](https://kubernetes.io/docs/concepts/)
3. [Minikube -- local Kubernetes](https://minikube.sigs.k8s.io/docs/)`,
            questions: [
              { text: 'What is the smallest deployable unit in Kubernetes?', answers: [{ text: 'Pod', isCorrect: true }, { text: 'Container', isCorrect: false }, { text: 'Deployment', isCorrect: false }, { text: 'Node', isCorrect: false }] },
              { text: 'Which control plane component stores all cluster data?', answers: [{ text: 'etcd', isCorrect: true }, { text: 'API Server', isCorrect: false }, { text: 'Scheduler', isCorrect: false }, { text: 'Controller Manager', isCorrect: false }] },
              { text: 'What Kubernetes object exposes a set of Pods as a network service?', answers: [{ text: 'Service', isCorrect: true }, { text: 'Ingress', isCorrect: false }, { text: 'ConfigMap', isCorrect: false }, { text: 'Volume', isCorrect: false }] },
              { text: 'What is the main advantage of Kubernetes over Docker Compose?', answers: [{ text: 'Multi-host orchestration with auto-scaling and self-healing', isCorrect: true }, { text: 'Simpler configuration syntax', isCorrect: false }, { text: 'Better for single-host deployments', isCorrect: false }, { text: 'Faster container startup', isCorrect: false }] },
              { text: 'What does a Deployment manage?', answers: [{ text: 'ReplicaSets and provides declarative updates for Pods', isCorrect: true }, { text: 'Network policies for Pods', isCorrect: false }, { text: 'Storage volumes', isCorrect: false }, { text: 'Node health checks', isCorrect: false }] },
              { text: 'How do you store sensitive data in Kubernetes?', answers: [{ text: 'Using Secret objects (base64 encoded)', isCorrect: true }, { text: 'Hard-coded in Dockerfiles', isCorrect: false }, { text: 'In ConfigMap objects', isCorrect: false }, { text: 'In environment variables only', isCorrect: false }] },
              { text: 'Which kubelet component runs on each worker node?', answers: [{ text: 'The kubelet agent manages Pods on that node', isCorrect: true }, { text: 'The API server handles all requests', isCorrect: false }, { text: 'etcd stores node-specific data', isCorrect: false }, { text: 'The scheduler assigns Pods to this node', isCorrect: false }] },
            ],
          },


          {
            title: 'kubectl Operations', order: 9,
            content: `# kubectl Operations

### Learning Objectives
- Master essential kubectl commands for cluster management
- Create, inspect, update, and delete Kubernetes resources
- Debug applications using kubectl logs, exec, and describe
- Manage multiple namespaces and contexts

### Section 1: Cluster and Context Commands

\`\`\`bash
kubectl cluster-info                    # Cluster information
kubectl get nodes                       # List cluster nodes
kubectl config get-contexts             # List available contexts
kubectl config use-context minikube     # Switch context
kubectl config current-context          # Current context
\`\`\`

### Section 2: Resource Management (CRUD)

\`\`\`bash
# Create resources from a YAML file
kubectl apply -f deployment.yaml        # Create or update
kubectl create -f service.yaml          # Create only (fails if exists)

# List resources
kubectl get pods                        # List pods in current namespace
kubectl get pods -A                     # List pods in all namespaces
kubectl get deployments                 # List deployments
kubectl get services                    # List services
kubectl get all                         # List all resources

# Describe resources (detailed info)
kubectl describe pod my-pod             # Pod details
kubectl describe deployment my-app      # Deployment details

# Delete resources
kubectl delete -f deployment.yaml       # Delete from YAML
kubectl delete pod my-pod               # Delete by name
kubectl delete pods --all               # Delete all pods
\`\`\`

### Section 3: Debugging Commands

\`\`\`bash
# View logs
kubectl logs my-pod                     # Pod logs
kubectl logs my-pod -f                  # Follow logs (tail -f)
kubectl logs my-pod -c sidecar          # Logs from specific container
kubectl logs my-pod --previous          # Previous container logs

# Execute commands in a running Pod
kubectl exec -it my-pod -- bash         # Interactive shell
kubectl exec my-pod -- cat /etc/hosts   # Run a command

# Port forwarding
kubectl port-forward my-pod 8080:80     # Forward local 8080 to pod 80

# Resource usage
kubectl top pods                        # Pod resource usage
kubectl top nodes                       # Node resource usage
\`\`\`

### Section 4: Scaling and Updates

\`\`\`bash
# Scale a deployment
kubectl scale deployment my-app --replicas=5

# Update image (triggers rolling update)
kubectl set image deployment/my-app my-app=myregistry.com/my-app:2.0

# Check rollout status
kubectl rollout status deployment/my-app

# Rollback
kubectl rollout undo deployment/my-app
kubectl rollout history deployment/my-app
\`\`\`

### Section 5: Namespace Management

\`\`\`bash
kubectl get namespaces                  # List namespaces
kubectl create namespace staging        # Create namespace
kubectl get pods -n production          # Pods in specific namespace
kubectl config set-context --current --namespace=staging  # Set default namespace
\`\`\`

### Section 6: Debugging Pods

\`\`\`bash
# Check why a pod is not running
kubectl describe pod my-pod | grep -A 5 "Events:"

# Common pod statuses:
# Pending    -- Waiting to be scheduled
# Running    -- At least one container running
# Succeeded  -- All containers completed successfully
# Failed     -- At least one container failed
# CrashLoopBackOff -- Container keeps crashing

# Run a debug pod
kubectl run debug --rm -it --image=busybox -- sh
\`\`\`

### Hands-On Practice

1. Create a namespace called "dev" and switch to it
2. Deploy an nginx container and verify it is running
3. Scale the deployment to 3 replicas and observe
4. Update the nginx image and monitor the rolling update
5. Port-forward to the pod and access it from your browser

### Key Takeaways
- kubectl apply is the preferred way to create/update resources (idempotent)
- Use kubectl get, describe, and logs for debugging
- kubectl exec provides shell access to running containers
- Rolling updates enable zero-downtime deployments
- Namespaces provide logical isolation within a cluster

### References & Further Reading
**Textbooks:**
1. "Kubernetes in Action, 2nd Edition" by Marko Luksa -- Chapters 4-5: kubectl operations, pages 91-140
2. "Kubernetes: Up and Running, 3rd Edition" -- Chapter 2: Creating and Using Containers, pages 15-45
3. "The Kubernetes Book" by Nigel Poulton -- Chapter 4: kubectl

**Online Resources:**
1. [kubectl reference](https://kubernetes.io/docs/reference/kubectl/)
2. [kubectl cheat sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
3. [Debugging applications](https://kubernetes.io/docs/tasks/debug-application-cluster/)`  ,
            questions: [
              { text: 'What is the difference between kubectl apply and kubectl create?', answers: [{ text: 'apply is idempotent (create or update); create fails if resource exists', isCorrect: true }, { text: 'apply is faster than create', isCorrect: false }, { text: 'create supports YAML; apply does not', isCorrect: false }, { text: 'There is no difference', isCorrect: false }] },
              { text: 'How do you view logs from a specific container in a multi-container Pod?', answers: [{ text: 'kubectl logs <pod> -c <container>', isCorrect: true }, { text: 'kubectl logs <pod> --container <container>', isCorrect: false }, { text: 'kubectl logs <pod> <container>', isCorrect: false }, { text: 'kubectl describe logs <pod>', isCorrect: false }] },
              { text: 'What does CrashLoopBackOff indicate?', answers: [{ text: 'A container keeps crashing and restarting', isCorrect: true }, { text: 'The Pod is waiting to be scheduled', isCorrect: false }, { text: 'The container image cannot be pulled', isCorrect: false }, { text: 'The Pod has run out of memory', isCorrect: false }] },
              { text: 'How do you roll back a Deployment to the previous version?', answers: [{ text: 'kubectl rollout undo deployment/my-app', isCorrect: true }, { text: 'kubectl rollback deploy/my-app', isCorrect: false }, { text: 'kubectl undo deployment my-app', isCorrect: false }, { text: 'kubectl delete and recreate', isCorrect: false }] },
              { text: 'What command provides shell access to a running Pod?', answers: [{ text: 'kubectl exec -it <pod> -- bash', isCorrect: true }, { text: 'kubectl shell <pod>', isCorrect: false }, { text: 'kubectl attach <pod>', isCorrect: false }, { text: 'kubectl login <pod>', isCorrect: false }] },
              { text: 'How do you set the default namespace for kubectl commands?', answers: [{ text: 'kubectl config set-context --current --namespace=<ns>', isCorrect: true }, { text: 'kubectl set namespace <ns>', isCorrect: false }, { text: 'kubectl use namespace <ns>', isCorrect: false }, { text: 'export KUBERNETES_NAMESPACE=<ns>', isCorrect: false }] },
            ],
          },


          {
            title: 'Helm Charts', order: 10,
            content: `# Helm Charts

### Learning Objectives
- Understand what Helm is and why it exists
- Learn the structure of a Helm chart
- Install, upgrade, and rollback applications with Helm
- Create custom Helm charts with templates and values

### Section 1: What is Helm?

Helm is the **package manager for Kubernetes**. It simplifies deploying and managing complex applications:

| Concept | Description |
|---------|-------------|
| **Chart** | A package of pre-configured Kubernetes resources |
| **Repository** | A collection of charts (like apt/yum for Kubernetes) |
| **Release** | A specific deployment of a chart with a unique name |
| **Values** | Configuration that customizes a chart |

\`\`\`bash
# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Add a repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Search for charts
helm search repo nginx
\`\`\`

### Section 2: Installing Charts

\`\`\`bash
# Install a chart
helm install my-release bitnami/nginx

# Install with custom values
helm install my-release bitnami/nginx \
  --set service.type=NodePort \
  --set service.nodePort=30080

# Install with a values file
helm install my-release bitnami/nginx -f custom-values.yaml

# Install in a specific namespace
helm install my-release bitnami/nginx -n my-namespace --create-namespace
\`\`\`

### Section 3: Managing Releases

\`\`\`bash
# List installed releases
helm list
helm list -A    # All namespaces

# Get release status
helm status my-release

# View release history
helm history my-release

# Upgrade a release
helm upgrade my-release bitnami/nginx --set replicaCount=3

# Rollback a release
helm rollback my-release 1    # Rollback to revision 1

# Uninstall a release
helm uninstall my-release
\`\`\`

### Section 4: Chart Structure

\`\`\`
my-chart/
  Chart.yaml          # Chart metadata
  values.yaml         # Default configuration values
  templates/          # Kubernetes manifest templates
    deployment.yaml
    service.yaml
    ingress.yaml
    _helpers.tpl      # Template helper functions
    NOTES.txt         # Post-install notes
  charts/             # Dependency charts
  .helmignore         # Files to ignore
\`\`\`

### Section 5: Template Variables

\`\`\`yaml
# values.yaml
replicaCount: 2
image:
  repository: nginx
  tag: "1.25"
service:
  type: ClusterIP
  port: 80
resources:
  limits:
    cpu: 500m
    memory: 128Mi
\`\`\`

\`\`\`yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-chart.fullname" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ include "my-chart.fullname" . }}
  template:
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
\`\`\`

### Section 6: Creating a Custom Chart

\`\`\`bash
# Create a new chart
helm create my-chart

# Edit templates and values
vim my-chart/values.yaml
vim my-chart/templates/deployment.yaml

# Lint the chart
helm lint my-chart

# Template rendering (dry run)
helm template my-release my-chart

# Package the chart
helm package my-chart

# Install from local chart
helm install my-release ./my-chart
\`\`\`

### Hands-On Practice

1. Install nginx using Helm and customize the service type
2. Upgrade the release to change the replica count
3. Roll back the release to a previous revision
4. Create a custom Helm chart for a simple application
5. Use \`helm template\` to preview rendered manifests

### Key Takeaways
- Helm packages Kubernetes resources into reusable charts
- Values files customize chart deployments for different environments
- helm install/upgrade/rollback manage application lifecycle
- Helm charts use Go templates with .Values for configuration
- Helm repositories provide access to community-maintained charts

### References & Further Reading
**Textbooks:**
1. "Kubernetes in Action, 2nd Edition" by Marko Luksa -- Chapter 17: Managing Helm charts
2. "Helm: Up and Running" by Matt Butcher, Matt Farina & Josh Dolitsky -- Full book
3. "Kubernetes: Up and Running, 3rd Edition" -- Chapter 7: Packaging

**Online Resources:**
1. [Helm documentation](https://helm.sh/docs/)
2. [Artifact Hub -- Helm chart repository](https://artifacthub.io/)
3. [Helm best practices](https://helm.sh/docs/chart_best_practices/)`,
            questions: [
              { text: 'What is the purpose of Helm in Kubernetes?', answers: [{ text: 'Package manager that simplifies deploying and managing applications', isCorrect: true }, { text: 'Container runtime for Kubernetes', isCorrect: false }, { text: 'Monitoring tool for cluster health', isCorrect: false }, { text: 'Alternative to kubectl', isCorrect: false }] },
              { text: 'What does a Helm "release" represent?', answers: [{ text: 'A specific deployment of a chart with a unique name', isCorrect: true }, { text: 'A version of Kubernetes', isCorrect: false }, { text: 'A Docker image registry', isCorrect: false }, { text: 'A node in the cluster', isCorrect: false }] },
              { text: 'How do you customize a Helm chart deployment?', answers: [{ text: 'Pass --set flags or use a custom values.yaml file', isCorrect: true }, { text: 'Edit the chart source code directly', isCorrect: false }, { text: 'Modify Kubernetes resources after installation', isCorrect: false }, { text: 'Use kubectl apply instead', isCorrect: false }] },
              { text: 'What does helm template do?', answers: [{ text: 'Renders the chart templates locally without installing', isCorrect: true }, { text: 'Installs the chart in dry-run mode', isCorrect: false }, { text: 'Creates a new chart from a template', isCorrect: false }, { text: 'Updates the template repository', isCorrect: false }] },
              { text: 'How do you roll back a Helm release to revision 2?', answers: [{ text: 'helm rollback my-release 2', isCorrect: true }, { text: 'helm undo my-release 2', isCorrect: false }, { text: 'helm history my-release 2', isCorrect: false }, { text: 'kubectl rollout undo my-release', isCorrect: false }] },
              { text: 'Where are default chart values defined?', answers: [{ text: 'In the values.yaml file at the chart root', isCorrect: true }, { text: 'In Chart.yaml', isCorrect: false }, { text: 'In templates/_helpers.tpl', isCorrect: false }, { text: 'In the .helmignore file', isCorrect: false }] },
            ],
          },

        ],
      },
    ],
  );
}
