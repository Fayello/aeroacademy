# Module 9: Performance Profiling and Tracing

## Finding Why a Server Is Slow

Performance problems are the most frustrating issues to debug. The server is slow, but CPU, memory, and disk all look fine in basic monitoring. You need deeper tools: ones that can see inside the CPU, inside the kernel, and inside individual functions. This module covers the profiling and tracing tools that let you find the needle in the haystack.

## perf: CPU Profiling and Flame Graphs

perf is the Linux performance analysis tool. It uses hardware performance counters (PMCs) and kernel tracepoints to profile software with minimal overhead.

### CPU Profiling

The most common use case: sample what the CPU is doing at regular intervals:

```bash
# Profile a command for 10 seconds
perf record -g -p <PID> -- sleep 10
# -g: capture call graphs (stack traces)

# Profile the entire system
perf record -a -g -- sleep 30

# Profile with frequency (default: 4000 Hz)
perf record -F 1000 -g -p <PID> -- sleep 10
```

### Interpreting perf Report

```bash
perf report
# Overhead  Command      Shared Object      Symbol
#  45.67%   myapp        libpthread.so.0     [.] __pthread_mutex_lock
#  12.34%   myapp        myapp               [.] process_request
#   8.90%   myapp        libc.so.6           [.] __write
#   5.67%   myapp        myapp               [.] parse_json
#   3.45%   myapp        libssl.so.1.1       [.] SSL_read
#   2.34%   myapp        myapp               [.] send_response
#   1.23%   ksoftirqd/0  [kernel]            [k] __netif_receive_skb
```

The top entry (`__pthread_mutex_lock` at 45.67%) indicates heavy lock contention. This is the bottleneck.

### Flame Graphs

Flame graphs are the most intuitive way to visualize CPU profiling data. They show the call stack as a flame: wider bars mean more CPU time:

```bash
# Generate a flame graph
perf script | stackcollapse-perf.pl | flamegraph.pl > flamegraph.svg

# Or using perf's built-in support
perf record -g -p <PID> -- sleep 30
perf script | stackcollapse-perf.pl | flamegraph.pl --title "CPU Profile" --width 1200 > cpu.svg

# Open the SVG in a browser: the x-axis is stack depth, y-axis is sample count
# Hover over any bar to see the function name and sample count
```

Reading flame graphs:
- **Widest bars** = functions consuming the most CPU time
- **Tall stacks** = deep call chains (many nested function calls)
- **Color** is random (red/yellow/blue): it does not mean hot/cold
- **Flat tops** = leaf functions (the actual work)
- **Widening in the middle** = the function or its children are expensive

### perf stat

Count hardware events without sampling:

```bash
perf stat -p <PID> -- sleep 10
# Performance counter stats for process 12345:
#
#     10,000.12 msec  task-clock
#            1,234    context-switches
#              567    cpu-migrations
#           12,345    page-faults
#   23,456,789,012    cycles
#   12,345,678,901    instructions         #    0.53  insn per cycle
#    3,456,789,012    branches
#      123,456,789    branch-misses        #    3.57% of all branches
```

Key metrics:
- **IPC (Instructions Per Cycle)**: < 1.0 indicates memory stalls or branch mispredictions
- **Branch misses**: > 5% indicates poor branch prediction (code structure issue)
- **Context switches**: High count indicates process scheduling overhead
- **Page faults**: High count indicates memory allocation pressure

### perf Hardware Counters

perf can read CPU-specific performance counters:

```bash
# List available hardware counters
perf list hw
# cpu-cycles
# instructions
# cache-references
# cache-misses
# branch-instructions
# branch-misses
# bus-cycles
# stalled-cycles-frontend
# stalled-cycles-backend

# Profile cache misses specifically
perf record -e cache-misses -g -p <PID> -- sleep 10

# Profile branch mispredictions
perf record -e branch-misses -g -p <PID> -- sleep 10

# Profile all memory access latency
perf record -e cpu/mem-loads,ldlat=30/pp -g -p <PID> -- sleep 10

# Count context switches
perf record -e context-switches -g -p <PID> -- sleep 10
```

