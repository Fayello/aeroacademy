# Module 4 — Service Management


## What You'll Actually Do

Your stack is nginx + postgresql + redis + a Node.js app. Each has its own config, its own logs, its own restart behavior. You'll manage them all — individually and as a stack. When one dies, you'll know before users do.

## systemd Deep Dive — Beyond Start/Stop

**Service lifecycle:**
```bash
systemctl start myapp      # start now
systemctl enable myapp     # start on boot
systemctl stop myapp       # stop now
systemctl disable myapp    # don't start on boot
systemctl restart myapp    # stop + start
systemctl reload myapp     # reload config without downtime
systemctl status myapp     # check state
systemctl is-active myapp  # returns 0 if running
systemctl is-enabled myapp # returns 0 if enabled
```

**Dependencies:**
```bash
# Service A requires B
[Unit]
After=postgresql.service
Requires=postgresql.service
```

**Resource limits:**
```bash
[Service]
MemoryMax=2G
CPUQuota=80%
LimitNOFILE=65536
```

**Environment:**
```bash
[Service]
Environment=NODE_ENV=production
EnvironmentFile=/opt/myapp/.env
```

## Multi-Instance Services

Run multiple copies of the same service:

```bash
# /etc/systemd/system/app@.service
[Unit]
Description=App instance %i

[Service]
Type=simple
ExecStart=/opt/myapp/start.sh --port %i
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
systemctl start app@3000
systemctl start app@3001
systemctl start app@3002
```

## Monitoring Service Health

**Check all services:**
```bash
systemctl list-units --type=service --state=failed
```

**Watch a service:**
```bash
watch -n 5 "systemctl status myapp"
```

**Log-based health check:**
```bash
#!/bin/bash
if ! systemctl is-active --quiet myapp; then
    systemctl restart myapp
    echo "$(date): myapp restarted" >> /var/log/service-monitor.log
fi
```

**systemd watchdog (self-healing):**
```bash
[Service]
WatchdogSec=30
# App must send WATCHDOG=1 notification every30s
# If it doesn't, systemd restarts it
```

## Managing a Full Stack

**nginx + app + database:**

```bash
# /etc/systemd/system/myapp-stack.service
[Unit]
Description=My Application Stack
After=network.target postgresql.service redis-server.service
Requires=postgresql.service redis-server.service

[Service]
Type=forking
ExecStartPre=/usr/sbin/nginx -t
ExecStart=/usr/sbin/nginx
ExecReload=/bin/kill -HUP $MAINPID
ExecStop=/bin/kill -QUIT $MAINPID

[Install]
WantedBy=multi-user.target
```

Now `systemctl start myapp-stack` starts nginx, and it requires postgresql and redis to be running first.

## Log Rotation for Services

```bash
cat > /etc/logrotate.d/myapp << 'EOF'
/var/log/myapp/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 deploy deploy
    sharedscripts
    postrotate
        systemctl reload myapp > /dev/null 2>&1 || true
    endscript
}
EOF
```

## Real Task: Deploy a Complete Stack

```bash
# 1. Install dependencies
apt install -y nginx postgresql redis-server

# 2. Configure each service
# nginx: reverse proxy to app on port3000
# postgresql: create database and user
# redis: default config, bind to localhost only

# 3. Create app service
cat > /etc/systemd/system/myapp.service << 'EOF'
[Unit]
Description=My Application
After=network.target postgresql.service redis-server.service
Requires=postgresql.service redis-server.service

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/opt/myapp
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=/opt/myapp/.env

[Install]
WantedBy=multi-user.target
EOF

# 4. Enable and start
systemctl daemon-reload
systemctl enable --now postgresql redis-server nginx myapp

# 5. Verify
systemctl status myapp
curl -I http://localhost
```

## Assessment

**Lab task (25 min):**

1. Create a systemd service with dependencies and resource limits
2. Set up multi-instance services (3 copies on different ports)
3. Configure nginx as reverse proxy to the app instances
4. Write a health check script that monitors and restarts failed services
5. Set up log rotation for all services
6. Deploy the complete stack and verify everything works

**Grading:**
- Service with dependencies: 20%
- Multi-instance working: 15%
- Nginx reverse proxy: 20%
- Health check script: 20%
- Log rotation: 10%
- Full stack deployed: 15%

## Evidence

- **OutcomeEvidence:** `SYS-LO4 — Service Management`
- **Mastery:** `UserSkill: linux-service-management`

## Unlock

Module5 — Network Configuration. You can manage services. Now you learn how to configure the network they run on.

## Sources

- `man systemd.service`, `man systemd.unit`
- `man logrotate`

