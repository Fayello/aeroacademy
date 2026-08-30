# Module 6 — Database Access Control: Roles, Permissions, Row-Level Security

## What You'll Actually Do

Design and implement a role-based access control system in PostgreSQL. You'll create roles with specific permissions, set up row-level security so users only see their own data, and audit who accessed what.

## Content

### Role Hierarchy

PostgreSQL doesn't have "users" and "groups" separately — everything is a role. A role that can log in is effectively a user.

```sql
-- Create roles
CREATE ROLE db_admin;
CREATE ROLE db_instructor;
CREATE ROLE db_student;
CREATE ROLE db_analyst;

-- Roles that can log in
ALTER ROLE db_admin LOGIN PASSWORD 'adminpass';
ALTER ROLE db_instructor LOGIN PASSWORD 'instructorpass';
ALTER ROLE db_student LOGIN PASSWORD 'studentpass';
ALTER ROLE db_analyst LOGIN PASSWORD 'analystpass';
```

### Permission Model

```sql
-- Admin: full access
GRANT ALL PRIVILEGES ON DATABASE aeroacademy TO db_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO db_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO db_admin;

-- Instructor: can read all data, modify student submissions
GRANT CONNECT ON DATABASE aeroacademy TO db_instructor;
GRANT SELECT ON users, courses, labs TO db_instructor;
GRANT SELECT, INSERT, UPDATE ON submissions TO db_instructor;

-- Student: can only read courses/labs, submit their own work
GRANT CONNECT ON DATABASE aeroacademy TO db_student;
GRANT SELECT ON courses, labs TO db_student;
GRANT INSERT ON submissions TO db_student;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO db_student;

-- Analyst: read-only access to all tables
GRANT CONNECT ON DATABASE aeroacademy TO db_analyst;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO db_analyst;
```

### Row-Level Security (RLS)

RLS ensures users can only see rows they own. This is enforced at the database level — even if your application has a bug, the database blocks unauthorized access.

```sql
-- Enable RLS on the submissions table
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Students can only see their own submissions
CREATE POLICY student_submissions_policy ON submissions
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::int);

-- Instructors can see all submissions
CREATE POLICY instructor_submissions_policy ON submissions
  FOR SELECT
  TO db_instructor
  USING (true);

-- Test it: set the current user context
SET app.current_user_id = '42';

-- This only returns submissions where user_id = 42
SELECT * FROM submissions;

-- Students can insert but only for themselves
CREATE POLICY student_insert_policy ON submissions
  FOR INSERT
  TO db_student
  WITH CHECK (user_id = current_setting('app.current_user_id')::int);

-- Students cannot update or delete other students' submissions
CREATE POLICY student_no_update_policy ON submissions
  FOR UPDATE
  TO db_student
  USING (user_id = current_setting('app.current_user_id')::int)
  WITH CHECK (user_id = current_setting('app.current_user_id')::int);
```

### Application Integration

Your application sets the user context on each connection:

```python
import psycopg2

def get_db_connection(user_id):
    conn = psycopg2.connect("dbname=aeroacademy user=appuser")
    cur = conn.cursor()
    # Set the user context — RLS policies use this
    cur.execute("SET app.current_user_id = %s", (str(user_id),))
    return conn

# Now any query through this connection is filtered by RLS
def get_my_submissions(user_id):
    conn = get_db_connection(user_id)
    cur = conn.cursor()
    cur.execute("SELECT * FROM submissions")  -- No WHERE needed, RLS handles it
    return cur.fetchall()
```

### Schema-Level Separation

Use schemas to organize permissions:

```sql
-- Create schemas for different access levels
CREATE SCHEMA student_data;
CREATE SCHEMA analytics;
CREATE SCHEMA admin_only;

-- Move tables to appropriate schemas
ALTER TABLE submissions SET SCHEMA student_data;
ALTER TABLE audit_log SET SCHEMA admin_only;

-- Grant schema usage
GRANT USAGE ON SCHEMA student_data TO db_student;
GRANT USAGE ON SCHEMA analytics TO db_analyst;
GRANT USAGE ON SCHEMA admin_only TO db_admin;

-- Default privileges for new objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO db_analyst;
```

### Auditing Access

Create an audit log table:

```sql
CREATE TABLE admin_only.audit_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_name TEXT DEFAULT current_user,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    old_data JSONB,
    new_data JSONB
);

-- Trigger function to log changes
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO admin_only.audit_log (table_name, operation, new_data)
        VALUES (TG_TABLE_NAME, 'INSERT', to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO admin_only.audit_log (table_name, operation, old_data, new_data)
        VALUES (TG_TABLE_NAME, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO admin_only.audit_log (table_name, operation, old_data)
        VALUES (TG_TABLE_NAME, 'DELETE', to_jsonb(OLD));
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_audit
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION log_changes();
```

Query the audit log:

```sql
SELECT * FROM admin_only.audit_log
WHERE table_name = 'users'
ORDER BY changed_at DESC
LIMIT 20;
```

### Column-Level Privileges

Sometimes you need to hide specific columns:

```sql
-- Hide password_hash from non-admins
REVOKE ALL ON users FROM db_analyst;
GRANT SELECT (id, username, email, role, created_at) ON users TO db_analyst;

-- Analyst can read user data but not password hashes
SELECT id, username, email FROM users;  -- Works
SELECT password_hash FROM users;        -- Permission denied
```

## Assessment

**Lab task — 55 minutes**

1. Create four roles: `app_admin`, `app_instructor`, `app_student`, `app_analyst` with appropriate login credentials.
2. Create tables: `users`, `courses`, `submissions` with realistic data (at least 15 rows in `submissions`).
3. Configure row-level security on `submissions` so students only see their own rows.
4. Enable RLS and test: connect as `app_student` (set the user context), verify only that user's submissions appear.
5. Set up column-level permissions so `app_analyst` can query `users` but not see `password_hash`.
6. Create the audit trigger on `users` and perform an INSERT, UPDATE, and DELETE. Verify all three operations appear in the audit log.
7. Demonstrate that `app_student` cannot read `admin_only.audit_log`.

**Grading criteria:**
- Four roles created with correct login settings (15 points)
- Tables created with realistic data (10 points)
- RLS policy works correctly (25 points)
- Column-level permissions enforced (15 points)
- Audit trigger captures all three operations (20 points)
- Schema-level access control verified (15 points)

## Evidence

- `psql` session showing each role's permitted and denied operations
- RLS test showing filtered results for different users
- `\dp` output showing column-level grants
- Audit log contents after INSERT, UPDATE, DELETE
