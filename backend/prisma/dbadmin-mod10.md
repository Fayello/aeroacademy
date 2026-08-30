# Module 10 — Database Security Hardening: Audit, Compliance, Monitoring

## What You'll Actually Do

Harden a PostgreSQL and MongoDB instance against real attack vectors. You'll enable audit logging, run compliance checks, set up monitoring with Prometheus and Grafana, and build alerts for suspicious activity.

## Content

### PostgreSQL Audit Logging

Use `pgaudit` for detailed audit trails:

```bash
sudo apt install -y postgresql-14-pgaudit
```

Add to `postgresql.conf`:

```ini
shared_preload_libraries = 'pgaudit,pg_stat_statements'

# Log all DDL and role changes
pgaudit.log = 'ddl,role'
pgaudit.log_catalog = on
pgaudit.log_parameter = on
pgaudit.log_statement_once = on
```

Reload:

```bash
sudo systemctl reload postgresql
```

Test it:

```sql
-- These generate audit logs
CREATE TABLE test_audit (id SERIAL, data TEXT);
ALTER TABLE test_audit ADD COLUMN created_at TIMESTAMPTZ;
CREATE ROLE temp_role;
DROP ROLE temp_role;
```

Check the logs:

```bash
sudo tail -f /var/log/postgresql/postgresql-14-main.log | grep pgaudit
```

For row-level auditing:

```sql
-- Already created in Module 6, extend it
CREATE TABLE admin_only.query_audit (
    id SERIAL PRIMARY KEY,
    username TEXT DEFAULT current_user,
    query_text TEXT,
    query_time TIMESTAMPTZ DEFAULT NOW(),
    rows_affected INT
);

-- Log all queries on sensitive tables
CREATE OR REPLACE FUNCTION audit_sensitive_queries()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO admin_only.query_audit (query_text, rows_affected)
    VALUES (current_query(), 1);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_users_queries
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_sensitive_queries();
```

### MongoDB Audit Logging

Enable audit in `mongod.conf`:

```yaml
auditLog:
  destination: file
  format: JSON
  path: /var/log/mongodb/audit.json
  filter: '{ atype: { $in: ["authenticate", "createCollection", "dropCollection", "createUser", "dropUser", "grantRolesToUser", "revokeRolesFromUser"] } }'
```

Restart mongod and verify:

```bash
sudo systemctl restart mongod
sudo tail -f /var/log/mongodb/audit.json | python3 -m json.tool
```

### Security Configuration Checklist

**PostgreSQL hardening:**

```sql
-- 1. Remove public schema access
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- 2. Revoke unnecessary permissions
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- 3. Set password policy (use a login trigger)
CREATE OR REPLACE FUNCTION check_password_age()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_shadow
        WHERE usename = current_user
        AND passwd IS NOT NULL
        AND valuntil < NOW() - INTERVAL '90 days'
    ) THEN
        RAISE EXCEPTION 'Password expired. Change your password.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Disable unencrypted connections
-- (covered in pg_hba.conf, Module 7)

-- 5. Restrict superuser access
-- Don't give app users SUPERUSER, CREATEDB, or CREATEROLE
```

**MongoDB hardening:**

```yaml
# mongod.conf security section
security:
  authorization: enabled
  javascriptEnabled: false  # Prevent JS injection attacks

net:
  bindIp: 127.0.0.1
  port: 27017
  tls:
    mode: requireTLS
    certificateKeyFile: /etc/mongodb/server.pem
    CAFile: /etc/mongodb/ca.pem

setParameter:
  authenticationMechanisms: SCRAM-SHA-256
  auditAuthorizationSuccess: false  # Don't log successful auths (noisy)
```

### Compliance Checks

Run automated compliance scans:

**PostgreSQL:**

```bash
# Install pgBadger for log analysis
sudo apt install -y pgbadger

# Generate report
pgbadger /var/log/postgresql/postgresql-14-main.log -o /var/www/html/pgbadger.html

# Manual compliance checks
psql -U postgres -c "
SELECT
  rolname,
  rolsuper,
  rolcreaterole,
  rolcreatedb,
  rolcanlogin,
  rolconnlimit
FROM pg_roles
WHERE rolname NOT LIKE 'pg_%'
ORDER BY rolname;
"

# Check for tables without RLS
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename FROM pg_policies
  );
```

**MongoDB:**

