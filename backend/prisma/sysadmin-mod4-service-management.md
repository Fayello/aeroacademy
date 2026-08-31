# Module 4 — Service Management

Every application on a Linux server runs as a service. When it crashes, you need it to restart automatically. When the server reboots, services need to come up in the right order. When you need to limit how much CPU or memory a service consumes, systemd handles that. This module covers systemd in depth: unit types, creating custom services, log analysis with journald, replacing cron with timers, and resource control. You will learn to migrate cron jobs to systemd timers which is a practical skill for modernizing server management.

## systemd Unit Types

systemd manages everything as units. The main types you will work with are **service** units for daemons and applications, **socket** units for on-demand activation when a client connects, **timer** units for time-based activation that replace cron jobs with better logging and dependency handling, **mount** units for filesystem mounts as alternatives to fstab entries, **target** units for grouping units that represent a system state like runlevels, **path** units for activation when a file or directory changes, and **slice** units for resource control grouping where you apply CPU and memory limits to a group of related services.

Understanding these unit types helps you choose the right approach for different scenarios. Services are the most common. Timers are the modern replacement for cron. Sockets are useful for lazy-start services that should only run when needed. Path units watch for file changes and trigger services — useful for processing uploads or monitoring log directories.

## Inspecting Services

Use `systemctl status` to see full status including recent logs, `is-enabled` to check if a service starts at boot, `is-active` to check if it is running, `--failed` to list all failed units, `list-units --type=service` to see all services, and `list-unit-files` to see enabled services. When a service fails, the first place to look is `systemctl status` which shows the last few log lines, then `journalctl -u` with the service name and line count for more history.

Understanding the difference between `systemctl list-units` and `systemctl list-unit-files` matters. `list-units` shows units that systemd has loaded into memory. `list-unit-files` shows all installed unit files regardless of whether they are loaded. A service that is installed but not started will appear in `list-unit-files` but not in `list-units`.

## Creating Custom systemd Services

When you deploy an application that does not come with a systemd unit file, you create one. A service unit file has three sections: **Unit** for metadata and dependencies, **Service** for the actual process configuration, and **Install** for boot-time placement.

### Anatomy of a Service Unit

The **Unit** section contains `Description`, `Documentation` URL, `After` and `Requires` directives for dependency ordering, and `Wants` for soft dependencies. The **Service** section contains `Type` which determines how systemd tracks startup (`simple` for the command as main process, `forking` for traditional daemons that fork and parent exits, `oneshot` for commands that run once and exit, `notify` for services that send readiness notification), `User` and `Group` for running as non-root, `WorkingDirectory`, `Environment` and `EnvironmentFile` for configuration, `ExecStartPre` for pre-start commands like config checks, `ExecStart` for the main process, `ExecReload` and `ExecStop` for reload and stop signals, `Restart` policy (`no`, `on-failure`, `always`, `on-abnormal`), `RestartSec` delay before restart, and `StartLimitBurst` and `StartLimitIntervalSec` for rate limiting restarts.

The `Type=notify` is particularly important for applications that support systemd notification. When a service starts, it may need to do initialization work like loading configuration, connecting to databases, or warming caches. During this time, it is not ready to accept connections. With `Type=notify`, the service sends a `READY=1` message to systemd when it is fully initialized. Without this, systemd may mark the service as started before it is ready, causing connection failures.

### Security Hardening Directives

Modern systemd provides security hardening through directives like `NoNewPrivileges` to prevent privilege escalation, `ProtectSystem=strict` to mount / and /usr as read-only, `ProtectHome` to make /home inaccessible, `PrivateTmp` for isolated /tmp namespace, `ProtectKernelTunables` to prevent modifying /proc and /sys, `ProtectKernelModules` to prevent loading kernel modules, and `ProtectControlGroups` to prevent modifying the cgroup hierarchy. These directives significantly reduce the attack surface of services.

Additional hardening includes `ReadWritePaths` to specify which directories the service can write to when `ProtectSystem=strict` is set, `CapabilityBoundingSet` to limit which Linux capabilities the service can use, `SystemCallArchitectures=native` to prevent running non-native binaries, and `LockPersonality=yes` to prevent changing the execution domain.

### Resource Limits

