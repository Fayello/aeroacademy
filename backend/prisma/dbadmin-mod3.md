# Module 3: MySQL Administration

MySQL is the most widely deployed open-source relational database in the world. It powers everything from small WordPress sites to large-scale social networks. As a DBA, you need to master installation, configuration, user management, replication, and backup strategies. This module also covers a practical migration scenario: upgrading from MySQL 5.7 to 8.0: because migrations are where most production incidents happen. The details matter, and the differences between versions can break your application in subtle ways.

## Installation and Configuration

MySQL installation on Debian/Ubuntu:

```bash
sudo apt update
sudo apt install mysql-server-8.0
sudo mysql_secure_installation
```

On RHEL/CentOS:

```bash
sudo dnf install mysql-server
sudo systemctl start mysqld
# Get temporary password
sudo grep 'temporary password' /var/log/mysqld.log
sudo mysql_secure_installation
```

On Docker:

```bash
docker run -d \
  --name mysql-dev \
  -e MYSQL_ROOT_PASSWORD=devpass123 \
  -e MYSQL_DATABASE=testdb \
  -p 3306:3306 \
  -v mysqldata:/var/lib/mysql \
  mysql:8.0
```

After installation, the critical step is `mysql_secure_installation`. This script removes the test database, deletes anonymous users, and sets a root password. Do not skip this on any system that will be accessible from the network.

The main configuration file is `/etc/mysql/mysql.conf.d/mysqld.cnf` (Debian) or `/etc/my.cnf` (RHEL). Understanding the file hierarchy matters: MySQL reads multiple configuration files in order, and later files override earlier ones. On Debian, the order is `/etc/mysql/my.cnf` → `/etc/mysql/mysql.conf.d/mysqld.cnf` → `/etc/mysql/conf.d/*.cnf`. This means settings in `/etc/mysql/conf.d/` can override the main config without modifying the main file: useful for drop-in configurations.

## my.cnf Tuning

MySQL 8.0 changed many default values from 5.7. If you are migrating, verify these parameters explicitly.

**Buffer Pool: The Most Important MySQL Setting:**

```ini
# innodb_buffer_pool_size: caches data and indexes
# Rule of thumb: 70-80% of available RAM on a dedicated MySQL server
# For a server with 32GB RAM:
innodb_buffer_pool_size = 24G

# innodb_buffer_pool_instances: divide the buffer pool into regions
# Reduces contention under high concurrency
# Rule: 1 instance per 1GB of buffer pool, up to 64
innodb_buffer_pool_instances = 24

# innodb_buffer_pool_dump_at_shutdown / innodb_buffer_pool_load_at_startup
# Saves buffer pool contents to disk on shutdown, reloads on startup
# Dramatically reduces warmup time after restarts
innodb_buffer_pool_dump_at_shutdown = ON
innodb_buffer_pool_load_at_startup = ON
innodb_buffer_pool_dump_pct = 40
```

The buffer pool is InnoDB's primary memory structure. It caches both data pages and index pages. When you run a query, InnoDB first checks the buffer pool. If the page is there (cache hit), it reads from memory: nanoseconds. If not (cache miss), it reads from disk: milliseconds. The difference is six orders of magnitude. A buffer pool that is too small forces constant disk reads, destroying performance.

Monitor buffer pool hit rate:

```sql
SHOW ENGINE INNODB STATUS\G

-- Look for the BUFFER POOL AND MEMORY section
-- Buffer pool hit rate should be > 99%
-- If it is lower, increase innodb_buffer_pool_size
```

**Write Performance:**

