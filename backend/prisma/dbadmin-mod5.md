# Module 5 — SQL Injection Deep Dive: Exploitation and Prevention

## What You'll Actually Do

Exploit SQL injection vulnerabilities in a controlled lab environment, then fix them. You'll see firsthand how parameterized queries, input validation, and least-privilege database users prevent catastrophic breaches.

## Content

### How SQL Injection Works

SQL injection happens when user input is concatenated directly into a query string. The database can't tell the difference between data and code.

**Vulnerable code example (Python + psycopg2):**

```python
# NEVER DO THIS
import psycopg2

def get_user(username):
    conn = psycopg2.connect("dbname=aeroacademy user=appuser")
    cur = conn.cursor()
    query = "SELECT * FROM users WHERE username = '" + username + "'"
    cur.execute(query)
    return cur.fetchall()
```

If `username` is `admin' --`, the query becomes:

```sql
SELECT * FROM users WHERE username = 'admin' --'
```

The `--` comments out the rest. You just bypassed authentication.

### Exploitation Techniques

**Authentication bypass:**

```
Input: ' OR '1'='1' --
Resulting query: SELECT * FROM users WHERE username = '' OR '1'='1' --'
```

**UNION-based injection (extract data from other tables):**

```
Input: ' UNION SELECT email, password_hash, NULL FROM admins --
```

This works when the original query returns columns that match the UNION.

**Blind SQL injection (no visible output):**

```
Input: ' AND (SELECT LENGTH(password_hash) FROM users WHERE username='admin') = 60 --
```

If the page loads normally, the condition is true. You can extract data character by character.

**Time-based blind injection:**

```sql
-- PostgreSQL
' AND (SELECT CASE WHEN (SELECT password_hash FROM users WHERE username='admin') LIKE 'a%' THEN pg_sleep(5) ELSE pg_sleep(0) END) = pg_sleep(5) --
```

If the page takes 5 seconds, the first character is 'a'. Repeat for each character.

### Setting Up the Vulnerable Lab

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'student'
);

CREATE TABLE secret_flags (
    id SERIAL PRIMARY KEY,
    flag_value VARCHAR(100) NOT NULL
);

INSERT INTO users (username, password_hash, email, role) VALUES
('admin', 'fakehash123', 'admin@corp.com', 'admin'),
('student1', 'fakehash456', 's1@corp.com', 'student');

INSERT INTO secret_flags (flag_value) VALUES ('FLAG{sql_injection_is_real}');
```

### Prevention: Parameterized Queries

The fix is always the same: never concatenate user input into SQL.

**Python (psycopg2):**

```python
def get_user(username):
    conn = psycopg2.connect("dbname=aeroacademy user=appuser")
    cur = conn.cursor()
    # Use %s placeholders — the driver handles escaping
    cur.execute("SELECT * FROM users WHERE username = %s", (username,))
    return cur.fetchall()
```

**Node.js (pg library):**

```javascript
// NEVER: `SELECT * FROM users WHERE username = '${username}'`
// ALWAYS:
const result = await pool.query(
  'SELECT * FROM users WHERE username = $1',
  [username]
);
```

**Java (PreparedStatement):**

```java
// NEVER: Statement stmt = conn.createStatement();
//         stmt.executeQuery("SELECT * FROM users WHERE username = '" + input + "'");

// ALWAYS:
PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE username = ?");
ps.setString(1, username);
ResultSet rs = ps.executeQuery();
```

### Defense in Depth

**1. Stored procedures (limited help — only if they use parameterized inputs internally):**

```sql
CREATE OR REPLACE FUNCTION get_user(p_username VARCHAR)
RETURNS SETOF users AS $$
BEGIN
    RETURN QUERY SELECT * FROM users WHERE users.username = p_username;
END;
$$ LANGUAGE plpgsql;
```

**2. Input validation (allowlist expected patterns):**

```python
import re

def validate_username(username):
    if not re.match(r'^[a-zA-Z0-9_]{3,30}$', username):
        raise ValueError("Invalid username")
    return username
```

**3. Least-privilege database user:**

```sql
-- App user should NOT be able to DROP tables or read other schemas
REVOKE ALL ON SCHEMA public FROM appuser;
GRANT SELECT, INSERT, UPDATE ON users TO appuser;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO appuser;
-- Do NOT grant:
-- GRANT ALL PRIVILEGES ON ALL TABLES
```

**4. Web Application Firewall (WAF) rules** as an additional layer, not a replacement for parameterized queries.

### Testing Your Fixes

After applying parameterized queries, test with common injection payloads:

```
' OR '1'='1
' UNION SELECT NULL --
'; DROP TABLE users; --
admin'/*
```

If any of these cause errors, unexpected data, or changed behavior, the vulnerability is still present.

## Assessment

**Lab task — 60 minutes**

1. Set up a PostgreSQL database with a `users` table and a `products` table (include a `secret_flag` column with a planted flag).
2. Write a vulnerable Python or Node.js script that queries the `users` table by concatenating input.
3. Exploit the script to:
   - Bypass authentication and log in as admin
   - Extract the flag from the `products` table using UNION injection
   - Perform a time-based blind injection to extract a password hash character by character (first 5 characters is enough)
4. Rewrite the script using parameterized queries.
5. Repeat all three attacks against the fixed version and confirm they fail.
6. Create a read-only database user for the app and verify the fix still works with restricted privileges.

**Grading criteria:**
- Vulnerable app works with SQL injection (20 points)
- Authentication bypass demonstrated (15 points)
- UNION injection extracts flag (15 points)
- Blind injection extracts at least 5 characters (15 points)
- Fixed app resists all three attack types (20 points)
- Least-privilege user configured and tested (15 points)

## Evidence

- Source code of vulnerable and fixed versions
- Terminal output showing successful exploitation
- Terminal output showing blocked exploitation after fix
- Database user privilege verification (`\dp` in psql)
