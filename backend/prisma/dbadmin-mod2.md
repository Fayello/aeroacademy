# Module 2: PostgreSQL Administration

PostgreSQL is the most capable open-source relational database available. It handles everything from small embedded applications to data warehouses processing petabytes of data. As a DBA, your job is to install it correctly, configure it for the workload, keep it running, and make sure you can recover from any failure. This module covers the operational skills you need: installation, configuration tuning, authentication setup, backup strategies, and replication for high availability. We will work with real configuration files, real commands, and real failure scenarios.

## Installation and Configuration

PostgreSQL installation varies by platform, but the principles are the same: install the packages, initialize a data directory, configure authentication, and start the service.

On Debian/Ubuntu:

```bash
sudo apt update
sudo apt install postgresql-16 postgresql-client-16
```

On RHEL/CentOS:

```bash
sudo dnf install postgresql16-server postgresql16
sudo /usr/pgsql-16/bin/postgresql-16-setup initdb
```

On Docker (for development and testing):

```bash
docker run -d \
  --name postgres-dev \
  -e POSTGRES_PASSWORD=devpass123 \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

After installation, the data directory (typically `/var/lib/postgresql/16/main/` or `/var/lib/pgsql/16/data/`) contains the database cluster. The key files you need to know:

- `postgresql.conf`: All runtime configuration parameters
- `pg_hba.conf`: Client authentication rules (who can connect, how they authenticate)
- `pg_ident.conf`: Maps OS usernames to database usernames (optional)

Before changing any configuration, understand the directory structure the installer created. The `base/` directory holds the actual database files. The `pg_wal/` directory holds the write-ahead log. The `global/` directory holds cluster-wide tables. The `pg_stat/` directory holds statistics. Knowing this layout matters when you need to manually recover data or diagnose disk space issues.

## postgresql.conf Tuning

The `postgresql.conf` file contains hundreds of parameters. Most have reasonable defaults. The ones that matter for performance are the ones you must tune for your specific workload and hardware. Let us walk through the parameters that actually move the needle, organized by the hardware resource they affect.

**Memory:**

```ini
# shared_buffers: caches data pages in memory
# Rule of thumb: 25% of available RAM for dedicated PostgreSQL server
# Never exceed 8GB on a 32-bit system
shared_buffers = '4GB'

# effective_cache_size: hint to query planner about total memory available for caching
# Set to 50-75% of RAM (includes OS page cache)
effective_cache_size = '12GB'

# work_mem: memory for sorts, hash joins, and other query operations
# This is per-operation, not per-query. A query with 3 sorts uses 3x work_mem
# Start low, increase for specific queries that need it
work_mem = '64MB'

# maintenance_work_mem: memory for VACUUM, CREATE INDEX, ALTER TABLE ADD FOREIGN KEY
# Can be larger than work_mem since maintenance operations are infrequent
maintenance_work_mem = '1GB'

# wal_buffers: memory for WAL writes before flushing to disk
# Default is -1 (auto, 1/32 of shared_buffers, max 64MB)
# Rarely needs manual setting
wal_buffers = '64MB'
```

The most common mistake is setting `work_mem` too high. If a query plan involves multiple sort operations, each sort allocates `work_mem` independently. A query with 10 sort steps and `work_mem = 256MB` could consume 2.5GB. Monitor memory usage with `SELECT * FROM pg_stat_activity` and look for queries with large `temp_blks_written` values: these are spilling to disk because `work_mem` is too small for those specific queries.

**Write Performance:**

```ini
# checkpoint_completion_target: fraction of time between checkpoints
# spent spreading out the checkpoint writes
# Higher values reduce I/O spikes at checkpoint time
checkpoint_completion_target = 0.9

# max_wal_size: maximum WAL size before a checkpoint is forced
# Increase for write-heavy workloads to reduce checkpoint frequency
max_wal_size = '4GB'

# min_wal_size: minimum WAL size retained
# Prevents WAL from being removed and immediately recreated
min_wal_size = '1GB'

# wal_compression: compress WAL data
# Reduces disk usage at the cost of CPU
# lz4 is fast and effective on most data
wal_compression = 'lz4'