```ini
# innodb_log_file_size: size of each redo log file
# Larger values improve write throughput but increase recovery time
# MySQL 8.0.30+ uses innodb_redo_log_capacity instead
innodb_redo_log_capacity = 8G

# innodb_flush_log_at_trx_commit: controls redo log flushing
# 1 = flush to disk on every commit (safest, slowest)
# 2 = write to OS buffer, flush once per second (good balance)
# 0 = write to OS buffer, flush once per second (fastest, least safe)
innodb_flush_log_at_trx_commit = 1

# innodb_flush_method: how InnoDB opens and flushes data files
# O_DIRECT bypasses OS page cache, avoids double buffering
# Use O_DIRECT when innodb_buffer_pool_size is set properly
innodb_flush_method = O_DIRECT

# innodb_io_capacity: hint to InnoDB about disk I/O capacity
# SSD: 2000-10000
# HDD: 200-400
innodb_io_capacity = 4000
innodb_io_capacity_max = 8000
```

The `innodb_flush_log_at_trx_commit` setting is a direct trade-off between durability and performance:

- Setting 1: Every commit flushes the redo log to disk. A crash loses zero committed transactions. This adds 1-10ms of latency per commit depending on disk speed.
- Setting 2: Every commit writes to the OS buffer. The OS flushes to disk once per second. A crash loses up to 1 second of committed transactions. Performance improves significantly for write-heavy workloads.
- Setting 0: Same as 2 but the OS flush is also deferred. Maximum write performance, maximum risk.

For most applications, setting 1 is correct. For logging tables, analytics ingestion, or other data where brief loss is acceptable, setting 2 provides meaningful performance gains.

**Connection and Thread Settings:**

```ini
# max_connections: maximum simultaneous connections
# Each connection uses ~256KB of thread stack + per-connection buffers
max_connections = 500

# thread_cache_size: cache thread handles for reuse
# Reduces thread creation overhead
# Set to 16-64 for most workloads
thread_cache_size = 64

# table_open_cache: number of table file descriptors to cache
# Increase if you see "Opened_tables" growing rapidly
table_open_cache = 4000

# tmp_table_size and max_heap_table_size: limit for in-memory temporary tables
# Queries that need temporary tables larger than this spill to disk
tmp_table_size = 256M
max_heap_table_size = 256M

# join_buffer_size: buffer for joins that cannot use indexes
# Increase if you see many "Using join buffer" in EXPLAIN output
join_buffer_size = 4M
```

**Slow Query Log:**

```ini
# Enable the slow query log to capture queries exceeding a time threshold
slow_query_log = ON
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 1
log_queries_not_using_indexes = ON
min_examined_row_limit = 1000
```

The slow query log is your primary diagnostic tool. Setting `long_query_time = 1` captures any query taking more than 1 second. Setting `log_queries_not_using_indexes = ON` also captures fast queries that do a full table scan: these are often the queries that become slow as data grows. Analyze the slow query log with `pt-query-digest` from Percona Toolkit:

```bash
pt-query-digest /var/log/mysql/slow.log > /tmp/slow_report.txt
```

This produces a ranked report of the slowest queries, grouped by pattern, with execution time statistics. It is the single most useful tool for identifying which queries to optimize first.

## User Management and Privileges

MySQL's privilege system is hierarchical. Understanding the hierarchy prevents the common mistake of granting too many privileges.

**Creating Application Users (Never Use Root):**

```sql
-- Create a user with a strong password
CREATE USER 'appuser'@'10.0.1.%' IDENTIFIED BY 'Str0ng_P@ssw0rd!';

-- Grant only the privileges the application needs
GRANT SELECT, INSERT, UPDATE, DELETE ON myapp.* TO 'appuser'@'10.0.1.%';

-- Never grant DROP, ALTER, CREATE, or GRANT OPTION to application users
-- If the app needs to create temporary tables, grant CREATE TEMPORARY TABLES
GRANT CREATE TEMPORARY TABLES ON myapp.* TO 'appuser'@'10.0.1.%';

-- Apply privilege changes
FLUSH PRIVILEGES;
```

**Creating a Read-Only Reporting User:**

```sql
CREATE USER 'reporter'@'10.0.2.%' IDENTIFIED BY 'R3port_R0nly!';
GRANT SELECT ON myapp.* TO 'reporter'@'10.0.2.%';
FLUSH PRIVILEGES;
```

**Creating a Backup User:**

