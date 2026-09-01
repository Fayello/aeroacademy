# Module 8 — Backup and Recovery

Backups are your last line of defense. Everything else — replication, clustering, high availability — can fail simultaneously. When a ransomware attack encrypts your data, when an accidental DROP TABLE wipes out a production table, or when a disk failure corrupts your data files, the backup is what determines whether you recover gracefully or explain to the CEO why the company lost six months of data. This module covers backup strategies, point-in-time recovery, backup testing, disaster recovery planning, and a real scenario of recovering from accidental data deletion.

## Backup Strategies: Full, Incremental, Differential

**Full Backup:**

A full backup copies the entire database. It is the simplest to restore from — you restore one file and you are done. The downside is time and storage: a 500GB database requires 500GB of backup storage per full backup.

```bash
# PostgreSQL full backup with pg_dump
pg_dump -h localhost -U backupuser -d myapp \
  -Fc -Z 6 -f /backups/full_$(date +%Y%m%d).dump

# MySQL full backup with mysqldump
mysqldump -h localhost -u backupuser -p \
  --all-databases --single-transaction \
  --routines --triggers --events \
  | gzip > /backups/full_$(date +%Y%m%d).sql.gz

# MongoDB full backup
mongodump --host localhost --port 27017 \
  --username backupuser --password 'secure_password' \
  --authenticationDatabase admin \
  --out /backups/full_$(date +%Y%m%d)/
```

Full backups are typically run weekly. Between full backups, incremental or differential backups capture changes.

**Incremental Backup:**

An incremental backup copies only the data that changed since the last backup of any type. This is the most storage-efficient strategy but the most complex to restore from, because you need the full backup plus every incremental backup in sequence.

PostgreSQL does not have native incremental backup in the community edition. The workaround is WAL archiving: archive WAL segments continuously and use them for point-in-time recovery. XtraBackup for MySQL supports true incremental backups.

```bash
# MySQL incremental backup with XtraBackup
# Full backup on Sunday
xtrabackup --backup --target-dir=/backups/full

# Incremental on Monday (based on Sunday's full)
xtrabackup --backup --target-dir=/backups/incr_monday \
  --incremental-basedir=/backups/full

# Incremental on Tuesday (based on Monday's incremental)
xtrabackup --backup --target-dir=/backups/incr_tuesday \
  --incremental-basedir=/backups/incr_monday
```

**Restoring MySQL Incremental Backups:**

```bash
# 1. Apply log to full backup
xtrabackup --prepare --apply-log-only --target-dir=/backups/full

# 2. Apply first incremental
xtrabackup --prepare --apply-log-only --target-dir=/backups/full \
  --incremental-dir=/backups/incr_monday

# 3. Apply final incremental (no --apply-log-only)
xtrabackup --prepare --target-dir=/backups/full \
  --incremental-dir=/backups/incr_tuesday

# 4. Restore
systemctl stop mysql
rm -rf /var/lib/mysql/*
xtrabackup --copy-back --target-dir=/backups/full
chown -R mysql:mysql /var/lib/mysql
systemctl start mysql
```

**Differential Backup:**

A differential backup copies everything that changed since the last full backup. It is easier to restore from than incremental (full backup + latest differential) but stores more data than incremental if changes accumulate between full backups.

PostgreSQL can simulate differential backups using WAL archiving with a base backup taken at the start of each period:

```bash
# WAL archiving configuration in postgresql.conf
archive_mode = on
archive_command = 'cp %p /archive/%f'
wal_level = replica

# Take a base backup at the start of each week
pg_basebackup -h localhost -U replicator \
  -D /backups/base_weekly \
  --wal-method=stream -Fp -P

# During the week, WAL segments are archived automatically
# At any point, you can restore the base backup and replay WAL up to that point
```

**PostgreSQL Point-in-Time Recovery (PITR):**

```bash
# 1. Restore the base backup
systemctl stop postgresql
rm -rf /var/lib/postgresql/16/main/*
cp -r /backups/base_weekly/* /var/lib/postgresql/16/main/

# 2. Configure recovery
cat > /var/lib/postgresql/16/main/postgresql.auto.conf << 'EOF'
restore_command = 'cp /archive/%f %p'
recovery_target_time = '2026-01-15 14:30:00+00'
recovery_target_action = 'promote'
EOF

touch /var/lib/postgresql/16/main/recovery.signal

# 3. Set correct ownership
chown -R postgres:postgres /var/lib/postgresql/16/main/

# 4. Start PostgreSQL
systemctl start postgresql

# 5. Verify recovery
psql -c "SELECT pg_is_in_recovery();"
# Should return false after recovery completes
```

