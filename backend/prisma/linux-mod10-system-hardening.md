# Module 10: System Hardening

## Why This Matters

A default Linux installation is designed to be functional, not secure. It ships with services you do not need, open ports you should not expose, permissive file permissions, and kernel settings optimized for compatibility rather than security. System hardening is the process of reducing the attack surface: eliminating unnecessary components, tightening permissions, and adding layers of defense.

This module covers the practical steps to harden a Linux server for production use. We will work through services, kernel parameters, file permissions, audit logging, and compliance frameworks. Every change is concrete and reversible.

## Disabling Unnecessary Services

Every running service is a potential attack vector. If you do not use a service, disable it. The fewer things running, the smaller the attack surface.

### Find Running Services

```bash
systemctl list-units --type=service --state=running
```
```
UNIT                     LOAD   ACTIVE SUB     DESCRIPTION
apache2.service          loaded active running The Apache HTTP Server
chrony.service           loaded active running chrony service
cron.service             loaded active running Regular background program processing
dbus.service             loaded active running D-Bus System Message Bus
fail2ban.service         loaded active running fail2ban Service
getty@tty1.service       loaded active running Getty on tty1
nginx.service            loaded active running A high performance web server
postgresql.service        loaded active running PostgreSQL Cluster
rsyslog.service          loaded active running System Logging Service
ssh.service              loaded active running OpenBSD Secure Shell server
systemd-journald.service loaded active running Journal Service
systemd-logind.service   loaded active running Login Service
systemd-networkd.service loaded active running Network Service
udisks2.service          loaded active running Disk Manager
```

Review this list. For each service, ask: "Does this server need this?" A web server probably does not need Apache if nginx is already running. A headless server does not need udisks (disk automounting) or getty (virtual terminals).

### Disable Unnecessary Services

```bash
# If you do not need Apache (you are using nginx)
sudo systemctl stop apache2
sudo systemctl disable apache2
sudo systemctl mask apache2         # Prevent it from being started manually

# If you do not need getty on tty1 (headless server)
sudo systemctl mask getty@tty1.service

# If you do not need udisks (disk automounting on a server)
sudo systemctl stop udisks2
sudo systemctl disable udisks2
sudo systemctl mask udisks2

# If you do not need Bluetooth
sudo systemctl stop bluetooth
sudo systemctl disable bluetooth
sudo systemctl mask bluetooth
```

The difference between `disable` and `mask`:

- `disable` prevents the service from starting at boot. It can still be started manually with `systemctl start`.
- `mask` creates a symlink to `/dev/null`, preventing the service from being started at all (manually or automatically). This is stronger.

Use `mask` for services that should never run on this server. Use `disable` for services that might need to be started temporarily for maintenance.

### Identify Listening Services

```bash
ss -tlnp
```
```
State    Recv-Q   Send-Q   Local Address:Port   Peer Address:Port   Process
LISTEN   0        128      0.0.0.0:22           0.0.0.0:*           users:(("sshd",pid=342,fd=3))
LISTEN   0        511      0.0.0.0:80           0.0.0.0:*           users:(("nginx",pid=567,fd=6))
LISTEN   0        511      0.0.0.0:443          0.0.0.0:*           users:(("nginx",pid=567,fd=7))
LISTEN   0        5        127.0.0.1:5432        0.0.0.0:*           users:(("postgres",pid=789,fd=3))
LISTEN   0        128      0.0.0.0:8080         0.0.0.0:*           users:(("python3",pid=1567,fd=4))
```

Every line in this output is a potential attack surface. Services bound to `127.0.0.1` (like PostgreSQL on port 5432) are only accessible locally. Services bound to `0.0.0.0` are accessible from anywhere on the network.

If PostgreSQL should only be accessed locally, verify its configuration:

```bash
grep "^listen_addresses" /etc/postgresql/15/main/postgresql.conf
```
```
listen_addresses = 'localhost'
```

If it were set to `'*'`, it would be accessible from the internet: a significant security risk.

## Kernel Hardening with sysctl

The `/proc/sys/` directory contains tunable kernel parameters. You can modify them at runtime with `sysctl` or persist them in `/etc/sysctl.conf` or `/etc/sysctl.d/`.

### Network Security

