# Module 3: Processes and Systemd

## Why This Matters

Every running program on a Linux system is a process. A web server is a process. A cron job spawns a process. Your SSH session is a process. When something goes wrong: a service hangs, a process eats all your RAM, a cron job silently fails: you need to understand how Linux manages processes so you can diagnose and fix it.

This module covers how processes are created, tracked, prioritized, and killed. It also covers systemd, the init system that manages services, timers, and system state on virtually every modern Linux distribution. Between process management and systemd, you have the tools to keep a server running and debug it when it misbehaves.

## What a Process Actually Is

A process is a running instance of a program. When you execute `nginx`, the kernel loads the binary, allocates memory, sets up file descriptors, and creates a process. Each process gets a unique Process ID (PID) and inherits certain properties from its parent process.

The process hierarchy starts with PID 1, which is the init process (systemd on modern systems). Every other process is a descendant of PID 1. This parent-child relationship matters because when a parent process dies, its orphaned children are adopted by PID 1, and when a child process dies, its parent is notified (if the parent is paying attention via `wait()`).

### Process States

Processes exist in one of several states:

- **Running (R)**: The process is actively using the CPU or is ready to run.
- **Sleeping (S)**: The process is waiting for an event (disk I/O, network data, a signal). Most processes spend most of their time sleeping.
- **Disk Sleep (D)**: The process is waiting for disk I/O and cannot be interrupted, even by signals. If you see processes stuck in this state, you may have a disk problem.
- **Stopped (T)**: The process has been stopped by a signal (usually `Ctrl+Z` or `SIGSTOP`). It resumes when sent `SIGCONT`.
- **Zombie (Z)**: The process has exited but its parent has not yet called `wait()` to collect its exit status. Zombies consume no resources except a PID entry, but too many of them indicate a bug.

### Nice Values and Priorities

Every process has a nice value ranging from -20 (highest priority) to +19 (lowest priority). The name is counterintuitive: a "nicer" process yields more CPU time to others.

```bash
nice -n -5 ./heavy-computation.sh     # Run with higher priority (requires root)
nice -n 10 ./background-task.sh       # Run with lower priority
renice -n 5 -p 1234                   # Change priority of running process 1234
```

Most users can only increase the nice value (lower priority). Only root can decrease it (raise priority). This prevents regular users from starving system services of CPU time.

## Finding Processes

### ps: Process Snapshot

`ps` shows a snapshot of current processes. The two most common invocations:

```bash
ps aux
```
```
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.1 169432 11528 ?        Ss   Jan15   0:05 /sbin/init
root         2  0.0  0.0      0     0 ?        S    Jan15   0:00 [kthreadd]
root       342  0.0  0.1  72304  5760 ?        Ss   Jan15   0:00 /usr/sbin/sshd -D
root       567  0.0  0.2  20428 12288 ?        Ss   Jan15   0:01 /usr/sbin/apache2 -k start
www-data   568  0.1  0.3  327680 24576 ?       Sl   Jan15  12:34 /usr/sbin/apache2 -k start
www-data   569  0.0  0.3  327680 24576 ?       Sl   Jan15  11:22 /usr/sbin/apache2 -k start
admin     1234  0.0  0.0  10948  3584 pts/0    Ss   10:30   0:00 -bash
admin     1567  2.1  1.5 1456320 128000 ?      Sl   10:35   0:15 python3 app.py
```

The flags:
- `a`: show processes from all users
- `u`: show user/owner column and other details
- `x`: include processes not attached to a terminal

The key columns:
- `%CPU`: CPU usage percentage
- `%MEM`: memory usage percentage
- `RSS`: resident set size (actual physical memory used, in KB)
- `STAT`: process state (R=running, S=sleeping, Z=zombie, etc.)
- `COMMAND`: the command that started the process

For a tree view showing parent-child relationships:

```bash
ps -ef --forest
```
```
root         1     0  0  Jan15 ?        00:00:05 /sbin/init
root       342     1  0  Jan15 ?        00:00:00  \_ /usr/sbin/sshd -D
root      2456   342  0  10:30 ?        00:00:00      \_ sshd: admin [priv]
admin     2460  2456  0  10:30 pts/0    00:00:00          \_ -bash
root       567     1  0  Jan15 ?        00:00:01  \_ /usr/sbin/apache2 -k start
www-data   568   567  0  Jan15 ?        00:12:34      \_ /usr/sbin/apache2 -k start
www-data   569   567  0  Jan15 ?        00:11:22      \_ /usr/sbin/apache2 -k start
```

This makes it easy to see that `sshd` (PID 342) spawned a child `sshd` (PID 2456) which spawned a bash shell (PID 2460).

### top and htop: Real-Time Monitoring

`top` shows a live, updating view of processes:

```bash
top
```
```
top - 10:35:22 up 28 days,  3:15,  1 user,  load average: 0.52, 0.48, 0.45
Tasks: 187 total,   1 running, 186 sleeping,   0 stopped,   0 zombie
%Cpu(s):  2.3 us,  1.1 sy,  0.0 ni, 96.2 id,  0.3 wa,  0.0 hi,  0.1 si,  0.0 st
MiB Mem :  16008.4 total,   2341.2 free,   8923.4 used,   4743.8 buff/cache
MiB Swap:   4096.0 total,   4012.0 free,     84.0 used.   6543.2 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
   1567 admin     20   0 1456320 128000  8192 S   2.1   0.8  0:15.43 python3 app.py
    568 www-data  20   0  327680  24576 16384 S   0.7   0.2 12:34.12 apache2
    569 www-data  20   0  327680  24576 16384 S   0.7   0.2 11:22.08 apache2
      1 root      20   0  169432  11528  8192 S   0.0   0.1  0:05.12 systemd
```

The load average shows three numbers: 1-minute, 5-minute, and 15-minute averages. On a single-CPU system, a load average of 1.0 means the CPU is fully utilized. Above 1.0 means processes are queuing. On an 8-core system, a load average of 8.0 is fully saturated.

`htop` is a more user-friendly version with color, mouse support, and a tree view:

```bash
htop
```

Press `F5` for tree view, `F6` to sort by a column, `F9` to kill a process, and `F10` to quit.

### pgrep and pidof: Finding PIDs by Name

```bash
pgrep nginx
```
```
567
568
569
```

```bash
pgrep -l nginx
```
```
567 nginx
568 nginx
569 nginx
```

```bash
pidof nginx
```
```
569 568 567
```

`pgrep` supports regex patterns and is generally more flexible. `pidof` returns PIDs only and is simpler.

## Sending Signals

Signals are software interrupts that tell a process to do something. The most important signals:

| Signal | Number | Default Action | Description |
|--------|--------|----------------|-------------|
| SIGHUP | 1 | Terminate | Hangup: often means "reload configuration" |
| SIGINT | 2 | Terminate | Interrupt (Ctrl+C) |
| SIGQUIT | 3 | Core dump | Quit with core dump |
| SIGKILL | 9 | Terminate | Force kill: cannot be caught or ignored |
| SIGTERM | 15 | Terminate | Graceful termination: the polite "please stop" |
| SIGSTOP | 19 | Stop | Pause process (cannot be caught or ignored) |
| SIGCONT | 18 | Continue | Resume a stopped process |
| SIGUSR1 | 10 | Terminate | User-defined signal 1 |
| SIGUSR2 | 12 | Terminate | User-defined signal 2 |

### kill: Sending Signals to Processes

```bash
kill 1234                          # Send SIGTERM (default)
kill -9 1234                       # Send SIGKILL (force kill)
kill -HUP 1234                     # Send SIGHUP (reload config)
kill -USR1 1234                    # Send SIGUSR1
kill -TERM 1234                    # Explicit SIGTERM
```

