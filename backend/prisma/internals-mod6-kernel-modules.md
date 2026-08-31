# Module 6 — Kernel Modules and eBPF

## Extending the Kernel Without Rebooting

The Linux kernel is modular. Unlike monolithic kernels where everything is compiled in, Linux allows you to load and unload code at runtime. This capability is the foundation of device driver support, filesystem implementations, and the modern observability revolution driven by eBPF.

This module covers kernel module management — from the traditional insmod/rmmod approach to the eBPF revolution that lets you write custom kernel programs safely.

## Kernel Modules: The Traditional Approach

### Module Lifecycle

A kernel module is a piece of code that can be loaded into the kernel at runtime. When loaded, it has full access to kernel data structures and functions. When unloaded, it is cleanly removed.

The lifecycle:

```
Source code (.c)
    ↓ (compile)
Module object (.ko)
    ↓ (insmod/modprobe)
Loaded in kernel (running)
    ↓ (rmmod)
Unloaded from kernel
```

### Loading and Unloading Modules

**insmod** loads a specific module file:

```bash
insmod /lib/modules/$(uname -r)/kernel/drivers/net/usb/usbnet.ko
```

**modprobe** is smarter — it loads the specified module and any dependencies:

```bash
modprobe usbnet
# Automatically loads dependent modules (usbcore, etc.)
```

**rmmod** removes a module:

```bash
rmmod usbnet
# Fails if module is in use (other modules depend on it, or device is attached)
```

**modprobe -r** removes a module and its unused dependencies:

```bash
modprobe -r usbnet
```

**lsmod** lists loaded modules:

```bash
lsmod | head -20
# Module                  Size  Used by
# usbnet                 32768  0
# mii                    16384  1 usbnet
# usbcore               294912  4 usbhid,usbnet,uvcvideo
```

The "Used by" column shows the reference count. A module with `0` can be unloaded. A module with `1` or more has other modules or devices using it.

### Module Information

```bash
# Detailed information about a module
modinfo usbnet
# filename:       /lib/modules/6.x.x/kernel/drivers/net/usb/usbnet.ko
# license:        GPL
# description:    USB Network Drivers
# author:         Oliver Neukum
# alias:          usb:v*p*d*dc*dsc*dp*ic*isc*ip*in*
# depends:        usbcore,mii
# intree:         Y
# vermagic:       6.x.x SMP mod_unload

# Check if a module is loadable
modprobe --show-depends usbnet
# Shows the full dependency chain and load order
```

### Module Configuration

Modules can be configured at load time through parameters:

```bash
# List parameters for a module
modinfo -p e1000e
# parm:           TxDescriptors:Tx descriptors per queue between 64-4096 (int)
# parm:           RxDescriptors:Rx descriptors per queue between 64-4096 (int)
# parm:           InterruptMode:Interrupt Mode (0=Legacy, 1=MSI, 2=MSI-X) (int)

# Load with parameters
modprobe e1000e InterruptMode=2 TxDescriptors=2048

# Make parameters persistent
echo "options e1000e InterruptMode=2 TxDescriptors=2048" > /etc/modprobe.d/e1000e.conf
```

### Module Autoloading

The kernel requests modules automatically when hardware is detected or a filesystem is encountered. The `modules.alias` file maps device IDs to module names:

```bash
# Find which module handles a device
grep "usb:v0BDA" /lib/modules/$(uname -r)/modules.alias
# alias usb:v0BDAp8179d*dc*dsc*dp*ic*isc*ip*in* r8169

# Trigger module loading
echo "usb:v0BDAp8179d*" > /sys/bus/usb/drivers_autoprobe
```

### Building a Custom Module

A minimal kernel module:

```c
// hello.c
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Your Name");
MODULE_DESCRIPTION("A simple hello module");

static int __init hello_init(void) {
    printk(KERN_INFO "Hello, kernel!\n");
    return 0;
}

static void __exit hello_exit(void) {
    printk(KERN_INFO "Goodbye, kernel!\n");
}

module_init(hello_init);
module_exit(hello_exit);
```

