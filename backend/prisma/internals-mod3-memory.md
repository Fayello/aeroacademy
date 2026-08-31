# Module 3 — Memory Management

## How Linux Manages Memory

Memory management is the most complex subsystem in the Linux kernel. It mediates between the physical RAM installed in a machine and the virtual address spaces of every running process. Understanding how it works is essential for diagnosing performance problems, memory leaks, and out-of-memory situations that kill production systems.

This module covers the memory management hierarchy: virtual addresses, page tables, physical memory zones, the buddy allocator, the slab allocator, swap, and the OOM killer. Every concept is tied to real debugging techniques.

## Virtual Memory

Every process on a 64-bit Linux system believes it has access to a vast, flat address space — typically 128 TB on x86_64. This virtual address space is mapped to physical RAM through a multi-level page table structure.

### Page Tables

The x86_64 architecture uses a 4-level page table (or 5-level with LA57):

```
PGD → P4D → PUD → PMD → PTE → Physical Page
```

Each level is an array of entries. The virtual address is split into indices for each level plus an offset within the final page:

```
Virtual Address (48 bits):
┌─────────┬───────┬───────┬───────┬───────────────┐
│ PGD idx │P4D idx│PUD idx│PMD idx│ PTE idx + Off │
│  9 bits │9 bits │9 bits │9 bits │  9+12 bits    │
└─────────┴───────┴───────┴───────┴───────────────┘
```

Each PTE (Page Table Entry) contains:
- The physical page frame number (PFN)
- Present bit (is this page in RAM?)
- Dirty bit (has this page been written?)
- Accessed bit (has this page been read?)
- Cache control bits
- NX (No Execute) bit

Page table walks are expensive — each level requires a memory access. To avoid this, the CPU caches recent translations in the **Translation Lookaside Buffer (TLB)**.

### TLB

The TLB is a small, fast cache of page table entries. A TLB hit means the translation is resolved in 1-2 CPU cycles. A TLB miss requires a page table walk, which can take 10-100 cycles.

Linux manages TLB efficiency through:

- **Huge pages**: Using 2 MB or 1 GB pages instead of 4 KB pages reduces the number of TLB entries needed. A single 2 MB page covers the same memory as 512 4 KB pages.

```bash
# Check huge page support
cat /proc/meminfo | grep Huge
# HugePages_Total:       0
# HugePages_Free:        0
# HugePages_Rsvd:        0
# Hugepagesize:       2048 kB

# Allocate 1024 huge pages (2 GB)
echo 1024 > /proc/sys/vm/nr_hugepages
```

- **TLB flush on context switch**: When switching between processes, the TLB is flushed. The `PCID` (Process Context ID) feature on modern CPUs allows TLB entries from multiple processes to coexist, reducing flush overhead.

- **ASID (Address Space Identifier)**: The ARM equivalent of PCID, available on ARMv8.1+.

### `/proc/[pid]/maps` and `/proc/[pid]/smaps`

The memory map of a process shows all virtual memory regions:

```bash
cat /proc/12345/maps
# 00400000-00452000 r-xp 00000000 08:01 131074  /bin/bash
# 7f123000-7f156000 r-xp 00000000 08:01 262145  /lib/x86_64-linux-gnu/libc.so.6
```

The `smaps` file provides detailed per-region information:

```bash
cat /proc/12345/smaps | grep -E "^[0-9a-f]|Size|Rss|Pss|Swap"
# 00400000-00452000 r-xp 00000000 08:01 131074  /bin/bash
# Size:               332 kB
# Rss:                280 kB
# Pss:                280 kB
# Swap:                 0 kB
```

**Pss** (Proportional Set Size) is the key metric for understanding actual memory usage. It counts shared pages fractionally — if a page is shared between two processes, each gets 0.5 of it. This is more accurate than RSS for understanding total system memory consumption.

## Physical Memory

### Memory Zones

The kernel divides physical memory into zones based on hardware addressing constraints:

| Zone | Description | x86_64 Range |
|------|-------------|---------------|
| ZONE_DMA | Below 16 MB, ISA DMA | 0-16 MB |
| ZONE_DMA32 | Below 4 GB, 32-bit DMA | 16 MB - 4 GB |
| ZONE_NORMAL | Directly mapped | 4 GB - end of RAM |
| ZONE_MOVABLE | Can be hot-plugged or migrated | Anywhere |

