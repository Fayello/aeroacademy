# Module 3 — Processes and Systemd


## What You'll Actually Do

Something is eating your CPU. A service won't start. You need to figure out what's running, kill the thing that's misbehaving, and make sure nginx survives a reboot. That's this module.

## Every Running Thing Is a Process

When you run `ls`, the shell spawns a process. When nginx runs, it's a process. When a cron job fires, it's a process. Everything executing on your system is a process.

**See what's running:**
```bash
ps aux
```
Output:
```
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.1 169404 11492 ?        Ss   Jan15   0:02 /sbin/init
root         2  0.0  0.0      0     0 ?        S    Jan15   0:00 [kthreadd]
www-data   842  0.0  0.3 723456 31204 ?        S    Jan15   0:05 nginx: worker
alice     1337  2.3  1.2 1254308 98764 pts/0    Sl+  10:30   0:15 python app.py
```

- `PID` — process ID. Every process has a unique number.
- `%CPU` — CPU usage. High = something is working hard.
- `%MEM` — memory usage.
- `STAT` — state. `S` = sleeping, `R` = running, `Z` = zombie, `T` = stopped.
- `COMMAND` — what's running.

**Interactive process viewer:**
```bash
top
# or better:
htop
```
`htop` shows color, tree view, and lets you sort by CPU/memory. Press `F6` to sort, `F9` to kill, `q` to quit.

**Find a specific process:**
```bash
ps aux | grep nginx
# or:
pgrep -la nginx
```

**Kill a process:**
```bash
kill 1337        # sends SIGTERM (graceful shutdown)
kill -9 1337     # sends SIGKILL (forced kill — last resort)
```

Always try `kill` first (SIGTERM). Let the process clean up. `kill -9` is for when the process is ignoring SIGTERM. Use it rarely.

## systemd — The Init System

When your server boots, the kernel starts `systemd` (PID 1). systemd starts everything else — SSH, nginx, your app, cron, logging. It's the parent of all processes.

**Start a service:**
```bash
systemctl start nginx
```

**Stop it:**
```bash
systemctl stop nginx
```

**Restart it (stop + start):**
```bash
systemctl restart nginx
```

**Reload config without dropping connections:**
```bash
systemctl reload nginx
```

**Check if it's running:**
```bash
systemctl status nginx
```
Output:
```
● nginx.service - A high performance web server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; ...)
     Active: active (running) since Mon 2025-01-15 10:30:00 UTC
   Main PID: 842 (nginx)
      ...
```
Green `active (running)` = good. Red `failed` = bad. `inactive (dead)` = not running.

**Make it start on boot:**
```bash
systemctl enable nginx
```

**Disable on boot:**
```bash
systemctl disable nginx
```

**Check if enabled:**
```bash
systemctl is-enabled nginx
# enabled
```

## Service Files — How systemd Knows What to Run

systemd reads service files from `/lib/systemd/system/` and `/etc/systemd/system/`. The ones in `/etc/systemd/system/` override the ones in `/lib/systemd/system/`.

**Create a service for your app:**
```bash
cat > /etc/systemd/system/myapp.service << 'EOF'
[Unit]
Description=My Application
After=network.target

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/start.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

Then:
```bash
systemctl daemon-reload    # reload service files
systemctl start myapp
systemctl enable myapp     # start on boot
systemctl status myapp     # check it
```

**The key fields:**
- `After=network.target` — don't start until the network is up
- `User=deploy` — run as this user, not root
- `ExecStart` — the command to run
- `Restart=always` — if it crashes, restart it
- `RestartSec=5` — wait5 seconds before restarting

**View logs for your service:**
```bash
journalctl -u myapp -f    # follow logs in real-time
```

## Signals — How Processes Communicate

Processes talk to each other through signals. You've used two already:

| Signal | Number | What it does | When to use |
|--------|--------|-------------|-------------|
| `SIGTERM` | 15 | Graceful shutdown | `kill` without flags |
| `SIGKILL` | 9 | Forced kill | `kill -9` — last resort |
| `SIGHUP` | 1 | Reload config | `kill -HUP` or `systemctl reload` |
| `SIGSTOP` | 19 | Pause | `kill -STOP` |
| `SIGCONT` | 18 | Resume | `kill -CONT` |

nginx understands SIGHUP — it reloads config without dropping connections. That's why `systemctl reload nginx` works. Your custom app might not handle SIGHUP — test it.

## Real Task: Fix a Broken Service

nginx won't start. You check:
```bash
systemctl status nginx
# ● nginx.service - A high performance web server
#      Active: failed (Result: exit-code) since ...
# Process: 842 ExecStart=/usr/sbin/nginx (code=exited, status=1/FAILURE)
```

Check the logs:
```bash
journalctl -u nginx --no-pager -n 20
# [emerg] 842#842: bind() to 0.0.0.0:80 failed (98: Address already in use)
```

Something is already using port80:
```bash
ss -tlnp | grep :80
# LISTEN  0  128  0.0.0.0:80  0.0.0.0:*  users:(("apache2",pid=1234,fd=3))
```

Apache is running on port80. Stop it, then start nginx:
```bash
systemctl stop apache2
systemctl disable apache2
systemctl start nginx
systemctl status nginx
# Active: active (running)
```

That's real debugging. Not reading Stack Overflow — checking logs, finding the conflict, fixing it.

## Failure Scenario: Zombie Processes

A process exits but its parent doesn't collect its exit status. It becomes a zombie — uses no resources, but shows up in `ps`.

```bash
ps aux | grep 'Z'
# user    9999  0.0  0.0      0     0 pts/0    Z+   10:30   0:00 [myapp] <defunct>
```

You can't `kill` a zombie. It's already dead. You need to find its parent:
```bash
ps -o ppid= -p 9999
# 9998
kill -9 9998   # kill the parent, zombie gets reaped
```

If the parent is PID 1 (init/systemd), the zombie will be cleaned up on the next service restart. Usually not a problem unless you have hundreds of them.

## Assessment

**Lab task (20 min):**

1. Create a service file for a simple script that writes to a log every5 seconds
2. Start the service and verify it's running with `systemctl status`
3. Check the logs with `journalctl`
4. Stop the service, verify it's stopped
5. Modify the script to write to a different log file
6. Reload and verify the change took effect
7. Make the service start on boot
8. Kill the process with `kill -9` and verify systemd restarts it

**Grading:**
- Service created and starts correctly: 20%
- Logs accessible and correct: 15%
- Stop/start/restart works: 15%
- Configuration change applied: 20%
- Survives kill -9 (Restart=always): 20%
- Enabled on boot: 10%

## Evidence

- **OutcomeEvidence:** `LIN-LO3 — Process & Service Management`
- **Mastery:** `UserSkill: linux-systemd` — +0.5 clean, +0.3 with hints

## Unlock

Module4 — Networking from the Command Line. You can manage services. Now you learn how they talk to each other.

## Sources

- `man systemctl`, `man journalctl`, `man systemd.service`
- `man kill`, `man signal`
- `man ps`, `man top`