```sql
CREATE USER 'backupuser'@'localhost' IDENTIFIED BY 'B@ckup_S3cure!';
GRANT SELECT, RELOAD, LOCK TABLES, REPLICATION CLIENT, PROCESS ON *.* TO 'backupuser'@'localhost';
FLUSH PRIVILEGES;
```

The `REPLICATION CLIENT` privilege is needed for `mysqldump --master-data` and `SHOW MASTER STATUS`. The `PROCESS` privilege is needed to see all running queries with `SHOW PROCESSLIST`.

**Creating a Replication User (MySQL 8.0):**

```sql
CREATE USER 'repluser'@'10.0.3.%' IDENTIFIED BY 'R3pl_S3cure!';
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'repluser'@'10.0.3.%';
FLUSH PRIVILEGES;
```

**Auditing Current Privileges:**

```sql
-- Show all grants for a specific user
SHOW GRANTS FOR 'appuser'@'10.0.1.%';

-- Show all users and their host restrictions
SELECT user, host, plugin, authentication_string FROM mysql.user;

-- Find users with SUPER privilege (potential security risk)
SELECT user, host FROM mysql.user WHERE Super_priv = 'Y';

-- Find users with no password restrictions
SELECT user, host FROM mysql.user WHERE authentication_string = '';
```

MySQL 8.0 introduced `caching_sha2_password` as the default authentication plugin, replacing `mysql_native_password`. The new plugin is more secure but requires clients that support SHA-256 authentication. If your application uses an older MySQL client library, you may need to switch the user back to the old plugin:

```sql
ALTER USER 'appuser'@'10.0.1.%' IDENTIFIED WITH mysql_native_password BY 'Str0ng_P@ssw0rd!';
```

This is a transitional measure. Plan to upgrade client libraries to support the newer authentication method.

**Role-Based Access (MySQL 8.0+):**

```sql
-- Create roles
CREATE ROLE 'app_read', 'app_write', 'app_admin';

-- Grant privileges to roles
GRANT SELECT ON myapp.* TO 'app_read';
GRANT SELECT, INSERT, UPDATE, DELETE ON myapp.* TO 'app_write';
GRANT ALL PRIVILEGES ON myapp.* TO 'app_admin';

-- Assign roles to users
GRANT 'app_read' TO 'reporter'@'10.0.2.%';
GRANT 'app_write' TO 'appuser'@'10.0.1.%';
GRANT 'app_admin' TO 'dbadmin'@'10.0.1.%';

-- Set default roles (automatically activated on login)
SET DEFAULT ROLE ALL TO 'reporter'@'10.0.2.%';
SET DEFAULT ROLE ALL TO 'appuser'@'10.0.1.%';
```

Roles simplify privilege management. Instead of granting individual privileges to each user, you manage privileges at the role level. When the privilege needs change, you update the role and all users with that role inherit the change.

## Replication

MySQL replication copies data from a primary server to one or more replica servers. The primary writes events to its binary log, and replicas read and apply those events.

**Setting Up Primary-Replica Replication (MySQL 8.0):**

On the primary:

```ini
# my.cnf on primary
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog-format = ROW
binlog-expire-logs-seconds = 604800
sync_binlog = 1
gtid-mode = ON
enforce-gtid-consistency = ON
```

```sql
-- Create replication user
CREATE USER 'repluser'@'10.0.3.%' IDENTIFIED BY 'R3pl_S3cure!';
GRANT REPLICATION SLAVE ON *.* TO 'repluser'@'10.0.3.%';
FLUSH PRIVILEGES;

-- Check primary status
SHOW MASTER STATUS;
```

On the replica:

```ini
# my.cnf on replica
[mysqld]
server-id = 2
relay-log = relay-bin
read-only = ON
super-read-only = ON
gtid-mode = ON
enforce-gtid-consistency = ON
```

