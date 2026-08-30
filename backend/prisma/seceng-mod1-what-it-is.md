# Module 1 — Security Engineering: What It Actually Is

**Course:** Security Engineering | **Path:** Security Engineering (1 of 10)

---

## What You'll Actually Do

You'll learn what security engineering means in practice — not compliance checklists, but how to build systems that resist attack. You'll understand the difference between security theater and actual security.

---

## Security Engineering Is Not Compliance

Compliance says "you have a firewall." Security engineering asks "does the firewall actually protect what matters?"

Compliance is a checkbox. Security is a property of a system.

```text
Compliance: "We encrypt data at rest."
Security: "We encrypt PII with AES-256-GCM, keys in HSM, rotated quarterly, access logged."

Compliance: "We have MFA."
Security: "We have FIDO2 hardware keys for admin access, TOTP for regular users, backup codes stored offline."
```

---

## The Three Properties

Security engineering protects three things:

**Confidentiality** — Only authorized people see the data.
**Integrity** — Data hasn't been tampered with.
**Availability** — The system is there when you need it.

Every security decision maps to one or more of these. Encrypting a database = confidentiality. Signing a commit = integrity. Running in multiple data centers = availability.

---

## Threat Modeling — The Core Skill

Before you build anything, ask:

1. **What are we protecting?** (Assets)
2. **Who might attack us?** (Threat actors)
3. **How might they attack us?** (Attack vectors)
4. **What happens if they succeed?** (Impact)
5. **What do we do about it?** (Mitigations)

That's threat modeling. Everything else is implementation.

---

## Defense in Depth

No single control stops everything. Layer your defenses:

```
Perimeter → Network → Host → Application → Data
  WAF      Firewall   OS     Input validation  Encryption
  IDS      Segmentation  SELinux  Auth/AuthZ    Backup
```

If the attacker gets past the WAF, the firewall stops them. If they get past the firewall, SELinux limits them. If they get past SELinux, the database is encrypted.

---

## Security Is a Process, Not a Product

You don't "achieve" security. You maintain it. The moment you stop, attackers keep going.

```text
Design → Build → Deploy → Monitor → Patch → Repeat
```

Every new feature, every dependency, every config change is a potential new attack surface.

---

## Assessment

**Lab task (20 min):**

1. Given a web application, identify what you're protecting (assets)
2. Identify 3 potential threat actors and their motivations
3. Map attack vectors for each actor
4. Design a defense-in-depth strategy for a simple API
5. Explain the difference between compliance and security for a given control

**Grading:**
- Assets identified: 20%
- Threat actors mapped: 20%
- Attack vectors realistic: 20%
- Defense-in-depth designed: 25%
- Compliance vs security clear: 15%

---

## Evidence

- **OutcomeEvidence:** `SEC-LO1 — Security Engineering Fundamentals`
