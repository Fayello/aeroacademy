# Module 7 — Namespaces and Containers

## Containers Are Not Magic

Containers are not a special kernel feature. They are an ordinary Linux process that uses two existing kernel features: **namespaces** (isolation) and **cgroups** (resource limits). A container is simply a process that cannot see or affect processes outside its own namespace, and whose resource usage is capped by cgroup limits.

Understanding how containers work at the kernel level is essential for debugging container issues, securing container environments, and knowing the boundaries of container isolation.

## Linux Namespaces

Namespaces partition kernel resources so that one process sees a different view of the system than another process. Each namespace type isolates a specific subsystem.

### PID Namespace

A PID namespace isolates the process ID number space. The first process inside a new PID namespace gets PID 1 (the init process for that namespace). It cannot see processes outside its namespace.

```bash
# Create a new PID namespace and run bash in it
unshare --pid --fork --mount-proc bash

# Inside the namespace:
ps aux
# USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
# root         1  0.0  0.0  12345  6789 ?        S    10:00   0:00 bash
# root        12  0.0  0.0  34567  1234 ?        R+   10:00   0:00 ps aux

# The host PID 1 (systemd) is not visible
# Inside the namespace, PID 1 is bash
```

PID namespaces are hierarchical. A process in a child namespace can see processes in the parent namespace (as higher PIDs), but not vice versa. This is how containers see the host's container runtime processes.

### Network Namespace

A network namespace provides an isolated network stack: its own interfaces, IP addresses, routing tables, port numbers, and firewall rules.

```bash
# Create a new network namespace
ip netns add test_ns

# Create a veth pair (virtual ethernet cable)
ip link add veth0 type veth peer name veth1

# Move one end into the namespace
ip link set veth1 netns test_ns

# Configure the namespace end
ip netns exec test_ns ip addr add 10.0.0.2/24 dev veth1
ip netns exec test_ns ip link set veth1 up
ip netns exec test_ns ip link set lo up

# Configure the host end
ip addr add 10.0.0.1/24 dev veth0
ip link set veth0 up

# Test connectivity
ip netns exec test_ns ping 10.0.0.1
# PING 10.0.0.1: 64 bytes from 10.0.0.1: icmp_seq=1 ttl=64 time=0.089 ms
```

Each network namespace has its own set of network interfaces, which is why containers can have their own IP address and port space. Port 8080 inside a container is not the same as port 8080 on the host.

### Mount Namespace

A mount namespace provides an isolated set of mount points. Processes in different mount namespaces see different filesystem hierarchies.

```bash
# Create a new mount namespace
unshare --mount bash

# Inside the namespace, mounts are independent
mount -t tmpfs tmpfs /mnt
ls /mnt/  # Empty

# On the host, /mnt is unchanged
```

Docker containers use mount namespaces (combined with pivot_root) to present a completely separate filesystem to the container process. The container sees its own root filesystem, and cannot access the host's filesystem.

### UTS Namespace

The UTS (UNIX Timesharing System) namespace isolates the hostname and NIS domain name:

```bash
unshare --uts bash
hostname container-test
hostname
# container-test

# On the host, hostname is unchanged
```

This is why each container can have its own hostname.

### IPC Namespace

The IPC namespace isolates System V IPC objects and POSIX message queues:

```bash
unshare --ipc bash
# Create an IPC object
ipcmk -M 1024
# This object is not visible from other IPC namespaces
```

IPC isolation prevents containers from communicating through shared memory segments or semaphores.

### User Namespace

User namespaces map a range of user IDs inside the namespace to a different range on the host. The most powerful use case is allowing an unprivileged user to appear as root inside a container:

```bash
# Create a user namespace where UID 0 maps to UID 1000 on the host
unshare --user --map-root-user bash

# Inside the namespace:
id
# uid=0(root) gid=0(root) groups=0(root)

# On the host, this is still UID 1000
cat /proc/$$/status | grep Uid
# Uid:    1000    1000    1000    1000
```

User namespaces are the foundation of rootless containers. They allow unprivileged users to run containers without giving them actual root access on the host.

### Namespace System Calls

The kernel provides three system calls for namespace operations:

```c
// Create new namespaces
int clone(int (*child_fn)(void *), void *stack, int flags, void *arg);
// flags: CLONE_NEWPID | CLONE_NEWNET | CLONE_NEWNS | ...

// Switch to existing namespaces
int unshare(int flags);
// Detach from current namespaces and create new ones

// Enter an existing namespace
int setns(int fd, int nstype);
// Join an existing namespace (fd from /proc/[pid]/ns/*)
```

### Viewing Namespaces

```bash
# View namespace for a process
ls -la /proc/1/ns/
# lrwxrwxrwx 1 root root 0 ... cgroup -> 'cgroup:[4026531835]'
# lrwxrwxrwx 1 root root 0 ... ipc -> 'ipc:[4026531839]'
# lrwxrwxrwx 1 root root 0 ... mnt -> 'mnt:[4026531840]'
# lrwxrwxrwx 1 root root 0 ... net -> 'net:[4026531969]'
# lrwxrwxrwx 1 root root 0 ... pid -> 'pid:[4026531836]'
# lrwxrwxrwx 1 root root 0 ... pid_for_children -> 'pid:[4026531836]'
# lrwxrwxrwx 1 root root 0 ... time -> 'time:[4026531834]'
# lrwxrwxrwx 1 root root 0 ... user -> 'user:[4026531837]'
# lrwxrwxrwx 1 root root 0 ... uts -> 'uts:[4026531838]'

# View namespaces of all processes
lsns
# NS TYPE   NPROCS   PID USER    COMMAND
# 402 cgroup      2     1 root    /sbin/init
# 402 ipc       234     1 root    /sbin/init
# 402 mnt         1   567 root    /usr/sbin/sshd -D
# 402 net        12    89 root    containerd-shim-runc-v2
# 402 pid        12    89 root    containerd-shim-runc-v2
# 402 user      234     1 root    /sbin/init
# 402 uts        12    89 root    containerd-shim-rimc-v2

# Compare namespaces of two processes
ls -la /proc/1/ns/pid /proc/1234/ns/pid
# If the inode numbers differ, they are in different PID namespaces
```

## Control Groups (cgroups)

While namespaces provide isolation, cgroups provide resource limits. A cgroup is a kernel mechanism for controlling the resource usage of a group of processes.

### cgroups v1 vs v2

**cgroups v1** (legacy) uses separate hierarchies for each resource controller:

```bash
# cgroups v1 layout
/sys/fs/cgroup/
├── cpu/          # CPU scheduling
│   └── mygroup/
│       ├── cpu.cfs_quota_us
│       └── cpu.cfs_period_us
├── memory/       # Memory limits
│   └── mygroup/
│       ├── memory.limit_in_bytes
│       └── memory.usage_in_bytes
├── blkio/        # Block I/O
│   └── mygroup/
├── cpuset/       # CPU affinity
│   └── mygroup/
└── pids/         # Process count limits
    └── mygroup/
```

**cgroups v2** (unified) uses a single hierarchy:

```bash
# cgroups v2 layout
/sys/fs/cgroup/
├── mygroup/
│   ├── cgroup.controllers       # Available controllers
│   ├── cgroup.subtree_control   # Controllers delegated to children
│   ├── cpu.max                  # CPU bandwidth
│   ├── memory.max               # Memory limit
│   ├── memory.current           # Current memory usage
│   ├── io.max                   # I/O bandwidth
│   └── pids.max                 # Process count limit
```

Check which version your system uses:

```bash
stat -f -c %T /sys/fs/cgroup/
# If "cgroup2fs" → v2
# If "tmpfs" → v1 (or hybrid)
```

### Resource Limits with cgroups v2

**CPU bandwidth limiting:**

```bash
# Create a cgroup
mkdir /sys/fs/cgroup/mygroup

# Limit to 50% of one CPU (100000/200000 = 50%)
echo "200000 100000" > /sys/fs/cgroup/mygroup/cpu.max

# Add a process
echo $PID > /sys/fs/cgroup/mygroup/cgroup.procs
```

**Memory limiting:**

```bash
# Hard limit: OOM kill when exceeded
echo 1G > /sys/fs/cgroup/mygroup/memory.max

# Soft limit: reclaim pressure when exceeded
echo 800M > /sys/fs/cgroup/mygroup/memory.high

# View current usage
cat /sys/fs/cgroup/mygroup/memory.current
# 524288000  (500 MB)
```

**I/O limiting:**

