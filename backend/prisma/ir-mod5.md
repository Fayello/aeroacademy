# Module 5 — Recovery

## What You'll Actually Do

The threat is gone. Now you bring systems back online safely. You'll restore services from backups, validate that everything works, and set up monitoring to catch reinfection. Recovery isn't flipping a switch — it's a controlled process.

## Recovery Strategy

```text
Recovery order matters:
1. Restore infrastructure (network, DNS, core services)
2. Restore data (from verified clean backups)
3. Restore applications (patched versions)
4. Validate functionality
5. Monitor closely for 72 hours
6. Gradually return to normal operations
```

Don't restore everything at once. If the attacker is still in the environment, you'll just give them fresh targets.

## Restoring from Backups

```bash
# Verify backup integrity before restoring
sha256sum backup_2026-08-25.tar.gz
# Compare with known-good checksum

# Check backup contents
tar -tzf backup_2026-08-25.tar.gz | head -20
# Verify no suspicious files

# Restore database from backup
pg_restore -d production_db backup_2026-08-25.dump
# Verify after restore
psql -d production_db -c "SELECT count(*) FROM users;"

# Restore files
tar -xzf backup_2026-08-25.tar.gz -C /var/www/

# Set correct ownership
chown -R www-data:www-data /var/www/
chmod -R 755 /var/www/
```

## System Validation

```bash
# Verify services are running correctly
systemctl status nginx
systemctl status postgresql
systemctl status app-service

# Check for expected ports
ss -tunlp | grep -E ":(80|443|5432|8080)"

# Test application functionality
curl -s -o /dev/null -w "%{http_code}" http://localhost/health
# Should return 200

# Verify file integrity
find /var/www/ -type f -newer /tmp/recovery_start -ls

# Check logs for errors
journalctl --since "1 hour ago" -p err
tail -100 /var/log/nginx/error.log
```

## Monitoring for Reinfection

```bash
# Set up alerts for known indicators
# File integrity monitoring (AIDE)
sudo aide --check

# Network monitoring for known bad IPs
sudo tcpdump -i ens3 host 198.51.100.77 -w /tmp/monitor.pcap &

# Log monitoring for suspicious activity
tail -f /var/log/auth.log | grep "Failed password"

# Process monitoring
ps aux --sort=-cpu | head -10
# Run every 5 minutes for the first 24 hours

# Monitor for new cron jobs
inotifywait -m -e modify /var/spool/cron/ /etc/crontab
```

## Gradual Service Restoration

```text
Phase 1: Internal testing (2 hours)
  - Restore one system
  - Verify it works
  - Monitor for issues

Phase 2: Limited rollout (4 hours)
  - Restore dependent systems one at a time
  - Test after each restoration
  - Keep monitoring active

Phase 3: Full restoration (24 hours)
  - Restore all systems
  - Verify end-to-end functionality
  - Continue enhanced monitoring

Phase 4: Return to normal (72 hours)
  - Remove emergency monitoring
  - Resume standard operations
  - Keep incident-specific logging for 30 days
```

## Recovery Checklist

```text
Before declaring recovery complete:
□ All affected systems restored from verified clean backups
□ All applications functioning correctly
□ All services passing health checks
□ No errors in application or system logs
□ File integrity checks pass
□ Network connectivity verified
□ Monitoring configured and alerting
□ Users notified that services are restored
□ Credentials rotated since compromise
□ Incident response team confirms recovery
```

## Real Task: Recover and Validate

```text
Scenario: A web server was compromised and contained. Now you need to recover it.

The server runs:
- nginx serving a web application
- PostgreSQL database
- Redis cache
- Internal API on port 8080

Steps:
1. Verify the backup is clean (check for malware, backdoors)
2. Restore the web application from backup
3. Restore the database from backup
4. Verify the Redis cache is clean (flush if needed)
5. Start all services in the correct order
6. Validate each service responds correctly
7. Set up monitoring for 72 hours
8. Document the recovery process
```

## Assessment

**Lab task (30 min):**

1. Verify a backup is clean before restoring
2. Restore a system from backup
3. Validate all services function correctly
4. Configure monitoring for reinfection indicators
5. Document the recovery process with timestamps
6. Create a post-recovery monitoring plan

**Grading:**
- Backup verification thorough: 15%
- Restoration successful: 25%
- Validation complete: 20%
- Monitoring configured: 15%
- Documentation clear: 15%
- Monitoring plan practical: 10%

## Evidence

- **OutcomeEvidence:** `IR-LO5 — Recovery`
