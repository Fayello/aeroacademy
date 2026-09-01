# Module 6: Database Access Control

Controlling who can access your database and what they can do once they are in is the foundation of database security. Granting too many privileges is the most common DBA mistake: every user gets readWrite on everything, and then the breach happens. This module covers the practical mechanics of database access control: roles, row-level security, column-level permissions, dynamic data masking, and audit logging. We will build a complete RBAC system for a multi-tenant application as the running scenario.

## Roles and Permissions

Roles are named groups of privileges. Instead of granting individual privileges to each user, you create roles that represent job functions and assign users to those roles. When the privileges for a role change, all users with that role inherit the change.

**PostgreSQL Role System:**

```sql
-- Create roles for different job functions
CREATE ROLE db_reader;
CREATE ROLE db_writer;
CREATE ROLE db_admin;
CREATE ROLE db_auditor;

-- Grant privileges to roles
GRANT CONNECT ON DATABASE myapp TO db_reader;
GRANT USAGE ON SCHEMA public TO db_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO db_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO db_reader;

GRANT CONNECT ON DATABASE myapp TO db_writer;
GRANT USAGE ON SCHEMA public TO db_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO db_writer;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO db_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO db_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO db_writer;

GRANT ALL PRIVILEGES ON DATABASE myapp TO db_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO db_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO db_admin;

-- Auditor gets read access plus the ability to read audit logs
GRANT CONNECT ON DATABASE myapp TO db_auditor;
GRANT USAGE ON SCHEMA public TO db_auditor;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO db_auditor;
GRANT SELECT ON audit_log TO db_auditor;

-- Create users and assign roles
CREATE USER alice WITH PASSWORD 'secure_password_1';
CREATE USER bob WITH PASSWORD 'secure_password_2';
CREATE USER charlie WITH PASSWORD 'secure_password_3';
CREATE USER diana WITH PASSWORD 'secure_password_4';

GRANT db_reader TO alice;
GRANT db_writer TO bob;
GRANT db_admin TO charlie;
GRANT db_auditor TO diana;
```

The `ALTER DEFAULT PRIVILEGES` commands are critical. Without them, newly created tables would not grant any privileges to the role. The `GRANT ... ON ALL TABLES` applies to existing tables, and `ALTER DEFAULT PRIVILEGES` applies to future tables.

**MySQL Role System (8.0+):**

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

-- Set default roles (auto-activated on login)
SET DEFAULT ROLE ALL TO 'reporter'@'10.0.2.%';
SET DEFAULT ROLE ALL TO 'appuser'@'10.0.1.%';
SET DEFAULT ROLE ALL TO 'dbadmin'@'10.0.1.%';

-- View role assignments
SELECT user, default_roles FROM mysql.default_roles;
SHOW GRANTS FOR 'appuser'@'10.0.1.%' USING 'app_write';
```

**Principle of Least Privilege:**

The principle is straightforward: grant only the minimum privileges needed for a user to perform their job. In practice, this means:

- Application users get SELECT, INSERT, UPDATE, DELETE on specific tables, never DROP, ALTER, or CREATE
- Read-only reporting users get only SELECT
- Backup users get SELECT, RELOAD, LOCK TABLES, REPLICATION CLIENT
- Monitoring users get CONNECT and SELECT on pg_stat tables
- Administrators get broader privileges but are still restricted from unnecessary operations

A common violation: granting `ALL PRIVILEGES ON *.*` to an application user. This gives the application the ability to DROP any table, CREATE new databases, or modify server configuration. If the application is compromised, the attacker has full control of the database server.

**Revoking Privileges:**

```sql
-- PostgreSQL
REVOKE ALL PRIVILEGES ON DATABASE myapp FROM public;
REVOKE CREATE ON SCHEMA public FROM public;

-- Find and revoke overly broad privileges
SELECT grantee, privilege_type, table_name
FROM information_schema.table_privileges
WHERE grantee = 'appuser' AND privilege_type IN ('DROP', 'ALTER', 'TRUNCATE');