```bash
# /etc/sysctl.d/99-security.conf

# Disable IP forwarding (unless you are running a router or Docker)
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0

# Ignore ICMP broadcast requests (Smurf attack prevention)
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Ignore bogus ICMP error responses
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Enable SYN flood protection
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2

# Disable source routing (prevents spoofed packets from being routed)
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Disable ICMP redirect acceptance (prevents man-in-the-middle attacks)
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0

# Disable send redirects (prevent the server from being used to redirect traffic)
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Enable reverse path filtering (prevent IP spoofing)
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Log Martian packets (packets with impossible source addresses)
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1

# Disable IPv6 if not needed
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
```

### Memory Protection

```bash
# /etc/sysctl.d/99-memory.conf

# Restrict dmesg access (prevent information leakage to unprivileged users)
kernel.dmesg_restrict = 1

# Restrict kernel pointer exposure (prevents kernel address leaks)
kernel.kptr_restrict = 2

# Enable ASLR (Address Space Layout Randomization)
# 0 = disabled, 1 = conservative, 2 = full randomization
kernel.randomize_va_space = 2

# Restrict ptrace (prevent process inspection by other processes)
# 0 = any process can debug any other process
# 1 = parent can only debug children
# 2 = no debugging at all
kernel.yama.ptrace_scope = 1

# Restrict core dumps (prevent sensitive data from being written to disk)
fs.suid_dumpable = 0

# Restrict access to kernel logs
kernel.printk = 3 3 3 3
```

### File System

```bash
# /etc/sysctl.d/99-fs.conf

# Restrict symlinks (prevent symlink attacks in world-writable directories)
fs.protected_symlinks = 1

# Restrict hardlinks (prevent hardlink attacks)
fs.protected_hardlinks = 1

# Restrict FIFO and regular file creation in world-writable directories
fs.protected_fifos = 2
fs.protected_regular = 2
```

### Apply Changes

```bash
sudo sysctl -p /etc/sysctl.d/99-security.conf
# or
sudo sysctl --system
```

Verify:

```bash
sysctl net.ipv4.tcp_syncookies
```
```
net.ipv4.tcp_syncookies = 1
```

## File Permission Hardening

### Understanding umask

The `umask` sets the default permissions for newly created files and directories:

```bash
umask
```
```
0022
```

How umask works:
- Files are created with mode `666` (rw-rw-rw-). The umask removes bits: `666 - 022 = 644` (rw-r--r--).
- Directories are created with mode `777` (rwxrwxrwx). The umask removes bits: `777 - 022 = 755` (rwxr-xr-x).

A stricter umask of `027` gives:
- Files: `666 - 027 = 640` (rw-r-----)
- Directories: `777 - 027 = 750` (rwxr-x---)

This means the group can read but not execute, and others have no access at all.

Set a stricter umask in `/etc/profile` or `/etc/login.defs`:

```bash
# /etc/login.defs
UMASK 027
```

### Finding World-Writable Files

World-writable files can be modified by anyone. On a production server, there should be very few:

```bash
find / -xdev -type f -perm -0002 2>/dev/null
```

The `-xdev` flag prevents searching across filesystem boundaries (avoiding `/proc`, `/sys`, etc.).

Common world-writable directories (and why they exist):

```bash
find / -xdev -type d -perm -0002 2>/dev/null | grep -v -E "^/(tmp|var/tmp|dev/shm)$"
```

Expected world-writable directories: `/tmp`, `/var/tmp`, `/dev/shm`. Everything else should be investigated.

If you find unexpected world-writable directories, fix them:

```bash
sudo chmod o-w /path/to/directory
```

### Finding SUID and SGID Binaries

SUID and SGID binaries run with elevated privileges. Audit them regularly:

```bash
# Find SUID binaries (run as file owner)
find / -xdev -type f -perm -4000 2>/dev/null
```
```
/usr/bin/passwd
/usr/bin/sudo
/usr/bin/su
/usr/bin/newgrp
/usr/bin/chsh
/usr/bin/chfn
/usr/bin/gpasswd
/usr/lib/openssh/ssh-keysign
/usr/lib/dbus-1.0/dbus-daemon-launch-helper
```

These are expected SUID binaries. If you find unfamiliar ones, investigate:

```bash
# Check what a binary does
/usr/bin/strace /usr/bin/suspicious_binary

# Check the package that installed it
dpkg -S /usr/bin/suspicious_binary
# or
rpm -qf /usr/bin/suspicious_binary
```

Remove SUID from binaries that do not need it:

```bash
sudo chmod u-s /usr/bin/suspicious_binary
```

Find SGID binaries:

```bash
find / -xdev -type f -perm -2000 2>/dev/null
```

### Restricting Directories