Most allocations come from ZONE_NORMAL. ZONE_DMA exists for legacy ISA devices that can only address the first 16 MB.

### Buddy Allocator

The buddy allocator manages physical page frames. It organizes free pages into orders 0 through 10 (MAX_ORDER - 1), where order N means 2^N contiguous pages:

- Order 0: 1 page (4 KB)
- Order 1: 2 pages (8 KB)
- ...
- Order 9: 512 pages (2 MB)
- Order 10: 1024 pages (4 MB)

When a request for N pages arrives, the allocator finds the smallest free block of order >= log2(N). If the exact order is not available, a larger block is split in half (buddies). When pages are freed, adjacent buddies are coalesced back into larger blocks.

The buddy allocator's weakness is **external fragmentation** — over time, free pages become scattered and it may fail to find contiguous blocks even when sufficient total free memory exists. This is why the huge pages allocation can fail even when there is plenty of free RAM:

```bash
# Check fragmentation
cat /proc/buddyinfo
# Node 0, zone   Normal   2345   1234   567    234   100    50    20     5     2     0
# (orders 0-10, number of free blocks at each order)

# The defragmentation mechanism
echo 1 > /proc/sys/vm/compact_memory  # Force compaction
```

## Slab Allocator

The buddy allocator works with fixed-size page frames. But the kernel frequently allocates small objects: inodes, dentries, task_structs, network buffers. These objects are 64 bytes to several kilobytes — far smaller than a 4 KB page. The slab allocator sits on top of the buddy allocator to handle small allocations efficiently.

### How Slab Works

The slab allocator maintains caches of pre-allocated, ready-to-use objects. Each cache is dedicated to a specific object type:

```bash
# View slab caches
slabtop -o | head -30

# Or from proc
cat /proc/slabinfo | head -20
# # name            <active_objs> <num_objs> <objsize> <objperslab> <pagesperslab>
# ext4_inode_cache      45678     46000       1088        15            8
# dentry                123456    124000       192        21            1
# task_struct            2345      2400       6016         5            8
```

When the kernel needs an `inode` structure, it gets one from the `ext4_inode_cache`. If the cache is empty, the slab allocator requests a new batch of pages from the buddy allocator and carves them into objects.

### kmalloc vs vmalloc

For general-purpose kernel memory allocation:

**kmalloc()** allocates physically contiguous memory. It is fast (just a slab allocation for small sizes) but limited. The maximum allocation is typically 4 MB (depends on `MAX_ORDER`). Use it for DMA buffers, network packets, and anything that must be physically contiguous.

```c
void *buf = kmalloc(4096, GFP_KERNEL);
if (!buf) {
    // allocation failed
}
kfree(buf);
```

**vmalloc()** allocates virtually contiguous memory (physically scattered). It is slower (requires page table manipulation) but can allocate much larger regions. Use it for large kernel data structures that do not need physical contiguity.

```c
void *buf = vmalloc(16 * 1024 * 1024);  // 16 MB
vfree(buf);
```

**GFP flags** control allocation behavior:

- `GFP_KERNEL` — Can sleep, can trigger reclaim. Normal allocation.
- `GFP_ATOMIC` — Cannot sleep. Used in interrupt context. May fail if memory is low.
- `GFP_NOWAIT` — Like GFP_ATOMIC but never waits for reclaim.
- `__GFP_NOFAIL` — Will not fail. Retries indefinitely. Use sparingly.
- `__GFP_HIGHMEM` — Can allocate from HIGHMEM (32-bit only).

### Memory Leak Detection in Kernel

Kernel memory leaks are harder to detect than user-space leaks. Tools:

```bash
# kmemleak: kernel memory leak detector
echo scan > /sys/kernel/debug/kmemleak
cat /sys/kernel/debug/kmemleak

# Debugfs slab info
cat /proc/slabinfo
# Look for caches with growing obj count over time

# slabtop - interactive slab monitor
slabtop -s c   # sort by cache size
```

## Swap

Swap extends physical memory by using disk space as overflow. When memory pressure increases, the kernel moves inactive pages to swap space and reclaims the physical pages for active use.

### How Swap Works

Linux uses **pageout** to move pages to swap. The kernel maintains a list of inactive pages (pages that have not been accessed recently). When memory is needed:

1. The kernel selects a page from the inactive list
2. If the page is dirty (modified), it is written to swap space
3. The page table entry is updated to point to the swap location
4. The physical page frame is freed