```bash
# Limit read/write to 100 MB/s on device 8:0 (sda)
echo "8:0 rbps=104857600 wbps=104857600" > /sys/fs/cgroup/mygroup/io.max
```

### Using systemd for cgroups

systemd manages cgroups automatically for services:

```bash
# Create a service with resource limits
systemd-run --scope \
    -p CPUQuota=50% \
    -p MemoryMax=1G \
    -p MemoryHigh=800M \
    -p IOWeight=100 \
    /usr/bin/myapp

# Or in a service unit file
cat > /etc/systemd/system/myapp.service << 'EOF'
[Service]
ExecStart=/usr/bin/myapp
CPUQuota=50%
MemoryMax=1G
MemoryHigh=800M
IOWeight=100
EOF
systemctl daemon-reload
systemctl start myapp
```

## Container Runtime: runc, containerd, CRI-O

A container runtime is the software that creates and runs containers. The container ecosystem has multiple layers:

### The Container Stack

```
┌─────────────────────────────────────────────┐
│ Container Orchestrator (Kubernetes)          │
├─────────────────────────────────────────────┤
│ Container Runtime Interface (CRI)           │
├──────────────────┬──────────────────────────┤
│ containerd       │ CRI-O                    │
├──────────────────┴──────────────────────────┤
│ OCI Runtime Spec                            │
├──────────────────┬──────────────────────────┤
│ runc             │ crun, kata, gVisor       │
├──────────────────┴──────────────────────────┤
│ Linux Kernel (namespaces + cgroups)         │
└─────────────────────────────────────────────┘
```

### runc

runc is the reference implementation of the OCI (Open Container Initiative) runtime specification. It is a low-level tool that creates containers from an OCI bundle (a rootfs directory + a config.json):

```bash
# Create an OCI bundle
mkdir /tmp/mycontainer/rootfs
# Copy rootfs contents
cp -a /path/to/rootfs/* /tmp/mycontainer/rootfs/

# Generate default config
cd /tmp/mycontainer
runc spec

# Customize config.json (set command, rootfs path, namespace settings)
# ...

# Create and run the container
runc create mycontainer
runc start mycontainer

# Or as a one-shot
runc run mycontainer
```

### containerd

containerd is a daemon that manages the complete container lifecycle: image transfer, storage, container execution, supervision, and networking. It is the runtime used by Docker and Kubernetes:

```bash
# List running containers
ctr containers list

# List images
ctr images list

# Pull an image
ctr images pull docker.io/library/alpine:latest

# Run a container
ctr run docker.io/library/alpine:latest myalpine sh
```

### CRI-O

CRI-O is a lightweight container runtime specifically designed for Kubernetes. It implements the CRI (Container Runtime Interface) and nothing else:

```bash
# CRI-O manages containers created by Kubernetes
# It is not used directly from the command line

# View CRI-O containers
crictl ps
crictl pods
crictl images
```

## Container Networking

Every container needs network connectivity. The default Docker networking model uses several kernel features:

### veth Pairs

A veth (virtual ethernet) pair is a virtual network cable with two endpoints. Whatever goes in one end comes out the other:

```bash
# Create a veth pair
ip link add veth0 type veth peer name veth1

# Each end gets its own network namespace
ip link set veth0 netns host_ns
ip link set veth1 netns container_ns

# Configure addresses
ip netns exec host_ns ip addr add 10.0.0.1/24 dev veth0
ip netns exec host_ns ip link set veth0 up
ip netns exec container_ns ip addr add 10.0.0.2/24 dev veth1
ip netns exec container_ns ip link set veth1 up
```

### Linux Bridge

Docker creates a bridge network (docker0) that connects all containers:

```bash
# View the Docker bridge
ip addr show docker0
# docker0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
#     inet 172.17.0.1/16 scope global docker0

# View veth pairs connected to the bridge
brctl show docker0
# bridge name    bridge id          STP enabled    interfaces
# docker0        8000.0242ac110001  no             veth1234abc
#                                                    veth5678def
```

Each container gets one end of a veth pair, and the other end is attached to the bridge. The bridge acts as a virtual switch, forwarding packets between containers.

### Overlay Networks

For multi-host networking (Docker Swarm, Kubernetes), overlay networks tunnel packets between hosts using VXLAN:

```bash
# Create an overlay network
docker network create --driver overlay myoverlay

# The overlay creates a VXLAN tunnel between hosts
# Containers on different hosts can communicate as if on the same L2 network
```

