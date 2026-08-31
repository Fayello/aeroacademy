# Module 4 — Filesystems

## The Linux Filesystem Stack

Filesystems are how Linux persists data to disk and organizes it into a usable hierarchy. From the kernel's perspective, every filesystem is an implementation of the Virtual File System (VFS) interface — a abstraction layer that lets different filesystems present a unified API to user space.

Understanding filesystem internals matters for three reasons: performance tuning (choosing the right filesystem and mount options), data recovery (knowing what happens on corruption), and debugging (tracing I/O issues to the filesystem layer).

## VFS: The Virtual File System

The VFS layer is the kernel's abstraction that allows multiple filesystem types to coexist. Every `open()`, `read()`, `write()`, and `close()` system call passes through VFS before reaching the actual filesystem driver.

### Core Objects

VFS defines four primary objects:

**Superblock** — Represents a mounted filesystem. Contains:
- Filesystem type
- Block size
- Root inode
- Filesystem-specific state (free blocks, mount count, etc.)

```bash
# View superblock info
dumpe2fs /dev/sda1 | head -30
# or
tune2fs -l /dev/sda1
```

**Inode** — Represents a file or directory. Contains:
- File type (regular file, directory, symlink, device, etc.)
- Permissions (mode, uid, gid)
- Size
- Timestamps (atime, mtime, ctime)
- Pointers to data blocks (or extent tree)
- Extended attributes

Every file has an inode number. The filename is just a mapping in the directory to an inode:

```bash
# Find the inode of a file
ls -i myfile.txt
# 131074 myfile.txt

# View inode details
stat myfile.txt
#   File: myfile.txt
#   Size: 1024       Blocks: 8          IO Block: 4096   regular file
# Device: 801h/2049d Inode: 131074      Links: 1
# Access: (0644/-rw-r--r--)  Uid: ( 1000/  user)   Gid: ( 1000/  user)
# Access: 2026-08-30 10:00:00.000000000 -0500
# Modify: 2026-08-29 14:30:00.000000000 -0500
# Change: 2026-08-29 14:30:00.000000000 -0500
```

**Dentry** — Represents a directory entry. Maps a filename to an inode. Dentries are cached in memory (the dentry cache) for fast lookups:

```bash
# View dentry cache stats
cat /proc/fs/dentry-state
# total_remainig  nr_negative  age_limit  want_pages  nr_scan

# Force dentry cache drop
echo 2 > /proc/sys/vm/drop_caches
```

**File** — Represents an open file. Created by `open()` and contains:
- Current position (offset)
- Access mode (read, write, read-write)
- Pointer to the inode
- File operations table (read, write, mmap, ioctl, etc.)

### The Path Walk

When a process calls `open("/var/log/syslog", O_RDONLY)`, the kernel performs a **path walk**:

1. Start at the root directory (`/`) — get its dentry and inode
2. Look up "var" in the root directory's inode — get var's dentry and inode
3. Look up "log" in var's inode — get log's dentry and inode
4. Look up "syslog" in log's inode — get syslog's dentry and inode
5. Check permissions against the process's credentials
6. Create a `file` object with the inode and return a file descriptor

Each step involves a dentry lookup. If the dentry is in the dentry cache, the lookup is fast (memory access). If not, the kernel must read the directory from disk (I/O access).

## ext4: The Default Linux Filesystem

ext4 (Fourth Extended Filesystem) is the default filesystem on most Linux distributions. It is a mature, journaled filesystem designed for general use.

### Journaling

ext4 uses **journaling** to ensure filesystem consistency after a crash. Before writing data to its final location, ext4 writes a log (journal) of the intended changes. If the system crashes mid-write, the journal can be replayed to complete or roll back the operation.

ext4 supports three journaling modes:

| Mode | What is journaled | Performance | Safety |
|------|-------------------|-------------|--------|
| `data=writeback` | Only metadata | Fastest | Data may be stale after crash |
| `data=ordered` | Metadata, data written first | Balanced | Default, good compromise |
| `data=full` | Metadata and data | Slowest | Maximum safety |

```bash
# Check current journal mode
tune2fs -l /dev/sda1 | grep "Filesystem features"

# Mount with specific journal mode
mount -o remount,data=writeback /dev/sda1
```

The default `data=ordered` mode ensures that data blocks are written to disk before the metadata that references them. This means that after a crash, you will never see a file with zeroed-out blocks where data should be — but you might see a zero-length file where data was being appended.

