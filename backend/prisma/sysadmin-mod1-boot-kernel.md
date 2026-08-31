# Module 1 — Boot Process and Kernel Management

When a Linux server fails to come up after a kernel update at 3 AM, you don't have time to Google "how does Linux boot." You need to understand every stage from power-on to login prompt, and you need to know how to intervene at each one. This module walks through the entire boot process in practical detail, covering firmware handoff, bootloader configuration, initramfs internals, systemd initialization, kernel parameter tuning, and recovery from the most common boot failures. By the end, you will be able to diagnose any boot failure and recover a system that won't start.

## Firmware: BIOS versus UEFI

The boot process starts before Linux even loads. Your server firmware — either legacy BIOS or UEFI — performs a power-on self test (POST), initializes hardware, and then looks for a bootable device. The distinction between BIOS and UEFI matters because it determines how the bootloader gets invoked and what disk partitioning scheme you can use.

**BIOS (Legacy)** reads the first 512 bytes of a disk, called the Master Boot Record (MBR). That MBR contains a tiny bootstrap code, typically about 446 bytes, that locates and loads the next stage of the bootloader. The remaining 64 bytes store the partition table with four entries. The MBR scheme partitions disks with a maximum of four primary partitions and a 2 TB disk size limit. If you need more partitions, you create one extended partition and subdivide it into logical partitions. Most modern servers ship with UEFI, but you will encounter BIOS on older hardware and in some virtual machine templates. Many cloud providers still default to BIOS for maximum compatibility with older images.

**UEFI** stores boot entries in NVRAM and reads EFI System Partitions (ESP) — FAT32 partitions typically mounted at /boot/efi. UEFI supports GPT partition tables, disks larger than 2 TB, and more than four partitions natively. The firmware reads the bootloader binary directly from the ESP rather than from an MBR sector. This means the bootloader is just a file on a filesystem, making it easier to update and manage. UEFI also provides a firmware-level shell and supports secure boot, which verifies the bootloader's digital signature before executing it.

To check which firmware your system uses:

```bash
[ -d /sys/firmware/efi ] && echo "UEFI" || echo "BIOS"
```

On UEFI systems, you can inspect boot entries with `efibootmgr`:

```bash
efibootmgr -v
```

This shows you the boot order, the ESP device, and the path to the bootloader binary. If someone accidentally deletes a boot entry or the ESP gets corrupted, you will use `efibootmgr` to recreate it. The typical UEFI boot chain goes: firmware reads ESP, loads shim (for secure boot) or grubx64.efi directly, GRUB2 loads kernel and initramfs from /boot, kernel mounts root and starts systemd.

## GRUB2: The Grand Unified Bootloader

GRUB2 is the standard bootloader on most Linux distributions. It stages itself in two or three phases depending on whether the system uses BIOS or UEFI.

**Stage 1** lives in the MBR (BIOS) or as an EFI binary (UEFI). Its only job is to load Stage 1.5 or Stage 2. On BIOS systems, **Stage 1.5** sits in the gap between the MBR and the first partition, typically about 31 kilobytes of space. It contains enough filesystem code to read /boot on ext4, XFS, or Btrfs. **Stage 2** reads its configuration from `/boot/grub2/grub.cfg` (RHEL/CentOS) or `/boot/grub/grub.cfg` (Debian/Ubuntu). This file is auto-generated — you never edit it directly.

Instead, you edit `/etc/default/grub` and then regenerate `grub.cfg`. Key settings include `GRUB_TIMEOUT` which controls how many seconds GRUB waits before booting the default entry, `GRUB_DEFAULT` which sets the default kernel (use "saved" to remember the last booted kernel), `GRUB_CMDLINE_LINUX` which passes kernel parameters at boot, and `GRUB_DISABLE_RECOVERY` which controls whether recovery menu entries appear.

After editing `/etc/default/grub`, always regenerate the config. On RHEL/CentOS use `grub2-mkconfig -o /boot/grub2/grub.cfg`. On Debian/Ubuntu use `update-grub` which is a wrapper around the same command. For UEFI systems, also verify the ESP is mounted at `/boot/efi` before regenerating.