```sql
-- Configure and start replication
CHANGE REPLICATION SOURCE TO
  SOURCE_HOST = '10.0.3.1',
  SOURCE_USER = 'repluser',
  SOURCE_PASSWORD = 'R3pl_S3cure!',
  SOURCE_AUTO_POSITION = 1;

START REPLICA;

-- Verify replication status
SHOW REPLICA STATUS\G
```

The critical fields in `SHOW REPLICA STATUS` are:

- `Replica_IO_Running`: Must be `Yes`. If `No`, check network, credentials, and `server-id`.
- `Replica_SQL_Running`: Must be `Yes`. If `No`, check the `Last_SQL_Error` for the specific failure.
- `Seconds_Behind_Source`: How far behind the replica is. Should be close to 0. If growing, the replica cannot keep up with the primary's write rate.

**GTID Replication:**

MySQL 8.0 uses GTIDs (Global Transaction Identifiers) by default. Each transaction gets a unique ID across all servers in the replication topology. GTIDs simplify failover: when a replica is promoted to primary, other replicas automatically know where to start replicating from.

```
-- GTID format: source_id:transaction_id
-- Example: 3E11FA47-71CA-11E1-9E33-C80AA9429562:23
```

GTIDs also make it easy to check if a server is caught up:

```sql
-- Compare GTID sets between primary and replica
SELECT @@global.gtid_executed;  -- On both servers
-- If they match, the replica is fully caught up
```

**Group Replication:**

Group Replication is MySQL's built-in solution for multi-primary replication with automatic failover. It uses the Paxos consensus protocol to ensure all nodes agree on the order of transactions. In single-primary mode (recommended), one node accepts writes while others are read-only replicas. If the primary fails, the group automatically elects a new primary.

```ini
# my.cnf for group replication
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog-format = ROW
gtid-mode = ON
enforce-gtid-consistency = ON
plugin_load_add = 'group_replication.so'

# Group Replication configuration
group_replication_group_name = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
group_replication_start_on_boot = OFF  # Start manually for initial setup
group_replication_local_address = "10.0.3.1:33061"
group_replication_group_seeds = "10.0.3.1:33061,10.0.3.2:33061,10.0.3.3:33061"
group_replication_single_primary_mode = ON
```

Group Replication is best for small clusters (3-5 nodes) where you need automatic failover without external orchestration tools. For larger topologies or more complex requirements, Orchestrator or MHA (MySQL High Availability) offer more flexibility.

## Backup Strategies

MySQL backup strategies must account for the storage engine (InnoDB vs MyISAM), the backup window, the recovery point objective, and the recovery time objective.

**mysqldump: Logical Backups:**

```bash
# Full backup with GTID information
mysqldump -h localhost -u backupuser -p \
  --all-databases \
  --single-transaction \
  --routines --triggers --events \
  --master-data=2 \
  --flush-logs \
  --hex-blob \
  --default-character-set=utf8mb4 \
  | gzip > /backups/full_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup specific databases
mysqldump -h localhost -u backupuser -p \
  --databases myapp myapp_logs \
  --single-transaction \
  --routines --triggers \
  | gzip > /backups/myapp_$(date +%Y%m%d).sql.gz
```

The `--single-transaction` flag is critical for InnoDB. It starts a consistent transaction backup without locking tables. However, it does not work correctly for MyISAM tables: if you have MyISAM tables mixed with InnoDB, those tables will not be consistent. The `--master-data=2` flag includes a comment with the binary log position at the time of the backup, which is essential for point-in-time recovery.

**Percona XtraBackup: Physical Backups:**

```bash
# Full backup (non-blocking for InnoDB)
xtrabackup --backup --target-dir=/backups/full \
  --user=backupuser --password='B@ckup_S3cure!'

# Prepare the backup (apply log)
xtrabackup --prepare --target-dir=/backups/full

# Restore: stop MySQL, replace data directory, start MySQL
systemctl stop mysql
rm -rf /var/lib/mysql/*
xtrabackup --copy-back --target-dir=/backups/full
chown -R mysql:mysql /var/lib/mysql
systemctl start mysql
```

