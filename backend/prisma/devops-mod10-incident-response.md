# Module 10 — Incident Response and SRE Practices

**Course:** DevOps & Platform Engineering | **Path:** DevOps (10 of 10)

---

## What You'll Actually Do

You'll respond to production incidents methodically. Not panic — process. Find the root cause, fix it, prevent it from happening again.

---

## Incident Response Process

```text
1. Detect    — Alert fires or user reports
2. Triage    — Severity, impact, who's affected
3. Mitigate  — Stop the bleeding (rollback, disable feature)
4. Investigate — Find root cause
5. Resolve   — Fix the issue
6. Review    — Post-mortem, prevent recurrence
```

---

## Severity Levels

```text
SEV1: Production down, data loss, security breach
  → Immediate response, all hands

SEV2: Major feature broken, significant user impact
  → Response within 1 hour

SEV3: Minor feature broken, workaround available
  → Response within 4 hours

SEV4: Cosmetic issue, no user impact
  → Next sprint
```

---

## Post-Mortem Template

```text
## Incident: [Title]
- Date: [Date]
- Duration: [How long]
- Impact: [Who/what affected]
- Root cause: [Why it happened]

## Timeline
- HH:MM — Alert fired
- HH:MM — Investigation started
- HH:MM — Root cause identified
- HH:MM — Fix deployed

## Action Items
- [ ] Fix: [What to do]
- [ ] Prevent: [How to prevent]
- [ ] Detect: [How to detect earlier]
```

---

## SRE Principles

**Error Budgets:**
```text
SLA: 99.9% uptime
Error budget: 0.1% = 43 minutes/month
If budget spent → no new features, focus on reliability
```

**Toil Reduction:**
```text
Toil = manual, repetitive, automatable work
Goal: reduce toil through automation
Measure: how much time spent on toil vs engineering
```

---

## Assessment

**Lab task (25 min):**

1. Respond to a simulated production incident
2. Follow the incident response process
3. Write a post-mortem
4. Identify action items
5. Propose automation to prevent recurrence

**Grading:**
- Process followed: 25%
- Incident triaged: 20%
- Root cause found: 20%
- Post-mortem written: 20%
- Action items proposed: 15%

---

## Evidence

- **OutcomeEvidence:** `DEV-LO10 — Incident Response` — final competency for DevOps & Platform Engineering

---

## Course Complete

You can now:
- Understand DevOps culture and principles
- Use Git effectively
- Build CI/CD pipelines
- Containerize with Docker
- Deploy multi-service apps with Docker Compose
- Manage workloads on Kubernetes
- Provision infrastructure with Terraform
- Configure servers with Ansible
- Monitor and observe systems
- Respond to production incidents