### killall: Kill by Name

```bash
killall nginx                      # Send SIGTERM to all nginx processes
killall -9 python3                 # Force kill all python3 processes
killall -u www-data                # Kill all processes owned by www-data
```

### pkill: Kill by Pattern

```bash
pkill -f "python3 app.py"         # Kill processes matching the pattern
pkill -HUP -f "nginx"            # Reload nginx config
```

The `-f` flag matches against the full command line, not just the process name.

### The Graceful Shutdown Sequence

When you want to stop a process, always try SIGTERM first. It gives the process a chance to clean up: close files, flush buffers, release locks, notify peers. Only use SIGKILL as a last resort.

```bash
# Step 1: Ask nicely
kill 1234

# Step 2: Wait a few seconds
sleep 5

# Step 3: Check if it is still running
ps -p 1234 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Process still running, force killing..."
    kill -9 1234
else
    echo "Process terminated gracefully."
fi
```

SIGKILL cannot be caught, blocked, or ignored. The kernel simply stops the process immediately. Any unsaved data is lost. Any locks it held are released (but cleanup handlers do not run).

### SIGHUP: The Reload Signal

Many daemons interpret SIGHUP as "reload configuration." This is useful because you can change a config file and apply it without restarting the process (and dropping connections).

```bash
# Reload nginx
kill -HUP $(cat /var/run/nginx.pid)

# Or equivalently
nginx -s reload
```

Not all daemons handle SIGHUP this way. Check the documentation for the specific service.

## systemd: The Init System

On virtually all modern Linux distributions (Ubuntu, Debian, CentOS, Fedora, RHEL, Arch), systemd is PID 1 and manages system services, mounts, timers, and system state.

### systemd Units

A unit is a systemd object that describes a system resource. The most common unit types:

- **service**: a daemon or background process (nginx, sshd, postgresql)
- **socket**: a socket for socket-activated services
- **timer**: a cron-like scheduler
- **mount**: a filesystem mount point
- **target**: a group of units that define system state (like runlevels)

Unit files live in three directories, in order of precedence:

1. `/etc/systemd/system/`: administrator-created units (highest priority)
2. `/run/systemd/system/`: runtime units (created by the system)
3. `/usr/lib/systemd/system/`: distribution-provided units (lowest priority)

### systemctl: The Control Interface

`systemctl` is the command-line tool for interacting with systemd.

**Managing services:**

```bash
sudo systemctl start nginx          # Start nginx
sudo systemctl stop nginx           # Stop nginx
sudo systemctl restart nginx        # Restart (stop + start)
sudo systemctl reload nginx         # Reload configuration (send SIGHUP or equivalent)
sudo systemctl status nginx         # Check status
```

```bash
sudo systemctl status nginx
```
```
● nginx.service - A high performance web server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
     Active: active (running) since Mon 2024-01-15 10:30:00 UTC; 2 days ago
       Docs: man:nginx(8)
    Process: 342 ExecStartPre=/usr/sbin/nginx -t (code=exited, status=0/SUCCESS)
    Process: 343 ExecStart=/usr/sbin/nginx (code=exited, status=0/SUCCESS)
   Main PID: 344 (nginx)
      Tasks: 5 (limit: 4611)
     Memory: 12.4M
        CPU: 1.234s
     CGroup: /system.slice/nginx.service
             ├─344 nginx: master process /usr/sbin/nginx
             ├─345 nginx: worker process
             ├─346 nginx: worker process
             ├─347 nginx: worker process
             └─348 nginx: worker process
```

Key output: `Active: active (running)` tells you the service is up. `enabled` in the Loaded line means it starts on boot. The CGroup section shows all the worker processes.

**Enabling/disabling on boot:**

```bash
sudo systemctl enable nginx         # Start nginx on boot
sudo systemctl disable nginx        # Do not start nginx on boot
sudo systemctl enable --now nginx   # Enable and start in one command
```