systemd provides per-service resource control through control groups. You can limit CPU with `CPUQuota` (80% means 0.8 cores, 200% means 2 cores), memory with `MemoryMax` as a hard limit and `MemoryHigh` as a soft limit, I/O with `IOWeight` and bandwidth limits, file descriptors with `LimitNOFILE`, and processes with `LimitNPROC`. These limits prevent a single misbehaving service from consuming all system resources.

The `MemoryHigh` soft limit causes the service to be throttled when it exceeds the threshold. The `MemoryMax` hard limit kills the service with an OOM error if it exceeds the limit. For most services, set `MemoryHigh` to 80% of `MemoryMax` to give the service warning before being killed.

### Installing a Custom Service

Create the unit file in `/etc/systemd/system/`, run `systemctl daemon-reload` to pick up the new file, enable with `systemctl enable`, start with `systemctl start`, and verify with `systemctl status`. Never edit files in `/usr/lib/systemd/system/`. Always create custom units in `/etc/systemd/system/`. To override vendor units, use `systemctl edit` which creates a drop-in directory with an `override.conf` file.

## Journalctl: Log Analysis

systemd captures stdout and stderr of all managed services into the journal. This eliminates the need for most services to implement their own log rotation or file management. The journal is structured, indexed, and supports fast queries by service, priority, time range, and arbitrary text.

### Basic Queries

Use `journalctl -u` for a specific service, `-n` for last N lines, `-b` for current boot, `-b -1` for previous boot, `--since` and `--until` for time-based filtering with formats like "2024-01-15 10:00:00" or "2 hours ago", `-f` for real-time follow like tail -f, `-p` for priority filtering (emerg, alert, crit, err, warning, notice, info, debug), `-o json-pretty` for JSON output, `-k` for kernel messages, and filters for PID (`_PID`), user (`_UID`), and executable path.

### Filtering and Searching

Combine filters for precise queries. Search for specific strings with `grep`, filter by PID with `_PID`, by user with `_UID`, and by executable path. Combine time, priority, and text filters to find exactly what you need. For example, find all errors from nginx in the last hour: `journalctl -u nginx.service --since "1 hour ago" -p err`.

### Journal Configuration

Control journal size and retention in `/etc/systemd/journald.conf`. Set `Storage=persistent` for logs that survive reboots, `SystemMaxUse` for maximum disk usage, `MaxRetentionSec` for how long to keep logs, `MaxFileSec` for rotation frequency, and `Compress=yes` for compression. Always enable persistent storage on servers. For persistent storage, create `/var/log/journal` and run `systemd-tmpfiles --create --prefix /var/log/journal` to set up the directory structure.

### Vacuuming Old Logs

Use `journalctl --vacuum-size` to keep only a specified amount, `--vacuum-time` to keep logs from a time period, and `--vacuum-files` to keep only a certain number of journal files. Set up a weekly cron job or systemd timer to vacuum old logs automatically: `journalctl --vacuum-size=500M`.

### Forwarding Logs to Remote Servers

Configure `journald` to forward logs to a remote syslog server by setting `ForwardToSyslog=yes` in `/etc/systemd/journald.conf`. Alternatively, use `RemoteSyslog` to specify the remote server address. For more control over what gets forwarded, use rsyslog which can read journal entries and forward them with filtering rules.

## Systemd Timers versus Cron

Cron has served Linux well for decades but systemd timers are the modern replacement. They integrate with journald for logging, support calendar-based scheduling, have better dependency handling, and provide resource limits and security hardening for timer-triggered services.

### Timer Scheduling Syntax

Calendar events use a flexible format. Examples include daily at a specific time with `*-*-* 02:00:00`, every N minutes with `*-*-* *:*:00/5`, specific days of the week with `Mon *-*-* 03:00:00`, and first day of month with `*-*-01 00:00:00`. `OnBootSec` handles boot-relative scheduling (run 5 minutes after boot). `OnUnitActiveSec` handles interval-based scheduling (run every 15 minutes after the last run).

### Managing Timers

Use `systemctl list-timers --all` to see all timers, `enable --now` to enable and start, check status for last fire time, and start manually to trigger immediately. Timer units automatically create matching service units when they fire.

### Key Advantages Over Cron

