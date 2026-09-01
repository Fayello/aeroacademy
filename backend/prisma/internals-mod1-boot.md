# Module 1: How the Kernel Boots

## The Boot Process: From Power Button to Login Prompt

When you press the power button on a Linux server, a remarkably complex chain of events unfolds before you see a login prompt. Understanding this chain is not academic curiosity: it is the difference between a five-minute fix and a three-hour outage when a server refuses to boot after a kernel update, a disk replacement, or a misconfigured GRUB.

This module walks through every stage of the Linux boot process, from firmware initialization through the kernel taking control, to systemd bringing up services. We will focus on what actually happens, the files involved, and how to troubleshoot when things go wrong.

## BIOS vs UEFI: Two Worlds of Firmware

### Legacy BIOS Boot

The Basic Input/Output System (BIOS) has been the standard firmware interface for IBM-compatible PCs since the early 1980s. When a BIOS system powers on, the CPU loads the firmware from a ROM chip on the motherboard. The firmware performs a Power-On Self Test (POST), initializes hardware, and then reads the first 512-byte sector (the Master Boot Record, or MBR) from the boot disk.

The MBR contains three things: a 446-byte bootstrap code area, a 64-byte partition table, and a 2-byte signature (0x55AA). The BIOS loads this sector into memory at address 0x7C00 and jumps to it. This is the critical handoff point: the firmware has done its job, and now the bootloader takes over.

The fundamental limitation of MBR is its 2 TB disk size limit and its maximum of four primary partitions. For modern servers with multi-terabyte drives, this is a real constraint.

### UEFI Boot

Unified Extensible Firmware Interface (UEFI) replaces BIOS on all modern hardware. Instead of loading a single 512-byte MBR sector, UEFI reads the EFI System Partition (ESP), a FAT32-formatted partition typically 512 MB in size. The firmware loads the bootloader executable (for Linux, this is typically `grubx64.efi`) directly from the ESP.

UEFI supports GPT (GUID Partition Table) partitioning, which allows disks larger than 2 TB and up to 128 partitions. The boot process is more flexible: UEFI maintains a list of boot entries in NVRAM, and you can manage them with `efibootmgr`:

```bash
efibootmgr -v          # Show all boot entries
efibootmgr -o 0003,0001  # Set boot order
```

### Secure Boot

UEFI Secure Boot adds a chain of trust. The firmware contains keys from the hardware vendor, and it will only load bootloaders signed with a trusted key. For Linux, this means the bootloader (GRUB) and the kernel itself must be signed. Most distributions ship signed kernels, but if you build custom kernels, you need to either enroll your own signing key or disable Secure Boot.

To check Secure Boot status on a running system:

```bash
mokutil --sb-state
# or
dmesg | grep -i secure
```

## GRUB2: The Bootloader

GRUB2 (GRand Unified Bootloader version 2) is the standard bootloader on most Linux distributions. Its job is to load the kernel and initramfs into memory and hand control to the kernel.

### GRUB2 Configuration

GRUB2 reads its configuration from `/boot/grub2/grub.cfg` (on RHEL/CentOS) or `/boot/grub/grub.cfg` (on Debian/Ubuntu). You should never edit this file directly: it is auto-generated. Instead, edit `/etc/default/grub` and then regenerate:

```bash
grub2-mkconfig -o /boot/grub2/grub.cfg    # RHEL/CentOS
update-grub                                 # Debian/Ubuntu
```

Key variables in `/etc/default/grub`:

```
GRUB_TIMEOUT=5
GRUB_DEFAULT=saved
GRUB_CMDLINE_LINUX="crashkernel=auto rhgb quiet"
GRUB_DISABLE_RECOVERY=true
```

The `GRUB_CMDLINE_LINUX` line is where kernel command line parameters are set. These parameters control kernel behavior at boot time and are examined in detail later in this module.

The `saved` default means GRUB remembers the last selected kernel, which is useful after kernel updates where you want to boot the previous version temporarily.

### GRUB2 Troubleshooting

When GRUB fails, you typically see either "GRUB rescue>" or "GRUB>" prompt, or the system boots directly into BIOS. Common causes:

**Missing grub.cfg**: The configuration file was deleted or corrupted. From the GRUB rescue prompt:

```
set root=(hd0,msdos1)
set prefix=(hd0,msdos1)/boot/grub2
insmod normal
normal
```

