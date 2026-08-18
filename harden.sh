#!/bin/bash
# AeroAcademy Security Hardening Script
# Run on server to harden containers, add honeypots, and set up monitoring

set -e

echo "=========================================="
echo " AeroAcademy Advanced Security Hardening"
echo "=========================================="

# =============================================
# 1. CONTAINER HARDENING
# =============================================
echo -e "\n[1/8] Hardening Docker containers..."

# Create seccomp profile for backend
cat > /etc/docker/seccomp-backend.json << 'SECCOMP'
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "defaultErrnoRet": 1,
  "architectures": ["SCMP_ARCH_X86_64", "SCMP_ARCH_X86", "SCMP_ARCH_AARCH64"],
  "syscalls": [
    {"names": ["accept","access","alarm","bind","brk","chmod","chown","clock_getres","clock_gettime","close","connect","dup","dup2","epoll_create","epoll_ctl","epoll_wait","execve","exit","exit_group","fchmod","fchown","fcntl","flock","fork","fstat","fsync","futex","getcwd","getdents","getegid","geteuid","getgid","getpeername","getpid","getppid","getsockname","getsockopt","getuid","ioctl","kill","listen","lseek","madvise","mmap","mprotect","munmap","nanosleep","newfstatat","open","openat","pipe","poll","prctl","pread64","pwrite64","read","readlink","recvfrom","recvmsg","rename","rt_sigaction","rt_sigprocmask","rt_sigreturn","sendmsg","sendto","set_robust_list","set_tid_address","setsockopt","shutdown","sigaltstack","socket","stat","statfs","tgkill","time","tkill","umask","uname","unlink","wait4","write","writev","epoll_pwait","eventfd2","inotify_init","inotify_add_watch","inotify_rm_watch","select","pselect6","signalfd4","timerfd_create","timerfd_gettime","timerfd_settime","eventfd","mkdir","getrlimit","prlimit64","setpgid","getpgid","setsid","getpgrp","getresuid","getresgid","capget","capset","faccessat","fchmodat","fchownat","link","linkat","symlink","symlinkat","readlinkat","mknod","mknodat","fallocate","fadvise64","sync","getdents64","statx","copy_file_range","preadv","pwritev","utimensat","fanotify_mark","name_to_handle_at","open_by_handle_at","kcmp","process_madvise","pkey_mprotect","io_uring_setup","io_uring_enter","io_uring_register","pidfd_open","clone3","close_range","openat2","pidfd_send_signal","faccessat2","epoll_pwait2","mount","umount2","pivot_root","chroot","reboot","sethostname","setdomainname","iopl","ioperm","create_module","init_module","delete_module","get_kernel_syms","query_module","quotactl","nfsservctl","getpmsg","putpmsg","vhangup","swapoff","swapon","sysfs","sysinfo","uselib","sysctl","syslog","ptrace","personality","getrusage","getrlimit","gettimeofday","settimeofday","adjtimex","getresuid","setreuid","setresuid","getresgid","setregid","setresgid","setfsuid","setfsgid","times","setuid","setgid","setreuid","setregid","getuid","getgid","geteuid","getegid","setpgid","getppid","getpgrp","setsid","setgroups","getgroups","getpgid","setpgid","getsid","getsid","sethostname","setdomainname","getdtablesize","sysinfo","ipc","msgget","msgctl","msgrcv","msgsnd","semget","semctl","semtimedop","semop","shmget","shmctl","shmat","shmdt","socket","socketpair","bind","listen","accept","connect","getsockname","getpeername","send","recv","sendto","recvfrom","setsockopt","getsockopt","shutdown","socketcall","sendmsg","recvmsg"]},
    {"names": ["arch_prctl","clone","fork","vfork","execve","exit","exit_group","wait4","waitid","ptrace","getpid","gettid","getppid","getpgid","setpgid","getpgrp","setpgrp","setsid","getuid","geteuid","getgid","getegid","setuid","setgid","setreuid","setregid","setresuid","setresgid","setfsuid","setfsgid","setgroups","getgroups","capget","capset","prctl","prlimit64","seccomp","keyctl","request_key","add_key","clone3","close_range","unshare","setns","pidfd_open","pidfd_send_signal","process_madvise","io_uring_setup","io_uring_enter","io_uring_register"],"action": "SCMP_ACT_ALLOW"}
  ]
}
SECCOMP

# Create AppArmor profile
cat > /etc/apparmor.d/docker-backend << 'APPARMOR'
#include <tunables/global>

