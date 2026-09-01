# Module 10 — Database Security Hardening

Database security is not a single setting — it is a layered defense strategy. This module covers the practical steps to harden a database for production: audit configurations, compliance requirements, vulnerability scanning, database firewalls, and a complete scenario for hardening PostgreSQL to meet PCI DSS requirements. Every recommendation in this module is something you can implement today. No theory without practice.

## Audit Configurations

Auditing answers three questions: who accessed the data, what did they do, and when did it happen. Without auditing, you cannot detect breaches, investigate incidents, or prove compliance.

**PostgreSQL Audit with pgAudit:**

pgAudit provides detailed session-level and object-level auditing. It logs who ran which query, when, and what objects were affected.

```ini
# postgresql.conf — install and configure pgAudit
shared_preload_libraries = 'pgaudit'
pgaudit.log = 'all'                    # Log all operations
pgaudit.log_catalog = on               # Log catalog access (information_schema)
pgaudit.log_level = 'log'              # Use PostgreSQL logging level
pgaudit.log_parameter = on             # Log query parameters
pgaudit.log_statement = on             # Log statement text
pgaudit.log_statement_once = off       # Log each execution, not just first
pgaudit.role = 'auditor'               # Role that triggers audit logging
```

```sql
-- Create auditor role
CREATE ROLE auditor;
GRANT auditor TO db_admin;

-- Test audit logging
SET ROLE auditor;

CREATE TABLE audit_test (id SERIAL PRIMARY KEY, data TEXT);
INSERT INTO audit_test (data) VALUES ('test');
SELECT * FROM audit_test;
UPDATE audit_test SET data = 'updated';
DELETE FROM audit_test WHERE id = 1;
DROP TABLE audit_test;

RESET ROLE;
```

The audit log entries appear in the PostgreSQL server log:

```
2026-01-15 14:30:00 UTC LOG:  AUDIT: SESSION,1,1,WRITE,INSERT,,,"INSERT INTO audit_test (data) VALUES ('test');",<none>
2026-01-15 14:30:01 UTC LOG:  AUDIT: SESSION,1,1,READ,SELECT,,,"SELECT * FROM audit_test;",<none>
2026-01-15 14:30:02 UTC LOG:  AUDIT: SESSION,1,1,WRITE,UPDATE,,,"UPDATE audit_test SET data = 'updated';",<none>
2026-01-15 14:30:03 UTC LOG:  AUDIT: SESSION,1,1,WRITE,DELETE,,,"DELETE FROM audit_test WHERE id = 1;",<none>
2026-01-15 14:30:04 UTC LOG:  AUDIT: SESSION,1,1,WRITE,DDL,,,"DROP TABLE audit_test;",<none>
```

**MySQL Enterprise Audit:**

```ini
# my.cnf
[mysqld]
audit_log_format = JSON
audit_log_policy = ALL
audit_log_file = /var/log/mysql/audit.json
audit_log_rotate_on_size = 104857600
audit_log_rotations = 10

# Filter specific users or event types
audit_log_include_accounts = 'appuser@10.0.1.%,dbadmin@10.0.1.%'
```

**Centralized Audit Log Collection:**

Audit logs on individual database servers are difficult to search and easy to tamper with. Send them to a centralized logging system:

```bash
# Ship PostgreSQL logs to syslog
# In postgresql.conf
log_destination = 'syslog'
syslog_ident = 'postgresql'
syslog_facility = 'local0'

# rsyslog configuration
# /etc/rsyslog.d/postgresql.conf
local0.* @@logserver.internal:514
```

```bash
# Ship to ELK stack using Filebeat
# /etc/filebeat/filebeat.yml
filebeat.inputs:
  - type: log
    paths:
      - /var/log/postgresql/*.log
    fields:
      service: postgresql
      environment: production
    fields_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch.internal:9200"]
  index: "db-audit-%{+yyyy.MM.dd}"
```

**Retention Policy:**

Audit logs must be retained for a specific period depending on compliance requirements:

- PCI DSS: 1 year, with 3 months immediately available
- HIPAA: 6 years
- SOC 2: 7 years
- GDPR: As long as the data subject's data is retained, plus legal hold periods

```bash
# Logrotate configuration for PostgreSQL audit logs
# /etc/logrotate.d/postgresql
/var/log/postgresql/*.log {
    daily
    rotate 365
    compress
    delaycompress
    notifempty
    missingok
    copytruncate
}
```

