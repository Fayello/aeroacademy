# Module 8 — Device Drivers and Hardware

**Course:** Linux Internals | **Path:** Linux Internals (8 of 10)

---

## What You'll Actually Do

A new NVMe drive isn't showing up. You need to check if the driver is loaded, examine dmesg for errors, and understand how the kernel discovers and manages hardware.

---

## How Linux Sees Hardware

```bash
# PCI devices
lspci | head -10
# 00:01.0 PCI bridge: Intel Corporation ...
# 01:00.0 VGA compatible controller: NVIDIA Corporation ...
# 02:00.0 Ethernet controller: Intel Corporation ...

# USB devices
lsusb
# Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub

# Block devices
lsblk
# NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
# sda      8:0    0   50G  0 disk
# nvme0n1 259:0   0  477G  0 disk

# Device files
ls /dev/sd* /dev/nvme* /dev/tty*
# /dev/sda, /dev/sda1, /dev/nvme0n1, /dev/tty0
```

---

## Kernel Messages — dmesg

```bash
# All kernel messages
dmesg | tail -30

# Hardware errors
dmesg | grep -i "error\|fail\|warn"

# NVMe drive detected?
dmesg | grep nvme
# [   12.345] nvme nvme0: 24/0/0 read/write error ...
# [   12.678] nvme nvme0: controller is down; restarting

# USB events
dmesg | tail -5
# [  123.456] usb 1-1: new high-speed USB device
```

---

## Loading Drivers

```bash
# Check if driver is loaded
lsmod | grep nvme
# nvme                  45678  0
# nvme_core            123456  1 nvme

# Load manually if missing
modprobe nvme

# Check driver info
modinfo nvme
# filename: /lib/modules/6.5.0-44/kernel/drivers/nvme/host/nvme.ko
# license: GPL
# description: NVM Express block device driver
```

---

## /sys — Hardware Tree

```bash
# Device tree
ls /sys/class/
# block  dma  input  mdio_bus  net  tty

# Block device details
cat /sys/block/sda/queue/scheduler
# [mq-deadline] kyber bfq none

cat /sys/block/sda/queue/nr_requests
# 128

# Network device
cat /sys/class/net/ens3/speed
# 1000

cat /sys/class/net/ens3/operstate
# up
```

---

## Interrupts

```bash
# Hardware interrupts
cat /proc/interrupts | head -5
#            CPU0       CPU1       CPU2       CPU3
#  42:     123456      0          0          0   IR-PCI-edge   eth0

# Softirqs (kernel interrupts)
cat /proc/softirqs | head -5
#                    CPU0       CPU1       CPU2       CPU3
#          HI:        1234       1234       1234       1234
#       TIMER:      123456     123456     123456     123456
```

---

## Real Task: Debug New Hardware

```bash
# NVMe drive not showing up
lsblk
# Only sda visible

# Check dmesg
dmesg | grep nvme
# [   12.345] nvme: probe of nvme0 failed with error -19

# Error -19 = -ENODEV (no such device)
# Check if driver is loaded
lsmod | grep nvme
# (empty)

# Load the driver
sudo modprobe nvme

# Check again
lsblk
# NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
# sda      8:0    0   50G  0 disk
# nvme0n1 259:0   0  477G  0 disk

# Check PCI
lspci | grep NVMe
# 02:00.0 Non-Volatile memory controller: Samsung Electronics ...
```

---

## Assessment

**Lab task (20 min):**

1. List all PCI and USB devices
2. Examine dmesg for hardware events
3. Load and unload a kernel module
4. Examine /sys for device information
5. Check interrupt distribution across CPUs

**Grading:**
- Devices listed: 15%
- dmesg examined: 20%
- Module loaded/unloaded: 25%
- /sys examined: 20%
- Interrupts checked: 20%

---

## Evidence

- **OutcomeEvidence:** `INT-LO8 — Device Drivers & Hardware`

---

## Unlock

Module9 — Performance Profiling. You know how hardware works. Now you learn how to measure and optimize.
