# Module 9 — Log Management and Troubleshooting

## Why This Matters

Logs are the pulse of a Linux server. Every service, every kernel event, every authentication attempt writes to a log file. When something breaks — a service crashes, a server becomes unreachable, an application throws errors — the logs are where you start. But logs are only useful if you can find the right information in them, and if they are being collected and retained properly.

This module covers the logging infrastructure on Linux: journald, rsyslog, logrotate, and the common log files you will encounter. More importantly, it covers the methodology of troubleshooting — how to go from "the server is down" to identifying the root cause using the evidence in the logs.

## journald: The Systemd Journal

On systems running systemd (virtually all modern Linux distributions), journald is the primary logging mechanism. It collects logs from the kernel, boot process, and all services, and stores them in a binary database at `/var/log/journal/`. This is different from traditional syslog, which writes to plain text files.

The advantage of journald is that it indexes logs by service, priority, boot ID, and other metadata. This makes it fast to query specific subsets of logs.

### journalctl Basics

```bash
journalctl                                  # All logs (oldest first)
journalctl -r                                # Reverse order (newest first)
journalctl --no-pager                        # Do not paginate
journalctl -n 50                             # Last 50 lines
journalctl -f                                # Follow (like tail -f)
```

### Filtering by Service

```bash
journalctl -u nginx                          # Logs for the nginx service
journalctl -u nginx -u php-fpm               # Logs for multiple services
journalctl -u nginx --since "1 hour ago"     # nginx logs from the last hour
journalctl -u nginx --since "2024-01-15 10:00" --until "2024-01-15 11:00"
```

```bash
journalctl -u nginx --since "1 hour ago" --no-pager
```
```
Jan 15 10:30:01 web01 nginx[5678]: 2024/01/15 10:30:01 [notice] 5678#0: signal process started
Jan 15 10:30:01 web01 nginx[5678]: 2024/01/15 10:30:01 [info] 5678#0: using the "epoll" event method
Jan 15 10:30:01 web01 nginx[5678]: 2024/01/15 10:30:01 [info] 5678#0: start worker processes
Jan 15 10:30:01 web01 nginx[5678]: 2024/01/15 10:30:01 [info] 5678#0: start worker process 5679
Jan 15 10:30:01 web01 nginx[5678]: 2024/01/15 10:30:01 [info] 5678#0: start worker process 5680
```

The `--since` and `--until` parameters accept various formats:
- `"1 hour ago"`
- `"yesterday"`
- `"2024-01-15 10:00:00"`
- `"today"`
- `"5 minutes ago"`

### Filtering by Priority

journald assigns priority levels (same as syslog):

| Priority | Name | Meaning |
|----------|------|---------|
| 0 | emerg | System is unusable |
| 1 | alert | Action must be taken immediately |
| 2 | crit | Critical conditions |
| 3 | err | Error conditions |
| 4 | warning | Warning conditions |
| 5 | notice | Normal but significant conditions |
| 6 | info | Informational messages |
| 7 | debug | Debug-level messages |

```bash
journalctl -p err                            # Only error and above
journalctl -p err..emerg                     # Same thing (range syntax)
journalctl -p warning                        # Warnings and above
journalctl -p debug                          # Everything including debug
```

```bash
journalctl -u nginx -p err --since "today" --no-pager
```
```
Jan 15 10:45:22 web01 nginx[5680]: 2024/01/15 10:45:22 [error] 5680#0: *12345 connect() failed (111: Connection refused) while connecting to upstream
Jan 15 10:45:22 web01 nginx[5680]: 2024/01/15 10:45:22 [error] 5680#0: *12345 upstream: "http://127.0.0.1:8080/app"
Jan 15 11:12:05 web01 nginx[5679]: 2024/01/15 11:12:05 [error] 5679#0: *12389 open() "/var/www/html/favicon.ico" failed (2: No such file or directory)
```

Filtering by priority is one of the most useful features for troubleshooting. When you have thousands of log lines, you only care about errors and warnings.

### Filtering by Boot

```bash
journalctl -b                                # Current boot
journalctl -b -1                             # Previous boot
journalctl --list-boots                      # List all boots with timestamps
```

This is extremely useful after a crash or reboot. You can see what happened in the previous boot session, which is often where the crash information lives.