### perf Script

Export raw events for custom analysis and visualization:

```bash
# Export all events to a text file
perf script > events.txt

# Export with call stacks for flame graph generation
perf script -g > events_with_stacks.txt

# Parse with custom tools for aggregated analysis
perf script | awk '{print $1, $2, $3}' | sort | uniq -c | sort -rn | head

# Export for Chrome tracing viewer (about:tracing in Chrome)
perf script -F +comm,pid,tid,time,event,ip,sym,dso > perf.data.txt
```

### perf probe

Dynamic tracing: add probes to any function at runtime:

```bash
# Add a probe to a function
perf probe --add 'tcp_sendmsg'

# Record events at that probe
perf record -e probe:tcp_sendmsg -g -- sleep 10

# View the trace
perf script

# Add a probe with arguments
perf probe --add 'tcp_sendmsg size'

# List all probes
perf probe -l

# Remove probes
perf probe --del 'tcp_sendmsg'
```

### perf trace

A lower-overhead alternative to strace:

```bash
# Trace system calls with timing
perf trace -p <PID> -s --duration 10

# Trace specific syscalls
perf trace -e read,write -p <PID>

# Summary mode
perf trace -s -p <PID> -- sleep 30
#概述 of syscall counts and latencies
```

### perf sched

Analyze scheduler behavior:

```bash
# Record scheduling events
perf sched record -- sleep 10

# Show scheduling latency
perf sched latency --sort max
# --- CPUs ---
# 
# ──────────────────────────────────────────────────
# Task                  Runtime  Switches  Average delay  Maximum delay
# ──────────────────────────────────────────────────
# bash/1234             1.234s       567       0.012ms        0.456ms
# myapp/5678            4.567s      1234       0.045ms        1.234ms
# ksoftirqd/0              0s        89       0.001ms        0.003ms

# Show per-CPU scheduling
perf sched map
#          _采访时      1    2    3    4
#  1234.567890: myapp/5678   .    B    .    .
#  1234.567891: bash/1234    .    .    B    .
#  1234.567892: ksoftirqd    B    .    .    .
```

### perf lock

Analyze lock contention:

```bash
# Record lock events
perf lock record -- sleep 10

# Show lock contention
perf lock report
# --- lock_acquired vs lock_acquired_read ---
# 
# Wait     Acquired  Avg wait  Max wait  Total wait  # acquisitions  # holders
# ─────────────────────────────────────────────────────────────────────────────
#  123456     123456   0.045ms   1.234ms    5.678s         123456       12345
#    5678       5678   0.123ms   3.456ms    0.698s           5678         567
```

### perf mem

Analyze memory access patterns:

```bash
# Record memory access events
perf record -e mem-loads,mem-stores -g -- sleep 10

# Show memory access patterns
perf mem report
# Overhead  Samples  Symbol
#   45.67%     1234  [unknown]
#   23.45%      890  memcpy
#   12.34%      567  __memset_avx2
```

### perf lock contention (newer kernels)

```bash
# Direct lock contention profiling
perf lock contention -a -- sleep 10

# With call stacks
perf lock contention -a -g -- sleep 10

# Filter by lock name
perf lock contention -a -b 'mutex' -- sleep 10
```

## ftrace: Function and Event Tracing

ftrace is the kernel's built-in tracing framework. It is more powerful than perf for kernel-level tracing but requires understanding the tracefs filesystem. ftrace is always available: it requires no special kernel configuration and has minimal overhead.

### Enabling and Disabling ftrace