**Checking service state:**

```bash
sudo systemctl is-active nginx      # "active" or "inactive"
sudo systemctl is-enabled nginx     # "enabled" or "disabled"
sudo systemctl is-failed nginx      # "active", "inactive", or "failed"
```

**Listing services:**

```bash
systemctl list-units --type=service                     # All loaded services
systemctl list-units --type=service --state=running     # Running services
systemctl list-unit-files --type=service                # All available services
systemctl list-units --type=service --state=failed      # Failed services
```

### Writing a Custom Service Unit

You will often need to create a systemd unit for an application that does not provide one. Here is a unit file for a Python application at `/opt/myapp/app.py`:

```ini
# /etc/systemd/system/myapp.service

[Unit]
Description=My Python Application
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/venv/bin/python3 app.py
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=DATABASE_URL=postgresql://localhost/myapp
Environment=SECRET_KEY=changeme

[Install]
WantedBy=multi-user.target
```

After creating the file:

```bash
sudo systemctl daemon-reload        # Reload unit files
sudo systemctl enable --now myapp   # Enable and start
sudo systemctl status myapp         # Verify
```

Key directives:

- `After=network.target`: start after the network is up
- `Requires=postgresql.service`: if postgresql fails, myapp fails too
- `Type=simple`: the command in ExecStart is the main process
- `Restart=on-failure`: restart automatically if the process exits with an error
- `RestartSec=10`: wait 10 seconds before restarting
- `StandardOutput=journal`: send stdout to the journal

### systemd Timers

Timers replace cron for scheduling recurring tasks. Here is a timer that runs a backup script every day at 2 AM:

```ini
# /etc/systemd/system/backup.timer

[Unit]
Description=Daily backup timer

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/backup.service

[Unit]
Description=Daily backup

[Service]
Type=oneshot
User=root
ExecStart=/opt/scripts/backup.sh
```

Enable the timer:

```bash
sudo systemctl enable --now backup.timer
```

Check the timer:

```bash
systemctl list-timers --all
```
```
NEXT                        LEFT     LAST                        PASSED   UNIT          ACTIVATES
Tue 2024-01-16 02:00:00 UTC 15h left Mon 2024-01-15 02:00:00 UTC 9h ago   backup.timer  backup.service
```

The `Persistent=true` directive ensures that if the system was off at 2 AM, the backup runs when the system comes back up.

Timer expressions:

- `OnCalendar=daily`: once per day at midnight
- `OnCalendar=*-*-* 02:00:00`: every day at 2 AM
- `OnCalendar=hourly`: once per hour
- `OnCalendar=*-*-01 00:00:00`: first day of every month
- `OnBootSec=5min`: 5 minutes after boot
- `OnUnitActiveSec=1h`: 1 hour after the unit last activated

Check when a timer last ran and when it will next run:

```bash
systemctl show backup.timer --property=LastTriggerUSec,NextTriggerUSec
```

### systemd Targets

Targets group units and define system states. They are the modern equivalent of runlevels:

```bash
# List all targets
systemctl list-units --type=target

# List active targets
systemctl list-units --type=target --state=active
```

Targets group units and define system states:

```bash
sudo systemctl isolate multi-user.target    # Switch to multi-user mode
sudo systemctl set-default multi-user.target # Set default boot target
sudo systemctl get-default                   # Show current default target
```

Common targets:

- `multi-user.target`: non-graphical, multi-user (servers)
- `graphical.target`: graphical desktop
- `rescue.target`: single-user mode for maintenance
- `emergency.target`: minimal system for emergency repairs

## Debugging a Runaway Process

Here is a realistic debugging scenario. A Python web application on port 8080 is consuming 100% CPU and not responding to requests.

**Step 1: Identify the offending process.**

