# Module 3 — Memory Management



## What You'll Actually Do

Your app is using2GB of RAM but `free -h` shows only200MB free. Is there a memory leak? Or is Linux just caching? You'll understand virtual memory, page tables, the OOM killer, and how to actually diagnose memory issues.


## Virtual Memory

Every process gets its own virtual address space. The kernel maps virtual addresses to physical memory.

```bash
# Process memory layout
cat /proc/1234/maps
# 00400000-00452000 r-xp  /usr/bin/myapp    (text — code)
# 00651000-00652000 r--p  /usr/bin/myapp    (read-only data)
# 00652000-00653000 rw-p  /usr/bin/myapp    (data)
# 7f1234000-7f125000 rw-p  [heap]            (heap — dynamic allocation)
# 7ff1234000-7ff1237000 r-xp  [vdso]         (kernel interface)
# ffffffffff600000-ffffffffff601000 r-xp [vsyscall] (legacy syscall)
```

**Text:** Code. Read-only. Shared between processes.
**Data:** Initialized global variables.
**Heap:** Dynamic allocation (malloc). Grows up.
**Stack:** Local variables. Grows down.


## Page Tables

Virtual addresses are mapped to physical addresses through page tables.

```bash
# Check page table entries
cat /proc/1234/status | grep VmPTE
# VmPTE:    1234 kB   (page table entries)

# Check page size
getconf PAGESIZE
# 4096 (4KB)
```

**Page faults:** When a process accesses a virtual address not in physical memory, the kernel loads it from disk (swap) or zero-fills it.

```bash
# Check page fault stats
cat /proc/1234/stat | awk '{print "minor faults:", $10, "major faults:", $12}'
```

Minor faults = page in RAM but not in page table. Major faults = page on disk (slow).


## Linux Memory Usage

```bash
free -h
#               total        used        free      shared  buff/cache   available
# Mem:           15Gi       4.2Gi       200Mi       256Mi       11Gi       10Gi
# Swap:         2.0Gi       0.0Gi       2.0Gi
```

**Don't panic about low "free" memory.** Linux uses free memory for caching (buff/cache). When an app needs memory, the kernel reclaims cache.

- `available` = memory available for new applications (most important)
- `buff/cache` = filesystem cache (can be reclaimed)
- `free` = truly unused (misleading indicator)


## Swap

When physical RAM is full, the kernel moves pages to disk (swap).

```bash
# Check swap usage
swapon --show
# NAME      TYPE  SIZE  USED  PRIO
# /dev/sda2 partition  2G    0B    -2

# Check what's using swap
for f in /proc/*/status; do
    awk '/VmSwap/{if($2>0) print FILENAME": "$0}' "$f" 2>/dev/null
done
```

**Swap is not bad.** It's overflow. If you're swapping heavily, you need more RAM.


## OOM Killer — The Last Resort

When the kernel can't free memory, it kills the process using the most memory.

```bash
# Check for OOM events
dmesg | grep -i "oom\|killed process"
# [456.789] Out of memory: Killed process 1337 (python) total-vm:4096000kB

# OOM score (0-1000, higher = more likely to be killed)
cat /proc/1234/oom_score
# 500

# Protect a process from OOM
echo -17 > /proc/1234/oom_adj    # deprecated
echo -1000 > /proc/1234/oom_score_adj  # modern
```


## Memory Leak Detection

```bash
# Check process memory growth
while true; do
    ps -o pid,rss,vsz -p 1234
    sleep 60
done

# Use valgrind (development)
valgrind --leak-check=full ./myapp

# Use pmap to see memory layout
pmap -x 1234
```


## Real Task: Diagnose Memory Issue

```bash
# App is slow, free shows low memory
free -h
# available: 200Mi   (low!)

# What's using memory?
ps aux --sort=-rss | head -10
# USER  PID  %MEM  RSS    COMMAND
# root  1337  45.2  7.2G   java
# root  842  12.1  1.9G   nginx
# root  999   8.3  1.3G   postgresql

# Java is using7GB. Is it a leak?
cat /proc/1337/status | grep -i vm
# VmSize: 7340032 kB
# VmRSS:  7340032 kB

# Check if it's growing
watch -n 10 "ps -o rss -p 1337"
# Growing every10 seconds → memory leak

# Fix: restart the app (temporary), find the leak (permanent)
systemctl restart myapp
```


## Assessment

**Lab task (25 min):**

1. Interpret `free -h` output correctly
2. Check page fault stats for a process
3. Find what's using swap
4. Check OOM score for processes
5. Detect a memory leak with process monitoring
6. Use pmap to analyze memory layout

**Grading:**
- free interpreted: 15%
- Page faults checked: 15%
- Swap usage found: 15%
- OOM scores checked: 15%
- Leak detected: 25%
- pmap analyzed: 15%


## Evidence

- **OutcomeEvidence:** `INT-LO3 — Memory Management`
- **Mastery:** `UserSkill: linux-memory-management`


## Unlock

Module4 — Filesystems. You know how memory works. Now you learn how data is stored.


## Sources

- `man free`, `man ps`, `man pmap`, `man proc`
- Linux kernel documentation: memory management