Systemd timers provide logging through journald where you can see exactly what output each timer run produced. `Persistent=true` fires missed runs on next boot — if the server was off when a timer should have fired, it runs immediately on boot. Dependency handling lets services depend on other services. Resource limits let you constrain timer-triggered services. Security hardening with `ProtectSystem` and `PrivateTmp` applies to timer-triggered services. Sub-second accuracy enables precise scheduling.

### Converting Cron Jobs to Timers

For each cron job, create a service file with `Type=oneshot` and the `ExecStart` command, then create a matching timer file with the appropriate `OnCalendar` or `OnUnitActiveSec` schedule. Enable the timer and verify it fires correctly. The key difference from cron is that systemd timers provide better logging, dependency management, and resource control.

## Migrating 50 Cron Jobs to Systemd Timers

Real scenario: an operations team has 50 cron jobs defined across multiple servers. They are hard to track, logging goes to different files, and missed runs are invisible. You need to convert them all to systemd timers.

### Step 1: Inventory

Export all cron jobs from system crontabs, `/etc/crontab`, `/etc/cron.d/`, `/etc/cron.daily/`, and `/etc/cron.hourly/`. Check each user's crontab with `crontab -l`. Create a spreadsheet listing every job with its command, schedule, user, and purpose.

### Step 2: Classify

Sort jobs into categories: repeating interval jobs that run every N minutes or hours which use `OnUnitActiveSec`, calendar-based jobs that run at specific times which use `OnCalendar`, and one-shot jobs like monthly reports which use `OnCalendar` with specific dates.

### Step 3: Create Service and Timer Pairs

Write a script that generates service and timer files for each cron job. The service file should have `Type=oneshot`, the correct `User`, and the `ExecStart` command. The timer file should have the appropriate schedule and `Persistent=true`.

### Step 4: Validate

After converting a batch of jobs, check all timers are active with `systemctl list-timers`, trigger each service manually to verify it works, and check `journalctl` output.

### Step 5: Monitor and Compare

Run both cron and timers in parallel for a week. Compare outputs to ensure no jobs were missed or duplicated during conversion.

### Step 6: Remove Old Cron Entries

Once verified, remove the old cron entries with `crontab -e` or by removing files from `/etc/cron.d/`. Document each conversion in your runbook.

## Service Ordering and Dependencies

Understanding when services start relative to each other is critical for complex applications. `Requires` is a hard dependency where if the required service fails, this unit also fails. `Wants` is softer — the system tries to start the dependency but continues if it does not start. `After` provides ordering without pulling in the dependency. `Before` provides reverse ordering. `Conflicts` means the unit cannot run alongside another.

### Common Targets

`network.target` means the network is up but not necessarily all interfaces configured. `network-online.target` means all interfaces are configured and have connectivity. `local-fs.target` means local filesystems are mounted. `multi-user.target` is the typical server state with multiple users and networking.

## Socket Activation

Socket activation allows systemd to start a service on-demand when a connection arrives. Create a socket unit that listens on a port and a service unit that starts the actual process. When a client connects, systemd starts the service and passes the socket. This saves resources for services that are rarely used and simplifies service startup ordering because the socket is always available even if the service has not started yet.

## Practical Assessment

**Lab Task:** Service management migration (50 minutes)

1. Create a systemd service unit for a sample application using a simple script
2. Include proper dependencies, restart policy, and security hardening
3. Apply resource limits of 50% CPU and 512 MB memory
4. Convert 3 cron jobs to systemd timers
5. Enable all timers and verify they fire correctly
6. Analyze boot performance with `systemd-analyze`
7. Identify the 5 slowest services during boot
8. Use `journalctl` to analyze service logs: filter by priority, time range, and full-text search
9. Create a service that uses socket activation
10. Document the complete service inventory with start/stop/restart commands

**Grading criteria:** Service unit file is syntactically correct and functional (15 points), security hardening directives applied correctly (10 points), resource limits enforced (10 points), timer files created and firing on schedule (20 points), boot analysis completed with actionable findings (10 points), journalctl queries demonstrate proficiency (15 points), socket activation service works (10 points), documentation is complete and accurate (10 points).

## Understanding systemd Targets in Depth

systemd targets represent system states. Understanding target dependencies helps you diagnose boot issues and design service startup sequences.

**basic.target** includes essential services like udev, tmpfiles, and socket units. **sysinit.target** handles early boot initialization including filesystem mounts and device detection. **sockets.target** activates all socket units. **timers.target** activates all timer units. **network.target** indicates the network stack is up. **network-online.target** indicates actual connectivity. **multi-user.target** is the typical server target with networking and multiple users.