# full_page_writes: write full pages to WAL after each checkpoint
# MUST be on for data safety. Never turn this off in production.
full_page_writes = on
```

Checkpoint tuning is critical for write-heavy workloads. Without proper tuning, checkpoints create I/O storms that stall all queries. The `checkpoint_completion_target` spreads checkpoint writes over the interval between checkpoints. The `max_wal_size` controls how often checkpoints happen: larger values mean fewer checkpoints but more WAL to replay on recovery.

**Connection and Worker Settings:**

```ini
# max_connections: maximum concurrent connections
# Each connection uses ~10MB of memory. Don't set this too high.
# Use connection pooling (PgBouncer) instead of bumping this up.
max_connections = 200

# autovacuum: automatic table maintenance
# NEVER turn this off. Autovacuum reclaims dead tuples and updates statistics.
autovacuum = on

# autovacuum_max_workers: number of autovacuum processes
# Each worker handles one table. Default 3 is fine for most systems.
autovacuum_max_workers = 3

# max_parallel_workers_per_gather: parallel query execution
# Set to number of CPU cores / 2, capped at 4 for most workloads
max_parallel_workers_per_gather = 4

# max_worker_processes: total background workers
# Must be >= max_parallel_workers_per_gather * max_connections (roughly)
max_worker_processes = 16
```

A common question is whether to increase `max_connections` to handle more users. The answer is almost always no. PostgreSQL forks a new process for each connection, and context-switching between many connections kills performance. Use PgBouncer or pgpool-II to pool connections. PgBouncer runs as a lightweight proxy, maintaining a small number of actual PostgreSQL connections and multiplexing many client connections across them.

```ini
# PgBouncer configuration (not postgresql.conf)
# pgbouncer.ini
[databases]
mydb = host=127.0.0.1 port=5432 dbname=mydb

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
default_pool_size = 20
max_client_conn = 1000
```

Setting `pool_mode = transaction` is the sweet spot for most applications. It releases the server connection as soon as the transaction completes, allowing other clients to use it. Statement-level pooling is too restrictive for applications that use prepared statements or session variables. Session-level pooling defeats the purpose of connection pooling.

## pg_hba.conf Authentication

The `pg_hba.conf` file controls who can connect to PostgreSQL and how they authenticate. The format is:

```
TYPE  DATABASE  USER  ADDRESS         METHOD
```

A typical production configuration:

```ini
# Local connections (Unix socket): allow root and postgres user for admin
local   all   postgres                peer
local   all   all                     md5

# TCP connections from application servers
host    myapp    appuser    10.0.1.0/24    scram-sha-256
host    myapp    appuser    10.0.2.0/24    scram-sha-256

# Replication connections (restricted to replica IPs)
host    replication  replicator  10.0.3.0/24    scram-sha-256

# Reject everything else
host    all    all    0.0.0.0/0    reject
```

Authentication methods, in order of security:

- `trust`: No authentication. Accept the password. Never use this in production.
- `peer`: The client's OS username must match the database username. Only works for local connections. Useful for the postgres admin account.
- `md5`: Password hash using MD5. Legacy method. Acceptable but not preferred.
- `scram-sha-256`: Salted challenge-response authentication. Superior to MD5. Use this for all password-based authentication in new deployments.
- `cert`: Client must present a valid SSL certificate. The most secure option for production. Requires setting up a certificate authority and issuing client certificates.
- `reject`: Explicitly deny the connection. Always add this as the last rule.

A critical mistake to avoid: using `0.0.0.0/0` with `md5` or `scram-sha-256` as the only protection. This allows anyone on any network to attempt password-based attacks against your database. Always restrict the ADDRESS to known application server IPs. If your application runs in Kubernetes, use network policies to restrict pod-to-pod traffic and restrict PostgreSQL access to the application namespace CIDR.

For additional security, implement `pg_hba.conf` with certificate-based authentication for replication and application connections. This eliminates password-based attack vectors entirely:

```ini
# Certificate-based auth for application connections
hostssl  myapp  appuser  10.0.1.0/24  cert
```

The client presents a certificate signed by a CA that PostgreSQL trusts. You configure the CA and client certificate locations in `postgresql.conf`:

```ini
ssl = on
ssl_ca_file = '/etc/postgresql/ssl/ca.crt'
ssl_cert_file = '/etc/postgresql/ssl/server.crt'
ssl_key_file = '/etc/postgresql/ssl/server.key'
ssl_min_protocol_version = 'TLSv1.2'
```

After modifying `pg_hba.conf`, reload PostgreSQL without restarting:

```bash
sudo systemctl reload postgresql
# or from psql
SELECT pg_reload_conf();
```

Always test your authentication changes in a non-production environment first. Locking yourself out of a production database by misconfiguring `pg_hba.conf` is a stressful situation that is entirely preventable.

## Backup: pg_dump, pg_basebackup

PostgreSQL offers two primary backup tools: `pg_dump` for logical backups and `pg_basebackup` for physical backups. Understanding the difference and when to use each is fundamental to DBA work.

**pg_dump** exports a database to a SQL file or custom archive format. It reads the database at the time of the backup and writes a consistent snapshot. It does not block writes during the backup (thanks to MVCC), so you can run it on a production database without downtime.

```bash
# Plain SQL dump: readable but large
pg_dump -h localhost -U postgres -d myapp -f /backups/myapp_$(date +%Y%m%d).sql

