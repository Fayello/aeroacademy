# Module 8 — Backup and Recovery: Strategies, PITR, Testing

## What You'll Actually Do

Build a complete backup and recovery system. You'll implement full, incremental, and differential backups for PostgreSQL, configure Point-in-Time Recovery (PITR), write recovery runbooks, and test that your backups actually work.

## Content

### Backup Types

**Full backup**: Complete copy of the database. Slow to create, fast to restore.

**Incremental**: Only data changed since the last backup (any type). Fast to create, slow to restore.

**Differential**: Data changed since the last full backup. Middle ground.

### PostgreSQL Full Backups

**pg_dump (logical):**

```bash
# Plain SQL
pg_dump -U postgres -h localhost -Fc aeroacademy > /backups/full_$(date +%Y%m%d).dump

# Parallel dump for large databases
pg_dump -U postgres -h localhost -Fd -j 4 aeroacademy -D /backups/full_$(date +%Y%m%d)
```

**pg_basebackup (physical):**

```bash
# Full physical backup — needed for PITR
pg_basebackup -U replicator -h localhost -D /backups/base_$(date +%Y%m%d) \
  -Fp -Xs -P -R

# -Fp: plain format
# -Xs: stream WAL during backup
# -P: show progress
# -R: create standby.signal and connection info
```

### Point-in-Time Recovery (PITR)

PITR lets you restore the database to any moment in time — not just when the backup was taken.

**Enable WAL archiving** in `postgresql.conf`:

```ini
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /archive/%f && cp %p /archive/%f'
```

**Recovery process:**

1. Stop PostgreSQL
2. Replace the data directory with your base backup
3. Create a recovery config:

```ini
# postgresql.conf during recovery
restore_command = 'cp /archive/%f %p'
recovery_target_time = '2025-12-01 14:30:00'
recovery_target_action = 'promote'
```

4. Create `recovery.signal` file
5. Start PostgreSQL — it replays WAL up to the target time

```bash
# Step-by-step
sudo systemctl stop postgresql
sudo rm -rf /var/lib/postgresql/14/main/*
sudo cp -r /backups/base_20251201/* /var/lib/postgresql/14/main/
sudo touch /var/lib/postgresql/14/main/recovery.signal
# Edit postgresql.conf with recovery settings
sudo systemctl start postgresql
```

### Incremental Backups with pgBackRest

Install pgBackRest:

```bash
sudo apt install -y pgbackrest
```

Configure `/etc/pgbackrest/pgbackrest.conf`:

```ini
[global]
repo1-path=/backup/pgbackrest
repo1-retention-full=2
repo1-retention-diff=7
repo1-cipher-type=aes-256-cbc
repo1-cipher-pass=your-backup-password
process-max=2
compress-type=zst
compress-level=6

[aeroacademy]
pg1-path=/var/lib/postgresql/14/main
```

```bash
# Full backup
sudo -u postgres pgbackrest --stanza=aeroacademy --type=full backup

# Differential (incremental since last full)
sudo -u postgres pgbackrest --stanza=aeroacademy --type=diff backup

# Incremental (only changed pages)
sudo -u postgres pgbackrest --stanza=aeroacademy --type=incr backup

# List backups
sudo -u postgres pgbackrest --stanza=aeroacademy info

# Restore to latest
sudo systemctl stop postgresql
sudo -u postgres pgbackrest --stanza=aeroacademy --delta restore
sudo systemctl start postgresql

# Restore to specific time
sudo -u postgres pgbackrest --stanza=aeroacademy \
  --target="2025-12-01 14:30:00" --type=time restore
```

### Automated Backup Script

```bash
#!/bin/bash
# /usr/local/bin/db-backup.sh

set -euo pipefail

BACKUP_DIR="/backups"
LOG_FILE="/var/log/db-backup.log"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"; }

log "Starting backup"

# Full dump
pg_dump -U postgres -Fc aeroacademy > "$BACKUP_DIR/aeroacademy_$DATE.dump"
if [ $? -eq 0 ]; then
    log "Backup successful: aeroacademy_$DATE.dump"
else
    log "ERROR: Backup failed"
    exit 1
fi

# Clean old backups
find "$BACKUP_DIR" -name "*.dump" -mtime +$RETENTION_DAYS -delete
log "Cleaned backups older than $RETENTION_DAYS days"

# Verify last backup can be listed
pg_restore -l "$BACKUP_DIR/aeroacademy_$DATE.dump" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    log "Backup verification passed"
else
    log "ERROR: Backup verification failed"
fi
```

Schedule with cron:

```bash
# /etc/cron.d/db-backup
0 2 * * * postgres /usr/local/bin/db-backup.sh
```

### Recovery Runbook

Every backup needs a tested recovery procedure:

```markdown
# Recovery Runbook: aeroacademy

## Scenario: Full database loss
1. Stop application
2. Stop PostgreSQL: systemctl stop postgresql
3. Clear data directory
4. Restore: pg_restore -U postgres -d aeroacademy /backups/latest.dump
5. Verify row counts match expected values
6. Start PostgreSQL: systemctl start postgresql
7. Start application
8. Verify application health

## Scenario: Accidental data deletion at 14:30
1. Stop application
2. Stop PostgreSQL
3. Restore base backup from this morning
4. Configure PITR to 14:30:00
5. Start PostgreSQL (auto-replays WAL)
6. Verify specific records are restored
7. Start application

## RTO: 30 minutes, RPO: 1 hour
```

### Testing Backups

A backup you haven't tested is not a backup.

```bash
# Restore to a separate instance
pg_restore -U postgres -d aeroacademy_test /backups/aeroacademy_latest.dump

# Run verification queries
psql -U postgres -d aeroacademy_test -c "
  SELECT
    (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM submissions) AS submissions,
    (SELECT MAX(submitted_at) FROM submissions) AS latest_submission;
"
```

## Assessment

**Lab task — 60 minutes**

1. Create a PostgreSQL database with at least 3 tables and 200+ rows of data.
2. Take a full backup using pg_dump and a physical backup using pg_basebackup.
3. Enable WAL archiving and make changes to the database over 10 minutes.
4. Perform a PITR to restore the database to a specific point in time before the last change.
5. Install and configure pgBackRest. Take a full backup, then an incremental backup after adding data.
6. Write a backup automation script with cron scheduling, logging, and old backup cleanup.
7. Write a 1-page recovery runbook for two scenarios: full loss and accidental deletion.
8. Test the recovery by restoring to a separate database and verifying row counts.

**Grading criteria:**
- Both pg_dump and pg_basebackup completed (15 points)
- WAL archiving enabled and PITR successful (25 points)
- pgBackRest full and incremental backups working (15 points)
- Automation script with logging and cleanup (15 points)
- Recovery runbook covers two scenarios with clear steps (15 points)
- Tested recovery with verification queries (15 points)

## Evidence

- pg_dump and pg_basebackup output
- PITR restore showing the database at the correct point in time
- pgBackRest info output showing both backups
- Automation script with log output
- Recovery runbook document
- Verification query results after tested restore