Build with a Makefile:

```makefile
obj-m += hello.o
KDIR := /lib/modules/$(shell uname -r)/build

all:
	make -C $(KDIR) M=$(PWD) modules

clean:
	make -C $(KDIR) M=$(PWD) clean
```

```bash
make
insmod hello.ko
dmesg | tail -5
# [12345.678] Hello, kernel!

rmmod hello
dmesg | tail -5
# [12346.789] Goodbye, kernel!
```

### /lib/modules Directory Structure

```bash
ls /lib/modules/$(uname -r)/
# build       → /usr/src/kernels/$(uname -r)  (symlink)
# kernel/     → Compiled modules organized by subsystem
# modules.alias
# modules.dep
# modules.symbols
# weak-updates/

# Find all modules for a subsystem
find /lib/modules/$(uname -r)/kernel -name "*.ko" | grep net | head -10
```

### Module Dependencies

Modules can depend on other modules. The dependency chain is tracked in `modules.dep`:

```bash
# View dependencies for a module
modprobe --show-depends usbnet
# insmod /lib/modules/6.x.x/kernel/drivers/usb/core/usbcore.ko
# insmod /lib/modules/6.x.x/kernel/drivers/net/mii.ko
# insmod /lib/modules/6.x.x/kernel/drivers/net/usb/usbnet.ko

# View reverse dependencies (what depends on a module)
modprobe --show-depends -r usbnet
# Or check
cat /lib/modules/$(uname -r)/modules.dep | grep usbnet

# Understand reference counting
lsmod | grep usbnet
# usbnet                 32768  0
# The 0 means no other modules or devices are using it

# A module in use cannot be unloaded
rmmod usbnet
# rmmod: ERROR: Module usbnet is in use
```

### Module Blacklisting

Preventing modules from loading is sometimes necessary:

```bash
# Method 1: Blacklist in modprobe.d
echo "blacklist nouveau" > /etc/modprobe.d/blacklist-nouveau.conf
echo "blacklist floppy" >> /etc/initramfs-tools/modules  # Also remove from initramfs

# Method 2: Blacklist in GRUB (for modules needed during boot)
# Edit /etc/default/grub and add to GRUB_CMDLINE_LINUX:
# modprobe.blacklist=nouveau

# Method 3: Disable in initramfs
echo "blacklist nouveau" >> /etc/dracut.conf.d/blacklist-nouveau.conf
dracut --force

# Verify module is not loaded
lsmod | grep nouveau
# (empty output)
```

### Module Debugging

```bash
# Check kernel log for module messages
dmesg | grep -i "module_name"

# Enable verbose module loading
echo 1 > /sys/module/module/parameters/verbose
modprobe mymodule
dmesg | tail -20

# Check for symbol errors
modprobe mymodule 2>&1
# modprobe: ERROR: could not insert 'mymodule': Unknown symbol in module,
# or unknown parameter

# Find missing symbols
dmesg | grep "mymodule: Unknown symbol"
# mymodule: Unknown symbol usb_register (err 0)
# This means mymodule depends on usbcore but it is not loaded

# Check module taint status
cat /proc/sys/kernel/tainted
# 0 = not tainted (all modules are open source or properly signed)
# Non-zero = tainted (proprietary modules loaded, or error occurred)
```

## eBPF: The Modern Kernel Programmability Layer

### modprobe.d Configuration

The `/etc/modprobe.d/` directory contains configuration files that control module behavior:

```bash
# Blacklist a module (prevent loading)
echo "blacklist nouveau" > /etc/modprobe.d/blacklist-nvidia.conf

# Options for a module
echo "options bonding mode=4 miimon=100" > /etc/modprobe.d/bonding.conf

# Install alias (redirect module request)
echo "install dummy modprobe bonding" > /etc/modprobe.d/bonding.conf

# Remove command (custom unload script)
echo "remove mymodule /usr/local/bin/cleanup.sh" > /etc/modprobe.d/mymodule.conf
```

## eBPF: The Modern Kernel Programmability Layer