### Target Dependencies

Use `systemctl list-dependencies multi-user.target` to see what your server needs. The output shows hard dependencies (red) and soft dependencies (green). Understanding this tree helps you identify why a service fails to start — if a dependency is missing or broken, the dependent service cannot start.

### Custom Targets

Create custom targets for application-specific states. For example, a `web-ready.target` that depends on nginx, php-fpm, and database services. Set it as a dependency for application services that need the full web stack.

## systemd Resource Control Deep Dive

systemd uses Linux control groups (cgroups) for resource management. Each service runs in its own cgroup, and you can set limits independently.

### CPU Control

`CPUQuota=80%` limits to 80% of one CPU core. On a 4-core server, `CPUQuota=200%` allows up to 2 cores. `CPUWeight=100` sets relative scheduling weight — a service with weight 200 gets twice the CPU of one with weight 100. Use `systemctl show` to see current resource settings.

### Memory Control

`MemoryMax=2G` is a hard limit — the service is OOM-killed if it exceeds this. `MemoryHigh=1.5G` is a soft limit — the service is throttled above this but not killed. For most services, set `MemoryHigh` to 80% of `MemoryMax`. `MemorySwapMax` controls swap usage independently.

### I/O Control

`IOWeight=100` sets relative I/O weight. `IOReadBandwidthMax=/dev/sda 100M` limits read bandwidth. `IOWriteBandwidthMax=/dev/sda 50M` limits write bandwidth. `IODeviceWeight` sets per-device weights. These are critical for preventing one service from saturating disk I/O.

### Monitoring Resource Usage

Check actual resource usage with `systemctl status` which shows current CPU and memory. For detailed cgroup information, check `/sys/fs/cgroup/system.slice/servicename.service/`. Tools like `systemd-cgtop` show real-time resource usage across all cgroups.

## Advanced journalctl Usage

### Correlating Logs Across Services

When debugging complex issues, you often need to see logs from multiple services in chronological order. Use `journalctl` with multiple `-u` flags: `journalctl -u nginx -u php-fpm --since "1 hour ago"`. This interleaves logs from both services in time order.

### Structured Log Analysis

Use `-o json-pretty` to output logs as JSON for processing with tools like `jq`. Example: `journalctl -u nginx -o json | jq '.MESSAGE'` extracts just the message field. This is useful for building automated log analysis pipelines.

### Log Forwarding to External Systems

Configure rsyslog to read from the journal and forward to external systems. Create `/etc/rsyslog.d/forward.conf` with rules that match specific services or priorities. This bridges the gap between systemd journal and traditional syslog infrastructure.

### Persistent Journal Configuration

For production servers, always configure persistent storage. Create `/var/log/journal` and set `Storage=persistent` in `/etc/systemd/journald.conf`. Set `SystemMaxUse=2G` and `MaxRetentionSec=30day` to control disk usage. Use `journalctl --vacuum-size=1G` for manual cleanup.

## Practical Assessment

**Lab Task:** Service management migration (50 minutes)

1. Create a systemd service unit for a sample application using a simple script
2. Include proper dependencies, restart policy, and security hardening
3. Apply resource limits of 50% CPU and 512 MB memory
4. Convert 3 cron jobs to systemd timers
5. Enable all timers and verify they fire correctly
6. Analyze boot performance with `systemd-analyze`
7. Identify the 5 slowest services during boot
8. Use `journalctl` to analyze service logs: filter by priority, time range, and full-text search
9. Create a service that uses socket activation
10. Document the complete service inventory with start/stop/restart commands

**Grading criteria:** Service unit file is syntactically correct and functional (15 points), security hardening directives applied correctly (10 points), resource limits enforced (10 points), timer files created and firing on schedule (20 points), boot analysis completed with actionable findings (10 points), journalctl queries demonstrate proficiency (15 points), socket activation service works (10 points), documentation is complete and accurate (10 points).

## Evidence

Collect the following for your portfolio: contents of your custom service unit file, output of `systemctl status` for the custom service, screenshot of `systemctl list-timers` showing active timers, output of `systemd-analyze blame` showing boot timing, journalctl query examples with output, your service inventory document, and screenshot of the socket-activated service responding to connections.
