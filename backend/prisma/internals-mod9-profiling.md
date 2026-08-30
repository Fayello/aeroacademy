# Module 9 — Performance Profiling and Tracing

**Course:** Linux Internals | **Path:** Linux Internals (9 of 10)

---

## What You'll Actually Do

Your app is slow but you don't know why. CPU? Memory? I/O? You'll use perf, flame graphs, and ftrace to find exactly where time is spent.

---

## perf — CPU Profiling

```bash
# Record a 10-second profile
perf record -g -p 1234 -- sleep 10

# View report
perf report
# Overhead  Command   Shared Object      Symbol
#   45.00%  myapp     myapp              [.] process_data
#   23.00%  myapp     libpthread.so.0    [.] __pthread_mutex_lock
#   12.00%  myapp     libc.so.6          [.] memcpy

# System-wide profiling
perf record -a -g -- sleep 5

# Top-like output
perf top -p 1234
```

---

## Flame Graphs

Visual representation of where CPU time is spent.

```bash
# Record
perf record -g -p 1234 -- sleep 10

# Generate flame graph
perf script | stackcollapse-perf.pl | flamegraph.pl > flame.svg
```

**Reading flame graphs:**
- Wide = lots of time
- Tall = deep call stack
- X-axis = percentage of time (left = first, right = last)
- Y-axis = call stack depth

---

## ftrace — Function Tracing

```bash
# Trace a function
cd /sys/kernel/debug/tracing
echo function > current_tracer
echo do_sys_open > set_ftrace_filter
echo 1 > tracing_on
cat trace_pipe
# myapp-1234 [001]  1234.567: do_sys_open -> __alloc_fd
# myapp-1234 [001]  1234.568: do_sys_open -> path_openat

# Trace function latency
echo function_graph > current_tracer
echo do_sys_open > set_graph_function
echo 1 > tracing_on
cat trace_pipe
#  0)               |  do_sys_open() {
#  0)   0.123 us    |    __alloc_fd();
#  0)   0.456 us    |    path_openat();
#  0)   0.789 us    |  }
```

---

## I/O Profiling

```bash
# Block I/O latency
biolatency
# Tracing block I/O... Hit Ctrl-C to end.
#      usecs         : count    distribution
#        0 -> 1      : 0        |                                        |
#        2 -> 3      : 1234     |************                           |
#        4 -> 7      : 5678     |************************************************|
#        8 -> 15     : 2345     |**********************                  |
#       16 -> 31     : 123      |*                                       |

# Who's doing I/O
biosnoop
# TIME     COMM    PID    DISK  T  SECTOR     BYTES  LAT(ms)
# 10:30:00 nginx   842    sda   R  12345678   4096   0.12
# 10:30:00 postgres 999   sda   W  12345686   8192   1.23
```

---

## Real Task: Find the Bottleneck

```bash
# App is slow. What's it doing?

# 1. Check CPU
perf top -p 1234
# 60% in __memcpy — lots of memory copying

# 2. Check I/O
biolatency -p 1234
# Average latency: 45ms — disk is slow

# 3. Check memory
cat /proc/1234/status | grep VmRSS
# VmRSS: 8388608 kB — 8GB! Memory leak?

# 4. Check page faults
cat /proc/1234/stat | awk '{print "major faults:", $12}'
# 12345 — lots of major faults (reading from disk)

# Diagnosis: Memory leak → lots of swap usage → major page faults → slow I/O
# Fix: Restart app, find the leak with valgrind
```

---

## Assessment

**Lab task (25 min):**

1. Profile a running process with perf
2. Generate a flame graph
3. Use ftrace to trace a specific function
4. Measure block I/O latency
5. Diagnose a performance bottleneck

**Grading:**
- perf used: 20%
- Flame graph generated: 20%
- ftrace used: 20%
- I/O latency measured: 15%
- Bottleneck diagnosed: 25%

---

## Evidence

- **OutcomeEvidence:** `INT-LO9 — Performance Profiling`

---

## Unlock

Module10 — Kernel Security. You know how to optimize. Now you learn how to protect.
