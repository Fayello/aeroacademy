# Module 7 — Backup and Recovery

There are two types of sysadmins: those who have experienced data loss, and those who will. The difference between a minor inconvenience and a career-ending disaster is whether you have tested backups. This module covers backup strategies, tools, database backups, disaster recovery planning, and the critical step most sysadmins skip — verifying that your backups actually work. You will learn to build a complete backup system with automated verification and disaster recovery procedures.

## Backup Strategies

### Full Backup

A complete copy of all data. Simple to restore but slow to create and requires the most storage. Three full backups of 100 GB each require 300 GB of storage. Full backups are the foundation of every backup strategy because they provide a complete baseline that incrementals and differentials build upon.

### Incremental Backup

Only backs up data that changed since the last backup of any type. Fast to create with minimal storage but restore requires the last full backup plus every incremental since then. A full backup of 100 GB followed by two incrementals of 5 GB and 2 GB requires only 107 GB total but restoring requires all three archives in sequence. Incrementals are efficient for storage but slow to restore because you need multiple archives.

### Differential Backup

Backs up everything that changed since the last full backup. Faster to restore than incremental since you only need the full plus the latest differential, but each differential grows over time as it accumulates all changes since the last full. A full backup of 100 GB followed by differentials of 5 GB and 7 GB requires 112 GB and restoring needs only the full and the latest differential.

### 3-2-1 Rule

The gold standard for backup strategy: three copies of data, two different storage media, and one offsite copy. This protects against disk failure (multiple copies), media failure (different media types), and site disaster (offsite copy). Follow this rule for any data that matters.

### Backup Targets

**Local disk** provides fast and cheap initial backup but is a single point of failure. **NAS or NFS** offers centralized accessible storage but shares building risk. **Cloud storage** like S3 or B2 provides offsite durability and scalability but costs money and requires bandwidth. **Tape** offers air-gapped long-term storage but is slow and requires expensive drives. Use a combination: local for fast recovery, cloud for offsite protection.

## rsync

The Swiss army knife of file synchronization. rsync copies only the differences between source and destination, making it efficient for both initial and incremental copies. It uses a checksum-based algorithm to identify changed blocks rather than comparing file sizes or timestamps.

### Basic Usage

Use `rsync -avz` for archive mode with compression, `--delete` to remove files at destination that no longer exist at source, `--exclude` for patterns to skip, `--bwlimit` for bandwidth throttling (useful for not saturating network links), `-e ssh` for remote transfer over SSH, and `-P` for progress display. The `-a` flag preserves permissions, ownership, timestamps, and symlinks.

### rsync as a Backup Solution

Create incremental backups using hardlinks. Run rsync with `--link-dest` pointing to the latest backup directory. Files that have not changed are hardlinked to the previous backup consuming no additional disk space. Update the latest symlink after each backup. This gives you a Time Machine-like backup system where each backup appears complete but only stores changed files.

### Bandwidth Management

Use `--bwlimit=10000` to limit transfer to 10 MB/s, preventing rsync from saturating network links during business hours. Schedule heavy backups during off-peak hours. Use `--partial` to keep partially transferred files for resume on next run.

## tar with Rotation

tar creates self-contained archives. Use `czf` for gzip compression, `--exclude` for patterns, and `--listed-incremental` for incremental backups with a snapshot file. Restore with `xzf` and `-C` for target directory. A simple rotation script keeps 7 daily, 4 weekly, and 6 monthly backups using `find` and `delete` based on file modification time.

### Restoring from tar

Always verify archive integrity before restoring: `tar tzf backup.tar.gz | head -20` shows the first 20 files. For a full restore: `tar xzf backup.tar.gz -C /`. For specific files: `tar xzf backup.tar.gz -C / path/to/file`. List all contents without extracting with `tar tzf`.

## restic

restic is a modern backup tool supporting deduplication, encryption, and multiple backends. Initialize a repository, create backups with tags for filtering, list and diff snapshots, restore to a target directory, forget old snapshots with retention policies, prune to reclaim space, and check repository integrity.

### Benefits Over tar/rsync

Deduplication means identical files across backups are stored once. Encryption protects data at rest by default. Integrity checking happens on every operation. Consistent commands work across local, S3, SFTP, and B2 backends. Snapshots provide point-in-time views with metadata and tags for easy filtering.

### restic Workflow

```bash
# Initialize
restic init --repo /backups/restic-repo

# Backup with tags
restic -r /backups/restic-repo backup /data --tag "production" --tag "daily"

# List snapshots
restic -r /backups/restic-repo snapshots

# Restore
restic -r /backups/restic-repo restore latest --target /restore

# Cleanup old snapshots
restic -r /backups/restic-repo forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune
```

## borgbackup

Borg is another deduplicating encrypting backup tool popular for its efficient chunking algorithm and built-in compression. Initialize with encryption, create archives with compression and checkpoints for resumability, list and extract archives, mount archives as directories for browsing, and prune old archives with retention policies. Borg compacts repositories after pruning to reclaim space. Use `--compression zstd,3` for a good balance of speed and compression ratio.