XtraBackup is significantly faster than mysqldup for large databases because it copies physical files rather than generating SQL. A 500GB database that takes 6 hours to dump with mysqldump might take 1 hour with XtraBackup.

**Incremental Backups with XtraBackup:**

```bash
# Full backup (Monday)
xtrabackup --backup --target-dir=/backups/full

# Incremental backup (Tuesday: only pages changed since Monday)
xtrabackup --backup --target-dir=/backups/incr1 \
  --incremental-basedir=/backups/full

# Incremental backup (Wednesday: only pages changed since Tuesday)
xtrabackup --backup --target-dir=/backups/incr2 \
  --incremental-basedir=/backups/incr1
```

Incremental backups dramatically reduce backup time and storage. For a 500GB database that changes 5GB per day, daily full backups consume 500GB, while incremental backups consume 5GB per day.

**Binary Log Point-in-Time Recovery:**

For recovery beyond the last backup, you need the binary logs. Enable binary logging and configure retention:

```ini
[mysqld]
log-bin = mysql-bin
binlog-format = ROW
binlog-expire-logs-seconds = 604800  # 7 days
sync_binlog = 1
```

Recovery process:

```bash
# 1. Restore the last full backup
# 2. Apply incremental backups if any
# 3. Replay binary logs from the backup position to the desired point in time

mysqlbinlog --start-datetime="2026-01-01 10:00:00" \
            --stop-datetime="2026-01-01 14:30:00" \
            /var/lib/mysql/mysql-bin.000123 | mysql -u root -p
```

## MySQL Performance Schema and Troubleshooting

MySQL includes built-in performance monitoring through the Performance Schema and Information Schema. These tools let you identify bottlenecks without external monitoring software.

**Performance Schema Setup:**

```ini
# my.cnf
[mysqld]
performance_schema = ON
performance_schema_max_table_instances = 5000
performance_schema_max_table_handles = 5000
```

**Identifying Slow Queries:**

```sql
-- Find the top 10 queries by total execution time
SELECT
    DIGEST_TEXT AS query_pattern,
    COUNT_STAR AS exec_count,
    ROUND(SUM_TIMER_WAIT / 1e12, 3) AS total_time_sec,
    ROUND(AVG_TIMER_WAIT / 1e12, 3) AS avg_time_sec,
    SUM_ROWS_EXAMINED AS rows_examined,
    SUM_ROWS_SENT AS rows_sent
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;
```

**Table I/O Analysis:**

```sql
-- Find tables with the most I/O (potential missing indexes)
SELECT
    OBJECT_SCHEMA,
    OBJECT_NAME,
    COUNT_READ,
    COUNT_WRITE,
    SUM_TIMER_READ / 1e12 AS read_time_sec,
    SUM_TIMER_WRITE / 1e12 AS write_time_sec
FROM performance_schema.table_io_waits_summary_by_table
WHERE OBJECT_SCHEMA NOT IN ('mysql', 'performance_schema', 'information_schema')
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;
```

**Wait Event Analysis:**

```sql
-- Find what threads are waiting for
SELECT
    EVENT_NAME,
    COUNT_STAR,
    SUM_TIMER_WAIT / 1e12 AS total_wait_sec
FROM performance_schema.events_waits_summary_global_by_event_name
WHERE COUNT_STAR > 0
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;
```

Common wait events and their fixes:
- `wait/io/file/innodb/innodb_data_file`: Disk I/O bottleneck. Increase buffer pool or add SSDs.
- `wait/synch/mutex/innodb/OS_AIO_mutex`: Too many concurrent I/O operations. Reduce innodb_thread_concurrency.
- `wait/lock/metadata/sql/mutex`: High concurrency contention. Optimize query patterns or increase thread cache.

**SHOW ENGINE INNODB STATUS:**

```sql
-- Comprehensive InnoDB status
SHOW ENGINE INNODB STATUS\G

-- Key sections to examine:
-- SEMAPHORES: mutex contention
-- FILE I/O: thread activity and pending I/O
-- BUFFER POOL: hit rate, pages read/written
-- TRANSACTIONS: active transactions and locks
-- LATEST DEADLOCK: deadlock details (if any)
```

