# Module 9 — Virtualization

Virtualization lets you run multiple isolated operating systems on a single physical server. For sysadmins, it means you can spin up test environments in minutes, isolate workloads for security, and maximize hardware utilization. This module covers KVM/QEMU fundamentals, libvirt management, VM templates with cloud-init, nested virtualization, and GPU passthrough. You will learn to set up a virtualization host that can run production workloads efficiently.

## KVM and QEMU Fundamentals

KVM (Kernel-based Virtual Machine) turns the Linux kernel into a hypervisor. QEMU provides the hardware emulation layer. Together they create fully virtualized machines that run unmodified operating systems. KVM requires hardware virtualization extensions: Intel VT-x or AMD-V. Check with `grep -E "(vmx|svm)" /proc/cpuinfo` and verify the kvm modules are loaded with `lsmod | grep kvm`.

Install KVM and management tools with the appropriate packages for your distribution. On RHEL/CentOS, use `dnf install qemu-kvm libvirt virt-install virt-manager`. On Debian/Ubuntu, use `apt install qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils virtinst virt-manager`. Enable and start libvirtd with `systemctl enable --now libvirtd`. Verify with `virsh list --all` and `virsh nodeinfo`.

### Understanding KVM Architecture

KVM runs as a kernel module that provides the virtualization extensions. QEMU provides the userspace component that emulates hardware devices. libvirt sits on top as a management layer that provides a consistent API across different hypervisors. When you create a VM with virt-install, it talks to libvirtd which orchestrates QEMU processes with KVM acceleration.

The key insight is that each VM is just a QEMU process running on the host. You can see them with `ps aux | grep qemu`. Each VM has its own virtual CPUs, memory, disk, and network interfaces. The host kernel schedules VM vCPUs alongside regular processes using the Completely Fair Scheduler (CFS).

## Creating Virtual Machines

### virt-install

The command-line tool for creating VMs. Key parameters include `--name` for the VM name, `--ram` for memory in MB, `--vcpus` for virtual CPUs, `--disk` for the disk image path and size, `--os-variant` for OS optimization (run `osinfo-query os` to list), `--network` for network connection, `--graphics` for display method (VNC or SPICE), `--cdrom` for installation ISO, and `--noautoconsole` to run in background.

The `--os-variant` flag is important because it tells libvirt which virtual hardware to present to the guest. Using the correct variant ensures optimal driver support and performance inside the VM.

### Creating a VM from a Cloud Image

Faster than ISO installation for servers. Download a cloud image (Ubuntu, CentOS, Debian all provide qcow2 images), import as a VM disk with `qemu-img convert`, and create the VM using the `--import` flag to skip the installation process. This boots directly from the cloud image.

Cloud images come with cloud-init pre-installed. On first boot, cloud-init reads metadata from the cloud provider or from a seed ISO to customize the VM with hostname, SSH keys, packages, and startup commands.

### Managing Disk Images

qcow2 is the recommended disk format for most use cases. It supports snapshots, thin provisioning, and compression. Use `qemu-img info` to inspect disk images, `qemu-img resize` to grow them, and `qemu-img snapshot` to create inline snapshots. Raw images offer slightly better performance but lack these features.

For production workloads, consider using LVM volumes instead of disk image files. LVM provides better performance, snapshot capabilities, and easier management. Create a logical volume and point the VM directly at it: `--disk /dev/data-vg/vm-disk`.

## libvirt Management

### virsh: The Command-Line Interface

virsh is the primary tool for managing VMs. Key operations: `list` and `list --all` for listing VMs, `start`/`stop`/`restart` for lifecycle management, `shutdown` for graceful shutdown (sends ACPI signal), `destroy` for force stop (like pulling the power cord), `reboot` for restart, `autostart` for boot-time startup, `console` for serial console access, `dominfo` for details, `edit` for configuration changes, and `undefine --remove-all-storage` for deletion.

### Resource Management