```bash
# Check if ftrace is available
ls /sys/kernel/debug/tracing/
# available_events  current_tracer  trace  trace_clock  ...

# Clear the trace buffer
echo > /sys/kernel/debug/tracing/trace

# Enable tracing globally
echo 1 > /sys/kernel/debug/tracing/tracing_on

# Disable tracing globally
echo 0 > /sys/kernel/debug/tracing/tracing_on

# Clear and restart
echo 0 > /sys/kernel/debug/tracing/tracing_on
echo > /sys/kernel/debug/tracing/trace
echo 1 > /sys/kernel/debug/tracing/tracing_on
```

### Function Tracing

```bash
# Enable function tracing
echo function > /sys/kernel/debug/tracing/current_tracer
echo 1 > /sys/kernel/debug/tracing/tracing_on

# Trace specific functions
echo "tcp_*" > /sys/kernel/debug/tracing/set_ftrace_filter
echo "ext4_*" >> /sys/kernel/debug/tracing/set_ftrace_filter

# View the trace
cat /sys/kernel/debug/tracing/trace
#           <...>-1234  [002]  1234.567890: tcp_sendmsg: (inet_sendmsg+0x56/0x70)
#           <...>-1234  [002]  1234.567891: tcp_sendmsg: (inet_sendmsg+0x56/0x70 -> tcp_sendmsg_locked+0x123/0x456)

# Disable tracing
echo 0 > /sys/kernel/debug/tracing/tracing_on
echo nop > /sys/kernel/debug/tracing/current_tracer
```

### Event Tracing

The kernel has thousands of static tracepoints. You can trace specific events:

```bash
# List available events
cat /sys/kernel/debug/tracing/available_events | head -20
# block:block_rq_issue
# block:block_rq_complete
# sched:sched_switch
# sched:sched_wakeup
# net:net_dev_xmit
# syscalls:sys_enter_read
# syscalls:sys_exit_read

# Trace a specific event
echo 1 > /sys/kernel/debug/tracing/events/sched/sched_switch/enable
echo 1 > /sys/kernel/debug/tracing/tracing_on

cat /sys/kernel/debug/tracing/trace
# <idle>-0     [000] d..1  1234.567890: sched_switch: prev_comm=swapper prev_pid=0 prev_prio=120 prev_state=R ==> next_comm=bash next_pid=1234 next_prio=120

# Disable
echo 0 > /sys/kernel/debug/tracing/events/sched/sched_switch/enable
echo 0 > /sys/kernel/debug/tracing/tracing_on
```

### ftrace Event Histograms

ftrace has a powerful histogram feature for analyzing events:

```bash
# Create a histogram for block I/O latency
echo 0 > /sys/kernel/debug/tracing/tracing_on
echo "common_pid" > /sys/kernel/debug/tracing/events/block/block_rq_complete/trigger
echo "hist:key=common_pid:vals=latency:usecs:__latency" > /sys/kernel/debug/tracing/events/block/block_rq_complete/trigger
echo 1 > /sys/kernel/debug/tracing/tracing_on

# After collecting data, view the histogram
cat /sys/kernel/debug/tracing/events/block/block_rq_complete/hist
# # entries-in-buffer/entries-written: 12345/12345   #eq:0
# #                                    info see /sys/kernel/debug/tracing/README_hist_fgrams
# 
#            PID   usecs
#            123    4567 |****                              |
#            456    2345 |**                                |
#            789    1234 |*                                 |
#            012      10 |                                  |
```

### function_graph Tracer

Shows function call graphs with timing:

```bash
echo function_graph > /sys/kernel/debug/tracing/current_tracer
echo "tcp_sendmsg" > /sys/kernel/debug/tracing/set_graph_function
echo 1 > /sys/kernel/debug/tracing/tracing_on

cat /sys/kernel/debug/tracing/trace_pipe
#  0)               |  tcp_sendmsg() {
#  0)               |    tcp_sendmsg_locked() {
#  0)   0.567 us    |      inet_sk_configure();
#  0)   1.234 us    |      sk_stream_alloc_skb();
#  0)   2.345 us    |      tcp_write_xmit();
#  0)   4.567 us    |    }
#  0)   5.678 us    |  }
```