Mount temporary directories with restrictive options:

```bash
# /etc/fstab
tmpfs /tmp tmpfs defaults,noexec,nosuid,nodev 0 0
tmpfs /var/tmp tmpfs defaults,noexec,nosuid,nodev 0 0
```

These mount options prevent execution of programs from temporary directories, which is a common attack vector. An attacker who uploads a script to `/tmp` cannot execute it.

The options:
- `noexec`: prevent execution of any binary
- `nosuid`: ignore SUID/SGID bits
- `nodev`: ignore device files

## Audit: auditd

The audit daemon tracks security-relevant events: who accessed what files, who ran what commands, and when. It is essential for security monitoring and compliance.

### Installation

```bash
# Debian/Ubuntu
sudo apt install auditd audispd-plugins

# RHEL/CentOS
sudo dnf install audit
```

### Starting auditd

```bash
sudo systemctl enable --now auditd
```

### Creating Audit Rules

```bash
# /etc/audit/rules.d/hardening.rules

# Monitor changes to /etc/passwd
-w /etc/passwd -p wa -k passwd_changes

# Monitor changes to /etc/shadow
-w /etc/shadow -p wa -k shadow_changes

# Monitor changes to /etc/sudoers
-w /etc/sudoers -p wa -k sudoers_changes

# Monitor changes to sshd_config
-w /etc/ssh/sshd_config -p wa -k sshd_config

# Monitor all commands run by root
-a always,exit -F arch=b64 -F euid=0 -S execve -k root_commands

# Monitor failed access attempts
-a always,exit -F arch=b64 -S open -S openat -F exit=-EACCES -k access_denied
-a always,exit -F arch=b64 -S open -S openat -F exit=-EPERM -k access_denied

# Monitor user/group modifications
-w /usr/sbin/useradd -p x -k user_modification
-w /usr/sbin/userdel -p x -k user_modification
-w /usr/sbin/usermod -p x -k user_modification
-w /usr/sbin/groupadd -p x -k group_modification
-w /usr/sbin/groupdel -p x -k group_modification
-w /usr/sbin/groupmod -p x -k group_modification

# Monitor kernel module loading
-w /sbin/insmod -p x -k kernel_modules
-w /sbin/rmmod -p x -k kernel_modules
-w /sbin/modprobe -p x -k kernel_modules
```

The flags:
- `-w`: watch a file for changes
- `-p`: permissions to watch (r=read, w=write, x=execute, a=attribute change)
- `-k`: key tag for searching logs
- `-a`: add a rule to an audit filter
- `-F`: filter field (arch, euid, exit code)
- `-S`: system call to monitor

Load the rules:

```bash
sudo augenrules --load
```

### Searching Audit Logs

```bash
# Search by key
sudo ausearch -k passwd_changes --interpret
sudo ausearch -k root_commands --start today

# Search by time range
sudo ausearch --start "2024-01-15 10:00" --end "2024-01-15 11:00"

# Search by user
sudo ausearch -ua admin

# Generate a report
sudo aureport --summary
sudo aureport --auth          # Authentication report
sudo aureport --login         # Login report
sudo aureport --failed        # Failed events
sudo aureport --file          # File access report
```

```bash
sudo ausearch -k passwd_changes --interpret
```
```
type=SYSCALL msg=audit(01/15/2024 10:30:00.123:456) : arch=c000003e syscall=89 success=yes exit=0
a0=7fff12345678 b1=7fff12345680 ppid=1234 pid=5678 auid=1000 uid=0 gid=0 euid=0
ses=1 comm="usermod" exe="/usr/sbin/usermod" key="user_modification"
```

This shows that user `admin` (UID 1000, AUID 1000) ran `usermod` as root at 10:30 AM. The AUID (audit UID) is the original user's ID, even if they used sudo.

## Compliance: CIS Benchmarks

The Center for Internet Security (CIS) publishes hardening benchmarks for various operating systems. These are prescriptive, step-by-step guides for securing a system. They cover hundreds of individual settings across multiple categories.

### CIS Benchmark Categories

The CIS Ubuntu Linux 22.04 LTS Benchmark covers:

1. **Initial Setup**: Filesystem configuration, software updates, filesystem integrity
2. **Services**: Disable unnecessary services, configure secure services
3. **Network Configuration**: Firewall, network parameters, IPv6
4. **Logging and Auditing**: Configure journald, rsyslog, auditd
5. **Access, Authentication, and Authorization**: SSH, sudo, PAM, user accounts
6. **System Maintenance**: File permissions, local initialization files