Change memory with `virsh setmem VMNAME SIZE --config` (next boot) or `--live` (immediate). Change vCPUs with `virsh setvcpus`. Attach disks with `virsh attach-disk` specifying the disk image, target device, and `--persistent` for permanent attachment. Attach network interfaces with `virsh attach-interface`.

### Snapshots

Take snapshots with `virsh snapshot-create-as` specifying name and description. List with `virsh snapshot-list`. Revert with `virsh snapshot-revert`. Delete with `virsh snapshot-delete`. Snapshots capture the complete VM state including disk and memory (if running). Use them before major changes like software upgrades or configuration modifications.

### Networking

List virtual networks with `virsh net-list --all`. Create NAT networks for VM internet access, isolated networks for internal VM-to-VM communication, and bridged networks for direct physical network access. Configure DHCP ranges within networks. Start and autostart networks with `virsh net-start` and `virsh net-autostart`.

### Storage

List storage pools with `virsh pool-list --all`. Create directory-based pools with `virsh pool-define-as`, build and start them, and autostart for persistence. Create disk images with `virsh vol-create-as` specifying name, size, and format. List volumes with `virsh vol-list`.

## VM Templates and Cloud-Init

### Building a Base Template

Create a gold image that serves as the starting point for all new VMs. Start with a cloud image, resize the disk with `qemu-img resize`, install guest agent and baseline packages with `virt-customize`, enable the guest agent, set the hostname, inject SSH keys, and relabel SELinux contexts.

The template approach ensures consistency across VMs. Every VM starts from the same baseline with the same packages, configurations, and security settings. Update the template periodically to incorporate security patches and new versions.

### cloud-init Configuration

cloud-init runs on first boot to customize the VM. It can set the hostname, manage `/etc/hosts`, create users with SSH keys and sudo access, install packages, write configuration files, and run commands. The configuration uses YAML format with the `#cloud-config` header.

Key cloud-init modules: `users` for creating user accounts, `ssh_authorized_keys` for SSH key injection, `packages` for package installation, `write_files` for creating files, `runcmd` for running commands, and `bootcmd` for early boot commands.

### Creating VMs from Templates

Clone the template with `virt-clone`, apply cloud-init by generating a seed ISO with `cloud-localds` and attaching it as a CD-ROM. Automate deployment with scripts that generate cloud-init configs for each VM, create seed ISOs, clone templates, configure resources, and start VMs.

## Nested Virtualization

Running VMs inside VMs. Useful for testing KVM in VMs, running OpenStack dev environments, or CI/CD pipelines that need VMs. Enable nested virtualization by loading the KVM module with `nested=1` parameter, making it persistent with a modprobe.d configuration, enabling in libvirt by adding the vmx feature requirement to the CPU configuration, and verifying with `grep -E "(vmx|svm)" /proc/cpuinfo` inside the nested VM.

### Performance Considerations

Nested virtualization adds significant overhead. Each level of nesting adds VM exit/entry overhead. For testing and development, this is acceptable. For production workloads, avoid nesting deeper than one level. Monitor performance metrics inside nested VMs to ensure they meet requirements.

## GPU Passthrough

Dedicated GPU access for VMs requiring GPU compute like machine learning, video processing, or gaming. Requires CPU with VT-d (Intel) or AMD-Vi (AMD), IOMMU enabled in BIOS/UEFI, and a compatible GPU.

### Setup Process

1. Enable IOMMU in BIOS and add kernel parameters (`intel_iommu=on iommu=pt` for Intel, `amd_iommu=on iommu=pt` for AMD)
2. Verify IOMMU is working with `dmesg | grep -i iommu`
3. Identify the GPU PCI address with `lspci -nn | grep -i nvidia`
4. Blacklist the nvidia driver on the host
5. Bind the GPU to the VFIO driver with `vfio-pci`
6. Verify binding with `lspci -nnk -d 10de:xxxx` showing "Kernel driver in use: vfio-pci"
7. Attach the GPU to the VM with `virsh hostdev` or `virsh attach-device`

