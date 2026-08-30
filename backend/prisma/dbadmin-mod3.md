# Module 3 — MySQL Administration: Installation, Replication, Tuning

## What You'll Actually Do

Install MySQL, configure replication between a primary and replica, tune performance settings, and handle common administrative tasks. You'll see how MySQL differs from PostgreSQL in practice.

## Content

### Installation

On Debian/Ubuntu:

```bash
sudo apt update
sudo apt install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql
sudo mysql_secure_installation
```

On RHEL/CentOS:

```bash
sudo dnf install -y mysql-server
sudo systemctl enable mysqld
sudo systemctl start mysqld
sudo mysql_secure_installation
```

MySQL ships with a root password that's either blank or generated. Check the log:

```bash
sudo grep 'temporary password' /var/log/mysql/error.log
```

### Basic Configuration

MySQL's config is `/etc/mysql/mysql.conf.d/mysqld.cnf` (Debian) or `/etc/my.cnf` (RHEL):

```ini
[mysqld]
# InnoDB settings — the default and recommended engine
innodb_buffer_pool_size = 4G       # 50% of RAM on dedicated server
innodb_log_file_size = 1G
innodb_flush_log_at_trx_commit = 1 # Full ACID
innodb_flush_method = O_DIRECT

# Connections
max_connections = 200
wait_timeout = 600
interactive_timeout = 600

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

### Creating Users and Databases

```sql
CREATE DATABASE aeroacademy;
CREATE USER 'appuser'@'10.0.0.%' IDENTIFIED BY 'strongpassword';
GRANT ALL PRIVILEGES ON aeroacademy.* TO 'appuser'@'10.0.0.%';
FLUSH PRIVILEGES;
```

Never grant `%` (all hosts) in production. Scope it to your app subnet.

### Replication Setup

MySQL replication copies data from a primary to one or more replicas. Useful for read scaling and failover.

**Primary configuration** (`/etc/mysql/mysql.conf.d/mysqld.cnf`):

```ini
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog-format = ROW
```

Restart MySQL and create a replication user:

```sql
CREATE USER 'repl'@'10.0.0.%' IDENTIFIED BY 'replpassword';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'10.0.0.%';
FLUSH PRIVILEGES;

-- Check primary status (you'll need the File and Position)
SHOW MASTER STATUS;
```

**Replica configuration**:

```ini
[mysqld]
server-id = 2
relay-log = relay-bin
read_only = ON
```

Configure the replica to point to the primary:

```sql
CHANGE MASTER TO
  MASTER_HOST='10.0.0.10',
  MASTER_USER='repl',
  MASTER_PASSWORD='replpassword',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=154;

START SLAVE;
SHOW SLAVE STATUS\G
```

Check for `Slave_IO_Running: Yes` and `Slave_SQL_Running: Yes`. If either is `No`, check the error log.

### Semi-Synchronous Replication

For stronger consistency guarantees:

```sql
-- Primary
INSTALL PLUGIN rpl_semi_sync_master SONAME 'semisync_master.so';
SET GLOBAL rpl_semi_sync_master_enabled = 1;
SET GLOBAL rpl_semi_sync_master_timeout = 2000;  -- 2 second wait

-- Replica
INSTALL PLUGIN rpl_semi_sync_slave SONAME 'semisync_slave.so';
SET GLOBAL rpl_semi_sync_slave_enabled = 1;
STOP SLAVE; START SLAVE;
```

### Performance Tuning

```sql
-- Check current buffer pool hit rate
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_read%';
-- Hit rate should be > 99%

-- Slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- Log queries taking > 1 second
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';

-- Find missing indexes
SELECT * FROM sys.schema_unused_indexes;
SELECT * FROM sys.schema_redundant_indexes;
```

### Logical Backup

```bash
# Full dump
mysqldump -u root -p --all-databases --single-transaction > /backups/full_$(date +%Y%m%d).sql

# Single database
mysqldump -u root -p --single-transaction aeroacademy > /backups/aeroacademy_$(date +%Y%m%d).sql

# Restore
mysql -u root -p aeroacademy < /backups/aeroacademy_20251201.sql
```

The `--single-transaction` flag uses InnoDB's snapshot isolation so the dump is consistent without locking tables.

### Monitoring

```sql
-- Active processes
SHOW PROCESSLIST;

-- InnoDB status
SHOW ENGINE INNODB STATUS\G

-- Global status for key metrics
SHOW GLOBAL STATUS LIKE 'Threads_connected';
SHOW GLOBAL STATUS LIKE 'Queries';
SHOW GLOBAL STATUS LIKE 'Slow_queries';
```

## Assessment

**Lab task — 50 minutes**

1. Install MySQL on two Ubuntu VMs (primary and replica).
2. Configure primary-replica replication with ROW-based binlogging.
3. Create a database on the primary with a `logs` table (at least 500 rows).
4. Verify the replica receives the data.
5. Insert 100 more rows on the primary and confirm they appear on the replica.
6. Set the slow query log threshold to 1 second, run a few deliberately slow queries, and locate them in the log.

**Grading criteria:**
- Both MySQL instances installed and running (15 points)
- Replication configured and IO/SQL threads running (25 points)
- Data propagated correctly to replica (20 points)
- Slow query log configured and working (20 points)
- Evidence of monitoring commands used (20 points)

## Evidence

- Primary and replica `SHOW MASTER STATUS` and `SHOW SLAVE STATUS` output
- Screenshots of data appearing on the replica after inserts on primary
- Slow query log contents showing captured queries