## Database Backups

### PostgreSQL

Use `pg_dump` for single database backup with custom format (`-Fc`) for selective restore, `pg_dumpall` for all databases including roles, parallel backup with `-Fd -j` for speed, and `pg_restore` for restoration. For point-in-time recovery, configure WAL archiving with `archive_mode = on` and `archive_command`.

Automate with scripts that create dated backups, rotate old ones, and verify integrity. Store backups both locally and offsite. Test restoration to a temporary database regularly.

### MySQL/MariaDB

Use `mysqldump` for database backup with `--all-databases` for everything, `--routines` and `--events` for stored procedures, gzip compression, and `mysql` command for restoration. For large databases, use `xtrabackup` for hot backups that do not lock tables. Automate with scripts similar to PostgreSQL backup automation.

## Backup Testing and Verification

A backup you have not tested is not a backup. Build verification into your backup process. Create scripts that validate archive integrity with `tar tzf`, verify checksums, restore to temporary locations, and report results. For database backups, verify dumps are valid by listing contents or restoring to a test database.

### Backup Monitoring

Add checks to your monitoring system: verify backups exist and are recent with `find` and `-mtime`, check for zero-byte backups (which indicate failed backup processes), and monitor backup logs for errors. Set up alerts for missed backups — if a backup fails at 2 AM and nobody checks until the next disaster, the backup is useless.

### Automated Verification Script

Create a script that runs after each backup to verify integrity. Check that the backup file exists and is not zero bytes. Verify the archive can be listed without errors. For restic and borg, run their built-in check commands. Log results and alert on failures.

## Disaster Recovery Planning

### Recovery Time Objective (RTO)

How quickly must the system be back online? RTO less than 1 hour requires hot standby with real-time replication. RTO less than 4 hours needs warm standby with regular backups. RTO less than 24 hours allows cold standby with external storage. RTO less than 1 week allows tape or cold cloud storage.

### Recovery Point Objective (RPO)

How much data loss is acceptable? RPO of 0 requires synchronous replication. RPO less than 1 hour needs continuous replication or frequent backups. RPO less than 24 hours allows daily backups. RPO less than 1 week allows weekly backups.

### Recovery Runbook

Document every step needed to recover: assess the situation (what happened, when, how much data), stop writes to the database (put application in maintenance mode), identify the last good backup, restore the backup, apply WAL logs for point-in-time recovery if available, validate restored data (check row counts, integrity), switch the application to the restored database, and conduct a post-incident review.

Keep the runbook in a location accessible without network connectivity (printed copy, offline device). A runbook that is only available on the server you need to recover is useless.

## Recovering from Accidental Data Deletion

Real scenario: a developer runs `DELETE FROM users WHERE 1=1` in production. The table has 500,000 rows. The application is returning errors.

Immediate response: stop the application from making more changes by revoking write access, check for point-in-time recovery capability, and do not panic or drop the table.

Option 1 is point-in-time recovery using WAL if configured. Restore the base backup and replay WAL to just before the deletion time. This gives you zero data loss.

Option 2 is restore from the last backup and accept some data loss. Calculate how much data was lost based on the time between the last backup and the deletion.

Option 3 uses LVM or ZFS snapshots to access a pre-deletion copy of the data. Mount the snapshot read-only, extract the needed data, and import it into the production database.

## Practical Assessment

**Lab Task:** Backup and recovery exercise (50 minutes)

1. Create backup directory structure with daily, weekly, and monthly subdirectories
2. Write an incremental rsync backup script with hardlinks
3. Create a restic backup repository and back up a test directory
4. Back up a test PostgreSQL database using pg_dump
5. Write a backup rotation script that maintains 7 daily and 4 weekly backups
6. Verify a backup by restoring it to a different location
7. Write a disaster recovery runbook for a production database
8. Simulate accidental data deletion and recover using your backup
9. Create an automated backup verification script
10. Document the complete backup strategy including RTO/RPO

**Grading criteria:** Backup directory structure organized (5 points), rsync backup with hardlinks working (15 points), restic repository created and backup functional (15 points), PostgreSQL backup and restore working (15 points), backup rotation script handles retention correctly (10 points), backup verification script tests integrity (10 points), recovery from simulated data loss successful (15 points), documentation includes RTO/RPO and strategy (15 points).

## Backup Encryption

Encrypt backups to protect sensitive data. Use `gpg` for symmetric encryption: `tar czf - /data | gpg -c > backup.tar.gz.gpg`. For asymmetric encryption with key pairs: `gpg --gen-key` once, then `tar czf - /data | gpg -e -r recipient@email.com > backup.tar.gz.gpg`. Store the GPG private key securely separate from backups.

restic and borgbackup encrypt by default. When initializing a repository, you set an encryption key. Without the key, the backup is unreadable. This is a significant advantage over unencrypted tar/rsync backups.