eBPF (extended Berkeley Packet Filter) is a revolutionary technology that allows user-space programs to run inside the kernel safely. Unlike kernel modules, eBPF programs are verified by the kernel before execution — they cannot crash the kernel or access unauthorized memory.

### What eBPF Is

eBPF programs are small programs that attach to kernel hooks. They run in kernel context when the hook is triggered. Think of them as kernel-space event handlers that you can write in user space.

Key properties:
- **Verified**: The kernel verifier ensures the program is safe (no infinite loops, no out-of-bounds access, no null pointer dereferences)
- **Sandboxed**: eBPF programs can only access a limited set of kernel data through helper functions
- **JIT-compiled**: eBPF bytecode is compiled to native machine code for near-zero overhead
- **Persistent**: eBPF maps allow data to persist across invocations

### eBPF Architecture

```
User Space                          Kernel Space
┌─────────────┐                    ┌─────────────────┐
│ eBPF Program│───load()────────→ │ Verifier        │
│ Source Code │                    │ JIT Compiler    │
│ (.c → .o)   │                    │ eBPF Program    │
├─────────────┤                    │ (native code)   │
│ User App    │◄──read/write()──→ │ eBPF Maps       │
│ (libbpf)    │                    │ (shared data)   │
└─────────────┘                    └─────────────────┘
```

### eBPF Program Types

| Type | Hook Point | Use Case |
|------|------------|----------|
| BPF_PROG_TYPE_KPROBE | Kernel function entry/exit | Function tracing, debugging |
| BPF_PROG_TYPE_TRACEPOINT | Kernel static tracepoints | Event tracing |
| BPF_PROG_TYPE_PERF_EVENT | Hardware perf counters | CPU profiling |
| BPF_PROG_TYPE_CGROUP_SKB | Network packet send/receive | Network filtering |
| BPF_PROG_TYPE_SCHED_CLS | Traffic control | Packet classification |
| BPF_PROG_TYPE_SOCK_OPS | Socket operations | TCP optimization |
| BPF_PROG_TYPE_XDP | Early packet processing | High-performance networking |
| BPF_PROG_TYPE_LSM | Linux Security Module hooks | Security enforcement |

### eBPF Maps

Maps are the primary data sharing mechanism between eBPF programs and user space. They are key-value stores in kernel memory:

| Map Type | Description |
|----------|-------------|
| BPF_MAP_TYPE_HASH | Hash table (generic key-value) |
| BPF_MAP_TYPE_ARRAY | Fixed-size array (indexed by integer) |
| BPF_MAP_TYPE_PERF_EVENT_ARRAY | Ring buffer for perf events |
| BPF_MAP_TYPE_RINGBUF | Shared ring buffer (newer, more efficient) |
| BPF_MAP_TYPE_LRU_HASH | Least-recently-used hash table |
| BPF_MAP_TYPE_STACK_TRACE | Stack trace storage |
| BPF_MAP_TYPE_PROG_ARRAY | Array of eBPF program file descriptors |

```c
// Example: BPF map definition in C
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1024);
    __type(key, u32);       // PID
    __type(value, u64);     // Byte count
} bytes_seen SEC(".maps");
```

## bcc Tools: Pre-Built eBPF Tracing

BCC (BPF Compiler Collection) provides ready-to-use tools built on eBPF. These tools trace kernel functions and display useful output without writing eBPF code.

### Installation

```bash
# Debian/Ubuntu
apt install bpfcc-tools bpfcc-tools-linux-headers

# RHEL/CentOS
dnf install bcc-tools bcc-doc

# Tools are installed to /sbin/ with -bpfcc suffix
ls /usr/sbin/*-bpfcc
```

### Essential bcc Tools

**execsnoop** — Trace new process execution:

```bash
execsnoop-bpfcc
# PCOMM    PID    PPID   RET ARGS
# ls       1234   1000     0 /usr/bin/ls --color=auto
# cat      1235   1000     0 /usr/bin/cat /proc/cpuinfo
```

**opensnoop** — Trace file opens:

```bash
opensnoop-bpfcc
# PID    COMM               FD ERR PATH
# 1234   bash                3   0 /etc/passwd
# 1234   bash                3   0 /etc/shadow
```

**biolatency** — Block I/O latency distribution:

```bash
biolatency-bpfcc -D
# Disk I/O Latency Histogram (us)
# 
#     usecs           : count    distribution
#         0 -> 1      : 0       |                                        |
#         2 -> 3      : 12      |**                                      |
#         4 -> 7      : 156     |******************************          |
#         8 -> 15     : 89      |******************                      |
#        16 -> 31     : 45      |*********                               |
#        32 -> 63     : 12      |**                                      |
#        64 -> 127    : 3       |                                        |
#       128 -> 255    : 1       |                                        |
```

**cachestat** — Page cache hit/miss rate:

```bash
cachestat-bpfcc 1
# HITS   MISSES  DIRTIES HITRATIO   BUFFERS_MB  CACHED_MB
# 45678   1234    567     97.37%     128         8192
# 23456    890    234     96.32%     128         8192
```

**tcpconnect/tcpaccept** — Trace TCP connections:

```bash
tcpconnect-bpfcc
# PID    COMM         IP  LADDR          LPORT  DADDR          DPORT
# 1234   curl         4   10.0.0.1       45678  93.184.216.34  443
# 1235   ssh          4   10.0.0.1       45679  192.168.1.1    22
```

**funccount** — Count kernel function calls:

```bash
funccount-bpfcc 'tcp_*'
# Function                    Count
# tcp_sendmsg                 12345
# tcp_recvmsg                  8901
# tcp_connect                  234
# tcp_close                   1234
```

**profile** — CPU profiling with stack traces:

```bash
profile-bpfcc -f 5
# Sampling at 49 Hz for 5 seconds...
# 
# [kernel]
#   copy_page+1
#   __handle_mm_fault+456
#   handle_mm_fault+123
#   __do_page_fault+456
#   ...
#   total: 234
#
# [java]
#   ...
#   total: 890
```

**tcplife** — Trace TCP connections with lifetime:

```bash
tcplife-bpfcc
# PID    COMM         LADDR          LPORT  RADDR          RPORT  TX_KB  RX_KB  MS
# 1234   curl         10.0.0.1       45678  93.184.216.34  443    12     256    1234.56
# 1235   ssh          10.0.0.1       45679  192.168.1.1    22     1      2      45678.90
```

**runqlat** — Run queue latency (scheduling delay):

```bash
runqlat-bpfcc 10
# Run Queue Latency Histogram (usecs)
#
#     usecs           : count    distribution
#         0 -> 1      : 1234    |**************************              |
#         2 -> 3      : 567     |***********                             |
#         4 -> 7      : 89      |**                                      |
#         8 -> 15     : 234     |*****                                   |
#        16 -> 31     : 45      |*                                       |
#        32 -> 63     : 12      |                                        |
```

**ext4slower** — Trace slow ext4 operations:

```bash
ext4slower-bpfcc 10  # Show operations slower than 10ms
# TIME     COMM           PID    T  BYTES   OFFSET  AGE(ms) FILENAME
# 1234.567 myapp          1234   R  4096    0       12.345  config.json
# 1234.890 myapp          1234   W  8192    0       23.456  output.log
```

**filetop** — Top file operations by process:

```bash
filetop-bpfcc 5
# PID    COMM         T  FILE                    BYTES   READS  WRITES
# 1234   myapp        R  /var/log/syslog          12345   45     0
# 1234   myapp        W  /tmp/output.txt          8901    0      34
# 2345   nginx        R  /var/www/html/index.html 4567    12     0
```

## bpftrace: Custom eBPF Tracing

bpftrace is a high-level tracing language for eBPF. It provides a awk-like syntax for writing custom tracing scripts.

### Installation

```bash
# Debian/Ubuntu
apt install bpftrace

# RHEL/CentOS
dnf install bpftrace
```

### Basic Syntax