```bash
top -bn1 | head -20
```
```
top - 14:22:05 up 45 days,  3:22,  2 users,  load average: 7.85, 6.23, 4.12
Tasks: 189 total,   3 running, 186 sleeping,   0 stopped,   0 zombie
%Cpu(s): 98.1 us,  1.2 sy,  0.0 ni,  0.3 id,  0.1 wa,  0.0 hi,  0.3 si,  0.0 st
MiB Mem :  16008.4 total,    234.2 free,  14567.2 used,   1207.0 buff/cache
MiB Swap:   4096.0 total,      0.0 free,   4096.0 used.   1023.4 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
   3456 deploy    20   0 1823456 1.4g  16384 R 100.0  8.9  45:12.34 python3 app.py
```

Load average is 7.85 on an 8-core system: almost saturated. PID 3456 is consuming 100% of one core and 1.4GB of RAM.

**Step 2: Find out what this process is doing.**

```bash
ls -la /proc/3456/exe
```
```
lrwxrwxrwx 1 root root 0 Jan 15 10:30 /proc/3456/exe -> /usr/bin/python3
```

```bash
cat /proc/3456/cmdline | tr '\0' ' '
```
```
python3 app.py
```

```bash
ls -la /proc/3456/cwd
```
```
lrwxrwxrwx 1 deploy deploy 0 Jan 15 10:30 /proc/3456/cwd -> /opt/myapp
```

It is `python3 app.py` running from `/opt/myapp`.

**Step 3: Check if the application is managed by systemd.**

```bash
systemctl status myapp
```
```
● myapp.service - My Python Application
     Loaded: loaded (/etc/systemd/system/myapp.service; enabled)
     Active: active (running) since Mon 2024-01-10 10:30:00 UTC; 5 days ago
   Main PID: 3456 (python3)
```

It is a systemd service. This means we can restart it cleanly.

**Step 4: Try to get a stack trace before killing it.**

```bash
sudo gdb -p 3456 -batch -ex "thread apply all bt" 2>/dev/null
```

This may show you where the process is stuck. For Python, you can also use:

```bash
sudo py-spy dump --pid 3456
```

**Step 5: Restart the service.**

```bash
sudo systemctl restart myapp
```

**Step 6: Verify the restart.**

```bash
sudo systemctl status myapp
```
```
● myapp.service - My Python Application
     Loaded: loaded (/etc/systemd/system/myapp.service; enabled)
     Active: active (running) since Mon 2024-01-15 14:25:00 UTC; 5s ago
   Main PID: 4567 (python3)
```

```bash
top -bn1 | grep python3
```
```
  4567 deploy    20   0  823456 64000  8192 S   2.3   0.4  0:00.15 python3 app.py
```

CPU usage dropped from 100% to 2.3%. The issue is resolved (temporarily: you still need to find the root cause).

**Step 7: Investigate logs for the root cause.**

```bash
journalctl -u myapp --since "1 hour ago" --no-pager
```

This may reveal an infinite loop, a deadlock recovery loop, or a misbehaving dependency.

**Step 8: Set resource limits to prevent recurrence.**

If the application is known to be memory-hungry, set limits in the systemd unit:

```ini
[Service]
MemoryMax=1G
MemoryHigh=800M
CPUQuota=200%
```

This caps the application at 1GB of memory and 200% of one CPU core (2 full cores). If it exceeds these limits, the kernel throttles or kills it, preventing a system-wide crash.

### Understanding Load Average

The load average numbers in `uptime` and `top` represent the average number of processes in the run queue (waiting for CPU) over 1, 5, and 15 minutes:

```bash
uptime
```
```
 10:35:22 up 28 days,  3:15,  1 user,  load average: 0.52, 0.48, 0.45
```

- On a single-CPU system, a load average of 1.0 means the CPU is fully utilized
- On an 8-core system, a load average of 8.0 means all cores are fully utilized
- A load average above the number of cores means processes are queuing