```bash
journalctl --list-boots
```
```
-1 4a4e5f6b7c8d9e0f Mon 2024-01-15 01:30:00 UTC—Mon 2024-01-15 05:53:00 UTC
 0 5b6c7d8e9f0a1b2c Mon 2024-01-15 05:53:01 UTC—Mon 2024-01-15 10:30:00 UTC
```

Boot `-1` ran from 1:30 AM to 5:53 AM. Boot `0` is the current session starting at 5:53 AM. If the server crashed at 5:53 AM, look at boot `-1` logs around that time.

### Kernel Messages

```bash
journalctl -k                                # Kernel messages only (same as dmesg)
journalctl -k -p err                         # Kernel errors only
journalctl -k --since "1 hour ago"           # Recent kernel messages
```

Kernel messages often contain hardware errors, out-of-memory events, and driver issues. They are the first place to look for OOM killer activity.

### Output Formats

```bash
journalctl -u nginx -o json                  # JSON format
journalctl -u nginx -o json-pretty           # Pretty JSON
journalctl -u nginx -o verbose               # All available fields
journalctl -u nginx -o short-iso             # ISO timestamp format
```

JSON output is useful for piping to other tools:

```bash
journalctl -u nginx -p err -o json | jq '.[] | {time: .__REALTIME_TIMESTAMP, message: .MESSAGE}'
```

### Disk Usage

journald stores logs in `/var/log/journal/`. On busy systems, this can consume significant disk space:

```bash
du -sh /var/log/journal/
```
```
1.2G    /var/log/journal/
```

Control the maximum size in `/etc/systemd/journald.conf`:

```ini
[Journal]
SystemMaxUse=500M
SystemMaxFileSize=50M
MaxRetentionSec=30day
Compress=yes
```

Restart journald after changing:

```bash
sudo systemctl restart systemd-journald
```

Manually vacuum old logs:

```bash
sudo journalctl --vacuum-size=500M          # Keep only 500MB
sudo journalctl --vacuum-time=30d           # Keep only 30 days
```

## rsyslog: Traditional System Logging

rsyslog is the traditional syslog implementation. On many systems, it works alongside journald, forwarding journald output to traditional log files. This is the case on Ubuntu and Debian.

### How It Works

rsyslog reads messages from:
- The Unix socket `/dev/log`
- The kernel log buffer
- Network (remote syslog)

It applies rules from `/etc/rsyslog.conf` and files in `/etc/rsyslog.d/` to route messages to files, databases, or remote servers.

### Common Rules

```bash
cat /etc/rsyslog.d/50-default.conf
```
```
# Log anything at priority info or higher to /var/log/syslog
*.*;auth,authpriv.none          /var/log/syslog

# Log auth messages to /var/log/auth.log
auth,authpriv.*                 /var/log/auth.log

# Log kernel messages to /var/log/kern.log
kern.*                          /var/log/kern.log

# Log cron messages to /var/log/cron.log
cron.*                          /var/log/cron.log
```

The syntax is: `facility.priority action`

Facilities:
- `auth` — authentication (login, sudo)
- `cron` — cron daemon
- `daemon` — generic daemon messages
- `kern` — kernel messages
- `mail` — mail server
- `user` — user-level messages
- `local0` through `local7` — custom facilities

Priorities: `emerg`, `alert`, `crit`, `err`, `warning`, `notice`, `info`, `debug`

Wildcards: `*` matches everything, `none` excludes

### Remote Logging

Forward logs to a central log server:

```bash
# On the client (/etc/rsyslog.d/remote.conf)
*.* @@logserver.internal:514         # TCP (reliable)
*.* @logserver.internal:514          # UDP (fast but lossy)
```

The `@@` prefix means TCP. The `@` prefix means UDP. Use TCP for reliability, UDP for speed.

```bash
# On the log server, enable receiving (/etc/rsyslog.d/receive.conf)
module(load="imtcp")
input(type="imtcp" port="514")

# Or for UDP:
module(load="imudp")
input(type="imudp" port="514")
```

Restart rsyslog on both ends:

```bash
sudo systemctl restart rsyslog
```

### Viewing Traditional Log Files