### Hiding KVM from the Guest

NVIDIA consumer GPUs may detect virtualization and refuse to work. Hide the KVM signature by adding hyperv vendor_id and kvm hidden state to the VM XML configuration. This makes the guest see a bare-metal environment.

## Practical Assessment

**Lab Task:** Virtualization host setup (60 minutes)

1. Verify KVM support is enabled on the host
2. Create a storage pool and a 20 GB disk image
3. Install a VM from an ISO image
4. Clone a VM using virt-clone
5. Create a VM template with cloud-init configuration
6. Deploy 3 VMs from the template automatically
7. Manage VM resources: change memory and vCPU count
8. Take a snapshot before and after a software installation
9. Revert to the pre-install snapshot
10. Create an isolated network and connect two VMs to it
11. Verify VMs on the isolated network can communicate with each other
12. Document the complete virtualization host configuration

**Grading criteria:** KVM verified and working (5 points), storage pool created and disk image allocated (10 points), VM installed from ISO successfully (15 points), VM cloned with virt-clone (10 points), cloud-init template created and 3 VMs deployed (20 points), resource management demonstrated (10 points), snapshot creation and revert working (10 points), isolated network with VM-to-VM communication (15 points), documentation complete (5 points).

## VM Performance Optimization

### CPU Pinning

Pin VM vCPUs to specific physical CPUs to reduce context switching and improve cache locality. Edit the VM XML with `virsh edit` and add `<vcpupin>` elements mapping vCPUs to pCPUs. Use `lscpu` to identify physical CPU cores and their NUMA nodes.

### NUMA Awareness

For multi-socket servers, configure NUMA topology in the VM to match the physical NUMA layout. This ensures memory allocations stay on the same NUMA node as the vCPUs, reducing memory access latency. Set `<numatune>` and `<numa>` elements in the VM XML.

### Memory Ballooning

Use virtio balloon drivers to dynamically adjust VM memory. The host can reclaim unused memory from VMs and allocate it to others. Configure `<memballoon>` in the VM XML. Monitor balloon usage with `virsh domstats`.

### Virtio Drivers

Use virtio for network and disk devices for best performance. Virtio is paravirtualized, meaning the guest OS is aware it is virtualized and can optimize accordingly. Install virtio drivers in the guest: `apt install virtio-linux` on Debian/Ubuntu, or they are included in modern kernel defaults.

### virtio-scsi

For storage-heavy workloads, use virtio-scsi instead of virtio-blk. It supports TRIM, handles many devices better, and provides SCSI commands. Add a SCSI controller and use `bus=scsi` for disks.

## VM Backup Strategies

### File-Level Backup

Install backup agents inside VMs just like physical servers. This works but requires agents in every VM and doesn't capture VM state.

### Image-Level Backup

Back up the entire VM disk image. Use `virsh dumpxml` to save VM configuration, then `cp` or `rsync` the disk image. For live backups, create a snapshot first, back up the snapshot, then remove it.

### Using LVM Snapshots for VM Backup

If VM disks are on LVM volumes (recommended), create LVM snapshots for consistent backups without pausing the VM. This is the same technique used for database backups.

## VM Migration

### Live Migration

Move running VMs between hosts without downtime. Requires shared storage (NFS, iSCSI, or Ceph) accessible from both hosts. Command: `virsh migrate --live vmname qemu+ssh://destination-host/system`. Monitor migration progress in virsh console.

### Offline Migration

Shut down the VM, copy the disk image and configuration to the destination, then start it. Use `virsh dumpxml` to export configuration and `virsh define` on the destination to import.

## Security Considerations for Virtualization

### VM Isolation

VMs should be as isolated from the host as possible. Use dedicated VLANs for VM traffic. Do not share filesystems between host and guest. Use `ReadOnly` and `ReadOnlyPath` in libvirt for host directories that VMs don't need to write.

### VM Escape Prevention