REVOKE DROP, ALTER, TRUNCATE ON ALL TABLES IN SCHEMA public FROM appuser;

-- MySQL
SHOW GRANTS FOR 'appuser'@'10.0.1.%';
REVOKE DROP, ALTER, CREATE ON myapp.* FROM 'appuser'@'10.0.1.%';
```

## Row-Level Security

Row-level security (RLS) restricts which rows a user can see or modify. In a multi-tenant application, tenant isolation is the most common use case: each tenant sees only their own data.

**PostgreSQL RLS:**

```sql
-- Create a multi-tenant orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_name TEXT NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on the table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create a policy: tenants can only see their own orders
CREATE POLICY tenant_isolation ON orders
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Create a policy for inserts: tenants can only insert for their own tenant
CREATE POLICY tenant_insert ON orders
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

-- Create a policy for updates: tenants can only update their own rows
CREATE POLICY tenant_update ON orders
    FOR UPDATE
    USING (tenant_id = current_setting('app.current_tenant')::UUID)
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

-- Create a policy for deletes: tenants can only delete their own rows
CREATE POLICY tenant_delete ON orders
    FOR DELETE
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Admin policy: bypass RLS for admin users
CREATE POLICY admin_bypass ON orders
    TO db_admin
    USING (true);
```

When a user queries the orders table, PostgreSQL automatically appends the WHERE clause defined in the policy:

```sql
-- User sets their tenant context
SET app.current_tenant = '11111111-1111-1111-1111-111111111111';

-- This query
SELECT * FROM orders;

-- Is automatically transformed to
SELECT * FROM orders WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
```

**Bypassing RLS (Admin Access):**

```sql
-- Only table owners and superusers can bypass RLS
ALTER TABLE orders OWNER TO db_admin;

-- Or grant BYPASSRLS to a specific role
ALTER ROLE db_admin BYPASSRLS;

-- Users without BYPASSRLS cannot bypass RLS, even with table owner
-- This is a security feature, not a bug
```

**RLS with Functions:**

```sql
-- More complex policy using a function
CREATE FUNCTION get_current_tenant() RETURNS UUID AS $$
    SELECT current_setting('app.current_tenant')::UUID;
$$ LANGUAGE sql STABLE;

CREATE POLICY tenant_isolation_v2 ON orders
    USING (tenant_id = get_current_tenant());
```

**Enforcement in the Application:**

```python
# Python example: set tenant context before each request
from flask import g, request
import psycopg2

@app.before_request
def set_tenant_context():
    tenant_id = request.headers.get('X-Tenant-ID')
    if not tenant_id:
        abort(400, 'Missing tenant ID')
    g.db.execute(
        "SET app.current_tenant = %s",
        (tenant_id,)
    )
```

The security of RLS depends on the application correctly setting the session variable. If the application forgets to set `app.current_tenant`, the query fails (no rows match an empty tenant_id). This is the safe default: fail closed, not open.

## Column-Level Permissions

Column-level permissions restrict access to specific columns within a table. This is useful when different users need access to the same table but different subsets of its columns.

**PostgreSQL Column-Level Grants:**

```sql
-- The employees table has sensitive columns
CREATE TABLE employees (
    id UUID PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    ssn TEXT NOT NULL,         -- Social Security Number
    salary NUMERIC(10,2),      -- Compensation
    department TEXT NOT NULL,
    hire_date DATE NOT NULL
);

-- HR role can see all columns
GRANT SELECT (id, first_name, last_name, email, ssn, salary, department, hire_date)
    ON employees TO db_hr;

-- Manager role can see most columns but not SSN
GRANT SELECT (id, first_name, last_name, email, salary, department, hire_date)
    ON employees TO db_manager;

-- General employee role can see only basic info
GRANT SELECT (id, first_name, last_name, email, department)
    ON employees TO db_employee;