### Extents and Allocation

ext4 uses **extents** instead of traditional block mapping. An extent is a contiguous range of physical blocks described by three values: starting block, length, and logical block. This is much more efficient for large files:

```
Old (ext2/3): block pointer array
[0] → block 100
[1] → block 101
[2] → block 102
...
[255] → block 355

New (ext4): extent tree
ext4_extent: logical=0, physical=100, length=256
```

The extent tree is stored in the inode (for small files) or in separate extent index blocks (for large files with many extents).

### Pre-allocation and Delayed Allocation

ext4 uses **delayed allocation** (delalloc) to improve write performance. Instead of allocating blocks immediately when data is written, ext4 delays allocation until the data is flushed to disk. This allows the filesystem to:

1. Allocate larger contiguous extents
2. Reduce fragmentation
3. Batch multiple writes together

The downside: if the system crashes before data is flushed, delayed allocation can cause data loss for files that were written but not yet allocated. This is the main criticism of ext4 and the reason some distributions use `data=ordered` mode.

```bash
# View extent information
debugfs -R "stat <inode_number>" /dev/sda1 | grep -A 100 "EXTENTS:"

# Defragment a file
e4defrag /path/to/file

# Check fragmentation
e4defrag -c /path/to/file
```

### ext4 Performance Tuning

```bash
# Mount options that affect performance
mount -o noatime,commit=60,data=ordered /dev/sda1 /data

# noatime: Don't update access time (reduces writes)
# commit: Journal commit interval in seconds (default 5)
# data=ordered: Journal mode

# Tune existing filesystem
tune2fs -m 1 /dev/sda1        # Reserve only 1% for root (default 5%)
tune2fs -O ^has_journal /dev/sda1  # Disable journaling (dangerous)
```

## XFS: When to Use It

XFS is a high-performance journaling filesystem originally developed by SGI for IRIX. It excels at:

- **Large files**: XFS handles multi-terabyte files efficiently
- **Parallel I/O**: XFS uses allocation groups that allow concurrent writes without contention
- **Metadata-heavy workloads**: XFS scales better than ext4 with millions of files

### XFS vs ext4

| Characteristic | ext4 | XFS |
|----------------|------|-----|
| Maximum file size | 16 TB | 8 EB (exbibytes) |
| Maximum filesystem | 1 EB | 8 EB |
| Journaling | Metadata only (or full) | Metadata + data (always) |
| Resize | Grow and shrink | Grow only |
| Fragmentation | More prone | Less prone |
| Small file performance | Better | Slightly worse |
| Repair tools | e2fsck, tune2fs | xfs_repair, xfs_admin |
| Default on | Debian, Ubuntu | RHEL, CentOS, Fedora |

### XFS Performance Characteristics

XFS divides the filesystem into **allocation groups** (AGs). Each AG has its own inode allocation, free space tracking, and B+ tree. This means multiple threads can write to different parts of the filesystem without locking contention:

```bash
# Create XFS filesystem
mkfs.xfs /dev/sdb1

# Mount with performance options
mount -o noatime,logbufs=8,logbsize=256k /dev/sdb1 /data

# XFS-specific tools
xfs_info /data               # Filesystem information
xfs_db -c freesp /dev/sdb1   # Free space report
xfs_repair /dev/sdb1          # Filesystem check/repair
xfs_fsr /dev/sdb1             # Online defragmentation
```

### XFS Quotas

XFS has built-in quota support that is more robust than ext4's:

```bash
# Mount with quotas
mount -o uquota,gquota /dev/sdb1 /data

# Set quotas
xfs_quota -x -c "limit bsoft=5g bhard=6g user1" /data
xfs_quota -x -c "report -h" /data
```

## Special Filesystems

### tmpfs

tmpfs is a filesystem backed by RAM. It is used for `/tmp`, `/run`, and `/dev/shm`. Data in tmpfs is lost on reboot:

```bash
# Create a tmpfs mount
mount -t tmpfs -o size=2G tmpfs /tmp

# Check tmpfs usage
df -h /tmp
# Filesystem      Size  Used Avail Use% Mounted on
# tmpfs           2.0G   50M  1.9G   3% /tmp
```

tmpfs uses the page cache for storage and the swap subsystem for overflow. If tmpfs is full and swap is available, pages are swapped out. If no swap, writes fail with ENOSPC.

