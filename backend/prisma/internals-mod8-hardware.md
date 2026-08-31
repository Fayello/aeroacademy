# Module 8 — Device Drivers and Hardware

## How Linux Talks to Hardware

The Linux kernel's device driver subsystem is the bridge between software and hardware. Every disk, network card, USB device, and GPU communicates through a driver. Understanding how drivers work is essential for diagnosing hardware detection issues, optimizing device performance, and writing custom drivers.

This module covers the device model, device file types, udev device management, and the major hardware subsystems.

## Device Files: The Interface

Linux represents hardware devices as files in `/dev/`. This is the Unix philosophy: "everything is a file." Programs interact with devices using standard file operations: `open()`, `read()`, `write()`, `ioctl()`.

### Character Devices

Character devices transfer data one byte at a time in a sequential stream. They do not support random access. Examples: terminals, serial ports, keyboards, mice.

```bash
# List character devices
ls -la /dev/tty*
ls -la /dev/input/

# Character devices have a 'c' in the first column of ls -l
crw-rw-rw- 1 root root 5, 1 ... /dev/console
crw-rw-rw- 1 root root 1, 3 ... /dev/null
crw-rw-rw- 1 root root 1, 5 ... /dev/zero
crw-rw-rw- 1 root root 1, 8 ... /dev/random
crw-rw-rw- 1 root root 1, 9 ... /dev/urandom
```

The numbers `5,1` are the major and minor device numbers. The major number identifies the driver, and the minor number identifies the specific device managed by that driver.

### Block Devices

Block devices transfer data in fixed-size blocks. They support random access and caching. Examples: hard drives, SSDs, USB storage.

```bash
# List block devices
ls -la /dev/sd*
ls -la /dev/nvme*

# Block devices have a 'b' in the first column
brw-rw---- 1 root disk 8, 0 ... /dev/sda
brw-rw---- 1 root disk 8, 1 ... /dev/sda1
brw-rw---- 1 root disk 8, 2 ... /dev/sda2
```

### Special Device Files

Linux provides several virtual devices with unique behavior:

```bash
# /dev/null — Discards all data written to it
echo "data" > /dev/null    # Gone forever

# /dev/zero — Provides infinite stream of zeros
dd if=/dev/zero of=/tmp/zeros bs=1M count=100

# /dev/random — High-quality random data (blocks when entropy is low)
head -c 32 /dev/random | xxd

# /dev/urandom — Fast random data (never blocks, slightly lower quality)
head -c 32 /dev/urandom | xxd

# /dev/full — Always returns "no space left on device"
echo "data" > /dev/full
# bash: echo: write error: No space left on device

# /dev/tty — Current controlling terminal
echo "hello" > /dev/tty   # Appears on terminal

# /dev/loop — Loop devices (mount files as block devices)
losetup -f /tmp/disk.img
mount /dev/loop0 /mnt
```

### Network Devices

Network devices are not represented as files in `/dev/`. They are accessed through the socket API and appear as interfaces:

```bash
# List network devices
ip link show
ls /sys/class/net/

# View device statistics
cat /sys/class/net/eth0/statistics/rx_bytes
cat /sys/class/net/eth0/statistics/tx_bytes
ethtool -S eth0
```

### Device Number Management

```bash
# Find the major/minor number of a device
ls -la /dev/sda
# brw-rw---- 1 root disk 8, 0 ... /dev/sda
# Major: 8, Minor: 0

# Find which driver handles a device
cat /sys/block/sda/device/../driver/module/drivers/block:block:sda/module/drivers
# or
lspci -k    # For PCI devices
lsusb -v    # For USB devices

# Find all devices using a specific driver
ls /sys/bus/pci/drivers/ahci/
# 0000:00:1f.2  bind  module  new_id  remove_id  uevent  unbind
```

## udev: Dynamic Device Management

udev is the device manager for the Linux kernel. It dynamically creates and removes device nodes in `/dev/` based on kernel events.

### How udev Works

1. The kernel detects a hardware event (device plugged in, driver loaded)
2. The kernel sends a uevent to udev via netlink
3. udev reads the uevent and applies rules from `/etc/udev/rules.d/` and `/lib/udev/rules.d/`
4. udev creates device nodes, symlinks, and runs custom scripts