**Common MySQL Issues and Fixes:**

1. Table locks slowing writes: Convert MyISAM tables to InnoDB
```sql
ALTER TABLE legacy_table ENGINE=InnoDB;
```

2. Too many connections: Use connection pooling (ProxySQL) instead of increasing max_connections

3. Slow INSERT: Disable autocommit for bulk inserts, use LOAD DATA INFILE
```sql
SET autocommit = 0;
INSERT INTO big_table VALUES (...), (...), (...);
-- Repeat in batches of 10,000
COMMIT;
```

4. Disk space growing: Check for large binary logs
```sql
SHOW BINARY LOGS;
PURGE BINARY LOGS BEFORE '2026-01-01 00:00:00';
```

5. Temp table on disk: Increase tmp_table_size and max_heap_table_size
```sql
SHOW GLOBAL STATUS LIKE 'Created_tmp_disk_tables';
SHOW GLOBAL STATUS LIKE 'Created_tmp_tables';
-- If disk/temp ratio > 25%, increase tmp_table_size
SET GLOBAL tmp_table_size = 512M;
SET GLOBAL max_heap_table_size = 512M;
```

6. Slow JOIN queries: Check join_buffer_size and ensure joined columns are indexed
```sql
SHOW GLOBAL STATUS LIKE 'Select_scan';  -- Full table scans
-- If high, add indexes on JOIN columns and WHERE clauses
```

## Real Scenario: Migrating from MySQL 5.7 to 8.0

You manage a MySQL database for an e-commerce platform. The database is 200GB, running MySQL 5.7 on Ubuntu 20.04. The business requires zero or minimal downtime during the migration. MySQL 8.0 is required for window functions, CTEs, and improved JSON support that the development team needs.

**Pre-Migration Assessment:**

```bash
# Run MySQL Shell upgrade checker
mysqlsh -- util checkForServerUpgrade root@localhost:3306 \
  --target-version=8.0 \
  --output-format=JSON \
  > /tmp/upgrade_report.json
```

This tool checks for:
- Deprecated SQL syntax removed in 8.0
- Incompatible system variables
- Reserved words that became reserved in 8.0
- Issues with data types

Common findings from a 5.7 to 8.0 migration:

1. `utf8` is now an alias for `utf8mb3` (3-byte UTF-8). Use `utf8mb4` explicitly.
2. The `query_cache` is removed. Remove `query_cache_type` and `query_cache_size` from my.cnf.
3. `sql_mode` defaults changed. `ONLY_FULL_GROUP_BY` is now on by default. Queries that worked in 5.7 may fail in 8.0 if they use SELECT columns not in GROUP BY.
4. The `mysql_native_password` plugin is deprecated. Plan to migrate to `caching_sha2_password`.
5. Some `INFORMATION_SCHEMA` tables have new columns and different behavior.

**Migration Strategy:**

For zero-downtime migration, use replication from MySQL 5.7 (primary) to MySQL 8.0 (replica), then switch:

Step 1: Set up MySQL 8.0 server and configure it as a replica of the 5.7 primary.

```sql
-- On MySQL 5.7 primary
CREATE USER 'repluser'@'10.0.3.%' IDENTIFIED BY 'R3pl_S3cure!';
GRANT REPLICATION SLAVE ON *.* TO 'repluser'@'10.0.3.%';
SHOW MASTER STATUS;
-- Note the File and Position

-- On MySQL 8.0 replica
CHANGE MASTER TO
  MASTER_HOST = '10.0.3.1',
  MASTER_USER = 'repluser',
  MASTER_PASSWORD = 'R3pl_S3cure!',
  MASTER_LOG_FILE = 'mysql-bin.000015',
  MASTER_LOG_POS = 1234;
START REPLICA;
```

Step 2: Verify replication is running and caught up.