The `recovery_target_time` parameter tells PostgreSQL to replay WAL until it reaches the specified timestamp. This is how you recover from an accidental deletion that happened at 2:30 PM — you restore to 2:29 PM.

Other recovery target options:

```ini
# Recover to a specific transaction
recovery_target_xid = '12345'

# Recover to a specific WAL location
recovery_target_lsn = '0/1234567'

# Recover to a named restore point
recovery_target_name = 'before_migration'
```

You can create named restore points before risky operations:

```sql
-- Before a data migration
SELECT pg_create_restore_point('before_order_migration');

-- After the migration completes successfully, the restore point is no longer needed
-- If the migration fails, recover to the restore point
```

**Backup Retention and Storage Management:**

Backups consume storage. A 500GB database with daily backups grows by 500GB per day. A retention policy determines how long backups are kept before deletion.

Common retention strategy:
- Daily backups: retain for 7 days
- Weekly backups (Sunday): retain for 4 weeks
- Monthly backups (first of month): retain for 12 months
- Yearly backups (January 1): retain for 7 years

```bash
# Backup retention script
#!/bin/bash
BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d)

# Daily retention: keep last 7 days
find "$BACKUP_DIR" -name "daily_*" -mtime +7 -delete

# Weekly retention: keep last 4 weeks
find "$BACKUP_DIR" -name "weekly_*" -mtime +28 -delete

# Monthly retention: keep last 12 months
find "$BACKUP_DIR" -name "monthly_*" -mtime +365 -delete

# Calculate total backup storage used
du -sh "$BACKUP_DIR"
```

For cloud storage, use lifecycle policies instead of scripts:

```json
// AWS S3 lifecycle policy
{
  "Rules": [
    {
      "ID": "BackupLifecycle",
      "Status": "Enabled",
      "Transitions": [
        { "Days": 30, "StorageClass": "STANDARD_IA" },
        { "Days": 90, "StorageClass": "GLACIER" }
      ],
      "Expiration": { "Days": 365 }
    }
  ]
}
```

Moving old backups to cheaper storage classes (Standard-IA after 30 days, Glacier after 90 days) reduces costs by 60-80% while maintaining the ability to restore from older backups if needed.

## Point-in-Time Recovery

PITR combines a base backup with WAL replay to restore the database to any point in time. This is the most powerful recovery tool available.

**WAL Archiving Setup:**

```ini
# postgresql.conf
archive_mode = on
archive_command = 'test ! -f /archive/%f && cp %p /archive/%f'
wal_level = replica
max_wal_senders = 5
```

The `archive_command` copies completed WAL segments to the archive directory. The `test ! -f` prevents overwriting existing archives. The archive directory should be on a different physical disk or on network storage — if the database disk fails, you lose both data and WAL archives.

**Automated WAL Archiving with S3:**

```bash
#!/bin/bash
# archive_wal.sh — upload WAL segments to S3
ARCHIVE_DIR="/archive"
S3_BUCKET="s3://myapp-pg-wal-archive"

# Upload any new WAL files
for file in "$ARCHIVE_DIR"/*; do
    if [ -f "$file" ] && [ ! -f "${file}.uploaded" ]; then
        aws s3 cp "$file" "$S3_BUCKET/$(basename $file)"
        touch "${file}.uploaded"
    fi
done

# Clean up uploaded files older than 7 days
find "$ARCHIVE_DIR" -name "*.uploaded" -mtime +7 -delete
```

**Recovery Scenario:**

Your team ran a migration script at 3:15 PM that corrupted data in the orders table. You need to restore the database to 3:14 PM.