```bash
# Monitor udev events in real-time
udevadm monitor
# UDEV  [12345.678] add   /devices/pci0000:00/0000:00:14.0/usb1/1-1 (bus)
#   KERNEL[12345.678] add   /devices/pci0000:00/0000:00:14.0/usb1/1-1
#   UDEV  [12345.679] add   /devices/pci0000:00/0000:00:14.0/usb1/1-1 (device)

# Trigger udev to process all devices
udevadm trigger

# Reload udev rules
udevadm control --reload-rules
```

### udev Rules

udev rules define how device nodes are named and what actions are taken:

```bash
# /etc/udev/rules.d/99-custom.rules

# Name a specific USB device
SUBSYSTEM=="usb", ATTR{idVendor}=="1234", ATTR{idProduct}=="5678", SYMLINK+="mydevice"

# Set permissions on network interfaces
SUBSYSTEM=="net", ACTION=="add", DRIVERS=="?*", ATTR{type}=="1", KERNEL=="wlan*", GROUP="netdev", MODE="0660"

# Run a script when a USB drive is plugged in
SUBSYSTEM=="block", ACTION=="add", ENV{ID_FS_USAGE}=="filesystem", RUN+="/usr/local/bin/usb-mount.sh"

# Set scheduler for NVMe drives
ACTION=="add|change", KERNEL=="nvme[0-9]*", ATTR{queue/scheduler}="none"

# Create persistent network interface names
SUBSYSTEM=="net", ACTION=="add", DRIVERS=="?*", ATTR{address}=="aa:bb:cc:dd:ee:ff", NAME="fastnic"
```

### udevadm Query

```bash
# Query device information
udevadm info -a -n /dev/sda
# Looking at device '/devices/pci0000:00/0000:00:1f.2/ata1/host0/target0:0:0/0:0:0:0/block/sda':
#   KERNEL=="sda"
#   SUBSYSTEM=="block"
#   DRIVER==""
#   ATTR{ro}=="0"
#   ATTR{size}=="976773168"
#   ATTR{ HOLDERS}=="sda2"
#   ATTR{partition}=="2"

# Query by path
udevadm info -a -p /sys/block/sda

# Trigger rules for a specific device
udevadm trigger -s block -a add
```

## PCI Subsystem

PCI (Peripheral Component Interconnect) is the bus used for most internal devices: network cards, storage controllers, GPUs, USB controllers.

### PCI Device Enumeration

```bash
# List all PCI devices
lspci
# 00:00.0 Host bridge: Intel Corporation Xeon E3-1200 v5 Host Bridge
# 00:02.0 VGA compatible controller: Intel Corporation HD Graphics 530
# 00:1f.0 ISA bridge: Intel Corporation C610/X99 Chipset LPC Controller
# 00:1f.2 RAID bus controller: Intel Corporation C610/X99 Chipset SATA RAID

# Detailed information about a device
lspci -v -s 00:1f.2
# 00:1f.2 RAID bus controller: Intel Corporation C610/X99 Chipset SATA RAID
#   Region 0: I/O ports at f060 [size=32]
#   Region 1: Memory at df530000 [size=2048]
#   Region 2: I/O ports at f040 [size=32]
#   Region 3: Memory at df510000 [size=512]
#   Region 4: Memory at df500000 [size=256]
#   Kernel driver in use: ahci
#   Kernel modules: ahci

# Show kernel driver and module
lspci -k
# 00:1f.2 RAID bus controller: Intel Corporation C610/X99 Chipset SATA RAID
#         Subsystem: Intel Corporation C610/X99 Chipset SATA RAID
#         Kernel driver in use: ahci
#         Kernel modules: ahci

# View raw PCI config space
setpci -s 00:1f.2 CAPABILITY_POINTER
# 88
lspci -s 00:1f.2 -x
# 00: 86 80 82 28 07 04 10 02 03 06 04 01 00 00 00 00
```

### PCI Driver Binding

```bash
# Bind a device to a specific driver
echo "0000:00:1f.2" > /sys/bus/pci/drivers/ahci/bind

# Unbind a device
echo "0000:00:1f.2" > /sys/bus/pci/drivers/ahci/unbind

# Bind to a different driver (e.g., vfio-pci for PCI passthrough)
echo "0000:01:00.0" > /sys/bus/pci/drivers/vfio-pci/bind
```

## USB Subsystem

USB devices are enumerated when plugged in and managed by the USB core:

```bash
# List USB devices
lsusb
# Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
# Bus 001 Device 002: ID 8087:0024 Intel Corp. Integrated Hub
# Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub

# Detailed information
lsusb -v -d 046d:c077

# View USB device attributes
cat /sys/bus/usb/devices/1-1/idVendor
cat /sys/bus/usb/devices/1-1/product
cat /sys/bus/usb/devices/1-1/speed

# Monitor USB events
udevadm monitor --subsystem-match=usb
```