### Container Network Flow

```
Container A                    Host                    Container B
┌──────────┐            ┌──────────────┐            ┌──────────┐
│ eth0     │──veth pair──│ docker0      │──veth pair──│ eth0     │
│ 172.17.0.2│            │ 172.17.0.1  │            │ 172.17.0.3│
└──────────┘            │ iptables NAT │            └──────────┘
                        │ masquerade   │
                        └──────────────┘
```

### Container Network Isolation

Each container's network namespace is completely isolated:

```bash
# From inside container A
ip addr show
# eth0: inet 172.17.0.2/16

# From inside container B
ip addr show
# eth0: inet 172.17.0.3/16

# Containers cannot see each other's network interfaces
# They can only communicate through the bridge (default Docker network)

# Port mapping: expose container port to host
docker run -p 8080:80 nginx
# Host port 8080 → Container port 80
# iptables rules are created automatically

# View the iptables rules
iptables -t nat -L -n | grep 8080
# DNAT tcp -- 0.0.0.0/0 0.0.0.0/0 tcp dpt:8080 to:172.17.0.2:80
```

### DNS Resolution in Containers

Containers use a DNS server provided by the container runtime:

```bash
# Inside a Docker container
cat /etc/resolv.conf
# nameserver 127.0.0.11
# search localdomain

# Docker's embedded DNS server resolves:
# 1. Container names (on user-defined networks)
# 2. Service names (in Docker Swarm)
# 3. External DNS (forwarded to host DNS)

# Create a network with DNS
docker network create mynet
docker run --network mynet --name web nginx
docker run --network mynet --name app alpine ping web
# Resolves "web" to the nginx container's IP
```

### Container Network Performance

```bash
# Test network throughput between containers
# Server (in container A):
iperf3 -s

# Client (in container B):
iperf3 -c 172.17.0.2
# [ ID] Interval       Transfer     Bitrate
# [  5]  0.00-10.00  sec  11.0 GBytes  9.42 Gbits/sec

# Compare with host network (no container overhead)
iperf3 -c <host-ip>
# [ ID] Interval       Transfer     Bitrate
# [  5]  0.00-10.00  sec  11.2 GBytes  9.59 Gbits/sec

# Container networking adds minimal overhead (~1-3%)
# For high-performance networking, use:
# 1. Host network mode (--network host)
# 2. DPDK or SR-IOV for near-native performance
# 3. XDP for packet processing at the NIC level
```

## Container Storage

### OverlayFS

OverlayFS is the union filesystem used by most container runtimes. It merges multiple directories (layers) into a single view:

```bash
# Create overlay mount
mkdir -p /tmp/overlay/{lower,upper,work,merged}
echo "lower layer" > /tmp/overlay/lower/file1.txt
echo "upper layer" > /tmp/overlay/upper/file2.txt

mount -t overlay overlay \
    -o lowerdir=/tmp/overlay/lower,upperdir=/tmp/overlay/upper,workdir=/tmp/overlay/work \
    /tmp/overlay/merged

ls /tmp/overlay/merged/
# file1.txt  (from lower)
# file2.txt  (from upper)
```

**How Docker layers work:**

```
┌─────────────────────────────────┐
│         merged (view)           │  ← Container sees this
├─────────────────────────────────┤
│     upper (container layer)     │  ← Write layer (changes go here)
├─────────────────────────────────┤
│     lower (image layers)        │  ← Read-only base layers
└─────────────────────────────────┘
```

When a container writes to a file that exists in a lower layer, OverlayFS performs **copy-up**: it copies the file from the lower layer to the upper layer, then modifies the upper copy. The lower layer remains unchanged.

```bash
# View overlay mounts
mount | grep overlay
# overlay on /var/lib/docker/overlay2/abc123/merged type overlay (rw,lowerdir=...,upperdir=...,workdir=...)
```

### Device Mapper

Device mapper is an older container storage driver that creates thin-provisioned logical volumes for each container:

```bash
# View device mapper thin volumes
dmsetup ls
# docker-253:0-12345-abc123   (0, 10485760)
# docker-253:0-12345-def456   (0, 20971520)

# View thin pool
dmsetup table docker-thinpool
# 0 209715200 thin-pool 8 16384 0 0 1
```

Device mapper is being replaced by OverlayFS in most distributions because OverlayFS is simpler, faster, and more efficient.