**Wrong root partition**: After partition table changes, GRUB may point to the wrong partition. Boot from a live USB and reinstall:

```bash
mount /dev/sda2 /mnt
mount /dev/sda1 /mnt/boot
grub2-install --root-directory=/mnt /dev/sda
grub2-mkconfig -o /mnt/boot/grub2/grub.cfg
```

**Corrupted boot sector**: If the MBR or GPT boot sector is damaged:

```bash
grub2-install /dev/sda
```

### Kernel Command Line Parameters

Kernel parameters control behavior that cannot be determined at compile time. Some critical ones:

- `root=/dev/sda2`: Specifies the root filesystem device
- `ro`: Mount root filesystem read-only initially
- `init=/bin/bash`: Boot directly to a shell (emergency recovery)
- `single` or `1`: Boot into single-user mode
- `systemd.unit=rescue.target`: Boot into rescue mode
- `systemd.unit=emergency.target`: Boot into emergency mode
- `crashkernel=256M`: Reserve memory for kdump
- `nomodeset`: Disable kernel mode setting (useful for GPU driver issues)
- `rd.break`: Break before switching from initramfs to real root
- `rd.shell`: Drop to shell if initramfs fails
- `biosdevname=0`: Use traditional network interface naming (eth0 instead of ens192)

To view the current kernel command line on a running system:

```bash
cat /proc/cmdline
```

To modify parameters temporarily at boot, press 'e' in the GRUB menu to edit the entry, modify the `linux` line, and press Ctrl+X to boot.

## initramfs: The Bridge Between Bootloader and Root Filesystem

### What initramfs Contains

The initial RAM filesystem (initramfs) is a compressed archive containing the minimum files needed to mount the real root filesystem. It includes kernel modules for storage controllers, filesystem drivers, and LVM/RAID tools. Without initramfs, the kernel would need every possible storage driver compiled in: an impractical approach for distribution kernels.

A typical initramfs contains:

```bash
lsinitrd /boot/initramfs-$(uname -r).img
```

You will see:
- `/bin`, `/sbin`: BusyBox or klibc utilities
- `/etc/udev/`: udev rules for device detection
- `/lib/modules/`: Kernel modules needed before root mount
- `/lib/dracut/` (on systemd systems): dracut modules
- `/scripts/`: Boot scripts that assemble RAID, LUKS, LVM, then mount root

### How initramfs Gets Built

Modern distributions use one of two tools:

**dracut** (RHEL/CentOS/Fedora):

```bash
dracut --force /boot/initramfs-$(uname -r).img $(uname -r)
```

dracut is modular. Each feature (LVM, LUKS, iSCSI, NFS root) is a module in `/usr/lib/dracut/modules.d/`. You can add or remove modules:

```bash
dracut --add "lvm" --force /boot/initramfs-new.img
dracut --omit "network" --force /boot/initramfs-new.img
```

**initramfs-tools** (Debian/Ubuntu):

```bash
update-initramfs -u
```

Configuration lives in `/etc/initramfs-tools/` with files like `modules` (list of modules to include) and `conf.d/` (configuration snippets).

### Rebuilding initramfs

When you add a new storage controller or change filesystem type, you must rebuild initramfs. If you forget, the system will not boot:

```bash
# After installing a new storage driver module
cp my_driver.ko /lib/modules/$(uname -r)/extra/
dracut --force /boot/initramfs-$(uname -r).img $(uname -r)
```

To verify what is in the initramfs:

```bash
# List contents
lsinitrd /boot/initramfs-$(uname -r).img

# Check for specific module
lsinitrd /boot/initramfs-$(uname -r).img | grep my_driver

# Extract to a directory
mkdir /tmp/initrd-extract
cd /tmp/initrd-extract
/usr/lib/dracut/skipcpio /boot/initramfs-$(uname -r).img | zcat | cpio -idmv
```

## The Kernel: Taking Control

When GRUB loads the kernel and initramfs into memory, it jumps to the kernel's entry point. The kernel begins a multi-stage initialization:

### Early Boot (before init)

1. **Decompression**: The kernel is typically compressed (gzip, lz4, or zstd). The decompressor runs first.

2. **Hardware detection**: The kernel probes for CPUs, memory, buses, and essential devices. At this stage, only built-in drivers work: loadable modules are not yet available.