### USB Power Management

```bash
# Prevent USB auto-suspend (for critical devices)
echo -1 > /sys/bus/usb/devices/1-1/power/autosuspend

# Set USB autosuspend delay
echo 5 > /sys/bus/usb/devices/1-1/power/autosuspend_delay_ms

# View USB power state
cat /sys/bus/usb/devices/1-1/power/runtime_status
# active / suspended / unsupported
```

## Interrupts: Hardirq, Softirq, Tasklets

When a hardware device needs attention (data arrived, transfer complete, error occurred), it sends an interrupt to the CPU. The kernel handles interrupts through several mechanisms.

### Hardirqs (Hardware Interrupts)

A hardirq is the immediate response to a hardware interrupt. It runs with interrupts disabled on the current CPU and must be fast:

```bash
# View interrupt counts
cat /proc/interrupts
#            CPU0       CPU1       CPU2       CPU3
#  23:     123456          0          0          0  PCI-MSI-edge    eth0
#  42:          0          0     987654          0  PCI-MSI-edge    nvme0
#  43:          0          0          0     456789  PCI-MSI-edge    nvme1

# View softirq counts
cat /proc/softirqs
#                    CPU0       CPU1       CPU2       CPU3
#          HI:          0          0          0          0
#       TIMER:    1234567    1234567    1234567    1234567
#      NET_TX:      12345      12345      12345      12345
#      NET_RX:     456789     456789     456789     456789
#       BLOCK:     234567     234567     234567     234567
#    IRQ POLL:          0          0          0          0
#     TASKLET:      12345      12345      12345      12345
#       SCHED:     678901     678901     678901     678901
#     HRTIMER:          0          0          0          0
#         RCU:     345678     345678     345678     345678
```

### Softirqs

Softirqs are deferred interrupt handling. They run with interrupts enabled and handle work that can tolerate slight delays:

- **NET_TX / NET_RX**: Network packet transmission/reception
- **BLOCK**: Block device I/O completion
- **TIMER**: Timer callbacks
- **SCHED**: Process scheduler
- **RCU**: Read-Copy-Update synchronization

```bash
# Monitor softirq activity
watch -d -n 1 cat /proc/softirqs

# Softirq processing time per CPU
cat /proc/net/softnet_stat
# Each line is one CPU, columns are:
# processed, dropped, time_squeeze, ...
```

### Tasklets

Tasklets are built on top of softirqs. They provide a simpler API for deferred work:

- A tasklet runs on the same CPU it was scheduled on (unless it is already running on another CPU)
- Tasklets for the same CPU cannot run concurrently
- Different tasklets can run concurrently on different CPUs

### Interrupt Affinity

Modern systems support interrupt affinity — binding specific device interrupts to specific CPUs:

```bash
# View current IRQ affinity
cat /proc/irq/23/smp_affinity
# 1  (CPU 0)

# Set IRQ 23 to run on CPU 2
echo 4 > /proc/irq/23/smp_affinity  # 4 = binary 100 = CPU 2

# Use irqbalance for automatic distribution
systemctl enable irqbalance
irqbalance --oneshot

# Manual affinity for high-performance networking
# For a 10GbE NIC with multiple queues, distribute interrupts across CPUs
for i in $(seq 0 15); do
    echo $((1 << (i % 8))) > /proc/irq/$(grep "eth0-TxRx-$i" /proc/interrupts | awk '{print $1}' | tr -d ':')/smp_affinity
done

# Verify distribution
watch -d -n 1 cat /proc/interrupts | grep eth0
```

### Interrupt Coalescing

Network adapters and storage controllers can batch interrupts to reduce overhead:

```bash
# View and set NIC interrupt coalescing
ethtool -c eth0
# Coalesce parameters for eth0:
# Adaptive RX: on  TX: on
# stats-block-usecs: 0
# packet-usecs: 0
# sample-interval: 0
# tx-usecs: 3
# tx-frames: 128
# rx-usecs: 3
# rx-frames: 128

# Set custom coalescing (reduce latency, increase CPU usage)
ethtool -C eth0 rx-usecs 0 rx-frames 0 tx-usecs 0 tx-frames 0

# Or increase batching (reduce CPU usage, increase latency)
ethtool -C eth0 rx-usecs 100 rx-frames 128
```