-- Salary column is restricted to HR only
GRANT SELECT (salary) ON employees TO db_hr;
REVOKE SELECT (salary) FROM db_manager;
REVOKE SELECT (salary) FROM db_employee;
```

When a manager queries `SELECT * FROM employees`, PostgreSQL returns an error because the manager does not have SELECT on all columns. The application must explicitly list the columns the user is allowed to see:

```sql
-- Application query for manager role
SELECT id, first_name, last_name, email, salary, department, hire_date
FROM employees
WHERE department = 'engineering';
```

**Column-Level Grants with Views:**

```sql
-- Create views for different access levels
CREATE VIEW employee_public AS
    SELECT id, first_name, last_name, email, department
    FROM employees;

CREATE VIEW employee_manager AS
    SELECT id, first_name, last_name, email, salary, department, hire_date
    FROM employees;

-- Grant access to views instead of the base table
GRANT SELECT ON employee_public TO db_employee;
GRANT SELECT ON employee_manager TO db_manager;
GRANT SELECT ON employees TO db_hr;
```

Views provide a cleaner abstraction than column-level grants on the base table. The application code does not need to change based on the user's role: it queries the appropriate view.

## Dynamic Data Masking

Dynamic data masking transforms data at query time based on the user's role. The underlying data is unchanged: the masking is applied during retrieval. This is different from column-level permissions, which either show the full value or nothing.

**PostgreSQL Masking with pgcrypto:**

```sql
-- Install pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to mask SSN
CREATE FUNCTION mask_ssn(ssn TEXT, show_last_four BOOLEAN DEFAULT false)
RETURNS TEXT AS $$
BEGIN
    IF show_last_four THEN
        RETURN '***-**-' || RIGHT(ssn, 4);
    ELSE
        RETURN '***-**-****';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a view with masking
CREATE VIEW masked_employees AS
SELECT
    id,
    first_name,
    last_name,
    email,
    CASE
        WHEN current_user IN ('db_hr', 'db_admin') THEN ssn
        ELSE mask_ssn(ssn, false)
    END AS ssn,
    CASE
        WHEN current_user IN ('db_hr', 'db_admin') THEN salary::TEXT
        WHEN current_user = 'db_manager' THEN '***' || RIGHT(salary::TEXT, 3)
        ELSE '***'
    END AS salary,
    department,
    hire_date
FROM employees;
```

**SQL Server Dynamic Data Masking (Built-in):**

```sql
-- SQL Server has native dynamic data masking
ALTER TABLE employees
ALTER COLUMN ssn ADD MASKED WITH (FUNCTION = 'partial(0,"XXX-XX-",4)');

ALTER TABLE employees
ALTER COLUMN salary ADD MASKED WITH (FUNCTION = 'default()');

ALTER TABLE employees
ALTER COLUMN email ADD MASKED WITH (FUNCTION = 'email()');

-- Unmask for authorized users
GRANT UNMASK TO db_hr;
GRANT UNMASK TO db_admin;

-- When db_hr queries
SELECT * FROM employees;
-- Returns unmasked SSN, salary, and email

