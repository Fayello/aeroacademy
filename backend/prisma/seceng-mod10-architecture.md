# Module 10 — Security Architecture

**Course:** Security Engineering | **Path:** Security Engineering (10 of 10)

---

## What You'll Actually Do

You'll design a secure system from scratch. Not add security to an existing system — build it in from the start. You'll apply everything from the previous modules into a coherent architecture.

---

## Secure Architecture Checklist

```text
Network:
  - Segmentation (DMZ, internal, database tiers)
  - Firewall rules (default deny)
  - TLS everywhere
  - No direct internet access to databases

Application:
  - Input validation at every entry point
  - Parameterized queries
  - Output encoding
  - Error handling (no info leakage)
  - Logging (security events)

Data:
  - Encryption at rest
  - Encryption in transit
  - Key management
  - Backup and recovery
  - Data classification

Identity:
  - MFA for admin access
  - RBAC/ABAC
  - Session management
  - Password policy (NIST 800-63B)

Infrastructure:
  - Hardened OS (CIS benchmarks)
  - Minimal attack surface
  - Automated patching
  - Container security (non-root, read-only, seccomp)
```

---

## Network Segmentation

```text
Internet → [WAF] → [Load Balancer] → [DMZ: Web Servers]
                                        ↓
                                   [Firewall]
                                        ↓
                                   [App Tier: API Servers]
                                        ↓
                                   [Firewall]
                                        ↓
                                   [Data Tier: Databases]
```

Each tier is a separate network segment. Traffic between tiers is controlled by firewalls.

---

## Zero Trust Architecture

```text
Never trust, always verify:
- Every request authenticated and authorized
- Micro-segmentation
- Least privilege access
- Continuous verification
- Encrypted communication everywhere
```

---

## Real Task: Design a Secure System

```text
Requirements:
- Web application serving 10k users
- User registration, login, profile management
- Payment processing
- Admin dashboard

Design:
1. Network: 3-tier architecture with firewalls
2. Auth: MFA, argon2 passwords, session management
3. API: Input validation, rate limiting, CORS
4. Database: Encrypted at rest, parameterized queries
5. Payments: PCI DSS compliant, tokenized card data
6. Monitoring: SIEM, alerting, audit logs
7. Incident response: Documented playbook
```

---

## Assessment

**Lab task (30 min):**

1. Design a secure architecture for a given application
2. Apply all security principles from the course
3. Document the architecture with diagrams
4. Identify and mitigate threats
5. Present the design

**Grading:**
- Architecture complete: 25%
- Security principles applied: 25%
- Threats identified and mitigated: 25%
- Documentation clear: 15%
- Presentation coherent: 10%

---

## Evidence

- **OutcomeEvidence:** `SEC-LO10 — Security Architecture` — final competency for Security Engineering

---

## Course Complete

You can now:
- Think about security systematically
- Threat model applications
- Apply secure design principles
- Review code for vulnerabilities
- Automate security testing
- Implement authentication and authorization
- Use cryptography correctly
- Respond to incidents
- Manage vulnerabilities
- Design secure systems
