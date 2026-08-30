# Module 4 — Authentication and Session Attacks

**Course:** Web Application Security | **Path:** Web App Security (4 of 10)

---

## What You'll Actually Do

You'll attack authentication mechanisms — brute force, credential stuffing, session hijacking, JWT flaws. Then you'll fix them.

---

## Brute Force

```bash
# Hydra
hydra -l admin -P wordlist.txt http-post-form "/login:user=^USER^&pass=^PASS^:Invalid credentials"

# Rate limiting bypass
# Try different IPs, headers, or slow down
```

**Prevention:** Rate limiting, account lockout, CAPTCHA, MFA

---

## Credential Stuffing

```text
Attacker takes leaked username/password combos from other breaches
Tries them on your site
People reuse passwords → works more often than you'd think
```

**Prevention:** Check passwords against breach databases (HaveIBeenPwned API), enforce MFA

---

## Session Hijacking

```text
1. Steal session cookie (via XSS or network sniffing)
2. Use cookie to access account
3. No password needed
```

**Prevention:** HttpOnly, Secure, SameSite cookies; regenerate session on login; short session expiry

---

## JWT Vulnerabilities

```text
# None algorithm attack
{"alg":"none","typ":"JWT"}.
eyJ1c2VyIjoiYWRtaW4ifQ.

# If server accepts "none" → no signature verification → bypass auth

# Weak secret
# If JWT secret is "secret" → crack it → forge tokens

# Confusion attack
# Use public key as HMAC secret
```

**Prevention:**
```text
- Never use "none" algorithm
- Use strong, random secrets
- Validate algorithm on server
- Don't trust client-side algorithm choice
```

---

## Assessment

**Lab task (25 min):**

1. Perform a brute force attack on a login form
2. Test for credential stuffing
3. Hijack a session via XSS
4. Exploit a JWT with "none" algorithm
5. Fix each vulnerability

**Grading:**
- Brute force attempted: 15%
- Credential stuffing tested: 15%
- Session hijacked: 25%
- JWT exploited: 25%
- Fixes correct: 20%

---

## Evidence

- **OutcomeEvidence:** `WAS-LO4 — Authentication Attacks`