### IRQ Balance for NUMA

On NUMA systems, interrupt affinity matters even more. An interrupt handled by a CPU on node 0 that processes data on node 1 incurs extra latency:

```bash
# Find NIC NUMA node
cat /sys/class/net/eth0/device/numa_node
# 0  (NIC is on NUMA node 0)

# Set interrupt affinity to CPUs on the same NUMA node
# If CPUs 0-7 are on node 0:
echo 1 > /proc/irq/23/smp_affinity    # CPU 0
echo 2 > /proc/irq/24/smp_affinity    # CPU 1
echo 4 > /proc/irq/25/smp_affinity    # CPU 2
```

## DMA and Memory-Mapped I/O

## DMA and Memory-Mapped I/O

### DMA (Direct Memory Access)

DMA allows devices to transfer data directly to/from memory without CPU involvement. The CPU sets up the DMA transfer and the device does the work:

```bash
# View DMA mappings
cat /proc/dma
#  4: cascade

# View DMA allocations (kernel debug)
cat /sys/kernel/debug/dma/dma_buf/bufinfo

# Check IOMMU groups (important for DMA safety and PCI passthrough)
ls /sys/kernel/iommu_groups/
lspci -vv | grep "IOMMU group"
```

### Memory-Mapped I/O (MMIO)

MMIO maps device registers into the CPU's address space. The CPU reads and writes device registers using regular memory instructions:

```bash
# View memory-mapped regions of PCI devices
lspci -v | grep -A 10 "Region 0"
# Region 0: Memory at df530000 (32-bit, non-prefetchable) [size=2K]
# Region 1: Memory at df510000 (32-bit, non-prefetchable) [size=512]

# View I/O ports
lspci -v | grep "I/O ports"
# I/O ports at f060 [size=32]

# View the memory map
cat /proc/iomem | head -20
# 00000000-00000fff : reserved
# 00001000-0009fbff : System RAM
# 00100000-bfffffff : System RAM
# df400000-df5fffff : PCI Bus 0000:04
#   df400000-df40ffff : nvme 0000:04:00.0
#   df500000-df5003ff : ahci 0000:00:1f.2

# Check if MMIO regions are accessible
lspci -v -s 04:00.0 | grep Memory
# Region 0: Memory at df400000 (64-bit, non-prefetchable) [size=16M]
# Region 3: Memory at df500000 (64-bit, non-prefetchable) [size=256K]

# View PCI BAR (Base Address Register) information
lspci -x -s 04:00.0
# 04: 86 80 08 a8 07 04 10 00 00 02 08 01 00 00 00 00
# 10: 04 00 40 df 00 00 00 00 00 00 00 00 00 00 00 00
# 20: 00 00 00 00 00 00 00 00 00 00 00 00 86 14 08 a8
# BAR0: 0xdf400000 (64-bit, prefetchable)
```

## SCSI Subsystem

SCSI (Small Computer System Interface) is not just a parallel bus — it is a command protocol used by SATA, SAS, USB storage, and virtual disks:

```bash
# View SCSI devices
lsscsi
# [0:0:0:0]    disk    ATA      Samsung SSD 860  2B6Q  /dev/sda
# [1:0:0:0]    disk    NVMe     Samsung 970 EVO  2B6Q  /dev/nvme0n1

# View SCSI host adapters
lsscsi -H
# [0]    ata_piix
# [1]    nvme
# [2]    usb-storage

# SCSI error recovery
echo 1 > /sys/block/sda/device/timeout  # Set timeout to 1 second
echo 3 > /sys/block/sda/device/rescan   # Rescan the bus

# SCSI queue depth (how many commands the device can handle)
cat /sys/block/sda/device/queue_depth
# 32

# Increase queue depth for better throughput
echo 64 > /sys/block/sda/device/queue_depth

# SCSI mid-level debugging
echo 0x800 > /sys/module/scsi_mod/parameters/scsi_logging_level
# 0x800 = full SCSI logging
dmesg | grep -i "scsi"
```

### Hardware Monitoring

The kernel exposes hardware sensor data through the `hwmon` subsystem:

```bash
# View hardware sensors
sensors
# coretemp-isa-0000
# Adapter: ISA adapter
# Core 0:       +45.0°C  (high = +80.0°C, crit = +100.0°C)
# Core 1:       +43.0°C  (high = +80.0°C, crit = +100.0°C)

# nvme-pci-01:00
# Adapter: PCI adapter
# Composite:    +38.0°C  (low  = -20.1°C, high = +83.8°C)

# View raw hwmon data
ls /sys/class/hwmon/
cat /sys/class/hwmon/hwmon0/temp1_input
# 45000  (45.0°C in millidegrees)

# IPMI for remote hardware monitoring
ipmitool sensor list
ipmitool sdr list
ipmitool sel list   # System Event Log
```

### Power Management

```bash
# View CPU frequency scaling
cpupower frequency-info
# current policy: frequency should be between 800 MHz and 3.40 GHz

# Set performance governor (maximum frequency)
cpupower frequency-set -g performance

# Set powersave governor (minimum frequency)
cpupower frequency-set -g powersave

# View C-states (CPU sleep states)
cat /sys/devices/system/cpu/cpu0/cpuidle/state*/name
# POLL  C1  C1E  C3  C6

# Disable deep C-states for low-latency applications
for state in /sys/devices/system/cpu/cpu0/cpuidle/state*; do
    echo 1 > "$state/disable"
done
```

## Real Scenario: Troubleshooting a Hardware Detection Issue

### The Problem

A new NVMe SSD was installed in a production server but was not detected by the operating system. The BIOS recognized the drive, but `lsblk` and `lspci` did not show it.

### Investigation

```bash
# Step 1: Check if the device appears in PCI
lspci | grep -i nvme
# No output — the device is not being enumerated by the kernel

# Step 2: Check kernel messages for errors
dmesg | grep -i nvme
# [0.000000] NVMe: updating nvme kernel parameters
# No further NVMe messages — the driver is not finding the device

# Step 3: Check if the NVMe module is loaded
lsmod | grep nvme
# nvme                  45056  0
# nvme_core            122880  1 nvme
# The modules are loaded

# Step 4: Check PCI bus for unclaimed devices
lspci -vnn | grep -A 10 "Non-Volatile"
# 04:00.0 Non-Volatile memory controller [0108]: Samsung Electronics Co Ltd NVMe SSD Controller PM981a/PM9A1 [144d:a808]
#         Subsystem: Samsung Electronics Co Ltd NVMe SSD Controller PM981a/PM9A1 [144d:a808]
#         Control: I/O- Mem+ BusMaster+ SpecCycle- MemWINV- ...
#         Status: Cap+ 66MHz- UDF- FastB2B- ParErr- DEVSEL=fast >TAbort- <TAbort- <MAbort- >SERR- <PERR-
#         Region 0: Memory at df400000 (64-bit, non-prefetchable) [size=16M]
#         Kernel driver in use: none  ← Device is not bound to a driver!

# Step 5: Check why nvme driver is not binding
# The NVMe kernel driver might be too old for this device
modinfo nvme | grep version
# version:        1.0
# vermagic:       5.4.0-generic

# The Samsung PM9A1 requires NVMe 1.4+ features
# Our kernel is too old (5.4.0)
```

### Root Cause

The server was running Ubuntu 20.04 with kernel 5.4.0, which has an NVMe driver version 1.0. The Samsung PM9A1 SSD requires NVMe specification 1.4+ features that are only available in kernel 5.10+. The PCI device was visible in the config space (BIOS saw it), but the kernel's NVMe driver refused to bind because it could not support the device's feature set.

### Resolution

```bash
# Option 1: Upgrade the kernel (preferred)
apt install linux-generic-hwe-20.04  # Gets kernel 5.15 from HWE stack
# or
apt install linux-generic-hwe-20.04-edge  # Gets latest available

# Reboot into the new kernel
reboot

# After reboot:
lspci | grep -i nvme
# 04:00.0 Non-Volatile memory controller: Samsung Electronics Co Ltd NVMe SSD Controller PM981a/PM9A1

lsblk
# NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
# nvme0n1 259:0    0 953.9G  0 disk

# Option 2: Install vendor driver (temporary workaround)
# Samsung provides a standalone NVMe driver
# apt install samsung-nvme-driver
# This is not recommended for production

# Option 3: Bind manually (if driver exists but does not auto-bind)
echo "144d a808" > /sys/bus/pci/drivers/nvme/new_id
echo "0000:04:00.0" > /sys/bus/pci/drivers/nvme/bind
```

### Prevention

```bash
# Create a hardware compatibility check script
#!/bin/bash
echo "Checking PCI devices for driver binding..."
lspci -nn | while read line; do
    if echo "$line" | grep -q "Kernel driver in use: (none)"; then
        echo "UNBOUND: $line"
    fi
done

# Check NVMe health after detection
nvme smart-log /dev/nvme0n1
nvme id-ctrl /dev/nvme0n1
```