```bash
# One-liner: trace process execution
bpftrace -e 'tracepoint:syscalls:sys_enter_execve { printf("%s (PID %d)\n", comm, pid); }'

# One-liner: count syscalls by process
bpftrace -e 'tracepoint:raw_syscalls:sys_enter { @[comm] = count(); }'

# One-liner: measure read() latency
bpftrace -e 'kprobe:vfs_read { @start[tid] = nsecs; }
             kretprobe:vfs_read /@start[tid]/ { @us = hist((nsecs - @start[tid]) / 1000); delete(@start[tid]); }'
```

### bpftrace Programs

```bash
#!/usr/bin/env bpftrace
/*
 * File opens by process
 * Traces all open() and openat() syscalls and shows which files are opened
 */

tracepoint:syscalls:sys_enter_openat
{
    printf("%-16s PID=%-6d FD=%-4d FLAGS=%-8d PATH=%s\n",
           comm, pid, args->flags, args->flags, str(args->filename));
}

tracepoint:syscalls:sys_enter_open
{
    printf("%-16s PID=%-6d FD=%-4d FLAGS=%-8d PATH=%s\n",
           comm, pid, args->flags, args->flags, str(args->filename));
}
```

Save as `file_opens.bt` and run:

```bash
sudo bpftrace file_opens.bt
```

### bpftrace Built-in Variables

| Variable | Description |
|----------|-------------|
| `pid` | Process ID |
| `tid` | Thread ID |
| `uid` | User ID |
| `comm` | Process name |
| `nsecs` | Nanosecond timestamp |
| `elapsed` | Nanoseconds since bpftrace start |
| `cpu` | Current CPU number |
| `kstack` | Kernel stack trace |
| `ustack` | User stack trace |
| `arg0` - `argN` | Function arguments (for kprobe/tracepoint) |
| `retval` | Function return value (for kretprobe) |
| `func` | Current function name |

### bpftrace Aggregation Functions

| Function | Description |
|----------|-------------|
| `count()` | Count events |
| `sum(x)` | Sum of values |
| `avg(x)` | Average of values |
| `min(x)` | Minimum value |
| `max(x)` | Maximum value |
| `hist(x)` | Log2 histogram |
| `lhist(x,min,max,step)` | Linear histogram |
| `stats(x)` | Count, average, variance |

### Practical bpftrace Scripts

**Find which process is doing the most disk I/O:**

```bash
#!/usr/bin/env bpftrace

tracepoint:block:block_rq_issue
{
    @bytes[comm] = sum(args->bytes);
}

interval:s:5
{
    print(@bytes);
    clear(@bytes);
}
```

**Trace TCP retransmissions by process:**

```bash
#!/usr/bin/env bpftrace

kprobe:tcp_retransmit_skb
{
    @retransmits[comm] = count();
}

interval:s:10
{
    print(@retransmits);
    clear(@retransmits);
}
```

**Measure scheduling latency:**

```bash
#!/usr/bin/env bpftrace

tracepoint:sched:sched_wakeup
{
    @qtime[args->pid] = nsecs;
}

tracepoint:sched:sched_switch
/@qtime[args->next_pid]/
{
    @usecs = hist((nsecs - @qtime[args->next_pid]) / 1000);
    delete(@qtime[args->next_pid]);
}
```

## Real Scenario: Using eBPF to Find a Performance Bottleneck

### The Problem

A high-throughput web service was experiencing periodic latency spikes. The p99 latency jumped from 5ms to 500ms every few minutes, lasting 10-30 seconds each time. Traditional monitoring (CPU, memory, network) showed no obvious bottleneck.

### Investigation with bcc