## SystemTap: Custom Tracing Scripts

SystemTap is a scripting language for kernel tracing. It compiles scripts into kernel modules and loads them for execution:

```bash
# Install SystemTap
apt install systemtap systemtap-runtime
# or
dnf install systemtap systemtap-runtime

# Verify kernel support
stap -v -e 'probe begin { printf("hello\n") }'
```

### SystemTap Scripts

**Trace all file opens by a process:**

```stap
#!/usr/bin/env stap
probe syscall.openat {
    if (pid() == target())
        printf("%-16s PID=%-6d FD=%-4d PATH=%s\n", execname(), pid(), arg2, argstr)
}
```

Run with: `stap -x <PID> file_open.stp`

**Measure read latency distribution:**

```stap
#!/usr/bin/env stap
global reads

probe syscall.read.return {
    if (pid() == target()) {
        latency = gettimeofday_us() - @entry(gettimeofday_us())
        reads[latency]++
    }
}

probe end {
    foreach (lat in reads) {
        printf("%10d us: %d occurrences\n", lat, reads[lat])
    }
}
```

**Trace network packet sizes:**

```stap
#!/usr/bin/env stap
global sizes

probe kernel.function("tcp_sendmsg") {
    sizes[pid()] = arg2  # arg2 is size
}

probe kernel.function("tcp_sendmsg").return {
    if (sizes[pid()] > 0)
        printf("PID=%-6d SIZE=%-8d BYTES=%d\n", pid(), sizes[pid()], $return)
}
```

### SystemTap vs ftrace vs perf

| Aspect | SystemTap | ftrace | perf |
|--------|-----------|--------|------|
| Language | Custom scripting | Shell/echo | CLI commands |
| Flexibility | Very high | Medium | Low-Medium |
| Overhead | Variable | Low | Very low |
| Kernel dependency | Requires matching kernel | Built-in | Built-in |
| Deployment | Compile scripts to modules | Direct | Direct |
| Use case | Custom analysis | Kernel debugging | CPU profiling |

### Practical SystemTap Scripts

**Trace context switches for a process:**

```stap
#!/usr/bin/env stap
global switches

probe scheduler.cpu_on {
    if (pid() == target())
        switches[execname()]++
}

probe end {
    foreach (name in switches)
        printf("%-20s %d\n", name, switches[name])
}
```

**Measure syscall latency distribution:**

```stap
#!/usr/bin/env stap
global syscall_lat

probe syscall.*.return {
    if (pid() == target()) {
        lat = gettimeofday_us() - @entry(gettimeofday_us())
        syscall_lat[name] << lat
    }
}

probe end {
    foreach (name in syscall_lat)
        printf("%-20s avg=%d us\n", name, avg(syscall_lat[name]))
}
```

**Trace disk I/O by process:**

```stap
#!/usr/bin/env stap
global io_by_proc

probe ioblock.request {
    io_by_proc[execname()] += size
}

probe end {
    foreach (proc in io_by_proc)
        printf("%-20s %d bytes\n", proc, io_by_proc[proc])
}
```

**Monitor file descriptor usage:**

```stap
#!/usr/bin/env stap
global fd_count

probe kernel.function("__alloc_fd") {
    fd_count[execname()]++
}

probe kernel.function("__close_fd") {
    fd_count[execname()]--
}

probe timer.s(5) {
    foreach (proc in fd_count)
        printf("%-20s FDs: %d\n", proc, fd_count[proc])
}
```

## Hardware Performance Counters

Modern CPUs have built-in performance monitoring counters (PMCs) that count hardware events with zero overhead:

```bash
# View available performance counters
perf list hw

# Use perf stat to read counters
perf stat -e cycles,instructions,cache-misses,branch-misses -- sleep 1

# Output:
#   3,456,789,012  cycles
#   2,345,678,901  instructions    #  0.68 insn per cycle
#      123,456,789  cache-misses    #  5.27% of all cache refs
#        1,234,567  branch-misses   #  0.89% of all branches
```

