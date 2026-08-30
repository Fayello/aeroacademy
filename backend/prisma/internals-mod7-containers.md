# Module 7 — Namespaces and Containers

**Course:** Linux Internals | **Path:** Linux Internals (7 of 10)

---

## What You'll Actually Do

You've been using Docker. Now you'll understand what Docker actually does under the hood — namespaces, cgroups, and how a container is just a process with restricted visibility.

---

## What Is a Container?

A container is not a virtual machine. It's a process (or group of processes) that:
- Has its own view of the filesystem (mount namespace)
- Has its own network stack (network namespace)
- Has its own process tree (PID namespace)
- Has resource limits (cgroups)
- Shares the kernel with the host

```bash
# A container is just a process
docker run --rm alpine ps aux
# PID 1 is ps (not systemd!)
```

---

## Linux Namespaces

Namespaces give each process its own isolated view of the system.

| Namespace | What it isolates |
|-----------|-----------------|
| PID | Process IDs (container sees only its own processes) |
| Mount | Filesystem mount points |
| Network | Network interfaces, IPs, routes |
| UTS | Hostname and domain |
| IPC | Inter-process communication |
| User | User and group IDs |
| Cgroup | Cgroup root directory |

**Create a namespace manually:**
```bash
# PID namespace
sudo unshare --pid --fork --mount-proc bash
ps aux
# PID 1 is bash, no other processes visible

# Network namespace
sudo ip netns add test_ns
sudo ip netns exec test_ns ip addr
# only loopback interface
```

---

## cgroups — Resource Limits

cgroups control how much CPU, memory, and I/O a process group can use.

```bash
# cgroup v2 (modern)
cat /sys/fs/cgroup/cgroup.controllers
# cpu io memory pids

# Create a cgroup
sudo mkdir /sys/fs/cgroup/mygroup
echo "+cpu +memory +io" | sudo tee /sys/fs/cgroup/mygroup/cgroup.subtree_control

# Limit memory to512MB
echo "536870912" | sudo tee /sys/fs/cgroup/mygroup/memory.max

# Limit CPU to50%
echo "50000 100000" | sudo tee /sys/fs/cgroup/mygroup/cpu.max

# Add a process
echo $PID | sudo tee /sys/fs/cgroup/mygroup/cgroup.procs
```

**What Docker does:**
```bash
docker run -m 512m --cpus 0.5 alpine
# → Creates cgroup with memory.max=512MB, cpu.max=50%
```

---

## Building a Container from Scratch

```bash
# 1. Create a rootfs
mkdir -p /tmp/container/rootfs
debootstrap --variant=minbase bullseye /tmp/container/rootfs

# 2. Create namespaces
sudo unshare --pid --mount --net --uts --ipc --fork \
    chroot /tmp/container/rootfs /bin/bash

# 3. Inside the namespace
mount -t proc proc /proc
mount -t sysfs sys /sys
mount -t tmpfs tmpfs /tmp
hostname container-test

# 4. You're now in a container (manually)
ps aux
# Only your processes visible
ip addr
# Only loopback interface
```

---

## How Docker Differs from VMs

| Feature | Container | VM |
|---------|-----------|-----|
| Kernel | Shared with host | Own kernel |
| Isolation | Process-level | Full OS |
| Startup | Milliseconds | Minutes |
| Size | Megabytes | Gigabytes |
| Security | Weaker (shared kernel) | Stronger |
| Portability | Requires same kernel | Runs anywhere |

---

## Assessment

**Lab task (25 min):**

1. Create a PID namespace and observe process isolation
2. Create a network namespace and observe network isolation
3. Set up a cgroup with memory and CPU limits
4. Build a minimal container from scratch
5. Compare container vs VM behavior

**Grading:**
- PID namespace created: 20%
- Network namespace created: 20%
- cgroup limits working: 25%
- Container built: 20%
- Comparison documented: 15%

---

## Evidence

- **OutcomeEvidence:** `INT-LO7 — Namespaces & Containers`

---

## Unlock

Module8 — Device Drivers and Hardware. You know how containers work. Now you learn how the kernel talks to hardware.
