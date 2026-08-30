# Module 10 — System Hardening Basics


## What You'll Actually Do

Your server works. Now make it so nobody can break into it. Disable unnecessary services, lock down permissions, configure auditing, and apply a basic CIS benchmark. This is the difference between "it works" and "it works and nobody can get in."

## Remove Unnecessary Services

Every running service is an attack surface. If you don't need it, kill it.

```bash
# List all running services
systemctl list-units --type=service --state=running

# Disable what you don't need
systemctl disable --now cups          # printing
systemctl disable --now avahi-daemon  # mDNS
systemctl disable --now bluetooth     # bluetooth
```

**Check listening ports:**
```bash
ss -tlnp
```
If you see a port you don't recognize, find the process and decide if it should be there.

## Kernel Hardening — sysctl

`/etc/sysctl.conf` controls kernel parameters.

```bash
cat >> /etc/sysctl.conf << 'EOF'
# Prevent IP spoofing
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Disable ICMP redirects (prevent MITM)
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

# Disable source routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0

# SYN flood protection
net.ipv4.tcp_syncookies = 1

# Log suspicious packets
net.ipv4.conf.all.log_martians = 1

# Disable IP forwarding (unless you're a router)
net.ipv4.ip_forward = 0
EOF

sysctl -p
```

## File Permission Hardening

**World-writable files (dangerous):**
```bash
find / -xdev -type f -perm -0002 -ls 2>/dev/null
```
Any file anyone can write to. Usually a misconfiguration.

**SUID files (running as root):**
```bash
find / -xdev -type f -perm -4000 -ls 2>/dev/null
```
These run with root privileges. If you don't need them, remove SUID:
```bash
chmod u-s /usr/bin/unnecessary-suid-binary
```

**SGID files:**
```bash
find / -xdev -type f -perm -2000 -ls 2>/dev/null
```

**Sticky bit on /tmp:**
```bash
chmod +t /tmp
```

**Restrict cron:**
```bash
ls -la /etc/cron.d/
cat /etc/cron.allow    # only these users can use cron
cat /etc/cron.deny     # these users cannot
```

## Firewall — Default Deny

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw enable
```

If you need more ports, add them explicitly. Don't open everything "just in case."

## SSH Hardening (Summary from Module7)

Already done. Key points:
- `PermitRootLogin no`
- `PasswordAuthentication no`
- `AllowUsers alice bob`
- fail2ban enabled
- Non-standard port

## Auditd — Track What Happens

```bash
apt install auditd
systemctl enable auditd
```

**Add rules:**
```bash
cat >> /etc/audit/rules.d/hardening.rules << 'EOF'
# Monitor changes to /etc/passwd
-w /etc/passwd -p wa -k identity

# Monitor changes to /etc/shadow
-w /etc/shadow -p wa -k identity

# Monitor SSH config changes
-w /etc/ssh/sshd_config -p wa -k sshd_config

# Monitor sudo usage
-w /usr/bin/sudo -p x -k sudo

# Monitor user/group changes
-w /usr/sbin/useradd -p x -k usermod
-w /usr/sbin/userdel -p x -k usermod
-w /usr/sbin/usermod -p x -k usermod
EOF

augenrules --load
```

**Check audit logs:**
```bash
ausearch -k identity --start today
```

## CIS Benchmark — The Basics

The CIS benchmark is a checklist for hardening. Here are the critical ones:

**1. Filesystem configuration:**
```bash
# /tmp separate partition (limits /tmp exploits)
# If not separate, at least set noexec,nosuid,nodev:
mount -o remount,noexec,nosuid,nodev /tmp
```

**2. Disable core dumps:**
```bash
echo "* hard core 0" >> /etc/security/limits.conf
echo "fs.suid_dumpable = 0" >> /etc/sysctl.conf
```

**3. Banner warning:**
```bash
cat > /etc/issue.net << 'EOF'
 authorized access only.
 all activity is monitored and logged.
EOF
```

**4. Time sync:**
```bash
apt install chrony
systemctl enable chrony
```

**5. Password policy:**
```bash
# /etc/login.defs
PASS_MAX_DAYS   90
PASS_MIN_DAYS   7
PASS_WARN_AGE   14
```

## Real Task: Harden a New Server

```bash
# 1. Update
apt update && apt upgrade -y

# 2. Remove unnecessary services
systemctl disable --now cups avahi-daemon

# 3. Kernel hardening
sysctl -w net.ipv4.conf.all.rp_filter=1
sysctl -w net.ipv4.conf.all.accept_redirects=0
sysctl -w net.ipv4.tcp_syncookies=1

# 4. File permissions
chmod 600 /etc/shadow
chmod 644 /etc/passwd
chmod 700 /root
chmod +t /tmp

# 5. SSH hardening
# (already done in Module7)

# 6. Firewall
ufw default deny incoming
ufw allow 2222/tcp
ufw enable

# 7. Audit
apt install -y auditd
# add rules, restart
systemctl enable auditd

# 8. Automatic updates
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

## Failure Scenario: Hardened Too Much

You disable ICMP:
```bash
net.ipv4.icmp_echo_ignore_all = 1
```

Now `ping` doesn't work. Monitoring tools can't reach the server. You can't debug network issues.

**Lesson:** Hardening is about risk, not paranoia. Disable what you don't need, but keep what helps you operate.

## Assessment

**Lab task (25 min):**

1. List all running services and disable3 you don't need
2. Find all SUID files and document which ones should exist
3. Configure sysctl with basic hardening parameters
4. Configure ufw with default deny and only necessary ports
5. Set up auditd to monitor /etc/passwd and /etc/shadow
6. Set password policy (max90 days, min7 days)
7. Add a login banner

**Grading:**
- Services audited and cleaned: 15%
- SUID files documented: 15%
- sysctl configured: 20%
- Firewall configured: 20%
- Auditd configured: 15%
- Password policy set: 10%
- Banner added: 5%

## Evidence

- **OutcomeEvidence:** `LIN-LO10 — System Hardening Basics`
- **Mastery:** `UserSkill: linux-hardening` — final competency for Linux Fundamentals

## Course Complete

You can now:
- SSH into a server and navigate
- Manage files, users, and permissions
- Control services with systemd
- Debug networking issues
- Process text with pipelines
- Install and manage packages
- Secure SSH access
- Write shell scripts
- Read and interpret logs
- Harden a Linux server

**Next course:** Linux Systems Administration (deeper) or Linux Internals (under the hood).

## Sources

- CIS Amazon Linux2 Benchmark
- DISA STIG for Ubuntu22.04
- `man sysctl`, `man auditd`, `man auditctl`
- NIST SP 800-123 — Guide to General Server Security