### Automated Compliance Checks

```bash
#!/bin/bash
# CIS Compliance Quick Check
set -euo pipefail

ISSUES=0
WARNINGS=0

check() {
    local description="$1"
    local command="$2"
    local expected="$3"
    
    result=$(eval "$command" 2>/dev/null)
    if [ "$result" = "$expected" ]; then
        echo "[PASS] $description"
    else
        echo "[FAIL] $description (expected: $expected, got: $result)"
        ISSUES=$((ISSUES + 1))
    fi
}

warn_check() {
    local description="$1"
    local command="$2"
    local expected="$3"
    
    result=$(eval "$command" 2>/dev/null)
    if [ "$result" = "$expected" ]; then
        echo "[PASS] $description"
    else
        echo "[WARN] $description (expected: $expected, got: $result)"
        WARNINGS=$((WARNINGS + 1))
    fi
}

echo "=== CIS Compliance Check ==="
echo ""
echo "--- Network ---"
check "IP forwarding disabled" "sysctl -n net.ipv4.ip_forward" "0"
check "ICMP redirects disabled" "sysctl -n net.ipv4.conf.all.accept_redirects" "0"
check "ICMP send redirects disabled" "sysctl -n net.ipv4.conf.all.send_redirects" "0"
check "SYN cookies enabled" "sysctl -n net.ipv4.tcp_syncookies" "1"
check "Source routing disabled" "sysctl -n net.ipv4.conf.all.accept_source_route" "0"

echo ""
echo "--- Memory ---"
check "ASLR enabled" "sysctl -n kernel.randomize_va_space" "2"
check "Core dumps restricted" "sysctl -n fs.suid_dumpable" "0"
check "dmesg restricted" "sysctl -n kernel.dmesg_restrict" "1"
check "ptrace restricted" "sysctl -n kernel.yama.ptrace_scope" "1"

echo ""
echo "--- SSH ---"
check "SSH root login disabled" "grep -c '^PermitRootLogin no' /etc/ssh/sshd_config" "1"
check "Password auth disabled" "grep -c '^PasswordAuthentication no' /etc/ssh/sshd_config" "1"

echo ""
echo "--- Services ---"
check "Auditd running" "systemctl is-active auditd" "active"
check "Fail2ban running" "systemctl is-active fail2ban" "active"
check "UFW active" "systemctl is-active ufw" "active"

echo ""
echo "--- Filesystem ---"
warn_check "No world-writable files" "find / -xdev -type f -perm -0002 2>/dev/null | wc -l" "0"
warn_check "SUID count under 20" "find / -xdev -type f -perm -4000 2>/dev/null | wc -l" "$(find / -xdev -type f -perm -4000 2>/dev/null | wc -l)"

echo ""
echo "=== Summary ==="
echo "Failures: $ISSUES"
echo "Warnings: $WARNINGS"
```

This script checks the most critical CIS benchmarks. For a full audit, use the CIS-CAT tool or review the benchmark document and check each item manually.

## Real Scenario: Hardening a Server for Production

You have a fresh Ubuntu 22.04 server that needs to be hardened before deployment. Here is the complete hardening checklist.

**Step 1: System updates.**

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Automatic security updates ensure that known vulnerabilities are patched promptly.

**Step 2: Create a non-root user and configure sudo.**

```bash
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy
sudo passwd deploy

# Configure sudo for the deploy user
echo "deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl, /usr/bin/journalctl, /usr/bin/apt" | sudo tee /etc/sudoers.d/deploy
sudo chmod 440 /etc/sudoers.d/deploy
```

The deploy user can restart services and view logs without a password, but requires a password for other sudo operations.

**Step 3: SSH hardening.**

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

sudo tee /etc/ssh/sshd_config > /dev/null <<'EOF'
Port 2222
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
X11Forwarding no
AllowTcpForwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers deploy
LoginGraceTime 30
SyslogFacility AUTH
LogLevel VERBOSE
EOF

sudo systemctl restart sshd
```

**Step 4: Install and configure fail2ban.**

```bash
sudo apt install -y fail2ban

sudo tee /etc/fail2ban/jail.local > /dev/null <<'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
banaction = iptables-multiport
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

sudo systemctl enable --now fail2ban
```

**Step 5: Configure firewall.**

```bash
sudo iptables -F
sudo iptables -X

# Default policies
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# Allow established connections
sudo iptables -A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT

# Allow loopback
sudo iptables -A INPUT -i lo -j ACCEPT