3. **Memory initialization**: The kernel sets up page tables, initializes the buddy allocator, and creates the kernel address space.

4. **Interrupt and timer setup**: The interrupt descriptor table is configured, and the system timer is initialized.

5. **Scheduler initialization**: The Completely Fair Scheduler (CFS) data structures are created.

6. **VFS initialization**: The virtual filesystem layer is set up, and the root filesystem type is registered.

7. **initramfs processing**: The kernel unpacks the initramfs into a tmpfs, executes `/init` (usually a shell script), which performs the following:
   - Loads necessary kernel modules
   - Detects storage devices (udev)
   - Assembles RAID arrays if needed
   - Opens LUKS encryption if needed
   - Activates LVM volume groups
   - Mounts the real root filesystem
   - Executes `switch_root` to change to the real root and exec `/sbin/init`

### The switch_root to systemd

After `switch_root`, the kernel executes `/sbin/init`, which on modern systems is a symlink to `/usr/lib/systemd/systemd`. The systemd boot chain is:

```
initrd → systemd → sysinit.target → basic.target → default.target (multi-user.target or graphical.target)
```

The boot targets are ordered by dependency. The critical path is:

```
initrd-switch-root.target
  → systemd-journal.service
  → sysinit.target (device enumeration, udev)
    → basic.target (sockets, timers, paths)
      → multi-user.target (non-graphical services)
        → network.target
          → sshd.service
```

To view the boot sequence and identify slow units:

```bash
systemd-analyze                          # Total boot time
systemd-analyze blame                    # Time per unit
systemd-analyze critical-chain           # Critical path
systemd-analyze plot > boot.svg          # Visual timeline
```

## Real Scenario: Server Won't Boot After Kernel Update

### The Problem

A production CentOS 8 server running a critical application was updated with `dnf update` which installed a new kernel. After reboot, the server dropped to an initramfs shell with:

```
dracut: FATAL: No or empty root= argument
dracut: FATAL: /dev/mapper/rootvg-rootvol does not exist
```

### Investigation

Boot into the previous kernel from the GRUB menu. Once logged in, investigate:

```bash
# Check current kernel and initramfs
uname -r
ls -la /boot/initramfs-*
```

The initramfs for the new kernel was 40% smaller than expected: a sign that critical modules were not included.

```bash
# Check what the new initramfs contains
lsinitrd /boot/initramfs-$(dnf list installed kernel | tail -1 | awk '{print $2}').img | grep dm
```

No device-mapper modules were present. The issue: the new kernel version changed the module directory structure, and dracut failed to find the LVM modules.

### Resolution

```bash
# Rebuild initramfs with explicit module inclusion
NEW_KERNEL=$(rpm -q kernel | sort -V | tail -1 | sed 's/kernel-//')
dracut --add "lvm dm" --force /boot/initramfs-${NEW_KERNEL}.img ${NEW_KERNEL}

# Verify
lsinitrd /boot/initramfs-${NEW_KERNEL}.img | grep dm
# Should show dm-mod.ko, dm-mirror.ko, etc.

# Set as default and reboot
grub2-set-default 0
reboot
```

### Prevention

After any kernel update, verify the initramfs before rebooting:

```bash
# Script to run as part of kernel post-install hook
#!/bin/bash
KERNEL_VERSION=$1
EXPECTED_SIZE=8192  # minimum expected size in KB
ACTUAL_SIZE=$(du -k /boot/initramfs-${KERNEL_VERSION}.img | cut -f1)

if [ "$ACTUAL_SIZE" -lt "$EXPECTED_SIZE" ]; then
    echo "WARNING: initramfs for ${KERNEL_VERSION} is suspiciously small"
    echo "Rebuilding with LVM modules..."
    dracut --add "lvm dm" --force /boot/initramfs-${KERNEL_VERSION}.img ${KERNEL_VERSION}
fi
```

Add this to `/etc/kernel/postinst.d/` (Debian) or create a dnf plugin (RHEL) to run automatically.

## Multiple Kernel Management

Production servers often have multiple kernels installed. Managing them properly prevents boot issues:

```bash
# List installed kernels
rpm -q kernel    # RHEL/CentOS
dpkg -l 'linux-image*' | grep '^ii'   # Debian/Ubuntu

# Set default kernel
grub2-set-default 0    # Boot the newest kernel
grub2-set-default 2    # Boot the third entry

# View GRUB menu entries
grub2-editenv list
# saved_entry=0

# Set default with a specific kernel version
grub2-set-default "Advanced options for Ubuntu>Ubuntu, with Linux 5.15.0-generic"

# Limit kernel count (keep only 2 most recent)
dnf install dnf-automatic
# Or manually:
package-cleanup --oldkernels --count=2

# On Ubuntu:
apt purge $(dpkg -l 'linux-image-*' | grep '^ii' | awk '{print $2}' | grep -v $(uname -r | sed 's/linux-image-//') | head -n -2)
```

## Kernel Boot Diagnostics

When a system boots but behaves abnormally, these diagnostics identify the issue:

```bash
# View the boot sequence
journalctl -b | head -100

# Check for failed services
systemctl --failed

# View kernel messages from boot
dmesg | head -50
dmesg | grep -i "error\|warn\|fail"

# Check boot time breakdown
systemd-analyze
# Startup finished in 5.123s (kernel) + 12.456s (initrd) + 45.678s (userspace) = 1min 3.257s

# Find the slowest services
systemd-analyze blame | head -10
# 15.234s NetworkManager-wait-online.service
#  8.567s plymouth-quit-wait.service
#  5.432s cloud-init.service

# Check the critical chain (what blocks the boot)
systemd-analyze critical-chain
# The time after the product of critical chain segments

# Check for filesystem errors at boot
journalctl -b | grep -i "fsck\|ext4\|xfs"
# If fsck found and fixed errors, check the report

# Verify kernel modules loaded correctly
lsmod | wc -l
dmesg | grep -i "module"
```

## Kernel Boot Parameters: Advanced

### Debugging Boot Issues

When a system hangs during boot, kernel parameters can reveal what is happening:

```bash
# Verbose boot logging
quiet           # Default: suppress most messages (remove this)
loglevel=8      # Show all messages (1=emerg, 8=debug)
earlyprintk=vga # Show kernel messages on screen before framebuffer

# Debug specific subsystems
initcall_debug  # Show every init function call and timing
rootdelay=30    # Wait 30 seconds before mounting root (slow USB/RAID)
rd.shell        # Drop to shell if initramfs fails
rd.break        # Break before switching from initramfs to root

# Memory debugging
memtest=4       # Run memory test for 4 passes before boot
nokaslr         # Disable kernel address space layout randomization
slub_debug=FZP  # Enable SLUB debugging (F=red zoning, Z=poisoning, P=poisons)

# Network debugging for diskless boot
ip=dhcp         # Auto-configure network via DHCP
nfsroot=192.168.1.100:/exports/nfsroot  # NFS root
```

### systemd Boot Targets

Understanding systemd targets helps with boot troubleshooting:

```bash
# View all available targets
systemctl list-units --type=target

# Key boot targets:
# basic.target         → Essential services (sockets, timers)
# multi-user.target    → Non-graphical login (servers)
# graphical.target     → GUI login
# rescue.target        → Single-user mode (root shell)
# emergency.target     → Minimal system (read-only root)
# poweroff.target      → Shut down
# reboot.target        → Restart

# Change default target
systemctl set-default multi-user.target

# Boot into a specific target temporarily
# At GRUB, append: systemd.unit=rescue.target

# View target dependencies
systemctl list-dependencies multi-user.target

# Analyze why a target failed to start
systemctl list-dependencies multi-user.target --failed
```

### initramfs Debugging

When initramfs fails to mount the root filesystem:

```bash
# Boot with rd.shell to drop into initramfs shell
# At GRUB, append: rd.shell

# In the initramfs shell, investigate:
cat /proc/cmdline          # Check kernel parameters
lvm pvs                     # Check LVM volumes
blkid                       # Check block devices
mount                       # Check mounted filesystems

# Common initramfs issues:
# 1. Missing storage driver → rebuild initramfs with dracut --add
# 2. Wrong root= parameter → check UUID with blkid
# 3. LVM not activated → check lvm.conf and initramfs hooks
# 4. LUKS encryption → check crypttab and key files

# Rebuild initramfs from chroot
# Boot from live USB, chroot into system:
mount /dev/sda2 /mnt
mount /dev/sda1 /mnt/boot
mount --bind /dev /mnt/dev
mount --bind /proc /mnt/proc
mount --bind /sys /mnt/sys
chroot /mnt
dracut --force
exit
```

