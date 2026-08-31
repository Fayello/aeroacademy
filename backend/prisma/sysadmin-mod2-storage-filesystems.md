# Module 2 — Storage and Filesystems

Disk space does not grow on trees. When your PostgreSQL database is 400 GB and the partition is 500 GB, you have maybe two months before things break. When a production server runs out of /var/log space, your SSH sessions start failing and log-based debugging becomes impossible. Storage management is one of those skills that separates reactive firefighters from proactive sysadmins. This module covers the full storage stack: block devices, partitioning, filesystems, LVM, RAID, network-mounted storage, disk I/O performance tuning, swap management, and the critical skill of expanding storage on a live server without downtime. You will learn every tool and technique needed to manage storage from a single disk to a multi-terabyte production system.

## Identifying Block Devices

Before you partition or format anything, you need to know what disks are present and how they are currently used. The `lsblk` command shows a tree view of all block devices, their sizes, mount points, and filesystem types. The output includes the major and minor device numbers, whether the device is removable, read-only status, and the full device path. Pay attention to the RO column which indicates if a device is read-only, which could mean a hardware write-protect or a deliberate configuration.

For more detail including filesystem UUIDs, use `blkid`. The UUID is what you should use in `/etc/fstab` because device names like `/dev/sda` can change between reboots if you add or remove disks. UUIDs are persistent regardless of detection order.

To check disk health and SMART data, use `smartctl -a` on the device. The `-H` flag gives a quick health summary. Install `smartmontools` if not present. SMART data shows you reallocated sector count (increasing means physical failure), spin-up time, temperature, and power-on hours. Set up `smartd` to monitor and email alerts before the disk fails completely.

For NVMe disks, use `nvme smart-log /dev/nvme0` for health data including available spare, percentage used, and data units read/written. NVMe self-test with `nvme self-test` runs read and write verification.

Check overall disk usage with `df -h` and inode usage with `df -i`. A filesystem can run out of inodes before running out of space on systems with millions of small files.

## Partitioning

### MBR with fdisk

For disks under 2 TB, MBR with `fdisk` works well. Run `fdisk` on the device and use interactive commands: `n` for new partition, `d` for delete, `p` for print, `t` for type (82 for swap, 8e for LVM), `w` to write, `q` to discard. After partitioning, run `partprobe` to tell the kernel to re-read the table without rebooting.

MBR limitations: maximum four primary partitions, disks up to 2 TB. Extended and logical partitions work around the four-partition limit but add complexity. For modern servers, GPT is usually the better choice.

### GPT with parted

For disks over 2 TB or needing more than four partitions, use GPT with `parted`. Non-interactive mode uses `-s` to suppress prompts. Create the label with `mklabel gpt`, partitions with `mkpart`, and set LVM flags with `set`. GPT stores backup headers, provides CRC32 checksums, and supports 128 partitions by default.

## Creating Filesystems

### ext4

The battle-tested workhorse. Create with `mkfs.ext4 -L label`. Key mount options: `noatime` for read performance, `discard` for SSD TRIM. Tune with `tune2fs`: reduce reserved blocks with `-m 1` (reclaims 5% of disk), change journal mode with `-o`. The reserved block count matters — 5% on a 1 TB disk is 50 GB reserved. Reduce to 1% for data volumes. Never use 0%.

Check and repair with `e2fsck` (must be unmounted). Use `-y` for automatic fixes, `-f` for forced full check.

### XFS

Default on RHEL/CentOS 7+. Excellent for large files and parallel I/O. Cannot be shrunk — plan sizes carefully. Create with `mkfs.xfs -L label`. Grow online with `xfs_growfs`. Repair with `xfs_repair` (unmounted). The `-L` flag clears the log (last resort for corruption).

XFS allocates separate allocation groups for parallel writes, making it ideal for databases with multiple tablespaces and high-concurrency workloads.

### Btrfs

Copy-on-write with built-in subvolumes, snapshots, compression, and RAID. Create with `mkfs.btrfs`. Mount subvolumes with `-o subvol=@name`. Snapshot with `btrfs subvolume snapshot`. Enable compression with `compress=zstd`. Add/remove devices with `btrfs device`. Redistribute with `btrfs balance`.

## LVM: Logical Volume Manager

LVM abstracts physical disks into flexible logical volumes. In production, almost every server should use LVM.

### Physical Volumes

Initialize with `pvcreate`. Inspect with `pvs` (summary) or `pvdisplay` (detailed). Remove with `pvremove`.

### Volume Groups

Group PVs with `vgcreate`. Check with `vgs`. Add disks with `vgextend`. Remove with `vgreduce`. The VG is your storage pool from which LVs are carved.