# Allow SSH
sudo iptables -A INPUT -p tcp --dport 2222 -j ACCEPT

# Allow HTTP and HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow DNS responses
sudo iptables -A INPUT -p udp --sport 53 -j ACCEPT

# Allow ICMP
sudo iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT

# Save rules
sudo apt install -y iptables-persistent
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

**Step 6: Kernel hardening.**

```bash
sudo tee /etc/sysctl.d/99-security.conf > /dev/null <<'EOF'
net.ipv4.ip_forward = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.log_martians = 1
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
kernel.randomize_va_space = 2
kernel.yama.ptrace_scope = 1
fs.suid_dumpable = 0
fs.protected_symlinks = 1
fs.protected_hardlinks = 1
EOF

sudo sysctl --system
```

**Step 7: Disable unnecessary services.**

```bash
for service in avahi-daemon cups bluetooth; do
    sudo systemctl stop "$service" 2>/dev/null || true
    sudo systemctl disable "$service" 2>/dev/null || true
    sudo systemctl mask "$service" 2>/dev/null || true
done
```

**Step 8: File permission hardening.**

```bash
# Set stricter umask
echo "umask 027" | sudo tee -a /etc/profile

# Find and report world-writable files
find / -xdev -type f -perm -0002 2>/dev/null | tee /tmp/world_writable.txt

# Find and report SUID binaries
find / -xdev -type f -perm -4000 2>/dev/null | tee /tmp/suid_binaries.txt

# Secure cron
sudo chmod 600 /etc/crontab
sudo chmod 700 /etc/cron.d
sudo chmod 700 /etc/cron.daily
sudo chmod 700 /etc/cron.hourly
sudo chmod 700 /etc/cron.weekly
sudo chmod 700 /etc/cron.monthly
```

**Step 9: Configure audit logging.**

```bash
sudo apt install -y auditd

sudo tee /etc/audit/rules.d/hardening.rules > /dev/null <<'EOF'
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/sudoers -p wa -k sudoers
-w /etc/ssh/sshd_config -p wa -k sshd_config
-a always,exit -F arch=b64 -S execve -F euid=0 -k root_commands
-w /usr/sbin/useradd -p x -k user_modification
-w /usr/sbin/userdel -p x -k user_modification
-w /usr/sbin/usermod -p x -k user_modification
EOF

sudo augenrules --load
sudo systemctl enable auditd
```

**Step 10: Configure logrotate and journald.**

```bash
sudo tee /etc/systemd/journald.conf > /dev/null <<'EOF'
[Journal]
SystemMaxUse=200M
SystemMaxFileSize=25M
MaxRetentionSec=30day
Compress=yes
EOF

sudo systemctl restart systemd-journald
```

**Step 11: Verify the hardening.**

```bash
echo "=== Service Check ==="
ss -tlnp

echo ""
echo "=== Firewall Rules ==="
sudo iptables -L INPUT -v -n

echo ""
echo "=== SSH Config ==="
grep -E "^(Port|PermitRootLogin|PasswordAuthentication|AllowUsers)" /etc/ssh/sshd_config

echo ""
echo "=== Kernel Parameters ==="
sysctl net.ipv4.ip_forward net.ipv4.tcp_syncookies kernel.randomize_va_space

echo ""
echo "=== Audit Rules ==="
sudo auditctl -l

echo ""
echo "=== Fail2ban Status ==="
sudo fail2ban-client status

echo ""
echo "=== Enabled Services ==="
systemctl list-unit-files --state=enabled --type=service | grep -v "^$"
```

## Mandatory Access Control: AppArmor and SELinux

Beyond standard Unix permissions, Linux provides mandatory access control (MAC) systems that restrict what processes can do, even as root.

### AppArmor (Ubuntu/Debian)

AppArmor confines programs using per-program profiles.

```bash
# Check AppArmor status
sudo aa-status
```
```
apparmor module is loaded.
38 profiles are loaded.
37 profiles are in enforce mode.
   /usr/sbin/nginx
   /usr/sbin/sshd
   ...
1 profiles are in complain mode.
   /usr/bin/vim
```

```bash
# Put a profile in complain mode (log but do not block)
sudo aa-complain /usr/sbin/nginx

# Put a profile in enforce mode (log and block)
sudo aa-enforce /usr/sbin/nginx

# Disable a profile
sudo ln -s /etc/apparmor.d/usr.sbin.nginx /etc/apparmor.d/disable/
sudo apparmor_parser -R /etc/apparmor.d/usr.sbin.nginx
```