## Compliance: PCI DSS, HIPAA

Compliance is not optional for databases that handle regulated data. Understanding the specific requirements helps you implement the right controls.

**PCI DSS for Payment Card Data:**

PCI DSS (Payment Card Industry Data Security Standard) applies to any system that stores, processes, or transmits cardholder data. The 12 requirements relevant to databases:

1. Install and maintain network security controls (firewalls, network segmentation)
2. Apply secure configurations (change default passwords, disable unnecessary services)
3. Protect stored account data (encryption, truncation, tokenization)
4. Encrypt transmission of cardholder data (TLS for all connections)
5. Protect against malware (antivirus, application whitelisting)
6. Develop and maintain secure systems (patching, secure coding)
7. Restrict access by business need-to-know (role-based access, least privilege)
8. Identify users and authenticate access (unique IDs, MFA for admin)
9. Restrict physical access (data center security)
10. Log and monitor all access (audit logging, SIEM integration)
11. Test security systems regularly (vulnerability scanning, penetration testing)
12. Support information security with organizational policies

**Database-Specific PCI Controls:**

```sql
-- 1. Encrypt cardholder data at rest
-- Column-level encryption for PAN (Primary Account Number)
CREATE TABLE card_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pan_encrypted BYTEA NOT NULL,
    pan_hash BYTEA NOT NULL,  -- For lookups without decryption
    expiry DATE NOT NULL,
    cardholder_name TEXT,
    key_version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Mask PAN when displayed (show only last 4 digits)
CREATE VIEW card_display AS
SELECT
    id,
    '****-****-****-' || decode(pgp_sym_decrypt(pan_encrypted, current_setting('app.encryption_key')), 'escape')::text AS masked_pan,
    expiry,
    cardholder_name
FROM card_data;

-- 3. Restrict access to cardholder data
REVOKE ALL ON card_data FROM PUBLIC;
GRANT SELECT (id, expiry, cardholder_name) ON card_data TO app_read;
GRANT SELECT, INSERT, UPDATE ON card_data TO app_write;
GRANT ALL ON card_data TO db_admin;

-- 4. Audit all access to cardholder data
CREATE TRIGGER audit_card_data
    AFTER INSERT OR UPDATE OR DELETE ON card_data
    FOR EACH ROW EXECUTE FUNCTION audit_changes();

-- 5. Do not store sensitive data in logs
-- Application must redact PAN before logging
```

**HIPAA for Health Data:**

HIPAA (Health Insurance Portability and Accountability Act) protects Protected Health Information (PHI). Database requirements include:

- Access controls: unique user identification, emergency access procedures, automatic logoff
- Audit controls: record and examine access to PHI
- Integrity controls: ensure PHI is not improperly altered or destroyed
- Transmission security: encryption for PHI in transit

```sql
-- HIPAA-compliant user management
CREATE ROLE phi_reader;
CREATE ROLE phi_writer;
CREATE ROLE phi_admin;

-- Minimum necessary access
GRANT SELECT ON patients TO phi_reader;
GRANT SELECT, INSERT, UPDATE ON medical_records TO phi_writer;
GRANT ALL ON patients, medical_records TO phi_admin;

-- Emergency access procedure
CREATE ROLE emergency_access;
ALTER ROLE emergency_access BYPASSRLS;
GRANT ALL ON ALL TABLES IN SCHEMA public TO emergency_access;
-- Emergency access is logged and reviewed weekly

-- Automatic logoff (application-level, not database)
-- Database connection timeout as defense-in-depth
SET statement_timeout = '30min';
SET idle_in_transaction_session_timeout = '10min';
```

## Vulnerability Scanning

Regular vulnerability scanning identifies misconfigurations, missing patches, and known vulnerabilities before attackers exploit them.

**Nmap Service Enumeration:**

```bash
# Scan for open database ports
nmap -sV -p 5432,3306,27017 10.0.1.0/24

# Check for default credentials
nmap --script mysql-info,mysql-empty-password -p 3306 10.0.1.0/24

# Check PostgreSQL version (versions with known CVEs)
nmap -sV -p 5432 --script pgsql-brute 10.0.1.0/24
```

**Database Vulnerability Assessment with Lynis:**