# Custom format (compressed, can be restored selectively): RECOMMENDED
pg_dump -h localhost -U postgres -d myapp \
  -Fc -Z 6 \
  -f /backups/myapp_$(date +%Y%m%d).dump

# Schema only (no data)
pg_dump -h localhost -U postgres -d myapp --schema-only -f /backups/myapp_schema.sql

# Specific tables only
pg_dump -h localhost -U postgres -d myapp \
  -t orders -t payments \
  -Fc -f /backups/myapp_partial.dump

# Parallel dump for large databases (requires custom format)
pg_dump -h localhost -U postgres -d myapp \
  -Fd -j 4 \
  -f /backups/myapp_$(date +%Y%m%d)/
```

The custom format (`-Fc`) is the most useful. It produces a compressed archive that can be restored with `pg_restore`, which allows parallel restoration, selective table restoration, and option to exclude data while keeping schema:

```bash
# Full restore
pg_restore -h localhost -U postgres -d myapp /backups/myapp_20260101.dump

# Parallel restore (4 workers)
pg_restore -h localhost -U postgres -d myapp -j 4 /backups/myapp_20260101.dump

# Restore only specific tables
pg_restore -h localhost -U postgres -d myapp \
  -t orders -t payments \
  /backups/myapp_20260101.dump

# Schema only restore (create tables, don't load data)
pg_restore -h localhost -U postgres -d myapp \
  --schema-only \
  /backups/myapp_20260101.dump
```

**pg_basebackup** creates a physical copy of the entire data directory. This is the foundation for Point-in-Time Recovery (PITR) and replication. Physical backups are faster for large databases because they copy binary files rather than generating SQL.

```bash
# Basic base backup (creates a tar archive)
pg_basebackup -h localhost -U replicator \
  -D /backups/base_$(date +%Y%m%d) \
  -Ft -z -P \
  --wal-method=stream

# Backup as a directory (useful for instant recovery)
pg_basebackup -h localhost -U replicator \
  -D /backups/base_$(date +%Y%m%d) \
  -Fp -P \
  --wal-method=stream
```

The `--wal-method=stream` option is critical. It streams WAL during the backup, ensuring the backup includes all WAL needed to reach a consistent state. Without it, you may end up with an inconsistent backup that cannot be recovered.

**Automating Backups with pg_cron and a Backup Script:**

Create a backup script at `/usr/local/bin/pg_backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/postgresql"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
HOST="localhost"
USER="backup_user"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Dump each database
for DB in $(psql -h $HOST -U $USER -At -c "SELECT datname FROM pg_database WHERE datistemplate = false AND datname != 'postgres';"); do
    pg_dump -h $HOST -U $USER -Fc -Z 6 \
      -f "$BACKUP_DIR/${DB}_${DATE}.dump" "$DB"
done

# Also create a base backup for PITR
pg_basebackup -h $HOST -U replicator \
  -D "$BACKUP_DIR/base_${DATE}" \
  -Fp -P --wal-method=stream

# Remove backups older than retention period
find "$BACKUP_DIR" -name "*.dump" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "base_*" -mtime +$RETENTION_DAYS -exec rm -rf {} +

# Log completion
echo "$(date): Backup completed successfully" >> /var/log/pg_backup.log
```

Schedule it with cron:

```bash
# Run full backup at 2 AM daily
0 2 * * * /usr/local/bin/pg_backup.sh >> /var/log/pg_backup.log 2>&1
```

The key question with `pg_dump` is: what is your recovery point objective (RPO)? If you run `pg_dump` once daily and the server dies at 11 PM, you lose up to 24 hours of data. For lower RPO, combine daily `pg_dump` with WAL archiving for PITR.

## PostgreSQL Monitoring and Troubleshooting

Effective monitoring catches problems before they become outages. PostgreSQL provides extensive statistics through system views that you should query regularly.

**Connection Monitoring:**

```sql
-- Current connections by state
SELECT state, COUNT(*)
FROM pg_stat_activity
GROUP BY state;

