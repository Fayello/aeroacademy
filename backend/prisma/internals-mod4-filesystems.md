# Module 4 — Filesystems



## What You'll Actually Do

You need to understand what happens when you `write()` to a file. How does ext4 organize data? What's an inode? How does journaling prevent corruption? You'll go below the `mount` command.


## VFS — Virtual Filesystem

Linux has a virtual filesystem layer. Every filesystem (ext4, xfs, nfs, proc) implements the same interface.

```bash
# See filesystem types
mount | head -10
# /dev/sda1 on / type ext4 (rw,relatime)
# proc on /proc type proc (rw,nosuid,nodev,noexec)
# sysfs on /sys type sysfs (rw,nosuid,nodev,noexec)
# tmpfs on /run type tmpfs (rw,nosuid,nodev)

# See filesystem stats
tune2fs -l /dev/sda1 | head -20
```


## Inodes — The Real File Metadata

An inode stores everything about a file except the name and content.

```bash
# See inode info
stat /etc/passwd
# File: /etc/passwd
# Size: 1234     Blocks: 8          IO Block: 4096   regular file
# Access: (0644/-rw-r--r--)  Uid: (    0/    root)   Gid: (    0/    root)
# Inode: 123456   Links: 1
# Access: 2025-01-15 10:30:00.000000000
# Modify: 2025-01-14 15:20:00.000000000
# Change: 2025-01-14 15:20:00.000000000

# Inodes contain:
# - Owner/group
# - Permissions
# - Timestamps (atime, mtime, ctime)
# - Size
# - Block pointers (where the data is)
# - No filename! Filenames are in directory entries.
```

**Hard links:** Multiple filenames pointing to the same inode.
```bash
ln /etc/passwd /tmp/passwd_copy
ls -li /etc/passwd /tmp/passwd_copy
# 123456 -rw-r--r-- 2 root root 1234 ...
# 123456 -rw-r--r-- 2 root root 1234 ...
# Same inode number, same file
```

**Soft links (symlinks):** Point to a filename, not inode.
```bash
ln -s /etc/passwd /tmp/passwd_link
ls -li /etc/passwd /tmp/passwd_link
# 123456 -rw-r--r-- 1 root root 1234 ... /etc/passwd
# 789012 lrwxrwxrwx 1 root root   11 ... /tmp/passwd_link -> /etc/passwd
# Different inode, different file (that points to another)
```


## ext4 — The Default

ext4 uses block groups. Each block group has:
- Superblock (filesystem metadata)
- Block group descriptor table
- Block bitmap (which blocks are free)
- Inode bitmap (which inodes are free)
- Inode table
- Data blocks

```bash
# Filesystem info
dumpe2fs /dev/sda1 | head -30
# Block count: 12345678
# Block size: 4096
# Inodes count: 1234567
# Free blocks: 5678901
# Free inodes: 1200000

# Check filesystem
e2fsck -f /dev/sda1
```


## Journaling

ext4 journals metadata changes before writing them. If the system crashes, the journal replays the changes.

```bash
# Journal mode
tune2fs -l /dev/sda1 | grep "Filesystem features"
# Filesystem features: has_journal

# Modes:
# journal — journal metadata + data (safest, slowest)
# ordered — journal metadata only, data written first (default)
# writeback — journal metadata only, data ordering not guaranteed
```


## File Operations — What Actually Happens

```c
fd = open("/tmp/test.txt", O_WRONLY | O_CREAT, 0644);
write(fd, "hello", 5);
close(fd);
```

Under the hood:
1. `open()` → VFS looks up path → finds inode → checks permissions → returns file descriptor
2. `write()` → VFS → ext4 → allocates data block → updates inode → writes to journal → writes to disk
3. `close()` → flushes buffers → updates inode timestamps → releases file descriptor


## Real Task: Recover from Crash

```bash
# Server crashed during write. Filesystem may be corrupt.
# 1. Boot from live USB
# 2. Check filesystem
e2fsck -f /dev/sda1

# If journal is corrupt:
e2fsck -E journal_only /dev/sda1

# 3. If superblock is corrupt:
mke2fs -n /dev/sda1    # find backup superblock location
e2fsck -b 32768 /dev/sda1   # use backup superblock

# 4. Mount read-only and check
mount -o ro /dev/sda1 /mnt
ls -la /mnt/
```


## Assessment

**Lab task (25 min):**

1. Interpret inode information with `stat`
2. Create hard links and soft links and explain the difference
3. Examine filesystem structure with `dumpe2fs`
4. Understand journaling modes
5. Simulate a filesystem check and repair

**Grading:**
- Inodes understood: 20%
- Links created and explained: 20%
- Filesystem examined: 20%
- Journaling understood: 20%
- Recovery tested: 20%


## Evidence

- **OutcomeEvidence:** `INT-LO4 — Filesystem Internals`
- **Mastery:** `UserSkill: linux-filesystem-internals`


## Unlock

Module5 — System Calls. You know how data is stored. Now you learn how processes talk to the kernel.


## Sources

- `man stat`, `man ln`, `man tune2fs`, `man e2fsck`
- ext4 documentation