-- When db_employee queries
SELECT * FROM employees;
-- Returns masked SSN: XXX-XX-1234
-- Returns masked salary: ****
-- Returns masked email: a***@e***.com
```

**PostgreSQL masking with Anonymous Access:**

```sql
-- Create a masking function for emails
CREATE FUNCTION mask_email(email TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LEFT(email, 1) || '***@' || SPLIT_PART(email, '@', 2);
END;
$$ LANGUAGE plpgsql;

-- Create a masking function for phone numbers
CREATE FUNCTION mask_phone(phone TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN '***-***-' || RIGHT(phone, 4);
END;
$$ LANGUAGE plpgsql;

-- Apply masking in views or direct queries
SELECT
    id,
    first_name || ' ' || last_name AS full_name,
    mask_email(email) AS email,
    mask_phone(phone) AS phone,
    department
FROM employees;
```

Dynamic data masking is a presentation-layer security control. It does not protect against SQL injection (the attacker could bypass the mask) or database users who have direct table access. Use it as a defense-in-depth measure alongside proper access controls.

## Access Control Best Practices

Beyond the technical implementation, several operational practices prevent the most common access control failures.

**Separation of Duties:**

The DBA who manages the database server should not be the same person who manages application data. The developer who writes application code should not have production database credentials. The security auditor should have read-only access to audit logs but no ability to modify data.

In practice, this means:
- Database administrators have server-level privileges (start/stop, configuration, backup)
- Application service accounts have data-level privileges (SELECT, INSERT, UPDATE, DELETE)
- Security auditors have read-only access to audit logs and configuration
- Developers use separate development databases, not production

**Regular Access Reviews:**

Quarterly reviews of database access prevent privilege creep. Employees change roles, contractors leave, applications are decommissioned: but their database access often remains.

```sql
-- Find users who have not logged in for 90 days
SELECT usename, valuntil
FROM pg_user
WHERE valuntil < NOW() - INTERVAL '90 days'
   OR valuntil IS NULL;

-- Find users with privileges on tables they should not access
SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE grantee NOT IN ('postgres', 'db_admin')
  AND table_name LIKE 'sensitive_%';

-- List all roles and their privileges
SELECT
    r.rolname,
    r.rolsuper,
    r.rolcreaterole,
    r.rolcreatedb,
    ARRAY(
        SELECT b.rolname
        FROM pg_catalog.pg_auth_members m
        JOIN pg_catalog.pg_roles b ON m.roleid = b.oid
        WHERE m.member = r.oid
    ) AS member_of
FROM pg_catalog.pg_roles r
WHERE r.rolname !~ '^pg_'
ORDER BY r.rolname;
```

**Automated Deprovisioning:**

When an employee leaves the company, their database access should be revoked immediately. Automate this by integrating with your identity provider:

```python
# Example: revoke database access when employee is deactivated in HR system
def on_employee_deactivated(employee_id):
    # Get database username from employee mapping
    db_user = get_db_user(employee_id)

    # Revoke all privileges
    db.execute(f"REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM {db_user}")
    db.execute(f"REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM {db_user}")
    db.execute(f"REVOKE CONNECT ON DATABASE myapp FROM {db_user}")
    db.execute(f"DROP USER IF EXISTS {db_user}")

    # Log the action
    log_security_event("access_revoked", employee_id, db_user)
```

## Audit Logging

Audit logging records who accessed what data and when. It is essential for compliance (PCI DSS, HIPAA, SOC 2) and for forensic analysis after a security incident.

**PostgreSQL Audit with pgAudit:**

```sql
-- Install pgAudit extension
-- In postgresql.conf:
-- shared_preload_libraries = 'pgaudit'
-- pgaudit.log = 'write, ddl, role'

-- Configure granular auditing
ALTER SYSTEM SET pgaudit.log = 'read, write, ddl, role, misc';
ALTER SYSTEM SET pgaudit.log_catalog = on;
ALTER SYSTEM SET pgaudit.log_level = 'log';
ALTER SYSTEM SET pgaudit.log_parameter = on;
ALTER SYSTEM SET pgaudit.log_statement_once = off;

-- Restart PostgreSQL after changing shared_preload_libraries
SELECT pg_reload_conf();

-- Test auditing
CREATE TABLE test_audit (id SERIAL PRIMARY KEY, data TEXT);
INSERT INTO test_audit (data) VALUES ('test');
SELECT * FROM test_audit;
DROP TABLE test_audit;
```

The pgAudit logs appear in the PostgreSQL server log:

```
LOG:  AUDIT: SESSION,1,1,WRITE,INSERT,,,"INSERT INTO test_audit (data) VALUES ('test');",<none>
LOG:  AUDIT: SESSION,1,1,READ,SELECT,,,"SELECT * FROM test_audit;",<none>
LOG:  AUDIT: SESSION,1,1,WRITE,DELETE,,,"DROP TABLE test_audit;",<none>
```

**MySQL Audit with Audit Log Plugin:**

```ini
# my.cnf
[mysqld]
audit_log_format = JSON
audit_log_policy = ALL
audit_log_file = /var/log/mysql/audit.log
audit_log_rotate_on_size = 104857600  # 100MB
audit_log_rotations = 10
```

```sql
-- Enable audit logging
SET GLOBAL audit_log_policy = 'ALL';
SET GLOBAL audit_log_format = 'JSON';

-- Verify it is working
SHOW VARIABLES LIKE 'audit_log%';
```

**Application-Level Audit Logging:**

Database-level audit logging captures all database operations, but it does not capture the application context (which user performed the action, from what IP address). Application-level audit logging adds this context:

```sql
-- Audit log table
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    action VARCHAR(20) NOT NULL,  -- INSERT, UPDATE, DELETE, LOGIN, LOGOUT
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- Trigger-based audit logging
CREATE FUNCTION audit_changes() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, new_values, ip_address)
        VALUES (
            current_setting('app.current_user_id')::UUID,
            'INSERT',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(NEW),
            inet(current_setting('app.client_ip'))
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values, ip_address)
        VALUES (
            current_setting('app.current_user_id')::UUID,
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW),
            inet(current_setting('app.client_ip'))
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, ip_address)
        VALUES (
            current_setting('app.current_user_id')::UUID,
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD),
            inet(current_setting('app.client_ip'))
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to sensitive tables
CREATE TRIGGER audit_employees
    AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION audit_changes();