-- Connections by database and user
SELECT datname, usename, state, COUNT(*)
FROM pg_stat_activity
GROUP BY datname, usename, state
ORDER BY COUNT(*) DESC;

-- Long-running queries (potential locks or performance issues)
SELECT pid, now() - pg_stat_activity.query_start AS duration,
       query, state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
  AND state != 'idle'
ORDER BY duration DESC;

-- Queries waiting on locks
SELECT blocked.pid AS blocked_pid,
       blocked.query AS blocked_query,
       blocking.pid AS blocking_pid,
       blocking.query AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_locks blocked_locks ON blocked.pid = blocked_locks.pid
JOIN pg_locks blocking_locks ON blocked_locks.locktype = blocking_locks.locktype
  AND blocked_locks.database IS NOT DISTINCT FROM blocking_locks.database
  AND blocked_locks.relation IS NOT DISTINCT FROM blocking_locks.relation
  AND blocked_locks.page IS NOT DISTINCT FROM blocking_locks.page
  AND blocked_locks.tuple IS NOT DISTINCT FROM blocking_locks.tuple
  AND blocked_locks.transactionid IS NOT DISTINCT FROM blocking_locks.transactionid
  AND blocked_locks.pid != blocking_locks.pid
JOIN pg_stat_activity blocking ON blocking_locks.pid = blocking.pid
WHERE NOT blocked_locks.granted;
```

**Table Bloat and Dead Tuples:**

```sql
-- Find tables with high dead tuple counts (need VACUUM)
SELECT
    schemaname,
    relname,
    n_live_tup,
    n_dead_tup,
    CASE WHEN n_live_tup > 0
         THEN round(n_dead_tup * 100.0 / n_live_tup, 1)
         ELSE 0
    END AS dead_pct,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 10000
ORDER BY n_dead_tup DESC;

-- Check if autovacuum is keeping up
SELECT
    relname,
    autovacuum_count,
    analyze_count,
    CASE WHEN autovacuum_count > 0
         THEN round(last_autovacuum::numeric / now() * 100, 2)
         ELSE NULL
    END AS vacuum_frequency
FROM pg_stat_user_tables
ORDER BY autovacuum_count ASC;
```

**Disk Usage and WAL Growth:**

```sql
-- Database sizes
SELECT
    datname,
    pg_size_pretty(pg_database_size(datname)) AS size
FROM pg_database
ORDER BY pg_database_size(datname) DESC;

-- Largest tables
SELECT
    schemaname,
    relname,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS index_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;

-- WAL generation rate
SELECT
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0')) AS total_wal,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), pg_current_wal_lsn())) AS current_position;
```

**Query Performance with pg_stat_statements:**

```sql
-- Enable pg_stat_statements extension
CREATE EXTENSION pg_stat_statements;

-- Top 10 queries by total execution time
SELECT
    queryid,
    LEFT(query, 80) AS query_preview,
    calls,
    round(total_exec_time::numeric, 2) AS total_time_ms,
    round(mean_exec_time::numeric, 2) AS avg_time_ms,
    rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- Queries with highest I/O
SELECT
    queryid,
    LEFT(query, 80) AS query_preview,
    shared_blks_read,
    shared_blks_written,
    temp_blks_read,
    temp_blks_written
FROM pg_stat_statements
WHERE shared_blks_read > 1000000
ORDER BY shared_blks_read DESC
LIMIT 10;
```

## Replication: Streaming, Logical

Replication copies data from one PostgreSQL server (primary) to one or more other servers (replicas). It serves two purposes: high availability (if the primary dies, a replica takes over) and read scaling (distribute read queries across replicas).

**Streaming Replication:**

Streaming replication sends WAL records from the primary to replicas as they are generated. The replica continuously applies WAL, staying close to real-time synchronization with the primary.

Setting up streaming replication requires these steps:

1. Configure the primary for replication:

```ini
# postgresql.conf on primary
wal_level = replica
max_wal_senders = 5
wal_keep_size = '2GB'
hot_standby = on
```

2. Create a replication user:

```sql
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'secure_password_here';
```

3. Allow the replication user in `pg_hba.conf`:

```ini
host    replication    replicator    10.0.3.0/24    scram-sha-256
```

4. Take a base backup from the primary and set up the replica:

```bash
# On the replica server
pg_basebackup -h 10.0.3.1 -U replicator \
  -D /var/lib/postgresql/16/main \
  -Fp -P --wal-method=stream

