# Module 3 — Secure Design Principles

**Course:** Security Engineering | **Path:** Security Engineering (3 of 10)

---

## What You'll Actually Do

You're designing a new feature. You'll apply secure design principles to make sure it doesn't introduce vulnerabilities. Not retroactive security — built-in from the start.

---

## Principle of Least Privilege

Every component gets only what it needs. Nothing more.

```text
Bad: App connects to database as root
Good: App connects as app_user with SELECT/INSERT/UPDATE on specific tables only

Bad: Service account has admin access to everything
Good: Service account has access only to the specific S3 buckets it needs
```

---

## Separation of Duties

No single person or component should have all the power.

```text
Developer writes code → Reviewer approves → CI builds → Deployer deploys
No one person does all four.
```

---

## Defense in Depth

Layer controls so if one fails, the next catches it.

```text
Input validation → Parameterized queries → ORM → Database permissions → Encryption at rest
```

---

## Fail Securely

When something breaks, fail closed — not open.

```text
Bad: Authentication service is down → allow everyone in
Good: Authentication service is down → deny everyone

Bad: Can't check permissions → grant access
Good: Can't check permissions → deny access
```

---

## Economy of Mechanism

Keep it simple. Every line of code is a potential vulnerability.

```text
Bad: Custom encryption algorithm
Good: AES-256-GCM from a standard library

Bad: Hand-rolled session management
Good: Use established session library
```

---

## Complete Mediation

Check permissions every time. Don't cache authorization decisions.

```text
Bad: Check permissions at login, trust the session
Good: Check permissions on every request
```

---

## Open Design

Security shouldn't depend on secrecy of the implementation.

```text
Bad: Security relies on attacker not knowing your algorithm
Good: Security relies on the key being secret (Kerckhoffs's principle)
```

---

## Psychological Acceptability

Security shouldn't make the system unusable. If it does, people will work around it.

```text
Bad: 20-character passwords with special characters → people write them on sticky notes
Good: Passphrases + MFA → actually secure and usable
```

---

## Assessment

**Lab task (20 min):**

1. Given a system design, apply all 7 principles
2. Identify where each principle is violated
3. Propose fixes that respect each principle
4. Explain trade-offs between security and usability

**Grading:**
- All 7 principles applied: 40%
- Violations identified: 25%
- Fixes proposed: 25%
- Trade-offs explained: 10%

---

## Evidence

- **OutcomeEvidence:** `SEC-LO3 — Secure Design Principles`