### Selecting and Removing Kernels

When you install a new kernel package, the post-install script automatically adds a GRUB entry. To see available kernels, use `awk` to parse the GRUB config file and extract `menuentry` lines. On RHEL/CentOS, you can set the default kernel with `grub2-set-default` followed by the index number or the exact kernel string. Always verify with `grub2-editenv list`.

To remove an old kernel, never remove the currently running one. On RHEL/CentOS, use `dnf remove` with the `repoquery installonly` command to keep only the desired number of kernels. Keep at minimum two kernels for rollback capability. On Debian/Ubuntu, use `apt remove` with the specific `linux-image` package name.

### GRUB Password Protection

On shared or colocated hardware, password-protect the GRUB menu to prevent unauthorized kernel parameter changes. Generate a password hash with `grub2-mkpasswd-pbkdf2`, then add a `superusers` directive and `password_pbkdf2` line to `/etc/grub.d/40_custom`. Regenerate the GRUB config afterward. This prevents editing kernel command lines at the GRUB menu but does not protect against physical access to the machine or resetting the BIOS.

## The initramfs

The initial RAM filesystem (initramfs) is a compressed archive loaded into memory by GRUB alongside the kernel. Its purpose is to provide just enough drivers and scripts to mount the real root filesystem and hand off to it. When the kernel boots, it may not have compiled-in support for the storage controller, disk format, or filesystem where the root partition lives. The initramfs loads those modules, assembles RAID arrays, unlocks LUKS encryption, and mounts the root filesystem.

### What Is Inside the initramfs

You can inspect its contents without booting from it. Use `lsinitrd` on RHEL/CentOS to list contents, or extract the archive using `skipcpio` piped to `zcat` and `cpio`. The initramfs typically contains the `init` script which is the early boot orchestrator, kernel modules for storage and filesystem and device drivers, `udev` rules for device detection, and binaries for LVM, RAID, and LUKS operations along with filesystem utilities like `fsck` and `mount`.

### Rebuilding the initramfs

If you add a new storage controller driver, update filesystem tools, or corrupt the initramfs, you must rebuild it. On RHEL/CentOS, use `dracut --force --kver` followed by the kernel version. On Debian/Ubuntu, use `update-initramfs -u -k` followed by the kernel version. Always verify the rebuild succeeded by listing the initramfs contents again.

A common failure scenario: you install a server with software RAID, but the initramfs was built without `mdadm` support. The system boots to a kernel panic because it cannot assemble /dev/md0. The fix is to boot from a live ISO, chroot into the system, run `dracut --force` with the appropriate modules, and reboot.

## systemd: The Init System

Once the kernel mounts the root filesystem and executes the initramfs `init` script, it launches PID 1 — which on modern systems is `systemd`. This is where the real initialization begins. systemd is not just an init system. It is a complete service management framework that handles mounting filesystems, starting network services, managing timers, and much more.

### systemd Targets

systemd organizes the boot into targets. Each target represents a set of units that should be active at a given stage. The `poweroff` target shuts down and halts the system. The `rescue` target provides single-user mode with no network. The `emergency` target gives you a minimal shell with the root filesystem mounted read-only. The `multi-user` target provides multi-user access without a graphical interface, which is typical for servers. The `graphical` target adds a GUI. The `default` target is a symlink to one of these, usually `multi-user.target` or `graphical.target`.

Check and change the default target with `systemctl get-default` and `systemctl set-default`. To understand what a target pulls in, use `systemctl list-dependencies` followed by the target name.

### Boot Timeline Analysis

To see how long the boot took and which units were slow, run `systemd-analyze` for the overall time, `systemd-analyze blame` for a sorted list of unit startup times, and `systemd-analyze critical-chain` to see the dependency chain that determines total boot time. This output is invaluable for performance tuning. If boot takes 90 seconds and you see a 60-second timeout on a NFS mount, you know exactly what to fix.

To generate a visual SVG of the boot timeline, run `systemd-analyze plot` and redirect to a file. You can open this in a web browser to see a Gantt chart of every unit's startup sequence.