### Logical Volumes

Create with `lvcreate -L size -n name vgname` or `-l percentage` for percentage of VG. The LV is what you format and mount.

### Growing Online

The killer feature: grow LVs and filesystems without unmounting. `lvextend -r -L +50G /dev/vg/lv` grows both at once. For XFS: `xfs_growfs /mount`. For ext4: `resize2fs /dev/vg/lv`. Zero downtime.

### Snapshots

Copy-on-write point-in-time copies. Use for backups (freeze snapshot, back up, release) and testing (snapshot production, test on copy). Size depends on change rate — monitor with `lvs`. If snapshot fills, it invalidates. Remove with `lvremove` after unmounting.

### Thin Provisioning

Allocate less than requested. Over-commits storage. Works when actual usage is lower than allocated. Create thin pool, then thin volumes within it. Monitor carefully — pool exhaustion makes all thin volumes read-only.

## RAID

### RAID Levels

**RAID 1** mirrors data. 50% capacity. Survives all but one disk failure. Good read performance.

**RAID 5** stripes with distributed parity. Minimum 3 disks. (N-1) capacity. Survives one failure. Moderate write performance from parity calculation.

**RAID 6** double parity. Minimum 4 disks. (N-2) capacity. Survives two failures. Better safety than RAID 5.

**RAID 10** mirror + stripe. Minimum 4 disks. 50% capacity. Best performance and reliability. Survives one failure per mirror pair.

### Software RAID with mdadm

Create with `mdadm --create`. Monitor with `cat /proc/mdstat` and `mdadm --detail`. Save config with `mdadm --detail --scan >> /etc/mdadm.conf`.

Replace failed disks: mark faulty with `mdadm --manage --fail`, remove with `--remove`, add new with `--add`. Rebuild starts automatically. Monitor with `mdadm --detail` watching resync progress.

## Expanding Storage on a Live Server

Real scenario: 500 GB volume at 92% full, need to add 500 GB from new disk without downtime.

Procedure: verify state (`lsblk`, `pvs`, `vgs`, `lvs`, `df`) → partition new disk (`parted`) → initialize PV (`pvcreate`) → extend VG (`vgextend`) → extend LV (`lvextend`) → grow filesystem (`xfs_growfs` or `resize2fs`) → verify (`df`). Under 5 minutes, zero downtime.

## Network-Mounted Storage

### NFS

Define exports in `/etc/exports` with directory, client network, and options. Apply with `exportfs -ra`. Mount with `mount -t nfs` or fstab. Options: `hard` (retry indefinitely), `soft` (timeout), `timeo` (timeout value), `rsize`/`wsize` (block sizes).

### CIFS/SMB

Mount Windows shares with `mount -t cifs`. Use credentials file for persistence. Install `cifs-utils`. Fstab entry with credentials path, uid/gid mapping, and iocharset.

## Filesystem Maintenance

Never `fsck` mounted filesystems (except Btrfs). Schedule regular checks. Monitor with `df -h` and `df -i`. Find large files with `du -sh * | sort -rh | head`. Set disk space alerts.

For SSDs: ensure TRIM runs with `fstrim -av` or enable `fstrim.timer`. Choose periodic vs continuous based on workload.

## Disk I/O Performance

Monitor with `iostat -x 1`. Key metrics: `%util` (above 80% = bottleneck), `await` (above 10ms SSD / 20ms HDD = slow), `r/s` and `w/s` (IOPS). Benchmark with `fio` for realistic workload testing. Check scheduler with `cat /sys/block/sda/queue/scheduler` — use `none` or `mq-deadline` for SSDs, `bfq` for HDDs.

## Swap Management

Create with `mkswap` and `swapon`. For files: `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`. Add to fstab. Control with `vm.swappiness` — lower for databases (1-10), higher for desktops (30-60). Monitor with `free -h` and `vmstat 1`.

## Practical Assessment

**Lab Task:** Storage expansion exercise (60 minutes)

1. Create two 10 GB virtual disks in a test VM
2. Partition both as GPT using `parted`
3. Create an LVM volume group using both disks
4. Create a logical volume using 60% of the first disk
5. Format with XFS, mount at `/data`
6. Create a 2 GB file with `dd`
7. Extend the LV using remaining space on disk 1
8. Grow the XFS filesystem online
9. Add the second disk to the volume group
10. Create a second LV using 50% of the second disk
11. Create an LVM snapshot of the first LV
12. Verify snapshot contains the test file
13. Remove the snapshot
14. Set up an NFS export and mount it on localhost
15. Create a 2 GB swap file on the second LV
16. Activate and verify with `swapon --show`

