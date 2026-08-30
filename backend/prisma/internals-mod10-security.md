# Module 10 — Kernel Security

**Course:** Linux Internals | **Path:** Linux Internals (10 of 10)

---

## What You'll Actually Do

A container escape happened. You need to understand how the kernel enforces security — capabilities, seccomp, SELinux — and how to harden the kernel against attacks.

---

## Capabilities — Fine-Grained Privileges

Linux splits root into distinct capabilities. Instead of "all or nothing," a process gets specific powers.

```bash
# Check capabilities of a process
getpcaps 1234
# 1234: cap_net_bind_service,cap_net_raw,cap_sys_ptrace=eip

# Common capabilities
CAP_NET_BIND_SERVICE  — bind to ports <1024
CAP_SYS_PTRACE        — trace other processes
CAP_SYS_ADMIN         — mount, namespaces, etc.
CAP_NET_ADMIN          — network configuration
CAP_SYS_MODULE        — load kernel modules
CAP_DAC_OVERRIDE      — bypass file permissions

# Drop all capabilities except what's needed
capsh --drop=all --caps="cap_net_bind_service+eip" -- -c "nginx"

# Docker drops most capabilities by default
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE alpine
```

---

## seccomp — System Call Filtering

seccomp limits which system calls a process can make.

```bash
# Check seccomp status of a process
cat /proc/1234/status | grep Seccomp
# Seccomp:    2   (SECCOMP_MODE_FILTER)

# Docker uses seccomp by default
docker run --security-opt seccomp=profile.json alpine

# Example seccomp profile (allow only read/write/close)
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "syscalls": [
    { "names": ["read", "write", "close", "exit_group"], "action": "SCMP_ACT_ALLOW" }
  ]
}
```

---

## SELinux — Mandatory Access Control

SELinux labels every file, process, and port. Even root can't access files without the right label.

```bash
# Check SELinux status
getenforce
# Enforcing

# Check file context
ls -Z /var/www/html
# system_u:object_r:httpd_sys_content_t:s0 index.html

# Check process context
ps auxZ | grep nginx
# system_u:system_r:httpd_t:s0 nginx

# Restore contexts (after moving files)
restorecon -Rv /var/www/html

# Allow a port
semanage port -a -t http_port_t -p tcp 8080
```

---

## AppArmor — Path-Based MAC

```bash
# Check status
aa-status

# Enforce a profile
aa-enforce /etc/apparmor.d/usr.sbin.nginx

# Complain mode (log but don't block)
aa-complain /etc/apparmor.d/usr.sbin.nginx
```

---

## Kernel Hardening

```bash
# ASLR (Address Space Layout Randomization)
cat /proc/sys/kernel/randomize_va_space
# 2 = full randomization (default)

# Restrict dmesg
cat /proc/sys/kernel/dmesg_restrict
# 1 = only root can read

# Restrict kernel pointer exposure
cat /proc/sys/kernel/kptr_restrict
# 1 = hidden from non-root

# Disable SysRq (emergency keyboard)
echo 0 > /proc/sys/kernel/sysrq

# Restrict BPF
echo 1 > /proc/sys/kernel/unprivileged_bpf_disabled
```

---

## Real Task: Harden a Container Host

```bash
# 1. Drop capabilities
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE alpine

# 2. Apply seccomp profile
docker run --security-opt seccomp=profile.json alpine

# 3. Set read-only rootfs
docker run --read-only --tmpfs /tmp alpine

# 4. No new privileges
docker run --security-opt no-new-privileges alpine

# 5. Limit syscalls with seccomp
# (already done with profile)

# 6. Verify
docker inspect --format='{{.HostConfig.SecurityOpt}}' <container_id>
# [seccomp=profile.json,no-new-privileges]
```

---

## Assessment

**Lab task (25 min):**

1. Check and modify capabilities of a process
2. Create a seccomp profile that blocks dangerous syscalls
3. Configure SELinux/AppArmor for a service
4. Apply kernel hardening parameters
5. Harden a Docker container with security options

**Grading:**
- Capabilities managed: 20%
- seccomp profile created: 20%
- MAC configured: 20%
- Kernel hardened: 15%
- Container hardened: 25%

---

## Evidence

- **OutcomeEvidence:** `INT-LO10 — Kernel Security` — final competency for Linux Internals

---

## Course Complete

You can now:
- Trace kernel boot process
- Manage processes at the syscall level
- Understand memory management and OOM
- Debug filesystem internals
- Trace syscalls with strace
- Load kernel modules and use eBPF
- Build containers from namespaces/cgroups
- Debug hardware with dmesg/lspci
- Profile performance with perf/flame graphs
- Harden kernel with capabilities/seccomp/SELinux

**Next course:** Security Engineering or Web Application Security.