CREATE TRIGGER audit_orders
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_changes();
```

**Querying Audit Logs:**

```sql
-- Find all changes to a specific employee
SELECT * FROM audit_log
WHERE table_name = 'employees' AND record_id = 'employee-uuid-here'
ORDER BY created_at DESC;

-- Find all actions by a specific user in the last 24 hours
SELECT * FROM audit_log
WHERE user_id = 'user-uuid-here'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Find all DELETE operations (potential data destruction)
SELECT * FROM audit_log
WHERE action = 'DELETE'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Find who modified a specific order
SELECT al.*, u.username
FROM audit_log al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.table_name = 'orders' AND al.record_id = 'order-uuid-here'
ORDER BY al.created_at DESC;
```

## Real Scenario: Implementing RBAC for a Multi-Tenant Application

You are building access control for a SaaS platform where multiple companies (tenants) use the same database. Each tenant has their own data, and different users within a tenant have different permission levels. The requirement: strict tenant isolation, role-based access within each tenant, and complete audit trail.

**Database Schema for RBAC:**

```sql
-- Tenants
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (belong to one tenant)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, username),
    UNIQUE(tenant_id, email)
);

-- Roles (defined per tenant or globally)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,  -- NULL for global roles
    name TEXT NOT NULL,
    description TEXT,
    UNIQUE(tenant_id, name)
);

-- Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource TEXT NOT NULL,  -- 'orders', 'products', 'reports'
    action TEXT NOT NULL,    -- 'read', 'write', 'delete', 'admin'
    description TEXT,
    UNIQUE(resource, action)
);

-- Role-Permission mapping
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id),
    permission_id UUID REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

-- User-Role mapping
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);
```

**Creating Default Roles and Permissions:**

```sql
-- Insert permissions
INSERT INTO permissions (resource, action, description) VALUES
    ('orders', 'read', 'View orders'),
    ('orders', 'write', 'Create and edit orders'),
    ('orders', 'delete', 'Delete orders'),
    ('products', 'read', 'View products'),
    ('products', 'write', 'Create and edit products'),
    ('reports', 'read', 'View reports'),
    ('users', 'manage', 'Manage users and roles');