```bash
# Lynis database security audit
sudo lynis audit system --tests-from-group "database"

# PostgreSQL-specific checks
sudo lynis show tests | grep postgres
```

**pgAudit for Configuration Review:**

```sql
-- Check for users with excessive privileges
SELECT
    rolname,
    rolsuper,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin,
    rolreplication
FROM pg_roles
WHERE rolsuper = true;

-- Check for tables without RLS
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE c.relrowsecurity = true
  );

-- Check for open database connections
SELECT
    client_addr,
    usename,
    application_name,
    state,
    backend_start
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY backend_start;

-- Check for unencrypted connections
SELECT
    pg_stat_ssl.pid,
    pg_stat_activity.usename,
    pg_stat_ssl.ssl,
    pg_stat_ssl.version
FROM pg_stat_ssl
JOIN pg_stat_activity ON pg_stat_ssl.pid = pg_stat_activity.pid
WHERE pg_stat_ssl.ssl = false
  AND pg_stat_activity.client_addr != '127.0.0.1';

-- Check for default passwords
SELECT usename FROM pg_shadow WHERE passwd IS NULL;
```

**MySQL Vulnerability Checks:**

```sql
-- Check for users with no password
SELECT user, host, authentication_string FROM mysql.user
WHERE authentication_string = '' OR authentication_string IS NULL;

-- Check for remote root access
SELECT user, host FROM mysql.user WHERE user = 'root' AND host != 'localhost';

-- Check for FILE privilege (allows reading/writing files)
SELECT user, host FROM mysql.user WHERE File_priv = 'Y';

-- Check for SUPER privilege
SELECT user, host FROM mysql.user WHERE Super_priv = 'Y';

-- Check for GRANT OPTION (allows privilege escalation)
SELECT user, host FROM mysql.user WHERE Grant_priv = 'Y';

-- Check TLS status
SHOW VARIABLES LIKE '%ssl%';
SHOW STATUS LIKE 'Ssl_cipher';
```

## Compliance Audit Procedures

Compliance audits are not optional. Failing an audit can result in fines, loss of certification, or inability to process payments. The key to passing audits is maintaining continuous compliance, not scrambling before the auditor arrives.

**PCI DSS Audit Checklist for Databases:**

```sql
-- 1. Verify encryption at rest
-- Check for unencrypted sensitive data
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name IN ('card_number', 'ssn', 'pan', 'cvv', 'password')
  AND table_schema = 'public';
-- All sensitive columns should be encrypted (BYTEA type or encrypted)

-- 2. Verify access controls
-- List all users and their privileges
SELECT
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee NOT IN ('postgres', 'db_admin')
ORDER BY grantee, table_name;

-- 3. Verify audit logging is active
SELECT name, setting
FROM pg_settings
WHERE name IN ('pgaudit.log', 'log_connections', 'log_disconnections');

-- 4. Verify TLS is required
SELECT
    pg_stat_ssl.pid,
    pg_stat_activity.usename,
    pg_stat_ssl.ssl
FROM pg_stat_ssl
JOIN pg_stat_activity ON pg_stat_ssl.pid = pg_stat_activity.pid
WHERE pg_stat_ssl.ssl = false
  AND pg_stat_activity.client_addr != '127.0.0.1';
-- Should return 0 rows

-- 5. Verify backup encryption
-- Check that backup files are encrypted (GPG or similar)
-- This requires file system verification, not SQL
```

**HIPAA Audit Checklist for Databases:**

```sql
-- 1. Unique user identification
SELECT usename FROM pg_user WHERE usecreatedb = false;
-- Every user should have a unique username

-- 2. Emergency access procedure
SELECT rolname FROM pg_roles WHERE rolname = 'emergency_access';
-- Emergency access role should exist and be logged

-- 3. Automatic logoff
SHOW statement_timeout;  -- Should be set
SHOW idle_in_transaction_session_timeout;  -- Should be set

-- 4. Audit controls
SELECT name, setting FROM pg_settings WHERE name = 'pgaudit.log';
-- Should be configured to log access to PHI tables

-- 5. Integrity controls
-- Verify triggers exist on PHI tables
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('patients', 'medical_records', 'diagnoses');
```

**Preparing for an Audit:**

1. Run the compliance checklist queries at least quarterly
2. Document any findings and remediation steps
3. Keep evidence of control implementation (configuration files, screenshots, logs)
4. Maintain a risk register for any accepted risks
5. Test backup restoration and document results

