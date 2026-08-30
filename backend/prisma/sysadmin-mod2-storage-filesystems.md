# Module 2 — Storage and Filesystems


## What You'll Actually Do

Disk is full. You need to expand the partition, resize the filesystem, add a new disk, set up LVM, and configure NFS mounts. This is the part where "df -h" stops being optional.

## Disk Identification

```bash
lsblk
# NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
# sda      8:0    0   50G  0 disk
# ├─sda1   8:1    0   48G  0 part /
# └─sda2   8:2    0    2G  0 part [SWAP]
# sdb      8:16   0  100G  0 disk

fdisk -l /dev/sda
```

`sda` = first SCSI/SATA disk. `sdb` = second. `nvme0n1` = first NVMe.

## Partitions

**Create partition with fdisk:**
```bash
fdisk /dev/sdb
# n (new partition)
# p (primary)
# 1 (partition number)
# (default first sector)
# (default last sector = full disk)
# w (write)
```

**Create with parted (scriptable):**
```bash
parted /dev/sdb mklabel gpt
parted /dev/sdb mkpart primary ext4 0% 100%
```

## Filesystems

**Format:**
```bash
mkfs.ext4 /dev/sdb1
mkfs.xfs /dev/sdb1
```

**Mount:**
```bash
mount /dev/sdb1 /data
```

**Persistent mount (fstab):**
```bash
# Get UUID
blkid /dev/sdb1
# /dev/sdb1: UUID="abc123..." TYPE="ext4"

# Add to /etc/fstab
echo "UUID=abc123 /data ext4 defaults 0 2" >> /etc/fstab
mount -a
```

**ext4 vs xfs:**
- ext4: mature, flexible, supports shrinking
- xfs: better for large files, high performance, can't shrink

## LVM — Logical Volume Manager

LVM lets you resize, move, and span disks without downtime.

**Setup:**
```bash
# Create physical volumes
pvcreate /dev/sdb /dev/sdc

# Create volume group
vgcreate data_vg /dev/sdb /dev/sdc

# Create logical volume
lvcreate -L 50G -n data_lv data_vg

# Format and mount
mkfs.ext4 /dev/data_vg/data_lv
mount /dev/data_vg/data_lv /data
```

**Extend:**
```bash
# Add new disk to VG
pvcreate /dev/sdd
vgextend data_vg /dev/sdd

# Extend LV
lvextend -L +20G /dev/data_vg/data_lv

# Resize filesystem
resize2fs /dev/data_vg/data_lv   # ext4
xfs_growfs /data                  # xfs
```

**Snapshot:**
```bash
lvcreate -L 10G -s -n data_snap /dev/data_vg/data_lv
```

## RAID — Redundancy

```bash
# Create RAID1 (mirror)
mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sdb /dev/sdc

# Check status
cat /proc/mdstat
mdadm --detail /dev/md0

# Save config
mdadm --detail --scan >> /etc/mdadm/mdadm.conf
update-initramfs -u
```

**RAID levels:**
| Level | Min disks | Fault tolerance | Use case |
|-------|-----------|----------------|----------|
| RAID0 | 2 | 0 (none) | Speed only, no redundancy |
| RAID1 | 2 | 1 | Mirrors, small volumes |
| RAID5 | 3 | 1 | Good balance, write penalty |
| RAID6 | 4 | 2 | Large volumes, high tolerance |
| RAID10 | 4 | N/2 | Performance + redundancy |

## NFS — Network Filesystem

**Server:**
```bash
apt install nfs-kernel-server
mkdir -p /srv/nfs/share
echo "/srv/nfs/share 10.0.0.0/24(rw,sync,no_subtree_check,no_root_squash)" >> /etc/exports
exportfs -ra
systemctl restart nfs-kernel-server
```

**Client:**
```bash
apt install nfs-common
mount -t nfs 10.0.0.1:/srv/nfs/share /mnt/nfs

# Persistent:
echo "10.0.0.1:/srv/nfs/share /mnt/nfs nfs defaults,_netdev 0 0" >> /etc/fstab
```

## Disk Monitoring

```bash
df -h                    # filesystem usage
df -i                    # inode usage (full inodes = can't create files)
du -sh /var/log          # directory size
iotop                    # real-time disk I/O by process
```

**Alert on high usage:**
```bash
#!/bin/bash
USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $USAGE -gt 80 ]; then
    echo "Disk usage: ${USAGE}%" | mail -s "Disk Alert" admin@company.com
fi
```

## Real Task: Expand Disk Without Downtime

Server disk is full. Cloud provider gives you100GB more.

```bash
# 1. Check current layout
lsblk
# sda   50G
# └─sda1 48G /

# 2. Cloud provider expanded sda to 150G
# Re-read partition table:
partprobe /dev/sda

# 3. Extend the partition
growpart /dev/sda 1

# 4. Resize filesystem
resize2fs /dev/sda1   # ext4

# 5. Verify
df -h /
# /dev/sda1  148G  45G  96G  32% /
```

No downtime. No unmount. Just grow.

## Assessment

**Lab task (25 min):**

1. Create a partition on a new disk, format it, and mount it
2. Set up LVM with a volume group and logical volume
3. Extend the logical volume by adding a new disk
4. Configure NFS server and client
5. Monitor disk usage and set up an alert
6. Practice growing a partition

**Grading:**
- Partition created and mounted: 15%
- LVM set up correctly: 25%
- LVM extended successfully: 20%
- NFS working: 20%
- Monitoring configured: 10%
- Partition growth tested: 10%

## Evidence

- **OutcomeEvidence:** `SYS-LO2 — Storage & Filesystem Management`
- **Mastery:** `UserSkill: linux-storage-lvm`

## Unlock

Module3 — User Administration at Scale. You can manage disks. Now you learn how to manage users across systems.

## Sources

- `man fdisk`, `man parted`, `man lvm`, `man mdadm`, `man nfs`