### procfs

procfs (`/proc`) provides a filesystem interface to kernel data structures. It is not a real filesystem — it exists entirely in memory:

```bash
# Process information
cat /proc/1234/cmdline

# Kernel configuration
cat /proc/config.gz | gunzip | less

# Memory information
cat /proc/meminfo

# Kernel parameters
sysctl -a  # reads from /proc/sys/
```

### sysfs

sysfs (`/sys`) provides a structured view of the device model. It exposes information about devices, drivers, and buses:

```bash
# View block devices
ls /sys/block/

# View device attributes
cat /sys/block/sda/size          # Size in 512-byte sectors
cat /sys/block/sda/queue/scheduler  # I/O scheduler

# Change I/O scheduler
echo mq-deadline > /sys/block/sda/queue/scheduler

# View USB devices
lsusb | while read line; do
    echo "$line"
done

# Device tree
ls /sys/devices/pci*/ | head
```

### devtmpfs

devtmpfs is mounted at `/dev` and provides device nodes automatically. When the kernel detects a device, it creates a device node in devtmpfs. udev then applies permissions and symlinks:

```bash
# Check devtmpfs
mount | grep devtmpfs
# devtmpfs on /dev type devtmpfs (rw,nosuid,size=8080304k,nr_inodes=2020076,mode=755,inode64)

# Manual device node creation (for debugging)
mknod /dev/mydevice c 200 0   # Char device, major 200, minor 0
```

## Inotify: Filesystem Event Monitoring

Inotify is the Linux kernel's mechanism for monitoring filesystem events. It is the foundation of tools like `inotifywait`, file synchronization tools, and log watchers.

### How inotify Works

Applications create an inotify instance via `inotify_init()` and watch specific files or directories with `inotify_add_watch()`. When an event occurs on a watched path, the kernel delivers it to the inotify file descriptor:

```c
int fd = inotify_init();
int wd = inotify_add_watch(fd, "/var/log/", IN_MODIFY | IN_CREATE | IN_DELETE);

char buf[4096];
while (1) {
    int len = read(fd, buf, sizeof(buf));
    struct inotify_event *event = (struct inotify_event *)buf;
    if (event->mask & IN_MODIFY) {
        printf("File modified: %s\n", event->name);
    }
}
```

### Common Events

| Event | Trigger |
|-------|---------|
| IN_ACCESS | File was read |
| IN_MODIFY | File was written |
| IN_ATTRIB | Metadata changed (permissions, timestamps) |
| IN_CLOSE_WRITE | File opened for writing was closed |
| IN_CLOSE_NOWRITE | File opened for reading was closed |
| IN_OPEN | File was opened |
| IN_MOVED_FROM | File was moved out of watched directory |
| IN_MOVED_TO | File was moved into watched directory |
| IN_CREATE | File was created in watched directory |
| IN_DELETE | File was deleted from watched directory |
| IN_DELETE_SELF | Watched file/directory was deleted |
| IN_MOVE_SELF | Watched file/directory was moved |

### Practical inotify Usage

```bash
# Watch for file changes (using inotifywait from inotify-tools)
inotifywait -m -r /etc/nginx/ -e modify,create,delete
# -m: monitor continuously
# -r: watch recursively

# Watch for new log entries
inotifywait -m -e modify /var/log/syslog --format '%T %w%f %e' --timefmt '%H:%M:%S'

# Watch for configuration file changes and reload service
while inotifywait -e modify /etc/nginx/nginx.conf; do
    nginx -t && systemctl reload nginx
done
```

### inotify Limitations

inotify has practical limits:

- **Instance limit**: Each inotify instance consumes kernel memory. The default maximum watches per user is 8192:

```bash
cat /proc/sys/fs/inotify/max_user_watches
# 8192

# Increase if monitoring many directories
echo 65536 > /proc/sys/fs/inotify/max_user_watches
```

- **No network filesystem support**: inotify only works on local filesystems. NFS, CIFS, and other network filesystems do not generate inotify events.

- **Race conditions**: Events can be missed between `inotify_add_watch()` and the actual monitoring. Use `fanotify` for more reliable monitoring.

- **No content inspection**: inotify tells you a file changed, but not what changed. For content-level monitoring, use `auditd` or application-level mechanisms.

## Filesystem Performance Tuning