```bash
# Step 1: Check block I/O latency
biolatency-bpfcc -D 10 1
# Output showed occasional 100+ ms disk I/O operations
# Not constant — periodic pattern

# Step 2: Identify what is doing the I/O
biosnoop-bpfcc -d sda 10
# TIME     COMM           PID    DISK    T  SECTOR     BYTES  LAT(ms)
# 10.123   jbd2/sda1-8    1234   sda     W  12345678   4096   125.43
# 10.456   jbd2/sda1-8    1234   sda     W  12346000   8192   234.56
# The ext4 journal daemon (jbd2) is doing large writes

# Step 3: Find what triggers the jbd2 writes
trace/biosnoop-bpfcc -d sda -j 30  # Trace for 30 seconds
# jbd2 writes happen after burst of file creates/deletes

# Step 4: Confirm with opensnoop
opensnoop-bpfcc -n "jbd2" 30
# jbd2 opens journal file periodically

# Step 5: Check the application's file operations
opensnoop-bpfcc -p <webapp_pid> 30
# The app creates and deletes temp files for every request
# 10,000 temp files per second → journal flush every few seconds
```

### Root Cause

The web application was creating a temporary file for every HTTP request, writing the response to it, then sending the file to the client. The sheer volume of file creates and deletes caused the ext4 journal to fill up periodically, triggering a synchronous journal flush that blocked all I/O for 100-300 ms.

### Solution

```bash
# Immediate: Move temp files to tmpfs (no journal)
mkdir -p /dev/shm/webapp-tmp
mount --bind /dev/shm/webapp-tmp /var/tmp/webapp

# Monitor with eBPF to verify improvement
biolatency-bpfcc -D 60 1
# Latency spikes gone

# Long-term: Refactor application to use pipes or in-memory buffers
# instead of temp files
```

### eBPF Verification

```bash
#!/usr/bin/env bpftrace
// Verify the fix by monitoring temp file creation rate

tracepoint:syscalls:sys_enter_openat
/str(args->filename) contains "webapp"/
{
    @tmp_files[comm] = count();
}

interval:s:5
{
    print(@tmp_files);
    clear(@tmp_files);
}
```

The eBPF-based approach identified a problem that traditional monitoring could not see: the correlation between file operations, journal flushes, and I/O latency spikes. This is the power of eBPF — it lets you ask questions about kernel behavior that were previously impossible to answer.

## Assessment

### Lab Task 1: Module Management (20 minutes)

1. List all loaded modules with `lsmod`
2. Find the module that handles your network interface
3. Check the module's dependencies with `modinfo`
4. Attempt to unload and reload the module
5. Document the commands and their output

**Grading**: Correct module identification (25%), dependency check (25%), unload/reload (25%), documentation (25%)

### Lab Task 2: bcc Tool Exploration (30 minutes)

1. Run `execsnoop-bpfcc` for 60 seconds and identify the most frequently executed commands
2. Run `opensnoop-bpfcc` and find which process opens the most files
3. Run `biolatency-bpfcc` and create a latency histogram
4. Run `tcpconnect-bpfcc` and identify all outbound TCP connections
5. For each tool, explain what kernel hooks it uses

**Grading**: Correct tool usage (20% each), kernel hook identification (20%)

### Lab Task 3: Custom bpftrace Script (35 minutes)

1. Write a bpftrace script that traces `execve` syscalls and groups them by process name
2. The script should run for 30 seconds and print a summary
3. Test the script and verify the output is correct
4. Modify the script to also show the parent PID
5. Document the script and its output

**Grading**: Correct tracepoint usage (25%), aggregation (25%), modification (25%), documentation (25%)

### Lab Task 4: Performance Bottleneck Hunt (35 minutes)

1. Create an artificial bottleneck (e.g., a script that does heavy I/O in the background)
2. Use bcc tools to identify the source of the bottleneck
3. Use bpftrace to trace the specific syscall causing the issue
4. Document your investigation process and findings
5. Propose and implement a fix

**Grading**: Bottleneck creation (15%), identification (30%), tracing (30%), fix and documentation (25%)

## Evidence

### Kernel Module and eBPF Understanding

Evidence of mastery includes:

- Loading, unloading, and configuring kernel modules with insmod, rmmod, modprobe
- Understanding module dependencies and the modules.dep database
- Building a simple kernel module from source and loading it
- Using bcc tools to trace kernel activity without writing code
- Writing bpftrace scripts to answer specific performance questions
- Understanding eBPF program types, map types, and the verification process
- Choosing between kernel modules and eBPF for different extensibility needs