## Real Scenario: Building a Container from Scratch

### The Goal

Build a minimal container without Docker — just using the Linux primitives (unshare, mount, chroot, cgroups). This exercise demonstrates exactly what a container is at the kernel level.

### Step 1: Create a Root Filesystem

```bash
# Create minimal rootfs using debootstrap
mkdir -p /tmp/mycontainer/rootfs
debootstrap --variant=minbase focal /tmp/mycontainer/rootfs http://archive.ubuntu.com/ubuntu

# Or copy a minimal set of files manually
mkdir -p /tmp/mycontainer/rootfs/{bin,sbin,lib,lib64,usr,etc,var,proc,sys,dev,tmp}
cp /bin/bash /tmp/mycontainer/rootfs/bin/
cp /bin/ls /tmp/mycontainer/rootfs/bin/
cp /bin/cat /tmp/mycontainer/rootfs/bin/
# Copy required shared libraries (check with ldd)
ldd /bin/bash
# Copy each listed .so file to the corresponding path in rootfs
```

### Step 2: Create the Container Config

```bash
# OCI-style config.json
cat > /tmp/mycontainer/config.json << 'EOF'
{
    "ociVersion": "1.0.0",
    "process": {
        "terminal": true,
        "user": { "uid": 0, "gid": 0 },
        "args": ["/bin/bash"],
        "env": ["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],
        "cwd": "/"
    },
    "root": {
        "path": "rootfs",
        "readonly": false
    },
    "linux": {
        "namespaces": [
            { "type": "pid" },
            { "type": "net" },
            { "type": "mnt" },
            { "type": "uts" },
            { "type": "ipc" }
        ],
        "resources": {
            "memory": { "limit": 268435456 },
            "cpu": { "shares": 512 }
        }
    }
}
EOF
```

### Step 3: Set Up cgroups

```bash
# Create cgroup for the container
mkdir -p /sys/fs/cgroup/memory/mycontainer
mkdir -p /sys/fs/cgroup/cpu/mycontainer

# Set memory limit to 256 MB
echo 268435456 > /sys/fs/cgroup/memory/mycontainer/memory.limit_in_bytes

# Set CPU limit to 50%
echo 50000 100000 > /sys/fs/cgroup/cpu/mycontainer/cpu.cfs_quota_us
```

### Step 4: Create the Container with unshare

```bash
#!/bin/bash
# run_container.sh — Create and enter a container

CONTAINER_ROOT=/tmp/mycontainer/rootfs
CGROUP_PATH=/sys/fs/cgroup/memory/mycontainer

# Create new namespaces and fork
unshare --pid --mount --uts --ipc --net --fork /bin/bash << 'CONTAINER'
    # Set hostname
    hostname mycontainer

    # Mount /proc in the new PID namespace
    mount -t proc proc /proc

    # Mount sysfs
    mount -t sysfs sysfs /sys

    # Mount devtmpfs
    mount -t devtmpfs devtmpfs /dev

    # Set cgroup limits
    echo $$ > /sys/fs/cgroup/memory/mycontainer/cgroup.procs

    # Change root
    cd $CONTAINER_ROOT
    mount --bind $CONTAINER_ROOT $CONTAINER_ROOT
    pivot_root . . 2>/dev/null || chroot . /bin/bash

    # Clean up old root
    umount -l / 2>/dev/null

    # We are now in the container
    echo "=== Inside the container ==="
    echo "PID: $$"
    echo "Hostname: $(hostname)"
    echo "Mount points:"
    mount | head -5
    echo "Processes:"
    ps aux

    /bin/bash
CONTAINER
```

### Step 5: Verify Isolation

```bash
# On the host, verify the container is isolated:
lsns  # Show the new namespaces
cat /proc/<container_pid>/cgroup  # Show cgroup membership
free -m  # Compare with container's view

# Inside the container:
hostname  # Shows "mycontainer"
ps aux    # Only container processes
cat /proc/meminfo | head  # Memory limited to 256 MB
```

### Step 6: Network Setup