VM escape is when code inside a VM breaks out to the host. KVM/QEMU has a strong security record but keep hypervisor packages updated. Apply security patches promptly. Use SELinux or AppArmor with libvirt for mandatory access control.

### Resource Denial Prevention

A malicious or misbehaving VM can consume all host resources. Apply CPU, memory, I/O, and network limits to every VM. Use cgroups (via systemd) for additional resource control. Monitor host resource usage and set alerts for high utilization.

## Practical Assessment

**Lab Task:** Virtualization host setup (60 minutes)

1. Verify KVM support is enabled on the host
2. Create a storage pool and a 20 GB disk image
3. Install a VM from an ISO image
4. Clone a VM using virt-clone
5. Create a VM template with cloud-init configuration
6. Deploy 3 VMs from the template automatically
7. Manage VM resources: change memory and vCPU count
8. Take a snapshot before and after a software installation
9. Revert to the pre-install snapshot
10. Create an isolated network and connect two VMs to it
11. Verify VMs on the isolated network can communicate with each other
12. Document the complete virtualization host configuration

**Grading criteria:** KVM verified and working (5 points), storage pool created and disk image allocated (10 points), VM installed from ISO successfully (15 points), VM cloned with virt-clone (10 points), cloud-init template created and 3 VMs deployed (20 points), resource management demonstrated (10 points), snapshot creation and revert working (10 points), isolated network with VM-to-VM communication (15 points), documentation complete (5 points).

## Troubleshooting Virtualization Issues

### VM Won't Start

Check libvirtd status with `systemctl status libvirtd`. Verify KVM modules loaded with `lsmod | grep kvm`. Check QEMU logs in `/var/log/libvirt/qemu/`. Verify disk images exist and are accessible. Check for port conflicts on VNC/SPICE displays.

### VM Performance Issues

Monitor host CPU and memory with `top` or `htop`. Check for CPU overcommitment with `virsh nodeinfo`. Verify KVM acceleration with `grep -E "(vmx|svm)" /proc/cpuinfo` inside the VM. Check I/O performance with `iostat`. Verify virtio drivers are installed in the guest.

### Network Connectivity Problems

Check virtual network status with `virsh net-list`. Verify bridge configuration with `brctl show` or `ip link show`. Check iptables rules for NAT and forwarding. Verify dnsmasq is running for DHCP. Test connectivity with `ping` from inside the VM.

### Disk Space Issues

Check storage pool usage with `virsh pool-info`. Monitor disk image sizes with `qemu-img info`. Use `virsh vol-list` to see all volumes. Clean up unused snapshots and old disk images. Consider moving to thin-provisioned storage for better space utilization.

## Practical Assessment

**Lab Task:** Virtualization host setup (60 minutes)

1. Verify KVM support is enabled on the host
2. Create a storage pool and a 20 GB disk image
3. Install a VM from an ISO image
4. Clone a VM using virt-clone
5. Create a VM template with cloud-init configuration
6. Deploy 3 VMs from the template automatically
7. Manage VM resources: change memory and vCPU count
8. Take a snapshot before and after a software installation
9. Revert to the pre-install snapshot
10. Create an isolated network and connect two VMs to it
11. Verify VMs on the isolated network can communicate with each other
12. Document the complete virtualization host configuration

**Grading criteria:** KVM verified and working (5 points), storage pool created and disk image allocated (10 points), VM installed from ISO successfully (15 points), VM cloned with virt-clone (10 points), cloud-init template created and 3 VMs deployed (20 points), resource management demonstrated (10 points), snapshot creation and revert working (10 points), isolated network with VM-to-VM communication (15 points), documentation complete (5 points).

## Evidence

Collect the following for your portfolio: output of `virsh list --all` showing all VMs, output of `virsh pool-list` and `virsh net-list`, cloud-init YAML configuration used for templates, screenshot of VMs communicating on isolated network, output of snapshot list and revert operation, and complete virtualization host documentation.
