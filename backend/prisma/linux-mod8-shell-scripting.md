# Module 8 — Shell Scripting


## What You'll Actually Do

You're doing the same5 commands every morning. Check disk, check services, check logs. You'll write a script that does it for you. Then you'll write a deploy script. Then a backup script. The shell isn't just for typing commands — it's for automating them.

## Your First Script

```bash
cat > hello.sh << 'EOF'
#!/bin/bash
echo "Hello, $(whoami)"
echo "Today is $(date)"
echo "Uptime: $(uptime -p)"
EOF
chmod +x hello.sh
./hello.sh
```

`#!/bin/bash` — shebang. Tells the system to use bash.

**Variables:**
```bash
#!/bin/bash
NAME="alice"
SERVERS="web1 web2 web3"

for server in $SERVERS; do
    echo "Pinging $server..."
    ping -c 1 $server > /dev/null
    if [ $? -eq 0 ]; then
        echo "$server is UP"
    else
        echo "$server is DOWN"
    fi
done
```

`$?` — exit code of the last command. `0` = success, non-zero = failure.

## Conditionals

```bash
#!/bin/bash
DISK=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ $DISK -gt 80 ]; then
    echo "WARNING: Disk usage is ${DISK}%"
    # send alert
elif [ $DISK -gt 60 ]; then
    echo "Disk usage is ${DISK}% — getting full"
else
    echo "Disk usage is ${DISK}% — OK"
fi
```

**Common tests:**
| Test | Meaning |
|------|---------|
| `-f file` | File exists and is a regular file |
| `-d dir` | Directory exists |
| `-z string` | String is empty |
| `-n string` | String is not empty |
| `$a -eq $b` | Equal |
| `$a -ne $b` | Not equal |
| `$a -gt $b` | Greater than |
| `$a -lt $b` | Less than |

## Loops

**For loop:**
```bash
#!/bin/bash
for user in alice bob charlie; do
    echo "Creating user: $user"
    useradd -m -s /bin/bash $user 2>/dev/null
    echo "$user:$(openssl rand -base64 12)" | chpasswd
    echo "Created $user with random password"
done
```

**While loop:**
```bash
#!/bin/bash
while true; do
    NGINX=$(systemctl is-active nginx)
    if [ "$NGINX" != "active" ]; then
        echo "$(date): nginx is down. Restarting..."
        systemctl restart nginx
    fi
    sleep 30
done
```

That's a simple health check. Runs every30 seconds. If nginx is down, restart it. In production, you'd use systemd for this, but this works for a quick check.

## Functions

```bash
#!/bin/bash
check_service() {
    local service=$1
    local status=$(systemctl is-active $service)
    if [ "$status" = "active" ]; then
        echo "[OK] $service is running"
        return 0
    else
        echo "[FAIL] $service is not running"
        return 1
    fi
}

check_service nginx
check_service postgresql
check_service redis
```

**`local`** — variable is scoped to the function. Without `local`, it leaks to the global scope.

## Arguments and Input

```bash
#!/bin/bash
# Usage: ./backup.sh /var/www/myapp

BACKUP_DIR=$1
BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).tar.gz"

if [ -z "$BACKUP_DIR" ]; then
    echo "Usage: $0 <directory>"
    exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Error: $BACKUP_DIR does not exist"
    exit 1
fi

tar -czf "$BACKUP_FILE" "$BACKUP_DIR"
echo "Backup created: $BACKUP_FILE"
```

`$0` — script name. `$1`, `$2` — arguments. `$#` — number of arguments. `$@` — all arguments.

## Error Handling

```bash
#!/bin/bash
set -euo pipefail

# -e: exit on error
# -u: treat unset variables as error
# -o pipefail: pipe fails if any command fails

echo "Starting deployment..."
git pull origin main
npm install
npm run build
cp -r dist/ /var/www/myapp/
systemctl restart myapp
echo "Deployment complete"
```

Without `set -e`, if `npm install` fails, the script continues and deploys a broken build. With `set -e`, it stops immediately.

## Real Task: Automated Backup Script

```bash
#!/bin/bash
set -euo pipefail

# Config
BACKUP_SOURCES=("/var/www" "/etc/nginx" "/opt/myapp")
BACKUP_DEST="/backups"
RETENTION_DAYS=7

# Create backup directory
mkdir -p "$BACKUP_DEST"

# Generate backup
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DEST/full-backup-$TIMESTAMP.tar.gz"

echo "[$(date)] Starting backup..."
tar -czf "$BACKUP_FILE" "${BACKUP_SOURCES[@]}"
echo "[$(date)] Backup created: $BACKUP_FILE"

# Remove old backups
find "$BACKUP_DEST" -name "full-backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Old backups cleaned (retention: $RETENTION_DAYS days)"

# Verify
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup size: $SIZE"
```

**Cron job to run daily at2 AM:**
```bash
echo "0 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1" | crontab -
```

## Failure Scenario: The Script That Deleted Everything

```bash
#!/bin/bash
DIR="/var/www"
rm -rf $DIR/*   # What if DIR is empty?
```

If `$DIR` is unset or empty, this becomes `rm -rf /*`. The whole system.

**Fix:**
```bash
#!/bin/bash
set -euo pipefail

DIR="/var/www"
if [ -z "$DIR" ]; then
    echo "ERROR: DIR is empty"
    exit 1
fi

rm -rf "$DIR"/*   # Quoted — won't expand to empty
```

Always quote variables. Always use `set -euo pipefail`. Always test with `echo` before `rm`.

## Assessment

**Lab task (25 min):**

1. Write a script that checks if nginx, sshd, and postgresql are running
2. Write a script that creates3 users with random passwords
3. Write a backup script that compresses `/var/www` and keeps7 days of backups
4. Write a deploy script that pulls from git, builds, and restarts a service
5. Set up a cron job to run the backup script daily
6. Add error handling with `set -euo pipefail`

**Grading:**
- Service check script works: 20%
- User creation script works: 15%
- Backup script works with retention: 25%
- Deploy script works: 20%
- Cron job configured: 10%
- Error handling present: 10%

## Evidence

- **OutcomeEvidence:** `LIN-LO8 — Shell Scripting`
- **Mastery:** `UserSkill: linux-shell-scripting`

## Unlock

Module9 — Log Management and Troubleshooting. You can automate. Now you learn how to read what the system is telling you.

## Sources

- `man bash` — the full bash manual
- `info bash` — more readable than man
- GNU Bash Reference Manual