**Continuous Compliance Monitoring:**

```sql
-- Create a compliance monitoring view
CREATE VIEW compliance_status AS
SELECT
    'encryption_at_rest' AS control,
    CASE WHEN COUNT(*) = 0 THEN 'COMPLIANT' ELSE 'NON-COMPLIANT' END AS status,
    'Sensitive columns should be encrypted' AS description
FROM information_schema.columns
WHERE column_name IN ('card_number', 'ssn', 'pan')
  AND data_type IN ('text', 'varchar', 'character varying')
  AND table_schema = 'public'

UNION ALL

SELECT
    'tls_required' AS control,
    CASE WHEN COUNT(*) = 0 THEN 'COMPLIANT' ELSE 'NON-COMPLIANT' END AS status,
    'No unencrypted remote connections' AS description
FROM pg_stat_ssl
JOIN pg_stat_activity ON pg_stat_ssl.pid = pg_stat_activity.pid
WHERE pg_stat_ssl.ssl = false
  AND pg_stat_activity.client_addr != '127.0.0.1'

UNION ALL

SELECT
    'audit_logging' AS control,
    CASE WHEN setting != '' THEN 'COMPLIANT' ELSE 'NON-COMPLIANT' END AS status,
    'pgaudit.log should be configured' AS description
FROM pg_settings
WHERE name = 'pgaudit.log';

-- Check compliance status
SELECT * FROM compliance_status;
```

## Database Firewall

A database firewall sits between the application and the database, filtering queries based on rules. It blocks dangerous queries, detects SQL injection, and enforces query whitelists.

**pg_firewall (PostgreSQL Extension):**

```sql
-- Install pg_firewall
CREATE EXTENSION pg_firewall;

-- Create a rule to block DROP TABLE
INSERT INTO firewall_rules (rule_name, action, pattern, enabled)
VALUES (
    'block_drop_table',
    'deny',
    'DROP TABLE',
    true
);

-- Create a rule to block DELETE without WHERE
INSERT INTO firewall_rules (rule_name, action, pattern, enabled)
VALUES (
    'block_unconditional_delete',
    'deny',
    'DELETE FROM\s+\w+\s*;?\s*$',
    true
);

-- Create a whitelist for the application user
INSERT INTO firewall_rules (rule_name, action, pattern, enabled, users)
VALUES (
    'app_select_whitelist',
    'allow',
    'SELECT\s+.*\s+FROM\s+(orders|products|customers|users)',
    true,
    'appuser'
);
```

**MaxScale (MySQL Proxy with Firewall):**

```ini
# MaxScale configuration
[server1]
type=server
address=10.0.1.10
port=3306
protocol=MariaDBBackend

[mysql-firewall]
type=filter
module=qlafilter
options=/var/log/maxscale/query.log
deny=*DROP*,*DELETE*WHERE*,*UPDATE*WHERE*

[Read-Write-Service]
type=service
router=readwritesplit
servers=server1
filters=mysql-firewall
```

**Application-Level Query Validation:**

```python
import re

# Query whitelist for the application
ALLOWED_QUERIES = [
    r'^SELECT .* FROM orders WHERE customer_id = \?$',
    r'^SELECT .* FROM products WHERE id = \?$',
    r'^INSERT INTO orders \(.*\) VALUES \(\?.*\)$',
    r'^UPDATE orders SET .* WHERE id = \?$',
]

BLOCKED_PATTERNS = [
    r'DROP\s+TABLE',
    r'DELETE\s+FROM\s+\w+\s*;?\s*$',
    r'UPDATE\s+\w+\s+SET\s+\w+\s*=\s*\w+\s*;?\s*$',
    r'UNION\s+SELECT',
    r'--\s*$',
    r'/\*.*\*/',
]

def validate_query(query):
    query_upper = query.upper().strip()

    # Check blocked patterns first
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, query_upper):
            raise SecurityError(f"Blocked query pattern: {pattern}")

    # Check against whitelist
    for allowed in ALLOWED_QUERIES:
        if re.match(allowed, query_upper, re.IGNORECASE):
            return True

    raise SecurityError(f"Query not in whitelist: {query[:100]}")
```

**ProxySQL Firewall Rules:**