### Key Diagnostic Commands

| Command | Purpose |
|---------|---------|
| `lsmod` | List loaded modules |
| `modinfo <module>` | Module information |
| `modprobe <module>` | Load module with dependencies |
| `modprobe -r <module>` | Unload module and dependencies |
| `cat /proc/modules` | Raw module list with addresses |
| `dmesg` | Kernel messages (module load/unload) |
| `execsnoop-bpfcc` | Trace process execution |
| `opensnoop-bpfcc` | Trace file opens |
| `biolatency-bpfcc` | Block I/O latency histogram |
| `bpftrace -l` | List available tracepoints |
| `bpftool prog list` | List loaded eBPF programs |
| `bpftool map list` | List eBPF maps |

### eBPF vs Kernel Modules

| Aspect | Kernel Module | eBPF |
|--------|--------------|------|
| Safety | Can crash kernel | Verified by kernel |
| Persistence | Stays loaded until rmmod | Per-attachment lifecycle |
| Complexity | Full kernel API | Limited helper functions |
| Use case | Drivers, filesystems | Tracing, filtering, networking |
| Deployment | Requires root, reboot risk | Can be loaded by unprivileged (with restrictions) |
| Development cycle | Compile, load, test | Edit, load, test (fast iteration) |

### When to Use Kernel Modules

Kernel modules are appropriate when:

- **Writing device drivers**: eBPF cannot access hardware directly
- **Implementing filesystems**: The VFS interface requires module registration
- **Adding system calls**: eBPF cannot add new system calls
- **Modifying core kernel behavior**: eBPF hooks are limited to specific points
- **Performance-critical code**: Module code runs with less overhead than eBPF verification

### When to Use eBPF

eBPF is appropriate when:

- **Tracing and profiling**: Lower overhead, safer, no reboot risk
- **Security monitoring**: seccomp-bpf, LSM hooks
- **Network packet filtering**: XDP, traffic control
- **Dynamic configuration**: Change behavior without unloading/reloading
- **Custom metrics**: Count events, measure latencies, aggregate statistics
- **Debugging production systems**: Attach and detach without stopping the process

### Kernel Module Security

Modules run with full kernel privileges. Malicious or buggy modules can crash the system, access any memory, or bypass all security:

```bash
# Check module signing enforcement
cat /sys/kernel/security/lockdown
# If "integrity" or "confidentiality" is set, unsigned modules are blocked

# View module signatures
modinfo mymodule | grep signer
# signer:     Kernel Module Signing Key

# Verify module signature
modverify /boot/vmlinuz-$(uname -r) /lib/modules/$(uname -r)/extra/mymodule.ko

# Monitor module loading
dmesg -w &
# In another terminal:
modprobe mymodule
# Watch for: "mymodule: module verification failed: signature and/or required key missing"
```

### Building Out-of-Tree Modules

When a module is not in the mainline kernel, you build it out-of-tree:

```bash
# Install kernel headers (required for building modules)
apt install linux-headers-$(uname -r)
# or
dnf install kernel-devel-$(uname -r)

# Create the module source
mkdir -p /usr/src/mymodule
cat > /usr/src/mymodule/mymodule.c << 'EOF'
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>

MODULE_LICENSE("GPL");
MODULE_VERSION("1.0");

static int __init mymodule_init(void) {
    printk(KERN_INFO "mymodule: loaded\n");
    return 0;
}

static void __exit mymodule_exit(void) {
    printk(KERN_INFO "mymodule: unloaded\n");
}

module_init(mymodule_init);
module_exit(mymodule_exit);
EOF

# Create Makefile
cat > /usr/src/mymodule/Makefile << 'EOF'
obj-m += mymodule.o
KDIR := /lib/modules/$(shell uname -r)/build

all:
	make -C $(KDIR) M=$(PWD) modules

clean:
	make -C $(KDIR) M=$(PWD) clean
EOF

# Build
cd /usr/src/mymodule
make

# Install
make modules_install
depmod -a

# Load
modprobe mymodule
dmesg | tail -5
# mymodule: loaded
```