```bash
# On the host, set up networking for the container
# (Simplified — Docker does this automatically)

# Create veth pair
ip link add veth0 type veth peer name veth1
ip link set veth1 netns <container_pid>  # Move to container namespace

# Configure host side
ip addr add 172.17.0.1/24 dev veth0
ip link set veth0 up
ip link set docker0 up 2>/dev/null || true

# Configure container side (from container namespace)
nsenter -t <container_pid> -n ip addr add 172.17.0.2/24 dev veth1
nsenter -t <container_pid> -n ip link set veth1 up
nsenter -t <container_pid> -n ip link set lo up
nsenter -t <container_pid> -n ip route add default via 172.17.0.1

# Enable IP forwarding and NAT on host
echo 1 > /proc/sys/net/ipv4/ip_forward
iptables -t nat -A POSTROUTING -s 172.17.0.0/16 -j MASQUERADE
```

## Assessment

### Lab Task 1: Namespace Exploration (25 minutes)

1. Create a new PID namespace using `unshare --pid --fork --mount-proc bash`
2. Inside the namespace, verify you can only see processes within the namespace
3. Create a new network namespace and configure a veth pair
4. Verify network isolation by pinging from the namespace
5. Document all namespace types and their isolation boundaries

**Grading**: PID namespace isolation (25%), network namespace setup (25%), isolation verification (25%), documentation (25%)

### Lab Task 2: cgroup Resource Limits (25 minutes)

1. Create a cgroup v2 hierarchy with CPU and memory limits
2. Run a CPU-intensive process and verify it is limited to 50% CPU
3. Run a memory-intensive process and verify it is killed at the memory limit
4. Use systemd-run to achieve the same resource limits
5. Monitor resource usage through cgroup files

**Grading**: CPU limit (25%), memory limit (25%), systemd-run (25%), monitoring (25%)

### Lab Task 3: Container from Scratch (35 minutes)

1. Follow the "Building a Container from Scratch" scenario
2. Create a minimal rootfs with at least bash and ls
3. Set up PID and mount namespaces
4. Set up a memory cgroup limit
5. Verify isolation from inside the container
6. Set up basic networking with a veth pair

**Grading**: Rootfs creation (15%), namespace setup (20%), cgroup limits (20%), isolation verification (20%), networking (15%), documentation (10%)

### Lab Task 4: Container Networking (20 minutes)

1. Create two network namespaces representing two containers
2. Connect them via a bridge
3. Verify connectivity between the two namespaces
4. Add NAT for external access
5. Demonstrate port isolation (same port in different namespaces)

**Grading**: Namespace creation (20%), bridge setup (25%), connectivity (25%), NAT (15%), port isolation (15%)

## Evidence

### Container Technology Understanding

Evidence of mastery includes:

- Creating and managing Linux namespaces with unshare, nsenter, and lsns
- Configuring cgroup resource limits using both direct filesystem and systemd
- Understanding the container runtime stack: Docker → containerd → runc → kernel
- Building a minimal container from scratch using only kernel primitives
- Configuring container networking with veth pairs and bridges
- Understanding overlay filesystem layering and copy-up semantics
- Reading and writing OCI bundle specifications (config.json)

### Key Diagnostic Commands

| Command | Purpose |
|---------|---------|
| `lsns` | List all namespaces |
| `nsenter -t <PID> -n` | Enter a process's network namespace |
| `nsenter -t <PID> -m` | Enter a process's mount namespace |
| `cat /proc/<PID>/cgroup` | View cgroup membership |
| `cat /proc/<PID>/ns/*` | View namespace identifiers |
| `ctr containers list` | List containerd containers |
| `crictl ps` | List CRI-O containers |
| `docker inspect <container>` | Container configuration details |
| `ip netns list` | List network namespaces |
| `mount \| grep overlay` | View overlay mounts |
| `cat /sys/fs/cgroup/memory.current` | cgroup memory usage |

### Container Isolation Boundaries

Understanding what namespaces do and do not isolate:

| Resource | Isolated? | Mechanism |
|----------|-----------|-----------|
| Process IDs | Yes | PID namespace |
| Network stack | Yes | Network namespace |
| Filesystem | Yes | Mount namespace + pivot_root |
| Hostname | Yes | UTS namespace |
| IPC objects | Yes | IPC namespace |
| Users/groups | Partially | User namespace |
| Time | Yes | Time namespace (5.6+) |
| CPU usage | No | cgroups (limits, not isolation) |
| Memory usage | No | cgroups (limits, not isolation) |
| Kernel modules | No | Shared kernel |
| Devices | Partially | Device cgroup |
| Kernel version | No | Shared kernel |