```bash
# Debian/Ubuntu
tail -f /var/log/syslog               # General system log
tail -f /var/log/auth.log             # Authentication log

# RHEL/CentOS
tail -f /var/log/messages             # General system log
tail -f /var/log/secure               # Authentication log

# Both
tail -f /var/log/kern.log            # Kernel log
tail -f /var/log/dmesg               # Boot messages
```

## logrotate: Managing Log Growth

Log files grow indefinitely without rotation. logrotate handles compression, rotation, and deletion of old logs. It runs as a cron job (usually daily) and processes all configured log files.

### Configuration

```bash
cat /etc/logrotate.d/nginx
```
```
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

Directives:

| Directive | Meaning |
|-----------|---------|
| `daily` | Rotate daily (also: `weekly`, `monthly`) |
| `rotate 14` | Keep 14 old log files |
| `compress` | Compress rotated files with gzip |
| `delaycompress` | Wait one rotation cycle before compressing |
| `missingok` | Do not error if the log file is missing |
| `notifempty` | Do not rotate empty files |
| `create 0640 www-data adm` | Create new log file with these permissions |
| `sharedscripts` | Run postrotate once for all matching files |
| `postrotate ... endscript` | Command to run after rotation |
| `dateext` | Use date as rotation suffix instead of numbers |
| `dateformat -%Y%m%d` | Date format for the suffix |

The `postrotate` script sends a signal to nginx telling it to reopen its log files. Without this, nginx continues writing to the old (now rotated) file. This is called "log reopening" and is necessary because most applications keep a file handle open.

### Manual Rotation

```bash
sudo logrotate -d /etc/logrotate.d/nginx    # Debug mode (dry run, shows what would happen)
sudo logrotate -f /etc/logrotate.d/nginx    # Force rotation now
```

The debug mode is essential for testing new configurations. It shows exactly what logrotate would do without making any changes.

### Custom logrotate Configurations

```bash
cat > /etc/logrotate.d/myapp <<EOF
/opt/myapp/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 deploy deploy
    dateext
    dateformat -%Y%m%d
    postrotate
        systemctl reload myapp > /dev/null 2>&1 || true
    endscript
}
EOF
```

The `dateext` and `dateformat` directives create rotated files with dates in their names (like `app.log-20240115.gz`) instead of numbers (like `app.log.1.gz`). This makes it easier to find logs from specific dates.

## Common Log Files

### /var/log/syslog (Debian/Ubuntu) or /var/log/messages (RHEL)

The general-purpose system log. Contains messages from various services and the kernel. This is the first file to check when something goes wrong.

```bash
tail -100 /var/log/syslog
```
```
Jan 15 10:30:01 web01 CRON[12345]: (root) CMD (test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.daily ))
Jan 15 10:30:15 web01 kernel: [45678.123] IPv6: ADDRCONF(NETDEV_UP): eth0: link is not ready
Jan 15 10:30:15 web01 nginx[5678]: 2024/01/15 10:30:15 [notice] 5678#0: signal process started
Jan 15 10:35:22 web01 app[6789]: [WARN] Memory usage at 85%
```

### /var/log/auth.log (Debian) or /var/log/secure (RHEL)

Authentication events — SSH logins, sudo usage, PAM failures. This is the first file to check when investigating unauthorized access.

```bash
grep "Failed password" /var/log/auth.log | tail -20
```
```
Jan 15 10:30:01 web01 sshd[2456]: Failed password for root from 203.0.113.50 port 45678 ssh2
Jan 15 10:30:01 web01 sshd[2456]: Failed password for root from 203.0.113.50 port 45678 ssh2
Jan 15 10:30:02 web01 sshd[2456]: Failed password for root from 203.0.113.50 port 45679 ssh2
```

```bash
# Successful logins
grep "Accepted" /var/log/auth.log | tail -10
```
```
Jan 15 10:35:22 web01 sshd[2500]: Accepted publickey for admin from 10.0.0.100 port 52341 ssh2: ED25519 SHA256:3xKj8...
Jan 15 11:00:15 web01 sudo: admin : TTY=pts/0 ; PWD=/home/admin ; USER=root ; COMMAND=/bin/systemctl restart nginx
```

### /var/log/kern.log

Kernel messages — hardware errors, driver issues, OOM killer activity. This is the first file to check for out-of-memory crashes.

```bash
grep -i "oom\|kill\|error" /var/log/kern.log | tail -20
```
```
Jan 15 10:45:22 web01 kernel: [45678.456] Out of memory: Kill process 3456 (python3) score 800 or sacrifice child
Jan 15 10:45:22 web01 kernel: [45678.456] Killed process 3456 (python3) total-vm:2048000kB, anon-rss:1536000kB
```

### dmesg

The kernel ring buffer — boot messages, hardware detection, and recent kernel events. Useful for diagnosing hardware issues and driver problems.

```bash
dmesg | tail -50                           # Recent kernel messages
dmesg -T | tail -50                        # Human-readable timestamps
dmesg -T | grep -i "error\|fail"          # Kernel errors
dmesg -T | grep -i "usb\|disk\|sd"        # Storage device events
```

### /var/log/nginx/

Nginx maintains separate access and error logs:

```bash
tail -20 /var/log/nginx/access.log
tail -20 /var/log/nginx/error.log
```

### /var/log/postgresql/

PostgreSQL logs:

```bash
ls /var/log/postgresql/
```
```
postgresql-15-main.log
postgresql-15-main.csv
```

## Troubleshooting Methodology

When a server or service is not working, follow this structured methodology. Do not randomly poke at things — follow the process.

### Step 1: Define the Problem

- What is the expected behavior?
- What is the actual behavior?
- When did the problem start?
- What changed recently? (deployments, config changes, updates)
- Is the problem reproducible?
- Is the problem affecting all users or only some?

Gathering this information before diving into logs prevents wasted time. If you know the problem started after a deployment at 3 AM, you know where to look.

### Step 2: Gather Information

Check the basics first. These commands give you a quick snapshot of system health:

```bash
# System-level
uptime                                    # How long has the server been up? Load average?
free -h                                   # Memory usage — is it exhausted?
df -h                                     # Disk usage — is a partition full?
top -bn1 | head -20                       # CPU and process overview — what is consuming resources?