```javascript
// Check authentication status
db.runCommand({ connectionStatus: 1 })

// List all users and their roles
db.getUsers()

// Check for open collections without auth
use test
db.stats()  // Should fail if auth is working
```

### Monitoring with Prometheus and Grafana

**PostgreSQL Exporter:**

```bash
# Install
sudo useradd --no-create-home --shell /bin/false postgres_exporter
wget https://github.com/prometheus-community/postgres_exporter/releases/download/v0.15.0/postgres_exporter-0.15.0.linux-amd64.tar.gz
tar xzf postgres_exporter-0.15.0.linux-amd64.tar.gz
sudo mv postgres_exporter-0.15.0.linux-amd64/postgres_exporter /usr/local/bin/
```

Create a systemd service:

```ini
# /etc/systemd/system/postgres_exporter.service
[Unit]
Description=PostgreSQL Exporter
After=network.target

[Service]
User=postgres_exporter
Environment=DATA_SOURCE_NAME=postgresql://exporter:exporterpass@localhost:5432/aeroacademy?sslmode=disable
ExecStart=/usr/local/bin/postgres_exporter --web.listen-address=":9187"
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now postgres_exporter
```

**Key metrics to monitor:**

```sql
-- Connection count (alert if > 80% of max_connections)
SELECT count(*) FROM pg_stat_activity;

-- Transaction rate
SELECT datname, xact_commit, xact_rollback
FROM pg_stat_database WHERE datname = 'aeroacademy';

-- Cache hit ratio (alert if < 99%)
SELECT
  sum(blks_hit) * 100.0 / sum(blks_hit + blks_read) AS cache_hit_ratio
FROM pg_stat_database;

-- Table bloat (alert if dead tuples > 10%)
SELECT schemaname, relname, n_dead_tup, n_live_tup,
  round(n_dead_tup * 100.0 / nullif(n_live_tup + n_dead_tup, 0), 1) AS dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000;
```

### Alert Rules (Prometheus)

```yaml
# prometheus.yml alert rules
groups:
  - name: postgres_alerts
    rules:
      - alert: HighConnections
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High connection count"

      - alert: LowCacheHitRatio
        expr: pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read) < 0.99
        for: 15m
        labels:
          severity: critical
        annotations:
          summary: "Cache hit ratio below 99%"

      - alert: HighDeadTuples
        expr: pg_stat_user_tables_n_dead_tup > 10000
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "Table has significant bloat"
```

### Log-Based Threat Detection

```bash
# Brute force detection
grep "authentication failed" /var/log/postgresql/postgresql-14-main.log | \
  awk '{print $1, $2, $5}' | sort | uniq -c | sort -rn | head -20

# Connection from unusual IPs
grep "connection authorized" /var/log/postgresql/postgresql-14-main.log | \
  grep -v "10.0.0." | head -20

# DDL changes outside business hours
grep "LOG:  statement: ALTER\|CREATE\|DROP" /var/log/postgresql/postgresql-14-main.log | \
  grep -E "0[2-5]:[0-9]{2}" | head -20
```

## Assessment

**Lab task — 60 minutes**

1. Enable pgaudit on PostgreSQL and generate audit logs for DDL operations. Show the log output.
2. Run the security checklist: revoke public schema access, check for tables without RLS, verify no unnecessary superuser roles.
3. Set up MongoDB audit logging and capture: authentication attempts, collection creation, and user management operations.
4. Install postgres_exporter and configure Prometheus to scrape PostgreSQL metrics.
5. Create a Grafana dashboard with 4 panels: connection count, cache hit ratio, transaction rate, and dead tuples.
6. Write alert rules for: connection count > 80% of max, cache hit ratio < 99%, and authentication failures > 10 in 5 minutes.
7. Write a log analysis script that detects brute force attempts and unusual connection IPs.

**Grading criteria:**
- pgaudit enabled and generating meaningful logs (15 points)
- Security checklist completed with findings documented (15 points)
- MongoDB audit logging configured and capturing events (15 points)
- Prometheus and Grafana setup with 4 working panels (25 points)
- Alert rules functional (15 points)
- Log analysis script detects threats (15 points)

## Evidence

- pgaudit log output for DDL operations
- Security checklist results with remediation steps
- MongoDB audit log entries
- Grafana dashboard screenshot
- Prometheus alert rule configuration
- Log analysis script output showing detected threats