**Grading criteria:** GPT partitioning with LVM flag (10), VG creation with both PVs (10), LV and XFS filesystem (10), online growth after extension (20), second disk added to VG (10), LVM snapshot verified (15), NFS export/mount working (10), swap file created (10), fstab entries correct (5).

## Understanding Filesystem Journaling

Every modern filesystem uses journaling to maintain consistency after crashes. The journal is a circular log of pending changes. Before modifying the actual data, the filesystem writes the intended changes to the journal. After the changes are committed to the main filesystem, the journal entry is marked complete. If the system crashes mid-operation, the filesystem replays the journal on the next mount to complete or roll back incomplete transactions.

**ext4** supports three journal modes: `journal` (data and metadata, slowest but safest), `ordered` (metadata only, data written first, default), and `writeback` (metadata only, no ordering guarantees, fastest). For databases, `ordered` is the default and best choice. `writeback` can cause stale data after crash but offers better performance for workloads that handle their own consistency.

**XFS** uses a log technique similar to journaling but writes to a separate log area. The log is flushed periodically and during clean unmounts. XFS guarantees metadata consistency but not necessarily data consistency for unlinked files. This is acceptable for most workloads because databases implement their own ACID guarantees.

**Btrfs** uses copy-on-write instead of journaling. Every modification creates a new copy of the data rather than overwriting in place. This provides inherent consistency because the old data remains intact until the new data is fully written. The trade-off is slightly higher write amplification.

## Filesystem Recovery Scenarios

### Recovering a Corrupted ext4 Filesystem

Boot from a live USB or rescue media. Unmount the partition. Run `e2fsck -f -y /dev/sdXN`. The `-f` forces a full check even if the filesystem appears clean. The `-y` answers yes to all repair prompts. If the journal is corrupted, `e2fsck` may need to clear it with `-E journal_data_delalloc`. After repair, mount and verify data integrity.

### Recovering a Corrupted XFS Filesystem

Boot from rescue media. Unmount the partition. Run `xfs_repair /dev/sdXN`. If the log is corrupted and cannot be replayed, use `xfs_repair -L` to clear the log. This is destructive for any uncommitted transactions but is often the only option for severely corrupted filesystems. After repair, mount and restore from backups if data is missing.

### Recovering Deleted Files

For ext4, use `extundelete` which reads the journal to recover recently deleted files. For XFS, use `xfsundelete` or commercial tools like `R-Studio`. For any filesystem, the sooner you act the better — deleted data is overwritten over time. Unmount the partition immediately to prevent further overwrites.

## LVM Snapshots in Depth

LVM snapshots use copy-on-write to create point-in-time copies. When a snapshot is created, it shares data blocks with the original volume. When a block on the original is about to be modified, the old block is copied to the snapshot area first, then the original is updated. The snapshot reads either the original blocks (unchanged) or the copied blocks (changed).

### Snapshot Sizing

Size the snapshot based on the expected change rate during the snapshot lifetime. For a backup that runs for 1 hour, estimate how much data changes in 1 hour. A common rule of thumb is 10-20% of the source volume. Monitor snapshot usage with `lvs` — if the allocated column approaches the snapshot size, expand or remove it before it invalidates.

### Snapshot for Backup Workflow

1. Create snapshot: `lvcreate -L 20G -s -n db-snap /dev/data-vg/db-lv`
2. Mount snapshot read-only: `mount -o ro /dev/data-vg/db-snap /mnt/snap`
3. Back up from snapshot: `tar czf /backup/db-$(date +%Y%m%d).tar.gz -C /mnt/snap .`
4. Unmount snapshot: `umount /mnt/snap`
5. Remove snapshot: `lvremove /dev/data-vg/db-snap`

This provides a consistent backup because the snapshot freezes the filesystem state at creation time while the production volume continues operating normally.

## NFS Performance Tuning

NFS performance depends on several factors. The `rsize` and `wsize` parameters control read and write block sizes — larger values improve throughput for large files but increase memory usage. Default is usually 1 MB. The `hard` option retries indefinitely which is essential for databases but causes hangs if the NFS server is down. `soft` returns errors after timeout which is acceptable for non-critical shares.

### NFS Mount Options for Different Workloads

For databases: `hard,intr,rsize=1048576,wsize=1048576,noatime`. The `intr` option allows interrupting hung NFS operations. For media files: `soft,timeo=600,rsize=65536,wsize=65536`. For general file sharing: `hard,rsize=1048576,wsize=1048576`.

### NFS Troubleshooting

When NFS hangs, check `nfsstat` for error counts, `rpcinfo` to verify the NFS server is running, and `mount` to verify mount options. Use `nfsiostat` to monitor NFS performance. Check `/var/log/messages` for NFS errors on the server.