# Service-level
systemctl status myapp                    # Is the service running?
journalctl -u myapp --since "1 hour ago"  # Recent service logs
systemctl is-failed myapp                 # Has the service failed?

# Network-level
ss -tlnp                                  # Is the service listening on the expected port?
ping -c 3 gateway                         # Basic connectivity
curl -s http://localhost:8080/health       # Is the application responding?

# Log-level
tail -100 /var/log/syslog                 # General system logs
grep -i "error\|fail" /var/log/syslog | tail -20
```

### Step 3: Form a Hypothesis

Based on the information gathered, form a hypothesis about the cause. Common causes and their symptoms:

| Symptom | Likely Cause |
|---------|-------------|
| Service not running | Process crashed or failed to start |
| Port not listening | Binding error, firewall, service not started |
| Disk usage 100% | Logs consuming space, temp files, large core dumps |
| Memory exhaustion | Application leak, OOM killer |
| Permission denied | File ownership, SELinux, ACLs |
| Configuration error | Syntax error in config file after change |
| Dependency unavailable | Database down, upstream server unreachable |
| High CPU load | Infinite loop, resource-intensive query, cryptocurrency miner |

### Step 4: Test the Hypothesis

```bash
# Example: Hypothesis is "disk is full"
df -h /                                    # Check disk usage
du -sh /var/log/*                         # Find what is consuming space
du -sh /var/log/* | sort -rh | head -10  # Top space consumers
lsof +L1                                  # Find deleted files still held open

# Example: Hypothesis is "port not listening"
ss -tlnp | grep :8080                     # Check if port is open
sudo iptables -L INPUT -n | grep 8080    # Check firewall
sudo systemctl status myapp               # Check service status
journalctl -u myapp -n 50                 # Check service logs

# Example: Hypothesis is "OOM killer"
dmesg -T | grep -i "oom\|kill"            # Check kernel messages
journalctl -k -p err                      # Check kernel errors
free -h                                   # Check available memory
```

### Step 5: Fix the Problem

```bash
# Example: Disk full — clean up old logs
sudo journalctl --vacuum-size=200M
sudo find /var/log -name "*.gz" -mtime +30 -delete
sudo logrotate -f /etc/logrotate.d/myapp

# Example: Service crashed — restart it
sudo systemctl restart myapp
sudo systemctl status myapp

# Example: Firewall blocking — add rule
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4
```

### Step 6: Verify the Fix

```bash
# Confirm the service is working
curl -s http://localhost:8080/health
# Confirm no errors in logs
journalctl -u myapp --since "5 min ago" -p err
# Confirm the resource issue is resolved
df -h /
free -h
```

### Step 7: Prevent Recurrence

- Fix the root cause (not just the symptom)
- Add monitoring for the condition that caused the problem
- Document the incident and the fix
- Update runbooks or alerting thresholds
- Consider automated remediation (logrotate, auto-restart, etc.)

## Real Scenario: Finding the Root Cause of a Server Crash

A production server went unresponsive at 3:47 AM. The on-call engineer received an alert and needs to determine what happened.

**Step 1: Check if the server is up.**

```bash
ssh admin@web-prod-01 "uptime"
```
```
 09:15:22 up 2 days,  3:22,  1 user,  load average: 0.45, 0.38, 0.35
```

The server rebooted 3 hours and 22 minutes ago. It crashed around 5:53 AM (based on uptime), which is close to the reported 3:47 AM. The discrepancy may be due to timezone differences.

**Step 2: Check what happened during the previous boot.**

```bash
ssh admin@web-prod-01 "journalctl --list-boots"
```
```
-1 4a4e5f6b7c8d9e0f Mon 2024-01-15 01:30:00 UTC—Mon 2024-01-15 05:53:00 UTC
 0 5b6c7d8e9f0a1b2c Mon 2024-01-15 05:53:01 UTC—Mon 2024-01-15 09:15:00 UTC
```

Boot `-1` is the previous session. It ran from 1:30 AM to 5:53 AM.

**Step 3: Check the kernel messages from the crash.**

```bash
ssh admin@web-prod-01 "journalctl -b -1 -k --since '05:40' --until '05:53' --no-pager"
```
```
Jan 15 05:47:22 web01 kernel: [12345.678] Out of memory: Kill process 3456 (python3) score 800 or sacrifice child
Jan 15 05:47:22 web01 kernel: [12345.678] Killed process 3456 (python3) total-vm:2048000kB, anon-rss:1536000kB
Jan 15 05:48:15 web01 kernel: [12438.912] Out of memory: Kill process 5678 (node) score 600 or sacrifice child
Jan 15 05:48:15 web01 kernel: [12438.912] Killed process 5678 (node) total-vm:1024000kB, anon-rss:768000kB
Jan 15 05:49:30 web01 kernel: [12514.234] Out of memory: Kill process 1234 (nginx: worker) score 200 or sacrifice child
Jan 15 05:49:30 web01 kernel: [12514.234] Killed process 1234 (nginx: worker) total-vm:256000kB, anon-rss:128000kB
Jan 15 05:50:01 web01 kernel: [12545.567] Out of memory: Invoked OOM killer
Jan 15 05:50:01 web01 kernel: [12545.890] Kernel panic - not syncing: Out of memory and no killable processes
```

The OOM killer was invoked multiple times between 5:47 and 5:50 AM. It killed processes to free memory, but eventually there were no more killable processes. The kernel panicked and the server rebooted.

**Step 4: Check application logs around the same time.**

```bash
ssh admin@web-prod-01 "journalctl -b -1 -u myapp --since '05:00' --until '05:53' --no-pager"
```
```
Jan 15 05:00:00 web01 myapp[3456]: [INFO] Memory usage: 72%
Jan 15 05:15:00 web01 myapp[3456]: [INFO] Memory usage: 78%
Jan 15 05:30:00 web01 myapp[3456]: [WARN] Memory usage: 85%
Jan 15 05:35:00 web01 myapp[3456]: [INFO] Processing 50000 request queue
Jan 15 05:40:00 web01 myapp[3456]: [WARN] Memory usage: 92%
Jan 15 05:45:00 web01 myapp[3456]: [ERROR] Memory allocation failed
Jan 15 05:47:22 web01 kernel: [12345.678] Out of memory: Kill process 3456 (python3)...
```

The application started processing a large request queue at 5:35 AM. Memory usage climbed from 85% to 92% to failure. This is the smoking gun.

**Step 5: Check what triggered the large request queue.**

```bash
ssh admin@web-prod-01 "journalctl -b -1 -u nginx --since '05:30' --until '05:40' --no-pager | grep -i 'upstream\|queue\|502'"
```
```
Jan 15 05:35:15 web01 nginx[1234]: 2024/01/15 05:35:15 [error] 1234#0: *98765 upstream timed out (110: Connection timed out)
Jan 15 05:35:15 web01 nginx[1234]: 2024/01/15 05:35:15 [error] 1234#0: *98765 upstream: "http://127.0.0.1:8080/api/process"
Jan 15 05:35:16 web01 nginx[1234]: 2024/01/15 05:35:16 [error] 1234#0: *98767 upstream timed out (110: Connection timed out)
```

The upstream application was timing out at 5:35 AM, causing nginx to queue requests instead of passing them through. The queue accumulated in memory.

**Step 6: Check what caused the upstream timeout.**

```bash
ssh admin@web-prod-01 "journalctl -b -1 --since '05:20' --until '05:40' | grep -i 'database\|postgres\|connection'"
```
```
Jan 15 05:25:00 web01 postgresql[2345]: LOG: checkpoint starting: time
Jan 15 05:32:00 web01 postgresql[2345]: LOG: checkpoint complete: wrote 890000 buffers (54%)
Jan 15 05:32:01 web01 postgresql[2345]: LOG: duration: 420123.456 ms  statement: VACUUM FULL analytics
```

A `VACUUM FULL` on the analytics table ran from approximately 5:25 AM to 5:32 AM (7 minutes). During this time, PostgreSQL held exclusive locks, blocking queries. The application's queries timed out, nginx queued the requests, memory filled up, and the OOM killer triggered a kernel panic.

**Step 7: Root cause and prevention.**

Root cause: A `VACUUM FULL` operation on the analytics table locked the database for 7 minutes, causing application query timeouts, request queuing, memory exhaustion, OOM kill, and kernel panic.

Prevention:
1. Schedule `VACUUM FULL` during maintenance windows, not during traffic hours.
2. Use regular `VACUUM` instead of `VACUUM FULL` (it does not require exclusive locks).
3. Set application query timeouts to prevent memory accumulation.
4. Configure OOM killer priorities to protect critical processes (`oom_score_adj`).
5. Add memory alerts at 80% to get early warning.
6. Set memory limits on the application via cgroups or systemd (`MemoryMax=`).

## Assessment

**Lab: Log Analysis and Troubleshooting (40 minutes)**

Scenario: A server has been experiencing intermittent issues. You need to analyze logs and identify the root cause.

**Tasks:**

1. Use `journalctl` to find all boots in the last 7 days and save the list to `/tmp/boot_history.txt`.
2. Find all error-level messages from the `nginx` service in the last 24 hours and save to `/tmp/nginx_errors.txt`.
3. Find all authentication failures in the last 24 hours and save to `/tmp/auth_failures.txt`.
4. Check the current disk usage of `/var/log/journal/` and report the size.
5. Configure journald to limit log storage to 500MB maximum and 30 days retention.
6. Create a logrotate configuration for `/opt/myapp/logs/*.log` that rotates daily, keeps 14 days, compresses old logs, and sends a reload signal to the myapp service.
7. Parse the system log to find the 10 most common error messages and save to `/tmp/top_errors.txt`.
8. Trace the timeline of a specific issue: find all log entries between 2:00 AM and 4:00 AM that contain "error", "fail", or "kill" (case-insensitive). Save to `/tmp/issue_timeline.txt`.
9. Using `dmesg`, check for any hardware errors or OOM killer invocations. Save to `/tmp/hardware_check.txt`.
10. Write a brief incident report (5-10 sentences) documenting your findings and save to `/tmp/incident_report.txt`.

**Grading Criteria:**

- Boot history listed: 5 points
- nginx errors found: 10 points
- Auth failures found: 10 points
- Journal disk usage checked: 5 points
- Journald configured correctly: 10 points
- logrotate configuration correct: 15 points
- Top errors identified: 10 points
- Issue timeline traced: 15 points
- Hardware check completed: 5 points
- Incident report written: 15 points

**Total: 100 points. Pass threshold: 70 points.**

## Evidence

After completing this lab, you should have:

- All output files saved in `/tmp/`.
- A working logrotate configuration.
- A configured journald with size limits.
- An incident report documenting a root cause analysis.
- Demonstrated ability to use journalctl, dmesg, grep, and text processing tools for log analysis.