### Key Metrics

| Metric | Good | Bad | What It Means |
|--------|------|-----|---------------|
| IPC | > 1.0 | < 0.5 | How efficiently the CPU executes instructions |
| Cache miss rate | < 1% | > 10% | How often data is not in L1/L2 cache |
| Branch miss rate | < 2% | > 10% | How often branch prediction fails |
| DTLB miss rate | < 0.1% | > 1% | How often page table walks are needed |

### Memory-Level Profiling

```bash
# Profile cache hierarchy misses
perf stat -e L1-dcache-loads,L1-dcache-load-misses,LLC-loads,LLC-load-misses -- sleep 1

# Output shows:
#   1,234,567,890  L1-dcache-loads
#       12,345,678  L1-dcache-load-misses    #  1.00% of all L1-dcache hits
#          234,567  LLC-loads
#           45,678  LLC-load-misses           # 19.50% of all LLC hits

# If LLC miss rate is high, your working set does not fit in cache
# Consider: data layout optimization, memory pool allocators, NUMA-aware allocation
```

## NUMA Effects on Performance

NUMA (Non-Uniform Memory Access) means that memory access time depends on which CPU is doing the access. On a multi-socket server, each CPU has local memory that is faster to access than remote memory (on the other socket).

### NUMA Topology

```bash
# View NUMA nodes
numactl --hardware
# available: 2 nodes (0-1)
# node 0 cpus: 0 1 2 3 4 5 6 7
# node 0 size: 32768 MB
# node 0 free: 16384 MB
# node 1 cpus: 8 9 10 11 12 13 14 15
# node 1 size: 32768 MB
# node 1 free: 24576 MB
# node distances:
# node   0   1
#   0:  10  21
#   1:  21  10

# View per-node memory usage
numastat
# node0:
#    numa_hit 12345678
#    numa_miss 0
#    numa_foreign 12345
#    interleave_hit 2345
#    local_node 12345678
#    other_node 0
```

### NUMA Effects

When a CPU on node 0 accesses memory on node 1, the latency is ~2x higher (21 vs 10 in the distance matrix above). This can have dramatic effects on performance:

```bash
# Find NUMA-unfriendly processes
numastat -p <PID>
# Per-process NUMA memory statistics for process 12345 (myapp):
#
# node0      node1
#  12345 MB   4567 MB   ← Process has memory on both nodes

# This means ~25% of memory accesses cross the NUMA interconnect
# Performance impact: 10-30% degradation depending on access pattern
```

### NUMA Optimization

```bash
# Pin a process to a specific NUMA node
numactl --cpunodebind=0 --membind=0 myapp

# Interleave memory across nodes (for large shared memory)
numactl --interleave=all myapp

# Set NUMA balancing policy
echo 0 > /proc/sys/kernel/numa_balancing  # Disable automatic balancing
echo 1 > /proc/sys/kernel/numa_balancing  # Enable automatic balancing

# Use mbind() for fine-grained NUMA policy in applications
# MPOL_BIND: Allocate only from specified nodes
# MPOL_INTERLEAVE: Round-robin across nodes
# MPOL_PREFERRED: Prefer specified node, fallback to others
```

## Real Scenario: Finding Why a Server Is Slow

### The Problem

A production database server (PostgreSQL on Ubuntu 22.04) was experiencing periodic latency spikes. Query response times jumped from 2ms to 200ms every 5-10 minutes, lasting 30-60 seconds. The DBA team confirmed the queries were simple and fast when run manually.

### Investigation with perf