```bash
# 1. Identify the base backup and WAL range
ls -la /backups/
# Base backup from 2:00 AM today
# WAL archives from 2:00 AM to now

# 2. Stop the database
sudo systemctl stop postgresql

# 3. Preserve the current data directory (do not delete it)
sudo mv /var/lib/postgresql/16/main /var/lib/postgresql/16/main_corrupted

# 4. Restore the base backup
sudo cp -r /backups/base_20260115/* /var/lib/postgresql/16/main/
sudo chown -R postgres:postgres /var/lib/postgresql/16/main/

# 5. Configure recovery
sudo -u postgres bash -c 'cat > /var/lib/postgresql/16/main/postgresql.auto.conf << EOF
restore_command = '\''cp /archive/%f %p'\''
recovery_target_time = '\''2026-01-15 15:14:00+00'\''
recovery_target_action = '\''promote'\''
EOF'

sudo -u postgres touch /var/lib/postgresql/16/main/recovery.signal

# 6. Start PostgreSQL (recovery mode)
sudo systemctl start postgresql

# 7. Monitor recovery progress
sudo -u postgres psql -c "SELECT * FROM pg_stat_wal_receiver;"
# Watch for "streaming" status and replay lag approaching zero

# 8. Verify recovery completed
sudo -u postgres psql -c "SELECT pg_is_in_recovery();"
# Must return false

# 9. Verify data integrity
sudo -u postgres psql -d myapp -c "SELECT COUNT(*) FROM orders WHERE created_at < '2026-01-15 15:15:00';"
# Should show pre-corruption count

# 10. Update application connection string and restart
```

## Backup Verification and Integrity Checking

A backup file that exists is not the same as a backup that works. You must verify that backups are complete, consistent, and restorable. Backup failures are silent — the backup script runs, writes a file, and logs success, but the file might be corrupted, truncated, or incomplete.

**PostgreSQL Backup Integrity Checks:**

```bash
# Check pg_dump backup integrity
pg_restore --list /backups/myapp_20260115.dump > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Backup integrity: OK"
else
    echo "Backup integrity: FAILED — file may be corrupted"
fi

# Verify backup file size is reasonable
EXPECTED_SIZE=$(psql -h localhost -U postgres -At -c \
  "SELECT pg_database_size('myapp');")
ACTUAL_SIZE=$(stat -c%s /backups/myapp_20260115.dump)

# Backup should be roughly 30-50% of database size (compressed)
MIN_SIZE=$((EXPECTED_SIZE / 4))
MAX_SIZE=$((EXPECTED_SIZE))
if [ "$ACTUAL_SIZE" -lt "$MIN_SIZE" ] || [ "$ACTUAL_SIZE" -gt "$MAX_SIZE" ]; then
    echo "WARNING: Backup size $ACTUAL_SIZE seems unusual (expected $MIN_SIZE-$MAX_SIZE)"
fi
```

**MySQL Backup Integrity Checks:**

```bash
# Check mysqldump backup integrity
gunzip -t /backups/full_20260115.sql.gz
if [ $? -eq 0 ]; then
    echo "Backup integrity: OK"
else
    echo "Backup integrity: FAILED — file may be corrupted"
fi

# Verify XtraBackup integrity
xtrabackup --prepare --target-dir=/backups/full 2>&1 | grep -q "completed OK"
if [ $? -eq 0 ]; then
    echo "XtraBackup integrity: OK"
else
    echo "XtraBackup integrity: FAILED"
fi
```

**Automated Backup Verification Script:**

```bash
#!/bin/bash
# test_backup.sh — verify backup integrity by restoring to a test server

```bash
#!/bin/bash
# test_backup.sh — verify backup integrity by restoring to a test server

BACKUP_FILE="$1"
TEST_DB="backup_test_$(date +%Y%m%d_%H%M%S)"
TEST_HOST="localhost"
TEST_PORT="5433"

# Create a temporary PostgreSQL instance for testing
pg_ctl -D /tmp/pg_test -l /tmp/pg_test.log start -o "-p $TEST_PORT"

# Restore the backup
pg_restore -h $TEST_HOST -p $TEST_PORT -U postgres -d postgres "$BACKUP_FILE"

# Run verification queries
ERRORS=0