-- Create global roles
INSERT INTO roles (tenant_id, name, description) VALUES
    (NULL, 'viewer', 'Read-only access to orders and products'),
    (NULL, 'editor', 'Read and write access to orders and products'),
    (NULL, 'admin', 'Full access including user management');

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON (
    (r.name = 'viewer' AND p.resource IN ('orders', 'products') AND p.action = 'read')
    OR (r.name = 'editor' AND p.resource IN ('orders', 'products') AND p.action IN ('read', 'write'))
    OR (r.name = 'admin')
)
WHERE r.tenant_id IS NULL;
```

**Row-Level Security Implementation:**

```sql
-- Apply RLS to all tenant-specific tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_users ON users
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation_orders ON orders
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation_products ON products
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

**Permission Checking Function:**

```sql
CREATE FUNCTION has_permission(p_resource TEXT, p_action TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = current_setting('app.current_user_id')::UUID
          AND p.resource = p_resource
          AND p.action = p_action
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Use in application queries
-- Check permission before executing
SELECT has_permission('orders', 'write');  -- Returns true or false
```

**Application Middleware:**

```python
# Python/Flask middleware for RBAC
from functools import wraps
from flask import request, g, abort

def require_permission(resource, action):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Set tenant context from JWT or session
            tenant_id = get_tenant_from_token(request)
            user_id = get_user_from_token(request)

            g.db.execute("SET app.current_tenant = %s", (tenant_id,))
            g.db.execute("SET app.current_user_id = %s", (user_id,))
            g.db.execute("SET app.client_ip = %s", (request.remote_addr,))

            # Check permission
            result = g.db.execute(
                "SELECT has_permission(%s, %s)",
                (resource, action)
            ).fetchone()

            if not result[0]:
                abort(403, 'Insufficient permissions')

            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Usage
@app.route('/api/orders', methods=['POST'])
@require_permission('orders', 'write')
def create_order():
    # User has been verified to have orders:write permission
    order_data = request.get_json()
    # Create order...
```

**Audit Trail for Compliance:**

```sql
-- Enable audit logging for the multi-tenant database
ALTER SYSTEM SET pgaudit.log = 'write, ddl, role';
ALTER SYSTEM SET pgaudit.log_parameter = on;
SELECT pg_reload_conf();

-- Application-level audit trigger
CREATE TRIGGER audit_orders
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_changes();
```

This RBAC implementation provides:
- Tenant isolation through row-level security (database-enforced, not application-dependent)
- Role-based permissions (flexible, manageable, auditable)
- Complete audit trail (who changed what, when, from where)
- Permission checking at the database level (defense in depth beyond application checks)

## Assessment

**Lab Tasks:**

1. Create a PostgreSQL database with 3 roles: db_reader, db_writer, db_admin. Create 4 users and assign them to roles. Test that each user can only perform the operations allowed by their role. Document the privilege escalation path from reader to admin. Time limit: 30 minutes.

2. Implement row-level security on a table with a tenant_id column. Create policies for SELECT, INSERT, UPDATE, and DELETE. Test that users can only see and modify their own tenant's data. Verify that a user cannot bypass RLS by using a subquery or CTE. Time limit: 45 minutes.

3. Implement column-level masking for a sensitive column (SSN or credit card number). Create a view that masks the column for non-privileged users. Test with two different user roles and verify the masking works correctly. Time limit: 30 minutes.

4. Set up audit logging using pgAudit or a custom trigger. Perform a series of operations (INSERT, UPDATE, DELETE) and verify they appear in the audit log. Write a query that retrieves the full audit history for a specific record. Time limit: 45 minutes.

**Grading Criteria:**
- Role setup (20%): Roles created correctly, users assigned to appropriate roles, privilege escalation tested
- Row-level security (30%): RLS policies work correctly, tenant isolation is enforced, bypass attempts fail
- Column-level masking (20%): Masking view works correctly for different roles
- Audit logging (30%): Audit log captures all operations, query retrieves complete history, application context is recorded

**Evidence:**
- SQL scripts for role creation and assignment
- RLS test results showing tenant isolation
- View definitions with masking logic
- Audit log entries with query for history retrieval