```bash
# Step 1: Profile during normal operation
perf record -a -g -- sleep 30
perf report
# Top functions: mostly postgres functions, normal distribution

# Step 2: Profile during a latency spike
# Wait for the spike to happen, then:
perf record -a -g -- sleep 30
perf report
# 
# Overhead  Command      Shared Object        Symbol
#  34.56%   postgres     [kernel]             [k] _raw_spin_lock_irqsave
#  12.34%   postgres     [kernel]             [k] __folio_lock
#   8.90%   postgres     libc.so.6            [.] __memcpy_avx2
#   5.67%   postgres     [kernel]             [k] filemap_fault
#   4.32%   postgres     postgres             [.] heap_page_prune
```

The spike shows heavy lock contention (`_raw_spin_lock_irqsave`) and page faults (`filemap_fault`). This suggests memory pressure.

### Investigation with ftrace

```bash
# Trace page faults during a spike
echo 1 > /sys/kernel/debug/tracing/events/filemap/mm_filemap_add_to_page_cache/enable
echo 1 > /sys/kernel/debug/tracing/tracing_on
cat /sys/kernel/debug/tracing/trace_pipe > /tmp/trace.txt &
TRACE_PID=$!

# Wait for spike
sleep 30
kill $TRACE_PID
echo 0 > /sys/kernel/debug/tracing/tracing_on

# Analyze: which files are causing page cache misses?
grep -oP 'dev=\d+,\d+ ino=\d+' /tmp/trace.txt | sort | uniq -c | sort -rn | head
# 12345 dev=253,2 ino=789012  ← This inode is causing the most page faults
```

### Investigation with NUMA tools

```bash
numastat -p $(pgrep postgres)
# Per-process NUMA memory statistics for process 12345 (postgres):
#
# node0      node1
#  28000 MB   4000 MB   ← Most memory on node0

numactl --hardware
# Node 0 CPUs: 0-7
# Node 1 CPUs: 8-15
# Distance: 0↔1 = 21 (2x latency)

# Check which CPUs postgres is using
taskset -p $(pgrep postgres)
# pid 12345's current affinity mask: ff00  ← CPUs 8-15 (node 1)

# THE PROBLEM: postgres is running on node 1 but its memory is on node 0
# Every memory access crosses the NUMA interconnect, doubling latency
```

### Root Cause

The PostgreSQL instance was started without NUMA awareness. It was running on node 1 CPUs but its shared memory was allocated on node 0. During normal operation, the cached data handled most requests. During write spikes, the additional memory accesses (for dirty page flushing and WAL writes) crossed the NUMA interconnect, causing the latency spikes.

### Resolution

```bash
# Immediate: Pin postgres to the same node as its memory
numactl --cpunodebind=0 --membind=0 /usr/lib/postgresql/14/bin/postgres -D /var/lib/postgresql/14/main

# Short-term: Restart postgres with NUMA-aware settings
# In postgresql.conf:
# shared_buffers = '8GB'  # Matches node 0's free memory
# work_mem = '256MB'

# Restart with numactl
systemctl stop postgresql
numactl --interleave=all /usr/lib/postgresql/14/bin/postgres -D /var/lib/postgresql/14/main &

# Verify
numastat -p $(pgrep postgres)
# node0      node1
#  16000 MB  16000 MB  ← Memory interleaved across both nodes
```

### Long-term: NUMA-Aware Configuration

```bash
# Set NUMA policy for PostgreSQL service
cat > /etc/systemd/system/postgresql.service.d/numa.conf << 'EOF'
[Service]
ExecStart=
ExecStart=/usr/bin/numactl --interleave=all /usr/lib/postgresql/14/bin/postgres -D /var/lib/postgresql/14/main
EOF
systemctl daemon-reload
```

### Monitoring NUMA Health

```bash
# Periodic NUMA monitoring script
#!/bin/bash
while true; do
    echo "=== $(date) ==="
    numastat -p $(pgrep postgres) 2>/dev/null | grep -E "node[0-9]"
    sleep 60
done | tee -a /var/log/numa-monitor.log

# Alert on NUMA imbalance
numastat -p $(pgrep postgres) | awk '
    /node0/ { n0 = $2 }
    /node1/ { n1 = $2 }
    END {
        total = n0 + n1
        if (n0/total > 0.7 || n1/total > 0.7)
            print "WARNING: NUMA imbalance detected (" n0 "MB / " n1 "MB)"
    }
'
```