### Key Management for Backup Encryption

Store encryption keys in a secure location separate from the backups. Options include: printed copy in a safe, password manager, dedicated key server, or sealed envelope with a trusted third party. Test key recovery periodically — an encrypted backup without the key is as good as lost.

## Backup Network Considerations

### Bandwidth Management

Limit backup bandwidth with `rsync --bwlimit` or restic `--max-bandwidth` to prevent saturating network links during business hours. Schedule large backups during off-peak hours (typically 2-5 AM). For cross-site backups, consider dedicated VPN tunnels or private network connections.

### Compression Before Transfer

Compress data before network transfer to reduce bandwidth usage. tar with gzip or zstd compression, or restic/borg with built-in compression. For already-compressed data (images, videos, zip files), skip compression to save CPU.

### Backup Verification Over Network

Verify remote backups by running integrity checks on the backup server. For restic: `restic check`. For borg: `borg check`. For rsync: compare checksums with `rsync -avzn --checksum`. Do not assume remote backups are intact without verification.

## Disaster Recovery Testing

### Tabletop Exercises

Walk through disaster scenarios without actually performing recovery. Document the steps, identify gaps, and update the runbook. Common scenarios: complete server loss, database corruption, ransomware attack, data center outage, key personnel unavailable.

### Partial Recovery Tests

Restore individual files or databases to a test environment. Verify data integrity. Time the recovery process. Compare actual RTO with target RTO. Identify bottlenecks in the recovery process.

### Full Recovery Drills

Perform complete server recovery from backups. Build a new server, restore all data, verify application functionality. This is the ultimate test of your backup strategy. Schedule quarterly full recovery drills for critical systems.

### Backup Audit Trail

Maintain a log of all backup operations, verification results, and recovery tests. Include: backup date, size, duration, verification status, any errors encountered, and retention applied. This audit trail is essential for compliance and incident investigation.

## Practical Assessment

**Lab Task:** Backup and recovery exercise (50 minutes)

1. Create backup directory structure with daily, weekly, and monthly subdirectories
2. Write an incremental rsync backup script with hardlinks
3. Create a restic backup repository and back up a test directory
4. Back up a test PostgreSQL database using pg_dump
5. Write a backup rotation script that maintains 7 daily and 4 weekly backups
6. Verify a backup by restoring it to a different location
7. Write a disaster recovery runbook for a production database
8. Simulate accidental data deletion and recover using your backup
9. Create an automated backup verification script
10. Document the complete backup strategy including RTO/RPO

**Grading criteria:** Backup directory structure organized (5 points), rsync backup with hardlinks working (15 points), restic repository created and backup functional (15 points), PostgreSQL backup and restore working (15 points), backup rotation script handles retention correctly (10 points), backup verification script tests integrity (10 points), recovery from simulated data loss successful (15 points), documentation includes RTO/RPO and strategy (15 points).

## Cloud Backup Integration

### S3 and S3-Compatible Storage

Store backups in cloud object storage for offsite protection. Use `aws s3 sync` for simple uploads, restic with S3 backend for deduplicated encrypted backups, or rclone for multi-cloud support. Implement lifecycle policies to move old backups to cheaper storage tiers (Standard → Glacier → Deep Archive).

### Backup Cost Optimization

Cloud backup costs depend on storage class, retrieval frequency, and data volume. Use compression before upload. Deduplicate with restic/borg. Implement lifecycle policies. Monitor costs with cloud provider billing tools. Set budget alerts to prevent surprise bills.

### Multi-Region Replication

For critical data, replicate backups across multiple geographic regions. Use S3 Cross-Region Replication, restic with multiple repositories, or rclone with copy operations. Test restoration from remote regions periodically.

## Practical Assessment

**Lab Task:** Backup and recovery exercise (50 minutes)

1. Create backup directory structure with daily, weekly, and monthly subdirectories
2. Write an incremental rsync backup script with hardlinks
3. Create a restic backup repository and back up a test directory
4. Back up a test PostgreSQL database using pg_dump
5. Write a backup rotation script that maintains 7 daily and 4 weekly backups
6. Verify a backup by restoring it to a different location
7. Write a disaster recovery runbook for a production database
8. Simulate accidental data deletion and recover using your backup
9. Create an automated backup verification script
10. Document the complete backup strategy including RTO/RPO

**Grading criteria:** Backup directory structure organized (5 points), rsync backup with hardlinks working (15 points), restic repository created and backup functional (15 points), PostgreSQL backup and restore working (15 points), backup rotation script handles retention correctly (10 points), backup verification script tests integrity (10 points), recovery from simulated data loss successful (15 points), documentation includes RTO/RPO and strategy (15 points).

## Evidence

Collect the following for your portfolio: backup directory structure and rotation script, rsync backup script with hardlink support, restic backup commands and snapshot listing, PostgreSQL backup and restore output, recovery runbook document, output of backup verification script, screenshot of successful data recovery, and complete backup strategy document with RTO/RPO.