```sql
-- ProxySQL query rules for firewalling
-- Block queries matching dangerous patterns
INSERT INTO mysql_query_rules (
    rule_id, active, match_pattern, apply, error_msg
) VALUES (
    100, 1, '(?i)^\\s*(DROP|TRUNCATE|ALTER)\\s+', 1,
    'ERROR: DDL operation blocked by firewall'
);

INSERT INTO mysql_query_rules (
    rule_id, active, match_pattern, apply, error_msg
) VALUES (
    101, 1, '(?i)^\\s*DELETE\\s+FROM\\s+\\w+\\s*;\\s*$', 1,
    'ERROR: Unconditional DELETE blocked by firewall'
);

INSERT INTO mysql_query_rules (
    rule_id, active, match_pattern, apply, error_msg
) VALUES (
    102, 1, '(?i)UNION\\s+SELECT', 1,
    'ERROR: UNION SELECT blocked by firewall'
);

-- Load rules
LOAD MYSQL QUERY RULES TO RUNTIME;
SAVE MYSQL QUERY RULES TO DISK;
```

## Database Security Hardening Checklist

Use this checklist when hardening any database for production. Each item addresses a specific attack vector.

**Authentication and Access Control:**
- [ ] Change default passwords for all administrative accounts
- [ ] Disable or remove anonymous accounts
- [ ] Restrict database listening to specific IP addresses, not 0.0.0.0
- [ ] Implement role-based access control with least privilege
- [ ] Require strong passwords (minimum 12 characters, mixed case, numbers, symbols)
- [ ] Enable account lockout after failed login attempts
- [ ] Set session timeouts to prevent idle sessions

**Encryption:**
- [ ] Enable TLS for all client connections
- [ ] Use TLS 1.2 or higher (disable SSLv3, TLS 1.0, TLS 1.1)
- [ ] Encrypt sensitive data at rest (TDE or column-level encryption)
- [ ] Encrypt backups with separate encryption keys
- [ ] Store encryption keys in a dedicated key management system

**Audit and Monitoring:**
- [ ] Enable audit logging for all DDL and DML operations
- [ ] Log all authentication attempts (success and failure)
- [ ] Ship audit logs to a centralized logging system
- [ ] Set up alerts for suspicious activity (failed logins, large data exports)
- [ ] Review audit logs weekly

**Network Security:**
- [ ] Place database in a private network segment
- [ ] Use a firewall to restrict access to specific application servers
- [ ] Enable mutual TLS (mTLS) for application-to-database connections
- [ ] Disable unused network services and ports

**Configuration Hardening:**
- [ ] Remove default databases and test tables
- [ ] Disable remote administrative access
- [ ] Configure secure backup retention and encryption
- [ ] Apply vendor security patches promptly
- [ ] Disable unnecessary features and extensions

## Real Scenario: Hardening a Database for PCI Compliance

You are the DBA for a payment processing company. The annual PCI DSS assessment is in 30 days. The assessor has flagged several issues in the current PostgreSQL database. You need to address all findings before the assessment.

**Current Findings:**

1. Cardholder data stored in plaintext
2. All database users share a single application account
3. No audit logging configured
4. Database port open to all network interfaces
5. No encryption for database connections
6. No backup encryption
7. Default PostgreSQL configuration

**Remediation Plan:**

**Week 1: Data Encryption and Access Control**