### SELinux (RHEL/CentOS)

SELinux is enabled by default on RHEL/CentOS. It provides fine-grained access control.

```bash
# Check SELinux status
sestatus
```
```
SELinux status:                 enabled
SELinuxfs mount:                /sys/fs/selinux
SELinux root directory:         /etc/selinux
Loaded policy name:             targeted
Current mode:                   enforcing
Mode from config file:          enforcing
```

```bash
# Check if a file has the correct SELinux context
ls -Z /var/www/html/

# Restore default SELinux context
sudo restorecon -Rv /var/www/html/

# Allow a specific port
sudo semanage port -a -t http_port_t -p tcp 8080

# Temporarily set permissive mode (for debugging)
sudo setenforce 0

# Set enforcing mode
sudo setenforce 1
```

## Compliance Auditing

### Automated Compliance Scripts

```bash
#!/bin/bash
# Quick security audit
set -euo pipefail

echo "=== Security Audit Report ==="
echo "Date: $(date)"
echo "Hostname: $(hostname)"
echo ""

echo "--- Users with UID 0 (root-level access) ---"
awk -F: '$3 == 0 {print $1}' /etc/passwd
echo ""

echo "--- Users with empty passwords ---"
awk -F: '($2 == "" || $2 == "!") {print $1}' /etc/shadow 2>/dev/null || echo "Cannot read /shadow"
echo ""

echo "--- Users with no password expiration ---"
for user in $(awk -F: '$3 >= 1000 {print $1}' /etc/passwd); do
    expire=$(chage -l "$user" 2>/dev/null | grep "Password expires" | cut -d: -f2)
    if echo "$expire" | grep -q "never"; then
        echo "  $user: password never expires"
    fi
done
echo ""

echo "--- Open ports ---"
ss -tlnp | grep LISTEN
echo ""

echo "--- SUID binaries ---"
find / -xdev -type f -perm -4000 2>/dev/null | wc -l
echo ""

echo "--- World-writable files (excluding /tmp) ---"
find / -xdev -type f -perm -0002 ! -path "/tmp/*" 2>/dev/null | wc -l
echo ""

echo "--- Failed login attempts (last 24h) ---"
journalctl _SYSTEMD_UNIT=sshd.service --since "24 hours ago" 2>/dev/null | grep -c "Failed password" || echo "0"
echo ""

echo "--- Audit rules loaded ---"
auditctl -l 2>/dev/null | wc -l
```

## Assessment

**Lab: System Hardening (45 minutes)**

Scenario: You have been given a fresh Ubuntu server. Apply a comprehensive hardening configuration.

**Tasks:**

1. Update the system and enable automatic security updates.
2. Create a non-root user `deploy` with sudo access for specific commands only (systemctl, journalctl, apt).
3. Harden SSH according to the requirements in Module 7 (key-only, no root, non-standard port, restricted users).
4. Install and configure fail2ban with SSH jail.
5. Configure iptables with a restrictive firewall policy (allow only SSH, HTTP, HTTPS).
6. Apply kernel hardening parameters via sysctl.
7. Find and document all world-writable files and directories. Fix any that are unexpected.
8. Find and document all SUID/SGID binaries.
9. Configure audit logging to monitor /etc/passwd, /etc/shadow, /etc/ssh/sshd_config, and all root commands.
10. Configure journald to limit log storage to 200MB.
11. Disable at least 3 unnecessary services.
12. Write a hardening report documenting all changes to `/tmp/hardening_report.txt`.

**Grading Criteria:**

- System updated and auto-upgrades enabled: 5 points
- deploy user created with restricted sudo: 10 points
- SSH hardened (all 4 directives): 20 points
- fail2ban configured: 10 points
- iptables firewall correct (7 rules): 20 points
- Kernel parameters applied: 10 points
- World-writable files found and fixed: 5 points
- SUID/SGID binaries documented: 5 points
- Audit logging configured: 10 points
- Journald configured: 3 points
- Unnecessary services disabled: 2 points
- Hardening report complete: 10 points

**Total: 100 points. Pass threshold: 70 points.**

## Evidence

After completing this lab, you should have:

- A hardened server with key-based SSH authentication only.
- A restrictive firewall with only necessary ports open.
- Kernel parameters configured for security.
- Audit logging tracking critical system changes.
- Documentation of all changes for compliance purposes.
- Understanding of how each hardening measure reduces the attack surface.