Choosing the right filesystem is only half the battle. Mount options and tuning parameters can dramatically affect performance for specific workloads. Understanding the relationship between workload characteristics and filesystem configuration is essential for production performance.

### Mount Options That Matter

```bash
# noatime: Skip access time updates (reduces write amplification)
mount -o noatime /dev/sda1 /data

# commit: Journal commit interval (default 5 seconds)
# Increase for better throughput, decrease for better crash safety
mount -o commit=60 /dev/sda1 /data

# barrier: Enable/disable write barriers (cache flushing)
# NEVER disable on production systems with write-back caches
mount -o barrier=1 /dev/sda1 /data

# data: Journaling mode for data writes
mount -o data=writeback /dev/sda1 /data  # Fast but less safe
mount -o data=ordered /dev/sda1 /data    # Default, balanced
mount -o data=full /dev/sda1 /data       # Safest but slowest

# discard: TRIM support for SSDs
mount -o discard /dev/sda1 /data         # Real-time TRIM
# Better: run fstrim periodically instead
fstrim -v /data

# relatime: Update access time only if older than mtime/ctime
# Better than noatime for applications that need access time
mount -o relatime /dev/sda1 /data
```

### Filesystem-Specific Tuning

**ext4 tuning:**

```bash
# Increase reserved space for root (useful for large data partitions)
tune2fs -m 1 /dev/sda1    # Reserve 1% (default 5%)

# Disable journaling (for read-heavy workloads where crash recovery is acceptable)
tune2fs -O ^has_journal /dev/sda1

# Enable inline data (small files stored in inode)
tune2fs -O inline_data /dev/sda1

# Check and optimize
e4defrag /dev/sda1        # Online defragmentation
e2fsck -f /dev/sda1       # Force filesystem check
```

**XFS tuning:**

```bash
# Increase log buffer size for write-heavy workloads
mount -o logbufs=8,logbsize=256k /dev/sda1 /data

# Set allocation group size (default 1GB)
mkfs.xfs -f -d agsize=256m /dev/sda1

# Online repair
xfs_repair -L /dev/sda1   # Force log zeroing (use with caution)
xfs_fsr /dev/sda1          # Online defragmentation
```

### I/O Scheduler Selection

The I/O scheduler affects how block I/O requests are ordered:

```bash
# View available schedulers
cat /sys/block/sda/queue/scheduler
# [mq-deadline] kyber bfq none

# For SSDs (no seek latency): use none or mq-deadline
echo none > /sys/block/sda/queue/scheduler

# For spinning disks: use mq-deadline or bfq
echo mq-deadline > /sys/block/sda/queue/scheduler

# For desktop/interactive: use bfq (fair I/O scheduling)
echo bfq > /sys/block/sda/queue/scheduler

# Make persistent via udev rule
echo 'ACTION=="add|change", KERNEL=="sd[a-z]", ATTR{queue/rotational}=="0", ATTR{queue/scheduler}="none"' > /etc/udev/rules.d/60-ioscheduler.rules
echo 'ACTION=="add|change", KERNEL=="sd[a-z]", ATTR{queue/rotational}=="1", ATTR{queue/scheduler}="mq-deadline"' >> /etc/udev/rules.d/60-ioscheduler.rules
```

### Read-Ahead Tuning

Read-ahead determines how many blocks the kernel reads ahead of the current read position:

```bash
# View current read-ahead (in 512-byte sectors)
blockdev --getra /dev/sda
# 256  (128 KB)

# Increase for sequential workloads (video streaming, backups)
blockdev --setra 4096 /dev/sda  # 2 MB

# Decrease for random I/O workloads (databases)
blockdev --setra 16 /dev/sda   # 8 KB

# Test the effect
dd if=/dev/sda of=/dev/null bs=1M count=1024 iflag=direct
# Compare throughput before and after read-ahead change
```

### Monitoring Filesystem Performance