```sql
-- 1. Create encrypted table for cardholder data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE cardholder_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    pan_encrypted BYTEA NOT NULL,
    pan_hash BYTEA NOT NULL,
    cvv_encrypted BYTEA,
    expiry_month INT NOT NULL,
    expiry_year INT NOT NULL,
    cardholder_name TEXT,
    key_version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Migrate existing plaintext data to encrypted table
-- (Run during maintenance window)
-- See Module 7 for detailed migration procedure

-- 3. Create unique database users for each application component
CREATE USER app_orders WITH PASSWORD 'strong_password_1';
CREATE USER app_payments WITH PASSWORD 'strong_password_2';
CREATE USER app_reports WITH PASSWORD 'strong_password_3';
CREATE USER db_monitor WITH PASSWORD 'strong_password_4';
CREATE USER db_backup WITH PASSWORD 'strong_password_5';

-- 4. Grant minimum necessary privileges
GRANT CONNECT ON DATABASE paymentdb TO app_orders;
GRANT USAGE ON SCHEMA public TO app_orders;
GRANT SELECT, INSERT, UPDATE ON orders TO app_orders;
GRANT SELECT, INSERT, UPDATE ON order_items TO app_orders;

GRANT CONNECT ON DATABASE paymentdb TO app_payments;
GRANT USAGE ON SCHEMA public TO app_payments;
GRANT SELECT, INSERT, UPDATE ON cardholder_data TO app_payments;

GRANT CONNECT ON DATABASE paymentdb TO app_reports;
GRANT USAGE ON SCHEMA public TO app_reports;
GRANT SELECT ON orders, order_items, products TO app_reports;

GRANT CONNECT ON DATABASE paymentdb TO db_monitor;
GRANT USAGE ON SCHEMA public TO db_monitor;
GRANT SELECT ON pg_stat_activity TO db_monitor;
GRANT SELECT ON pg_stat_replication TO db_monitor;

GRANT CONNECT ON DATABASE paymentdb TO db_backup;
GRANT USAGE ON SCHEMA public TO db_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO db_backup;
GRANT SELECT ON pg_stat_activity TO db_backup;

-- 5. Revoke public access
REVOKE ALL ON DATABASE paymentdb FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

**Week 2: Network Security and TLS**

```ini
# postgresql.conf — security hardening
listen_addresses = '10.0.1.10'  # Bind to specific IP, not all interfaces
port = 5432
max_connections = 200

# TLS configuration
ssl = on
ssl_cert_file = '/etc/postgresql/ssl/server.crt'
ssl_key_file = '/etc/postgresql/ssl/server.key'
ssl_ca_file = '/etc/postgresql/ssl/ca.crt'
ssl_min_protocol_version = 'TLSv1.2'
ssl_ciphers = 'HIGH:!aNULL:!MD5:!3DES:!RC4'

# Authentication
password_encryption = scram-sha-256

# Logging
log_connections = on
log_disconnections = on
log_line_prefix = '%m [%p] %q%u@%d '
log_statement = 'ddl'
log_min_duration_statement = 1000  # Log queries > 1 second

# Limits
statement_timeout = '30min'
idle_in_transaction_session_timeout = '10min'
```

```ini
# pg_hba.conf — restrict access
# Local admin access
local   all   postgres                peer

# Application access — TLS required
hostssl paymentdb  app_orders   10.0.1.0/24  scram-sha-256
hostssl paymentdb  app_payments 10.0.1.0/24  scram-sha-256
hostssl paymentdb  app_reports  10.0.2.0/24  scram-sha-256

# Monitoring access
hostssl paymentdb  db_monitor   10.0.3.0/24  scram-sha-256

# Backup access — local only
local   paymentdb  db_backup                peer

# Replication
hostssl replication db_backup    10.0.1.0/24  scram-sha-256

# Reject everything else
host    all        all          0.0.0.0/0    reject
local   all        all                      reject
```

**Week 3: Audit Logging and Monitoring**

```ini
# Install pgAudit
shared_preload_libraries = 'pgaudit'

# pgAudit configuration
pgaudit.log = 'write, ddl, role'
pgaudit.log_catalog = on
pgaudit.log_level = 'log'
pgaudit.log_parameter = on
pgaudit.log_statement_once = off
```

```sql
-- Custom audit log for PCI compliance
CREATE TABLE pci_audit_log (
    id BIGSERIAL PRIMARY KEY,
    event_time TIMESTAMPTZ DEFAULT NOW(),
    user_name TEXT NOT NULL,
    user_ip INET,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    query_text TEXT,
    application_name TEXT
);