When the swapped-out page is accessed again, a **page fault** occurs, and the kernel reads it back from swap into a new physical page.

### Swap Configuration

```bash
# Check current swap
swapon --show
free -h

# Create a swap file
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Tune swap behavior
cat /proc/sys/vm/swappiness        # 0-200, default 60
cat /proc/sys/vm/vfs_cache_pressure  # default 100
```

**Swappiness** controls how aggressively the kernel moves anonymous pages (heap, stack, mmap) to swap. A value of 0 means "avoid swapping anonymous pages unless absolutely necessary." A value of 100 means "swap aggressively." For databases, a swappiness of 10-30 is often recommended.

**VFS cache pressure** controls how aggressively the kernel reclaims dentry and inode caches. A higher value means more aggressive reclaim of these caches.

### When Swap Kills Performance

Swap is not inherently bad — a small amount (1-2 GB) provides a safety buffer. But heavy swapping kills performance because disk I/O is orders of magnitude slower than RAM access.

A 4 KB page read from SSD takes ~100 microseconds. A 4 KB page read from RAM takes ~100 nanoseconds. That is a 1000x difference. If a database is swapping heavily, every page fault costs 100 microseconds instead of 100 nanoseconds, and throughput collapses.

```bash
# Monitor swap usage
vmstat 1 10
# si (swap in) and so (swap out) columns should be 0
# Non-zero values indicate active swapping

# Find which processes are swapping the most
for pid in $(ls /proc/ | grep -E '^[0-9]+$'); do
    swap=$(awk '/VmSwap/{print $2}' /proc/$pid/status 2>/dev/null)
    if [ -n "$swap" ] && [ "$swap" -gt 0 ]; then
        name=$(cat /proc/$pid/comm 2>/dev/null)
        echo "${swap} kB  PID=$pid  $name"
    fi
done | sort -rn | head -10
```

## The OOM Killer

When the system runs out of memory and cannot reclaim any more, the **Out of Memory (OOM) Killer** selects a process to terminate. The algorithm is straightforward but often controversial.

### How OOM Killer Selects Victims

The OOM killer assigns a score to each process based on:

1. **Memory usage** — How much memory the process uses. More memory = higher score.
2. **OOM score adjustment** — A user-configurable adjustment (-1000 to 1000).
3. **Process age** — Older processes get a slight bonus.
4. **Killability** — Processes that have allocated but not yet used memory (overcommit) are easier to kill.
5. **Root protection** — The init process and kernel threads are immune.

```bash
# View OOM scores
cat /proc/*/oom_score | sort -rn | head

# Find the process with highest OOM score
ps -eo pid,comm,oom_score --sort=-oom_score | head

# Adjust OOM score for a critical process (make it less likely to be killed)
echo -1000 > /proc/<pid>/oom_score_adj

# Make a process more likely to be killed (for expendable workers)
echo 1000 > /proc/<pid>/oom_score_adj
```

### Why OOM Killer Kills the Wrong Process

The OOM killer uses total memory usage as its primary metric. This creates a well-known problem: a process that uses a lot of memory legitimately (like a database with a large buffer pool) gets a high score, even if that memory is essential. Meanwhile, a memory-leaking process with a small working set might escape detection.

Consider this scenario:
- PostgreSQL uses 16 GB (buffer pool, legitimate)
- A Python data pipeline has a memory leak and uses 4 GB (growing)
- OOM killer selects PostgreSQL (16 GB) and kills it, taking down the database

The Python pipeline continues leaking until it triggers OOM again.

### OOM Prevention

The best approach is to prevent OOM situations entirely:

```bash
# Use cgroups to limit memory per service
systemd-run --scope -p MemoryMax=8G -p MemoryHigh=7G my_service

# MemoryHigh triggers reclaim pressure before MemoryMax triggers OOM
# This gives the process a chance to free memory gracefully

# Disable overcommit (prevent allocation of more memory than physically available)
echo 2 > /proc/sys/vm/overcommit_memory
# This causes malloc() to fail immediately if there is not enough memory
# Applications must handle malloc() failures properly

# Set swappiness low for databases
echo 10 > /proc/sys/vm/swappiness
```

## Memory Diagnostic Tools

### /proc/meminfo

The authoritative source of memory information:

