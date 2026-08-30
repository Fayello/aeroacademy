# Module 6 — Authentication and Authorization

**Course:** Security Engineering | **Path:** Security Engineering (6 of 10)

---

## What You'll Actually Do

You'll implement authentication and authorization correctly. Not just "add a login form" — proper password hashing, session management, MFA, and role-based access control.

---

## Authentication — Proving Identity

**Password storage:**
```python
# Bad
password = "s3cret123"  # plaintext
hash = md5(password)    # weak hash
hash = sha256(password) # unsalted

# Good
from argon2 import PasswordHasher
ph = PasswordHasher()
hash = ph.hash(password)  # argon2id with salt
```

**Password policy:**
```text
Minimum 12 characters (NIST SP 800-63B)
No complexity rules (they don't help)
Check against breached password databases
Rate limit login attempts
```

**MFA:**
```text
Best: FIDO2/WebAuthn (hardware keys)
Good: TOTP (Google Authenticator)
OK: SMS (vulnerable to SIM swapping)
Bad: Email (compromised email = compromised account)
```

---

## Session Management

```python
# Session tokens
- Generate cryptographically random tokens (32+ bytes)
- Store server-side, not in JWT claims for sensitive operations
- Set expiration (15 min for access tokens, 7 days for refresh)
- Invalidate on logout
- Regenerate on privilege change
```

**JWT pitfalls:**
```text
Don't store sensitive data in JWT claims (they're readable)
Don't use "none" algorithm
Validate signature on every request
Check expiration
```

---

## Authorization — RBAC and ABAC

**Role-Based Access Control (RBAC):**
```text
User → Role → Permission

alice → admin → user:read, user:write, user:delete
bob   → editor → user:read, user:write
charlie → viewer → user:read
```

**Attribute-Based Access Control (ABAC):**
```text
Allow if:
  user.department == resource.department
  AND user.clearance >= resource.classification
  AND time.hour >= 9 AND time.hour <= 17
```

---

## OWASP ASVS — Verification Standard

The Application Security Verification Standard provides a checklist:

```text
V2.1: Password Security
V2.2: General Authentication
V3.1: Access Control
V3.4: Data-Level Access Control
```

---

## Real Task: Implement Secure Auth

```python
from argon2 import PasswordHasher
import secrets

# Password hashing
ph = PasswordHasher()
stored_hash = ph.hash(password)

# Verify
try:
    ph.verify(stored_hash, input_password)
except VerifyMismatchError:
    # Wrong password
    pass

# Session
session_token = secrets.token_urlsafe(32)
# Store in httpOnly, secure, sameSite cookie

# RBAC
def check_permission(user, resource, action):
    role = user.role
    if role == "admin":
        return True
    if role == "editor" and action in ["read", "write"]:
        return True
    if role == "viewer" and action == "read":
        return True
    return False
```

---

## Assessment

**Lab task (25 min):**

1. Hash a password with argon2 and verify it
2. Implement session management with secure cookies
3. Build RBAC for a simple API
4. Test for authentication bypass vulnerabilities
5. Implement rate limiting on login

**Grading:**
- Password hashing correct: 20%
- Session management secure: 25%
- RBAC working: 25%
- Bypass tested: 15%
- Rate limiting: 15%

---

## Evidence

- **OutcomeEvidence:** `SEC-LO6 — Authentication & Authorization`