-- Trigger for cardholder_data table
CREATE FUNCTION audit_cardholder_data() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO pci_audit_log (user_name, user_ip, action, table_name, record_id, new_values, query_text)
        VALUES (
            current_user,
            inet(current_setting('app.client_ip', true)),
            'INSERT',
            TG_TABLE_NAME,
            NEW.id,
            jsonb_build_object('customer_id', NEW.customer_id, 'cardholder_name', NEW.cardholder_name),
            current_query()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO pci_audit_log (user_name, user_ip, action, table_name, record_id, old_values, new_values, query_text)
        VALUES (
            current_user,
            inet(current_setting('app.client_ip', true)),
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id,
            jsonb_build_object('key_version', OLD.key_version),
            jsonb_build_object('key_version', NEW.key_version),
            current_query()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO pci_audit_log (user_name, user_ip, action, table_name, record_id, old_values, query_text)
        VALUES (
            current_user,
            inet(current_setting('app.client_ip', true)),
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            jsonb_build_object('customer_id', OLD.customer_id),
            current_query()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_cardholder_data
    AFTER INSERT OR UPDATE OR DELETE ON cardholder_data
    FOR EACH ROW EXECUTE FUNCTION audit_cardholder_data();
```

**Week 4: Backup Encryption and Final Verification**

```bash
# 1. Encrypt backups
pg_dump -h localhost -U db_backup -d paymentdb \
  -Fc -Z 6 -f /backups/paymentdb_$(date +%Y%m%d).dump

# Encrypt the backup file
gpg --symmetric --cipher-algo AES256 \
  --passphrase-file /etc/backup-encryption.key \
  /backups/paymentdb_$(date +%Y%m%d).dump

# Remove unencrypted backup
rm /backups/paymentdb_$(date +%Y%m%d).dump

# 2. Verify TLS connections
psql -h localhost -U db_monitor -d paymentdb -c "
  SELECT client_addr, usename, ssl, version, cipher
  FROM pg_stat_ssl
  JOIN pg_stat_activity ON pg_stat_ssl.pid = pg_stat_activity.pid
  WHERE ssl = false AND client_addr != '127.0.0.1';
"
# Should return 0 rows (all remote connections encrypted)

# 3. Verify no users with excessive privileges
psql -h localhost -U db_monitor -d paymentdb -c "
  SELECT rolname, rolsuper, rolcreaterole, rolcreatedb
  FROM pg_roles
  WHERE rolsuper = true AND rolname NOT IN ('postgres');
"
# Should return 0 rows

# 4. Verify audit logging is active
psql -h localhost -U db_monitor -d paymentdb -c "
  SELECT name, setting
  FROM pg_settings
  WHERE name LIKE 'pgaudit%';
"
```

**PCI DSS Compliance Checklist:**

- [x] Cardholder data encrypted at rest (column-level encryption with AES-256)
- [x] Unique database users for each application component
- [x] Minimum necessary privileges granted (least privilege)
- [x] Database port restricted to specific IP addresses
- [x] TLS 1.2+ required for all connections
- [x] Audit logging captures all access to cardholder data
- [x] Audit logs shipped to centralized logging system
- [x] Backups encrypted with separate encryption key
- [x] Default PostgreSQL configuration hardened
- [x] Connection timeouts configured to prevent session hijacking
- [x] Public access revoked from all database objects
- [x] No users with SUPER privilege except postgres admin
- [x] Password policy enforced (SCRAM-SHA-256 authentication)
- [x] PCI audit log retained for 1 year with 3 months immediate access

## Assessment

**Lab Tasks:**

1. Configure pgAudit on a PostgreSQL instance. Create a custom audit log table with a trigger that captures all DML operations on a sensitive table including the user, IP address, query text, and timestamp. Verify the audit log captures a sequence of INSERT, UPDATE, and DELETE operations. Time limit: 45 minutes.

2. Perform a database security audit on a PostgreSQL instance: check for users with excessive privileges, unencrypted connections, tables without RLS, and default configurations. Write a report with findings and remediation steps. Time limit: 30 minutes.

3. Set up a database firewall using ProxySQL or application-level query validation. Create rules that block: DROP TABLE, unconditional DELETE, UNION SELECT, and queries not in a whitelist. Test the rules with both legitimate and malicious queries. Time limit: 45 minutes.

4. Implement a complete PCI DSS hardening checklist for a PostgreSQL database: encrypt cardholder data, create role-based users with minimum privileges, enable TLS, configure audit logging, and encrypt backups. Verify each control is working. Time limit: 60 minutes.

**Grading Criteria:**
- Audit logging (25%): pgAudit configured correctly, custom audit table captures all required information
- Security audit (25%): All vulnerabilities identified, report includes actionable remediation steps
- Database firewall (25%): Rules block dangerous queries while allowing legitimate traffic
- PCI hardening (25%): All controls implemented and verified, compliance checklist complete

**Evidence:**
- pgAudit configuration and audit log entries
- Security audit report with findings and remediation
- Firewall rules and test results
- PCI compliance verification output