```bash
# Real-time I/O monitoring
iostat -xz 1 10
# Device   r/s    w/s   rkB/s   wkB/s  await  r_await  w_await  svctm  %util
# sda     123.45  456.78  4938.0 18271.2  2.34    1.23     2.67    0.45  25.3

# Per-process I/O
iotop -oP
# Total DISK READ:       12.34 M/s | Total DISK WRITE:       45.67 M/s
#   PID  PRIO  USER     DISK READ  DISK WRITE  SWAPIN     IO>    COMMAND
#  1234 be/4  postgres   12.34 M/s   45.67 M/s  0.00 %  25.30 %  postgres: writer

# Filesystem usage and inodes
df -hT
df -i    # Check inode usage (running out of inodes = cannot create files)

# Filesystem activity
fatrace    # Real-time file access tracing (uses fanotify)
# myapp    O  /var/log/syslog
# myapp    C  /tmp/tmpfile1234
# myapp    R  /etc/config.json

# Filesystem latency tracing with bcc
ext4slower-bpfcc 10    # Show ext4 operations slower than 10ms
xfsslower-bpfcc 10     # Show XFS operations slower than 10ms

# File system fragmentation analysis
e4defrag -c /           # Check fragmentation level of ext4 filesystem
xfs_db -c "freesp -s" /dev/sda1  # Free space fragmentation of XFS
```

### Filesystem Backup Strategies

Understanding filesystem internals helps design better backup strategies:

```bash
# File-level backup (tar, rsync)
tar czf /backup/data.tar.gz /data/
rsync -avz /data/ /backup/data/

# Block-level backup (dd, LVM snapshots)
dd if=/dev/sda1 of=/backup/sda1.img bs=4M
# Or with LVM snapshots for consistent backup:
lvcreate -s -n snap_data -L 10G /dev/vg0/data
mount -o ro /dev/vg0/snap_data /mnt/snap
tar czf /backup/data.tar.gz -C /mnt/snap .
umount /mnt/snap
lvremove -f /dev/vg0/snap_data

# Filesystem-aware backup
xfsdump -l 0 -f /backup/sda1.xfsdump /dev/sda1
xfsrestore /backup/sda1.xfsdump /restore

# For ext4:
e2fsck -f /dev/sda1
dump -0u -f /backup/sda1.dump /dev/sda1
restore -f /backup/sda1.dump -C /restore
```

### NFS and Network Filesystems

Network filesystems have unique characteristics and failure modes:

```bash
# NFS mount options
mount -t nfs -o hard,timeo=600,retrans=2 server:/exports/data /mnt/data
# hard: retry indefinitely (default, recommended for databases)
# timeo=600: timeout after 60 seconds (in tenths of a second)
# retrans=2: retry twice before declaring server unreachable

# NFS soft mount (dangerous but prevents hangs)
mount -t nfs -o soft,timeo=10,retrans=3 server:/exports/data /mnt/data
# Risk: returns EIO on timeout, can corrupt data

# NFS performance monitoring
nfsstat -c          # Client statistics
nfsiostat 1         # NFS I/O statistics per second
cat /proc/net/rpc/nfsd  # Server-side statistics

# CIFS/SMB mount
mount -t cifs -o username=user,password=pass //server/share /mnt/data
# Or with credentials file:
mount -t cifs -o credentials=/etc/samba/creds //server/share /mnt/data
```

## Real Scenario: Recovering Data from a Corrupted Filesystem

### The Problem

A development server experienced a power failure during a heavy write operation. On restart, the root filesystem (ext4) failed to mount, dropping to an emergency shell. The error:

```
EXT4-fs error (device sda2): ext4_lookup:1590: inode #262147: comm bash: deleted inode referenced
```

The server contained important application data that was not backed up.

### Investigation

```bash
# Boot from rescue media, do NOT mount the filesystem
# Check filesystem integrity first
e2fsck -n /dev/sda2
# -n: no-modify mode, just report errors

# Output showed:
# Inode 262147: deleted inode referenced
# Inode 131073: extra isize space overflow
# Block 524288: multiply claimed
# Free blocks count wrong
```

### Recovery Steps

**Step 1: Create a backup image before attempting repair**

```bash
dd if=/dev/sda2 of=/external/sda2.img bs=4M status=progress
# CRITICAL: Never run e2fsck on the original without a backup
```

**Step 2: Attempt repair on the backup image**

```bash
e2fsck -y /external/sda2.img
# -y: automatically answer yes to repair questions

# Output:
# EXT4-fs: deleted inode referenced - CLEARED
# EXT4-fs: extra isize overflow - FIXED
# Free blocks count wrong - FIXED
# *** Filesystem was modified ***
```

**Step 3: Mount the repaired image and verify data**

```bash
mount -o loop /external/sda2.img /mnt/recovery
ls -la /mnt/recovery/
# Check critical files exist and are readable

# Copy data to external storage
rsync -av /mnt/recovery/ /external/recovered_data/
```