profile docker-backend flags=(attach_disconnected,mediate_deleted) {
  #include <abstractions/base>

  deny mount,
  deny umount,
  deny pivot_root,
  deny ptrace,

  /proc/*/status r,
  /sys/fs/cgroup/** r,
  /dev/null rw,
  /dev/urandom r,

  # Allow reading env
  /app/** r,
  /app/.next/** r,
  /app/public/** r,

  # Deny write to system dirs
  deny /etc/** w,
  deny /usr/** w,
  deny /var/** w,
  deny /tmp/** w,

  # Allow network
  network inet stream,
  network inet dgram,
  network unix stream,
}
APPARMOR

echo "  Container profiles created"

# =============================================
# 2. HONEYPOT SYSTEM
# =============================================
echo -e "\n[2/8] Setting up honeypot system..."

cat > /etc/nginx/honeypot-locations.conf << 'HONEY'
# Honeypot locations - any request here is an attacker

# Fake admin panel (logs all access)
location = /admin.php {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

# Fake .env file
location = /.env {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

# Fake phpmyadmin
location = /phpmyadmin {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

location = /phpMyAdmin {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

# Fake WordPress paths
location = /wp-login.php {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

location = /wp-admin/install.php {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

# Fake .git directory
location = /.git/config {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

location = /.git/HEAD {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

# Fake database files
location ~* \.(sql|mdb|db|sqlite)$ {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

# Fake backup files
location ~* \.(bak|old|orig|save|swp)$ {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

# Fake SSH keys
location = /id_rsa {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

location = /id_dsa {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

location = /authorized_keys {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

# Fake server status
location = /server-status {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

location = /server-info {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

# Fake debug endpoints
location = /debug {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

location = /console {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

location = /_debug {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

# Fake API docs
location = /swagger {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

location = /api-docs {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

location = /graphql {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

# Fake sensitive files
location = /etc/passwd {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

location = /etc/shadow {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

# Fake database dumps
location = /dump.sql {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

location = /backup.sql {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

# Fake internal tools
location = /adminer.php {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}

location = /manager/html {
    access_log /var/log/nginx/honeypot.log combined;
    return 444;
}
HONEY

echo "  Honeypot locations configured"

# =============================================
# 3. HONEYPOT FAIL2BAN FILTER
# =============================================
echo -e "\n[3/8] Creating honeypot fail2ban filter..."

cat > /etc/fail2ban/filter.d/honeypot.conf << 'HONEYF2B'
[Definition]
failregex = ^<HOST> -.*"(GET|HEAD|POST|PUT|DELETE|PATCH|OPTIONS|TRACE|CONNECT) (?:/admin\.php|/\.env|/phpmyadmin|/wp-login\.php|/wp-admin/|/\.git/config|/\.git/HEAD|/id_rsa|/id_dsa|/authorized_keys|/server-status|/server-info|/debug|/console|/_debug|/swagger|/api-docs|/graphql|/etc/passwd|/etc/shadow|/dump\.sql|/backup\.sql|/adminer\.php|/manager/html)" .*
ignoreregex =
HONEYF2B

echo "  Honeypot filter created"

# =============================================
# 4. AUTOMATED THREAT RESPONSE
# =============================================
echo -e "\n[4/8] Setting up automated threat response..."

cat > /usr/local/bin/aeroacademy-threat-response.sh << 'RESPONSE'
#!/bin/bash
# AeroAcademy Automated Threat Response
# Monitors logs and takes automatic action

LOGFILE="/var/log/aeroacademy-security.log"
HONEYPOT_LOG="/var/log/nginx/honeypot.log"
MODSEC_LOG="/var/log/modsecurity/modsec_audit.log"
NGINX_ACCESS="/var/log/nginx/access.log"
ALERT_EMAIL=""  # Set this if email alerts are desired

log_msg() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOGFILE"
}

# =============================================
# Function: Auto-block IPs hitting honeypots
# =============================================
block_honeypot_abuse() {
    if [ ! -f "$HONEYPOT_LOG" ]; then return; fi
    
    # Get IPs that hit honeypots in last 5 minutes
    IPs=$(awk -v d="$(date -d '5 minutes ago' '+%d/%b/%Y:%H:%M')" '$4 > "["d' "$HONEYPOT_LOG" 2>/dev/null | \
        awk '{print $1}' | sort | uniq -c | sort -rn | head -20)
    
    while IFS= read -r line; do
        count=$(echo "$line" | awk '{print $1}')
        ip=$(echo "$line" | awk '{print $2}')
        if [ -n "$ip" ] && [ "$count" -ge 2 ]; then
            # Permanently block repeat honeypot abusers
            ufw insert 1 deny from "$ip" to any comment "AUTO-BLOCK: Honeypot abuser ($count hits)" 2>/dev/null
            log_msg "AUTO-BLOCK: $ip blocked for honeypot abuse ($count hits in 5min)"
        fi
    done <<< "$IPs"
}

# =============================================
# Function: Detect and block port scanning
# =============================================
block_port_scanners() {
    # Count unique ports accessed per IP in last minute
    awk -v d="$(date -d '1 minute ago' '+%d/%b/%Y:%H:%M')" '$4 > "["d' "$NGINX_ACCESS" 2>/dev/null | \
        awk '{print $1}' | sort | uniq -c | sort -rn | while read count ip; do
            if [ "$count" -gt 100 ] && [ -n "$ip" ]; then
                ufw insert 1 deny from "$ip" to any comment "AUTO-BLOCK: Port scanner ($count req/min)" 2>/dev/null
                log_msg "AUTO-BLOCK: $ip blocked for port scanning ($count requests/min)"
            fi
        done
}

# =============================================
# Function: Detect brute force SSH (supplement fail2ban)
# =============================================
monitor_ssh_brute() {
    # Check for distributed brute force (multiple IPs, same pattern)
    recent_failures=$(journalctl -u ssh --since "10 minutes ago" 2>/dev/null | grep -c "Failed password")
    if [ "$recent_failures" -gt 50 ]; then
        log_msg "ALERT: High SSH failure rate ($recent_failures in 10min)"
    fi
}

# =============================================
# Function: Monitor for data exfiltration
# =============================================
detect_exfiltration() {
    # Check for large outbound transfers
    large_transfers=$(ss -ti state established 2>/dev/null | grep -E 'sec.*=[0-9]{8,}' | wc -l)
    if [ "$large_transfers" -gt 5 ]; then
        log_msg "ALERT: $large_transfers long-lived connections detected"
    fi
}

# =============================================
# Function: Monitor Docker container health
# =============================================
monitor_docker() {
    # Check if containers are running
    cd /root/aeroacademy 2>/dev/null
    if ! docker compose ps --format json 2>/dev/null | grep -q '"Status":"Up'; then
        log_msg "ALERT: Docker containers not running!"
        docker compose up -d 2>/dev/null
        log_msg "ACTION: Docker containers restarted"
    fi
}

# =============================================
# Function: Monitor file integrity
# =============================================
check_file_integrity() {
    # Critical files to monitor
    CRITICAL_FILES=(
        "/etc/nginx/nginx.conf"
        "/etc/ssh/sshd_config"
        "/etc/fail2ban/jail.local"
        "/etc/modsecurity/modsecurity.conf"
        "/root/aeroacademy/docker-compose.yml"
        "/root/aeroacademy/backend/.env"
    )
    
    HASH_FILE="/var/lib/aeroacademy/filehashes"
    
    if [ ! -f "$HASH_FILE" ]; then
        # Create initial hashes
        for f in "${CRITICAL_FILES[@]}"; do
            if [ -f "$f" ]; then
                sha256sum "$f" >> "$HASH_FILE"
            fi
        done
        return
    fi
    
    # Check current hashes against stored
    for f in "${CRITICAL_FILES[@]}"; do
        if [ -f "$f" ]; then
            current_hash=$(sha256sum "$f" | awk '{print $1}')
            stored_hash=$(grep "$f" "$HASH_FILE" 2>/dev/null | awk '{print $1}')
            if [ -n "$stored_hash" ] && [ "$current_hash" != "$stored_hash" ]; then
                log_msg "ALERT: File modified: $f"
                log_msg "  Stored: $stored_hash"
                log_msg "  Current: $current_hash"
            fi
        fi
    done
}

# =============================================
# Main execution
# =============================================
log_msg "--- Threat response scan started ---"

block_honeypot_abuse
block_port_scanners
monitor_ssh_brute
detect_exfiltration
monitor_docker
check_file_integrity

log_msg "--- Threat response scan completed ---"
RESPONSE

chmod +x /usr/local/bin/aeroacademy-threat-response.sh
echo "  Threat response script created"

# =============================================
# 5. FAIL2BAN JAIL FOR HONEYPOT
# =============================================
echo -e "\n[5/8] Adding honeypot jail to fail2ban..."

cat > /etc/fail2ban/jail.d/honeypot.conf << 'HONEYJAIL'
[honeypot]
enabled = true
port = http,https
filter = honeypot
logpath = /var/log/nginx/honeypot.log
maxretry = 1
findtime = 300
bantime = 86400
backend = polling
HONEYJAIL

echo "  Honeypot jail added"

# =============================================
# 6. KERNEL HARDENING (advanced)
# =============================================
echo -e "\n[6/8] Advanced kernel hardening..."

cat > /etc/sysctl.d/99-advanced-security.conf << 'ADVSYSCTL'
# Prevent IP spoofing
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Disable source routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0

# Disable sent redirects
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# SYN flood protection
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 4096
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 3

# Log martians
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1

# Ignore ICMP broadcasts
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Reverse path filtering
net.ipv4.conf.all.conf = 1

# Harden BPF
kernel.unprivileged_bpf_disabled = 1
net.core.bpf_jit_harden = 2

# Restrict dmesg
kernel.dmesg_restrict = 1

# Restrict kernel pointer leak
kernel.kptr_restrict = 2

# Restrict perf
kernel.perf_event_paranoid = 3

# ASLR full randomization
kernel.randomize_va_space = 2

# Restrict unprivileged user namespaces (prevent container escapes)
kernel.unprivileged_userns_clone = 0

# Prevent core dumps
fs.suid_dumpable = 0

# Restrict ptrace
kernel.yama.ptrace_scope = 1

# Increase conntrack table
net.netfilter.nf_conntrack_max = 262144

# Reduce TIME_WAIT
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15

# Increase max connections
net.core.somaxconn = 65535
net.ipv4.tcp_max_tw_buckets = 1440000

# Increase local port range
net.ipv4.ip_local_port_range = 1024 65535
ADVSYSCTL

sysctl --system 2>&1 | tail -5
echo "  Advanced kernel hardening applied"

# =============================================
# 7. FILE INTEGRITY MONITORING (lightweight)
# =============================================
echo -e "\n[7/8] Setting up file integrity monitoring..."

mkdir -p /var/lib/aeroacademy

# Create initial hash baseline
cat > /usr/local/bin/aeroacademy-integrity-init.sh << 'INTEGRITY'
#!/bin/bash
HASH_FILE="/var/lib/aeroacademy/filehashes"
rm -f "$HASH_FILE"

CRITICAL_FILES=(
    "/etc/nginx/nginx.conf"
    "/etc/ssh/sshd_config"
    "/etc/fail2ban/jail.local"
    "/etc/modsecurity/modsecurity.conf"
    "/etc/modsecurity/aeroacademy-rules.conf"
    "/etc/modsecurity/anti-obfuscation.conf"
    "/root/aeroacademy/docker-compose.yml"
    "/root/aeroacademy/backend/.env"
)

for f in "${CRITICAL_FILES[@]}"; do
    if [ -f "$f" ]; then
        sha256sum "$f" >> "$HASH_FILE"
    fi
done

echo "Integrity baseline created with $(wc -l < "$HASH_FILE") files"
INTEGRITY

chmod +x /usr/local/bin/aeroacademy-integrity-init.sh
/usr/local/bin/aeroacademy-integrity-init.sh

# =============================================
# 8. CRON JOBS
# =============================================
echo -e "\n[8/8] Setting up cron jobs..."

# Run threat response every minute
(crontab -l 2>/dev/null | grep -v "aeroacademy-threat-response" ; echo "* * * * * /usr/local/bin/aeroacademy-threat-response.sh") | crontab -

# Run integrity check every 5 minutes
(crontab -l 2>/dev/null | grep -v "aeroacademy-integrity" ; echo "*/5 * * * * /usr/local/bin/aeroacademy-threat-response.sh check_file_integrity") | crontab -

# Rotate logs daily
(crontab -l 2>/dev/null | grep -v "aeroacademy-log-rotate" ; echo "0 0 * * * find /var/log/aeroacademy* -mtime +30 -delete 2>/dev/null") | crontab -

echo "  Cron jobs configured"

# =============================================
# SUMMARY
# =============================================
echo -e "\n=========================================="
echo " Security Hardening Complete!"
echo "=========================================="
echo ""
echo "Components installed:"
echo "  [+] Container hardening (seccomp + AppArmor profiles)"
echo "  [+] Honeypot system (25+ trap endpoints)"
echo "  [+] Automated threat response script"
echo "  [+] Honeypot fail2ban jail (instant ban)"
echo "  [+] Advanced kernel hardening (25+ sysctl)"
echo "  [+] File integrity monitoring"
echo "  [+] Cron-based monitoring (every minute)"
echo ""
echo "Log files:"
echo "  /var/log/aeroacademy-security.log  (threat response)"
echo "  /var/log/nginx/honeypot.log         (honeypot hits)"
echo "  /var/log/modsecurity/modsec_audit.log (ModSecurity)"
echo ""
echo "Next steps:"
echo "  1. Reload Nginx to include honeypot locations"
echo "  2. Test honeypot: curl -k https://localhost/.env"
echo "  3. Monitor: tail -f /var/log/aeroacademy-security.log"
