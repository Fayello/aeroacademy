# Module 6 — Kernel Modules and eBPF

**Course:** Linux Internals | **Path:** Linux Internals (6 of 10)

---

## What You'll Actually Do

You need to add a custom driver, trace a kernel function, or monitor syscalls without recompiling the kernel. You'll load kernel modules, write eBPF programs, and use bcc tools to observe kernel behavior.

---

## Kernel Modules — Extend Without Rebooting

```bash
# List loaded modules
lsmod | head -10
# Module                  Size  Used by
# ext4                  123456  3
# ip_tables              45678  1 iptable_filter

# Load a module
modprobe br_netfilter

# Remove a module
modprobe -r br_netfilter

# Check module info
modinfo ext4

# Blacklist (prevent loading)
echo "blacklist nouveau" > /etc/modprobe.d/blacklist-nouveau.conf
update-initramfs -u
```

**Where modules live:**
```bash
/lib/modules/$(uname -r)/kernel/
# drivers/    hardware drivers
# fs/         filesystem modules
# net/        network modules
# crypto/     encryption modules
```

---

## Writing a Simple Kernel Module

```c
// hello.c
#include <linux/module.h>
#include <linux/kernel.h>

static int __init hello_init(void) {
    printk(KERN_INFO "Hello, kernel!\n");
    return 0;
}

static void __exit hello_exit(void) {
    printk(KERN_INFO "Goodbye, kernel!\n");
}

module_init(hello_init);
module_exit(hello_exit);
MODULE_LICENSE("GPL");
```

```bash
# Makefile
obj-m += hello.o
all:
    make -C /lib/modules/$(uname -r)/build M=$(PWD) modules
clean:
    make -C /lib/modules/$(uname -r)/build M=$(PWD) clean

# Build and load
make
sudo insmod hello.ko
dmesg | tail -1
# [12345.678] Hello, kernel!

# Remove
sudo rmmod hello
dmesg | tail -1
# [12345.901] Goodbye, kernel!
```

---

## eBPF — Programmable Kernel

eBPF lets you run sandboxed programs in the kernel without writing modules. It's how modern observability tools work.

**bcc tools (pre-built eBPF):**

```bash
apt install bpfcc-tools

# Trace syscalls by process
opensnoop           # who's opening files
execsnoop           # who's running programs
biolatency          # block I/O latency
cachestat           # cache hit/miss ratio
tcpconnect          # who's connecting to where
tcpretrans          # TCP retransmissions
```

**Example: Find slow reads**
```bash
biosnoop
# TIME     COMM    PID    DISK  T  SECTOR     BYTES  LAT(ms)
# 10:30:00 nginx   842    sda   R  12345678   4096   12.34
# 10:30:00 nginx   842    sda   R  12345686   4096   45.67  ← slow!
```

---

## bpftrace — One-Liners

```bash
# Trace open() syscalls
bpftrace -e 'tracepoint:syscalls:sys_enter_openat { printf("%s %s\n", comm, str(args->filename)); }'

# Count syscalls by process
bpftrace -e 'tracepoint:raw_syscalls:sys_enter { @[comm] = count(); }'

# Measure read() latency
bpftrace -e 'tracepoint:syscalls:sys_exit_read { @usecs = hist(args->ret >= 0 ? (nsecs - @start[tid]) / 1000 : -1); } tracepoint:syscalls:sys_enter_read { @start[tid] = nsecs; }'
```

---

## When to Use What

| Tool | Use case |
|------|----------|
| strace | Debug a specific process |
| ltrace | Debug library calls |
| bcc tools | System-wide observability |
| bpftrace | Custom tracing queries |
| Kernel module | Permanent kernel extension |
| eBPF | Safe, dynamic kernel programming |

---

## Assessment

**Lab task (25 min):**

1. Load and unload a kernel module
2. Use opensnoop to trace file opens
3. Use execsnoop to trace new processes
4. Use biolatency to measure disk I/O latency
5. Write a bpftrace one-liner to count syscalls by process
6. Write a simple kernel module (or examine an existing one)

**Grading:**
- Module loaded/unloaded: 15%
- opensnoop used: 20%
- execsnoop used: 15%
- biolatency used: 15%
- bpftrace one-liner: 20%
- Kernel module examined: 15%

---

## Evidence

- **OutcomeEvidence:** `INT-LO6 — Kernel Modules & eBPF`

---

## Unlock

Module7 — Namespaces and Containers. You can extend the kernel. Now you learn how containers actually work.
