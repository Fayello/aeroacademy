# Module 5 — Access Control (IDOR)

**Course:** Web Application Security | **Path:** Web App Security (5 of 10)

---

## What You'll Actually Do

You'll exploit Insecure Direct Object References (IDOR) — accessing other users' data by changing an ID in the URL.

---

## IDOR — The Basics

```text
GET /api/users/123/profile → Alice's profile
GET /api/users/124/profile → Bob's profile (if you change the ID)
```

**Variations:**
```text
URL parameter: /api/files?id=report.pdf
Body parameter: {"user_id": 123}
Header: X-User-Id: 123
Cookie: user_id=123
```

---

## Finding IDOR

```text
1. Find endpoints that use IDs
2. Change the ID to another user's ID
3. If you see their data → IDOR
4. Try different ID types: numeric, UUID, encoded
```

**Automated:**
```bash
#Autorize (Burp extension)
# Compare responses between authenticated and unauthorized users
```

---

## Privilege Escalation

```text
Horizontal: Access another user's data (user → user)
Vertical: Access admin functions (user → admin)

GET /api/admin/users → 403 Forbidden
GET /api/admin/users → 200 OK (if access control is missing)
```

---

## Prevention

```python
# Check ownership
@app.route("/api/files/<file_id>")
def get_file(file_id):
    file = File.query.get(file_id)
    if file.owner_id != current_user.id:
        abort(403)
    return send_file(file.path)

# Use indirect references
@app.route("/api/files/<ref>")
def get_file(ref):
    file_id = decrypt_ref(ref)  # not user-controlled
    file = File.query.get(file_id)
    ...
```

---

## Assessment

**Lab task (20 min):**

1. Find IDOR in a test application
2. Access another user's data
3. Escalate from user to admin
4. Fix each vulnerability

**Grading:**
- IDOR found: 25%
- Data accessed: 25%
- Privilege escalation: 25%
- Fixes correct: 25%

---

## Evidence

- **OutcomeEvidence:** `WAS-LO5 — Access Control`