```sql
SHOW REPLICA STATUS\G
-- Verify Replica_IO_Running: Yes
-- Verify Replica_SQL_Running: Yes
-- Verify Seconds_Behind_Source: 0
```

Step 3: Test the application against the MySQL 8.0 replica. Run your full test suite. Check for:
- Queries that fail due to `ONLY_FULL_GROUP_BY`
- Queries using deprecated syntax
- Authentication issues if clients do not support `caching_sha2_password`

Step 4: Fix compatibility issues found in Step 3. Common fixes:

```sql
-- If ONLY_FULL_GROUP_BY breaks queries, you can disable it temporarily
-- But better to fix the queries
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- Convert utf8 columns to utf8mb4
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Step 5: Switch the application to the MySQL 8.0 server. Update connection strings in the application. If using a load balancer, switch the backend. If using DNS, update the DNS record to point to the new server.

Step 6: Decommission MySQL 5.7 after a monitoring period.

**Rollback Plan:**

If anything goes wrong after the switch, update the application's connection string to point back to the MySQL 5.7 primary. Since MySQL 5.7 was still running and receiving writes via application changes (not replication), you will lose any writes made to 8.0 during the brief window. This is why the switchover should be planned during a low-traffic period, and the window should be minimized.

**Post-Migration Validation:**

```sql
-- Verify data integrity
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;

-- Verify no replication errors occurred
SHOW REPLICA STATUS\G

-- Check for any warnings in the error log
-- /var/log/mysql/error.log
```

**MySQL 8.0 New Features to Verify After Migration:**

After migrating from MySQL 5.7 to 8.0, verify that new features are working correctly:

```sql
-- Window functions (new in 8.0)
SELECT
    customer_id,
    order_date,
    total,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) AS rn
FROM orders;

-- Common Table Expressions (new in 8.0)
WITH monthly_sales AS (
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, SUM(total) AS revenue
    FROM orders
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
)
SELECT month, revenue, LAG(revenue) OVER (ORDER BY month) AS prev_month
FROM monthly_sales;

-- JSON improvements (enhanced in 8.0)
SELECT
    id,
    JSON_EXTRACT(metadata, '$.tags') AS tags,
    JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.priority')) AS priority
FROM orders
WHERE JSON_CONTAINS(metadata, '"urgent"', '$.tags');
```

## Assessment

**Lab Tasks:**

1. Install MySQL 8.0 and configure `my.cnf` for a server with 16GB RAM. Set the buffer pool, thread cache, table cache, and enable the slow query log with a 1-second threshold. Document each parameter change. Time limit: 30 minutes.

2. Create three MySQL users: an application user with SELECT/INSERT/UPDATE/DELETE on a test database, a read-only user with SELECT only, and a backup user with RELOAD, LOCK TABLES, and REPLICATION CLIENT. Verify each user's privileges with `SHOW GRANTS`. Attempt to perform unauthorized operations (like DROP TABLE) with the application user and verify they fail. Time limit: 30 minutes.

3. Set up primary-replica replication between two MySQL instances (different ports on the same machine). Verify replication works by inserting data on the primary and reading it on the replica. Intentionally cause a replication error (e.g., insert a duplicate primary key on the replica) and demonstrate how to skip or fix it. Time limit: 45 minutes.

4. Create a test database with 3 tables and 10,000 rows each. Back it up with mysqldump using --single-transaction. Drop one table. Restore the backup and verify all data is recovered. Time limit: 30 minutes.

**Grading Criteria:**
- Configuration accuracy (25%): my.cnf parameters are correctly set with appropriate values for the given hardware
- User management (25%): Users are created with correct privileges, unauthorized operations are properly rejected
- Replication (30%): Replication is configured and verified, error handling is demonstrated
- Backup and restore (20%): Backup completes successfully, restore recovers the dropped table completely

**Evidence:**
- my.cnf configuration file with comments explaining each change
- SHOW GRANTS output for all three users
- Replication status output from SHOW REPLICA STATUS
- Backup and restore session log showing data verification