### Additional Hardware Debugging Commands

```bash
# List all hardware with kernel driver information
lspci -k

# Check for hardware errors in kernel log
dmesg | grep -iE "error|fault|fail|warn"

# View PCI resource allocations
cat /proc/ioports
cat /proc/iomem

# Check IOMMU groups (important for PCI passthrough in VMs)
for d in /sys/kernel/iommu_groups/*/devices/*; do
    echo "IOMMU Group $(basename $(dirname $(dirname $d))): $(lspci -nns ${d##*/})"
done

# USB device power consumption
cat /sys/bus/usb/devices/*/power/runtime_usage
cat /sys/bus/usb/devices/*/product

# Check device tree (ARM and embedded systems)
ls /proc/device-tree/
ls /proc/device-tree/soc/

# View kernel command line for hardware parameters
cat /proc/cmdline
# Look for: numa=off, pci=nomsi, acpi=off, etc.

# Hardware-specific kernel modules
lsmod | grep -E "ahci|nvme|igb|ixgbe|e1000e"
# List modules for storage and network controllers
```

## Assessment

### Lab Task 1: Device File Analysis (20 minutes)

1. List all block devices and identify major/minor numbers
2. For each block device, find the corresponding sysfs entry
3. Identify which kernel driver handles each block device
4. View the device's queue parameters (scheduler, read-ahead, etc.)
5. Change the I/O scheduler for a device and verify the change

**Grading**: Correct device listing (20%), sysfs mapping (20%), driver identification (20%), scheduler change (20%), verification (20%)

### Lab Task 2: udev Rule Creation (25 minutes)

1. Create a udev rule that creates a symlink `/dev/myusb` when a specific USB device is plugged in
2. Test the rule by triggering a udev event
3. Create a rule that sets permissions on a network interface
4. Monitor udev events while a USB device is plugged/unplugged
5. Document the rule syntax and testing procedure

**Grading**: Correct rule syntax (30%), symlink creation (25%), permission setting (25%), documentation (20%)

### Lab Task 3: Interrupt Analysis (25 minutes)

1. View `/proc/interrupts` and identify the device with the highest interrupt count
2. Check the interrupt affinity for that device
3. Change the affinity to a different CPU
4. Generate load on the device and verify the interrupt count increases on the new CPU
5. Explain why interrupt affinity matters for performance

**Grading**: Correct interrupt identification (20%), affinity check (20%), affinity change (25%), load test (20%), explanation (15%)

### Lab Task 4: PCI Device Debugging (30 minutes)

1. Use `lspci -vnn` to find an unbound PCI device (or simulate one)
2. Identify the device's vendor and device ID
3. Find a compatible kernel driver using `modinfo` and `lspci -nn`
4. Bind the device to the driver manually
5. Verify the device is now functional
6. Document the entire debugging process

**Grading**: Device identification (20%), driver research (25%), manual binding (25%), verification (15%), documentation (15%)

## Evidence

### Hardware and Driver Understanding

Evidence of mastery includes:

- Reading `/proc/interrupts` and `/proc/softirqs` to understand interrupt distribution
- Using `lspci -k` to identify devices and their kernel drivers
- Creating udev rules for custom device naming and permissions
- Understanding DMA, MMIO, and how devices communicate with the CPU
- Troubleshooting hardware detection issues by examining dmesg, lspci, and sysfs
- Configuring interrupt affinity for performance optimization
- Understanding the SCSI subsystem and how different storage protocols map to SCSI commands

### Key Diagnostic Commands

| Command | Purpose |
|---------|---------|
| `lspci -vnn` | PCI device details with vendor/device IDs |
| `lsusb -v` | USB device details |
| `lsscsi` | SCSI/SATA/NVMe device list |
| `dmesg \| grep -i <device>` | Kernel messages about device |
| `udevadm monitor` | Real-time udev events |
| `udevadm info -a -n /dev/<device>` | Device attributes |
| `cat /proc/interrupts` | Interrupt counts per CPU |
| `cat /proc/ioports` | I/O port allocations |
| `cat /proc/iomem` | Memory-mapped I/O regions |
| `ethtool -S <iface>` | Network interface statistics |
| `smartctl -a /dev/sda` | S.M.A.R.T. disk health |
| `nvme smart-log /dev/nvme0n1` | NVMe health data |