## Assessment

### Lab Task 1: CPU Profiling with perf (25 minutes)

1. Run `perf stat` on a CPU-intensive program and interpret the IPC, cache miss rate, and branch miss rate
2. Run `perf record -g` for 30 seconds on a busy system
3. Generate a flame graph from the recording
4. Identify the top 3 CPU-consuming functions from the flame graph
5. Explain what the flame graph tells you about the program's behavior

**Grading**: Correct perf stat usage (20%), recording (20%), flame graph generation (20%), interpretation (20%), explanation (20%)

### Lab Task 2: ftrace Function Tracing (25 minutes)

1. Enable function tracing for `tcp_*` functions
2. Generate network traffic and capture the trace
3. Switch to function_graph tracer and trace `tcp_sendmsg`
4. Create a histogram of `tcp_sendmsg` latencies
5. Interpret the results and identify performance characteristics

**Grading**: Function trace (20%), network traffic (20%), function_graph (20%), histogram (20%), interpretation (20%)

### Lab Task 3: NUMA Analysis (25 minutes)

1. Run `numactl --hardware` and document the NUMA topology
2. Find a process with NUMA-unfriendly memory access patterns
3. Use `numastat -p` to show the memory distribution across nodes
4. Pin the process to a single node and measure performance improvement
5. Document the performance difference with specific numbers

**Grading**: Topology documentation (15%), NUMA-unfriendly process (25%), memory analysis (25%), pinning test (20%), documentation (15%)

### Lab Task 4: Performance Bottleneck Hunt (35 minutes)

1. Create a scenario with a performance bottleneck (e.g., lock contention, memory allocation pressure)
2. Use perf to identify the bottleneck area
3. Use ftrace to get detailed function-level timing
4. Use hardware counters to determine if the bottleneck is CPU, memory, or I/O bound
5. Propose and implement a fix
6. Verify the fix with before/after perf stat comparison

**Grading**: Bottleneck creation (10%), perf analysis (25%), ftrace analysis (25%), hardware counter analysis (15%), fix and verification (25%)

## Evidence

### Performance Profiling Understanding

Evidence of mastery includes:

- Using `perf record` and `perf report` to identify CPU hotspots
- Reading flame graphs to understand call stack behavior and identify optimization targets
- Using `perf stat` to measure IPC, cache miss rate, and branch prediction accuracy
- Tracing kernel functions with ftrace and interpreting the output
- Using ftrace histograms to measure event latency distributions
- Understanding NUMA topology and optimizing memory placement
- Writing SystemTap scripts for custom kernel tracing
- Choosing the right profiling tool for different scenarios (perf for CPU, ftrace for kernel, SystemTap for custom)

### Key Diagnostic Commands

| Command | Purpose |
|---------|---------|
| `perf record -a -g -- sleep 30` | System-wide CPU profile |
| `perf report` | Analyze perf recording |
| `perf stat -e <events> -- sleep 1` | Read hardware counters |
| `perf trace -p <PID> -s` | Low-overhead syscall tracing |
| `perf probe --add <func>` | Add dynamic trace probe |
| `ftrace function` | Kernel function tracing |
| `ftrace function_graph` | Kernel call graph with timing |
| `ftrace events` | Kernel event tracing |
| `numactl --hardware` | NUMA topology |
| `numastat -p <PID>` | Per-process NUMA statistics |
| `numactl --cpunodebind=N` | Pin process to NUMA node |
| `flamegraph.pl` | Generate flame graph SVGs |
| `cachegrind` | Cache simulation (valgrind) |
| `sysdig -p %proc.name` | System-wide container-aware tracing |