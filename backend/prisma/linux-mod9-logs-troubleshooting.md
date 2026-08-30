# Module 9 — Log Management and Troubleshooting


## What You'll Actually Do

Something broke. Users are complaining. You don't know what happened. You look at the logs, find the error, trace it back to the cause, and fix it. This is what you actually do as a sysadmin — not configure servers, but figure out why they stopped working.

## Where Logs Live

```bash
/var/log/syslog          # General system messages (Debian/Ubuntu)
/var/log/messages        # General system messages (RHEL/CentOS)
/var/log/auth.log        # Authentication events (sudo, SSH, login)
/var/log/dmesg           # Kernel ring buffer (hardware, drivers)
/var/log/nginx/          # Web server logs
  access.log             # Who connected, when, what they asked for
  error.log              # What went wrong
/var/log/postgresql/     # Database logs
```

## journalctl — The systemd Way

systemd captures all logs through journald.

**View all logs:**
```bash
journalctl
```

**Follow in real-time:**
```bash
journalctl -f
```

**Filter by service:**
```bash
journalctl -u nginx
journalctl -u nginx --since "1 hour ago"
journalctl -u nginx --since "2025-01-15 10:00" --until "2025-01-15 11:00"
```

**Filter by priority (severity):**
```bash
journalctl -p err       # errors only
journalctl -p warning   # warnings and above
```

**Boot logs:**
```bash
journalctl -b           # current boot
journalctl -b -1        # previous boot
```

**Disk usage:**
```bash
journalctl --disk-usage
# 1.2G    /var/log/journal/

# Limit size:
sudo journalctl --vacuum-size=500M
```

## Reading nginx Logs

**Access log (who asked for what):**
```bash
tail -f /var/log/nginx/access.log
# 10.0.0.5 - - [15/Jan/2025:10:30:00 +0000] "GET /api/v1/users HTTP/1.1" 200 1234 "-" "Mozilla/5.0"
```

Format: `IP - - [timestamp] "method path protocol" status size "referer" "user-agent"`

**Top IPs:**
```bash
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10
```

**Status codes:**
```bash
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn
# 15000 200
# 2340  404
# 567   500
```

**Error log:**
```bash
tail -50 /var/log/nginx/error.log
# [error] 842#842: *12345 open() "/var/www/myapp/favicon.ico" failed (2: No such file or directory)
```

**500 errors:**
```bash
grep " 500 " /var/log/nginx/access.log | tail -20
```

## auth.log — Security Events

**Failed SSH attempts:**
```bash
grep "Failed password" /var/log/auth.log | tail -20
```

**Successful logins:**
```bash
grep "Accepted" /var/log/auth.log
```

**sudo usage:**
```bash
grep "sudo" /var/log/auth.log | tail -20
```

## dmesg — Kernel and Hardware

```bash
dmesg | tail -20
# [  123.456] EXT4-fs (sda1): re-mounted. Opts: errors=remount-ro
# [  123.789] nginx: segfault at 7fff ip 00007f... sp 00007fff...
```

**OOM killer (out of memory):**
```bash
dmesg | grep -i "oom"
# [456.789] Out of memory: Killed process 1337 (python) total-vm:4096000kB
```

When your app disappears and you see this, it ran out of memory and the kernel killed it.

## Troubleshooting Flow

**1. Check service status:**
```bash
systemctl status myapp
```

**2. Check recent logs:**
```bash
journalctl -u myapp --since "10 minutes ago" -p err
```

**3. Check system logs for broader issues:**
```bash
dmesg | tail -20
journalctl --since "1 hour ago" -p err
```

**4. Check resource usage:**
```bash
free -h        # memory
df -h          # disk
top            # CPU
```

**5. Check network:**
```bash
ss -tlnp       # what's listening
ufw status     # firewall rules
```

**6. Check recent changes:**
```bash
history | tail -30
ls -lt /etc/nginx/ | head -5
```

## Real Task: Debug a Crashed App

Your app is down. `systemctl status myapp` shows `failed`.

```bash
journalctl -u myapp --no-pager -n 30
# [ERROR] 2025-01-15 10:30:00 - Connection refused: localhost:5432
# [ERROR] 2025-01-15 10:30:00 - Could not connect to database
```

PostgreSQL is down:
```bash
systemctl status postgresql
# Active: inactive (dead)
```

Why?
```bash
journalctl -u postgresql --since "30 minutes ago"
# LOG: could not bind IPv6 address "::1": Address already in use
# HINT: Is another postmaster already running on port 5432?
```

Something else is on port5432:
```bash
ss -tlnp | grep :5432
# LISTEN  0  128  127.0.0.1:5432  ... users:(("redis-server",pid=999,fd=6))
```

Redis is running on PostgreSQL's port. Fix the config and restart both.

## Log Rotation

Logs grow. `logrotate` keeps them in check.

```bash
cat /etc/logrotate.d/nginx
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 $(cat /var/run/nginx.pid)
    endscript
}
```

- `daily` — rotate every day
- `rotate 14` — keep14 days
- `compress` — gzip old logs
- `create 0640 www-data adm` — create new log with these permissions

## Assessment

**Lab task (20 min):**

1. Find the last10 failed login attempts in auth.log
2. List all nginx access log entries with status code500
3. Check journalctl for any errors in the last hour
4. Check dmesg for OOM killer events
5. Diagnose: a service is "active" but returning errors — find the cause in the logs
6. Set up logrotate for a custom log file

**Grading:**
- Failed logins found: 15%
- 500 errors identified: 20%
- journalctl errors checked: 15%
- OOM events checked: 10%
- Diagnosis completed: 30%
- logrotate configured: 10%

## Evidence

- **OutcomeEvidence:** `LIN-LO9 — Log Analysis & Troubleshooting`
- **Mastery:** `UserSkill: linux-troubleshooting`

## Unlock

Module10 — System Hardening Basics. You can find and fix problems. Now you learn how to prevent them.

## Sources

- `man journalctl`, `man dmesg`, `man logrotate`
- `man tail`, `man grep`