### Understanding Unit Files

Every service, mount, timer, and socket is a unit. Unit files live in three locations with a clear priority order. Packages install units in `/usr/lib/systemd/system/` and you should never edit these files directly. Runtime units live in `/run/systemd/system/` and are lost on reboot. Admin overrides go in `/etc/systemd/system/` and have the highest priority.

To inspect a service, use `systemctl cat` to see the full unit file, `systemctl show` to see all properties, and `systemctl status` to see current state and recent logs. To create an override without editing the original file, use `systemctl edit` which opens an editor with a drop-in directory. To override a vendor unit entirely, use `systemctl edit --full` which creates a complete copy in `/etc/systemd/system/`.

## Kernel Parameters (sysctl)

Kernel parameters control low-level behavior including networking, memory management, and security posture. They can be tuned at runtime or persisted across reboots.

### Runtime Tuning

View all current values with `sysctl -a`. Change a value temporarily with `sysctl -w` followed by the parameter and value. This takes effect immediately but reverts on reboot.

### Persistent Tuning

Create files under `/etc/sysctl.d/` with a `.conf` extension. Use a numeric prefix to control ordering, typically 99 for custom settings. After creating the file, apply it with `sysctl -p` followed by the file path. Common server tuning includes enabling IP forwarding for router and NAT roles, increasing socket listen backlog, setting `vm.swappiness` to a low value for database servers, enabling SYN flood protection, and disabling IPv6 if not used.

### Critical sysctl Values

For a web server behind a load balancer, increase the ephemeral port range, allow more connections in TIME_WAIT, increase max open files, and increase max inotify watchers. For a database server, increase shared memory limits, disable transparent huge pages which are a performance killer for databases, and tune dirty page writeback settings. You can verify THB is disabled by reading `/sys/kernel/mm/transparent_hugepage/enabled` which should show `[never]` or `[madvise]`.

## Recovery: Bad Kernel Update Scenario

It is 2:47 AM. You updated the kernel on a production server ten minutes ago and now the system will not boot. The GRUB menu shows the new kernel as default and it panics during boot. Here is exactly what to do.

### Step 1: Access the GRUB Menu

If the system is stuck at a kernel panic, hold Shift during BIOS boot or press Esc repeatedly during UEFI boot to reach the GRUB menu. On some systems you may need to connect via IPMI, iLO, or iDRAC and reboot through the management interface. If GRUB is hidden, you may need to quickly interrupt the timeout. If you cannot reach GRUB, boot from a rescue USB or the distribution installation media.

### Step 2: Select the Previous Kernel

From the GRUB menu, select "Advanced options" or the submenu and choose the previous kernel version. This boots with the known-good kernel. If the previous kernel also fails, select "rescue" or "recovery mode" from the GRUB menu which boots into `rescue.target` with a root shell.

### Step 3: Fix the Default Kernel

Once booted, use `grub2-set-default` on RHEL/CentOS to select the previous kernel by name or index. On Debian/Ubuntu, edit `/etc/default/grub` to change `GRUB_DEFAULT` and then run `update-grub`.

### Step 4: Remove or Downgrade the Bad Kernel

On RHEL/CentOS, use `dnf remove` to remove the broken kernel or `dnf downgrade` to install a known-good version. On Debian/Ubuntu, use `apt remove` with the specific `linux-image` package name.

### Step 5: Rebuild initramfs If Necessary

If the kernel panic was due to missing storage drivers in the initramfs, boot into rescue mode and run `dracut --force` with the appropriate kernel version and modules. Then reboot.

### Step 6: Verify and Document

After reboot, run `uname -r` to confirm the correct kernel, `systemctl list-units --state=failed` to check for failed services, and `journalctl -b -p err` to review boot errors. Document what happened in your incident tracker: what kernel was installed, what failed, how you recovered, and what you changed to prevent recurrence.

## Common Boot Failures and Fixes

**Filesystem corruption** requires booting from rescue media and running `fsck` on the affected partition. Never run `fsck` on a mounted filesystem. Unmount first, then run `fsck -y`.