### GRUB2 Password Protection

Protect GRUB from unauthorized kernel parameter changes:

```bash
# Generate a password hash
grub2-mkpassword-pbkdf2
# Enter password: <your password>
# PBKDF2 hash of your password is: grub.pbkdf2.sha512.10000.MF...

# Add to /etc/grub.d/40_custom
cat >> /etc/grub.d/40_custom << 'EOF'
set superusers="admin"
password_pbkdf2 admin grub.pbkdf2.sha512.10000.MF...
EOF

# Regenerate GRUB config
grub2-mkconfig -o /boot/grub2/grub.cfg

# Verify password protection
# Press 'e' at GRUB menu → should prompt for username and password
```

## Kernel Panic Analysis

A kernel panic is the Linux equivalent of a Blue Screen of Death. When the kernel detects an unrecoverable error, it prints a panic message and either halts or reboots (depending on the `panic` kernel parameter).

### Common Kernel Panic Causes

1. **Corrupted root filesystem**: Missing critical files, corrupted superblock
2. **Missing initramfs modules**: Storage driver not in initramfs, cannot mount root
3. **Hardware failure**: Bad RAM, failing disk, CPU thermal shutdown
4. **Kernel module bugs**: Null pointer dereference in a loaded module
5. **Configuration errors**: Wrong `root=` parameter, incorrect fstab

### Reading a Kernel Panic

```
[  123.456789] BUG: unable to handle kernel NULL pointer dereference at 0000000000000010
[  123.456790] PGD 0 P4D 0
[  123.456791] Oops: 0000 [#1] SMP NOPTI
[  123.456792] CPU: 2 PID: 1234 Comm: myapp Not tainted 5.4.0-generic #1
[  123.456793] RIP: 0010:my_driver_read+0x1a/0x50 [my_driver]
[  123.456794] Code: 48 8b 47 08 48 85 c0 74 05 48 8b 40 10 c3 ...
[  123.456795] Call Trace:
[  123.456796]  vfs_read+0x9a/0x160
[  123.456797]  ksys_read+0x67/0xe0
[  123.456798]  do_syscall_64+0x57/0x190
```

Key fields:
- **RIP**: The instruction that caused the panic (function name and offset)
- **Call Trace**: The chain of function calls leading to the panic
- **Code**: Raw bytes at the faulting instruction
- **Not tainted**: The kernel was not loaded with proprietary modules

### Recovering from Kernel Panics

```bash
# After reboot, check the panic log
journalctl -b -1 -p err   # Logs from previous boot (before panic)
dmesg | grep -i "panic\|oops\|bug"

# If kdump was configured, analyze the crash dump
crash /usr/lib/debug/boot/vmlinux-$(uname -r) /var/crash/*/vmcore

# Check hardware if panic is recurring
mcelog --client             # Machine Check Exception log
edac-util -s                # Error Detection And Correction
smartctl -a /dev/sda        # Disk health
memtest86+                  # Memory test (boot from USB)
```

### Setting Panic Behavior

```bash
# Reboot automatically after 10 seconds on panic
echo 10 > /proc/sys/kernel/panic

# Make persistent
echo "kernel.panic = 10" >> /etc/sysctl.d/99-panic.conf
sysctl -p /etc/sysctl.d/99-panic.conf

# Record crash dumps with kdump
dnf install kexec-tools
systemctl enable kdump
# Reserve memory for kdump in /etc/default/grub:
# crashkernel=256M
```

## Emergency Boot Procedures

When a server will not boot and you cannot select a previous kernel from GRUB, these procedures recover access:

### Boot to Single-User Mode

From GRUB, edit the kernel line and append `single` or `systemd.unit=rescue.target`. This boots with minimal services and drops you to a root shell.

### Boot with init=/bin/bash

If the root filesystem is corrupt and systemd cannot start, `init=/bin/bash` bypasses init entirely. The kernel mounts root (read-only by default) and drops to bash. Remount read-write:

```bash
mount -o remount,rw /
```

### Boot from Live USB and Chroot

If GRUB itself is broken:

```bash
# Boot from live USB
mount /dev/sda2 /mnt           # root partition
mount /dev/sda1 /mnt/boot      # boot partition
mount --bind /dev /mnt/dev
mount --bind /proc /mnt/proc
mount --bind /sys /mnt/sys
chroot /mnt
grub2-install /dev/sda
grub2-mkconfig -o /boot/grub2/grub.cfg
exit
reboot
```

### Recovering from a Failed Kernel Update

```bash
# From rescue mode or chroot
dnf list installed kernel      # List installed kernels
rpm -e --nodeps kernel-NEW     # Remove broken kernel
grub2-set-default 0            # Point to previous kernel
grub2-mkconfig -o /boot/grub2/grub.cfg
```

## Assessment

### Lab Task 1: GRUB Configuration (30 minutes)

1. Modify `/etc/default/grub` to add kernel parameter ` elevator=noop` (deprecated but still parseable)
2. Regenerate GRUB config and verify it appears in `/boot/grub2/grub.cfg`
3. Revert the change and regenerate again
4. Document the exact commands used

**Grading**: Correct modification (25%), correct regeneration (25%), correct revert (25%), documentation (25%)

### Lab Task 2: initramfs Rebuild (20 minutes)

1. Create a dummy kernel module file at `/lib/modules/$(uname -r)/extra/testmod.ko` (copy any existing .ko file)
2. Rebuild initramfs using dracut or update-initramfs
3. Verify the module is present in the initramfs using `lsinitrd`
4. Remove the test module and rebuild again

**Grading**: Module present in initramfs after rebuild (50%), clean rebuild (25%), removal verified (25%)

### Lab Task 3: Emergency Boot Recovery (40 minutes)

1. Boot into single-user mode using GRUB edit
2. From single-user, modify a file in `/etc/` to prove write access
3. Reboot normally and verify the change persists
4. Document the GRUB editing steps

**Grading**: Successful single-user boot (30%), file modification (30%), normal reboot (20%), documentation (20%)

### Lab Task 4: Boot Chain Analysis (20 minutes)

1. Run `systemd-analyze blame` and identify the 5 slowest services
2. Run `systemd-analyze critical-chain` and identify the critical path
3. For the slowest service, determine why it is slow (check journal logs)
4. Write a one-paragraph recommendation for improving boot time

**Grading**: Correct identification of slow services (25%), critical chain analysis (25%), root cause for slowest service (25%), actionable recommendation (25%)

## Evidence

### Documentation of Boot Process Understanding

Evidence of understanding the boot process includes:

- Ability to identify which firmware type (BIOS or UEFI) a system uses: `dmidecode -s bios-vendor` and checking for `/sys/firmware/efi` directory
- Reading and interpreting `/boot/grub2/grub.cfg` to understand how GRUB chain-loads the kernel
- Using `lsinitrd` to inspect initramfs contents and verify module inclusion
- Running `systemd-analyze` tools to map the boot dependency chain
- Recovering a non-booting system using GRUB edit, single-user mode, or live USB chroot
- Understanding the handoff points: firmware → GRUB → kernel → initramfs → systemd → services

### Key Files and Locations

| File | Purpose |
|------|---------|
| `/etc/default/grub` | GRUB configuration defaults |
| `/boot/grub2/grub.cfg` | Generated GRUB config (do not edit) |
| `/boot/vmlinuz-*` | Kernel images |
| `/boot/initramfs-*` | Initial RAM filesystem images |
| `/etc/fstab` | Filesystem mount table |
| `/proc/cmdline` | Current kernel command line |
| `/etc/dracut.conf.d/` | dracut configuration drop-in directory |
| `/usr/lib/dracut/modules.d/` | dracut modules |
| `/etc/systemd/system/` | Systemd unit files |

### Debugging Checklist

When a system fails to boot, follow this sequence:

1. **GRUB appears but no boot**: Check kernel and initramfs exist in `/boot/`, verify GRUB config points to correct root device
2. **Kernel panic**: Note the error message, boot previous kernel, check `dmesg` after successful boot
3. **Drops to initramfs shell**: Missing storage/filesystem modules in initramfs, rebuild with `dracut --force`
4. **Drops to maintenance mode**: Filesystem corruption or missing fstab entries, boot single-user and check `fsck` results
5. **Hangs during boot**: Add `systemd.log_level=debug systemd.log_target=kmsg` to kernel line for verbose output
6. **Network not available after boot**: Check `biosdevname` setting, verify network service dependencies in systemd