```bash
cat /proc/meminfo
# MemTotal:       16384000 kB     # Total physical RAM
# MemFree:         1024000 kB     # Completely unused
# MemAvailable:    6144000 kB     # Available for new allocations (includes reclaimable)
# Buffers:          512000 kB     # Block device buffers
# Cached:          4096000 kB     # Page cache (file-backed)
# SwapCached:        12345 kB     # Pages in swap that are also in RAM
# SwapTotal:       4194304 kB     # Total swap
# SwapFree:        4194304 kB     # Free swap
# Dirty:             12345 kB     # Pages waiting to be written to disk
# Writeback:             0 kB     # Pages currently being written
# Slab:             512000 kB     # Kernel slab allocator usage
# SReclaimable:     400000 kB     # Slab that can be reclaimed
# SUnreclaim:       112000 kB     # Slab that cannot be reclaimed
# Committed_AS:    8192000 kB     # Total committed virtual memory
# HugePages_Total:       0        # Huge pages allocated
```

The key distinction is between `MemFree` and `MemAvailable`. Linux aggressively uses free memory for page cache. `MemFree` will often be very low even when the system is not under memory pressure. `MemAvailable` estimates how much memory is actually available for new applications without swapping.

### vmstat

```bash
vmstat 1 10
# procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
#  r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
#  2  0      0 1024000 512000 4096000    0    0     0     0  500 1000 10  5 85  0  0
```

- `si` / `so` — Swap in/out per second. Should be 0. Non-zero means active swapping.
- `buff` — Buffer cache (block device metadata)
- `cache` — Page cache (file data)
- `free` — Unused memory
- `b` — Processes in uninterruptible sleep (usually waiting for I/O)

### slabtop

```bash
slabtop -o -s c
# Shows slab cache usage sorted by cache size
# Look for caches with unusually high obj count or size
```

### pmap

```bash
pmap -x <PID>
# Shows detailed memory map of a process
# Look for large anonymous mappings (heap growth = possible leak)
```

### Memory Tuning for Specific Workloads

Different workloads require different memory tuning:

**Database servers (PostgreSQL, MySQL):**

```bash
# Increase shared memory limits
echo "kernel.shmmax = 17179869184" >> /etc/sysctl.d/99-database.conf
echo "kernel.shmall = 4194304" >> /etc/sysctl.d/99-database.conf
sysctl -p /etc/sysctl.d/99-database.conf

# Set swappiness low (database has its own buffer management)
echo 10 > /proc/sys/vm/swappiness

# Disable zone_reclaim_mode (NUMA optimization)
echo 0 > /proc/sys/vm/zone_reclaim_mode

# Increase max_map_count for large shared memory
echo 262144 > /proc/sys/vm/max_map_count
```

**Web servers (nginx, Apache):**

```bash
# Increase file descriptor limits
# In /etc/security/limits.conf:
# www-data soft nofile 65535
# www-data hard nofile 65535

# Tune TCP memory
echo "net.ipv4.tcp_mem = 786432 1048576 1572864" >> /etc/sysctl.d/99-network.conf
echo "net.ipv4.tcp_rmem = 4096 87380 6291456" >> /etc/sysctl.d/99-network.conf
echo "net.ipv4.tcp_wmem = 4096 65536 6291456" >> /etc/sysctl.d/99-network.conf
sysctl -p /etc/sysctl.d/99-network.conf
```

**Container hosts:**

```bash
# Increase max_map_count for all containers
echo 262144 > /proc/sys/vm/max_map_count

# Increase PID limit
echo 4194304 > /proc/sys/kernel/pid_max

# Increase inotify watches for container file watching
echo 65536 > /proc/sys/fs/inotify/max_user_watches
```

### Memory Compaction

When the system has been running for a long time, free memory can become fragmented. Memory compaction reorganizes free pages to create larger contiguous blocks:

```bash
# Check fragmentation level
cat /proc/buddyinfo
# Node 0, zone   Normal   2345   1234   567    234   100    50    20     5     2     0

# Force compaction (can cause brief latency spike)
echo 1 > /proc/sys/vm/compact_memory

# Check compaction activity
cat /proc/vmstat | grep compact
# compact_stall 12
# compact_success 10
# compact_fail 2

# Automatic compaction tuning
echo 1 > /proc/sys/vm/compaction_proactiveness  # Enable proactive compaction
echo 200 > /proc/sys/vm/compaction_proactiveness # More aggressive
```

### Huge Pages Deep Dive

Huge pages reduce TLB misses by using larger page sizes:

