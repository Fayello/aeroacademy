# Module 1 — Boot Process and Kernel Management


## What You'll Actually Do

Server won't boot. You need to figure out why — bad kernel update? Corrupted initramfs? Mount failure? You'll trace the boot process from power-on to login prompt, and fix what's broken.

## Boot Sequence — What Happens When You Press Power

```
BIOS/UEFI → Bootloader (GRUB) → Kernel → initramfs → systemd → login
```

**BIOS/UEFI:** Hardware check, finds boot device.

**GRUB:** Reads `/boot/grub/grub.cfg`, loads kernel and initramfs.

**Kernel:** Initializes hardware, mounts root filesystem.

**initramfs:** Temporary root filesystem with drivers needed to mount the real root.

**systemd:** PID 1. Starts all services.

## GRUB — The Bootloader

**Edit boot parameters (for debugging):**
```bash
# At GRUB menu, press 'e' to edit
# Find the linux line, add:
single          # boot into single-user mode
init=/bin/bash  # drop to root shell (bypasses everything)
```

**Reinstall GRUB after disk changes:**
```bash
grub-install /dev/sda
update-grub
```

**Default boot kernel:**
```bash
grep menuentry /boot/grub/grub.cfg
# 0: Ubuntu, with Linux 6.5.0-44-generic
# 1: Ubuntu, with Linux 6.5.0-42-generic

# Set default:
sudo grub-set-default 0
sudo update-grub
```

## Kernel — What's Running

**Current kernel:**
```bash
uname -r
# 6.5.0-44-generic
```

**Loaded modules:**
```bash
lsmod
# Module                  Size  Used by
# ext4                  123456  3
# snd_hda_intel          45678  0
```

**Load a module:**
```bash
modprobe bridge
```

**Blacklist a module (prevent loading):**
```bash
echo "blacklist nouveau" > /etc/modprobe.d/blacklist-nouveau.conf
update-initramfs -u
```

**Kernel parameters (runtime):**
```bash
sysctl -a                    # list all
sysctl net.ipv4.ip_forward   # check one
sysctl -w net.ipv4.ip_forward=1  # set one (temporary)
```

Make permanent in `/etc/sysctl.conf`.

## initramfs — The Temporary Root

If the kernel can't mount root, initramfs has the drivers.

**Regenerate initramfs:**
```bash
update-initramfs -u
```

**Check what's in it:**
```bash
lsinitramfs /boot/initrd.img-$(uname -r) | head -20
```

**Common failure:** After kernel update, initramfs doesn't include your filesystem driver. Server drops to `(initramfs)` prompt.

**Fix:**
```bash
# At initramfs prompt:
mount /dev/sda1 /root
exit
# Boot continues
```

Then regenerate:
```bash
update-initramfs -u -k all
```

## systemd — The Boot Manager

**List boot targets:**
```bash
systemctl list-units --type=target
# basic.target     active
# multi-user.target active
# graphical.target inactive
```

**Set default target:**
```bash
systemctl set-default multi-user.target   # text mode
systemctl set-default graphical.target    # GUI
```

**Analyze boot time:**
```bash
systemd-analyze
# Startup finished in 1.234s (kernel) + 4.567s (userspace) = 5.801s

systemd-analyze blame | head -10
# 2.345s networking.service
# 1.234s nginx.service
```

**Critical chain (what blocks everything):**
```bash
systemd-analyze critical-chain
```

## Recovery — When Boot Fails

**Boot into rescue mode:**
```bash
# At GRUB, edit linux line, add:
systemd.unit=rescue.target
```

**Boot into emergency mode:**
```bash
# At GRUB, edit linux line, add:
systemd.unit=emergency.target
```

**Root filesystem readonly (common after crash):**
```bash
# Boot into single user, then:
mount -o remount,rw /
fsck /dev/sda1
mount -o remount,ro /
reboot
```

**Check filesystem:**
```bash
fsck -f /dev/sda1
```
Run when filesystem is unmounted. If root, boot from live USB.

## Real Task: Fix a Server That Won't Boot

```bash
# Server shows GRUB but drops to (initramfs)
# Diagnosis: root filesystem UUID changed after disk resize

# 1. At initramfs prompt, find the root device:
blkid
# /dev/sda1: UUID="abc123..." TYPE="ext4"

# 2. Mount it:
mount /dev/sda1 /root

# 3. Update fstab with correct UUID:
blkid /dev/sda1
nano /root/etc/fstab
# Replace old UUID with new one

# 4. Exit initramfs, system boots

# 5. After boot, regenerate initramfs:
update-initramfs -u
```

## Assessment

**Lab task (20 min):**

1. Check current kernel version and loaded modules
2. List all boot targets and identify the default
3. Analyze boot time — which service is slowest?
4. Add a kernel parameter via sysctl and verify it persists after reboot
5. Blacklist a module and regenerate initramfs
6. Boot into rescue mode and check filesystem

**Grading:**
- Kernel info checked: 10%
- Boot targets identified: 15%
- Boot time analyzed: 15%
- sysctl persistent: 20%
- Module blacklisted: 20%
- Rescue mode tested: 20%

## Evidence

- **OutcomeEvidence:** `SYS-LO1 — Boot Process & Kernel Management`
- **Mastery:** `UserSkill: linux-boot-kernel`

## Unlock

Module2 — Storage and Filesystems. You can boot the server. Now you learn how to manage what's on the disk.

## Sources

- `man grub`, `man modprobe`, `man sysctl`, `man systemd-analyze`
- `man fsck`, `man lsinitramfs`