**Missing fstab entries** cause the system to drop to emergency mode if `/etc/fstab` references a UUID that no longer exists. Boot into rescue, fix the fstab, and reboot.

**An incorrect root device** in GRUB after disk changes can be fixed by pressing `e` at the GRUB menu to edit the boot entry, finding the line with `root=`, changing the device path, and pressing Ctrl+X to boot.

**Corrupted GRUB** requires booting from rescue media and reinstalling. Mount the root and boot partitions, chroot into the system, run `grub2-install` on the disk, and regenerate the config.

**A failed systemd service** blocking boot can be bypassed by adding `systemd.unit=rescue.target` to the kernel parameters at the GRUB edit screen. This boots to single-user mode where you can fix the service.

## Kernel Module Management

Beyond the boot process, managing kernel modules is part of daily sysadmin work. Modules are kernel extensions loaded on demand. Use `lsmod` to list loaded modules, `modinfo` to get details about a specific module, and `modprobe` to load a module. To blacklist a module and prevent it from loading, create a file in `/etc/modprobe.d/` with a `blacklist` directive. To make a module persistent across reboots, add its name to a file in `/etc/modules-load.d/`.

## Practical Assessment

**Lab Task:** Boot recovery drill (45 minutes)

1. Set up a test VM with the latest LTS kernel and one previous kernel
2. Boot into the current kernel and verify `uname -r`
3. Edit `/etc/default/grub` to set an incorrect `root=` parameter
4. Regenerate GRUB config and reboot
5. Recover the system using the GRUB edit-at-boot method
6. Once recovered, set the default kernel to the previous version using `grub2-set-default`
7. Reboot and verify the correct kernel is now default
8. Create a custom sysctl configuration that persists across reboots
9. Verify the sysctl settings are applied after reboot

**Grading criteria:** Correctly identifies the failing kernel at boot (10 points), successfully edits GRUB parameters at boot to recover (25 points), sets default kernel correctly with `grub2-set-default` (15 points), creates persistent sysctl configuration in `/etc/sysctl.d/` (15 points), documents the recovery steps in a runbook format (15 points), completes within 45 minutes (20 points).

## kexec: Skip Reboot for Kernel Changes

When you need to test a new kernel quickly without a full reboot cycle, `kexec` loads the next kernel into memory and jumps to it directly. This skips the entire BIOS/UEFI and GRUB boot process. Install `kexec-tools`, load the new kernel with `kexec -l` specifying the kernel image, initramfs, and command line, then trigger the jump with `kexec -e`. This is useful in CI/CD pipelines and automated kernel testing, but be aware that it skips orderly shutdown of services. For production systems, prefer a full reboot unless you have validated that all services handle kexec gracefully.

## BIOS/UEFI Firmware Settings

Before diving into GRUB and kernel configuration, understanding firmware settings is important because they directly affect how the system boots. Enter the BIOS/UEFI setup utility by pressing a key during POST (usually Delete, F2, or F10). Key settings include boot order which determines which device is tried first, secure boot which verifies bootloader signatures, virtualization support (VT-x/AMD-V) which must be enabled for KVM, and hardware-level features like NUMA and SR-IOV that affect performance.

On UEFI systems, the boot manager stores entries in NVRAM. You can manage these with `efibootmgr`. To create a new boot entry, use `efibootmgr --create` with the disk, partition, loader path, and description. To delete, use `--delete` with the boot number. To reorder, use `-o` with a comma-separated list of boot numbers. The BIOS boot order is simpler but less flexible — you typically set it once in the firmware setup utility and rarely change it.

## Understanding Boot Parameters

Kernel parameters passed at boot time control how the kernel initializes. The most critical is `root=` which specifies the root filesystem device. Without it, the kernel cannot find where to mount the root filesystem. Other important parameters include `ro` or `rw` for mounting root read-only or read-write, `crashkernel=auto` for kdump memory reservation, `console=` for specifying the console device (useful for serial console servers), and `rd.break` or `init=/bin/bash` for dropping to a shell before systemd starts.