```bash
# Check available huge page sizes
cat /proc/meminfo | grep Huge
# HugePages_Total:       0
# HugePages_Free:        0
# HugePages_Rsvd:        0
# HugePages_Surp:        0
# Hugepagesize:       2048 kB

# Allocate 1024 huge pages (2 GB)
echo 1024 > /proc/sys/vm/nr_hugepages

# Verify allocation
cat /proc/meminfo | grep Huge
# HugePages_Total:    1024
# HugePages_Free:     1024
# HugePages_Rsvd:        0
# HugePages_Surp:        0

# Application must use mmap with MAP_HUGETLB to use huge pages
# Or use libhugetlbfs library

# Transparent Huge Pages (THP) — automatic huge page allocation
cat /sys/kernel/mm/transparent_hugepage/enabled
# [always] madvise never

# Disable THP for databases (can cause latency spikes during compaction)
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
```

### Memory Deduplication (KSM)

Kernel Same-page Merging (KSM) scans memory for identical pages and merges them (copy-on-write):

```bash
# Enable KSM
echo 1 > /sys/kernel/mm/ksm/run

# Tune KSM
echo 100 > /sys/kernel/mm/ksm/pages_to_scan  # Pages per scan
echo 20 > /sys/kernel/mm/ksm/sleep_millisecs  # Scan interval (ms)

# Check KSM statistics
cat /sys/kernel/mm/ksm/pages_shared    # Unique pages
cat /sys/kernel/mm/ksm/pages_sharing   # Shared pages (saved memory)
cat /sys/kernel/mm/ksm/pages_unshared  # Pages checked but unique

# KSM is useful for VM hosts (many identical VMs)
# KSM is harmful for security (enables side-channel attacks)
# Disable on security-sensitive systems:
echo 0 > /sys/kernel/mm/ksm/run
```

## Real Scenario: Diagnosing a Memory Leak in Production

### The Problem

A Java-based web service running on a production server was experiencing periodic slowdowns. Monitoring showed that the server's available memory was decreasing over time — from 8 GB available at startup to under 500 MB after 72 hours. The swap was being hit frequently, causing 5-10 second response time spikes.

### Investigation

```bash
# Step 1: Confirm memory pressure
free -h
#               total        used        free      shared  buff/cache   available
# Mem:           15Gi       14Gi       200Mi       128Mi       1.2Gi       450Mi
# Swap:         4.0Gi       2.1Gi       1.9Gi

vmstat 1 5
# si/so columns showing 100+ KB/s swap activity — active swapping confirmed

# Step 2: Find who is using memory
ps -eo pid,comm,%mem,rss --sort=-rss | head -10
#  PID    COMMAND         %MEM    RSS
# 12345  java            45.2  7200000   ← Java process using 7.2 GB
# 23456  postgres         12.1  1920000
# 34567  nginx             2.3   360000

# Step 3: Analyze Java heap (since Java is the top consumer)
# Attach jmap to the Java process
jmap -heap 12345
# Heap Configuration:
#   MaxHeapSize            = 4294967296 (4096MB)
# Heap Usage:
#   Eden Space:  capacity = 1073741824 (1024MB)
#   From Space:  capacity = 536870912 (512MB)
#   To Space:    capacity = 536870912 (512MB)
#   Old Gen:     capacity = 2684354560 (2560MB)  ← using 2540MB (98.7%)
#   Metaspace:   capacity = 268435456 (256MB)    ← using 250MB

# Step 4: Identify the leaking code path
jmap -histo 12345 | head -20
#  num     #instances         #bytes  class name
#   1:         456789       36543120  [B  (byte array)
#   2:         234567       18765360  [C  (char array)
#   3:         123456        9876480  java.lang.String
#   4:          67890        5431200  com.example.data.BatchRecord  ← suspicious

# Step 5: Compare heap dumps over time
jmap -dump:live,format=b,file=/tmp/heap1.dump 12345
# Wait 1 hour
jmap -dump:live,format=b,file=/tmp/heap2.dump 12345
# Use jhat or Eclipse MAT to diff the two dumps
# Finding: BatchRecord instances grew from 10,000 to 67,890 in 1 hour
```

### Root Cause

The application had a batch processing module that loaded records from a database into memory. The records were stored in a `ConcurrentHashMap` that was supposed to be cleared after each batch. A race condition in the batch processing code caused some records to be retained in the map even after the batch completed. Over time, these retained records accumulated.

### Resolution

