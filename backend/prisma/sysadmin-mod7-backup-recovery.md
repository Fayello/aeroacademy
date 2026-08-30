# Module 7 — Backup and Recovery


## What You'll Actually Do

Something got deleted. A disk failed. You need to restore from backup. But first, you need to have backups. You'll set up automated backups with rotation, test restores, and configure offsite replication.

## Backup Types

| Type | What it does | Speed | Storage |
|------|-------------|-------|---------|
| Full | Everything | Slow | High |
| Incremental | Changed since last backup | Fast | Low |
| Differential | Changed since last full | Medium | Medium |

## tar — The Basics

```bash
# Full backup
tar -czf backup-$(date +%Y%m%d).tar.gz /var/www /etc/nginx /opt/myapp

# Exclude things
tar -czf backup.tar.gz --exclude='node_modules' --exclude='*.log' /var/www

# Restore
tar -xzf backup.tar.gz -C /

# List contents
tar -tzf backup.tar.gz
```

## rsync — Incremental Backups

```bash
# Local sync
rsync -avz /var/www/ /backup/www/

# Remote sync
rsync -avz -e ssh /var/www/ deploy@backup-server:/backups/www/

# With hardlinks (space-efficient incremental)
rsync -avz --link-dest=/backup/latest /var/www/ /backup/$(date +%Y%m%d)/
```

`--link-dest` hardlinks unchanged files from the previous backup. Saves space.

## Automated Backup Script

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/backup"
SOURCES=("/var/www" "/etc/nginx" "/opt/myapp")
REMOTE="deploy@backup-server:/backups"
RETENTION=7
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup
tar -czf "${BACKUP_DIR}/full-${DATE}.tar.gz" "${SOURCES[@]}"

# Sync to remote
rsync -avz "${BACKUP_DIR}/full-${DATE}.tar.gz" "${REMOTE}/"

# Clean local old backups
find "${BACKUP_DIR}" -name "full-*.tar.gz" -mtime +${RETENTION} -delete

echo "$(date): Backup complete — full-${DATE}.tar.gz"
```

**Cron:**
```bash
0 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
```

## Database Backups

**PostgreSQL:**
```bash
pg_dump -U postgres mydb > /backup/mydb-$(date +%Y%m%d).sql
# Compressed
pg_dump -U postgres mydb | gzip > /backup/mydb-$(date +%Y%m%d).sql.gz
# Restore
psql -U postgres mydb < /backup/mydb-20250115.sql
```

**MySQL:**
```bash
mysqldump -u root -p mydb > /backup/mydb-$(date +%Y%m%d).sql
# Restore
mysql -u root -p mydb < /backup/mydb-20250115.sql
```

## Testing Restores

**The most important part:** If you haven't tested a restore, you don't have a backup.

```bash
# Test restore to a temporary location
mkdir -p /tmp/restore-test
tar -xzf /backup/full-20250115.tar.gz -C /tmp/restore-test

# Verify files
ls -la /tmp/restore-test/var/www/
diff -r /var/www/ /tmp/restore-test/var/www/
```

## LVM Snapshots for Zero-Downtime Backups

```bash
# Create snapshot before backup
lvcreate -L 5G -s -n www_snap /dev/data_vg/www_lv

# Mount snapshot (read-only)
mkdir /mnt/snapshot
mount -o ro /dev/data_vg/www_snap /mnt/snapshot

# Backup from snapshot
tar -czf /backup/www-$(date +%Y%m%d).tar.gz /mnt/snapshot

# Remove snapshot
umount /mnt/snapshot
lvremove -f /dev/data_vg/www_snap
```

## Assessment

**Lab task (20 min):**

1. Create a full backup of /var/www
2. Set up rsync to a remote server
3. Write a backup script with rotation (keep7 days)
4. Set up database backup for PostgreSQL
5. Test a restore to a temporary directory
6. Set up LVM snapshot backup

**Grading:**
- Full backup created: 15%
- rsync working: 15%
- Script with rotation: 25%
- Database backup working: 20%
- Restore tested: 15%
- LVM snapshot: 10%

## Evidence

- **OutcomeEvidence:** `SYS-LO7 — Backup & Recovery`
- **Mastery:** `UserSkill: linux-backup-recovery`

## Unlock

Module8 — Monitoring and Logging. You can recover from failures. Now you learn how to detect them before they happen.

## Sources

- `man tar`, `man rsync`, `man pg_dump`
- `man lvcreate`

