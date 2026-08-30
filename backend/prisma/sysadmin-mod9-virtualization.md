# Module 9 — Virtualization

**Course:** Linux Systems Administration | **Path:** Linux Sysadmin (9 of 10) | **Status:** DRAFT → FACT_CHECK → TECHNICAL_REVIEW → PUBLISHED
**Estimated time:** 25 min | **Prerequisite:** Module 8 — Monitoring and Logging

---

## What You'll Actually Do

You need to run multiple isolated environments on one physical server. You'll set up KVM virtual machines, manage them with libvirt, and understand when to use VMs vs containers.

---

## KVM — Kernel-based Virtual Machine

KVM turns Linux into a hypervisor. Every modern Linux server has it.

**Check if KVM is available:**
```bash
grep -cE '(vmx|svm)' /proc/cpuinfo
# > 0 means hardware virtualization is available

lsmod | grep kvm
# kvm_intel  or  kvm_amd
```

---

## Creating VMs with virt-install

```bash
virt-install \
  --name web-server \
  --ram 2048 \
  --vcpus 2 \
  --disk path=/var/lib/libvirt/images/web-server.qcow2,size=20 \
  --os-variant ubuntu22.04 \
  --network bridge=virbr0 \
  --graphics vnc,listen=0.0.0.0 \
  --cdrom /var/lib/libvirt/images/ubuntu-22.04-server.iso \
  --boot cdrom,hd
```

---

## Managing VMs

```bash
# List VMs
virsh list --all

# Start/stop
virsh start web-server
virsh shutdown web-server
virsh destroy web-server    # force stop (like pulling the plug)

# Connect to console
virsh console web-server

# Resource limits
virsh setmem web-server 4096 --config
virsh setvcpus web-server 4 --config

# Snapshots
virsh snapshot-create web-server --name "clean-install"
virsh snapshot-revert web-server --snapshotname "clean-install"

# Delete
virsh undefine web-server --remove-all-storage
```

---

## Networking

**NAT (default):** VMs can reach the internet through the host. Host can reach VMs. VMs can't reach each other directly.

**Bridged:** VMs get IPs on the same network as the host. They're visible to other devices.

```bash
# Create bridge
virsh net-define-bridge.xml
virsh net-start production
virsh net-autostart production
```

---

## Templates and Cloud-Init

**Create a base template:**
```bash
# Install minimal Ubuntu
# Clean up
cloud-init clean
truncate -s 0 /etc/machine-id

# Convert to template
virt-sysprep -a /var/lib/libvirt/images/base-ubuntu.qcow2
```

**Deploy from template:**
```bash
virt-install \
  --name new-server \
  --memory 2048 \
  --vcpus 2 \
  --disk /var/lib/libvirt/images/new-server.qcow2,import \
  --cloud-init user-data=cloud-init.yaml
```

---

## VMs vs Containers

| Feature | VM | Container |
|---------|-----|-----------|
| Isolation | Full OS | Process-level |
| Startup | Minutes | Seconds |
| Resource | Heavy (dedicated RAM/CPU) | Light (shared kernel) |
| Security | Stronger isolation | Weaker (shared kernel) |
| Use case | Different OS, strong isolation | Microservices, CI/CD |

**Rule of thumb:** Containers for applications, VMs for environments.

---

## Real Task: Deploy a VM Farm

```bash
# 1. Create base template
virt-install --name base-ubuntu --ram 2048 --vcpus 2 \
  --disk /var/lib/libvirt/images/base.qcow2,size=20 \
  --os-variant ubuntu22.04 --cdrom ubuntu-22.04.iso

# 2. Sysprep the template
virsh destroy base-ubuntu
virt-sysprep -a /var/lib/libvirt/images/base.qcow2

# 3. Deploy3 VMs from template
for i in 1 2 3; do
  qemu-img create -f qcow2 -b /var/lib/libvirt/images/base.qcow2 \
    -F qcow2 /var/lib/libvirt/images/web-${i}.qcow2
  virt-install --name web-${i} --memory 2048 --vcpus 2 \
    --disk /var/lib/libvirt/images/web-${i}.qcow2 \
    --import --noautoconsole
done

# 4. Verify
virsh list --all
```

---

## Assessment

**Lab task (20 min):**

1. Check if KVM is available
2. Create a VM with virt-install
3. Manage the VM (start, stop, snapshot, revert)
4. Set up networking (NAT and bridged)
5. Create a template and deploy from it
6. Compare VMs and containers — when to use each

**Grading:**
- KVM available: 10%
- VM created: 25%
- Management working: 20%
- Networking configured: 20%
- Template deployed: 15%
- Comparison documented: 10%

---

## Evidence

- **OutcomeEvidence:** `SYS-LO9 — Virtualization`
- **Mastery:** `UserSkill: linux-virtualization`

---

## Unlock

Module10 — Automation with Ansible. You can virtualize. Now you learn how to automate across all of them.

---

## Sources

- `man virsh`, `man virt-install`, `man virt-sysprep`
- libvirt documentation

---

## AI Provenance

- **Draft:** LLM (2025-08-31)
- **Voice:** Engineer who's managed VM farms in production
- **Status:** DRAFT → FACT_CHECK ✓ → TECHNICAL_REVIEW → PUBLISHED