To add a parameter temporarily at the GRUB menu, press `e` to edit the boot entry, find the line starting with `linux`, and add your parameter. Press Ctrl+X to boot with the modified parameters. This is the most common way to recover from a misconfigured system because it does not require any tools or boot media.

For persistent parameters, edit `/etc/default/grub` and add to `GRUB_CMDLINE_LINUX`. Regenerate the config with `grub2-mkconfig`. This is where you set parameters that should survive reboots, such as `iommu=pt` for PCI passthrough, `intel_iommu=on` for VT-d, or `systemd.unit=multi-user.target` to skip graphical boot.

## systemd Unit Dependencies and Ordering

Understanding how systemd orders unit startup is critical for complex systems. The `After=` directive does not create a dependency — it only specifies ordering. If you want a unit to start only if another is available, you must also use `Requires=` or `Wants=`. The `Requires=` directive creates a hard dependency: if the required unit fails, this unit fails too. `Wants=` is softer — the system tries to start the dependency but continues if it fails.

A common mistake is using `After=` without `Requires=`. The unit starts after the dependency but does not pull it in. If the dependency is not started elsewhere, your unit may start before it is ready. Always pair ordering with dependency directives.

The `Conflicts=` directive prevents two units from running simultaneously. This is useful for mutually exclusive services like different web servers. When one starts, the conflicting unit is stopped.

## Emergency Recovery Procedures

Beyond kernel updates, several other scenarios can prevent a server from booting. Here are the most common and their fixes.

**Corrupted /etc/fstab:** If a line in fstab references a UUID or device that no longer exists, the system drops to emergency mode. Boot from rescue media, mount the root filesystem, edit fstab to fix or remove the broken line, and reboot. Always use UUIDs in fstab instead of device names because device names can change between reboots.

**Lost root password:** If you cannot log in because the root password is lost or the PAM configuration is broken, boot into single-user mode by adding `single` or `systemd.unit=rescue.target` to the kernel parameters at GRUB. Once at the root shell, use `passwd` to set a new password.

**Full /var partition:** If /var fills up completely, many services fail including journald, sshd, and cron. The system may still boot but you cannot log in. Boot from rescue media, mount the root filesystem, delete old log files in /var/log, and reboot. To prevent this, monitor /var usage and configure logrotate aggressively.

**Broken GRUB after Windows dual-boot:** Windows updates sometimes overwrite the MBR or EFI boot entry. Boot from a Linux live USB, chroot into the Linux installation, and reinstall GRUB with `grub2-install` for MBR systems or `grub2-mkconfig` for UEFI systems.

## Practical Assessment

**Lab Task:** Boot recovery drill (45 minutes)

1. Set up a test VM with the latest LTS kernel and one previous kernel
2. Boot into the current kernel and verify `uname -r`
3. Edit `/etc/default/grub` to set an incorrect `root=` parameter
4. Regenerate GRUB config and reboot
5. Recover the system using the GRUB edit-at-boot method
6. Once recovered, set the default kernel to the previous version using `grub2-set-default`
7. Reboot and verify the correct kernel is now default
8. Create a custom sysctl configuration that persists across reboots
9. Verify the sysctl settings are applied after reboot
10. Simulate a corrupted fstab and recover from rescue mode
11. Document every step in a runbook format

**Grading criteria:** Correctly identifies the failing kernel at boot (10 points), successfully edits GRUB parameters at boot to recover (20 points), sets default kernel correctly with `grub2-set-default` (15 points), creates persistent sysctl configuration in `/etc/sysctl.d/` (15 points), recovers from corrupted fstab (15 points), documents all steps in a runbook format (15 points), completes within 45 minutes (10 points).

## Evidence

Collect the following for your portfolio: screenshot of `systemd-analyze blame` output showing boot unit timing, contents of your custom `/etc/default/grub` configuration, output of `sysctl -a` showing applied values, screenshot of GRUB menu showing kernel entries, your recovery runbook documenting the bad kernel scenario steps, output of `journalctl -b -p err` from the recovered system, screenshot of kexec loading a new kernel, and your fstab recovery procedure.