## Practical Assessment

**Lab Task:** Storage expansion exercise (60 minutes)

1. Create two 10 GB virtual disks in a test VM
2. Partition both as GPT using `parted`
3. Create an LVM volume group using both disks
4. Create a logical volume using 60% of the first disk
5. Format with XFS, mount at `/data`
6. Create a 2 GB file with `dd`
7. Extend the LV using remaining space on disk 1
8. Grow the XFS filesystem online
9. Add the second disk to the volume group
10. Create a second LV using 50% of the second disk
11. Create an LVM snapshot of the first LV
12. Verify snapshot contains the test file
13. Remove the snapshot
14. Set up an NFS export and mount it on localhost
15. Create a 2 GB swap file on the second LV
16. Activate and verify with `swapon --show`

**Grading criteria:** GPT partitioning with LVM flag (10), VG creation with both PVs (10), LV and XFS filesystem (10), online growth after extension (20), second disk added to VG (10), LVM snapshot verified (15), NFS export/mount working (10), swap file created (10), fstab entries correct (5).

## Storage Monitoring and Alerting

### Disk Space Monitoring

Set up automated alerts before disks fill up. Create a script that checks disk usage with `df -h` and sends alerts when usage exceeds thresholds (85% warning, 95% critical). Use cron or systemd timers to run the check every 15 minutes. Integrate with your monitoring system (Prometheus node_exporter, Nagios, Zabbix).

### inode Monitoring

Filesystems can run out of inodes before running out of space. Monitor with `df -i`. Common causes: millions of small files (email servers, cache directories, container images). Fix by cleaning up old files, adjusting inode ratio with `tune2fs -i`, or reformatting with more inodes.

### I/O Performance Monitoring

Use `iostat -x 1` to monitor disk I/O in real-time. Key metrics: `%util` (disk busy percentage), `await` (average I/O latency), `r/s` and `w/s` (IOPS). Set alerts for sustained high utilization or latency. Use `iotop` to identify which processes are generating the most I/O.

### SMART Monitoring

Configure `smartd` for continuous disk health monitoring. Set it to check SMART attributes daily and email alerts for预警告 signs of failure. Key attributes to monitor: reallocated sector count, current pending sector count, and temperature. Replace disks that show increasing reallocated sectors.

## Practical Assessment

**Lab Task:** Storage expansion exercise (60 minutes)

1. Create two 10 GB virtual disks in a test VM
2. Partition both as GPT using `parted`
3. Create an LVM volume group using both disks
4. Create a logical volume using 60% of the first disk
5. Format with XFS, mount at `/data`
6. Create a 2 GB file with `dd`
7. Extend the LV using remaining space on disk 1
8. Grow the XFS filesystem online
9. Add the second disk to the volume group
10. Create a second LV using 50% of the second disk
11. Create an LVM snapshot of the first LV
12. Verify snapshot contains the test file
13. Remove the snapshot
14. Set up an NFS export and mount it on localhost
15. Create a 2 GB swap file on the second LV
16. Activate and verify with `swapon --show`

**Grading criteria:** GPT partitioning with LVM flag (10), VG creation with both PVs (10), LV and XFS filesystem (10), online growth after extension (20), second disk added to VG (10), LVM snapshot verified (15), NFS export/mount working (10), swap file created (10), fstab entries correct (5).

## Practical Assessment

**Lab Task:** Storage expansion exercise (60 minutes)

1. Create two 10 GB virtual disks in a test VM
2. Partition both as GPT using `parted`
3. Create an LVM volume group using both disks
4. Create a logical volume using 60% of the first disk
5. Format with XFS, mount at `/data`
6. Create a 2 GB file with `dd`
7. Extend the LV using remaining space on disk 1
8. Grow the XFS filesystem online
9. Add the second disk to the volume group
10. Create a second LV using 50% of the second disk
11. Create an LVM snapshot of the first LV
12. Verify snapshot contains the test file
13. Remove the snapshot
14. Set up an NFS export and mount it on localhost
15. Create a 2 GB swap file on the second LV
16. Activate and verify with `swapon --show`

**Grading criteria:** GPT partitioning with LVM flag (10), VG creation with both PVs (10), LV and XFS filesystem (10), online growth after extension (20), second disk added to VG (10), LVM snapshot verified (15), NFS export/mount working (10), swap file created (10), fstab entries correct (5).

## Evidence

Output of `lsblk`, `vgs`, `lvs`, `df -h /data`, snapshot mount verification, NFS mount screenshot, `/etc/fstab` entries, `swapon --show`, and `blkid` output.
