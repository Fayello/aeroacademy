# Module 2 — Threat Modeling

**Course:** Security Engineering | **Path:** Security Engineering (2 of 10)

---

## What You'll Actually Do

You're given a new API to review. You need to figure out how an attacker might break it before it ships. You'll use STRIDE, draw data flow diagrams, and find the weaknesses.

---

## STRIDE — Six Categories of Threat

| Category | Threat | Question |
|----------|--------|----------|
| **S**poofing | Identity | Can someone pretend to be someone else? |
| **T**ampering | Integrity | Can someone modify data they shouldn't? |
| **R**epudiation | Non-repudiation | Can someone deny doing something? |
| **I**nformation disclosure | Confidentiality | Can someone see data they shouldn't? |
| **D**enial of service | Availability | Can someone make the system unavailable? |
| **E**levation of privilege | Authorization | Can someone do more than they should? |

**Walk through every component, every data flow, and ask all six questions.**

---

## Data Flow Diagrams

Draw the system as boxes and arrows:

```
User → [API Gateway] → [App Server] → [Database]
                      ↓
                [Message Queue] → [Worker] → [External API]
```

For each arrow (data flow):
- Is it authenticated?
- Is it encrypted?
- What happens if it's intercepted?
- What happens if it's modified?

For each box (process):
- What input does it take?
- What output does it produce?
- Who can access it?
- What happens if it crashes?

---

## STRIDE in Practice

```text
Component: User Login API
Flow: User → POST /login → API Server

S: Can someone log in as another user? → Password brute force
T: Can the login request be modified in transit? → No, HTTPS
R: Can someone deny attempting login? → Need audit logs
I: Is the password visible in transit? → No, HTTPS
D: Can someone flood /login? → Rate limiting needed
E: Can a low-privilege user become admin? → Need role check
```

---

## Prioritizing Threats

Not all threats are equal. Use DREAD or just ask:

1. **How likely is this?** (based on attacker motivation and capability)
2. **How bad would it be?** (data loss, downtime, reputation)
3. **How hard is it to fix?** (effort vs impact)

Fix the high-impact, high-likelihood, easy-to-fix issues first.

---

## Real Task: Threat Model an API

```text
System: User management API (register, login, profile, password reset)

1. Draw data flow diagram
2. For each flow, apply STRIDE
3. Identify top 5 threats
4. For each threat, propose a mitigation
5. Document in a threat model report
```

**Example findings:**
- Password reset: spoofing (no identity verification) → mitigation: email link with time-limited token
- Profile update: tampering (no input validation) → mitigation: server-side validation, parameterized queries
- Login: brute force → mitigation: rate limiting, account lockout, CAPTCHA

---

## Assessment

**Lab task (25 min):**

1. Draw a data flow diagram for a given application
2. Apply STRIDE to each component and flow
3. Identify top 5 threats
4. Propose mitigations for each
5. Prioritize threats by risk

**Grading:**
- DFD correct: 20%
- STRIDE applied: 25%
- Threats realistic: 25%
- Mitigations actionable: 20%
- Prioritized correctly: 10%

---

## Evidence

- **OutcomeEvidence:** `SEC-LO2 — Threat Modeling`