1. **Immediate**: Restart the Java service to reclaim memory
2. **Short-term**: Increase `-XX:MaxHeapSize` to buy time and reduce swap frequency
3. **Long-term**: Fix the code — add explicit `clear()` call in the batch completion handler and add a periodic cleanup task

```bash
# Add JVM flags for better monitoring
java -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath=/var/log/app/heapdump.hprof \
     -XX:+UseG1GC \
     -XX:MaxHeapSize=4g \
     -XX:InitiatingHeapOccupancyPercent=45 \
     -jar myapp.jar
```

### Prevention: Memory Monitoring

```bash
#!/bin/bash
# Memory pressure alert script
THRESHOLD=80
USED_PCT=$(free | awk '/^Mem:/ {printf "%.0f", ($3/$2)*100}')

if [ "$USED_PCT" -gt "$THRESHOLD" ]; then
    echo "Memory usage at ${USED_PCT}% - investigating top consumers"
    ps -eo pid,comm,%mem,rss --sort=-rss | head -5
    # Send to monitoring system (Prometheus, Datadog, etc.)
fi
```

## Assessment

### Lab Task 1: Memory Map Analysis (25 minutes)

1. For a running process of your choice, read and interpret `/proc/[pid]/maps`
2. Identify the text segment, data segment, heap, and stack regions
3. Calculate total virtual memory usage vs RSS
4. Use `pmap -x` to verify your interpretation
5. Identify which libraries are shared between two processes

**Grading**: Correct map interpretation (30%), correct segment identification (30%), accurate calculations (20%), library sharing identification (20%)

### Lab Task 2: Slab Cache Investigation (20 minutes)

1. Take a snapshot of slab cache sizes with `slabtop`
2. Create a large number of files in a directory (10,000+)
3. Take another slab snapshot and identify which caches grew
4. Drop caches with `echo 3 > /proc/sys/vm/drop_caches` and observe the change
5. Explain why dentry and inode caches grew and shrank

**Grading**: Correct slab snapshots (25%), file creation trigger (25%), cache change identification (25%), explanation (25%)

### Lab Task 3: Swap Behavior Analysis (20 minutes)

1. Check current swappiness value
2. Run a memory-intensive program that exceeds physical RAM
3. Monitor swap activity with `vmstat 1`
4. Change swappiness to 0 and repeat the test
5. Document the difference in swap behavior

**Grading**: Correct swappiness check (20%), test execution (30%), swap monitoring (20%), documented difference (30%)

### Lab Task 4: OOM Killer Scenario (35 minutes)

1. Create a test environment (VM or cgroup) with limited memory (e.g., 512 MB)
2. Write a program that allocates memory in a loop without freeing
3. Observe OOM killer in action in `dmesg`
4. Adjust the OOM score of a second process and verify it is protected
5. Configure `oom_score_adj` for the critical process to -1000
6. Verify the expendable process is killed instead of the critical one

**Grading**: Correct OOM trigger (25%), dmesg analysis (25%), OOM score adjustment (25%), protection verification (25%)

## Evidence

### Memory Management Understanding

Evidence of mastery includes:

- Reading `/proc/meminfo` and distinguishing between MemFree and MemAvailable
- Using `vmstat` to detect swap activity and correlate it with performance degradation
- Interpreting `slabtop` output to identify kernel memory consumers
- Using `pmap` and `/proc/[pid]/maps` to analyze process memory layout
- Understanding when kmalloc vs vmalloc is appropriate in kernel development
- Configuring and monitoring huge pages for performance improvement
- Using cgroups to limit memory per service and prevent OOM situations
- Analyzing OOM killer behavior from `dmesg` output and adjusting `oom_score_adj`

### Key Diagnostic Commands

| Command | Purpose |
|---------|---------|
| `free -h` | Quick memory overview |
| `vmstat 1` | Real-time memory and swap statistics |
| `slabtop` | Kernel slab cache monitor |
| `pmap -x <PID>` | Process memory map with details |
| `cat /proc/meminfo` | Detailed memory information |
| `cat /proc/buddyinfo` | Physical page fragmentation |
| `cat /proc/pagetypeinfo` | Free page ordering by zone |
| `echo 3 > /proc/sys/vm/drop_caches` | Drop page cache, dentries, inodes |
| `jmap -heap <PID>` | Java heap analysis |
| `smem -t -k -u -p` | Accurate memory reporting with PSS |