If the 1-minute average is higher than the 15-minute average, load is increasing. If it is lower, load is decreasing.

```bash
# Compare load to number of cores
cores=$(nproc)
load=$(awk '{print $1}' /proc/loadavg)
echo "Load: $load, Cores: $cores"
if (( $(echo "$load > $cores" | bc -l) )); then
    echo "WARNING: System is overloaded"
fi
```

### Identifying Zombie Processes

Zombies are processes that have exited but whose parent has not yet collected their exit status. They consume no resources except a PID entry, but too many of them indicate a bug.

```bash
# Find zombie processes
ps aux | awk '$8 ~ /Z/ {print}'
```
```
root      1234  0.0  0.0      0     0 ?        Z    10:30   0:00 [defunct]
root      1235  0.0  0.0      0     0 ?        Z    10:31   0:00 [defunct]
```

To fix zombies:
1. Find the parent process: `ps -o pid,ppid,stat,cmd -p 1234`
2. Send SIGCHLD to the parent to encourage it to reap children: `kill -SIGCHLD <parent_pid>`
3. If that does not work, restart the parent service
4. If the parent is init (PID 1), the zombie will be cleaned up on the next init cycle

### Controlling cgroups with systemd

systemd automatically places services in cgroups, which control resource allocation:

```bash
# View the cgroup tree
systemd-cgls

# Check resource limits for a service
systemctl show myapp --property=MemoryMax,CPUQuota,IOReadBandwidthMax
```

You can set resource limits in the service unit:

```ini
[Service]
MemoryMax=2G
MemoryHigh=1.5G
CPUQuota=150%
IOReadBandwidthMax=/dev/sda 100M
TasksMax=512
```

These limits prevent a single service from consuming all system resources. Without them, a runaway process can bring down the entire server.

## Assessment

**Lab: Process Management and Systemd (35 minutes)**

Scenario: A test server has several services running. Some are misbehaving, and you need to diagnose and fix them using process management and systemd tools.

**Tasks:**

1. List all running processes sorted by memory usage (highest first) and save the output to `/tmp/mem_usage.txt`.
2. Find all processes owned by the `www-data` user and list their PIDs and command names.
3. A process named `rogue.sh` is consuming excessive CPU. Find its PID, send it SIGTERM, wait 5 seconds, and verify it stopped. If it did not stop, send SIGKILL.
4. Create a systemd service unit for a script at `/opt/scripts/worker.sh`. The service should:
   - Run as the `deploy` user
   - Restart on failure with a 15-second delay
   - Log output to the journal
   - Start after `network.target`
5. Enable and start the service. Verify it is running.
6. Modify the service unit to add an environment variable `WORKER_THREADS=4`. Reload and restart the service.
7. Create a systemd timer that runs the worker service every 30 minutes.
8. Check the load average and identify the top 5 CPU-consuming processes.
9. Stop the worker service and timer, and disable them.
10. Document all your commands and outputs in `/tmp/process_lab.txt`.

**Grading Criteria:**

- Process list saved correctly: 10 points
- www-data processes listed: 5 points
- rogue.sh killed gracefully (SIGTERM first, SIGKILL if needed): 15 points
- Service unit created with correct directives: 20 points
- Service enabled, started, and verified: 10 points
- Environment variable added and service reloaded: 10 points
- Timer created and configured: 10 points
- Load average checked and top processes identified: 5 points
- Service and timer cleaned up: 5 points
- Documentation complete: 10 points

**Total: 100 points. Pass threshold: 70 points.**

## Evidence

After completing this lab, you should have:

- Demonstrated ability to find processes by name, user, and resource usage.
- Properly killed a runaway process using the SIGTERM-then-SIGKILL approach.
- Created and configured a systemd service unit from scratch.
- Created a systemd timer for recurring tasks.
- Cleaned up all created resources.
- A document at `/tmp/process_lab.txt` with all commands and outputs.
