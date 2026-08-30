# Module 4 — Secure Code Review

**Course:** Security Engineering | **Path:** Security Engineering (4 of 10)

---

## What You'll Actually Do

You're reviewing a pull request. You need to find the vulnerability before it ships. You'll learn what to look for, how to spot injection flaws, and how to read code with an attacker's mindset.

---

## What to Look For

**Input validation:** Does the code validate all external input?
**Output encoding:** Is output encoded before rendering?
**Authentication:** Are credentials handled securely?
**Authorization:** Are permissions checked on every request?
**Data protection:** Is sensitive data encrypted/hashed?
**Error handling:** Do errors leak information?
**Logging:** Are security events logged?

---

## Common Vulnerabilities in Code

**SQL Injection:**
```python
# Bad
query = f"SELECT * FROM users WHERE id = {user_id}"

# Good
query = "SELECT * FROM users WHERE id = %s"
cursor.execute(query, (user_id,))
```

**Cross-Site Scripting (XSS):**
```javascript
// Bad
element.innerHTML = userInput;

// Good
element.textContent = userInput;
```

**Path Traversal:**
```python
# Bad
with open(f"/data/{user_input}") as f:

# Good
import os
safe_path = os.path.join("/data", os.path.basename(user_input))
with open(safe_path) as f:
```

**Hardcoded Secrets:**
```python
# Bad
DB_PASSWORD = "s3cret123"

# Good
DB_PASSWORD = os.environ["DB_PASSWORD"]
```

---

## Review Process

```text
1. Understand the change — what does it do?
2. Identify entry points — where does data come in?
3. Trace data flow — where does data go?
4. Check each entry point against OWASP Top 10
5. Look for patterns that indicate vulnerability
6. Document findings with severity and fix
```

---

## Real Task: Review a PR

```python
@app.route("/api/users/<user_id>")
def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    result = db.execute(query)
    return jsonify(result)
```

**Findings:**
1. SQL injection (critical) — user_id is directly interpolated
2. No authentication check (high) — anyone can query any user
3. No input validation (medium) — user_id could be anything
4. Full user object returned (medium) — may include password hash

---

## Assessment

**Lab task (25 min):**

1. Review a code sample and identify 3 vulnerabilities
2. Write a secure version of each vulnerable code
3. Create a code review checklist
4. Document findings with severity and remediation

**Grading:**
- Vulnerabilities found: 30%
- Fixes correct: 30%
- Checklist comprehensive: 20%
- Documentation clear: 20%

---

## Evidence

- **OutcomeEvidence:** `SEC-LO4 — Secure Code Review`