# Create standby.signal file (tells PostgreSQL to start as a replica)
touch /var/lib/postgresql/16/main/standby.signal

# Configure replica
cat >> /var/lib/postgresql/16/main/postgresql.auto.conf << 'EOF'
primary_conninfo = 'host=10.0.3.1 port=5432 user=replicator password=secure_password_here'
recovery_target_timeline = 'latest'
EOF
```

5. Start the replica:

```bash
sudo systemctl start postgresql
```

6. Verify replication on the primary:

```sql
SELECT client_addr, state, sent_lsn, write_lsn, replay_lsn,
       replay_lag
FROM pg_stat_replication;
```

The `replay_lag` column shows how far behind the replica is. In a healthy setup, this should be sub-second. If it grows, investigate network latency, replica I/O performance, or heavy write load on the primary.

**Synchronous vs Asynchronous Replication:**

By default, streaming replication is asynchronous. The primary commits transactions without waiting for the replica to acknowledge receipt. This means the primary never slows down waiting for replicas, but there is a window where committed data has not yet reached the replica. If the primary dies during this window, those transactions are lost.

Synchronous replication eliminates this data loss window:

```ini
# On primary
synchronous_standby_names = 'replica1'
```

The trade-off: every commit on the primary must wait for at least one replica to confirm it received the WAL. This adds latency to every write. For financial systems where zero data loss is required, synchronous replication is worth the performance cost. For most other systems, asynchronous replication with monitoring is sufficient.

**Logical Replication:**

Logical replication is different from streaming replication. Streaming replication copies the entire database cluster at the block level. Logical replication replicates individual tables at the logical level (INSERT, UPDATE, DELETE operations). It is more flexible: you can replicate specific tables, transform data during replication, or replicate between different PostgreSQL major versions.

Setting up logical replication:

```sql
-- On the publisher (primary)
ALTER SYSTEM SET wal_level = 'logical';
-- Restart required after this change

-- Create a publication
CREATE PUBLICATION my_pub FOR TABLE orders, payments;

-- Or publish all tables
CREATE PUBLICATION my_pub FOR ALL TABLES;
```

```sql
-- On the subscriber (replica)
-- Create the subscription
CREATE SUBSCRIPTION my_sub
  CONNECTION 'host=10.0.3.1 dbname=myapp user=replicator password=secure_password_here'
  PUBLICATION my_pub;
```

Logical replication is useful for: migrating between major versions with minimal downtime, selectively replicating tables to a reporting database, and replicating between different database systems using extensions like `pglogical`. The main limitation is that DDL changes (adding columns, creating tables) are not replicated by default: you must manage schema changes on both sides.

## Real Scenario: Setting Up PostgreSQL High Availability

Your company runs a PostgreSQL 16 database for its payment processing system. The business requirement is: maximum 60 seconds of downtime per month, maximum 5 seconds of data loss during failover. The current setup is a single PostgreSQL server on an AWS EC2 instance. You need to design and implement a high availability solution.

**Architecture Design:**

You choose a primary-standby architecture with automatic failover using Patroni, a widely-used PostgreSQL HA tool that uses etcd for leader election.

- Primary: `10.0.1.10` (m5.xlarge: 4 vCPU, 16GB RAM)
- Standby 1: `10.0.1.11` (m5.xlarge: same specs, different availability zone)
- Standby 2: `10.0.1.12` (m5.large: 2 vCPU, 8GB RAM, same AZ as standby 1 for cost savings)
- etcd cluster: 3 nodes for quorum

**Step 1: Configure etcd cluster for leader election.**

```yaml
# etcd config on each etcd node
name: etcd1
data-dir: /var/lib/etcd
listen-peer-urls: http://10.0.2.1:2380
listen-client-urls: http://10.0.2.1:2379
advertise-client-urls: http://10.0.2.1:2379
initial-cluster: >-
  etcd1=http://10.0.2.1:2380,
  etcd2=http://10.0.2.2:2380,
  etcd3=http://10.0.2.3:2380
initial-cluster-state: new
```

**Step 2: Install and configure Patroni on each PostgreSQL node.**

```yaml
# /etc/patroni/postgresql.yml
scope: payment-db
namespace: /db/
name: node1