# Check table counts
TABLE_COUNT=$(psql -h $TEST_HOST -p $TEST_PORT -U postgres -At -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
if [ "$TABLE_COUNT" -lt 1 ]; then
    echo "ERROR: No tables found in restored backup"
    ERRORS=$((ERRORS + 1))
fi

# Check row counts for critical tables
for TABLE in orders users products; do
    COUNT=$(psql -h $TEST_HOST -p $TEST_PORT -U postgres -At -c \
      "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null)
    if [ -z "$COUNT" ]; then
        echo "ERROR: Table $TABLE not found or empty"
        ERRORS=$((ERRORS + 1))
    else
        echo "OK: Table $TABLE has $COUNT rows"
    fi
done

# Check that recent data is present
RECENT=$(psql -h $TEST_HOST -p $TEST_PORT -U postgres -At -c \
  "SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '7 days';")
echo "OK: $RECENT orders in the last 7 days"

# Clean up
pg_ctl -D /tmp/pg_test stop

if [ $ERRORS -eq 0 ]; then
    echo "BACKUP TEST PASSED: $BACKUP_FILE"
else
    echo "BACKUP TEST FAILED: $BACKUP_FILE ($ERRORS errors)"
    exit 1
fi
```

**Backup Monitoring:**

```sql
-- PostgreSQL: check backup status
-- Track backup metadata in a table
CREATE TABLE backup_log (
    id BIGSERIAL PRIMARY KEY,
    backup_type VARCHAR(20) NOT NULL,  -- 'full', 'incremental', 'wal'
    backup_file TEXT NOT NULL,
    backup_size BIGINT,
    duration_seconds INT,
    status VARCHAR(10) NOT NULL,  -- 'success', 'failed', 'testing'
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check last backup
SELECT * FROM backup_log ORDER BY created_at DESC LIMIT 5;

-- Alert if no successful backup in 24 hours
SELECT CASE
    WHEN MAX(created_at) < NOW() - INTERVAL '24 hours'
    THEN 'ALERT: No backup in 24 hours'
    ELSE 'OK: Last backup at ' || MAX(created_at)::TEXT
END AS backup_status
FROM backup_log WHERE status = 'success';
```

**Backup Testing Schedule:**

- Daily: Verify backup file exists and is non-empty
- Weekly: Restore backup to test server and verify table counts
- Monthly: Full disaster recovery drill — restore to a separate environment, run application smoke tests
- Quarterly: Test backup encryption/decryption, verify key management

## Common Backup Mistakes

These mistakes are surprisingly common and can turn a backup strategy into a false sense of security.

**Mistake 1: Not Testing Restores**

The backup runs every night. The log shows success. The file is the right size. But nobody has actually restored from it. When the disaster happens, the restore fails because the backup was created with a different PostgreSQL version, or the custom format flag was wrong, or the file was silently corrupted during transfer to offsite storage.

Test restores monthly. Document the results. If a restore fails, fix it immediately — do not wait for the next monthly test.

**Mistake 2: Backups on the Same Disk as Data**

If the disk fails, both your data and your backups are gone. Backups must be on a different physical disk, a different server, or in cloud object storage (S3, GCS, Azure Blob). The 3-2-1 rule: 3 copies of data, on 2 different media types, with 1 offsite.

**Mistake 3: No Backup Encryption**

If an attacker steals your backup tapes or gains access to your S3 bucket, unencrypted backups give them everything. Encrypt backups at rest (GPG, age, or cloud-native encryption) and in transit (TLS for network transfers).

```bash
# Encrypt backup with GPG
gpg --symmetric --cipher-algo AES256 \
  --passphrase-file /etc/backup-encryption.key \
  --batch \
  /backups/myapp_20260115.dump

# Decrypt when restoring
gpg --decrypt --batch \
  --passphrase-file /etc/backup-encryption.key \
  /backups/myapp_20260115.dump.gpg | pg_restore -d myapp
```

**Mistake 4: Ignoring WAL Archiving for PostgreSQL**

pg_dump alone cannot give you point-in-time recovery. If you run pg_dump daily at 2 AM and a table is dropped at 10 PM, you lose 20 hours of data. WAL archiving fills this gap by archiving every WAL segment, allowing recovery to any point in time.

**Mistake 5: No Backup Monitoring**

Backups fail silently. The disk fills up, the network times out, the backup user's password expires. Set up alerts for:
- Backup file not created in the last 24 hours
- Backup file size is significantly different from expected
- WAL archive directory growing beyond expected retention
- Backup test restore failed

## Disaster Recovery Planning

Disaster recovery (DR) planning defines how you recover from catastrophic failures: data center loss, ransomware, simultaneous disk failures, or human error at scale.

**RPO and RTO:**

Recovery Point Objective (RPO): How much data can you afford to lose? If your RPO is 1 hour, you need backups at least every hour. If your RPO is 0, you need synchronous replication.

Recovery Time Objective (RTO): How quickly must you recover? If your RTO is 1 hour, you need automated failover and pre-staged recovery infrastructure. If your RTO is 15 minutes, you need hot standby systems.

| Scenario | RPO | RTO | Strategy |
|---|---|---|---|
| Accidental deletion | 0 | 1 hour | Point-in-time recovery |
| Database corruption | 0 | 4 hours | WAL replay to pre-corruption |
| Disk failure | 0 | 15 minutes | Replication + automatic failover |
| Data center loss | 1 hour | 4 hours | Cross-region replication + DR site |
| Ransomware | 0 | 2 hours | Offline backups + clean room recovery |

**DR Architecture Patterns:**

Cold Standby: A second server with the same configuration but no data. Restore from backup when needed. RTO: hours. Lowest cost.

Warm Standby: A second server with data replicated asynchronously. Can be promoted to primary in minutes. RTO: 15-60 minutes. Moderate cost.

Hot Standby: A second server with data replicated synchronously. Automatic failover. RTO: seconds to minutes. Highest cost.

**DR Runbook:**

Every DR plan needs a runbook — a step-by-step document that any qualified DBA can follow without prior knowledge of the specific system.

```markdown
## DR Runbook: Database Recovery

### Scenario: Primary database server failure

1. **Assess the situation** (5 minutes)
   - Check monitoring dashboard for server status
   - Verify the failure is not a network issue
   - Notify the on-call team lead

2. **Activate DR site** (10 minutes)
   - Run: ansible-playbook -i dr_inventory activate_dr.yml
   - Verify standby server health

3. **Promote standby** (5 minutes)
   - SSH to standby: ssh dr-server
   - Run: sudo systemctl stop postgresql
   - Edit postgresql.conf: hot_standby = off
   - Remove standby.signal
   - Start: sudo systemctl start postgresql
   - Verify: sudo -u postgres psql -c "SELECT pg_is_in_recovery();"
   - Expected output: f (not in recovery = promoted)

4. **Update application** (10 minutes)
   - Update DNS record to point to DR server IP
   - Wait for DNS propagation (TTL = 60 seconds)
   - Restart application servers

5. **Verify recovery** (15 minutes)
   - Run application health checks
   - Check recent transactions for completeness
   - Monitor error logs for 30 minutes

6. **Post-recovery** (next business day)
   - Investigate root cause of primary failure
   - Rebuild primary server
   - Set up replication from new primary to rebuilt server
   - Failback when ready
```

## Real Scenario: Recovering from Accidental Data Deletion

You are the DBA for a SaaS application. At 2:47 PM on a Tuesday, a junior developer runs a DELETE statement without a WHERE clause on the production orders table. The query deleted 847,000 orders. The application immediately starts returning errors to users. You have 10 minutes to recover before the support team is overwhelmed.

**Immediate Response (First 5 Minutes):**

```sql
-- 1. Stop the bleeding — identify the session that ran the DELETE
SELECT pid, usename, application_name, query_start, query
FROM pg_stat_activity
WHERE query LIKE '%DELETE FROM orders%'
  AND state = 'active';

-- 2. Terminate the session if it is still running (it probably finished already)
SELECT pg_terminate_backend(<pid_from_above>);

-- 3. Check if the DELETE committed
SELECT * FROM pg_stat_activity WHERE datname = 'myapp';

-- 4. Do NOT start making changes yet — assess first
```

**Recovery Decision (Minutes 5-10):**

The DELETE committed at 2:47 PM. You need to restore to 2:46 PM. Options:

1. Restore from last night's backup and replay WAL to 2:46 PM — takes 30-60 minutes
2. Use the continuous WAL archive to replay to 2:46 PM — takes 15-30 minutes

Since you have WAL archiving configured, option 2 is faster.

**Execution (Minutes 10-30):**

```bash
# 1. Stop the application (prevent further writes)
sudo systemctl stop myapp

# 2. Stop PostgreSQL
sudo systemctl stop postgresql

# 3. Save the current data directory (evidence for post-mortem)
sudo mv /var/lib/postgresql/16/main /var/lib/postgresql/16/main_deleted

# 4. Restore the base backup from this morning
sudo cp -r /backups/base_20260115/* /var/lib/postgresql/16/main/
sudo chown -R postgres:postgres /var/lib/postgresql/16/main/

# 5. Configure recovery to stop at 2:46 PM (1 minute before the DELETE)
sudo -u postgres bash -c 'cat > /var/lib/postgresql/16/main/postgresql.auto.conf << EOF
restore_command = '\''cp /archive/%f %p'\''
recovery_target_time = '\''2026-01-15 14:46:00+00'\''
recovery_target_action = '\''pause'\''
EOF'

sudo -u postgres touch /var/lib/postgresql/16/main/recovery.signal

# 6. Start PostgreSQL (recovery mode)
sudo systemctl start postgresql

# 7. Monitor recovery
watch -n 5 'sudo -u postgres psql -c "SELECT status, received_lsn, latest_end_lsn FROM pg_stat_wal_receiver;"'
```

**Verification (Minutes 30-35):**

```sql
-- 1. Verify recovery is paused at the right point
SELECT pg_is_in_recovery();  -- Should return true (paused)

-- 2. Check the order count
SELECT COUNT(*) FROM orders;
-- Should be approximately 847,000 more than the post-deletion count

-- 3. Check the last few orders before the DELETE
SELECT id, created_at, total_amount
FROM orders
ORDER BY created_at DESC
LIMIT 10;
-- The most recent order should be from before 2:47 PM

-- 4. Check that no orders exist after 2:47 PM
SELECT COUNT(*) FROM orders WHERE created_at > '2026-01-15 14:47:00';
-- Should return 0
```

**Resume Service (Minutes 35-40):**

```sql
-- 1. Promote the database from recovery mode
SELECT pg_wal_replay_resume();
-- Wait for recovery to complete
SELECT pg_is_in_recovery();  -- Should return false

-- 2. Update application connection string if needed (same server, so no change)
-- 3. Start the application
sudo systemctl start myapp

-- 4. Verify application is serving requests
curl -s http://localhost:3000/api/health
```

**Post-Incident (Next Day):**

1. Root cause: The developer ran the query without a WHERE clause because the query builder generated an empty WHERE clause when no filters were selected.
2. Fix: Add application-level validation that prevents empty WHERE clauses on DELETE and UPDATE statements.
3. Prevention: Implement pgAudit to log all DELETE operations and set up alerts for large deletes.
4. Recovery time: 35 minutes from incident to service restoration. RTO was met (under 1 hour).
5. Data loss: Zero. All orders from before 2:46 PM were recovered.

## Assessment

**Lab Tasks:**

1. Set up WAL archiving for PostgreSQL. Take a base backup, make several data changes, and then perform point-in-time recovery to a specific time before the changes. Verify the recovery is correct. Time limit: 60 minutes.

2. Implement a backup rotation strategy: full backup weekly, WAL archiving continuously. Create a script that automates backup verification by restoring to a test instance and checking table counts. Time limit: 45 minutes.

3. Simulate a disaster recovery scenario: set up a primary and standby PostgreSQL server. Simulate primary failure by shutting it down. Promote the standby and verify the application can continue operating. Document the steps and timing. Time limit: 45 minutes.

4. Create a DR runbook for a specific scenario (data center loss, ransomware, or accidental deletion). The runbook must include step-by-step instructions, timing estimates, verification steps, and rollback procedures. Time limit: 30 minutes.

**Grading Criteria:**
- PITR implementation (30%): WAL archiving configured correctly, recovery to specific time successful, data integrity verified
- Backup automation (25%): Verification script works correctly, backup rotation is implemented
- DR execution (30%): Failover completed successfully, application continues operating, timing documented
- Runbook quality (15%): Clear, actionable steps with timing estimates and verification checkpoints

**Evidence:**
- WAL archiving configuration and PITR recovery output
- Backup verification script with test results
- DR failover timing and verification output
- DR runbook document