**Step 4: If e2fsck cannot fix it, use debugfs**

```bash
debugfs /external/sda2.img

# List lost+found directory
lsdel

# Recover specific files
dump <inode_number> /external/recovered_file.txt

# Search for files by name
find_free_ids
ls -d /lost+found/*
```

**Step 5: If the filesystem is too damaged, use photorec/testdisk**

```bash
# photorec recovers files by scanning for file signatures
photorec /dev/sda2

# testdisk can repair partition tables and recover deleted files
testdisk /dev/sda
```

### Prevention

```bash
# Enable periodic filesystem checks
# On ext4, fsck runs automatically based on mount count or time
tune2fs -c 30 /dev/sda2        # Check every 30 mounts
tune2fs -i 180d /dev/sda2      # Check every 180 days

# Monitor filesystem health
dumpe2fs /dev/sda2 | grep -E "Last checked|Mount count|Maximum mount"

# Use UPS to prevent power failures
# Use barrier=1 mount option (default) for data safety
# Use write-back cache mode with caution — risk of data loss
```

## Assessment

### Lab Task 1: VFS Layer Investigation (25 minutes)

1. Create a file and identify its inode number, size, and block allocation using `stat` and `debugfs`
2. Find the same inode using `debugfs` and verify the inode information matches
3. Delete the file and verify the inode is freed
4. Use `debugfs` to find the freed inode in the free inode list
5. Explain the relationship between filenames and inodes using your observations

**Grading**: Correct inode identification (25%), debugfs usage (25%), deletion verification (25%), explanation (25%)

### Lab Task 2: Filesystem Comparison (30 minutes)

1. Create two loopback filesystems: one ext4, one XFS
2. Create 10,000 small files (1KB each) on each
3. Measure creation time with `time`
4. Measure read time for all files with `find . -exec cat {} \;`
5. Compare results and explain the performance difference

**Grading**: Correct filesystem creation (20%), file creation test (25%), read test (25%), analysis (30%)

### Lab Task 3: Inotify Monitoring (20 minutes)

1. Write a script that uses `inotifywait` to monitor `/tmp/` for new file creation
2. Create 5 files in `/tmp/` while monitoring
3. Verify all 5 creation events were captured
4. Add file modification monitoring and verify events are captured
5. Document the script and its output

**Grading**: Correct inotifywait usage (30%), event capture (30%), modification monitoring (20%), documentation (20%)

### Lab Task 4: Filesystem Recovery (35 minutes)

1. Create a small ext4 filesystem on a loopback device
2. Create several files with known content
3. Simulate corruption using `debugfs` (zero out some blocks)
4. Run `e2fsck` and observe the repair process
5. Mount the repaired filesystem and verify which files were recovered
6. Document the recovery procedure

**Grading**: Correct corruption simulation (25%), e2fsck execution (25%), data verification (25%), documentation (25%)

## Evidence

### Filesystem Understanding

Evidence of mastery includes:

- Reading `dumpe2fs` output to understand ext4 filesystem layout, journal mode, and allocation strategy
- Using `debugfs` to inspect and recover individual inodes and data blocks
- Comparing ext4 and XFS performance characteristics and choosing the appropriate one for specific workloads
- Configuring mount options for performance (noatime, commit interval, journal mode) and safety (barrier, data=ordered)
- Using inotify tools for filesystem event monitoring in automation and security
- Recovering data from corrupted filesystems using e2fsck, debugfs, and photorec
- Understanding the VFS abstraction and how different filesystem types present a unified interface

### Key Diagnostic Commands

| Command | Purpose |
|---------|---------|
| `df -hT` | Filesystem type, size, usage |
| `mount` | View mounted filesystems and options |
| `tune2fs -l /dev/sdXN` | ext4 superblock information |
| `xfs_info /mountpoint` | XFS filesystem information |
| `dumpe2fs /dev/sdXN` | Detailed ext4 filesystem dump |
| `debugfs /dev/sdXN` | Interactive ext4 filesystem debugger |
| `e2fsck -n /dev/sdXN` | Read-only ext4 filesystem check |
| `xfs_repair /dev/sdXN` | XFS filesystem check/repair |
| `iotop` | Per-process I/O monitoring |
| `iostat -xz 1` | Per-device I/O statistics |
| `fatrace` | File access tracing (uses fanotify) |
| `inotifywait` | Filesystem event monitoring |