etcd3:
  hosts: 10.0.2.1:2379,10.0.2.2:2379,10.0.2.3:2379

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576
    postgresql:
      use_pg_rewind: true
      parameters:
        wal_level: replica
        hot_standby: on
        max_wal_senders: 10
        max_replication_slots: 10
        wal_log_hints: on
        logging_collector: on
        log_directory: /var/log/postgresql

postgresql:
  listen: 0.0.0.0:5432
  data_dir: /var/lib/postgresql/16/main
  bin_dir: /usr/lib/postgresql/16/bin
  authentication:
    replication:
      username: replicator
      password: replication_secret
    superuser:
      username: postgres
      password: postgres_secret
  parameters:
    max_connections: 200
    shared_buffers: 4GB
    work_mem: 64MB
    maintenance_work_mem: 1GB
    effective_cache_size: 12GB
    checkpoint_completion_target: 0.9
    max_wal_size: 4GB
    min_wal_size: 1GB
```

**Step 3: Configure automatic failover.**

Patroni monitors the primary using a health check. If the primary becomes unresponsive for longer than the configured timeout, Patroni promotes a standby. The `maximum_lag_on_failover` setting (1MB in this config) prevents promoting a standby that is too far behind.

Failover sequence:
1. Primary stops responding to Patroni health checks
2. etcd confirms the primary is unreachable from a majority of nodes
3. Patroni on the standby with the most current WAL position initiates promotion
4. The promoted standby becomes the new primary
5. The application's connection pooler (PgBouncer) is notified of the new primary
6. The old primary, when it recovers, rejoins as a standby using pg_rewind

**Step 4: Configure PgBouncer for connection routing.**

```ini
# pgbouncer.ini on application servers
[databases]
payment_db = host=10.0.1.10 port=5432 dbname=payment

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
default_pool_size = 30
max_client_conn = 500
server_idle_timeout = 300
```

With Patroni's integration, PgBouncer can be automatically reconfigured to point to the new primary after failover. This eliminates manual intervention during failover events.

**Step 5: Monitoring and alerting.**

```sql
-- Check replication lag (run on primary)
SELECT
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    replay_lsn,
    replay_lag,
    sync_state
FROM pg_stat_replication;

-- Check WAL generation rate (for capacity planning)
SELECT
    datname,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0')) as total_wal
FROM pg_database;
```

Set up alerts for:
- Replication lag exceeding 30 seconds
- Failed health checks (potential failover in progress)
- Disk usage exceeding 80% on the WAL partition
- Connection count approaching max_connections

**Result:** With this setup, automatic failover completes in 15-30 seconds. The application experiences a brief connection reset but reconnects to the new primary without manual intervention. The 60-second downtime requirement is met. Data loss is limited to transactions that were committed on the primary but not yet replayed on the standby before failover, which is typically under 1 second with proper monitoring.

## Assessment

**Lab Tasks:**

1. Install PostgreSQL 16 on a Linux system. Configure `postgresql.conf` for a server with 8GB RAM dedicated to PostgreSQL (shared_buffers, effective_cache_size, work_mem, maintenance_work_mem). Document each parameter you change and explain why. Time limit: 30 minutes.

2. Set up `pg_hba.conf` with three authentication methods: peer auth for the postgres user, scram-sha-256 for an application user from a specific subnet, and reject for everything else. Test each rule by connecting with psql. Time limit: 30 minutes.

3. Create a test database with 3 tables containing at least 10,000 rows each. Write a shell script that: (a) creates a `pg_dump` backup in custom format, (b) deletes data from one table, (c) restores only that table from the backup using `pg_restore`. Verify the restored data matches the original. Time limit: 45 minutes.

4. Set up streaming replication between two PostgreSQL instances (can be on the same machine using different ports). Verify replication is working by inserting data on the primary and reading it on the standby. Simulate a failover by stopping the primary and promoting the standby. Time limit: 60 minutes.

**Grading Criteria:**
- Configuration correctness (30%): postgresql.conf and pg_hba.conf are properly configured with explanations
- Backup and restore (25%): Script runs without errors, restores correctly, demonstrates understanding of pg_dump/pg_restore flags
- Replication setup (30%): Replication works end-to-end, failover is performed correctly
- Documentation quality (15%): Each step is documented with reasoning, not just commands

**Evidence:**
- postgresql.conf and pg_hba.conf configuration files with comments
- Shell script for backup and restore
- psql session output showing replication status and failover
- Before/after data verification queries
