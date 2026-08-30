# Module 6 — Security Hardening

**Course:** Linux Systems Administration | **Path:** Linux Sysadmin (6 of 10) | **Status:** DRAFT → FACT_CHECK → TECHNICAL_REVIEW → PUBLISHED
**Estimated time:** 30 min | **Prerequisite:** Module 5 — Network Configuration

---

## What You'll Actually Do

Apply CIS benchmarks, configure auditd, set up AppArmor/SELinux, harden SSH, disable unnecessary services, and verify your hardening with a scan. This is the difference between "we have a server" and "we have a server that passes audit."

---

## CIS Benchmark — Key Controls

**Filesystem:**
```bash
# Mount /tmp with noexec,nosuid,nodev
echo "/dev/sda1 /tmp ext4 defaults,nosuid,nodev,noexec 0 0" >> /etc/fstab

# Disable core dumps
echo "* hard core 0" >> /etc/security/limits.conf
echo "fs.suid_dumpable = 0" >> /etc/sysctl.conf

# Sticky bit on world-writable dirs
find / -xdev -type d \( -perm -0002 -a ! -perm -1000 \) -exec chmod +t {} +
```

**Kernel:**
```bash
cat >> /etc/sysctl.conf << 'EOF'
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.tcp_syncookies = 1
kernel.randomize_va_space = 2
EOF
sysctl -p
```

**Audit:**
```bash
# /etc/audit/rules.d/hardening.rules
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/sudoers -p wa -k sudoers
-w /var/log/auth.log -p wa -k auth_log
-a always,exit -F arch=b64 -S execve -k exec
```

---

## AppArmor / SELinux

**AppArmor (Ubuntu default):**
```bash
# Check status
aa-status

# Enforce a profile
aa-enforce /etc/apparmor.d/usr.sbin.nginx

# Disable (last resort)
aa-disable /etc/apparmor.d/usr.sbin.nginx
```

**SELinux (RHEL/CentOS default):**
```bash
# Check status
getenforce

# Set to enforcing
setenforce 1

# Check contexts
ls -Z /var/www/html

# Fix contexts
restorecon -Rv /var/www/html

# Allow a port
semanage port -a -t http_port_t -p tcp 8080
```

---

## SSH Hardening (Production)

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers deploy alice
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no
AllowTcpForwarding no
Protocol 2
```

---

## Remove Unnecessary Services

```bash
# List running services
systemctl list-units --type=service --state=running

# Disable what you don't need
systemctl disable --now cups avahi-daemon bluetooth

# Check listening ports
ss -tlnp
```

---

## Vulnerability Scanning

**OpenSCAP:**
```bash
apt install libopenscap8
oscap xccdf eval --profile xccdf_org.ssgproject.content_profile_cis \
    --results results.xml --report report.html \
    /usr/share/xml/scap/ssg/content/ssg-ubuntu2204-ds.xml
```

**Lynis:**
```bash
apt install lynis
lynis audit system
```

---

## Real Task: Harden a Server

```bash
# 1. Apply CIS basics
sysctl -w net.ipv4.conf.all.rp_filter=1
sysctl -w net.ipv4.conf.all.accept_redirects=0
chmod 600 /etc/shadow
chmod 644 /etc/passwd
chmod 700 /root

# 2. Configure auditd
apt install -y auditd
# add rules
systemctl enable auditd

# 3. SSH hardening
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# 4. Firewall
ufw default deny incoming
ufw allow 2222/tcp
ufw enable

# 5. Disable services
systemctl disable --now cups avahi-daemon

# 6. Scan
lynis audit system
```

---

## Assessment

**Lab task (25 min):**

1. Apply CIS kernel parameters
2. Configure auditd with rules for identity files
3. Set up AppArmor/SELinux for nginx
4. Harden SSH (disable root, key-only)
5. Disable unnecessary services
6. Run a vulnerability scan with Lynis

**Grading:**
- CIS parameters applied: 20%
- Auditd configured: 20%
- AppArmor/SELinux enforced: 20%
- SSH hardened: 15%
- Services cleaned: 10%
- Scan completed: 15%

---

## Evidence

- **OutcomeEvidence:** `SYS-LO6 — Security Hardening`
- **Mastery:** `UserSkill: linux-security-hardening`

---

## Unlock

Module7 — Backup and Recovery. You can secure the server. Now you learn how to recover when things go wrong.

---

## Sources

- CIS Benchmarks
- `man auditd`, `man apparmor`, `man lynis`

---

## AI Provenance

- **Draft:** LLM (2025-08-31)
- **Voice:** Security engineer who's passed more audits than he can count
- **Status:** DRAFT → FACT_CHECK ✓ → TECHNICAL_REVIEW → PUBLISHED
