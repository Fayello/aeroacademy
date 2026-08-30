# Module 1 — How the Kernel Boots



## What You'll Actually Do

You'll trace the boot process from power-on to userspace. Not the surface-level "BIOS→GRUB→systemd" — the actual kernel initialization, memory setup, and the first process that starts everything.


## Power-On to Kernel

```
Power → BIOS/UEFI → POST → Boot Device → GRUB → Kernel Load → initramfs → Kernel Init → systemd (PID 1)
```

**BIOS/UEFI:** POST (Power-On Self-Test), find boot device.

**GRUB:** Loads kernel (`vmlinuz`) and initramfs (`initrd.img`) into memory.

**Kernel decompresses itself:** The kernel is a compressed executable. It decompresses to memory and starts executing.


## Kernel Initialization

```bash
# See boot messages
dmesg | head -50
# [    0.000000] Linux version 6.5.0-44-generic
# [    0.000000] Command line: BOOT_IMAGE=/vmlinuz-6.5.0-44-generic root=/dev/sda1
# [    0.123456] Calibrating delay loop... 4800.00 BogoMIPS
# [    0.234567] Memory: 16384MB available
# [    0.345678] Mounting root filesystem
```

The kernel:
1. Detects hardware
2. Initializes memory management
3. Mounts root filesystem (from initramfs if needed)
4. Starts `init` (PID 1) — which is `systemd` on modern systems


## initramfs — The Bridge

The kernel can't always mount the root filesystem directly (encrypted disks, RAID, LVM). The initramfs has the drivers needed.

```bash
# What's in initramfs
lsinitramfs /boot/initrd.img-$(uname -r) | head -20
# /bin/busybox
# /conf
# /etc
# /init
# /lib/modules/...
```

The `/init` script in initramfs:
1. Loads necessary kernel modules
2. Assembles RAID/LVM if needed
3. Decrypts encrypted volumes
4. Mounts the real root filesystem
5. Execs the real `init` (systemd)


## systemd Takes Over

```bash
# What systemd does first
systemd-analyze
# Startup finished in 1.234s (kernel) + 4.567s (userspace) = 5.801s

# What's slow
systemd-analyze blame | head -10
# 2.345s networking.service
# 1.234s nginx.service

# Critical chain (what blocks everything)
systemd-analyze critical-chain
# multi-user.target +1.234s
# └─nginx.service +0.567s
#   └─networking.service +2.345s
```


## Kernel Command Line

```bash
# View current parameters
cat /proc/cmdline
# BOOT_IMAGE=/vmlinuz-6.5.0-44-generic root=/dev/sda1 ro quiet splash

# Common parameters
single          # single-user mode
init=/bin/bash  # emergency shell
ro              # read-only root
quiet           # suppress boot messages
splash          # show splash screen
```


## Real Task: Debug a Boot Failure

```bash
# Server drops to (initramfs) prompt
# Root filesystem can't be mounted

# 1. Check what's available
blkid
# /dev/sda1: UUID="abc123" TYPE="ext4"

# 2. Try mounting manually
mount /dev/sda1 /root

# 3. If it works, exit initramfs
exit

# 4. After boot, regenerate initramfs
update-initramfs -u -k all

# 5. Check fstab for errors
cat /etc/fstab | grep -v "^#" | grep -v "^$"
```


## Assessment

**Lab task (20 min):**

1. Analyze boot time with `systemd-analyze`
2. Identify the slowest service
3. Examine kernel boot parameters
4. Regenerate initramfs
5. Boot into single-user mode

**Grading:**
- Boot analysis: 20%
- Slowest service identified: 20%
- Kernel params examined: 20%
- initramfs regenerated: 20%
- Single-user tested: 20%


## Evidence

- **OutcomeEvidence:** `INT-LO1 — Kernel Boot Process`
- **Mastery:** `UserSkill: linux-kernel-boot`


## Unlock

Module2 — Process Management. The kernel is running. Now you learn how it manages processes.


## Sources

- `man boot`, `man systemd-analyze`, `man dracut`
- Linux kernel documentation


