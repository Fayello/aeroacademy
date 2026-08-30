# Module 2 — PostgreSQL Administration: Installation, Configuration, Backup

## What You'll Actually Do

Install PostgreSQL, tune its configuration for a real workload, set up automated backups, and restore from a backup. You'll walk away knowing how to keep a Postgres instance alive and recoverable.

## Content

### Installation

On Debian/Ubuntu:

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

On RHEL/CentOS:

```bash
sudo dnf install -y postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Verify it's running:

```bash
sudo -u postgres psql -c "SELECT version();"
```

### Configuration

The main config file is `postgresql.conf`. The most impactful settings:

```bash
# Find your config
sudo -u postgres psql -c "SHOW config_file;"
```

Key settings to tune:

```ini
# Memory — set to ~25% of system RAM for dedicated DB server
shared_buffers = 4GB          # 25% of 16GB
effective_cache_size = 12GB   # 75% of RAM
work_mem = 64MB               # Per-sort/hash operation
maintenance_work_mem = 1GB    # For VACUUM, CREATE INDEX

# Write performance
wal_buffers = 64MB
checkpoint_completion_target = 0.9
max_wal_size = 4GB

# Connections
max_connections = 100         # Use PgBouncer for more
```

After editing, reload without restart:

```bash
sudo systemctl reload postgresql
```

### Connection Configuration

`pg_hba.conf` controls who can connect and how:

```ini
# TYPE  DATABASE  USER      ADDRESS         METHOD
local   all       postgres                  peer
local   all       all                       scram-sha-256
host    all       all       10.0.0.0/24    scram-sha-256
host    all       all       127.0.0.1/32   scram-sha-256
```

Create a production user (never use `postgres` for apps):

```sql
CREATE USER appuser WITH PASSWORD 'strongpasswordhere';
CREATE DATABASE aeroacademy OWNER appuser;
GRANT ALL PRIVILEGES ON DATABASE aeroacademy TO appuser;
```

### Automated Backups with pg_dump

Full database dump:

```bash
# Plain SQL dump
pg_dump -U postgres -h localhost aeroacademy > /backups/aeroacademy_$(date +%Y%m%d_%H%M%S).sql

# Custom format (compressed, can be selective restore)
pg_dump -U postgres -Fc aeroacademy > /backups/aeroacademy_$(date +%Y%m%d_%H%M%S).dump
```

Automate with a cron job:

```bash
# /etc/cron.d/pgbackup
0 2 * * * postgres pg_dump -Fc aeroacademy > /backups/aeroacademy_$(date +\%Y\%m\%d).dump
0 2 * * * postgres find /backups -name "*.dump" -mtime +7 -delete
```

### WAL Archiving for Point-in-Time Recovery

Edit `postgresql.conf`:

```ini
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archive/%f'
```

Create the archive directory:

```bash
sudo mkdir -p /archive
sudo chown postgres:postgres /archive
```

### Restoring from Backup

```bash
# From plain SQL dump
psql -U postgres -d aeroacademy < /backups/aeroacademy_20251201.sql

# From custom format
pg_restore -U postgres -d aeroacademy /backups/aeroacademy_20251201.dump

# With options: clean first, no owner
pg_restore -U postgres -d aeroacademy --clean --no-owner /backups/aeroacademy_20251201.dump
```

### Monitoring Basics

```sql
-- Active connections
SELECT pid, usename, application_name, client_addr, state, query
FROM pg_stat_activity
WHERE state = 'active';

-- Database size
SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname))
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;

-- Table bloat and dead tuples
SELECT schemaname, relname, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 10;
```

## Assessment

**Lab task — 50 minutes**

1. Install PostgreSQL on a fresh Ubuntu 22.04 VM.
2. Tune `shared_buffers`, `work_mem`, and `max_connections` for a machine with 8GB RAM. Document your reasoning.
3. Create a database called `labtest` with a `products` table (at least 100 rows).
4. Set up a cron job that dumps `labtest` every hour to `/backups/`.
5. Simulate a disaster: drop the `products` table. Restore the database from the dump.
6. Verify the restored data matches the original row count.

**Grading criteria:**
- PostgreSQL installed and running (10 points)
- Configuration changes documented with reasoning (20 points)
- Database created with realistic data (15 points)
- Backup cron job functioning (20 points)
- Successful restore after drop (25 points)
- Verification step shows data integrity (10 points)

## Evidence

- `postgresql.conf` changes with comments
- Cron job output in `/backups/`
- Screenshot of dropped table, restore command, and row count verification
- Size comparison before and after restore
